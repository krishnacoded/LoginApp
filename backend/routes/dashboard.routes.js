const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/overview', dashboardController.getOverview);
router.get('/employee-analytics', dashboardController.getEmployeeAnalytics);
router.get('/skill-analytics', dashboardController.getSkillAnalytics);

module.exports = router;
