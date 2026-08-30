const express = require('express');
const router = express.Router();
const {
  getClients,
  createClient,
  updateClient,
  attachClientFile,
  deleteClientFile,
  linkGroupToClient,
  getMasterTasks,
  dispatchMasterTask,
  divideMasterTask
} = require('../controllers/clientController');

const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

router.use(authenticateToken);

// Client Hierarchy, Edit & Document File Path Routes
router.get('/', getClients);
router.post('/', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'), auditLog('CREATE_CLIENT', 'CLIENT_SERVICE'), createClient);
router.put('/:id', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'), auditLog('UPDATE_CLIENT', 'CLIENT_SERVICE'), updateClient);
router.post('/:id/files', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'), auditLog('ATTACH_CLIENT_FILE', 'CLIENT_SERVICE'), attachClientFile);
router.delete('/:id/files/:fileId', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'), auditLog('DELETE_CLIENT_FILE', 'CLIENT_SERVICE'), deleteClientFile);
router.post('/:id/link-group', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'), auditLog('LINK_GROUP_CLIENT', 'CLIENT_SERVICE'), linkGroupToClient);

// Master Task Dispatch Engine Routes
router.get('/master-tasks', getMasterTasks);
router.post('/master-tasks', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER'), auditLog('DISPATCH_MASTER_TASK', 'TASK_SERVICE'), dispatchMasterTask);
router.post('/master-tasks/:id/divide', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER'), auditLog('DIVIDE_MASTER_TASK', 'TASK_SERVICE'), divideMasterTask);

module.exports = router;
