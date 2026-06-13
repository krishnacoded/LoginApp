const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verification.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/request', verificationController.create);
router.get('/pending', authorize('admin', 'hr', 'manager'), verificationController.getPending);
router.post('/:type/:id/action', authorize('admin', 'hr', 'manager'), verificationController.action);

module.exports = router;
