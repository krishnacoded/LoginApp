const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { authenticate, authorize, requirePermission } = require('../middleware/auth');
const validate = require('../middleware/validate');
const assetValidator = require('../validators/asset.validator');

router.use(authenticate);

/**
 * @swagger
 * /assets/my:
 *   get:
 *     tags: [Assets]
 *     summary: Get logged-in employee's allocated assets
 */
router.get('/my', assetController.getMyAssets);

router.get('/requests', assetController.getAssetRequests);
router.post('/requests', requirePermission('asset.request_apply'), assetController.createAssetRequest);
router.post('/requests/:id/approve', requirePermission('asset.request_approve'), assetController.approveAssetRequest);
router.post('/requests/:id/reject', requirePermission('asset.request_approve'), assetController.rejectAssetRequest);

/**
 * @swagger
 * /assets:
 *   get:
 *     tags: [Assets]
 *     summary: Get all assets (HR/Admin only)
 */
router.get('/', authorize('admin', 'hr'), requirePermission('asset.view'), validate(assetValidator.listQuery, 'query'), assetController.getAll);

/**
 * @swagger
 * /assets/{id}:
 *   get:
 *     tags: [Assets]
 *     summary: Get asset detail by ID (HR/Admin only)
 */
router.get('/:id', authorize('admin', 'hr'), requirePermission('asset.view'), assetController.getById);

/**
 * @swagger
 * /assets:
 *   post:
 *     tags: [Assets]
 *     summary: Create a new asset (HR/Admin only)
 */
router.post('/', authorize('admin', 'hr'), requirePermission('asset.create'), validate(assetValidator.create), assetController.createAsset);

/**
 * @swagger
 * /assets/{id}/allocate:
 *   post:
 *     tags: [Assets]
 *     summary: Allocate asset to employee (HR/Admin only)
 */
router.post('/:id/allocate', authorize('admin', 'hr'), requirePermission('asset.allocate'), validate(assetValidator.allocate), assetController.allocateAsset);

/**
 * @swagger
 * /assets/{id}/return:
 *   post:
 *     tags: [Assets]
 *     summary: Record asset return (HR/Admin only)
 */
router.post('/:id/return', authorize('admin', 'hr'), requirePermission('asset.allocate'), validate(assetValidator.returnAsset), assetController.returnAsset);

/**
 * @swagger
 * /assets/{id}/status:
 *   put:
 *     tags: [Assets]
 *     summary: Update asset status (HR/Admin only)
 */
router.put('/:id/status', authorize('admin', 'hr'), requirePermission('asset.manage_status'), validate(assetValidator.updateStatus), assetController.updateStatus);

module.exports = router;
