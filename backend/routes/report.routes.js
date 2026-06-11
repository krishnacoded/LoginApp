const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Secure all reporting endpoints: Admin, HR, and Manager roles only
router.use(authenticate);
router.use(authorize('admin', 'hr', 'manager'));

/**
 * @swagger
 * /reports/leaves:
 *   get:
 *     tags: [Reports]
 *     summary: Export leave requests report (CSV, XLSX, PDF)
 */
router.get('/leaves', reportController.exportLeaves);

/**
 * @swagger
 * /reports/attendance:
 *   get:
 *     tags: [Reports]
 *     summary: Export attendance logs report (CSV, XLSX, PDF)
 */
router.get('/attendance', reportController.exportAttendance);

/**
 * @swagger
 * /reports/assets:
 *   get:
 *     tags: [Reports]
 *     summary: Export asset inventory and allocation report (CSV, XLSX, PDF)
 */
router.get('/assets', reportController.exportAssets);

module.exports = router;
