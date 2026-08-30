const express = require('express');
const router = express.Router();
const { getTaskMessages, sendTaskMessage, getAnnouncements, createAnnouncement } = require('../controllers/collaborationController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/announcements', getAnnouncements);
router.post('/announcements', authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER'), createAnnouncement);

router.get('/messages/:taskId', getTaskMessages);
router.get('/messages', getTaskMessages);
router.post('/messages', sendTaskMessage);

module.exports = router;
