const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const store = require('../store/memoryStore');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// POST /api/files/upload-to-employee
// Accepts multipart/form-data: employeeId + files[]
const uploadFilesToEmployee = (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'Please select an employee (employeeId is required).' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files were uploaded.' });
  }

  const targetUser = store.users.find(u => u.id === employeeId);
  if (!targetUser) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const savedFiles = req.files.map(f => {
    const record = {
      id: `file-${uuidv4().substring(0, 8)}`,
      employeeId,
      employeeName: `${targetUser.firstName} ${targetUser.lastName}`,
      employeeEmail: targetUser.email,
      originalName: f.originalname,
      storedName: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      uploadedByUserId: req.user.id,
      uploadedByName: `${req.user.firstName} ${req.user.lastName}`,
      uploadedAt: new Date().toISOString()
    };
    store.employeeFiles.push(record);
    return record;
  });

  store.sync('employeeFiles');

  store.addAuditLog(
    req.user.id,
    `${req.user.firstName} ${req.user.lastName}`,
    req.user.role,
    'FILES_UPLOADED',
    'FILE_SERVICE',
    req.ip,
    `Uploaded ${savedFiles.length} file(s) to ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email}).`
  );

  res.status(201).json({
    message: `${savedFiles.length} file(s) successfully uploaded to ${targetUser.firstName} ${targetUser.lastName}!`,
    files: savedFiles
  });
};

// GET /api/files/employee/:employeeId
const getEmployeeFiles = (req, res) => {
  const { employeeId } = req.params;
  // Return all files for this employee (both sent TO them and their responses back)
  const files = store.employeeFiles.filter(f => f.employeeId === employeeId);
  res.json(files);
};

// GET /api/files/all
const getAllFiles = (req, res) => {
  res.json(store.employeeFiles);
};

// DELETE /api/files/:fileId
const deleteEmployeeFile = (req, res) => {
  const { fileId } = req.params;
  const idx = store.employeeFiles.findIndex(f => f.id === fileId);
  if (idx === -1) return res.status(404).json({ message: 'File record not found.' });

  const fileRecord = store.employeeFiles[idx];
  const filePath = path.join(UPLOADS_DIR, fileRecord.storedName);

  // Delete from disk
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }

  store.employeeFiles.splice(idx, 1);
  store.sync('employeeFiles');

  res.json({ message: 'File deleted successfully.' });
};

// GET /api/files/download/:fileId
const downloadEmployeeFile = (req, res) => {
  const { fileId } = req.params;
  const fileRecord = store.employeeFiles.find(f => f.id === fileId);
  if (!fileRecord) return res.status(404).json({ message: 'File not found.' });

  const filePath = path.join(UPLOADS_DIR, fileRecord.storedName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File no longer exists on disk.' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
  res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
  res.sendFile(filePath);
};

// GET /api/files/my-files — employee sees files uploaded TO them
const getMyFiles = (req, res) => {
  const myFiles = store.employeeFiles.filter(f => f.employeeId === req.user.id && !f.isResponse);
  res.json(myFiles);
};

// PATCH /api/files/:fileId/status — employee updates file status
const updateFileStatus = (req, res) => {
  const { fileId } = req.params;
  const { status, note } = req.body;
  const validStatuses = ['RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_CLARIFICATION'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const fileRecord = store.employeeFiles.find(f => f.id === fileId && f.employeeId === req.user.id);
  if (!fileRecord) return res.status(404).json({ message: 'File not found or not assigned to you.' });

  fileRecord.status = status;
  fileRecord.statusNote = note || '';
  fileRecord.statusUpdatedAt = new Date().toISOString();
  fileRecord.statusUpdatedByName = `${req.user.firstName} ${req.user.lastName}`;
  store.sync('employeeFiles');

  res.json({ message: `File status updated to ${status}`, file: fileRecord });
};

// POST /api/files/:fileId/respond — employee uploads a response file back to team lead
const respondToFile = (req, res) => {
  const { fileId } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No response files uploaded.' });
  }

  const originalFile = store.employeeFiles.find(f => f.id === fileId && f.employeeId === req.user.id);
  if (!originalFile) return res.status(404).json({ message: 'Original file not found or not assigned to you.' });

  const responseFiles = req.files.map(f => {
    const record = {
      id: `file-${uuidv4().substring(0, 8)}`,
      employeeId: req.user.id,
      employeeName: `${req.user.firstName} ${req.user.lastName}`,
      employeeEmail: req.user.email,
      originalName: f.originalname,
      storedName: f.filename,
      mimeType: f.mimetype,
      sizeBytes: f.size,
      uploadedByUserId: req.user.id,
      uploadedByName: `${req.user.firstName} ${req.user.lastName}`,
      uploadedAt: new Date().toISOString(),
      isResponse: true,
      respondsToFileId: fileId,
      teamLeadId: originalFile.uploadedByUserId,
      status: 'SUBMITTED'
    };
    store.employeeFiles.push(record);
    return record;
  });

  // Mark the original file as responded to
  originalFile.status = 'COMPLETED';
  originalFile.respondedAt = new Date().toISOString();
  store.sync('employeeFiles');

  res.status(201).json({
    message: `${responseFiles.length} response file(s) submitted to your Team Lead!`,
    files: responseFiles
  });
};

module.exports = {
  uploadFilesToEmployee,
  getEmployeeFiles,
  getAllFiles,
  deleteEmployeeFile,
  downloadEmployeeFile,
  getMyFiles,
  updateFileStatus,
  respondToFile
};
