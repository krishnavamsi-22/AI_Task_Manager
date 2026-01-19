const { auth } = require('../config/firebase');
const firebaseService = require('../services/firebaseService');
const { AppError } = require('../middlewares/errorHandler');

class AuthController {
  async registerManager(req, res, next) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw new AppError('Missing required fields', 400);
      }

      const userRecord = await auth.createUser({ email, password });

      const userData = {
        email,
        name,
        role: 'manager',
        skills: [],
        managerId: null,
        performance: {
          tasksCompleted: 0,
          onTimeDelivery: 100,
          skillExpertise: {},
          taskHistory: []
        },
        activeTasks: 0
      };

      await firebaseService.createUser(userRecord.uid, userData);

      const customToken = await auth.createCustomToken(userRecord.uid);

      res.status(201).json({
        success: true,
        message: 'Manager registered successfully',
        token: customToken,
        user: { uid: userRecord.uid, ...userData }
      });
    } catch (error) {
      next(error.code === 'auth/email-already-exists' 
        ? new AppError('Email already registered', 400) 
        : error);
    }
  }

  async registerEmployee(req, res, next) {
    try {
      const { email, password, name, skills, skillRatings } = req.body;

      if (!email || !password || !name) {
        throw new AppError('Missing required fields', 400);
      }

      const userRecord = await auth.createUser({ email, password });

      const skillsArray = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []);

      // Use AI to determine role based on strongest skill if skills provided
      let developerRole = 'Employee';
      if (skillsArray.length > 0) {
        const aiService = require('../services/aiService');
        developerRole = await aiService.assignRoleFromSkills(skillsArray, skillRatings || {});
      }

      const userData = {
        email,
        name,
        role: 'employee',
        skills: skillsArray,
        developerRole,
        managerId: null,
        performance: {
          tasksCompleted: 0,
          onTimeDelivery: 100,
          skillExpertise: {},
          taskHistory: []
        },
        activeTasks: 0
      };

      await firebaseService.createUser(userRecord.uid, userData);

      const customToken = await auth.createCustomToken(userRecord.uid);

      res.status(201).json({
        success: true,
        message: 'Employee registered successfully',
        token: customToken,
        user: { uid: userRecord.uid, ...userData }
      });
    } catch (error) {
      next(error.code === 'auth/email-already-exists' 
        ? new AppError('Email already registered', 400) 
        : error);
    }
  }

  detectDeveloperRole(skills) {
    return detectDeveloperRole(skills);
  }

  async login(req, res, next) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        throw new AppError('ID token required', 400);
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await firebaseService.getUser(decodedToken.uid);

      res.json({
        success: true,
        message: 'Login successful',
        user
      });
    } catch (error) {
      next(new AppError('Invalid credentials', 401));
    }
  }

  async getProfile(req, res, next) {
    try {
      res.json({
        success: true,
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSkills(req, res, next) {
    try {
      const { skills, performance } = req.body;
      
      if (!skills || !Array.isArray(skills)) {
        throw new AppError('Skills array is required', 400);
      }
      
      // Extract skill ratings from performance data
      const skillRatings = {};
      if (performance?.skillExpertise) {
        Object.keys(performance.skillExpertise).forEach(skill => {
          skillRatings[skill] = performance.skillExpertise[skill].avgRate || 100;
        });
      }
      
      // Use AI to determine role based on strongest skill
      const aiService = require('../services/aiService');
      const aiRole = await aiService.assignRoleFromSkills(skills, skillRatings);
      
      const updates = {
        skills,
        developerRole: aiRole,
        performance: performance || {
          tasksCompleted: 0,
          onTimeDelivery: 100,
          skillExpertise: {},
          taskHistory: []
        }
      };
      
      await firebaseService.updateUser(req.user.uid, updates);
      
      res.json({
        success: true,
        message: 'Skills updated successfully',
        assignedRole: aiRole
      });
    } catch (error) {
      console.error('Update skills error:', error);
      next(error);
    }
  }
}

// Helper function outside the class
function detectDeveloperRole(skills) {
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

module.exports = new AuthController();
