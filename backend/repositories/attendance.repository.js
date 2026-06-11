const { query } = require('../config/database');

class AttendanceRepository {
  async getSettings() {
    const { rows } = await query('SELECT * FROM attendance_settings WHERE id = 1');
    return rows[0] || null;
  }

  async updateSettings(data) {
    const { rows } = await query(
      `UPDATE attendance_settings
       SET office_start_time = $1, office_end_time = $2, full_day_threshold = $3,
           half_day_threshold = $4, late_arrival_threshold = $5, updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [data.officeStartTime, data.officeEndTime, data.fullDayThreshold, data.halfDayThreshold, data.lateArrivalThreshold]
    );
    return rows[0];
  }

  async findByEmployeeAndDate(employeeId, date) {
    const { rows } = await query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employeeId, date]
    );
    return rows[0] || null;
  }

  async create(data) {
    const { rows } = await query(
      `INSERT INTO attendance (employee_id, date, clock_in, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.employeeId, data.date, data.clockIn, data.status]
    );
    return rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    if (data.clockOut !== undefined) {
      fields.push(`clock_out = $${idx++}`);
      params.push(data.clockOut);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      params.push(data.status);
    }
    if (data.workHours !== undefined) {
      fields.push(`work_hours = $${idx++}`);
      params.push(data.workHours);
    }

    if (fields.length === 0) return null;

    params.push(id);
    const { rows } = await query(
      `UPDATE attendance
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING *`,
      params
    );
    return rows[0];
  }

  async findAll(filters = {}, pagination = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (filters.employeeId) {
      conditions.push(`a.employee_id = $${idx++}`);
      params.push(filters.employeeId);
    }
    if (filters.startDate) {
      conditions.push(`a.date >= $${idx++}`);
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`a.date <= $${idx++}`);
      params.push(filters.endDate);
    }
    if (filters.status) {
      conditions.push(`a.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.managerId) {
      conditions.push(`e.manager_id = $${idx++}`);
      params.push(filters.managerId);
    }
    if (filters.departmentId) {
      conditions.push(`e.department_id = $${idx++}`);
      params.push(filters.departmentId);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) as total FROM attendance a
       JOIN employees e ON a.employee_id = e.id ${where}`,
      params
    );

    const { limit, offset } = pagination;
    const { rows } = await query(
      `SELECT a.*, e.first_name, e.last_name, e.employee_code, e.designation, d.name as department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       ${where}
       ORDER BY a.date DESC, a.clock_in DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  }

  async getDailyStats(date) {
    // Total active employees
    const { rows: totalEmp } = await query(
      `SELECT COUNT(*) as count FROM employees WHERE deleted_at IS NULL AND employment_status = 'active'`
    );
    const activeCount = parseInt(totalEmp[0].count, 10);

    // Present today (present, late, half_day)
    const { rows: attToday } = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status IN ('present', 'late', 'half_day')) as present_count,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_count
       FROM attendance
       WHERE date = $1`,
      [date]
    );

    const present = parseInt(attToday[0]?.present_count || 0, 10);
    const loggedAbsent = parseInt(attToday[0]?.absent_count || 0, 10);
    
    // Virtual absent is active employees minus present today
    const absent = Math.max(0, activeCount - present);

    const percentage = activeCount > 0 ? parseFloat(((present / activeCount) * 100).toFixed(1)) : 0.0;

    return {
      presentToday: present,
      absentToday: absent,
      attendancePercentage: percentage,
    };
  }

  async getMonthlyStats(employeeId, year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { rows } = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'late') as late,
        COUNT(*) FILTER (WHERE status = 'half_day') as half_day,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COALESCE(SUM(work_hours), 0)::NUMERIC(6,2) as total_hours
       FROM attendance
       WHERE employee_id = $1 AND date >= $2 AND date <= $3`,
      [employeeId, startDate, endDate]
    );
    return rows[0];
  }
}

module.exports = new AttendanceRepository();
