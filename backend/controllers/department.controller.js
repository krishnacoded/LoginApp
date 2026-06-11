const { query } = require('../config/database');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { auditLog } = require('../middleware/audit');
const ApiResponse = require('../utils/response');

class DepartmentService {
  async getAll(filters = {}) {
    const { page, limit, offset } = getPaginationParams(filters);
    const conditions = ['d.deleted_at IS NULL'];
    const params = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(d.name ILIKE $${idx} OR d.code ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`d.is_active = $${idx++}`);
      params.push(filters.isActive === 'true');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) as total FROM departments d ${where}`, params
    );

    const { rows } = await query(
      `SELECT d.id, d.name, d.code, d.description, d.location, d.budget, d.is_active,
              d.created_at, d.updated_at,
              e.first_name || ' ' || e.last_name as head_name,
              e.id as head_employee_id, e.profile_picture_url as head_picture,
              pd.name as parent_department_name,
              COUNT(DISTINCT emp.id) FILTER (WHERE emp.deleted_at IS NULL AND emp.employment_status = 'active') as employee_count
       FROM departments d
       LEFT JOIN employees e ON d.head_employee_id = e.id
       LEFT JOIN departments pd ON d.parent_department_id = pd.id
       LEFT JOIN employees emp ON emp.department_id = d.id
       ${where}
       GROUP BY d.id, e.first_name, e.last_name, e.id, e.profile_picture_url, pd.name
       ORDER BY d.name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return {
      departments: rows,
      pagination: buildPaginationMeta(parseInt(countRes.rows[0].total), page, limit),
    };
  }

  async getById(id) {
    const { rows } = await query(
      `SELECT d.*, e.first_name || ' ' || e.last_name as head_name,
              e.id as head_employee_id, e.designation as head_designation,
              e.profile_picture_url as head_picture, e.employee_code as head_code
       FROM departments d
       LEFT JOIN employees e ON d.head_employee_id = e.id
       WHERE d.id = $1 AND d.deleted_at IS NULL`,
      [id]
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'Department not found' };

    const dept = rows[0];

    // Get employees in department
    const { rows: employees } = await query(
      `SELECT e.id, e.employee_code, e.first_name, e.last_name, e.designation,
              e.profile_picture_url, e.employment_status, e.joining_date
       FROM employees e
       WHERE e.department_id = $1 AND e.deleted_at IS NULL AND e.employment_status = 'active'
       ORDER BY e.first_name`,
      [id]
    );

    // Get skill distribution
    const { rows: skillStats } = await query(
      `SELECT s.name, COUNT(*) as count
       FROM employee_skills es
       JOIN employees emp ON es.employee_id = emp.id
       JOIN skills s ON es.skill_id = s.id
       WHERE emp.department_id = $1 AND emp.deleted_at IS NULL
       GROUP BY s.name
       ORDER BY count DESC
       LIMIT 10`,
      [id]
    );

    // Monthly hiring trend
    const { rows: hireTrend } = await query(
      `SELECT TO_CHAR(joining_date, 'Mon YYYY') as month,
              DATE_TRUNC('month', joining_date) as month_date,
              COUNT(*) as count
       FROM employees
       WHERE department_id = $1 AND deleted_at IS NULL
         AND joining_date >= NOW() - INTERVAL '12 months'
       GROUP BY month, month_date
       ORDER BY month_date`,
      [id]
    );

    return { ...dept, employees, skillStats, hireTrend };
  }

  async create(data, userId) {
    const { rows } = await query(
      `INSERT INTO departments (name, code, description, head_employee_id, budget, location, parent_department_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.name, data.code.toUpperCase(), data.description || null,
       data.headEmployeeId || null, data.budget || null, data.location || null,
       data.parentDepartmentId || null]
    );
    await auditLog(userId, 'CREATE_DEPARTMENT', 'department', rows[0].id, null, rows[0]);
    return rows[0];
  }

  async update(id, data, userId) {
    const fields = [];
    const values = [];
    let idx = 1;

    const map = {
      name: 'name', code: 'code', description: 'description',
      headEmployeeId: 'head_employee_id', budget: 'budget',
      location: 'location', isActive: 'is_active',
      parentDepartmentId: 'parent_department_id',
    };

    for (const [key, col] of Object.entries(map)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(key === 'code' ? data[key].toUpperCase() : data[key]);
      }
    }

    if (fields.length === 0) throw { statusCode: 400, message: 'No fields to update' };

    values.push(id);
    const { rows } = await query(
      `UPDATE departments SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values
    );

    if (rows.length === 0) throw { statusCode: 404, message: 'Department not found' };
    await auditLog(userId, 'UPDATE_DEPARTMENT', 'department', id, null, rows[0]);
    return rows[0];
  }

  async delete(id, userId) {
    // Check for active employees
    const { rows: empCheck } = await query(
      `SELECT COUNT(*) as cnt FROM employees WHERE department_id = $1 AND deleted_at IS NULL AND employment_status = 'active'`,
      [id]
    );

    if (parseInt(empCheck[0].cnt) > 0) {
      throw { statusCode: 400, message: 'Cannot delete department with active employees' };
    }

    await query(
      'UPDATE departments SET deleted_at = NOW(), is_active = FALSE WHERE id = $1',
      [id]
    );
    await auditLog(userId, 'DELETE_DEPARTMENT', 'department', id);
  }

  async getAnalytics() {
    const { rows: overview } = await query(`
      SELECT
        COUNT(*) as total_departments,
        COUNT(*) FILTER (WHERE is_active = TRUE) as active_departments,
        SUM(COALESCE(budget, 0)) as total_budget
      FROM departments WHERE deleted_at IS NULL
    `);

    const { rows: bySize } = await query(`
      SELECT d.name, d.id, COUNT(e.id) as employee_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL AND e.employment_status = 'active'
      WHERE d.deleted_at IS NULL
      GROUP BY d.id, d.name
      ORDER BY employee_count DESC
    `);

    const { rows: recentHires } = await query(`
      SELECT d.name as department, COUNT(e.id) as count
      FROM employees e
      JOIN departments d ON e.department_id = d.id
      WHERE e.joining_date >= NOW() - INTERVAL '3 months' AND e.deleted_at IS NULL
      GROUP BY d.name
      ORDER BY count DESC
    `);

    return { overview: overview[0], bySize, recentHires };
  }
}

const deptService = new DepartmentService();

const getAll = async (req, res, next) => {
  try {
    const result = await deptService.getAll(req.query);
    return ApiResponse.paginated(res, result.departments, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const dept = await deptService.getById(req.params.id);
    return ApiResponse.success(res, dept);
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const dept = await deptService.create(req.body, req.user.id);
    return ApiResponse.created(res, dept, 'Department created');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const dept = await deptService.update(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, dept, 'Department updated');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deptService.delete(req.params.id, req.user.id);
    return ApiResponse.success(res, null, 'Department deleted');
  } catch (error) {
    if (error.statusCode) return ApiResponse.error(res, error.message, error.statusCode);
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await deptService.getAnalytics();
    return ApiResponse.success(res, analytics);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, getAnalytics };