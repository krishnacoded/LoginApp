const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const roleValidator = require('../validators/role.validator');

router.use(authenticate);

/**
 * @swagger
 * /roles/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: Get all available permissions grouped by module
 */
router.get('/permissions', requirePermission('role.view'), roleController.getPermissions);

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles
 */
router.get('/', requirePermission('role.view'), roleController.getAll);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get role by ID with full permissions list
 */
router.get('/:id', requirePermission('role.view'), roleController.getById);

/**
 * @swagger
 * /roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a new custom role
 */
router.post('/', requirePermission('role.create'), validate(roleValidator.create), roleController.create);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     tags: [Roles]
 *     summary: Update a role's name, description, and/or permissions
 */
router.put('/:id', requirePermission('role.edit'), validate(roleValidator.update), roleController.update);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a custom role (system roles cannot be deleted)
 */
router.delete('/:id', requirePermission('role.delete'), roleController.remove);

/**
 * @swagger
 * /roles/users/{userId}/roles:
 *   get:
 *     tags: [Roles]
 *     summary: Get all roles assigned to a user
 */
router.get('/users/:userId/roles', requirePermission('role.view'), roleController.getUserRoles);

/**
 * @swagger
 * /roles/users/{userId}/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Assign a role to a user
 */
router.post('/users/:userId/roles', requirePermission('role.assign'), validate(roleValidator.assignRole), roleController.assignRole);

/**
 * @swagger
 * /roles/users/{userId}/roles/{roleId}:
 *   delete:
 *     tags: [Roles]
 *     summary: Remove a role from a user
 */
router.delete('/users/:userId/roles/:roleId', requirePermission('role.assign'), roleController.removeRole);

module.exports = router;
