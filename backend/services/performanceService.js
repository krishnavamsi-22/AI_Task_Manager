const firebaseService = require('./firebaseService');

class PerformanceService {
  calculateTaskScore(task, employee) {
    const estimated = task.estimatedHours || 8;
    const actual = task.actualHours || estimated;
    const completedAt = new Date(task.completedAt || Date.now()).getTime();
    const deadline = new Date(task.dueDate || Date.now() + 86400000 * 7).getTime();
    
    // Multi-factor scoring
    const timeEfficiency = Math.min(100, (estimated / actual) * 100);
    const difficulty = Math.min(100, (task.skills?.length || 1) * 10);
    const skillLevel = this.getEmployeeSkillLevel(employee, task.skills || []);
    
    // Deadline adherence
    let deadlineScore = 100;
    if (completedAt > deadline) {
      const daysLate = (completedAt - deadline) / 86400000;
      deadlineScore = Math.max(50, 100 - (daysLate * 10));
    } else {
      const daysEarly = (deadline - completedAt) / 86400000;
      deadlineScore = Math.min(100, 100 + (daysEarly * 2));
    }
    
    // Weighted score calculation
    const score = (
      timeEfficiency * 0.4 +
      skillLevel * 0.3 +
      deadlineScore * 0.2 +
      (100 - difficulty) * 0.1
    );
    
    return Math.round(Math.max(50, Math.min(100, score)));
  }

  getEmployeeSkillLevel(employee, taskSkills) {
    if (!employee.performance?.skillExpertise || taskSkills.length === 0) {
      return 75; // Default skill level
    }
    
    const relevantSkills = taskSkills.filter(skill => 
      employee.performance.skillExpertise[skill.toLowerCase()]
    );
    
    if (relevantSkills.length === 0) return 60; // No matching skills
    
    const avgSkillLevel = relevantSkills.reduce((sum, skill) => 
      sum + (employee.performance.skillExpertise[skill.toLowerCase()]?.avgRate || 70), 0
    ) / relevantSkills.length;
    
    return Math.round(avgSkillLevel);
  }

  async updateEmployeePerformance(employeeId, taskScore, taskData) {
    try {
      const employee = await firebaseService.getUser(employeeId);
      const currentPerformance = employee.performance || {
        tasksCompleted: 0,
        onTimeDelivery: 100,
        skillExpertise: {},
        taskHistory: []
      };
      
      // Update task history
      const taskHistory = currentPerformance.taskHistory || [];
      taskHistory.unshift({
        taskName: taskData.title,
        taskPerformance: taskScore,
        skills: taskData.skills || [],
        estimatedHours: taskData.estimatedHours,
        actualHours: taskData.actualHours,
        completedAt: new Date().toISOString()
      });
      
      // Keep only last 20 tasks
      if (taskHistory.length > 20) taskHistory.splice(20);
      
      // Calculate new overall performance
      const recentScores = taskHistory.slice(0, 10).map(t => t.taskPerformance);
      const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      // Update skill expertise
      const skillExpertise = { ...currentPerformance.skillExpertise };
      (taskData.skills || []).forEach(skill => {
        const skillKey = skill.toLowerCase();
        const currentSkill = skillExpertise[skillKey];
        
        if (currentSkill) {
          // Update existing skill
          const newRate = Math.round((currentSkill.avgRate * currentSkill.count + taskScore) / (currentSkill.count + 1));
          skillExpertise[skillKey] = {
            avgRate: Math.min(100, Math.max(0, newRate)),
            count: currentSkill.count + 1,
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Initialize new skill with task score
          skillExpertise[skillKey] = {
            avgRate: Math.min(100, Math.max(0, taskScore)),
            count: 1,
            lastUpdated: new Date().toISOString()
          };
        }
      });
      
      // Calculate on-time delivery rate as average of all task performance scores
      const onTimeDelivery = taskHistory.length > 0 ? 
        Math.round(taskHistory.reduce((sum, t) => sum + t.taskPerformance, 0) / taskHistory.length) : 100;
      
      const updatedPerformance = {
        tasksCompleted: currentPerformance.tasksCompleted + 1,
        onTimeDelivery,
        skillExpertise,
        taskHistory,
        lastUpdated: new Date().toISOString()
      };
      
      await firebaseService.updateUser(employeeId, {
        performance: updatedPerformance
      });
      
      return {
        taskScore,
        overallPerformance: Math.round(avgScore),
        updatedSkills: Object.keys(skillExpertise)
      };
    } catch (error) {
      console.error('Performance update error:', error);
      throw error;
    }
  }

  async createPerformanceRecord(taskId, employeeId, score, details) {
    return await firebaseService.createPerformanceMetric({
      taskId,
      employeeId,
      score,
      details,
      timestamp: new Date().toISOString()
    });
  }

  async getPerformanceAnalytics(employeeId) {
    try {
      const employee = await firebaseService.getUser(employeeId);
      const performance = employee.performance || {};
      
      return {
        overallScore: performance.onTimeDelivery || 100,
        tasksCompleted: performance.tasksCompleted || 0,
        skillExpertise: performance.skillExpertise || {},
        recentTrend: this.calculateTrend(performance.taskHistory || []),
        strengths: this.identifyStrengths(performance.skillExpertise || {}),
        improvementAreas: this.identifyImprovementAreas(performance.taskHistory || [])
      };
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        overallScore: 75,
        tasksCompleted: 0,
        skillExpertise: {},
        recentTrend: 'stable',
        strengths: [],
        improvementAreas: []
      };
    }
  }

  calculateTrend(taskHistory) {
    if (taskHistory.length < 3) return 'stable';
    
    const recent = taskHistory.slice(0, 3).map(t => t.taskPerformance);
    const older = taskHistory.slice(3, 6).map(t => t.taskPerformance);
    
    if (older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg + 5) return 'improving';
    if (recentAvg < olderAvg - 5) return 'declining';
    return 'stable';
  }

  identifyStrengths(skillExpertise) {
    return Object.entries(skillExpertise)
      .filter(([_, data]) => data.avgRate >= 85)
      .map(([skill, _]) => skill)
      .slice(0, 3);
  }

  identifyImprovementAreas(taskHistory) {
    const lowPerformanceTasks = taskHistory
      .filter(t => t.taskPerformance < 70)
      .slice(0, 3);
    
    return lowPerformanceTasks.map(t => ({
      area: t.skills?.[0] || 'General',
      score: t.taskPerformance,
      suggestion: 'Consider additional training or mentoring'
    }));
  }
}

module.exports = new PerformanceService();
