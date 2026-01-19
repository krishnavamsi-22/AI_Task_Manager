import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (idToken) => api.post('/auth/login', { idToken }),
  getProfile: () => api.get('/auth/profile')
};

export const taskAPI = {
  create: (data) => api.post('/tasks', data),
  getManagerTasks: () => api.get('/tasks/manager'),
  getEmployeeTasks: () => api.get('/tasks/employee'),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  complete: (id, actualHours) => api.patch(`/tasks/${id}/complete`, { actualHours }),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status })
};

export const employeeAPI = {
  add: (data) => api.post('/employees', data),
  getAll: () => api.get('/employees'),
  getStats: () => api.get('/employees/stats'),
  getDetails: (id) => api.get(`/employees/${id}`),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
};

export const performanceAPI = {
  getEmployee: (id) => api.get(`/performance/employee/${id}`),
  getMy: () => api.get('/performance/my-performance'),
  getTeam: () => api.get('/performance/team')
};

export default api;
