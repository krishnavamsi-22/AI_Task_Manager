import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Plus, BarChart3, CheckCircle, Clock, AlertTriangle, Brain, LogOut, User, Mail, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, Typography, Button, Chip, Avatar, IconButton, Fab, Badge } from '@mui/material';
import { Add as AddIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import api from '../config/api';
import './ManagerDashboard.css';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [allRegisteredEmployees, setAllRegisteredEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [addEmployeeMode, setAddEmployeeMode] = useState('select');
  const [showAddTask, setShowAddTask] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', password: '', skills: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', skills: '', priority: 'medium', totalHours: '40' });
  const [notification, setNotification] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filters, setFilters] = useState({ priority: '', status: '', deadline: '', skill: '', assignedTo: '' });
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({ priority: '', status: '', deadline: '', skill: '', assignedTo: '' });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const token = await user.getIdToken?.() || '';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [employeesRes, tasksRes, statsRes, availableRes] = await Promise.all([
        api.get('/api/employees', config),
        api.get('/api/tasks/manager', config),
        api.get('/api/employees/stats', config),
        api.get('/api/employees/available', config)
      ]);
      
      setEmployees(employeesRes.data.employees || []);
      setTasks(tasksRes.data.tasks || []);
      setStats(statsRes.data.stats || {});
      setAllRegisteredEmployees(availableRes.data.employees || []);
    } catch (error) {
      console.error('Load error:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to load data');
    }
  };

  const handleAssignEmployee = async (employeeId) => {
    try {
      const token = await user.getIdToken?.() || '';
      await api.patch(`/api/employees/${employeeId}/assign`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Employee added to your team!');
      setShowAddEmployee(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to assign employee');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = await user.getIdToken?.() || '';
      await api.post('/api/employees', {
        ...employeeForm,
        skills: employeeForm.skills.split(',').map(s => s.trim())
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast.success('Employee added successfully!');
      setShowAddEmployee(false);
      setEmployeeForm({ name: '', email: '', password: '', skills: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    
    try {
      const token = await user.getIdToken?.() || '';
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        skills: taskForm.skills,
        priority: taskForm.priority,
        totalHours: taskForm.totalHours
      };
      
      const response = await api.post('/api/tasks', payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      toast.success(`Created ${response.data.tasks?.length || 1} task(s)!`);
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', skills: '', priority: 'medium', totalHours: '40' });
      loadData();
    } catch (error) {
      console.error('Task creation error:', error.response?.data || error.message);
      toast.error(error.response?.data?.error || 'Failed to create task');
    }
  };


  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      const token = await user.getIdToken?.() || '';
      await api.delete(`/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Task deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="ai-card mx-6 mt-6 p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold ai-gradient-text">Manager Dashboard</h1>
            <p className="text-gray-600">Manage your team and tasks efficiently</p>
          </div>
        </div>
        <button onClick={handleLogout} className="ai-button-secondary flex items-center space-x-2">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-6 mt-6">
        <Card elevation={0} sx={{ borderRadius: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 } }}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Employees</Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">{stats.totalEmployees || 0}</Typography>
              </div>
              <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' }}>
                <Users className="w-6 h-6" />
              </Avatar>
            </div>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 } }}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Tasks</Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">{stats.totalTasks || 0}</Typography>
              </div>
              <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <BarChart3 className="w-6 h-6" />
              </Avatar>
            </div>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 } }}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Completed</Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">{stats.completedTasks || 0}</Typography>
              </div>
              <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                <CheckCircle className="w-6 h-6" />
              </Avatar>
            </div>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ borderRadius: 3, transition: 'all 0.3s', '&:hover': { transform: 'translateY(-5px)', boxShadow: 4 } }}>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Pending</Typography>
                <Typography variant="h4" fontWeight={700} color="text.primary">{stats.pendingTasks || 0}</Typography>
              </div>
              <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <Clock className="w-6 h-6" />
              </Avatar>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="manager-content">
        <div className="section">
          <div className="section-title">
            <h2>👥 Team Members</h2>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddEmployee(true)}
              sx={{
                borderRadius: '50px',
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              Add Employee
            </Button>
          </div>

          <div className="items-container">
            {employees.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No employees yet</h3>
                <p>Add your first team member to get started</p>
              </div>
            ) : (
              employees.map(emp => {
                const empTasks = tasks.filter(t => t.assignedTo === emp.uid);
                const completedCount = empTasks.filter(t => t.status === 'completed').length;
                const completionRate = empTasks.length > 0 ? Math.round((completedCount / empTasks.length) * 100) : 0;
                
                return (
                  <div key={emp.uid} className="employee-card" onClick={() => setSelectedEmployee(emp)}>
                    <div className="employee-avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                    <h4>{emp.name}</h4>
                    {emp.developerRole && <p className="employee-role">💼 {emp.developerRole}</p>}
                    <p className="employee-email">📧 {emp.email}</p>
                    <div className="employee-skills">
                      {emp.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                      {emp.skills?.length > 3 && <span className="skill-tag">+{emp.skills.length - 3}</span>}
                    </div>
                    <div className="employee-quick-stats">
                      <div className="quick-stat">
                        <span className="quick-stat-label">Total</span>
                        <span className="quick-stat-value">{empTasks.length}</span>
                      </div>
                      <div className="quick-stat">
                        <span className="quick-stat-label">Pending</span>
                        <span className="quick-stat-value">{empTasks.filter(t => t.status !== 'completed').length}</span>
                      </div>
                      <div className="quick-stat">
                        <span className="quick-stat-label">Complete</span>
                        <span className="quick-stat-value">{completionRate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <h2>📋 Tasks</h2>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowAddTask(true)}
                sx={{
                  borderRadius: '50px',
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
              >
                Add Task
              </Button>
            </div>
          </div>

          <div className="items-container">
            {(() => {
              // Apply filters
              const filteredTasks = tasks.filter(task => {
                if (filters.priority && task.priority !== filters.priority) return false;
                if (filters.status && task.status !== filters.status) return false;
                if (filters.assignedTo && task.assignedTo !== filters.assignedTo) return false;
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
              
              // Sort tasks
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              const sortedTasks = [...filteredTasks].sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1;
                if (a.status !== 'completed' && b.status === 'completed') return -1;
                const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (priorityDiff !== 0) return priorityDiff;
                if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
                if (a.deadline) return -1;
                if (b.deadline) return 1;
                return 0;
              });
              
              return sortedTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No tasks yet</h3>
                <p>Create your first task to assign to team members</p>
              </div>
            ) : (
              sortedTasks.map(task => {
                const assignedEmp = employees.find(e => e.uid === task.assignedTo);
                return (
                  <div key={task.id} className="task-card">
                    <button onClick={() => handleDeleteTask(task.id)} className="edit-icon">🗑️</button>
                    <div className="task-header">
                      <h4>{task.title}</h4>
                      <div className="task-badges">
                        <span className={`priority-badge priority-${task.priority}`}>{task.priority}</span>
                        <span className={`status-badge status-${task.status}`}>{task.status}</span>
                      </div>
                    </div>
                    <p className="task-description">{task.description}</p>
                    {task.requiredSkills?.length > 0 && (
                      <div className="task-skills">
                        {task.requiredSkills.map((skill, idx) => (
                          <span key={idx} className="skill-chip">{skill}</span>
                        ))}
                        {task.complexity && (
                          <span className="complexity-chip" style={{
                            background: task.complexity >= 7 ? '#ff4444' : task.complexity >= 4 ? '#ff9800' : '#4caf50',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            marginLeft: '8px'
                          }}>
                            🧠 {task.complexity}/10
                          </span>
                        )}
                      </div>
                    )}
                    {assignedEmp && (
                      <div className="task-assigned">
                        <span className="assigned-avatar">{assignedEmp.name?.charAt(0).toUpperCase()}</span>
                        <span className="assigned-name">Assigned to {assignedEmp.name}</span>
                      </div>
                    )}
                    {task.aiReason && <div className="ai-reason">🤖 {task.aiReason}</div>}
                    {task.isLearningTask && (
                      <div className="learning-note">🎓 Learning Opportunity: Employee will acquire new skills</div>
                    )}
                  </div>
                );
              })
            );
            })()}
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
                    <option value="assigned">📌 Pending</option>
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
                  <label className="filter-modal-label">Assigned To</label>
                  <select value={filters.assignedTo} onChange={(e) => setFilters({...filters, assignedTo: e.target.value})} className="ai-input">
                    <option value="">All Employees</option>
                    {employees.map(emp => <option key={emp.uid} value={emp.uid}>{emp.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="filter-modal-row">
                <div className="filter-modal-item">
                  <label className="filter-modal-label">Skill</label>
                  <input type="text" placeholder="Filter by skill..." value={filters.skill} onChange={(e) => setFilters({...filters, skill: e.target.value})} className="ai-input" />
                </div>
              </div>
            </div>
            <div className="filter-modal-footer">
              <button onClick={() => setFilters({ priority: '', status: '', deadline: '', skill: '', assignedTo: '' })} className="filter-modal-btn filter-modal-btn-clear">Clear All</button>
              <button onClick={() => setFilterOpen(false)} className="filter-modal-btn filter-modal-btn-apply">Apply Filters</button>
            </div>
          </div>
        </div>
      )}

      {showAddEmployee && (
        <div className="modal-overlay" onClick={() => setShowAddEmployee(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddEmployee(false)}>×</button>
            <h3>Add Employee to Team</h3>
            
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
              <button 
                onClick={() => setAddEmployeeMode('select')}
                style={{
                  flex: 1, padding: '10px',
                  background: addEmployeeMode === 'select' ? '#4CAF50' : '#f0f0f0',
                  color: addEmployeeMode === 'select' ? 'white' : '#333',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Select Existing
              </button>
              <button 
                onClick={() => setAddEmployeeMode('create')}
                style={{
                  flex: 1, padding: '10px',
                  background: addEmployeeMode === 'create' ? '#4CAF50' : '#f0f0f0',
                  color: addEmployeeMode === 'create' ? 'white' : '#333',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                Create New
              </button>
            </div>

            {addEmployeeMode === 'select' ? (
              <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                {allRegisteredEmployees.length === 0 ? (
                  <p>No available employees to add</p>
                ) : (
                  allRegisteredEmployees.map(emp => (
                    <div key={emp.uid} style={{padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '10px'}}>
                      <h4>{emp.name}</h4>
                      <p style={{fontSize: '14px', color: '#666'}}>📧 {emp.email}</p>
                      <div style={{marginTop: '8px'}}>
                        <strong>Skills:</strong> {emp.skills?.join(', ') || 'No skills listed'}
                      </div>
                      {emp.developerRole && (
                        <div style={{marginTop: '8px'}}>
                          <strong>Role:</strong> {emp.developerRole}
                        </div>
                      )}
                      <div style={{marginTop: '8px'}}>
                        <strong>Performance:</strong> {emp.performance?.onTimeDelivery || 100}%
                      </div>
                      <button 
                        onClick={() => handleAssignEmployee(emp.uid)}
                        style={{marginTop: '10px', padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                      >
                        Add to Team
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleAddEmployee}>
                <input type="text" placeholder="Name" value={employeeForm.name} onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})} required />
                <input type="email" placeholder="Email" value={employeeForm.email} onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})} required />
                <input type="password" placeholder="Password" value={employeeForm.password} onChange={(e) => setEmployeeForm({...employeeForm, password: e.target.value})} required />
                <input type="text" placeholder="Skills (comma separated)" value={employeeForm.skills} onChange={(e) => setEmployeeForm({...employeeForm, skills: e.target.value})} />
                <div className="form-buttons">
                  <button type="submit" className="btn-submit">Create Employee</button>
                  <button type="button" onClick={() => setShowAddEmployee(false)} className="btn-cancel">Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddTask(false)}>×</button>
            <h3>Add New Task</h3>
            <form onSubmit={handleAddTask}>
              <input type="text" placeholder="Task Title" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} required />
              <textarea placeholder="Task Description" value={taskForm.description} onChange={(e) => setTaskForm({...taskForm, description: e.target.value})} required />
              <input type="text" placeholder="Required Skills (comma separated)" value={taskForm.skills} onChange={(e) => setTaskForm({...taskForm, skills: e.target.value})} required />
              <input type="number" placeholder="Total Hours" value={taskForm.totalHours} onChange={(e) => setTaskForm({...taskForm, totalHours: e.target.value})} required min="1" />
              <select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div className="form-buttons">
                <button type="submit" className="btn-submit">Create Task</button>
                <button type="button" onClick={() => setShowAddTask(false)} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {selectedEmployee && (() => {
        const empTasks = tasks.filter(t => t.assignedTo === selectedEmployee.uid);
        const completedTasks = empTasks.filter(t => t.status === 'completed');
        const inProgressTasks = empTasks.filter(t => t.status === 'in-progress');
        const pendingTasks = empTasks.filter(t => t.status === 'assigned' || t.status === 'pending');
        const completionRate = empTasks.length > 0 ? Math.round((completedTasks.length / empTasks.length) * 100) : 0;
        const performance = selectedEmployee.performance || { tasksCompleted: 0, onTimeDelivery: 100, skillExpertise: {}, taskHistory: [] };
        
        return (
          <div className="modal-overlay" onClick={() => setSelectedEmployee(null)}>
            <div className="employee-detail-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedEmployee(null)}>×</button>
              
              <div className="employee-detail-header">
                <div className="employee-avatar-large">{selectedEmployee.name?.charAt(0).toUpperCase()}</div>
                <div className="employee-info">
                  <h2>{selectedEmployee.name}</h2>
                  {selectedEmployee.developerRole && <p className="employee-role-detail">💼 {selectedEmployee.developerRole}</p>}
                  <p className="employee-email-detail">📧 {selectedEmployee.email}</p>
                </div>
              </div>

              <div className="detail-section">
                <h3>📊 Performance Overview</h3>
                <div className="performance-grid">
                  <div className="perf-card">
                    <div className="perf-label">Total Tasks</div>
                    <div className="perf-value">{empTasks.length}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Completed</div>
                    <div className="perf-value">{completedTasks.length}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">In Progress</div>
                    <div className="perf-value">{inProgressTasks.length}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Pending</div>
                    <div className="perf-value">{pendingTasks.length}</div>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>⭐ Performance Metrics</h3>
                <div className="metrics-list">
                  <div className="metric-item">
                    <span className="metric-label">Completion Rate</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${completionRate}%`}}></div>
                    </div>
                    <span className="metric-value">{completionRate}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">On-Time Delivery</span>
                    <span className="metric-value">{performance.taskHistory?.length > 0 ? Math.round(performance.taskHistory.reduce((sum, t) => sum + t.taskPerformance, 0) / performance.taskHistory.length) : 100}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Tasks Completed</span>
                    <span className="metric-value">{performance.tasksCompleted || 0}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🎯 Skills</h3>
                <div className="skills-detail">
                  {selectedEmployee.skills?.map((skill, idx) => (
                    <span key={idx} className="skill-tag-large">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>📊 Skill Expertise Map</h3>
                {performance.skillExpertise && Object.keys(performance.skillExpertise).length > 0 ? (
                  <svg width="400" height="400" viewBox="0 0 400 400" style={{margin: '0 auto', display: 'block'}}>
                    {(() => {
                      const skills = Object.entries(performance.skillExpertise);
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
                {performance.skillExpertise && Object.keys(performance.skillExpertise).length > 0 ? (
                  <div className="skill-expertise-list">
                    {Object.entries(performance.skillExpertise).map(([skill, data]) => (
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
                  {performance.taskHistory && performance.taskHistory.length > 0 ? (
                    performance.taskHistory.slice(-10).reverse().map((task, idx) => (
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

              <div className="detail-section">
                <h3>📋 Current Tasks</h3>
                <div className="tasks-list">
                  {empTasks.length === 0 ? (
                    <p className="no-tasks">No tasks assigned yet</p>
                  ) : (
                    empTasks.map(task => (
                      <div key={task.id} className="task-item-small">
                        <div className="task-item-title">{task.title}</div>
                        <span className={`status-badge status-${task.status}`}>{task.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
