const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const attendanceValidator = require('../validators/attendance.validator');

router.use(authenticate);

/**
 * @swagger
 * /attendance/clock-in:
 *   post:
 *     tags: [Attendance]
 *     summary: Clock In for today
 *     responses:
 *       200:
 *         description: Clocked in successfully
 */
router.post('/clock-in', attendanceController.clockIn);

/**
 * @swagger
 * /attendance/clock-out:
 *   post:
 *     tags: [Attendance]
 *     summary: Clock Out for today
 *     responses:
 *       200:
 *         description: Clocked out successfully
 */
router.post('/clock-out', attendanceController.clockOut);

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     tags: [Attendance]
 *     summary: Get today's clock-in status
 */
router.get('/today', attendanceController.getTodayStatus);

/**
 * @swagger
 * /attendance/my-logs:
 *   get:
 *     tags: [Attendance]
 *     summary: Get logged-in employee's attendance logs
 */
router.get('/my-logs', validate(attendanceValidator.listQuery, 'query'), attendanceController.getMyLogs);

/**
 * @swagger
 * /attendance/team-logs:
 *   get:
 *     tags: [Attendance]
 *     summary: Get team attendance logs (Managers only)
 */
router.get('/team-logs', authorize('admin', 'hr', 'manager'), validate(attendanceValidator.listQuery, 'query'), attendanceController.getTeamLogs);

/**
 * @swagger
 * /attendance/all-logs:
 *   get:
 *     tags: [Attendance]
 *     summary: Get all attendance logs (Admin/HR only)
 */
router.get('/all-logs', authorize('admin', 'hr'), validate(attendanceValidator.listQuery, 'query'), attendanceController.getAllLogs);

/**
 * @swagger
 * /attendance/settings:
 *   get:
 *     tags: [Attendance]
 *     summary: Get office attendance rules/settings
 */
router.get('/settings', attendanceController.getSettings);

/**
 * @swagger
 * /attendance/settings:
 *   put:
 *     tags: [Attendance]
 *     summary: Update office attendance rules/settings (Admin/HR only)
 */
router.put('/settings', authorize('admin', 'hr'), validate(attendanceValidator.updateSettings), attendanceController.updateSettings);

/**
 * @swagger
 * /attendance/stats:
 *   get:
 *     tags: [Attendance]
 *     summary: Get daily attendance overview stats (Admin/HR/Manager only)
 */
router.get('/stats', authorize('admin', 'hr', 'manager'), attendanceController.getStats);

/**
 * @swagger
 * /attendance/monthly:
 *   get:
 *     tags: [Attendance]
 *     summary: Get current employee's monthly attendance summary
 */
router.get('/monthly', attendanceController.getMonthlyStats);

/**
 * @swagger
 * /attendance/monthly/{employeeId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get specific employee's monthly attendance summary
 */
router.get('/monthly/:employeeId', authorize('admin', 'hr', 'manager'), attendanceController.getMonthlyStats);

module.exports = router;
