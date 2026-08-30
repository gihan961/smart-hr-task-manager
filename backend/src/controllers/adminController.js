const store = require('../store/memoryStore');

const getOrganization = (req, res) => {
  res.json(store.organizations[0]);
};

const getDepartments = (req, res) => {
  res.json(store.departments);
};

const getAuditLogs = (req, res) => {
  const { action, userRole, search } = req.query;

  let result = [...store.auditLogs];

  if (action) {
    result = result.filter(l => l.action === action);
  }
  if (userRole) {
    result = result.filter(l => l.userRole === userRole);
  }
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(l =>
      l.userName.toLowerCase().includes(s) ||
      l.details.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s)
    );
  }

  res.json(result);
};

module.exports = {
  getOrganization,
  getDepartments,
  getAuditLogs
};
