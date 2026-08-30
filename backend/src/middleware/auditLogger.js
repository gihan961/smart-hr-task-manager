const store = require('../store/memoryStore');

const auditLog = (action, resource) => {
  return (req, res, next) => {
    // Intercept original send/json to log upon successful execution
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const details = `${action} performed on ${resource} by ${req.user.firstName} ${req.user.lastName} (${req.user.role})`;
        store.addAuditLog(
          req.user.id,
          `${req.user.firstName} ${req.user.lastName}`,
          req.user.role,
          action,
          resource,
          req.ip || '127.0.0.1',
          details
        );
      }
      return originalJson.call(this, body);
    };
    next();
  };
};

module.exports = { auditLog };
