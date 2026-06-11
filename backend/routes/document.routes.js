const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin', 'hr', 'manager', 'employee'), documentController.getAll);
router.patch('/:id/verify', authorize('admin', 'hr'), documentController.verify);
router.get('/employees/:employeeId', documentController.getEmployeeDocuments);
router.post('/employees/:employeeId', authorize('admin', 'hr', 'manager'), uploadDocument, documentController.upload);
router.delete('/employees/:employeeId/:id', authorize('admin', 'hr'), documentController.deleteDocument);
router.get('/employees/:employeeId/:id/download', documentController.download);

module.exports = router;
