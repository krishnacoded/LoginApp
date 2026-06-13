const { query, getClient } = require('../config/database');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');
const shiftService = require('./shift.service');
const attendanceRepository = require('../repositories/attendance.repository');

class RegularizationService {
  async apply(employeeId, data, userId, req) {
    const { attendanceId, date, requestType, requestedClockIn, requestedClockOut, reason } = data;

    // Check for existing pending request on the same date
    const { rows: pending } = await query(
      `SELECT id FROM attendance_regularizations 
       WHERE employee_id = $1 AND date = $2 AND status = 'pending'`,
      [employeeId, date]
    );

    if (pending.length > 0) {
      throw { statusCode: 400, message: 'A pending regularization request already exists for this date.' };
    }

    // Get manager_id from employee profile
    const { rows: emp } = await query('SELECT manager_id FROM employees WHERE id = $1', [employeeId]);
    const managerId = emp[0]?.manager_id || null;

    const { rows } = await query(
      `INSERT INTO attendance_regularizations 
        (attendance_id, employee_id, date, request_type, requested_clock_in, requested_clock_out, reason, manager_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [attendanceId || null, employeeId, date, requestType, requestedClockIn || null, requestedClockOut || null, reason, managerId]
    );

    const request = rows[0];
    await auditLog(userId, 'CREATE_REGULARIZATION', 'attendance_regularizations', request.id, null, request, req);

    // Notify manager if exists
    if (managerId) {
      // Find manager user_id
      const { rows: mgrUser } = await query('SELECT user_id FROM employees WHERE id = $1', [managerId]);
      if (mgrUser.length > 0) {
        await notificationService.create(
          mgrUser[0].user_id,
          'attendance',
          'Regularization Request',
          `An employee has requested attendance regularization for ${new Date(date).toLocaleDateString()}.`,
          {},
          '/attendance'
        );
      }
    }

    return request;
  }

  async getMyRequests(employeeId) {
    const { rows } = await query(
      `SELECT r.*, a.clock_in as current_clock_in, a.clock_out as current_clock_out, a.status as current_status
       FROM attendance_regularizations r
       LEFT JOIN attendance a ON r.attendance_id = a.id
       WHERE r.employee_id = $1
       ORDER BY r.date DESC`,
      [employeeId]
    );
    return rows;
  }

  async getTeamRequests(managerEmployeeId) {
    const { rows } = await query(
      `SELECT r.*, e.first_name, e.last_name, e.employee_code, e.designation,
              a.clock_in as current_clock_in, a.clock_out as current_clock_out, a.status as current_status
       FROM attendance_regularizations r
       JOIN employees e ON r.employee_id = e.id
       LEFT JOIN attendance a ON r.attendance_id = a.id
       WHERE r.manager_id = $1
       ORDER BY r.status = 'pending' DESC, r.created_at DESC`,
      [managerEmployeeId]
    );
    return rows;
  }

  async getAllRequests() {
    const { rows } = await query(
      `SELECT r.*, e.first_name, e.last_name, e.employee_code, e.designation,
              a.clock_in as current_clock_in, a.clock_out as current_clock_out, a.status as current_status
       FROM attendance_regularizations r
       JOIN employees e ON r.employee_id = e.id
       LEFT JOIN attendance a ON r.attendance_id = a.id
       ORDER BY r.status = 'pending' DESC, r.created_at DESC`
    );
    return rows;
  }

  async review(requestId, reviewerUser, data, req) {
    const { status, remarks } = data;
    const isManager = reviewerUser.role_name === 'manager';
    const isAdminOrHR = ['admin', 'hr'].includes(reviewerUser.role_name);

    // Get reviewer employee id
    let reviewerEmployeeId = null;
    if (isManager) {
      const { rows } = await query('SELECT id FROM employees WHERE user_id = $1', [reviewerUser.id]);
      if (rows.length > 0) reviewerEmployeeId = rows[0].id;
    }

    // Find request
    const { rows: reqRows } = await query('SELECT * FROM attendance_regularizations WHERE id = $1', [requestId]);
    if (reqRows.length === 0) {
      throw { statusCode: 404, message: 'Regularization request not found' };
    }
    const request = reqRows[0];

    if (request.status !== 'pending') {
      throw { statusCode: 400, message: 'Request has already been reviewed' };
    }

    // Verify ownership/reviewer permissions
    if (isManager && request.manager_id !== reviewerEmployeeId) {
      throw { statusCode: 403, message: 'You are not authorized to review this request.' };
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let updateQuery;
      let params;

      if (isManager) {
        updateQuery = 
          `UPDATE attendance_regularizations
           SET status = $1, manager_approved_at = NOW(), manager_remarks = $2, updated_at = NOW()
           WHERE id = $3
           RETURNING *`;
        params = [status, remarks || null, requestId];
      } else {
        // Admin/HR direct approval
        updateQuery = 
          `UPDATE attendance_regularizations
           SET status = $1, hr_approved_at = NOW(), hr_remarks = $2, updated_at = NOW()
           WHERE id = $3
           RETURNING *`;
        params = [status, remarks || null, requestId];
      }

      const { rows } = await client.query(updateQuery, params);
      const updatedRequest = rows[0];

      // If approved, update or create the attendance record
      if (status === 'approved') {
        const clockInTime = request.requested_clock_in ? new Date(request.requested_clock_in) : null;
        const clockOutTime = request.requested_clock_out ? new Date(request.requested_clock_out) : null;

        // Resolve shift
        const shift = await shiftService.getEmployeeShift(request.employee_id, request.date);
        const settings = await attendanceRepository.getSettings();

        // Calculate work hours
        let workHours = 0.00;
        if (clockInTime && clockOutTime) {
          const diffMs = clockOutTime.getTime() - clockInTime.getTime();
          workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
        }

        // Determine status classification
        const halfThreshold = parseFloat(settings?.half_day_threshold || 4.00);
        const fullThreshold = parseFloat(settings?.full_day_threshold || 8.00);

        let finalStatus = 'present';
        if (clockInTime) {
          if (shift.type === 'flexible') {
            if (shift.flexible_end_range) {
              const [eh, em, es] = shift.flexible_end_range.split(':').map(Number);
              const limitTime = new Date(clockInTime);
              limitTime.setHours(eh, em, es || 0, 0);
              if (clockInTime > limitTime) finalStatus = 'late';
            }
          } else {
            const [sh, sm, ss] = shift.start_time.split(':').map(Number);
            const shiftStart = new Date(request.date);
            shiftStart.setHours(sh, sm, ss || 0, 0);
            const lateThreshold = new Date(shiftStart.getTime() + (shift.grace_time_minutes || 0) * 60 * 1000);
            if (clockInTime > lateThreshold) finalStatus = 'late';
          }
        }

        if (workHours < halfThreshold) {
          finalStatus = 'absent';
        } else if (workHours >= halfThreshold && workHours < fullThreshold) {
          finalStatus = 'half_day';
        }

        if (request.attendance_id) {
          // Update existing attendance
          await client.query(
            `UPDATE attendance
             SET clock_in = $1, clock_out = $2, work_hours = $3, status = $4, shift_id = $5, updated_at = NOW()
             WHERE id = $6`,
            [clockInTime, clockOutTime, workHours, finalStatus, shift.id, request.attendance_id]
          );
        } else {
          // Create new attendance record
          const { rows: attInsert } = await client.query(
            `INSERT INTO attendance (employee_id, date, clock_in, clock_out, work_hours, status, shift_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [request.employee_id, request.date, clockInTime, clockOutTime, workHours, finalStatus, shift.id]
          );
          // Update regularization request with new attendance_id
          await client.query(
            `UPDATE attendance_regularizations SET attendance_id = $1 WHERE id = $2`,
            [attInsert[0].id, requestId]
          );
        }
      }

      await client.query('COMMIT');

      // Notify employee
      const { rows: empUser } = await query('SELECT user_id FROM employees WHERE id = $1', [request.employee_id]);
      if (empUser.length > 0) {
        await notificationService.create(
          empUser[0].user_id,
          'attendance',
          `Regularization Request ${status.toUpperCase()}`,
          `Your attendance correction request for ${new Date(request.date).toLocaleDateString()} was ${status} by ${reviewerUser.role_name}.`,
          {},
          '/attendance'
        );
      }

      await auditLog(reviewerUser.id, 'REVIEW_REGULARIZATION', 'attendance_regularizations', requestId, request, updatedRequest, req);
      return updatedRequest;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new RegularizationService();
