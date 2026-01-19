const { db, auth } = require('../config/firebase');
const { AppError } = require('../middlewares/errorHandler');

class FirebaseService {
  async createUser(uid, userData) {
    await db.collection('users').doc(uid).set({
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { uid, ...userData };
  }

  async getUser(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) throw new AppError('User not found', 404);
    return { uid: doc.id, ...doc.data() };
  }

  async updateUser(uid, updates) {
    await db.collection('users').doc(uid).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return this.getUser(uid);
  }

  async deleteUser(uid) {
    await db.collection('users').doc(uid).delete();
    await auth.deleteUser(uid);
  }

  async getEmployeesByManager(managerId) {
    const snapshot = await db.collection('users')
      .where('managerId', '==', managerId)
      .where('role', '==', 'employee')
      .get();
    
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  }

  async getAvailableEmployees() {
    const snapshot = await db.collection('users')
      .where('role', '==', 'employee')
      .get();
    
    return snapshot.docs
      .map(doc => ({ uid: doc.id, ...doc.data() }))
      .filter(emp => !emp.managerId);
  }

  async createTask(taskData) {
    const docRef = await db.collection('tasks').add({
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { id: docRef.id, ...taskData };
  }

  async getTask(taskId) {
    const doc = await db.collection('tasks').doc(taskId).get();
    if (!doc.exists) throw new AppError('Task not found', 404);
    return { id: doc.id, ...doc.data() };
  }

  async updateTask(taskId, updates) {
    await db.collection('tasks').doc(taskId).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return this.getTask(taskId);
  }

  async deleteTask(taskId) {
    await db.collection('tasks').doc(taskId).delete();
  }

  async getTasksByManager(managerId) {
    const snapshot = await db.collection('tasks')
      .where('createdBy', '==', managerId)
      .get();
    
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getTasksByEmployee(employeeId) {
    const snapshot = await db.collection('tasks')
      .where('assignedTo', '==', employeeId)
      .get();
    
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  async createPerformanceMetric(metricData) {
    const docRef = await db.collection('performanceMetrics').add({
      ...metricData,
      createdAt: new Date().toISOString()
    });
    return { id: docRef.id, ...metricData };
  }

  async getPerformanceMetrics(employeeId) {
    const snapshot = await db.collection('performanceMetrics')
      .where('employeeId', '==', employeeId)
      .limit(50)
      .get();
    
    const metrics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return metrics.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async incrementUserField(uid, field, value = 1) {
    const admin = require('firebase-admin');
    await db.collection('users').doc(uid).update({
      [field]: admin.firestore.FieldValue.increment(value)
    });
  }
}

module.exports = new FirebaseService();
