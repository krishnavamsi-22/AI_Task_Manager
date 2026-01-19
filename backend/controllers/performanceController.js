const firebaseService = require('../services/firebaseService');
const { AppError } = require('../middlewares/errorHandler');

class PerformanceController {
  async getEmployeePerformance(req, res, next) {
    try {
      const { id } = req.params;
      
      if (req.user.role === 'employee' && req.user.uid !== id) {
        throw new AppError('Unauthorized', 403);
      }

      const employee = await firebaseService.getUser(id);
      
      if (req.user.role === 'manager' && employee.managerId !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      const metrics = await firebaseService.getPerformanceMetrics(id);
      const tasks = await firebaseService.getTasksByEmployee(id);

      res.json({
        success: true,
        performance: {
          currentScore: employee.performance,
          activeTasks: employee.activeTasks,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          recentMetrics: metrics.slice(0, 10)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyPerformance(req, res, next) {
    try {
      const metrics = await firebaseService.getPerformanceMetrics(req.user.uid);
      const tasks = await firebaseService.getTasksByEmployee(req.user.uid);

      res.json({
        success: true,
        performance: {
          currentScore: req.user.performance,
          activeTasks: req.user.activeTasks,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          totalTasks: tasks.length,
          recentMetrics: metrics.slice(0, 10)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getTeamPerformance(req, res, next) {
    try {
      const employees = await firebaseService.getEmployeesByManager(req.user.uid);
      
      const teamPerformance = await Promise.all(
        employees.map(async (emp) => {
          const metrics = await firebaseService.getPerformanceMetrics(emp.uid);
          const tasks = await firebaseService.getTasksByEmployee(emp.uid);
          
          return {
            employeeId: emp.uid,
            name: emp.name,
            performance: emp.performance,
            activeTasks: emp.activeTasks,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            recentScore: metrics[0]?.score || emp.performance
          };
        })
      );

      res.json({ success: true, teamPerformance });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PerformanceController();
