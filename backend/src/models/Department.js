const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  managerId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
