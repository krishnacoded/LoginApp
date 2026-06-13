const { query, getClient } = require('../config/database');
const { auditLog } = require('../middleware/audit');

class ShiftService {
  async getAll() {
    const { rows } = await query(
      `SELECT *, 
              (SELECT COUNT(DISTINCT employee_id) FROM employee_shifts WHERE shift_id = id AND (end_date IS NULL OR end_date >= CURRENT_DATE)) as active_employees
       FROM shifts 
       ORDER BY name ASC`
    );
    return rows;
  }

  async getById(id) {
    const { rows } = await query('SELECT * FROM shifts WHERE id = $1', [id]);
    if (rows.length === 0) {
      throw { statusCode: 404, message: 'Shift not found' };
    }
    return rows[0];
  }

  async create(data, performedByUserId, req) {
    const { name, type, startTime, endTime, flexibleStartRange, flexibleEndRange, graceTimeMinutes } = data;

    const { rows } = await query(
      `INSERT INTO shifts (name, type, start_time, end_time, flexible_start_range, flexible_end_range, grace_time_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, type, startTime, endTime, flexibleStartRange || null, flexibleEndRange || null, graceTimeMinutes ?? 15]
    );

    const shift = rows[0];
    await auditLog(performedByUserId, 'CREATE_SHIFT', 'shifts', shift.id, null, shift, req);
    return shift;
  }

  async update(id, data, performedByUserId, req) {
    const existing = await this.getById(id);

    // Prevent modifying General, Night or Flexible seeded shifts IDs if needed, but they are system general. We can let users rename but check.
    const { name, type, startTime, endTime, flexibleStartRange, flexibleEndRange, graceTimeMinutes } = data;

    const { rows } = await query(
      `UPDATE shifts
       SET name = COALESCE($1, name),
           type = COALESCE($2, type),
           start_time = COALESCE($3, start_time),
           end_time = COALESCE($4, end_time),
           flexible_start_range = $5,
           flexible_end_range = $6,
           grace_time_minutes = COALESCE($7, grace_time_minutes),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name, 
        type, 
        startTime, 
        endTime, 
        flexibleStartRange !== undefined ? flexibleStartRange : existing.flexible_start_range, 
        flexibleEndRange !== undefined ? flexibleEndRange : existing.flexible_end_range, 
        graceTimeMinutes !== undefined ? graceTimeMinutes : existing.grace_time_minutes, 
        id
      ]
    );

    const updated = rows[0];
    await auditLog(performedByUserId, 'UPDATE_SHIFT', 'shifts', id, existing, updated, req);
    return updated;
  }

  async delete(id, performedByUserId, req) {
    const existing = await this.getById(id);

    // System protection for General, Morning and Night shifts (seeded IDs)
    const systemIds = [
      '33333333-3333-3333-3333-333333333001',
      '33333333-3333-3333-3333-333333333002',
      '33333333-3333-3333-3333-333333333003'
    ];
    if (systemIds.includes(id)) {
      throw { statusCode: 403, message: 'Cannot delete system-seeded shifts' };
    }

    // Set shift to inactive or delete if no active assignments.
    const { rows: assignments } = await query(
      'SELECT COUNT(*) as count FROM employee_shifts WHERE shift_id = $1 AND (end_date IS NULL OR end_date >= CURRENT_DATE)',
      [id]
    );
    if (parseInt(assignments[0].count) > 0) {
      throw { statusCode: 400, message: 'Cannot delete shift with active employee assignments. Reassign them first.' };
    }

    await query('DELETE FROM employee_shifts WHERE shift_id = $1', [id]);
    await query('DELETE FROM shifts WHERE id = $1', [id]);

    await auditLog(performedByUserId, 'DELETE_SHIFT', 'shifts', id, existing, null, req);
    return { deleted: true };
  }

  async assignShift(data, performedByUserId, req) {
    const { employeeId, shiftId, startDate, endDate } = data;

    // Verify employee
    const { rows: emp } = await query('SELECT id FROM employees WHERE id = $1 AND deleted_at IS NULL', [employeeId]);
    if (emp.length === 0) throw { statusCode: 404, message: 'Employee not found' };

    // Verify shift
    await this.getById(shiftId);

    // Close any existing active shift assignments by setting end_date = startDate - 1 day
    const prevDay = new Date(startDate);
    prevDay.setDate(prevDay.getDate() - 1);
    const prevDayStr = prevDay.toISOString().split('T')[0];

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update previous assignments to end on prevDay
      await client.query(
        `UPDATE employee_shifts
         SET end_date = $1
         WHERE employee_id = $2 AND (end_date IS NULL OR end_date > $1) AND start_date < $3`,
        [prevDayStr, employeeId, startDate]
      );

      // Insert new assignment
      const { rows } = await client.query(
        `INSERT INTO employee_shifts (employee_id, shift_id, start_date, end_date)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (employee_id, start_date)
         DO UPDATE SET shift_id = EXCLUDED.shift_id, end_date = EXCLUDED.end_date
         RETURNING *`,
        [employeeId, shiftId, startDate, endDate || null]
      );

      await client.query('COMMIT');

      await auditLog(performedByUserId, 'ASSIGN_SHIFT', 'employee_shifts', rows[0].id, null, rows[0], req);
      return rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async bulkAssign(data, performedByUserId, req) {
    const { employeeIds, departmentId, shiftId, startDate, endDate } = data;

    let targetEmployeeIds = [];
    if (employeeIds && employeeIds.length > 0) {
      targetEmployeeIds = employeeIds;
    } else if (departmentId) {
      const { rows } = await query(
        'SELECT id FROM employees WHERE department_id = $1 AND deleted_at IS NULL AND employment_status = \'active\'',
        [departmentId]
      );
      targetEmployeeIds = rows.map(r => r.id);
    }

    if (targetEmployeeIds.length === 0) {
      throw { statusCode: 400, message: 'No active employees found to assign shift to' };
    }

    const results = [];
    for (const empId of targetEmployeeIds) {
      const res = await this.assignShift(
        { employeeId: empId, shiftId, startDate, endDate },
        performedByUserId,
        req
      );
      results.push(res);
    }

    return { assignedCount: results.length };
  }

  async getEmployeeShift(employeeId, date = new Date().toISOString().split('T')[0]) {
    const { rows } = await query(
      `SELECT s.* 
       FROM employee_shifts es
       JOIN shifts s ON es.shift_id = s.id
       WHERE es.employee_id = $1 
         AND es.start_date <= $2 
         AND (es.end_date IS NULL OR es.end_date >= $2)
       LIMIT 1`,
      [employeeId, date]
    );

    if (rows.length > 0) return rows[0];

    // Fallback to General shift
    const { rows: general } = await query("SELECT * FROM shifts WHERE id = '33333333-3333-3333-3333-333333333001'");
    return general[0] || null;
  }
}

module.exports = new ShiftService();
