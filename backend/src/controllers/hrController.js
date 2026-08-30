const { v4: uuidv4 } = require('uuid');
const store = require('../store/memoryStore');
const { sendAccountCreatedEmail } = require('../utils/mailer');

// ─────────────────────────────────────────────
// UTILITY: Compute payroll for one employee profile
// ─────────────────────────────────────────────
function computePayBreakdown(emp, profile, period) {
  const baseSalary         = parseFloat(profile.monthlyBaseSalary || profile.hourlyRate * 160 || 5000);
  const housingAllowance   = parseFloat(profile.housingAllowance   || 0);
  const transportAllowance = parseFloat(profile.transportAllowance || 0);
  const performanceBonus   = parseFloat(profile.performanceBonus   || 0);
  const overtimePay        = parseFloat(profile.overtimePay        || 0);
  const otherAllowances    = parseFloat(profile.otherAllowances    || 0);

  const grossPay = baseSalary + housingAllowance + transportAllowance + performanceBonus + overtimePay + otherAllowances;

  // Deductions
  const epfEmployee    = Math.round(grossPay * 0.08);   // 8% EPF employee
  const epfEmployer    = Math.round(grossPay * 0.12);   // 12% EPF employer (cost info only)
  const incomeTax      = Math.round(grossPay > 5000 ? (grossPay - 5000) * 0.06 : 0);
  const otherDeductions = parseFloat(profile.otherDeductions || 0);
  const totalDeductions = epfEmployee + incomeTax + otherDeductions;

  const netPay = grossPay - totalDeductions;

  return {
    baseSalary: Math.round(baseSalary * 100) / 100,
    housingAllowance: Math.round(housingAllowance * 100) / 100,
    transportAllowance: Math.round(transportAllowance * 100) / 100,
    performanceBonus: Math.round(performanceBonus * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    otherAllowances: Math.round(otherAllowances * 100) / 100,
    grossPay: Math.round(grossPay * 100) / 100,
    epfEmployee: Math.round(epfEmployee * 100) / 100,
    epfEmployer: Math.round(epfEmployer * 100) / 100,
    incomeTax: Math.round(incomeTax * 100) / 100,
    otherDeductions: Math.round(otherDeductions * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netPay: Math.round(netPay * 100) / 100,
  };
}

// ─────────────────────────────────────────────
// 1. EMPLOYEE PROFILES
// ─────────────────────────────────────────────
const getEmployees = (req, res) => {
  const result = store.users.map(u => {
    let profile = store.employeeProfiles.find(ep => ep.userId === u.id);
    if (!profile) {
      profile = {
        id: `emp-${uuidv4().substring(0, 8)}`,
        userId: u.id,
        jobTitle: u.role === 'SYSTEM_ADMIN' ? 'System Administrator' :
                  u.role === 'PROJECT_MANAGER' ? 'Project Operations Manager' :
                  u.role === 'TEAM_LEADER' ? 'Team Lead Supervisor' :
                  u.role === 'HR_MANAGER' ? 'HR Operations Lead' : 'RCM Specialist',
        specialties: ['RCM Billing', 'QA Audit'],
        codingAccuracyRate: 98.5,
        dailyCapacityHours: 8,
        hourlyRate: 40.0,
        monthlyBaseSalary: 6400,
        housingAllowance: 500,
        transportAllowance: 200,
        performanceBonus: 0,
        overtimePay: 0,
        otherAllowances: 0,
        otherDeductions: 0,
        payGrade: 'C2',
        paymentMethod: 'BANK_TRANSFER',
        joinedDate: new Date().toISOString().split('T')[0],
        phone: '+1 (555) 234-5678',
        emergencyContact: 'Family Contact (+1 555-999-0000)',
        address: '128 Healthcare Blvd, Suite 400',
        leaveBalances: { annual: 14, sick: 7, casual: 5, medical: 10 }
      };
      store.employeeProfiles.push(profile);
      store.sync('employeeProfiles');
    }

    // Backfill missing salary fields
    if (profile.housingAllowance   === undefined) profile.housingAllowance   = 0;
    if (profile.transportAllowance === undefined) profile.transportAllowance = 0;
    if (profile.performanceBonus   === undefined) profile.performanceBonus   = 0;
    if (profile.overtimePay        === undefined) profile.overtimePay        = 0;
    if (profile.otherAllowances    === undefined) profile.otherAllowances    = 0;
    if (profile.otherDeductions    === undefined) profile.otherDeductions    = 0;
    if (!profile.payGrade)    profile.payGrade    = 'C2';
    if (!profile.paymentMethod) profile.paymentMethod = 'BANK_TRANSFER';
    if (!profile.leaveBalances) profile.leaveBalances = { annual: 14, sick: 7, casual: 5, medical: 10 };

    const dept = store.departments.find(d => d.id === u.departmentId) || {};
    const userTasks = store.tasks.filter(t => t.assignedTo === u.id);
    const completedTasksCount = userTasks.filter(t => t.status === 'COMPLETED').length;
    const activeTasksCount = userTasks.filter(t => t.status !== 'COMPLETED').length;
    const userAppraisals = store.performanceAppraisals.filter(a => a.userId === u.id);

    // Check if MPR is due (no completed review in last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentMPR = userAppraisals.find(a =>
      a.type === 'MPR' &&
      a.status !== 'DRAFT' &&
      new Date(a.submittedAt || a.createdAt || 0) > thirtyDaysAgo
    );
    const mprDue = !recentMPR;

    return {
      ...u,
      departmentName: dept.name || 'Operations & Healthcare RCM',
      profile,
      completedTasksCount,
      activeTasksCount,
      appraisals: userAppraisals,
      mprDue
    };
  });
  res.json(result);
};

const createEmployee = (req, res) => {
  const { firstName, lastName, email, role, departmentId, jobTitle, specialties, hourlyRate, monthlyBaseSalary, phone, address, emergencyContact } = req.body;

  const userId = `user-${uuidv4().substring(0, 8)}`;
  const newUser = {
    id: userId,
    email,
    passwordHash: '$2a$10$X8/XpD5rT0FkXmUqVz6Zxe9vL2Y3k5W7m9P0Q1R2S3T4U5V6W7X8Y',
    firstName,
    lastName,
    role: role || 'EMPLOYEE',
    departmentId: departmentId || 'dept-01',
    status: 'ACTIVE',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`
  };

  const hrlyRate = parseFloat(hourlyRate) || 35.0;
  const baseSalary = parseFloat(monthlyBaseSalary) || hrlyRate * 160;

  const empProfile = {
    id: `emp-${uuidv4().substring(0, 8)}`,
    userId,
    jobTitle: jobTitle || 'RCM Specialist',
    specialties: specialties || ['ICD-10-CM', 'CPT Coding'],
    codingAccuracyRate: 98.0,
    dailyCapacityHours: 8,
    hourlyRate: hrlyRate,
    monthlyBaseSalary: baseSalary,
    housingAllowance: 300,
    transportAllowance: 150,
    performanceBonus: 0,
    overtimePay: 0,
    otherAllowances: 0,
    otherDeductions: 0,
    payGrade: 'B1',
    paymentMethod: 'BANK_TRANSFER',
    joinedDate: new Date().toISOString().split('T')[0],
    phone: phone || '+1 (555) 100-2000',
    emergencyContact: emergencyContact || 'Family Contact',
    address: address || 'Main Campus Office',
    leaveBalances: { annual: 14, sick: 7, casual: 5, medical: 10 }
  };

  store.users.push(newUser);
  store.employeeProfiles.push(empProfile);
  store.sync('users');
  store.sync('employeeProfiles');

  // AUTO-CREATE first MPR for the new employee (DRAFT state)
  const autoMPR = {
    id: `appraisal-${uuidv4().substring(0, 8)}`,
    userId,
    userName: `${firstName} ${lastName}`,
    reviewerId: req.user ? req.user.id : 'hr-system',
    reviewerName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'HR System',
    type: 'MPR',
    reviewCycle: 'monthly',
    reviewPeriod: new Date().toISOString().substring(0, 7),
    overallRating: null,
    kpiScores: { quality: null, productivity: null, teamwork: null, attendance: null },
    goalsMetCount: 0,
    totalGoalsCount: 5,
    strengths: '',
    areasForImprovement: '',
    salaryAdjustmentPct: 0,
    bonusAwarded: 0,
    incrementEffectiveDate: '',
    status: 'DRAFT',
    notes: 'Auto-created upon employee onboarding. Please complete this MPR within 30 days.',
    createdAt: new Date().toISOString(),
    submittedAt: null
  };

  store.performanceAppraisals.unshift(autoMPR);
  store.sync('performanceAppraisals');

  sendAccountCreatedEmail({
    toEmail: newUser.email,
    tempPassword: 'password123',
    userName: `${newUser.firstName} ${newUser.lastName}`,
    role: newUser.role
  }).catch(err => console.error('HR onboarding email error:', err));

  res.status(201).json({
    message: 'Employee onboarded successfully.',
    user: newUser,
    profile: empProfile,
    autoMPR
  });
};

// 1b. Update Employee Demographics
const updateEmployeeDemographics = (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, role, jobTitle, departmentId, phone, emergencyContact, address, hourlyRate, monthlyBaseSalary, codingAccuracyRate } = req.body;

  const user = store.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'Employee user not found.' });

  if (firstName)    user.firstName    = firstName;
  if (lastName)     user.lastName     = lastName;
  if (role)         user.role         = role;
  if (departmentId) user.departmentId = departmentId;
  store.sync('users');

  let profile = store.employeeProfiles.find(ep => ep.userId === id);
  if (!profile) {
    profile = { id: `emp-${uuidv4().substring(0, 8)}`, userId: id };
    store.employeeProfiles.push(profile);
  }

  if (jobTitle)           profile.jobTitle           = jobTitle;
  if (phone)              profile.phone              = phone;
  if (emergencyContact)   profile.emergencyContact   = emergencyContact;
  if (address)            profile.address            = address;
  if (hourlyRate)         profile.hourlyRate         = parseFloat(hourlyRate);
  if (monthlyBaseSalary)  profile.monthlyBaseSalary  = parseFloat(monthlyBaseSalary);
  if (codingAccuracyRate) profile.codingAccuracyRate = parseFloat(codingAccuracyRate);
  store.sync('employeeProfiles');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'EMPLOYEE_DEMOGRAPHICS_UPDATED', 'HR_SERVICE', req.ip,
    `Updated demographic records for ${user.firstName} ${user.lastName}.`);

  res.json({ message: 'Employee demographics updated successfully.', user, profile });
};

// 1c. Update Employee Salary Configuration (new advanced salary endpoint)
const updateEmployeeSalary = (req, res) => {
  const { id } = req.params;
  const {
    monthlyBaseSalary, hourlyRate, housingAllowance, transportAllowance,
    otherAllowances, otherDeductions, payGrade, paymentMethod
  } = req.body;

  const user = store.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ message: 'Employee not found.' });

  let profile = store.employeeProfiles.find(ep => ep.userId === id);
  if (!profile) {
    profile = { id: `emp-${uuidv4().substring(0, 8)}`, userId: id };
    store.employeeProfiles.push(profile);
  }

  if (monthlyBaseSalary  !== undefined) profile.monthlyBaseSalary  = parseFloat(monthlyBaseSalary);
  if (hourlyRate         !== undefined) profile.hourlyRate         = parseFloat(hourlyRate);
  if (housingAllowance   !== undefined) profile.housingAllowance   = parseFloat(housingAllowance);
  if (transportAllowance !== undefined) profile.transportAllowance = parseFloat(transportAllowance);
  if (otherAllowances    !== undefined) profile.otherAllowances    = parseFloat(otherAllowances);
  if (otherDeductions    !== undefined) profile.otherDeductions    = parseFloat(otherDeductions);
  if (payGrade)          profile.payGrade    = payGrade;
  if (paymentMethod)     profile.paymentMethod = paymentMethod;
  store.sync('employeeProfiles');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'SALARY_CONFIG_UPDATED', 'PAYROLL_SERVICE', req.ip,
    `Updated salary configuration for ${user.firstName} ${user.lastName}. New base: $${monthlyBaseSalary || profile.monthlyBaseSalary}.`);

  res.json({ message: 'Salary configuration updated successfully.', profile });
};

// 1d. Grant / Allocate Leave Days
const grantLeaveAllocation = (req, res) => {
  const { userId, leaveType, daysCount, reason } = req.body;

  const user = store.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'Employee user not found.' });

  let profile = store.employeeProfiles.find(ep => ep.userId === userId);
  if (!profile) {
    profile = { id: `emp-${uuidv4().substring(0, 8)}`, userId, leaveBalances: { annual: 14, sick: 7, casual: 5, medical: 10 } };
    store.employeeProfiles.push(profile);
  }

  if (!profile.leaveBalances) {
    profile.leaveBalances = { annual: 14, sick: 7, casual: 5, medical: 10 };
  }

  const typeKey = (leaveType || 'ANNUAL').toLowerCase();
  const addedDays = parseInt(daysCount) || 1;
  profile.leaveBalances[typeKey] = (profile.leaveBalances[typeKey] || 0) + addedDays;
  store.sync('employeeProfiles');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'LEAVE_DAYS_ALLOCATED', 'HR_SERVICE', req.ip,
    `Granted ${addedDays} additional ${leaveType} leave days to ${user.firstName} ${user.lastName} (Reason: ${reason || 'HR Grant'}).`);

  res.json({
    message: `Successfully granted ${addedDays} ${leaveType} leave days to ${user.firstName} ${user.lastName}!`,
    leaveBalances: profile.leaveBalances
  });
};

// 1e. Employee updates their own demographics
const updateMyDemographics = (req, res) => {
  const userId = req.user.id;
  const { phone, emergencyContact, address, avatar } = req.body;

  const user = store.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User account not found.' });

  if (avatar) user.avatar = avatar;
  store.sync('users');

  let profile = store.employeeProfiles.find(ep => ep.userId === userId);
  if (!profile) {
    profile = { id: `emp-${uuidv4().substring(0, 8)}`, userId };
    store.employeeProfiles.push(profile);
  }

  if (phone             !== undefined) profile.phone             = phone;
  if (emergencyContact  !== undefined) profile.emergencyContact  = emergencyContact;
  if (address           !== undefined) profile.address           = address;
  store.sync('employeeProfiles');

  res.json({ message: 'Personal demographics updated successfully.', user, profile });
};

// ─────────────────────────────────────────────
// 2. ATTENDANCE
// ─────────────────────────────────────────────
const getAttendance = (req, res) => {
  const result = store.attendance.map(a => {
    const user = store.users.find(u => u.id === a.userId) || {};
    return { ...a, userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() };
  });
  res.json(result);
};

const clockIn = (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  let record = store.attendance.find(a => a.userId === userId && a.date === todayStr);
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (!record) {
    record = {
      id: `att-${uuidv4().substring(0, 8)}`,
      userId,
      date: todayStr,
      clockIn: timeStr,
      clockOut: null,
      status: 'PRESENT',
      hoursWorked: 0,
      ipAddress: req.ip || '127.0.0.1'
    };
    store.attendance.push(record);
  } else {
    record.clockIn = timeStr;
    record.clockOut = null;
  }

  store.sync('attendance');
  res.json({ message: `Clocked in successfully at ${timeStr}`, record });
};

const clockOut = (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  const record = store.attendance.find(a => a.userId === userId && a.date === todayStr);

  if (!record || !record.clockIn) {
    return res.status(400).json({ message: 'Must clock in before clocking out.' });
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  record.clockOut = timeStr;
  record.hoursWorked = 8.0;

  store.sync('attendance');
  res.json({ message: `Clocked out successfully at ${timeStr}`, record });
};

// ─────────────────────────────────────────────
// 3. LEAVE REQUESTS
// ─────────────────────────────────────────────
const getLeaveRequests = (req, res) => {
  res.json(store.leaveRequests);
};

const submitLeaveRequest = (req, res) => {
  const { leaveType, startDate, endDate, reason, targetTeamLeadId } = req.body;
  const userId = req.user.id;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysCount = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)) + 1);

  let riskScore = 15.0;
  let riskReason = 'Low capacity impact during requested window.';

  const batches = store.claimBatches || [];
  const urgentBatches = batches.filter(b => b.status !== 'COMPLETED');
  if (urgentBatches.length > 0 && daysCount > 2) {
    riskScore = 68.4;
    riskReason = `Overlaps with ${urgentBatches.length} active RCM claim batch deadlines. SLA risk score: 68.4%`;
  }

  let teamLeadId = targetTeamLeadId || null;
  let teamLeadName = 'All Team Leads';

  if (teamLeadId) {
    const tlUser = store.users.find(u => u.id === teamLeadId);
    if (tlUser) teamLeadName = `${tlUser.firstName} ${tlUser.lastName}`;
  } else {
    const userGroup = store.groups.find(g => g.memberIds && g.memberIds.includes(userId));
    if (userGroup && userGroup.teamLeadId) {
      teamLeadId = userGroup.teamLeadId;
      const tlUser = store.users.find(u => u.id === teamLeadId);
      if (tlUser) teamLeadName = `${tlUser.firstName} ${tlUser.lastName}`;
    }
  }

  const newLeave = {
    id: `leave-${uuidv4().substring(0, 8)}`,
    userId,
    userName: `${req.user.firstName} ${req.user.lastName}`,
    userEmail: req.user.email,
    teamLeadId,
    teamLeadName,
    leaveType: leaveType || 'ANNUAL',
    startDate,
    endDate,
    daysCount,
    reason,
    status: 'PENDING',
    aiRiskScore: riskScore,
    aiRiskReason: riskReason,
    createdAt: new Date().toISOString()
  };

  store.leaveRequests.unshift(newLeave);
  store.sync('leaveRequests');

  res.status(201).json({ message: 'Leave request submitted successfully.', leave: newLeave });
};

const updateLeaveStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const leave = store.leaveRequests.find(l => l.id === id);
  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

  leave.status = status;
  store.sync('leaveRequests');

  res.json({ message: `Leave request ${status.toLowerCase()} successfully.`, leave });
};

const cancelLeaveRequest = (req, res) => {
  const { id } = req.params;
  const leave = store.leaveRequests.find(l => l.id === id);

  if (!leave) return res.status(404).json({ message: 'Leave request not found.' });

  if (leave.userId !== req.user.id && !['HR_MANAGER', 'SYSTEM_ADMIN', 'TEAM_LEADER', 'PROJECT_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized to cancel this leave request.' });
  }

  leave.status = 'CANCELLED';
  leave.cancelledAt = new Date().toISOString();
  leave.cancelledByName = `${req.user.firstName} ${req.user.lastName}`;
  store.sync('leaveRequests');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'LEAVE_REQUEST_CANCELLED', 'LEAVE_SERVICE', req.ip,
    `Cancelled leave request ${id} for ${leave.userName}.`);

  res.json({ message: 'Leave request cancelled successfully.', leave });
};

// ─────────────────────────────────────────────
// 4. PAYROLL — Advanced Engine
// ─────────────────────────────────────────────
const getPayroll = (req, res) => {
  const { period } = req.query;
  let records = store.payrollRecords;
  if (period) {
    records = records.filter(p => p.period === period);
  }
  res.json(records);
};

const generatePayroll = (req, res) => {
  const { period } = req.body;
  const periodStr = period || new Date().toISOString().substring(0, 7);

  // Remove existing DRAFT records for this period (re-generate)
  const existingDrafts = store.payrollRecords.filter(p => p.period === periodStr && p.status === 'DRAFT');
  existingDrafts.forEach(d => {
    const idx = store.payrollRecords.indexOf(d);
    if (idx > -1) store.payrollRecords.splice(idx, 1);
  });

  const newRecords = store.users.map(u => {
    const emp = store.employeeProfiles.find(ep => ep.userId === u.id) || {};
    const breakdown = computePayBreakdown(u, emp, periodStr);

    return {
      id: `pay-${uuidv4().substring(0, 8)}`,
      userId: u.id,
      userName: `${u.firstName} ${u.lastName}`,
      userEmail: u.email,
      userRole: u.role,
      period: periodStr,
      ...breakdown,
      payGrade: emp.payGrade || 'C2',
      paymentMethod: emp.paymentMethod || 'BANK_TRANSFER',
      status: 'DRAFT',
      notes: '',
      generatedBy: `${req.user.firstName} ${req.user.lastName}`,
      generatedAt: new Date().toISOString(),
      paymentDate: null
    };
  });

  store.payrollRecords.push(...newRecords);
  store.sync('payrollRecords');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'PAYROLL_GENERATED', 'PAYROLL_SERVICE', req.ip,
    `Payroll generated for period ${periodStr}. ${newRecords.length} records created.`);

  res.json({ message: `Payroll generated for period ${periodStr}`, records: newRecords });
};

// HR edits an individual payroll record
const updatePayrollRecord = (req, res) => {
  const { id } = req.params;
  const {
    baseSalary, housingAllowance, transportAllowance, performanceBonus,
    overtimePay, otherAllowances, epfEmployee, incomeTax, otherDeductions,
    status, notes, paymentDate, paymentMethod
  } = req.body;

  const record = store.payrollRecords.find(p => p.id === id);
  if (!record) return res.status(404).json({ message: 'Payroll record not found.' });

  // Allow HR to override individual fields
  if (baseSalary          !== undefined) record.baseSalary          = parseFloat(baseSalary);
  if (housingAllowance    !== undefined) record.housingAllowance    = parseFloat(housingAllowance);
  if (transportAllowance  !== undefined) record.transportAllowance  = parseFloat(transportAllowance);
  if (performanceBonus    !== undefined) record.performanceBonus    = parseFloat(performanceBonus);
  if (overtimePay         !== undefined) record.overtimePay         = parseFloat(overtimePay);
  if (otherAllowances     !== undefined) record.otherAllowances     = parseFloat(otherAllowances);
  if (epfEmployee         !== undefined) record.epfEmployee         = parseFloat(epfEmployee);
  if (incomeTax           !== undefined) record.incomeTax           = parseFloat(incomeTax);
  if (otherDeductions     !== undefined) record.otherDeductions     = parseFloat(otherDeductions);
  if (notes               !== undefined) record.notes               = notes;
  if (paymentMethod       !== undefined) record.paymentMethod       = paymentMethod;

  // Recalculate derived totals
  record.grossPay        = (record.baseSalary || 0) + (record.housingAllowance || 0) + (record.transportAllowance || 0) + (record.performanceBonus || 0) + (record.overtimePay || 0) + (record.otherAllowances || 0);
  record.totalDeductions = (record.epfEmployee || 0) + (record.incomeTax || 0) + (record.otherDeductions || 0);
  record.netPay          = record.grossPay - record.totalDeductions;

  // Round
  ['grossPay', 'totalDeductions', 'netPay'].forEach(k => { record[k] = Math.round(record[k] * 100) / 100; });

  // Handle status changes
  if (status) {
    record.status = status;
    if (status === 'PAID') {
      record.paymentDate = paymentDate || new Date().toISOString().split('T')[0];
    }
  }

  record.lastEditedBy = `${req.user.firstName} ${req.user.lastName}`;
  record.lastEditedAt = new Date().toISOString();

  store.sync('payrollRecords');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'PAYROLL_RECORD_EDITED', 'PAYROLL_SERVICE', req.ip,
    `Edited payroll record ${id} for ${record.userName} (Period: ${record.period}). Status: ${record.status}.`);

  res.json({ message: 'Payroll record updated.', record });
};

// Approve / set payroll records to PAID for a period
const approvePayroll = (req, res) => {
  const { period, userIds } = req.body;
  const periodStr = period || new Date().toISOString().substring(0, 7);

  let records = store.payrollRecords.filter(p => p.period === periodStr);
  if (userIds && userIds.length > 0) {
    records = records.filter(p => userIds.includes(p.userId));
  }

  const payDate = new Date().toISOString().split('T')[0];
  records.forEach(r => {
    r.status = 'PAID';
    r.paymentDate = payDate;
    r.approvedBy = `${req.user.firstName} ${req.user.lastName}`;
    r.approvedAt = new Date().toISOString();
  });

  store.sync('payrollRecords');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'PAYROLL_APPROVED', 'PAYROLL_SERVICE', req.ip,
    `Approved payroll for period ${periodStr}. ${records.length} records marked as PAID.`);

  res.json({ message: `Payroll approved and ${records.length} employees marked as PAID.`, records });
};

// ─────────────────────────────────────────────
// 5. PERFORMANCE APPRAISALS / MPR
// ─────────────────────────────────────────────
const getAppraisals = (req, res) => {
  // Enrich with user info
  const result = store.performanceAppraisals.map(a => {
    const user = store.users.find(u => u.id === a.userId) || {};
    return {
      ...a,
      userEmail: user.email || '',
      userRole: user.role || '',
    };
  });
  res.json(result);
};

const createAppraisal = (req, res) => {
  const {
    userId, reviewPeriod, type, reviewCycle,
    overallRating, kpiScores, goalsMetCount, totalGoalsCount,
    strengths, areasForImprovement,
    salaryAdjustmentPct, bonusAwarded, incrementEffectiveDate, notes
  } = req.body;

  const targetUser = store.users.find(u => u.id === userId);
  if (!targetUser) return res.status(404).json({ message: 'Target employee user account not found.' });

  const reviewer = req.user;
  const newAppraisal = {
    id: `appraisal-${uuidv4().substring(0, 8)}`,
    userId: targetUser.id,
    userName: `${targetUser.firstName} ${targetUser.lastName}`,
    reviewerId: reviewer ? reviewer.id : 'user-admin-01',
    reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Administrator',
    type: type || 'MPR',
    reviewCycle: reviewCycle || 'monthly',
    reviewPeriod: reviewPeriod || new Date().toISOString().substring(0, 7),
    overallRating: parseFloat(overallRating) || null,
    kpiScores: kpiScores || { quality: null, productivity: null, teamwork: null, attendance: null },
    goalsMetCount: parseInt(goalsMetCount) || 0,
    totalGoalsCount: parseInt(totalGoalsCount) || 5,
    strengths: strengths || '',
    areasForImprovement: areasForImprovement || '',
    salaryAdjustmentPct: parseFloat(salaryAdjustmentPct) || 0,
    bonusAwarded: parseFloat(bonusAwarded) || 0,
    incrementEffectiveDate: incrementEffectiveDate || '',
    notes: notes || '',
    status: 'IN_REVIEW',
    createdAt: new Date().toISOString(),
    submittedAt: new Date().toISOString().split('T')[0]
  };

  store.performanceAppraisals.unshift(newAppraisal);
  store.sync('performanceAppraisals');

  store.addAuditLog(
    reviewer ? reviewer.id : 'system',
    reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Admin',
    reviewer ? reviewer.role : 'ADMIN',
    'APPRAISAL_SUBMITTED', 'HR_SERVICE', req.ip,
    `${type || 'MPR'} submitted for ${targetUser.firstName} ${targetUser.lastName} (Period: ${newAppraisal.reviewPeriod}, Rating: ${newAppraisal.overallRating || 'TBD'}/5.0).`
  );

  res.status(201).json({ message: `${type || 'MPR'} submitted successfully.`, appraisal: newAppraisal });
};

// Update appraisal / MPR status or fields
const updateAppraisal = (req, res) => {
  const { id } = req.params;
  const {
    status, overallRating, kpiScores, strengths, areasForImprovement,
    goalsMetCount, totalGoalsCount, salaryAdjustmentPct, bonusAwarded,
    incrementEffectiveDate, notes
  } = req.body;

  const appraisal = store.performanceAppraisals.find(a => a.id === id);
  if (!appraisal) return res.status(404).json({ message: 'Appraisal not found.' });

  // Employees can only ACKNOWLEDGE their own completed reviews
  if (req.user.role === 'EMPLOYEE') {
    if (appraisal.userId !== req.user.id) return res.status(403).json({ message: 'Access denied.' });
    if (status !== 'ACKNOWLEDGED') return res.status(403).json({ message: 'Employees can only acknowledge completed reviews.' });
    appraisal.status = 'ACKNOWLEDGED';
    appraisal.acknowledgedAt = new Date().toISOString();
    store.sync('performanceAppraisals');
    return res.json({ message: 'Review acknowledged successfully.', appraisal });
  }

  // HR / Manager can update all fields
  if (status)                  appraisal.status                  = status;
  if (overallRating !== undefined) appraisal.overallRating       = parseFloat(overallRating);
  if (kpiScores)               appraisal.kpiScores               = kpiScores;
  if (strengths !== undefined) appraisal.strengths               = strengths;
  if (areasForImprovement !== undefined) appraisal.areasForImprovement = areasForImprovement;
  if (goalsMetCount !== undefined) appraisal.goalsMetCount       = parseInt(goalsMetCount);
  if (totalGoalsCount !== undefined) appraisal.totalGoalsCount   = parseInt(totalGoalsCount);
  if (salaryAdjustmentPct !== undefined) appraisal.salaryAdjustmentPct = parseFloat(salaryAdjustmentPct);
  if (bonusAwarded !== undefined) appraisal.bonusAwarded         = parseFloat(bonusAwarded);
  if (incrementEffectiveDate !== undefined) appraisal.incrementEffectiveDate = incrementEffectiveDate;
  if (notes !== undefined) appraisal.notes                       = notes;

  if (status === 'COMPLETED') {
    appraisal.submittedAt = new Date().toISOString().split('T')[0];
  }

  appraisal.lastUpdatedBy = `${req.user.firstName} ${req.user.lastName}`;
  appraisal.lastUpdatedAt = new Date().toISOString();

  store.sync('performanceAppraisals');

  store.addAuditLog(req.user.id, `${req.user.firstName} ${req.user.lastName}`, req.user.role,
    'APPRAISAL_UPDATED', 'HR_SERVICE', req.ip,
    `Updated ${appraisal.type || 'MPR'} for ${appraisal.userName}. New status: ${appraisal.status}.`);

  res.json({ message: 'Appraisal updated successfully.', appraisal });
};

// ─────────────────────────────────────────────
// 6. HR ANALYTICS
// ─────────────────────────────────────────────
const getHRAnalytics = (req, res) => {
  const users = store.users;
  const profiles = store.employeeProfiles;
  const payrolls = store.payrollRecords;
  const appraisals = store.performanceAppraisals;
  const leaves = store.leaveRequests;
  const attendance = store.attendance;

  const currentPeriod = new Date().toISOString().substring(0, 7);
  const currentPayrolls = payrolls.filter(p => p.period === currentPeriod);
  const totalSalaryCost = currentPayrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const totalGrossCost  = currentPayrolls.reduce((sum, p) => sum + (p.grossPay || 0), 0);

  const completedAppraisals = appraisals.filter(a => a.status === 'COMPLETED' || a.status === 'ACKNOWLEDGED');
  const avgRating = completedAppraisals.length > 0
    ? completedAppraisals.filter(a => a.overallRating).reduce((s, a) => s + a.overallRating, 0) / completedAppraisals.filter(a => a.overallRating).length
    : 0;

  const roleBreakdown = {};
  users.forEach(u => {
    roleBreakdown[u.role] = (roleBreakdown[u.role] || 0) + 1;
  });

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;
  const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;

  // MPR completion this month
  const mprThisMonth = appraisals.filter(a => a.type === 'MPR' && a.reviewPeriod === currentPeriod);
  const mprCompleted = mprThisMonth.filter(a => a.status === 'COMPLETED' || a.status === 'ACKNOWLEDGED').length;
  const mprDue = users.length - mprCompleted;

  // Avg salary
  const avgSalary = profiles.length > 0
    ? profiles.reduce((s, p) => s + (p.monthlyBaseSalary || 0), 0) / profiles.length
    : 0;

  res.json({
    headcount: {
      total: users.length,
      active: users.filter(u => u.status !== 'INACTIVE').length,
      byRole: roleBreakdown
    },
    payroll: {
      currentPeriod,
      totalNetPay: Math.round(totalSalaryCost),
      totalGrossPay: Math.round(totalGrossCost),
      avgMonthlySalary: Math.round(avgSalary),
      recordCount: currentPayrolls.length,
      paidCount: currentPayrolls.filter(p => p.status === 'PAID').length,
      draftCount: currentPayrolls.filter(p => p.status === 'DRAFT').length
    },
    appraisals: {
      total: appraisals.length,
      completed: completedAppraisals.length,
      mprDueCount: mprDue,
      mprCompletedThisMonth: mprCompleted,
      avgRating: Math.round(avgRating * 10) / 10
    },
    leaves: {
      pending: pendingLeaves,
      approved: approvedLeaves,
      total: leaves.length
    },
    attendance: {
      todayPresent: attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'PRESENT').length
    }
  });
};

module.exports = {
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
};
