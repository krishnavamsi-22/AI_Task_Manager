const express = require('express');
const performanceController = require('../controllers/performanceController');
const { authMiddleware, isManager, isEmployee } = require('../middleware/auth');

const router = express.Router();

router.get('/employee/:id', authMiddleware, performanceController.getEmployeePerformance);
router.get('/my-performance', authMiddleware, isEmployee, performanceController.getMyPerformance);
router.get('/team', authMiddleware, isManager, performanceController.getTeamPerformance);

module.exports = router;
