const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const WORK_HOURS_PER_DAY = 9;

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found in environment variables!');
} else {
  console.log('✅ GROQ_API_KEY loaded:', GROQ_API_KEY.substring(0, 10) + '...');
}

// Utility functions
const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const safeParseJSON = (raw) => {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');
    return JSON.parse(match[0]);
  } catch (error) {
    console.error('Parse error:', raw.slice(0, 200));
    throw new Error(`Invalid JSON: ${error.message}`);
  }
};

const ASSIGNMENT_PROMPT = `
You are a senior engineering manager.

**STEP 1: ANALYZE TASK COMPLEXITY (MANDATORY)**
Rate task difficulty 1-10 based on:
- Number of technical domains (frontend/backend/DB/DevOps)
- Dependencies/integration points
- Testing/validation requirements
- Novelty/learning curve

**STEP 2: DECIDE SUBTASK COUNT**
- 1-3 points: 1 subtask
- 4-6 points: 2-3 subtasks
- 7-10 points: 4-6 subtasks

**STEP 3: CREATE LOGICAL SUBTASKS**
Break into phases matching complexity score.

**STEP 4: ASSIGN EMPLOYEES (CRITICAL)**
For EACH subtask:
1. Check if ANY employee has the required skill → assign them
2. If NO employee has skill:
   - Assign based on matching ROLE (Frontend Dev → frontend tasks)
   - Mark isLearningSkill: true
   - Increase estimatedHours by 30-50%
   - Add new skill to updatedSkills array

**STEP 5: NEW EMPLOYEE ASSIGNMENT**
- LOW priority tasks → can assign to new/junior employees
- MEDIUM priority + simple tasks (≤6 hours) → can assign to new employees
- HIGH priority → only experienced employees

OUTPUT ONLY VALID JSON:
{
  "taskComplexity": {
    "difficultyScore": 7,
    "reasoning": "3 domains + heavy integration",
    "optimalSubtaskCount": 4
  },
  "inferredSkills": ["skill1", "skill2"],
  "assignments": [{
    "subtask": "Backend API Development",
    "primarySkill": "Node.js",
    "skillsUsed": ["node", "api"],
    "estimatedHours": 20,
    "assignedEmployees": [{
      "employeeId": "exact_id_from_input",
      "isLearningSkill": false,
      "updatedSkills": ["node", "api"]
    }]
  }]
}
`;

// Helper function for fallback role detection
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
  return 'Software Developer';
}

