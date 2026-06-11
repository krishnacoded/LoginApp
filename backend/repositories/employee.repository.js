const { query } = require('../config/database');

class EmployeeRepository {
  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT e.*, d.name as department_name, u.email
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE e.user_id = $1 AND e.deleted_at IS NULL`,
      [userId]
    );
    return rows[0] || null;
  }

  async findManagers() {
    const { rows } = await query(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.designation, d.name as department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.deleted_at IS NULL AND e.employment_status = 'active'
       ORDER BY e.first_name, e.last_name`
    );
    return rows;
  }

  async updateStatus(id, status) {
    const { rows } = await query(
      `UPDATE employees SET employment_status = $1, updated_at = NOW()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [status, id]
    );
    return rows[0] || null;
  }

  async countActiveByDepartment(departmentId) {
    const { rows } = await query(
      `SELECT COUNT(*) as total
       FROM employees
       WHERE department_id = $1 AND deleted_at IS NULL AND employment_status = 'active'`,
      [departmentId]
    );
    return parseInt(rows[0].total, 10);
  }
}

module.exports = new EmployeeRepository();
