const express = require('express');
const router = express.Router();
const {
  getEmployees,
  createEmployee,
  updateEmployeeDemographics,
  updateEmployeeSalary,
  updateMyDemographics,
  grantLeaveAllocation,
  getAttendance,
  clockIn,
  clockOut,
  getLeaveRequests,
  submitLeaveRequest,
  updateLeaveStatus,
  cancelLeaveRequest,
  getPayroll,
  generatePayroll,
  updatePayrollRecord,
  approvePayroll,
  getAppraisals,
  createAppraisal,
  updateAppraisal,
  getHRAnalytics
} = require('../controllers/hrController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

router.use(authenticateToken);

// ── Analytics ──────────────────────────────────────────────────────────────────
router.get('/analytics', authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN', 'PROJECT_MANAGER'), getHRAnalytics);

// ── Employees ──────────────────────────────────────────────────────────────────
router.get('/employees', getEmployees);
router.post('/employees',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  auditLog('CREATE_EMPLOYEE', 'EMPLOYEE_SERVICE'),
  createEmployee
);
router.patch('/employees/:id',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  auditLog('UPDATE_EMPLOYEE_DEMOGRAPHICS', 'EMPLOYEE_SERVICE'),
  updateEmployeeDemographics
);
router.patch('/employees/:id/salary',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER'),
  auditLog('UPDATE_EMPLOYEE_SALARY', 'PAYROLL_SERVICE'),
  updateEmployeeSalary
);
router.patch('/me/demographics', auditLog('UPDATE_MY_DEMOGRAPHICS', 'EMPLOYEE_SERVICE'), updateMyDemographics);

// ── Attendance ─────────────────────────────────────────────────────────────────
router.get('/attendance', getAttendance);
router.post('/attendance/clock-in', clockIn);
router.post('/attendance/clock-out', clockOut);

// ── Leave Requests ─────────────────────────────────────────────────────────────
router.get('/leaves', getLeaveRequests);
router.post('/leaves', submitLeaveRequest);
router.post('/leaves/allocate',
  authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN'),
  auditLog('ALLOCATE_LEAVE_DAYS', 'LEAVE_SERVICE'),
  grantLeaveAllocation
);
router.patch('/leaves/:id/status',
  authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER'),
  auditLog('UPDATE_LEAVE_STATUS', 'LEAVE_SERVICE'),
  updateLeaveStatus
);
router.patch('/leaves/:id/cancel', auditLog('CANCEL_LEAVE_REQUEST', 'LEAVE_SERVICE'), cancelLeaveRequest);

// ── Payroll ────────────────────────────────────────────────────────────────────
router.get('/payroll', getPayroll);
router.post('/payroll/generate',
  authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN'),
  auditLog('GENERATE_PAYROLL', 'PAYROLL_SERVICE'),
  generatePayroll
);
router.patch('/payroll/:id',
  authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN'),
  auditLog('EDIT_PAYROLL_RECORD', 'PAYROLL_SERVICE'),
  updatePayrollRecord
);
router.post('/payroll/approve',
  authorizeRoles('HR_MANAGER', 'SYSTEM_ADMIN'),
  auditLog('APPROVE_PAYROLL', 'PAYROLL_SERVICE'),
  approvePayroll
);

// ── Performance Appraisals / MPR ───────────────────────────────────────────────
router.get('/appraisals', getAppraisals);
router.post('/appraisals',
  authorizeRoles('SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER'),
  auditLog('CREATE_APPRAISAL', 'HR_SERVICE'),
  createAppraisal
);
router.patch('/appraisals/:id',
  auditLog('UPDATE_APPRAISAL', 'HR_SERVICE'),
  updateAppraisal
);

module.exports = router;