class AIService {
  async assignRoleFromSkills(skills, skillRatings = {}) {
    try {
      // Find the skill with highest proficiency
      let topSkill = skills[0];
      let topRating = skillRatings[topSkill] || 100;
      
      skills.forEach(skill => {
        const rating = skillRatings[skill] || 100;
        if (rating > topRating) {
          topSkill = skill;
          topRating = rating;
        }
      });

      const prompt = `
You are an HR expert. An employee has these skills with proficiency levels:

${skills.map(skill => `${skill}: ${skillRatings[skill] || 100}%`).join('\n')}

Their STRONGEST skill is: ${topSkill} (${topRating}%)

Based on their STRONGEST/MOST PROFICIENT skill, assign the most appropriate role:
- Frontend Developer
- Backend Developer
- Full-Stack Developer
- Mobile Developer
- DevOps Engineer
- AI/ML Engineer
- QA Engineer
- Data Engineer
- UI/UX Designer
- Software Architect

Focus on their strongest skill to determine the role. Respond with ONLY the role name.`;

      const response = await axios.post(GROQ_API_URL, {
        model: MODEL,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiRole = response.data.choices?.[0]?.message?.content?.trim();
      return aiRole || detectDeveloperRole(skills);
    } catch (error) {
      console.error('AI role assignment error:', error.message);
      return detectDeveloperRole(skills);
    }
  }

  async inferEmployeeRoleWithAI(skills) {
    try {
      const patterns = {
        frontend: ['react', 'vue', 'angular', 'html', 'css'],
        backend: ['node', 'api', 'database', 'python', 'java'],
        devops: ['docker', 'aws', 'kubernetes'],
        ai: ['ml', 'llm', 'tensorflow']
      };

      const skillsLower = skills.map(s => s.toLowerCase());
      let maxRole = 'Other';
      let maxCount = 0;

      for (const [role, pats] of Object.entries(patterns)) {
        const count = skillsLower.filter(s => pats.some(p => s.includes(p))).length;
        if (count > maxCount) {
          maxCount = count;
          maxRole = `${role.charAt(0).toUpperCase() + role.slice(1)} Developer`;
        }
      }

      return {
        role: maxRole,
        confidence: Math.min(95, maxCount * 25),
        reasoning: 'Pattern matching',
        suggestedSkillsToLearn: []
      };
    } catch (error) {
      console.error('Role inference error:', error.message);
      return {
        role: 'Software Developer',
        confidence: 50,
        reasoning: 'Fallback assignment',
        suggestedSkillsToLearn: []
      };
    }
  }
  async assignTaskToEmployees(task, employees) {
    try {
      console.log('=== Enhanced AI Task Assignment Request ===');
      console.log('Task:', { title: task.title, priority: task.priority, totalHours: task.totalHours });
      console.log('Employees:', employees.map(e => ({ uid: e.uid, name: e.name, skills: e.skills, role: e.developerRole })));
      
      const response = await axios.post(GROQ_API_URL, {
        model: MODEL,
        temperature: 0.1,
        messages: [
          { role: 'system', content: ASSIGNMENT_PROMPT },
          {
            role: 'user',
            content: JSON.stringify({
              task: {
                title: task.title,
                description: task.description,
                priority: task.priority || 'medium',
                totalHours: task.totalHours || 40
              },
              employees: employees.map(e => ({
                id: e.uid,
                name: e.name,
                role: e.developerRole || e.role,
                skills: e.skills || [],
                activeTasks: e.activeTasks || 0
              }))
            })
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices?.[0]?.message?.content;
      if (!aiResponse) throw new Error('Empty AI response');

      console.log('=== AI Raw Response ===');
      console.log(aiResponse);

      const result = safeParseJSON(aiResponse);
      console.log('=== AI Parsed Result ===');
      console.log(JSON.stringify(result, null, 2));
      
      if (!this.isValidAssignment(result)) {
        console.log('Invalid assignment, enforcing smart split...');
        const enhanced = this.enforceSmartSplit(result, task);
        return this.convertToSubtasks(enhanced, employees, task);
      }
      
      return this.convertToSubtasks(result, employees, task);

    } catch (error) {
      console.error('=== AI Assignment Error ===');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.log('Using fallback assignment...');
      return this.fallbackAssignment(task, employees);
    }
  }

  isValidAssignment(result) {
    return (
      result.taskComplexity?.difficultyScore &&
      Array.isArray(result.inferredSkills) &&
      Array.isArray(result.assignments) &&
      result.assignments.length > 0
    );
  }

  enforceSmartSplit(result, task) {
    const difficulty = result.taskComplexity?.difficultyScore || 5;
    const count = result.taskComplexity?.optimalSubtaskCount || 2;
    
    if (result.assignments?.length === count) return result;

    const totalHours = task.totalHours || 40;
    const hoursPerSubtask = totalHours / count;
    const templates = this.getPhaseTemplates(difficulty);
    
    return {
      ...result,
      assignments: templates.slice(0, count).map(t => ({
        subtask: `${task.title} - ${t.name}`,
        primarySkill: t.skill,
        skillsUsed: t.skills,
        estimatedHours: clamp(hoursPerSubtask, 4, 40),
        assignedEmployees: []
      }))
    };
  }

  getPhaseTemplates(difficulty) {
    if (difficulty <= 3) return [
      { name: 'Implementation', skill: 'Full-Stack', skills: [] }
    ];
    
    if (difficulty <= 6) return [
      { name: 'Core Development', skill: 'Backend', skills: ['api', 'database'] },
      { name: 'UI & Testing', skill: 'Frontend', skills: ['react', 'testing'] }
    ];
    
    return [
      { name: 'Research & Planning', skill: 'Architecture', skills: ['design'] },
      { name: 'Backend Implementation', skill: 'Backend', skills: ['node', 'api'] },
      { name: 'Frontend Development', skill: 'Frontend', skills: ['react', 'css'] },
      { name: 'Integration & Testing', skill: 'QA', skills: ['testing'] },
      { name: 'Deployment', skill: 'DevOps', skills: ['docker'] }
    ];
  }

  async updateEmployeePerformanceWithAI(task, employee) {
    try {
      const efficiency = clamp((task.estimatedHours / (task.actualHours || 1)) * 100, 50, 100);
      const score = task.completedOnTime ? efficiency : efficiency * 0.85;

      return {
        taskPerformanceScore: Math.round(score),
        updatedOverallPerformance: Math.round((employee.currentPerformance || 80) * 0.9 + score * 0.1),
        updatedSkillExpertise: (task.skills || []).reduce((acc, s) => {
          acc[s] = clamp((employee.currentSkillExpertise?.[s] || 70) + 5, 0, 100);
          return acc;
        }, {}),
        reasoning: 'Time efficiency based'
      };
    } catch (error) {
      console.error('Performance update error:', error.message);
      return {
        taskPerformanceScore: 75,
        updatedOverallPerformance: 75,
        updatedSkillExpertise: {},
        reasoning: 'Fallback scoring'
      };
    }
  }

  calculateTaskPerformanceScore(task, employeeSkillLevel) {
    const estimated = task.estimatedHours || 8;
    const actual = task.actualHours || estimated;
    const timeEfficiency = Math.min(100, (estimated / actual) * 100);
    const difficulty = Math.min(100, (task.skills?.length || 1) * 10);
    const skillFactor = employeeSkillLevel || 80;
    const score = timeEfficiency * 0.5 + skillFactor * 0.3 + (100 - difficulty) * 0.2;
    return Math.round(Math.max(50, Math.min(100, score)));
  }

  convertToSubtasks(validated, employees, originalTask) {
    const subtasks = [];

    // Validate AI result structure
    if (!validated.assignments || validated.assignments.length === 0) {
      console.warn('No assignments from AI, using fallback');
      return this.fallbackAssignment(originalTask, employees);
    }

    (validated.assignments || []).forEach(assignment => {
      let assignedEmployees = assignment.assignedEmployees || [];

      // Smart employee assignment if none provided by AI
      if (assignedEmployees.length === 0) {
        const emp = this.smartEmployeeSelection(employees, assignment, originalTask.priority);
        if (!emp) return;
        
        assignedEmployees = [{
          employeeId: emp.uid,
          isLearningSkill: !emp.skills?.some(s => assignment.skillsUsed?.includes(s.toLowerCase())),
          updatedSkills: emp.skills || []
        }];
      }

      assignedEmployees.forEach(ae => {
        const emp = employees.find(e => e.uid === ae.employeeId);
        if (!emp) {
          console.warn(`Employee ${ae.employeeId} not found`);
          return;
        }

        const estimatedHours = Math.max(4, Math.min(80, assignment.estimatedHours || 8));
        const adjustedHours = ae.isLearningSkill ? Math.round(estimatedHours * 1.4) : estimatedHours;
        
        subtasks.push({
          title: assignment.subtask,
          employeeId: emp.uid,
          employeeName: emp.name,
          reason: `${assignment.primarySkill || 'General'} - ${(assignment.skillsUsed || []).join(', ')}${ae.isLearningSkill ? ' (Learning)' : ''}`,
          estimatedHours: adjustedHours,
          daysNeeded: Math.ceil(adjustedHours / WORK_HOURS_PER_DAY),
          skills: assignment.skillsUsed || [],
          isLearningTask: ae.isLearningSkill,
          skillUpdates: ae.updatedSkills,
          complexity: validated.taskComplexity?.difficultyScore || 5,
          primarySkill: assignment.primarySkill
        });
      });
    });

    // If no subtasks created, use fallback
    if (subtasks.length === 0) {
      console.warn('No subtasks created, using fallback');
      return this.fallbackAssignment(originalTask, employees);
    }

    console.log(`Created ${subtasks.length} enhanced subtasks from AI response`);
    return {
      subtasks,
      inferredSkills: validated.inferredSkills || [],
      taskComplexity: validated.taskComplexity
    };
  }

  smartEmployeeSelection(employees, assignment, priority) {
    // Priority-based assignment logic
    const availableEmployees = employees.filter(e => (e.activeTasks || 0) < 3);
    
    if (priority === 'high') {
      // High priority: only experienced employees
      const experienced = availableEmployees.filter(e => 
        (e.performance?.tasksCompleted || 0) >= 5 && 
        (e.performance?.onTimeDelivery || 100) >= 80
      );
      if (experienced.length > 0) {
        return experienced.sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0];
      }
    }
    
    // Find employees with matching skills
    const skillMatches = availableEmployees.filter(e => 
      e.skills?.some(s => assignment.skillsUsed?.includes(s.toLowerCase()))
    );
    
    if (skillMatches.length > 0) {
      return skillMatches.sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0];
    }
    
    // Find employees with matching role
    const roleMatches = availableEmployees.filter(e => 
      e.developerRole?.toLowerCase().includes(assignment.primarySkill?.toLowerCase())
    );
    
    if (roleMatches.length > 0) {
      return roleMatches.sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0];
    }
    
    // Fallback: least loaded employee
    return availableEmployees.sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0))[0];
  }

  fallbackAssignment(task, employees) {
    console.log('=== Using Fallback Assignment ===');
    const sorted = employees.sort((a, b) => (a.activeTasks || 0) - (b.activeTasks || 0));
    const emp1 = sorted[0];
    const emp2 = sorted[1] || sorted[0];
    
    const totalHours = task.totalHours || 40;
    const mainHours = Math.round(totalHours * 0.7);
    const testHours = Math.round(totalHours * 0.3);

    console.log(`Creating 2 fallback subtasks: ${mainHours}h + ${testHours}h`);
    
    return {
      inferredSkills: task.requiredSkills || [],
      subtasks: [
        {
          title: `${task.title} - Implementation`,
          employeeId: emp1.uid,
          employeeName: emp1.name,
          reason: 'Fallback: Least loaded employee',
          estimatedHours: Math.max(4, Math.min(80, mainHours)),
          daysNeeded: Math.ceil(mainHours / WORK_HOURS_PER_DAY),
          skills: task.requiredSkills || [],
          isLearningTask: false
        },
        {
          title: `${task.title} - Testing & Review`,
          employeeId: emp2.uid,
          employeeName: emp2.name,
          reason: 'Fallback: Testing & QA',
          estimatedHours: Math.max(4, Math.min(20, testHours)),
          daysNeeded: Math.ceil(testHours / WORK_HOURS_PER_DAY),
          skills: ['testing'],
          isLearningTask: false
        }
      ]
    };
  }

  async extractTaskFieldsFromVoice(voiceText) {
    try {
      console.log('=== Extracting Task Fields from Voice ===');
      console.log('Voice Input:', voiceText);

      const prompt = `
You are an AI assistant that extracts task information from natural language.

Extract the following fields from the user's voice input:
- title: A concise task title (max 60 chars)
- description: Full task description
- skills: Array of required technical skills
- priority: "low", "medium", or "high"
- totalHours: Estimated hours (default 40 if not mentioned)

Voice Input: "${voiceText}"

Rules:
1. If priority not mentioned, use "medium"
2. If hours not mentioned, use 40
3. Extract all technical skills mentioned
4. Create a clear, professional title
5. Keep full context in description

Respond with ONLY valid JSON:
{
  "title": "string",
  "description": "string",
  "skills": ["skill1", "skill2"],
  "priority": "low|medium|high",
  "totalHours": number
}
`;

      const response = await axios.post(GROQ_API_URL, {
        model: MODEL,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices?.[0]?.message?.content;
      if (!aiResponse) throw new Error('Empty AI response');

      console.log('=== AI Extraction Response ===');
      console.log(aiResponse);

      const extracted = safeParseJSON(aiResponse);
      
      // Validate and set defaults
      return {
        title: extracted.title || 'New Task',
        description: extracted.description || voiceText,
        skills: Array.isArray(extracted.skills) ? extracted.skills.join(', ') : '',
        priority: ['low', 'medium', 'high'].includes(extracted.priority) ? extracted.priority : 'medium',
        totalHours: extracted.totalHours || 40
      };

    } catch (error) {
      console.error('=== Voice Extraction Error ===');
      console.error('Error:', error.message);
      
      // Fallback: return voice text as description
      return {
        title: 'New Task',
        description: voiceText,
        skills: '',
        priority: 'medium',
        totalHours: 40
      };
    }
  }
}

module.exports = new AIService();
