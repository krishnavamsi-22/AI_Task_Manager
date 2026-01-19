const express = require('express');
const employeeController = require('../controllers/employeeController');
const { authMiddleware, isManager } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, isManager, employeeController.addEmployee);
router.get('/', authMiddleware, isManager, employeeController.getEmployees);
router.get('/available', authMiddleware, isManager, employeeController.getAvailableEmployees);
router.get('/stats', authMiddleware, isManager, employeeController.getStats);
router.get('/:id', authMiddleware, isManager, employeeController.getEmployeeDetails);
router.put('/:id', authMiddleware, isManager, employeeController.updateEmployee);
router.patch('/:id/assign', authMiddleware, isManager, employeeController.assignToTeam);
router.delete('/:id', authMiddleware, isManager, employeeController.deleteEmployee);

module.exports = router;
