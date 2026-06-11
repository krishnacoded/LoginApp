const { query } = require('../config/database');
const ApiResponse = require('../utils/response');

const getOverview = async (req, res, next) => {
  try {
    // Employee stats
    const { rows: empStats } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_employees,
        COUNT(*) FILTER (WHERE employment_status = 'active' AND deleted_at IS NULL) as active_employees,
        COUNT(*) FILTER (WHERE employment_status = 'on_leave' AND deleted_at IS NULL) as on_leave,
        COUNT(*) FILTER (WHERE joining_date >= DATE_TRUNC('month', NOW()) AND deleted_at IS NULL) as new_this_month,
        COUNT(*) FILTER (WHERE joining_date >= NOW() - INTERVAL '7 days' AND deleted_at IS NULL) as new_this_week
      FROM employees
    `);

    // Department count
    const { rows: deptStats } = await query(`
      SELECT COUNT(*) FILTER (WHERE is_active = TRUE AND deleted_at IS NULL) as total_departments
      FROM departments
    `);

    // Leave stats for current year
    const { rows: leaveStats } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending_leaves,
        COUNT(*) FILTER (WHERE status = 'approved' AND EXTRACT(YEAR FROM start_date) = $1) as approved_this_year,
        COUNT(*) FILTER (WHERE status = 'rejected' AND EXTRACT(YEAR FROM created_at) = $1) as rejected_this_year,
        COUNT(*) FILTER (WHERE status = 'manager_approved') as awaiting_hr
      FROM leave_requests
    `, [new Date().getFullYear()]);

    // Employee growth trend (last 12 months)
    const { rows: growth } = await query(`
      SELECT TO_CHAR(DATE_TRUNC('month', joining_date), 'Mon YY') as month,
             DATE_TRUNC('month', joining_date) as month_date,
             COUNT(*) as count
      FROM employees
      WHERE joining_date >= NOW() - INTERVAL '12 months' AND deleted_at IS NULL
      GROUP BY month_date, month
      ORDER BY month_date
    `);

    // Department distribution
    const { rows: deptDist } = await query(`
      SELECT d.name, COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL AND e.employment_status = 'active'
      WHERE d.deleted_at IS NULL AND d.is_active = TRUE
      GROUP BY d.id, d.name
      ORDER BY count DESC
      LIMIT 8
    `);

    // Leave trends monthly
    const { rows: leaveTrend } = await query(`
      SELECT TO_CHAR(start_date, 'Mon') as month,
             EXTRACT(MONTH FROM start_date) as month_num,
             COUNT(*) FILTER (WHERE status = 'approved') as approved,
             COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
             COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM leave_requests
      WHERE EXTRACT(YEAR FROM start_date) = $1
      GROUP BY month, month_num
      ORDER BY month_num
    `, [new Date().getFullYear()]);

    // Recent activity
    const { rows: recentActivity } = await query(`
      SELECT al.action, al.entity_type, al.entity_id, al.created_at,
             u.email as user_email,
             e.first_name || ' ' || e.last_name as employee_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN employees e ON e.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    // Top departments by headcount
    const { rows: topDepts } = await query(`
      SELECT d.name, d.id,
             COUNT(e.id) as employee_count,
             AVG(EXTRACT(EPOCH FROM (NOW() - e.joining_date))/86400/365)::NUMERIC(4,1) as avg_tenure_years
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
      WHERE d.deleted_at IS NULL
      GROUP BY d.id, d.name
      ORDER BY employee_count DESC
      LIMIT 5
    `);

    // Gender distribution
    const { rows: genderDist } = await query(`
      SELECT gender, COUNT(*) as count
      FROM employees
      WHERE deleted_at IS NULL AND employment_status = 'active' AND gender IS NOT NULL
      GROUP BY gender
    `);

    return ApiResponse.success(res, {
      overview: {
        ...empStats[0],
        ...deptStats[0],
        ...leaveStats[0],
      },
      growth,
      departmentDistribution: deptDist,
      leaveTrend,
      recentActivity,
      topDepartments: topDepts,
      genderDistribution: genderDist,
    });
  } catch (error) {
    next(error);
  }
};

const getEmployeeAnalytics = async (req, res, next) => {
  try {
    const { rows: byStatus } = await query(`
      SELECT employment_status, COUNT(*) as count
      FROM employees WHERE deleted_at IS NULL
      GROUP BY employment_status
    `);

    const { rows: byType } = await query(`
      SELECT employment_type, COUNT(*) as count
      FROM employees WHERE deleted_at IS NULL
      GROUP BY employment_type
    `);

    const { rows: tenureGroups } = await query(`
      SELECT
        CASE
          WHEN EXTRACT(YEAR FROM AGE(NOW(), joining_date)) < 1 THEN '< 1 year'
          WHEN EXTRACT(YEAR FROM AGE(NOW(), joining_date)) < 3 THEN '1-3 years'
          WHEN EXTRACT(YEAR FROM AGE(NOW(), joining_date)) < 5 THEN '3-5 years'
          WHEN EXTRACT(YEAR FROM AGE(NOW(), joining_date)) < 10 THEN '5-10 years'
          ELSE '10+ years'
        END as tenure_group,
        COUNT(*) as count
      FROM employees
      WHERE deleted_at IS NULL AND joining_date IS NOT NULL
      GROUP BY tenure_group
      ORDER BY count DESC
    `);

    const { rows: monthlyHiring } = await query(`
      SELECT TO_CHAR(joining_date, 'Mon') as month,
             EXTRACT(MONTH FROM joining_date)::INT as month_num,
             COUNT(*) as hires
      FROM employees
      WHERE EXTRACT(YEAR FROM joining_date) = $1 AND deleted_at IS NULL
      GROUP BY month, month_num
      ORDER BY month_num
    `, [new Date().getFullYear()]);

    return ApiResponse.success(res, { byStatus, byType, tenureGroups, monthlyHiring });
  } catch (error) { next(error); }
};

const getSkillAnalytics = async (req, res, next) => {
  try {
    const { rows: topSkills } = await query(`
      SELECT s.name, sc.name as category, sc.color,
             COUNT(DISTINCT es.employee_id) as employee_count,
             AVG(es.proficiency_level)::NUMERIC(3,1) as avg_proficiency
      FROM skills s
      JOIN employee_skills es ON es.skill_id = s.id
      JOIN employees e ON es.employee_id = e.id AND e.deleted_at IS NULL
      LEFT JOIN skill_categories sc ON s.category_id = sc.id
      GROUP BY s.id, s.name, sc.name, sc.color
      ORDER BY employee_count DESC
      LIMIT 15
    `);

    const { rows: byCategory } = await query(`
      SELECT sc.name, sc.color,
             COUNT(DISTINCT s.id) as skill_count,
             COUNT(DISTINCT es.employee_id) as employee_count
      FROM skill_categories sc
      LEFT JOIN skills s ON s.category_id = sc.id
      LEFT JOIN employee_skills es ON es.skill_id = s.id
      LEFT JOIN employees e ON es.employee_id = e.id AND e.deleted_at IS NULL
      GROUP BY sc.id, sc.name, sc.color
      ORDER BY employee_count DESC
    `);

    return ApiResponse.success(res, { topSkills, byCategory });
  } catch (error) { next(error); }
};

module.exports = { getOverview, getEmployeeAnalytics, getSkillAnalytics };