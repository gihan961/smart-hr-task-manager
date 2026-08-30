const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  projectId: { type: String, default: null },
  status: { type: String, enum: ['TO_DO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'], default: 'TO_DO' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' },
  complexityIndex: { type: Number, default: 5.0 },
  estimatedHours: { type: Number, default: 8.0 },
  assignedTo: { type: String, default: null },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Task || mongoose.model('Task', TaskSchema);
