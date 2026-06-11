const { query } = require('../config/database');

class LeaveRepository {
  async findTypes() {
    const { rows } = await query('SELECT * FROM leave_types WHERE is_active = TRUE ORDER BY name');
    return rows;
  }

  async findBalance(employeeId, year) {
    const { rows } = await query(
      `SELECT lb.*, lt.name as leave_type_name, lt.code, lt.color, lt.is_paid
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       WHERE lb.employee_id = $1 AND lb.year = $2 AND lt.is_active = TRUE
       ORDER BY lt.name`,
      [employeeId, year]
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await query(
      `SELECT lr.*, lt.name as leave_type_name, lt.color, e.first_name, e.last_name, e.employee_code
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN employees e ON lr.employee_id = e.id
       WHERE lr.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async updateStatus(id, status, fields = {}) {
    const assignments = ['status = $1', 'updated_at = NOW()'];
    const values = [status];
    let idx = 2;

    for (const [column, value] of Object.entries(fields)) {
      assignments.push(`${column} = $${idx++}`);
      values.push(value);
    }

    values.push(id);
    const { rows } = await query(
      `UPDATE leave_requests SET ${assignments.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }
}

module.exports = new LeaveRepository();
