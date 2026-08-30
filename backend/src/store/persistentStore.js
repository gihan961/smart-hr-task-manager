const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON file or initialize with default
function loadCollection(fileName, defaultData) {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error(`Error reading ${fileName}.json, initializing default data.`, e);
    }
  }
  // Write default data to file
  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
  return defaultData;
}

// Helper to save collection to disk
function saveCollection(fileName, data) {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error saving ${fileName}.json to disk:`, e);
  }
}

// Initial Clean Data Configuration (No Demo/Fake Data)
const defaultOrgs = [];
const defaultDepts = [];
const defaultUsers = [];
const defaultEmployeeProfiles = [];
const defaultProjects = [];
const defaultAttendance = [];
const defaultLeaves = [];
const defaultPayroll = [];
const defaultAppraisals = [];
const defaultTasks = [];
const defaultAnnouncements = [];
const defaultAuditLogs = [];


const defaultGroups = [];
const defaultEmployeeFiles = [];
const defaultPersonalTasks = [];
const defaultPersonalNotes = [];
const defaultCompanyHolidays = [];

// Load Collections into Memory & Wire Auto-Save Wrappers
const collections = {
  organizations: loadCollection('organizations', defaultOrgs),
  departments: loadCollection('departments', defaultDepts),
  users: loadCollection('users', defaultUsers),
  employeeProfiles: loadCollection('employeeProfiles', defaultEmployeeProfiles),
  projects: loadCollection('projects', defaultProjects),
  attendance: loadCollection('attendance', defaultAttendance),
  leaveRequests: loadCollection('leaveRequests', defaultLeaves),
  payrollRecords: loadCollection('payrollRecords', defaultPayroll),
  performanceAppraisals: loadCollection('performanceAppraisals', defaultAppraisals),
  tasks: loadCollection('tasks', defaultTasks),
  announcements: loadCollection('announcements', defaultAnnouncements),
  groups: loadCollection('groups', defaultGroups),
  employeeFiles: loadCollection('employeeFiles', defaultEmployeeFiles),
  clients: loadCollection('clients', []),
  masterTasks: loadCollection('masterTasks', []),
  claimBatches: loadCollection('claimBatches', []),
  chatMessages: loadCollection('chatMessages', []),
  auditLogs: loadCollection('auditLogs', defaultAuditLogs),
  personalTasks: loadCollection('personalTasks', defaultPersonalTasks),
  personalNotes: loadCollection('personalNotes', defaultPersonalNotes),
  companyHolidays: loadCollection('companyHolidays', defaultCompanyHolidays),
  csvSheets: loadCollection('csvSheets', [])
};


// Function to save any modified collection back to disk
function sync(collectionName) {
  if (collections[collectionName]) {
    saveCollection(collectionName, collections[collectionName]);
  }
}

module.exports = {
  ...collections,
  sync,
  addAuditLog: (userId, userName, userRole, action, resource, ipAddress, details) => {
    const log = {
      id: `log-${uuidv4().substring(0, 8)}`,
      userId,
      userName,
      userRole,
      action,
      resource,
      ipAddress: ipAddress || '127.0.0.1',
      details,
      timestamp: new Date().toISOString()
    };
    collections.auditLogs.unshift(log);
    sync('auditLogs');
    return log;
  }
};
