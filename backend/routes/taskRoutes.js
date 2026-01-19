const express = require('express');
const taskController = require('../controllers/taskController');
const { authMiddleware, isManager, isEmployee } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, isManager, taskController.createTask);
router.post('/extract-voice', authMiddleware, isManager, taskController.extractTaskFromVoice);
router.get('/manager', authMiddleware, isManager, taskController.getManagerTasks);
router.get('/employee', authMiddleware, isEmployee, taskController.getEmployeeTasks);
router.get('/analytics', authMiddleware, isEmployee, taskController.getPerformanceAnalytics);
router.put('/:id', authMiddleware, isManager, taskController.updateTask);
router.delete('/:id', authMiddleware, isManager, taskController.deleteTask);
router.patch('/:id/start', authMiddleware, isEmployee, taskController.startTask);
router.patch('/:id/complete', authMiddleware, isEmployee, taskController.completeTask);
router.patch('/:id/status', authMiddleware, isEmployee, taskController.updateTaskStatus);

module.exports = router;
