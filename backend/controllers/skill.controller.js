const { query } = require('../config/database');
const ApiResponse = require('../utils/response');
const { auditLog } = require('../middleware/audit');

// Skill Categories
const getCategories = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT sc.*, COUNT(s.id) as skill_count
       FROM skill_categories sc
       LEFT JOIN skills s ON s.category_id = sc.id AND s.is_active = TRUE
       WHERE sc.is_active = TRUE
       GROUP BY sc.id
       ORDER BY sc.name`
    );
    return ApiResponse.success(res, rows);
  } catch (error) { next(error); }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;
    const { rows } = await query(
      `INSERT INTO skill_categories (name, description, color, icon) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, color || '#4F46E5', icon || null]
    );
    return ApiResponse.created(res, rows[0]);
  } catch (error) {
    if (error.code === '23505') return ApiResponse.error(res, 'Category already exists', 409);
    next(error);
  }
};

// Skills
const getAll = async (req, res, next) => {
  try {
    const { search, categoryId, isActive } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`s.name ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }
    if (categoryId) {
      conditions.push(`s.category_id = $${idx++}`);
      params.push(categoryId);
    }
    if (isActive !== undefined) {
      conditions.push(`s.is_active = $${idx++}`);
      params.push(isActive === 'true');
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT s.*, sc.name as category_name, sc.color as category_color,
              COUNT(DISTINCT es.employee_id) as employee_count
       FROM skills s
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       LEFT JOIN employee_skills es ON es.skill_id = s.id
       ${where}
       GROUP BY s.id, sc.name, sc.color
       ORDER BY s.name`,
      params
    );
    return ApiResponse.success(res, rows);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT s.*, sc.name as category_name, sc.color as category_color
       FROM skills s
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) return ApiResponse.notFound(res);

    // Top employees with this skill
    const { rows: employees } = await query(
      `SELECT e.id, e.first_name, e.last_name, e.profile_picture_url, e.designation,
              es.proficiency_level, es.years_experience, d.name as department_name
       FROM employee_skills es
       JOIN employees e ON es.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE es.skill_id = $1 AND e.deleted_at IS NULL
       ORDER BY es.proficiency_level DESC
       LIMIT 10`,
      [req.params.id]
    );

    return ApiResponse.success(res, { ...rows[0], employees });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, categoryId, description } = req.body;
    const { rows } = await query(
      `INSERT INTO skills (name, category_id, description) VALUES ($1, $2, $3) RETURNING *`,
      [name, categoryId || null, description || null]
    );
    await auditLog(req.user.id, 'CREATE_SKILL', 'skill', rows[0].id, null, rows[0], req);
    return ApiResponse.created(res, rows[0]);
  } catch (error) {
    if (error.code === '23505') return ApiResponse.error(res, 'Skill already exists in this category', 409);
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, categoryId, description, isActive } = req.body;
    const { rows } = await query(
      `UPDATE skills SET name = COALESCE($1, name), category_id = COALESCE($2, category_id),
              description = COALESCE($3, description), is_active = COALESCE($4, is_active),
              updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, categoryId, description, isActive, req.params.id]
    );
    if (rows.length === 0) return ApiResponse.notFound(res);
    return ApiResponse.success(res, rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await query('UPDATE skills SET is_active = FALSE WHERE id = $1', [req.params.id]);
    return ApiResponse.success(res, null, 'Skill deactivated');
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const { rows: byCat } = await query(`
      SELECT sc.name as category, COUNT(DISTINCT s.id) as skill_count,
             COUNT(DISTINCT es.employee_id) as employee_count
      FROM skill_categories sc
      LEFT JOIN skills s ON s.category_id = sc.id AND s.is_active = TRUE
      LEFT JOIN employee_skills es ON es.skill_id = s.id
      GROUP BY sc.id, sc.name
      ORDER BY employee_count DESC
    `);

    const { rows: topSkills } = await query(`
      SELECT s.name, COUNT(DISTINCT es.employee_id) as employee_count,
             AVG(es.proficiency_level) as avg_proficiency
      FROM skills s
      LEFT JOIN employee_skills es ON es.skill_id = s.id
      WHERE s.is_active = TRUE
      GROUP BY s.id, s.name
      ORDER BY employee_count DESC
      LIMIT 10
    `);

    return ApiResponse.success(res, { byCategory: byCat, topSkills });
  } catch (error) { next(error); }
};

module.exports = { getCategories, createCategory, getAll, getById, create, update, remove, getStats };