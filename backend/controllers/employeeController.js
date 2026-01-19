const firebaseService = require('../services/firebaseService');
const { AppError } = require('../middlewares/errorHandler');

class EmployeeController {
  async addEmployee(req, res, next) {
    try {
      const { email, password, name, skills, developerRole } = req.body;

      if (!email || !password || !name) {
        throw new AppError('Missing required fields', 400);
      }

      const { auth } = require('../config/firebase');
      const userRecord = await auth.createUser({ email, password });

      const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);
      
      // Auto-detect role if not specified
      let detectedRole = developerRole;
      if (!detectedRole || detectedRole === 'auto') {
        detectedRole = this.detectDeveloperRole(skillsArray);
      }

      const userData = {
        email,
        name,
        role: 'employee',
        skills: skillsArray,
        developerRole: detectedRole,
        managerId: req.user.uid,
        performance: {
          tasksCompleted: 0,
          onTimeDelivery: 100,
          skillExpertise: {},
          taskHistory: []
        },
        activeTasks: 0
      };

      await firebaseService.createUser(userRecord.uid, userData);

      res.status(201).json({
        success: true,
        message: 'Employee added successfully',
        employee: { uid: userRecord.uid, ...userData }
      });
    } catch (error) {
      next(error);
    }
  }

  detectDeveloperRole(skills) {
    const skillsLower = skills.map(s => s.toLowerCase());
    
    const frontendSkills = ['react', 'vue', 'angular', 'html', 'css', 'ui', 'ux', 'javascript', 'typescript'];
    const backendSkills = ['node', 'express', 'python', 'django', 'java', 'spring', 'api', 'database', 'mongodb', 'sql'];
    const devopsSkills = ['docker', 'kubernetes', 'aws', 'azure', 'ci/cd', 'jenkins', 'terraform', 'linux'];
    const aiSkills = ['machine learning', 'ai', 'tensorflow', 'pytorch', 'nlp', 'deep learning', 'data science'];
    const mobileSkills = ['react native', 'flutter', 'ios', 'android', 'swift', 'kotlin'];
    const qaSkills = ['testing', 'selenium', 'jest', 'cypress', 'qa', 'test automation'];
    
    const frontendCount = skillsLower.filter(s => frontendSkills.some(fs => s.includes(fs))).length;
    const backendCount = skillsLower.filter(s => backendSkills.some(bs => s.includes(bs))).length;
    const devopsCount = skillsLower.filter(s => devopsSkills.some(ds => s.includes(ds))).length;
    const aiCount = skillsLower.filter(s => aiSkills.some(as => s.includes(as))).length;
    const mobileCount = skillsLower.filter(s => mobileSkills.some(ms => s.includes(ms))).length;
    const qaCount = skillsLower.filter(s => qaSkills.some(qs => s.includes(qs))).length;
    
    if (aiCount >= 2) return 'AI/ML Engineer';
    if (mobileCount >= 2) return 'Mobile Developer';
    if (devopsCount >= 2) return 'DevOps Engineer';
    if (qaCount >= 2) return 'QA Engineer';
    if (frontendCount >= 2 && backendCount >= 2) return 'Full-Stack Developer';
    if (frontendCount >= 2) return 'Frontend Developer';
    if (backendCount >= 2) return 'Backend Developer';
    return 'Other';
  }

  async getEmployees(req, res, next) {
    try {
      const employees = await firebaseService.getEmployeesByManager(req.user.uid);
      res.json({ success: true, employees });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeDetails(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await firebaseService.getUser(id);

      if (employee.managerId !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      res.json({ success: true, employee });
    } catch (error) {
      next(error);
    }
  }

  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const employee = await firebaseService.getUser(id);

      if (employee.managerId !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      const updatedEmployee = await firebaseService.updateUser(id, updates);
      res.json({ success: true, employee: updatedEmployee });
    } catch (error) {
      next(error);
    }
  }

  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const employee = await firebaseService.getUser(id);

      if (employee.managerId !== req.user.uid) {
        throw new AppError('Unauthorized', 403);
      }

      await firebaseService.deleteUser(id);
      res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableEmployees(req, res, next) {
    try {
      const employees = await firebaseService.getAvailableEmployees();
      res.json({ success: true, employees });
    } catch (error) {
      next(error);
    }
  }

  async assignToTeam(req, res, next) {
    try {
      const { id } = req.params;
      await firebaseService.updateUser(id, { managerId: req.user.uid });
      res.json({ success: true, message: 'Employee added to team' });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const employees = await firebaseService.getEmployeesByManager(req.user.uid);
      const tasks = await firebaseService.getTasksByManager(req.user.uid);

      const stats = {
        totalEmployees: employees.length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        avgPerformance: employees.reduce((sum, e) => sum + (e.performance?.onTimeDelivery || 80), 0) / (employees.length || 1)
      };

      res.json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeeController();
