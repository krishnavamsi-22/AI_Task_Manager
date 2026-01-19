import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Button, Badge } from '@mui/material';
import { FilterList as FilterListIcon } from '@mui/icons-material';
import api from '../config/api';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [actualHours, setActualHours] = useState('');
  const [showPerformance, setShowPerformance] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [showSkillsSetup, setShowSkillsSetup] = useState(false);
  const [skillsInput, setSkillsInput] = useState('');
  const [skillRatings, setSkillRatings] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({ priority: '', status: '', deadline: '', skill: '' });
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    loadTasks();
    loadEmployeeData();
    loadAnalytics();
    const interval = setInterval(() => {
      loadTasks();
      loadEmployeeData();
      loadAnalytics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const token = await user.getIdToken?.() || '';
      const response = await api.get('/api/tasks/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Analytics load error:', error);
    }
  };

  const loadEmployeeData = async () => {
    try {
      const token = await user.getIdToken?.() || '';
      const response = await api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeData(response.data.user);
      
      // Show skills setup if no skills
      if (!response.data.user.skills || response.data.user.skills.length === 0) {
        setShowSkillsSetup(true);
      }
    } catch (error) {
      console.error('Load employee data error:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const token = await user.getIdToken?.() || '';
      const response = await api.get('/api/tasks/employee', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load tasks');
    }
  };

  const handleStartTask = async (taskId) => {
    try {
      const token = await user.getIdToken?.() || '';
      await api.patch(`/api/tasks/${taskId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.info('Task started!');
      loadTasks();
    } catch (error) {
      toast.error('Failed to start task');
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask || !actualHours) return;
    
    try {
      const token = await user.getIdToken?.() || '';
      await api.patch(`/api/tasks/${selectedTask.id}/complete`, 
        { actualHours: parseFloat(actualHours) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Task completed successfully!');
      setSelectedTask(null);
      setActualHours('');
      loadTasks();
      loadEmployeeData();
      loadAnalytics();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleSkillsSetup = async (e) => {
    e.preventDefault();
    try {
      const token = await user.getIdToken?.() || '';
      const skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
      const skillExpertise = {};
      
      skills.forEach(skill => {
        const rating = skillRatings[skill] || 100;
        skillExpertise[skill.toLowerCase()] = {
          avgRate: rating,
          count: 0,
          lastUpdated: new Date().toISOString()
        };
      });

      const response = await api.put('/api/auth/profile/skills', {
        skills,
        performance: {
          tasksCompleted: 0,
          onTimeDelivery: 100,
          skillExpertise,
          taskHistory: []
        }
      }, { headers: { Authorization: `Bearer ${token}` } });

      setShowSkillsSetup(false);
      
      const assignedRole = response.data.assignedRole;
      if (assignedRole) {
        toast.success(`🤖 AI assigned you the role: ${assignedRole}`);
      } else {
        toast.success('Skills updated successfully!');
      }
      
      loadEmployeeData();
    } catch (error) {
      toast.error('Failed to update skills');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  
  // Apply filters
  const filteredTasks = tasks.filter(task => {
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.status) {
      const statusMap = { 'pending': 'assigned', 'in-progress': 'in-progress', 'completed': 'completed' };
      if (task.status !== statusMap[filters.status]) return false;
    }
    if (filters.deadline && task.deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const taskDeadline = new Date(task.deadline);
      taskDeadline.setHours(0, 0, 0, 0);
      
      if (filters.deadline === 'today' && taskDeadline.getTime() !== today.getTime()) return false;
      if (filters.deadline === 'tomorrow') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (taskDeadline.getTime() !== tomorrow.getTime()) return false;
      }
      if (filters.deadline === 'week') {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (taskDeadline < today || taskDeadline > weekEnd) return false;
      }
      if (filters.deadline === 'overdue' && taskDeadline >= today) return false;
    }
    if (filters.skill && task.requiredSkills && !task.requiredSkills.some(s => s.toLowerCase().includes(filters.skill.toLowerCase()))) return false;
    return true;
  });
  
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Completed tasks always at bottom
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    
    // Sort by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Sort by deadline (earliest first)
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    
    return 0;
  });

  return (
    <div className="employee-dashboard">
      
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back{employeeData?.name ? `, ${employeeData.name}` : ''}! 👋</h1>
          <p>Ready to tackle your tasks today?</p>
          {employeeData?.developerRole && (
            <div style={{marginTop: '10px'}}>
              <span style={{background: '#4CAF50', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold'}}>
                🤖 {employeeData.developerRole}
              </span>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <span>Logout</span>
        </button>
      </div>

      <div className="dashboard-content">
        <div className="main-section">
          <div className="section-header">
            <h2>My Tasks</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="task-count">{filteredTasks.length} of {tasks.length} tasks</div>
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setFilterOpen(true)}
                sx={{
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#6366f1',
                  color: '#6366f1',
                  position: 'relative',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.875rem',
                  '&:hover': {
                    borderColor: '#4f46e5',
                    background: 'rgba(99, 102, 241, 0.05)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                    animation: 'pulse 2s infinite'
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div>
                <div className="stat-number">{tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}</div>
                <div className="stat-label">High Priority</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div>
                <div className="stat-number">{tasks.filter(t => t.status === 'assigned').length}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div>
                <div className="stat-number">{tasks.filter(t => t.status === 'in-progress').length}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div>
                <div className="stat-number">{tasks.filter(t => t.status === 'completed').length}</div>
                <div className="stat-label">Completed</div>
              </div>
            </div>
          </div>

          <div className="tasks-container">
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '15px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                <h3>No tasks yet</h3>
                <p>Tasks will appear here when assigned to you</p>
              </div>
            ) : (
              sortedTasks.map(task => (
                <div key={task.id} className={`task-card ${task.priority === 'high' ? 'high-priority-glow' : ''} ${task.status === 'completed' ? 'completed' : ''}`}>
                  <div className="task-content">
                    <div className="task-main">
                      <h3 className="task-title">{task.title}</h3>
                      <p className="task-description">{task.description}</p>
                      
                      <div className="task-badges">
                        <span className={`priority-badge priority-${task.priority}`}>
                          {task.priority === 'high' && '🔥 '}
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={`status-badge status-${task.status}`}>
                          {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="task-details">
                        {task.requiredSkills?.length > 0 && (
                          <div className="detail-item">
                            <span>🎯</span>
                            <span><strong>Skills:</strong> {task.requiredSkills.join(', ')}</span>
                            {task.isLearningTask && <span className="learning-task-badge">🎓 Learning</span>}
                            {task.complexity && (
                              <span className="complexity-badge" style={{
                                background: task.complexity >= 7 ? '#ff4444' : task.complexity >= 4 ? '#ff9800' : '#4caf50',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                marginLeft: '8px'
                              }}>
                                Complexity: {task.complexity}/10
                              </span>
                            )}
                          </div>
                        )}
                        {task.dueDate && (
                          <div className="detail-item">
                            <span>📅</span>
                            <span><strong>Due:</strong> {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="detail-item">
                          <span>⏱️</span>
                          <span><strong>Est. Hours:</strong> {task.estimatedHours || 'N/A'}</span>
                        </div>
                      </div>

                      {task.isLearningTask && (
                        <div className="learning-note">
                          🎓 Learning Opportunity: Extra time allocated for skill acquisition
                        </div>
                      )}

                      {task.aiReason && (
                        <div className="ai-assignment-reason">
                          <strong>🤖 AI Assignment:</strong> {task.aiReason}
                        </div>
                      )}
                    </div>
                    
                    {task.status !== 'completed' && (
                      <div className="task-actions">
                        {task.status === 'assigned' && (
                          <>
                            <button onClick={() => handleStartTask(task.id)} className="btn btn-start">Start Task</button>
                            <button onClick={() => setSelectedTask(task)} className="btn btn-complete">Complete</button>
                          </>
                        )}
                        {task.status === 'in-progress' && (
                          <button onClick={() => setSelectedTask(task)} className="btn btn-complete">Complete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar">
          <div className="guidelines-card" style={{cursor: 'pointer'}} onClick={() => setShowPerformance(true)}>
            <h4>📊 Enhanced Analytics</h4>
            {analytics && (
              <div style={{marginTop: '15px'}}>
                <p style={{fontSize: '14px', marginBottom: '10px'}}>Overall Score: <strong>{analytics.overallScore}%</strong></p>
                <p style={{fontSize: '14px', marginBottom: '10px'}}>Tasks Completed: <strong>{analytics.tasksCompleted}</strong></p>
                <p style={{fontSize: '14px', marginBottom: '10px'}}>Trend: <strong style={{
                  color: analytics.recentTrend === 'improving' ? '#4CAF50' : 
                        analytics.recentTrend === 'declining' ? '#f44336' : '#FF9800'
                }}>{analytics.recentTrend}</strong></p>
                <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>Click for detailed insights</p>
              </div>
            )}
          </div>

          {selectedTask && (
            <div className="complete-task-card">
              <h3>Complete Task</h3>
              <div className="selected-task-info">
                <h4>{selectedTask.title}</h4>
                <p>Please enter the actual hours worked on this task.</p>
              </div>
              
              <div className="input-group">
                <label>Actual Hours Worked</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  placeholder="Enter hours worked"
                  className="hours-input"
                  required
                />
              </div>
              
              <div className="action-buttons">
                <button onClick={handleCompleteTask} disabled={!actualHours} className="btn btn-primary">
                  Complete Task
                </button>
                <button onClick={() => setSelectedTask(null)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="guidelines-card">
            <h4>📋 Task Guidelines</h4>
            <ul>
              <li>Tasks are automatically assigned based on your skills</li>
              <li>High priority tasks take precedence</li>
              <li>Complete tasks on time to maintain good performance</li>
              <li>Record accurate hours for better future assignments</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="filter-modal-overlay" onClick={() => setFilterOpen(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3><FilterListIcon /> Filter Tasks</h3>
              <button className="filter-modal-close" onClick={() => setFilterOpen(false)}>×</button>
            </div>
            <div className="filter-modal-body">
              <div className="filter-modal-row">
                <div className="filter-modal-item">
                  <label className="filter-modal-label">Priority</label>
                  <select value={filters.priority} onChange={(e) => setFilters({...filters, priority: e.target.value})} className="ai-input">
                    <option value="">All Priorities</option>
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">📋 Low</option>
                  </select>
                </div>
                <div className="filter-modal-item">
                  <label className="filter-modal-label">Status</label>
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="ai-input">
                    <option value="">All Status</option>
                    <option value="pending">📌 Pending</option>
                    <option value="in-progress">⚡ In Progress</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>
              <div className="filter-modal-row">
                <div className="filter-modal-item">
                  <label className="filter-modal-label">Deadline</label>
                  <select value={filters.deadline} onChange={(e) => setFilters({...filters, deadline: e.target.value})} className="ai-input">
                    <option value="">All Deadlines</option>
                    <option value="today">📅 Today</option>
                    <option value="tomorrow">📆 Tomorrow</option>
                    <option value="week">📊 This Week</option>
                    <option value="overdue">⚠️ Overdue</option>
                  </select>
                </div>
                <div className="filter-modal-item">
                  <label className="filter-modal-label">Skill</label>
                  <input type="text" placeholder="Filter by skill..." value={filters.skill} onChange={(e) => setFilters({...filters, skill: e.target.value})} className="ai-input" />
                </div>
              </div>
            </div>
            <div className="filter-modal-footer">
              <button onClick={() => setFilters({ priority: '', status: '', deadline: '', skill: '' })} className="filter-modal-btn filter-modal-btn-clear">Clear All</button>
              <button onClick={() => setFilterOpen(false)} className="filter-modal-btn filter-modal-btn-apply">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {showSkillsSetup && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Welcome! Setup Your Skills</h3>
            <p style={{color: '#666', marginBottom: '1.5rem'}}>Please add your skills and rate your expertise level for each</p>
            <form onSubmit={handleSkillsSetup}>
              <input 
                type="text" 
                placeholder="Enter skills (comma separated, e.g., React, Node.js, Python)" 
                value={skillsInput}
                onChange={(e) => {
                  setSkillsInput(e.target.value);
                  const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                  const newRatings = {};
                  skills.forEach(skill => {
                    newRatings[skill] = skillRatings[skill] || 100;
                  });
                  setSkillRatings(newRatings);
                }}
                required
              />
              
              {skillsInput.split(',').map(s => s.trim()).filter(s => s).map(skill => (
                <div key={skill} style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 600}}>
                    {skill}: {skillRatings[skill] || 100}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={skillRatings[skill] || 100}
                    onChange={(e) => setSkillRatings({...skillRatings, [skill]: parseInt(e.target.value)})}
                    style={{width: '100%'}}
                  />
                </div>
              ))}
              
              <div className="form-buttons">
                <button type="submit" className="btn-submit">Save Skills</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPerformance && employeeData && (
        <div className="modal-overlay" onClick={() => setShowPerformance(false)}>
          <div className="employee-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPerformance(false)}>×</button>
            
            <div className="employee-detail-header">
              <div className="employee-avatar-large">{employeeData.name?.charAt(0).toUpperCase()}</div>
              <div className="employee-info">
                <h2>{employeeData.name}</h2>
                {employeeData.developerRole && <p className="employee-role-detail">💼 {employeeData.developerRole}</p>}
                <p className="employee-email-detail">📧 {employeeData.email}</p>
              </div>
            </div>

            <div className="detail-section">
              <h3>📊 Performance Overview</h3>
              <div className="performance-grid">
                <div className="perf-card">
                  <div className="perf-label">Total Tasks</div>
                  <div className="perf-value">{tasks.length}</div>
                </div>
                <div className="perf-card">
                  <div className="perf-label">Completed</div>
                  <div className="perf-value">{tasks.filter(t => t.status === 'completed').length}</div>
                </div>
                <div className="perf-card">
                  <div className="perf-label">In Progress</div>
                  <div className="perf-value">{tasks.filter(t => t.status === 'in-progress').length}</div>
                </div>
                <div className="perf-card">
                  <div className="perf-label">Pending</div>
                  <div className="perf-value">{tasks.filter(t => t.status === 'assigned').length}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>⭐ Performance Metrics</h3>
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">Completion Rate</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%`}}></div>
                  </div>
                  <span className="metric-value">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">On-Time Delivery</span>
                  <span className="metric-value">{employeeData.performance?.taskHistory?.length > 0 ? Math.round(employeeData.performance.taskHistory.reduce((sum, t) => sum + t.taskPerformance, 0) / employeeData.performance.taskHistory.length) : 100}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Tasks Completed</span>
                  <span className="metric-value">{employeeData.performance?.tasksCompleted || 0}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>🎯 Skills</h3>
              <div className="skills-detail">
                {employeeData.skills?.map((skill, idx) => (
                  <span key={idx} className="skill-tag-large">{skill}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>📊 Skill Expertise Map</h3>
              {employeeData.performance?.skillExpertise && Object.keys(employeeData.performance.skillExpertise).length > 0 ? (
                <svg width="400" height="400" viewBox="0 0 400 400" style={{margin: '0 auto', display: 'block'}}>
                  {(() => {
                    const skills = Object.entries(employeeData.performance.skillExpertise);
                    const center = 200;
                    const maxRadius = 120;
                    const angleStep = (2 * Math.PI) / skills.length;
                    
                    return (
                      <>
                        {[0.25, 0.5, 0.75, 1].map(scale => (
                          <circle key={scale} cx={center} cy={center} r={maxRadius * scale} fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                        ))}
                        
                        {skills.map((_, i) => {
                          const angle = i * angleStep - Math.PI / 2;
                          const x = center + maxRadius * Math.cos(angle);
                          const y = center + maxRadius * Math.sin(angle);
                          return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e0e0e0" strokeWidth="1"/>;
                        })}
                        
                        <polygon
                          points={skills.map(([_, data], i) => {
                            const angle = i * angleStep - Math.PI / 2;
                            const rate = (data.avgRate || 0) / 100;
                            const x = center + maxRadius * rate * Math.cos(angle);
                            const y = center + maxRadius * rate * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="rgba(99, 102, 241, 0.2)"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />
                        
                        {skills.map(([_, data], i) => {
                          const angle = i * angleStep - Math.PI / 2;
                          const rate = (data.avgRate || 0) / 100;
                          const x = center + maxRadius * rate * Math.cos(angle);
                          const y = center + maxRadius * rate * Math.sin(angle);
                          return <circle key={i} cx={x} cy={y} r="5" fill="#6366f1" stroke="white" strokeWidth="2"/>;
                        })}
                        
                        {skills.map(([skill, data], i) => {
                          const angle = i * angleStep - Math.PI / 2;
                          const labelRadius = maxRadius + 50;
                          const x = center + labelRadius * Math.cos(angle);
                          const y = center + labelRadius * Math.sin(angle);
                          const skillName = skill.charAt(0).toUpperCase() + skill.slice(1);
                          return (
                            <g key={i}>
                              <text 
                                x={x} 
                                y={y} 
                                textAnchor="middle" 
                                dominantBaseline="middle"
                                fontSize="13" 
                                fontWeight="600"
                                fill="#1e293b"
                              >
                                {skillName}
                              </text>
                              <text 
                                x={x} 
                                y={y + 15} 
                                textAnchor="middle" 
                                fontSize="11" 
                                fontWeight="700"
                                fill="#6366f1"
                              >
                                {data.avgRate}%
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <p className="no-tasks">No skill data yet - complete tasks to see expertise map</p>
              )}
            </div>

            <div className="detail-section">
              <h3>📊 Skill Expertise</h3>
              {employeeData.performance?.skillExpertise && Object.keys(employeeData.performance.skillExpertise).length > 0 ? (
                <div className="skill-expertise-list">
                  {Object.entries(employeeData.performance.skillExpertise).map(([skill, data]) => (
                    <div key={skill} className="skill-expertise-item">
                      <span className="skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: `${data.avgRate}%`}}></div>
                      </div>
                      <span className="skill-rate">{data.avgRate}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-tasks">No skill data yet - complete tasks to see expertise</p>
              )}
            </div>

            <div className="detail-section">
              <h3>📋 Task Performance History</h3>
              <div className="tasks-list">
                {employeeData.performance?.taskHistory && employeeData.performance.taskHistory.length > 0 ? (
                  employeeData.performance.taskHistory.slice(-10).reverse().map((task, idx) => (
                    <div key={idx} className="task-history-item">
                      <div className="task-history-header">
                        <span className="task-history-name">{task.taskName}</span>
                        <span className={`task-score ${task.taskPerformance >= 85 ? 'high' : task.taskPerformance >= 70 ? 'medium' : 'low'}`}>
                          {task.taskPerformance}%
                        </span>
                      </div>
                      <div className="task-history-details">
                        {task.skills?.join(', ')} • {task.estimatedHours}h est. / {task.actualHours}h actual
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{
                          width: `${task.taskPerformance}%`,
                          background: task.taskPerformance >= 85 ? '#4CAF50' : task.taskPerformance >= 70 ? '#FF9800' : '#f44336'
                        }}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-tasks">No task history yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
