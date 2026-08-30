const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  teamLeadId: { type: String, required: true },
  teamLeadName: { type: String, default: '' },
  memberIds: [{ type: String }],
  projectId: { type: String, default: null },
  announcements: [
    {
      id: { type: String },
      title: { type: String },
      content: { type: String },
      authorName: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Group || mongoose.model('Group', GroupSchema);
