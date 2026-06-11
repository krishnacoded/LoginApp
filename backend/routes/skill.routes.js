const express = require('express');
const skillController = require('../controllers/skill.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const skillValidator = require('../validators/skill.validator');

const router = express.Router();

router.use(authenticate);
router.get('/categories', skillController.getCategories);
router.post('/categories', authorize('admin', 'hr'), validate(skillValidator.createCategory), skillController.createCategory);
router.get('/stats', skillController.getStats);
router.get('/', validate(skillValidator.list, 'query'), skillController.getAll);
router.get('/:id', skillController.getById);
router.post('/', authorize('admin', 'hr'), validate(skillValidator.create), skillController.create);
router.put('/:id', authorize('admin', 'hr'), validate(skillValidator.update), skillController.update);
router.delete('/:id', authorize('admin'), skillController.remove);

module.exports = router;
