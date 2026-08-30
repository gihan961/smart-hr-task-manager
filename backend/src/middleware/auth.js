const jwt = require('jsonwebtoken');
const store = require('../store/memoryStore');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-hr-rcm-super-secret-key-2026';

// Middleware to authenticate JWT token strictly
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired session token. Please log in again.' });
    }

    const user = store.users.find(u => u.id === decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }
    req.user = user;
    next();
  });
};

// Middleware for Role-Based Access Control (RBAC)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Role '${req.user.role}' lacks permission for this resource.` 
      });
    }
    next();
  };
};

module.exports = {
  JWT_SECRET,
  authenticateToken,
  authorizeRoles
};
