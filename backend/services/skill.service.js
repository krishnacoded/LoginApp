const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@peopleflow.io
 *               password:
 *                 type: string
 *                 example: Admin@123456
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authController.loginValidation, authController.login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 *     security: []
 */
router.post('/register', authController.registerValidation, authController.register);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     security: []
 */
router.post('/refresh', authController.refreshToken);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 */
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
const repository = require('../repositories/skill.repository');
const { query } = require('../config/database');
const { auditLog } = require('../middleware/audit');

class SkillService {
  async getCategories() {
    return repository.findCategories();
  }

  async createCategory(data) {
    const { rows } = await query(
      `INSERT INTO skill_categories (name, description, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.name, data.description || null, data.color || '#a3ff29', data.icon || null]
    );
    return rows[0];
  }

  async getAll(filters = {}) {
    return repository.findAll(filters);
  }

  async getById(id) {
    const skill = await repository.findById(id);
    if (!skill) throw { statusCode: 404, message: 'Skill not found' };
    const { rows: employees } = await query(
      `SELECT e.id, e.first_name, e.last_name, e.profile_picture_url, e.designation,
              es.proficiency_level, es.years_experience, d.name as department_name
       FROM employee_skills es
       JOIN employees e ON es.employee_id = e.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE es.skill_id = $1 AND e.deleted_at IS NULL
       ORDER BY es.proficiency_level DESC
       LIMIT 20`,
      [id]
    );
    return { ...skill, employees };
  }

  async create(data, userId, req) {
    const { rows } = await query(
      `INSERT INTO skills (name, category_id, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.name, data.categoryId || null, data.description || null]
    );
    await auditLog(userId, 'CREATE_SKILL', 'skill', rows[0].id, null, rows[0], req);
    return rows[0];
  }

  async update(id, data, userId, req) {
    const existing = await this.getById(id);
    const { rows } = await query(
      `UPDATE skills
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           description = COALESCE($3, description),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [data.name, data.categoryId, data.description, data.isActive, id]
    );
    if (!rows[0]) throw { statusCode: 404, message: 'Skill not found' };
    await auditLog(userId, 'UPDATE_SKILL', 'skill', id, existing, rows[0], req);
    return rows[0];
  }

  async remove(id, userId, req) {
    const existing = await this.getById(id);
    await query('UPDATE skills SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [id]);
    await auditLog(userId, 'DELETE_SKILL', 'skill', id, existing, null, req);
  }
}

module.exports = new SkillService();
