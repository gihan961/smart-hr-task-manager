const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProjectStatus } = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

router.use(authenticateToken);

router.get('/', getProjects);
router.post('/', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER'), auditLog('CREATE_PROJECT', 'PROJECT_SERVICE'), createProject);
router.patch('/:id', authorizeRoles('SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER'), auditLog('UPDATE_PROJECT', 'PROJECT_SERVICE'), updateProjectStatus);

module.exports = router;
