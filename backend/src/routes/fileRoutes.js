const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const fileController = require('../controllers/fileController');

// Configure multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4().substring(0, 12)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max per file
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowed = [
      'text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'image/png', 'image/jpeg', 'image/gif',
      'application/zip', 'application/json'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" not supported.`));
    }
  }
});

router.use(authenticateToken);

// Upload files to a specific employee
router.post('/upload-to-employee', upload.array('files', 10), fileController.uploadFilesToEmployee);

// Get all files for a specific employee
router.get('/employee/:employeeId', fileController.getEmployeeFiles);

// Get all files (for team lead overview)
router.get('/all', fileController.getAllFiles);

// Download a specific file
router.get('/download/:fileId', fileController.downloadEmployeeFile);

// Employee: see files uploaded TO me
router.get('/my-files', fileController.getMyFiles);

// Employee: update status on a file assigned to me
router.patch('/:fileId/status', fileController.updateFileStatus);

// Employee: upload response file back to team lead
router.post('/:fileId/respond', upload.array('files', 5), fileController.respondToFile);

// Delete a file record + disk file
router.delete('/:fileId', fileController.deleteEmployeeFile);

module.exports = router;
