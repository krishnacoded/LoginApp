const express = require('express');
const router = express.Router();
const deptController = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const departmentValidator = require('../validators/department.validator');

router.use(authenticate);

router.get('/', validate(departmentValidator.list, 'query'), deptController.getAll);
router.get('/analytics', authorize('admin', 'hr'), deptController.getAnalytics);
router.get('/:id', deptController.getById);
router.post('/', authorize('admin', 'hr'), validate(departmentValidator.create), deptController.create);
router.put('/:id', authorize('admin', 'hr'), validate(departmentValidator.update), deptController.update);
router.delete('/:id', authorize('admin'), deptController.remove);

module.exports = router;
