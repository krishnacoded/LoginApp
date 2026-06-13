const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const { attachDataScope } = require('../middleware/dataScope');
const { uploadProfile, uploadDocument } = require('../middleware/upload');
const validate = require('../middleware/validate');
const employeeValidator = require('../validators/employee.validator');

router.use(authenticate, attachDataScope);

/**
 * @swagger
 * /employees:
 *   get:
 *     tags: [Employees]
 *     summary: Get all employees with filters and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 */
router.get('/', validate(employeeValidator.list, 'query'), employeeController.getAll);

/**
 * @swagger
 * /employees/stats:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee statistics
 */
router.get('/stats', authorize('admin', 'hr', 'manager'), employeeController.getStats);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     summary: Get employee by ID
 */
router.get('/:id', employeeController.getById);

/**
 * @swagger
 * /employees:
 *   post:
 *     tags: [Employees]
 *     summary: Create new employee
 */
router.post('/', authorize('admin', 'hr'), requirePermission('employee.create'), validate(employeeValidator.create), employeeController.create);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     tags: [Employees]
 *     summary: Update employee
 */
router.put('/:id', validate(employeeValidator.update), employeeController.update);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     tags: [Employees]
 *     summary: Soft delete employee
 */
router.delete('/:id', authorize('admin', 'hr'), requirePermission('employee.delete'), employeeController.remove);

/**
 * @swagger
 * /employees/{id}/restore:
 *   post:
 *     tags: [Employees]
 *     summary: Restore deleted employee
 */
router.post('/:id/restore', authorize('admin', 'hr'), employeeController.restore);

/**
 * @swagger
 * /employees/{id}/profile-picture:
 *   post:
 *     tags: [Employees]
 *     summary: Upload profile picture
 */
router.post('/:id/profile-picture', requirePermission('employee.edit'), uploadProfile, employeeController.uploadProfilePicture);

/**
 * @swagger
 * /employees/{id}/direct-reports:
 *   get:
 *     tags: [Employees]
 *     summary: Get direct reports for an employee
 */
router.get('/:id/direct-reports', employeeController.getDirectReports);

// Document routes under employee
router.get('/:employeeId/documents', documentController.getEmployeeDocuments);
router.post('/:employeeId/documents', uploadDocument, documentController.upload);
router.delete('/:employeeId/documents/:id', documentController.deleteDocument);
router.get('/:employeeId/documents/:id/download', documentController.download);

module.exports = router;
