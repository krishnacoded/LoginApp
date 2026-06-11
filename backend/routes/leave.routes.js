const express = require('express');
const leaveController = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadLeaveAttachment } = require('../middleware/upload');
const validate = require('../middleware/validate');
const leaveValidator = require('../validators/leave.validator');

const router = express.Router();

router.use(authenticate);
router.get('/types', leaveController.getTypes);
router.get('/stats', authorize('admin', 'hr', 'manager'), leaveController.getStats);
router.get('/my-balance', leaveController.getMyBalance);
router.get('/balance/:employeeId', authorize('admin', 'hr', 'manager'), leaveController.getBalance);
router.get('/', leaveController.getAll);
router.get('/:id', leaveController.getById);
router.post('/', uploadLeaveAttachment, validate(leaveValidator.apply), leaveController.apply);
router.post('/:id/approve', authorize('admin', 'hr', 'manager'), validate(leaveValidator.decision), leaveController.approve);
router.post('/:id/reject', authorize('admin', 'hr', 'manager'), validate(leaveValidator.rejection), leaveController.reject);
router.post('/:id/cancel', validate(leaveValidator.cancel), leaveController.cancel);

module.exports = router;
