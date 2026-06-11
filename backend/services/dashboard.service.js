const { query } = require('../config/database');

class DashboardService {
  async getOverview() {
    const year = new Date().getFullYear();
    const [employees, departments, leaves, growth, departmentDistribution, leaveTrend, recentActivity] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_employees,
          COUNT(*) FILTER (WHERE employment_status = 'active' AND deleted_at IS NULL) as active_employees,
          COUNT(*) FILTER (WHERE employment_status = 'on_leave' AND deleted_at IS NULL) as on_leave,
          COUNT(*) FILTER (WHERE joining_date >= DATE_TRUNC('month', NOW()) AND deleted_at IS NULL) as new_this_month,
          COUNT(*) FILTER (WHERE joining_date >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) as new_this_week
        FROM employees
      `),
      query(`SELECT COUNT(*) FILTER (WHERE is_active = TRUE AND deleted_at IS NULL) as total_departments FROM departments`),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'pending') as pending_leaves,
          COUNT(*) FILTER (WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = $1) as approved_this_year,
          COUNT(*) FILTER (WHERE status = 'rejected' AND EXTRACT(YEAR FROM created_at) = $1) as rejected_this_year
        FROM leave_requests
      `, [year]),
      query(`
        SELECT TO_CHAR(DATE_TRUNC('month', joining_date), 'Mon YY') as month,
               DATE_TRUNC('month', joining_date) as month_date,
               COUNT(*) as count
        FROM employees
        WHERE joining_date >= NOW() - INTERVAL '12 months' AND deleted_at IS NULL
        GROUP BY month_date, month
        ORDER BY month_date
      `),
      query(`
        SELECT d.name, COUNT(e.id) as count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL AND e.employment_status = 'active'
        WHERE d.deleted_at IS NULL AND d.is_active = TRUE
        GROUP BY d.id, d.name
        ORDER BY count DESC
        LIMIT 8
      `),
      query(`
        SELECT TO_CHAR(start_date, 'Mon') as month,
               EXTRACT(MONTH FROM start_date) as month_num,
               COUNT(*) FILTER (WHERE status = 'approved') as approved,
               COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
               COUNT(*) FILTER (WHERE status = 'pending') as pending
        FROM leave_requests
        WHERE EXTRACT(YEAR FROM start_date) = $1
        GROUP BY month, month_num
        ORDER BY month_num
      `, [year]),
      query(`
        SELECT al.action, al.entity_type, al.entity_id, al.created_at,
               u.email as user_email,
               e.first_name || ' ' || e.last_name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN employees e ON e.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `),
    ]);

    return {
      overview: {
        ...employees.rows[0],
        ...departments.rows[0],
        ...leaves.rows[0],
      },
      growth: growth.rows,
      departmentDistribution: departmentDistribution.rows,
      leaveTrend: leaveTrend.rows,
      recentActivity: recentActivity.rows,
    };
  }
}

module.exports = new DashboardService();
