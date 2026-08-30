const express = require('express');
const router = express.Router();
const {
  getClaimBatches,
  createClaimBatch,
  getTasks,
  createTask,
  updateTaskStatus,
  assignTask
} = require('../controllers/taskController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

router.use(authenticateToken);

router.get('/batches', getClaimBatches);
router.post('/batches', authorizeRoles('PROJECT_MANAGER', 'TEAM_LEADER', 'SYSTEM_ADMIN'), auditLog('CREATE_CLAIM_BATCH', 'BATCH_SERVICE'), createClaimBatch);

router.get('/', getTasks);
router.post('/', authorizeRoles('PROJECT_MANAGER', 'TEAM_LEADER', 'SYSTEM_ADMIN'), auditLog('CREATE_TASK', 'TASK_SERVICE'), createTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id/assign', authorizeRoles('PROJECT_MANAGER', 'TEAM_LEADER', 'SYSTEM_ADMIN', 'HR_MANAGER'), auditLog('ASSIGN_TASK', 'TASK_SERVICE'), assignTask);

module.exports = router;
