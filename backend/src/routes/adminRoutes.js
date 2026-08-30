const express = require('express');
const router = express.Router();
const { getOrganization, getDepartments, getAuditLogs } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/organization', getOrganization);
router.get('/departments', getDepartments);
router.get('/audit-logs', authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'), getAuditLogs);

module.exports = router;
