const { v4: uuidv4 } = require('uuid');
const store = require('../store/memoryStore');

// 1. Claim Batches
const getClaimBatches = (req, res) => {
  const result = store.claimBatches.map(b => {
    const now = new Date();
    const slaDate = new Date(b.timelyFilingSlaDeadline);
    const hoursLeft = Math.max(0, Math.round((slaDate - now) / (1000 * 3600)));
    return {
      ...b,
      hoursLeft,
      isSlaWarning: hoursLeft <= 24
    };
  });
  res.json(result);
};

const createClaimBatch = (req, res) => {
  const { batchName, payerName, totalClaims, totalDollarValue, timelyFilingDays } = req.body;

  const days = parseInt(timelyFilingDays) || 3;
  const slaDate = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

  const newBatch = {
    id: `batch-${uuidv4().substring(0, 8)}`,
    batchName,
    payerName,
    totalClaims: parseInt(totalClaims) || 100,
    totalDollarValue: parseFloat(totalDollarValue) || 250000,
    timelyFilingSlaDeadline: slaDate,
    status: 'IN_PROGRESS',
    assignedTeamId: 'dept-01'
  };

  store.claimBatches.unshift(newBatch);
  store.sync('claimBatches');

  res.status(201).json({ message: 'Claim batch created successfully.', batch: newBatch });
};

// 2. Tasks (Kanban Board Items)
const getTasks = (req, res) => {
  const result = store.tasks.map(t => {
    const assignedUser = store.users.find(u => u.id === t.assignedTo) || {};
    const project = (store.projects || []).find(p => p.id === t.projectId) || {};
    return {
      ...t,
      assignedUserName: `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim() || 'Unassigned',
      assignedUserAvatar: assignedUser.avatar || '',
      projectName: project.name || 'General Project'
    };
  });
  res.json(result);
};

const createTask = (req, res) => {
  const { title, description, projectId, priority, complexityIndex, estimatedHours, assignedTo, dueDate } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  const newTask = {
    id: `task-${uuidv4().substring(0, 8)}`,
    title,
    description: description || '',
    projectId: projectId || 'proj-01',
    status: 'TO_DO',
    priority: priority || 'MEDIUM',
    complexityIndex: parseFloat(complexityIndex) || 5.0,
    estimatedHours: parseFloat(estimatedHours) || 8,
    assignedTo: assignedTo || null,
    dueDate: dueDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };

  store.tasks.unshift(newTask);
  store.sync('tasks');

  store.addAuditLog(
    req.user ? req.user.id : 'system',
    req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
    req.user ? req.user.role : 'PROJECT_MANAGER',
    'CREATE_TASK',
    'TASK_SERVICE',
    req.ip,
    `Created task "${newTask.title}" (${newTask.priority} priority).`
  );

  res.status(201).json({ message: 'Task created successfully.', task: newTask });
};

const updateTaskStatus = (req, res) => {
  const { id } = req.params;
  const { status, priority, title, description } = req.body;

  const task = store.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (title) task.title = title;
  if (description) task.description = description;

  store.sync('tasks');

  if (req.user) {
    store.addAuditLog(
      req.user.id,
      `${req.user.firstName} ${req.user.lastName}`,
      req.user.role,
      'TASK_STATUS_UPDATE',
      'TASK_SERVICE',
      req.ip,
      `Updated task '${task.title}' status to '${task.status}'`
    );
  }

  res.json({ message: `Task updated successfully`, task });
};

const assignTask = (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  const task = store.tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found.' });
  }

  task.assignedTo = assignedTo;
  store.sync('tasks');

  const user = store.users.find(u => u.id === assignedTo);
  const userName = user ? `${user.firstName} ${user.lastName}` : 'Unassigned';

  res.json({ message: `Task assigned to ${userName}`, task });
};

module.exports = {
  getClaimBatches,
  createClaimBatch,
  getTasks,
  createTask,
  updateTaskStatus,
  assignTask
};
