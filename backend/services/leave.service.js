const { query, getClient } = require('../config/database');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const notificationService = require('./notification.service');

class LeaveService {
  async calculateWorkingDays(startDate, endDate) {
    let count = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  }

  async getAll(filters = {}, user) {
    const { page, limit, offset } = getPaginationParams(filters);
    const conditions = [];
    const params = [];
    let idx = 1;

    // Role-based filtering
    if (user.role_name === 'employee') {
      const { rows: emp } = await query(
        'SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
        [user.id]
      );
      if (emp.length === 0) throw { statusCode: 404, message: 'Employee record not found' };
      conditions.push(`lr.employee_id = $${idx++}`);
      params.push(emp[0].id);
    } else if (user.role_name === 'manager') {
      const { rows: emp } = await query(
        'SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
        [user.id]
      );
      if (emp.length > 0) {
        conditions.push(`(e.manager_id = $${idx++} OR lr.employee_id = $${idx++})`);
        params.push(emp[0].id, emp[0].id);
      }
    }

    if (filters.employeeId) {
      conditions.push(`lr.employee_id = $${idx++}`);
      params.push(filters.employeeId);
    }
    if (filters.status) {
      conditions.push(`lr.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.leaveTypeId) {
      conditions.push(`lr.leave_type_id = $${idx++}`);
      params.push(filters.leaveTypeId);
    }
    if (filters.startDate) {
      conditions.push(`lr.start_date >= $${idx++}`);
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`lr.end_date <= $${idx++}`);
      params.push(filters.endDate);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) as total FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id ${where}`,
      params
    );

    const { rows } = await query(
      `SELECT lr.*, lt.name as leave_type_name, lt.color, lt.code,
              e.first_name, e.last_name, e.employee_code, e.profile_picture_url,
              d.name as department_name,
              (SELECT COUNT(*) FROM leave_approvals la WHERE la.leave_request_id = lr.id) as approval_count
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${where}
       ORDER BY lr.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      leaves: rows,
      pagination: buildPaginationMeta(parseInt(countRes.rows[0].total), page, limit),
    };
  }

  async getById(id) {
    const { rows } = await query(
      `SELECT lr.*, lt.name as leave_type_name, lt.color, lt.code, lt.requires_attachment,
              e.first_name, e.last_name, e.employee_code, e.profile_picture_url,
              e.id as employee_id,
              d.name as department_name,
              m.first_name as manager_first_name, m.last_name as manager_last_name,
              m.id as manager_id
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN employees e ON lr.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN employees m ON e.manager_id = m.id
       WHERE lr.id = $1`,
      [id]
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'Leave request not found' };

    const leave = rows[0];

    // Get approval history
    const { rows: approvals } = await query(
      `SELECT la.*, u.email as approver_email,
              e.first_name || ' ' || e.last_name as approver_name,
              e.profile_picture_url as approver_picture, e.designation
       FROM leave_approvals la
       JOIN users u ON la.approver_id = u.id
       LEFT JOIN employees e ON e.user_id = u.id
       WHERE la.leave_request_id = $1
       ORDER BY la.stage, la.actioned_at`,
      [id]
    );

    return { ...leave, approvals };
  }

  async apply(employeeId, data, userId, req) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Get leave type
      const { rows: ltRows } = await client.query(
        'SELECT * FROM leave_types WHERE id = $1 AND is_active = TRUE',
        [data.leaveTypeId]
      );
      if (ltRows.length === 0) throw { statusCode: 404, message: 'Leave type not found' };
      const leaveType = ltRows[0];

      // Calculate days
      const totalDays = data.isHalfDay ? 0.5 : await this.calculateWorkingDays(data.startDate, data.endDate);

      // Check balance
      const year = new Date(data.startDate).getFullYear();
      const { rows: balanceRows } = await client.query(
        `SELECT * FROM leave_balances WHERE employee_id = $1 AND leave_type_id = $2 AND year = $3`,
        [employeeId, data.leaveTypeId, year]
      );

      if (balanceRows.length > 0) {
        const balance = balanceRows[0];
        const available = balance.allocated_days + balance.carried_forward_days - balance.used_days - balance.pending_days;
        if (available < totalDays) {
          throw { statusCode: 400, message: `Insufficient leave balance. Available: ${available} days` };
        }
      }

      // Create leave request
      const { rows } = await client.query(
        `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days,
                  reason, status, attachment_url, is_half_day, half_day_type)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9)
         RETURNING *`,
        [employeeId, data.leaveTypeId, data.startDate, data.endDate, totalDays,
         data.reason, data.attachmentUrl || null, data.isHalfDay || false, data.halfDayType || null]
      );

      const leaveRequest = rows[0];

      // Update pending balance
      await client.query(
        `UPDATE leave_balances SET pending_days = pending_days + $1
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [totalDays, employeeId, data.leaveTypeId, year]
      );

