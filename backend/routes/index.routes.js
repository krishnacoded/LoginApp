const express = require('express');
const router = express.Router();

// Skills Routes
const skillController = require('../controllers/skill.controller');
const { authenticate, authorize } = require('../middleware/auth');

const skillRouter = express.Router();
skillRouter.use(authenticate);
skillRouter.get('/categories', skillController.getCategories);
skillRouter.post('/categories', authorize('admin', 'hr'), skillController.createCategory);
skillRouter.get('/stats', skillController.getStats);
skillRouter.get('/', skillController.getAll);
skillRouter.get('/:id', skillController.getById);
skillRouter.post('/', authorize('admin', 'hr'), skillController.create);
skillRouter.put('/:id', authorize('admin', 'hr'), skillController.update);
skillRouter.delete('/:id', authorize('admin'), skillController.remove);

// Leave Routes
const leaveController = require('../controllers/leave.controller');
const { uploadLeaveAttachment } = require('../middleware/upload');

const leaveRouter = express.Router();
leaveRouter.use(authenticate);
leaveRouter.get('/types', leaveController.getTypes);
leaveRouter.get('/stats', authorize('admin', 'hr', 'manager'), leaveController.getStats);
leaveRouter.get('/my-balance', leaveController.getMyBalance);
leaveRouter.get('/', leaveController.getAll);
leaveRouter.get('/:id', leaveController.getById);
leaveRouter.post('/', uploadLeaveAttachment, leaveController.apply);
leaveRouter.post('/:id/approve', authorize('admin', 'hr', 'manager'), leaveController.approve);
leaveRouter.post('/:id/reject', authorize('admin', 'hr', 'manager'), leaveController.reject);
leaveRouter.post('/:id/cancel', leaveController.cancel);
leaveRouter.get('/balance/:employeeId', authorize('admin', 'hr', 'manager'), leaveController.getBalance);

// Dashboard Routes
const dashboardController = require('../controllers/dashboard.controller');

const dashboardRouter = express.Router();
dashboardRouter.use(authenticate);
dashboardRouter.get('/overview', dashboardController.getOverview);
dashboardRouter.get('/employee-analytics', dashboardController.getEmployeeAnalytics);
dashboardRouter.get('/skill-analytics', dashboardController.getSkillAnalytics);

// Notification Routes
const notificationController = require('../controllers/notification.controller');

const notificationRouter = express.Router();
notificationRouter.use(authenticate);
notificationRouter.get('/', notificationController.getAll);
notificationRouter.post('/:id/read', notificationController.markRead);
notificationRouter.post('/read-all', notificationController.markAllRead);
notificationRouter.delete('/:id', notificationController.deleteNotification);

// Audit Routes
const auditController = require('../controllers/audit.controller');

const auditRouter = express.Router();
auditRouter.use(authenticate, authorize('admin', 'hr'));
auditRouter.get('/', auditController.getAll);
auditRouter.get('/:entityType/:entityId', auditController.getEntityLogs);

// Search Route
const searchRouter = express.Router();
searchRouter.use(authenticate);
searchRouter.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: { employees: [], departments: [], skills: [] } });

  const { query: dbQuery } = require('../config/database');
  const searchTerm = `%${q}%`;

  const [employees, departments, skills, leaves] = await Promise.all([
    dbQuery(
      `SELECT id, employee_code, first_name, last_name, designation, profile_picture_url
       FROM employees WHERE deleted_at IS NULL AND (
         first_name ILIKE $1 OR last_name ILIKE $1 OR employee_code ILIKE $1 OR designation ILIKE $1
       ) LIMIT 5`,
      [searchTerm]
    ),
    dbQuery(
      `SELECT id, name, code, description FROM departments WHERE deleted_at IS NULL AND (name ILIKE $1 OR code ILIKE $1) LIMIT 5`,
      [searchTerm]
    ),
    dbQuery(
      `SELECT id, name, description FROM skills WHERE is_active = TRUE AND name ILIKE $1 LIMIT 5`,
      [searchTerm]
    ),
    dbQuery(
      `SELECT lr.id, lr.status, lr.total_days, lt.name as leave_type, e.first_name, e.last_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       JOIN employees e ON lr.employee_id = e.id
       WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR lt.name ILIKE $1)
       LIMIT 5`,
      [searchTerm]
    ),
  ]);

  res.json({
    success: true,
    data: {
      employees: employees.rows,
      departments: departments.rows,
      skills: skills.rows,
      leaves: leaves.rows,
    },
  });
});

module.exports = { skillRouter, leaveRouter, dashboardRouter, notificationRouter, auditRouter, searchRouter };