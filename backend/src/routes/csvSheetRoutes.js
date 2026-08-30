const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');
const {
  createCsvSheet,
  listCsvSheets,
  getMyInbox,
  getCsvSheet,
  updateCsvRow,
  addRowComment,
  deleteCsvSheet
} = require('../controllers/csvSheetController');

// All routes require authentication
router.use(authenticateToken);

// Personal inbox — only sheets assigned to the logged-in user
router.get('/my-inbox', getMyInbox);

// List sheets accessible to the current user
router.get('/', listCsvSheets);

// Get single CSV sheet with all rows (access-checked in controller)
router.get('/:id', getCsvSheet);

// Create a new CSV Work Sheet (Team Lead, PM, Admin)
router.post('/',
  authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD'),
  auditLog('CREATE_CSV_SHEET', 'CSVWorkSheet'),
  createCsvSheet
);

// Update a row's status and work notes (any authenticated employee)
router.patch('/:id/rows/:rowId',
  auditLog('UPDATE_CSV_ROW', 'CSVWorkSheetRow'),
  updateCsvRow
);

// Add a comment to a row
router.post('/:id/rows/:rowId/comments',
  auditLog('COMMENT_CSV_ROW', 'CSVWorkSheetRow'),
  addRowComment
);

// Delete a sheet (Team Lead, PM, Admin only)
router.delete('/:id',
  authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD'),
  auditLog('DELETE_CSV_SHEET', 'CSVWorkSheet'),
  deleteCsvSheet
);

module.exports = router;