      // Add initial approval record
      await client.query(
        `INSERT INTO leave_approvals (leave_request_id, approver_id, approver_role, stage, action, comment)
         VALUES ($1, $2, 'employee', 0, 'applied', 'Leave application submitted')`,
        [leaveRequest.id, userId]
      );

      // Notify the manager
      try {
        const { rows: managerUser } = await client.query(
          `SELECT u.id as user_id FROM employees e
           JOIN users u ON e.user_id = u.id
           WHERE e.id = (SELECT manager_id FROM employees WHERE id = $1 AND deleted_at IS NULL)`,
          [employeeId]
        );
        const managerUserId = managerUser[0]?.user_id;
        if (managerUserId) {
          const { rows: applicant } = await client.query('SELECT first_name, last_name FROM employees WHERE id = $1', [employeeId]);
          const applicantName = `${applicant[0]?.first_name} ${applicant[0]?.last_name}`;
          await notificationService.create(
            managerUserId,
            'leave_applied',
            'New Leave Request',
            `${applicantName} has applied for leave.`,
            { leaveId: leaveRequest.id },
            '/leaves/approvals'
          );
        }
      } catch (notifErr) {
        console.error('Error creating leave application notification:', notifErr);
      }

      await client.query('COMMIT');

      await auditLog(userId, 'APPLY_LEAVE', 'leave', leaveRequest.id, null, leaveRequest, req);
      return leaveRequest;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async approve(leaveId, approverId, role, comment, req) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const leave = await this.getById(leaveId);

      if (leave.status === 'approved' || leave.status === 'rejected') {
        throw { statusCode: 400, message: `Leave already ${leave.status}` };
      }

      let newStatus = 'pending';
      let stage = 1;

      if (role === 'admin' || role === 'hr') {
        newStatus = 'approved';
        stage = 2;
      } else if (role === 'manager') {
        // Check if there's HR review needed
        newStatus = 'manager_approved';
        stage = 1;
      }

      // Final approval
      if (newStatus === 'approved') {
        // Deduct from balance
        const year = new Date(leave.start_date).getFullYear();
        await client.query(
          `UPDATE leave_balances
           SET used_days = used_days + $1, pending_days = GREATEST(0, pending_days - $1)
           WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
          [leave.total_days, leave.employee_id, leave.leave_type_id, year]
        );
      }

      await client.query(
        `UPDATE leave_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, leaveId]
      );

      await client.query(
        `INSERT INTO leave_approvals (leave_request_id, approver_id, approver_role, stage, action, comment)
         VALUES ($1, $2, $3, $4, 'approved', $5)`,
        [leaveId, approverId, role, stage, comment || 'Approved']
      );

      // Create notification for employee
      try {
        const { rows: empUser } = await client.query('SELECT user_id FROM employees WHERE id = $1', [leave.employee_id]);
        const employeeUserId = empUser[0]?.user_id;
        if (employeeUserId) {
          const title = newStatus === 'approved' ? 'Leave Request Approved' : 'Leave Request Manager Approved';
          const message = `Your leave request for ${leave.leave_type_name} has been ${newStatus.replace('_', ' ')}.`;
          await notificationService.create(employeeUserId, 'leave_approved', title, message, { leaveId }, '/leaves');
        }
      } catch (notifErr) {
        console.error('Error creating leave approval notification:', notifErr);
      }

      await client.query('COMMIT');

