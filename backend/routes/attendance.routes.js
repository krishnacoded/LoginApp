const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const attendanceValidator = require('../validators/attendance.validator');

/**
 * @swagger
 * /attendance/sync/biometric:
 *   post:
 *     tags: [Attendance]
 *     summary: Sync biometric machine punches (Authenticated via X-API-KEY header)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - logs
 *             properties:
 *               logs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - employee_code
 *                     - timestamp
 *                     - punch_type
 *                   properties:
 *                     employee_code:
 *                       type: string
 *                       example: EMP001
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: 2026-06-12T08:50:00Z
 *                     punch_type:
 *                       type: string
 *                       enum: [in, out]
 *                       example: in
 *     responses:
 *       200:
 *         description: Logs synced successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/sync/biometric', attendanceController.syncBiometricLogs);

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
 * /attendance/break/start:
 *   post:
 *     tags: [Attendance]
 *     summary: Start break
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakType:
 *                 type: string
 *                 example: lunch
 *     responses:
 *       200:
 *         description: Break started successfully
 */
router.post('/break/start', attendanceController.startBreak);

/**
 * @swagger
 * /attendance/break/end:
 *   post:
 *     tags: [Attendance]
 *     summary: End break
 *     responses:
 *       200:
 *         description: Break ended successfully
 */
router.post('/break/end', attendanceController.endBreak);

/**
 * @swagger
 * /attendance/today:
 *   get:
 *     tags: [Attendance]
 *     summary: Get today's clock-in status
 */
router.get('/today', attendanceController.getTodayStatus);
router.get('/holidays', attendanceController.getHolidays);

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
router.get('/team-logs', authorize('admin', 'hr', 'manager'), requirePermission('attendance.view_team'), validate(attendanceValidator.listQuery, 'query'), attendanceController.getTeamLogs);

/**
 * @swagger
 * /attendance/all-logs:
 *   get:
 *     tags: [Attendance]
 *     summary: Get all attendance logs (Admin/HR only)
 */
router.get('/all-logs', authorize('admin', 'hr'), requirePermission('attendance.view_all'), validate(attendanceValidator.listQuery, 'query'), attendanceController.getAllLogs);

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
router.put('/settings', authorize('admin', 'hr'), requirePermission('attendance.manage_settings'), validate(attendanceValidator.updateSettings), attendanceController.updateSettings);

/**
 * @swagger
 * /attendance/stats:
 *   get:
 *     tags: [Attendance]
 *     summary: Get daily attendance overview stats (Admin/HR/Manager only)
 */
router.get('/stats', authorize('admin', 'hr', 'manager'), requirePermission('attendance.view_team'), attendanceController.getStats);

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

/**
 * @swagger
 * /attendance/sync-daily:
 *   post:
 *     tags: [Attendance]
 *     summary: Trigger manual daily attendance sync for a specific date (Admin/HR only)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-12
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post('/sync-daily', authorize('admin', 'hr'), requirePermission('shift.manage'), attendanceController.syncDaily);

/**
 * @swagger
 * /attendance/bulk-correct:
 *   post:
 *     tags: [Attendance]
 *     summary: Bulk create or update attendance logs (Admin/HR only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - corrections
 *             properties:
 *               corrections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - employeeId
 *                     - date
 *                   properties:
 *                     employeeId:
 *                       type: string
 *                       format: uuid
 *                     date:
 *                       type: string
 *                       format: date
 *                     clockIn:
 *                       type: string
 *                       format: date-time
 *                     clockOut:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                     workHours:
 *                       type: number
 *                     overtimeHours:
 *                       type: number
 *     responses:
 *       200:
 *         description: Bulk corrections processed successfully
 */
router.post('/bulk-correct', authorize('admin', 'hr'), requirePermission('shift.manage'), attendanceController.bulkCorrect);

module.exports = router;
