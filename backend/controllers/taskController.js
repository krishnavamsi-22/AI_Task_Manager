const firebaseService = require('../services/firebaseService');
const aiService = require('../services/aiService');
const performanceService = require('../services/performanceService');
const { AppError } = require('../middlewares/errorHandler');

class TaskController {
  async createTask(req, res, next) {
    try {
      const { title, description, skills, priority, totalHours } = req.body;

      if (!title || !description) {
        throw new AppError('Title and description required', 400);
      }

      const employees = await firebaseService.getEmployeesByManager(req.user.uid);

      if (employees.length === 0) {
        throw new AppError('No employees available', 400);
      }

      const requiredSkills = skills ? skills.split(',').map(s => s.trim()) : [];

      const aiResult = await aiService.assignTaskToEmployees({
        title,
        description,
        requiredSkills,
        priority: priority || 'medium',
        totalHours: parseFloat(totalHours) || 40
      }, employees);

      const createdTasks = [];

      for (const subtask of aiResult.subtasks) {
        const dueDate = new Date(Date.now() + subtask.daysNeeded * 24 * 60 * 60 * 1000);
        
        const taskData = {
          title: `${title} - ${subtask.title}`,
          description,
          requiredSkills,
          priority: priority || 'medium',
          status: 'assigned',
          assignedTo: subtask.employeeId,
          assignedEmployeeName: subtask.employeeName,
          aiReason: subtask.reason,
          estimatedHours: subtask.estimatedHours,
          daysNeeded: subtask.daysNeeded,
          dueDate: dueDate.toISOString(),
          isLearningTask: subtask.isLearningTask,
          createdBy: req.user.uid,
          createdAt: new Date().toISOString()
        };

        const task = await firebaseService.createTask(taskData);
        await firebaseService.incrementUserField(subtask.employeeId, 'activeTasks', 1);
        createdTasks.push(task);
      }

      res.status(201).json({
        success: true,
        message: `Created ${aiResult.subtasks.length} subtask(s)`,
        tasks: createdTasks,
        inferredSkills: aiResult.inferredSkills
      });
    } catch (error) {
      next(error);
    }
  }

  async extractTaskFromVoice(req, res, next) {
    try {
      console.log('=== Voice Extraction Request ===');
      console.log('Request body:', req.body);
      console.log('User:', req.user?.uid);
      
      const { voiceText } = req.body;

      if (!voiceText || typeof voiceText !== 'string' || voiceText.trim().length === 0) {
        console.log('Invalid voice text:', voiceText);
        throw new AppError('Valid voice text required', 400);
      }

      console.log('Processing voice text:', voiceText.substring(0, 100) + '...');
      
      const extractedData = await aiService.extractTaskFieldsFromVoice(voiceText.trim());
      
      console.log('Extracted data:', extractedData);

      res.json({
        success: true,
        data: extractedData,
        message: 'Voice input processed successfully'
      });
    } catch (error) {
      console.error('Voice extraction error:', error);
      next(error);
    }
  }

  async getManagerTasks(req, res, next) {
    try {
      const tasks = await firebaseService.getTasksByManager(req.user.uid);
      res.json({ success: true, tasks });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeTasks(req, res, next) {
    try {
      const tasks = await firebaseService.getTasksByEmployee(req.user.uid);
      
      // Sort by priority then deadline
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      tasks.sort((a, b) => {
        if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
      
      res.json({ success: true, tasks });
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const task = await firebaseService.getTask(id);
      if (task.createdBy !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      const updatedTask = await firebaseService.updateTask(id, updates);
      res.json({ success: true, task: updatedTask });
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const task = await firebaseService.getTask(id);

      if (task.createdBy !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      if (task.assignedTo && task.status !== 'completed') {
        await firebaseService.incrementUserField(task.assignedTo, 'activeTasks', -1);
      }

      await firebaseService.deleteTask(id);
      res.json({ success: true, message: 'Task deleted' });
    } catch (error) {
      next(error);
    }
  }

  async startTask(req, res, next) {
    try {
      const { id } = req.params;
      const task = await firebaseService.getTask(id);

      if (task.assignedTo !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      await firebaseService.updateTask(id, { status: 'in-progress' });
      res.json({ success: true, message: 'Task started' });
    } catch (error) {
      next(error);
    }
  }

  async completeTask(req, res, next) {
    try {
      const { id } = req.params;
      const { actualHours } = req.body;

      const task = await firebaseService.getTask(id);

      if (task.assignedTo !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      const completedAt = new Date().toISOString();
      const actualHoursNum = parseFloat(actualHours) || task.estimatedHours;
      const completedOnTime = new Date(completedAt) <= new Date(task.dueDate);
      
      // Use enhanced performance service
      const employee = await firebaseService.getUser(req.user.uid);
      const taskScore = performanceService.calculateTaskScore({
        ...task,
        actualHours: actualHoursNum,
        completedAt,
        completedOnTime
      }, employee);

      await firebaseService.updateTask(id, {
        status: 'completed',
        actualHours: actualHoursNum,
        taskPerformanceRate: taskScore,
        completedAt,
        completedOnTime
      });

      await firebaseService.incrementUserField(req.user.uid, 'activeTasks', -1);

      // Update employee performance using enhanced service
      const performanceResult = await performanceService.updateEmployeePerformance(
        req.user.uid, 
        taskScore, 
        {
          title: task.title,
          skills: task.requiredSkills || [],
          estimatedHours: task.estimatedHours,
          actualHours: actualHoursNum,
          complexity: task.complexity || 5
        }
      );

      // If this is a learning task, add new skills to employee's skills array and skillExpertise
      if (task.isLearningTask && task.requiredSkills && task.requiredSkills.length > 0) {
        const updatedEmployee = await firebaseService.getUser(req.user.uid);
        const currentSkills = updatedEmployee.skills || [];
        const newSkills = task.requiredSkills.filter(skill => 
          !currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())
        );
        
        if (newSkills.length > 0) {
          const updatedSkills = [...currentSkills, ...newSkills];
          await firebaseService.updateUser(req.user.uid, { skills: updatedSkills });
        }
      }

      res.json({ 
        success: true, 
        message: 'Task completed successfully', 
        taskScore,
        overallPerformance: performanceResult.overallPerformance,
        updatedSkills: performanceResult.updatedSkills
      });
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const task = await firebaseService.getTask(id);

      if (task.assignedTo !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      await firebaseService.updateTask(id, { status });
      res.json({ success: true, message: 'Status updated' });
    } catch (error) {
      next(error);
    }
  }

  async getPerformanceAnalytics(req, res, next) {
    try {
      const analytics = await performanceService.getPerformanceAnalytics(req.user.uid);
      res.json({ success: true, analytics });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