      await auditLog(approverId, 'APPROVE_LEAVE', 'leave', leaveId, { status: leave.status }, { status: newStatus }, req);
      return await this.getById(leaveId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reject(leaveId, rejectorId, role, comment, req) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const leave = await this.getById(leaveId);

      if (leave.status === 'approved' || leave.status === 'rejected') {
        throw { statusCode: 400, message: `Leave already ${leave.status}` };
      }

      // Restore pending balance
      const year = new Date(leave.start_date).getFullYear();
      await client.query(
        `UPDATE leave_balances SET pending_days = GREATEST(0, pending_days - $1)
         WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
        [leave.total_days, leave.employee_id, leave.leave_type_id, year]
      );

      await client.query(
        'UPDATE leave_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['rejected', leaveId]
      );

      await client.query(
        `INSERT INTO leave_approvals (leave_request_id, approver_id, approver_role, stage, action, comment)
         VALUES ($1, $2, $3, $4, 'rejected', $5)`,
        [leaveId, rejectorId, role, 1, comment || 'Rejected']
      );

      // Create notification for employee
      try {
        const { rows: empUser } = await client.query('SELECT user_id FROM employees WHERE id = $1', [leave.employee_id]);
        const employeeUserId = empUser[0]?.user_id;
        if (employeeUserId) {
          await notificationService.create(
            employeeUserId,
            'leave_rejected',
            'Leave Request Rejected',
            `Your leave request for ${leave.leave_type_name} has been rejected.`,
            { leaveId },
            '/leaves'
          );
        }
      } catch (notifErr) {
        console.error('Error creating leave rejection notification:', notifErr);
      }

      await client.query('COMMIT');

      await auditLog(rejectorId, 'REJECT_LEAVE', 'leave', leaveId, { status: leave.status }, { status: 'rejected' }, req);
      return await this.getById(leaveId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancel(leaveId, userId, reason, req) {
    const leave = await this.getById(leaveId);

    // Ownership check: only the leave owner can cancel their own leave
    const { rows: empRows } = await query(
      'SELECT id FROM employees WHERE user_id = $1 AND deleted_at IS NULL',
      [userId]
    );
    if (empRows.length === 0 || empRows[0].id !== leave.employee_id) {
      throw { statusCode: 403, message: 'You can only cancel your own leave requests' };
    }

    if (!['pending', 'manager_approved'].includes(leave.status)) {
      throw { statusCode: 400, message: 'Can only cancel pending or manager-approved leaves' };
    }

    const year = new Date(leave.start_date).getFullYear();
    await query(
      `UPDATE leave_balances SET pending_days = GREATEST(0, pending_days - $1)
       WHERE employee_id = $2 AND leave_type_id = $3 AND year = $4`,
      [leave.total_days, leave.employee_id, leave.leave_type_id, year]
    );

    await query(
      `UPDATE leave_requests SET status = 'cancelled', cancelled_at = NOW(), cancelled_by = $1, cancellation_reason = $2
       WHERE id = $3`,
      [userId, reason, leaveId]
    );

    await auditLog(userId, 'CANCEL_LEAVE', 'leave', leaveId, null, null, req);
  }

  async getBalance(employeeId, year) {
    const { rows } = await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.color, lt.code, lt.is_paid
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1 AND lb.year = $2 AND lt.is_active = TRUE
       ORDER BY lt.name`,
      [employeeId, year || new Date().getFullYear()]
    );
    return rows;
  }

  async getTypes() {
    const { rows } = await query(
      `SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name`
    );
    return rows;
  }

  async getStats() {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'manager_approved') as manager_approved,
        COUNT(*) as total
      FROM leave_requests
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `, [new Date().getFullYear()]);

    const { rows: byType } = await query(`
      SELECT lt.name, lt.color, COUNT(lr.id) as count, SUM(lr.total_days) as total_days
      FROM leave_requests lr
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE lr.status = 'approved' AND EXTRACT(YEAR FROM lr.start_date) = $1
      GROUP BY lt.id, lt.name, lt.color
      ORDER BY count DESC
    `, [new Date().getFullYear()]);

    const { rows: monthly } = await query(`
      SELECT TO_CHAR(start_date, 'Mon') as month, 
             EXTRACT(MONTH FROM start_date) as month_num,
             COUNT(*) as total,
             COUNT(*) FILTER (WHERE status = 'approved') as approved,
             COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM leave_requests
      WHERE EXTRACT(YEAR FROM start_date) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `, [new Date().getFullYear()]);

    return { overview: rows[0], byType, monthly };
  }
}

module.exports = new LeaveService();
