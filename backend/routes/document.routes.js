const express = require('express');
const documentController = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);
router.get('/', authorize('admin', 'hr', 'manager', 'employee'), documentController.getAll);
router.patch('/:id/verify', authorize('admin', 'hr'), documentController.verify);
router.get('/employees/:employeeId', documentController.getEmployeeDocuments);
router.post('/employees/:employeeId', (req, res, next) => {
  if (req.user.role_name === 'employee' && req.params.employeeId === req.user.employee_id) {
    return next();
  }
  return authorize('admin', 'hr', 'manager')(req, res, next);
}, uploadDocument, documentController.upload);
router.delete('/employees/:employeeId/:id', authorize('admin', 'hr'), documentController.deleteDocument);
router.get('/employees/:employeeId/:id/download', documentController.download);

module.exports = router;
