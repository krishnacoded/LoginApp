const { query } = require('../config/database');

class AttendanceRepository {
  async getSettings() {
    const { rows } = await query('SELECT * FROM attendance_settings WHERE id = 1');
    return rows[0] || null;
  }

  async updateSettings(data) {
    const { rows } = await query(
      `UPDATE attendance_settings
       SET office_start_time = $1, 
           office_end_time = $2, 
           full_day_threshold = $3,
           half_day_threshold = $4, 
           late_arrival_threshold = $5,
           geofencing_enabled = COALESCE($6, geofencing_enabled),
           geofence_latitude = COALESCE($7, geofence_latitude),
           geofence_longitude = COALESCE($8, geofence_longitude),
           geofence_radius_meters = COALESCE($9, geofence_radius_meters),
           device_tracking_enabled = COALESCE($10, device_tracking_enabled),
           overtime_enabled = COALESCE($11, overtime_enabled),
           overtime_threshold_hours = COALESCE($12, overtime_threshold_hours),
           early_departure_threshold_time = COALESCE($13, early_departure_threshold_time),
           updated_at = NOW()
       WHERE id = 1
       RETURNING *`,
      [
        data.officeStartTime, 
        data.officeEndTime, 
        data.fullDayThreshold, 
        data.halfDayThreshold, 
        data.lateArrivalThreshold,
        data.geofencingEnabled !== undefined ? data.geofencingEnabled : null,
        data.geofenceLatitude !== undefined ? data.geofenceLatitude : null,
        data.geofenceLongitude !== undefined ? data.geofenceLongitude : null,
        data.geofenceRadiusMeters !== undefined ? data.geofenceRadiusMeters : null,
        data.deviceTrackingEnabled !== undefined ? data.deviceTrackingEnabled : null,
        data.overtimeEnabled !== undefined ? data.overtimeEnabled : null,
        data.overtimeThresholdHours !== undefined ? data.overtimeThresholdHours : null,
        data.earlyDepartureThresholdTime !== undefined ? data.earlyDepartureThresholdTime : null
      ]
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
    const keys = [];
    const values = [];
    const params = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      keys.push(dbKey);
      values.push(`$${idx++}`);
      params.push(val);
    }

    const { rows } = await query(
      `INSERT INTO attendance (${keys.join(', ')})
       VALUES (${values.join(', ')})
       RETURNING *`,
      params
    );
    return rows[0];
  }

  async update(id, data) {
    const fields = [];
    const params = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      fields.push(`${dbKey} = $${idx++}`);
      params.push(val);
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

  async startBreak(attendanceId, breakType) {
    const { rows } = await query(
      `INSERT INTO attendance_breaks (attendance_id, break_type, start_time)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [attendanceId, breakType]
    );
    return rows[0];
  }

  async getActiveBreak(attendanceId) {
    const { rows } = await query(
      `SELECT * FROM attendance_breaks 
       WHERE attendance_id = $1 AND end_time IS NULL 
       LIMIT 1`,
      [attendanceId]
    );
    return rows[0] || null;
  }

  async endBreak(breakId) {
    const { rows } = await query(
      `UPDATE attendance_breaks
       SET end_time = NOW(),
           duration_minutes = ROUND(EXTRACT(EPOCH FROM (NOW() - start_time)) / 60)
       WHERE id = $1
       RETURNING *`,
      [breakId]
    );
    return rows[0];
  }

  async updateTotalBreakDuration(attendanceId) {
    const { rows } = await query(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total_duration
       FROM attendance_breaks
       WHERE attendance_id = $1`,
      [attendanceId]
    );
    const totalDuration = parseInt(rows[0].total_duration, 10);
    await query(
      `UPDATE attendance
       SET break_duration_minutes = $1, updated_at = NOW()
       WHERE id = $2`,
      [totalDuration, attendanceId]
    );
    return totalDuration;
  }
}

module.exports = new AttendanceRepository();
