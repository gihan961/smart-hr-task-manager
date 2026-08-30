const express = require('express');
const router = express.Router();
const {
  getMyTasks, createMyTask, updateMyTask, deleteMyTask,
  getMyNotes, createMyNote, updateMyNote, deleteMyNote,
  getCompanyHub, updateCompanyDetails, addHoliday, deleteHoliday
} = require('../controllers/personalController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

// ── Personal Tasks (private, owner-only) ───────────────────────────────────
router.get('/tasks',           getMyTasks);
router.post('/tasks',          createMyTask);
router.patch('/tasks/:id',     updateMyTask);
router.delete('/tasks/:id',    deleteMyTask);

// ── Personal Notes (private, owner-only) ───────────────────────────────────
router.get('/notes',           getMyNotes);
router.post('/notes',          createMyNote);
router.patch('/notes/:id',     updateMyNote);
router.delete('/notes/:id',    deleteMyNote);

// ── Company Hub (read-only for all, write for HR/Admin) ───────────────────
router.get('/company',         getCompanyHub);
router.patch('/company',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  updateCompanyDetails
);
router.post('/company/holidays',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  addHoliday
);
router.delete('/company/holidays/:id',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  deleteHoliday
);

module.exports = router;
