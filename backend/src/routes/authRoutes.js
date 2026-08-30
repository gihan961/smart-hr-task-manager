const express = require('express');
const router = express.Router();
const { register, registerOrganization, login, forgotPassword, resetPassword, getMe, switchRole } = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Only HR/Admin/PM can create new employee accounts — no public self-registration
router.post('/register',
  authenticateToken,
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER'),
  register
);
// Organization first-time setup — public
router.post('/register-organization', registerOrganization);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticateToken, getMe);
router.post('/switch-role', switchRole);

module.exports = router;

