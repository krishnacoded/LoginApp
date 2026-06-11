const express = require('express');
const auditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin', 'hr'));
router.get('/', auditController.getAll);
router.get('/:entityType/:entityId', auditController.getEntityLogs);

module.exports = router;
