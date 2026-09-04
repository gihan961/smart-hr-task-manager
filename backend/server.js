const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  /\.netlify\.app$/,   // any Netlify subdomain
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    callback(allowed ? null : new Error('CORS not allowed'), allowed);
  },
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./src/routes/authRoutes');
const hrRoutes = require('./src/routes/hrRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const collaborationRoutes = require('./src/routes/collaborationRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const groupRoutes = require('./src/routes/groupRoutes');
const fileRoutes = require('./src/routes/fileRoutes');
const clientRoutes = require('./src/routes/clientRoutes');
const personalRoutes = require('./src/routes/personalRoutes');
const csvSheetRoutes = require('./src/routes/csvSheetRoutes');

const { connectDB, getDBStatus } = require('./src/config/db');

// Connect to MongoDB Database
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/personal', personalRoutes);
app.use('/api/csv-sheets', csvSheetRoutes);

// Serve uploaded files (for download)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Smart HR & Task Manager REST API',
    domain: 'Healthcare RCM Operations',
    database: getDBStatus(),
    timestamp: new Date().toISOString()
  });
});

// Database inspection endpoint
app.get('/api/database/status', (req, res) => {
  const dbStatus = getDBStatus();
  const persistentStore = require('./src/store/persistentStore');
  
  res.json({
    ...dbStatus,
    cleanMode: true,
    demoAccountsRemoved: true,
    collections: {
      usersCount: persistentStore.users.length,
      organizationsCount: persistentStore.organizations.length,
      departmentsCount: persistentStore.departments.length,
      tasksCount: persistentStore.tasks.length,
      projectsCount: persistentStore.projects.length,
      attendanceCount: persistentStore.attendance.length,
      leaveRequestsCount: persistentStore.leaveRequests.length,
      payrollRecordsCount: persistentStore.payrollRecords.length,
      auditLogsCount: persistentStore.auditLogs.length
    }
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Smart HR & Task Manager API Server running on port ${PORT}`);
  console.log(` Database: ${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smarthr'}`);
  console.log(` Local URL: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

