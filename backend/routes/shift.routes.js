const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shift.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const shiftValidator = require('../validators/shift.validator');

router.use(authenticate);

/**
 * @swagger
 * /shifts:
 *   get:
 *     tags: [Shifts]
 *     summary: Get all shifts (Admin/HR/Manager)
 */
router.get('/', requirePermission('shift.view'), shiftController.getAll);

/**
 * @swagger
 * /shifts/{id}:
 *   get:
 *     tags: [Shifts]
 *     summary: Get shift by ID (Admin/HR/Manager)
 */
router.get('/:id', requirePermission('shift.view'), shiftController.getById);

/**
 * @swagger
 * /shifts:
 *   post:
 *     tags: [Shifts]
 *     summary: Create a new shift (Admin/HR)
 */
router.post('/', requirePermission('shift.manage'), validate(shiftValidator.createShift), shiftController.create);

/**
 * @swagger
 * /shifts/{id}:
 *   put:
 *     tags: [Shifts]
 *     summary: Update an existing shift (Admin/HR)
 */
router.put('/:id', requirePermission('shift.manage'), validate(shiftValidator.updateShift), shiftController.update);

/**
 * @swagger
 * /shifts/{id}:
 *   delete:
 *     tags: [Shifts]
 *     summary: Delete a shift (Admin/HR)
 */
router.delete('/:id', requirePermission('shift.manage'), shiftController.remove);

/**
 * @swagger
 * /shifts/assign:
 *   post:
 *     tags: [Shifts]
 *     summary: Assign a shift to an employee
 */
router.post('/assign', requirePermission('shift.manage'), validate(shiftValidator.assignShift), shiftController.assign);

/**
 * @swagger
 * /shifts/bulk-assign:
 *   post:
 *     tags: [Shifts]
 *     summary: Assign a shift to multiple employees or a department
 */
router.post('/bulk-assign', requirePermission('shift.manage'), validate(shiftValidator.bulkAssignShift), shiftController.bulkAssign);

module.exports = router;
