const { query } = require('../config/database');

class SkillRepository {
  async findCategories() {
    const { rows } = await query(
      `SELECT sc.*, COUNT(s.id) as skill_count
       FROM skill_categories sc
       LEFT JOIN skills s ON s.category_id = sc.id AND s.is_active = TRUE
       WHERE sc.is_active = TRUE
       GROUP BY sc.id
       ORDER BY sc.name`
    );
    return rows;
  }

  async findAll({ search, categoryId, isActive } = {}) {
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
      params.push(isActive === true || isActive === 'true');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
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
    return rows;
  }

  async findById(id) {
    const { rows } = await query(
      `SELECT s.*, sc.name as category_name, sc.color as category_color
       FROM skills s
       LEFT JOIN skill_categories sc ON s.category_id = sc.id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = new SkillRepository();
