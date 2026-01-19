const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Task description is required']
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in-progress', 'completed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedToName: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  estimatedHours: {
    type: Number,
    default: 8
  },
  actualHours: Number,
  deadline: Date,
  completedAt: Date,
  completedOnTime: {
    type: Boolean,
    default: false
  },
  isLearningTask: {
    type: Boolean,
    default: false
  },
  aiReasoning: String,
  parentTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  isSubtask: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Task', taskSchema);
