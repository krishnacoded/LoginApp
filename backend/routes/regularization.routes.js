const express = require('express');
const router = express.Router();
const regularizationController = require('../controllers/regularization.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const regularizationValidator = require('../validators/regularization.validator');

router.use(authenticate);

/**
 * @swagger
 * /regularizations:
 *   post:
 *     tags: [Regularization]
 *     summary: Apply for attendance regularization
 */
router.post('/', requirePermission('attendance.regularize_apply'), validate(regularizationValidator.apply), regularizationController.apply);

/**
 * @swagger
 * /regularizations/my:
 *   get:
 *     tags: [Regularization]
 *     summary: Get logged-in employee's regularization requests
 */
router.get('/my', requirePermission('attendance.regularize_apply'), regularizationController.getMyRequests);

/**
 * @swagger
 * /regularizations/team:
 *   get:
 *     tags: [Regularization]
 *     summary: Get pending regularization requests for manager's team
 */
router.get('/team', requirePermission('attendance.regularize_approve'), regularizationController.getTeamRequests);

/**
 * @swagger
 * /regularizations/all:
 *   get:
 *     tags: [Regularization]
 *     summary: Get all regularization requests (Admin/HR only)
 */
router.get('/all', requirePermission('shift.manage'), regularizationController.getAllRequests);

/**
 * @swagger
 * /regularizations/{id}/review:
 *   post:
 *     tags: [Regularization]
 *     summary: Approve or reject a regularization request
 */
router.post('/:id/review', requirePermission('attendance.regularize_approve'), validate(regularizationValidator.review), regularizationController.review);

module.exports = router;
