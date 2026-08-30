const { v4: uuidv4 } = require('uuid');
const store = require('../store/memoryStore');

const getProjects = (req, res) => {
  res.json(store.projects || []);
};

const createProject = (req, res) => {
  const { name, code, description, startDate, endDate, milestones } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required.' });
  }

  const projId = `proj-${uuidv4().substring(0, 8)}`;
  const newProject = {
    id: projId,
    name,
    code: code || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    description: description || '',
    status: 'IN_PROGRESS',
    progress: 0,
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
    managerId: req.user ? req.user.id : 'user-pm-01',
    milestones: milestones || [
      { id: `m-${uuidv4().substring(0, 4)}`, title: 'Project Kickoff & Requirements', dueDate: startDate || new Date().toISOString().split('T')[0], status: 'COMPLETED' },
      { id: `m-${uuidv4().substring(0, 4)}`, title: 'Core Implementation Sprint', dueDate: endDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0], status: 'IN_PROGRESS' }
    ]
  };

  store.projects = store.projects || [];
  store.projects.unshift(newProject);
  store.sync('projects');

  store.addAuditLog(
    req.user ? req.user.id : 'system',
    req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
    req.user ? req.user.role : 'PROJECT_MANAGER',
    'CREATE_PROJECT',
    'PROJECT_SERVICE',
    req.ip,
    `Created project "${newProject.name}" (${newProject.code}).`
  );

  res.status(201).json({ message: 'Project created successfully.', project: newProject });
};

const updateProjectStatus = (req, res) => {
  const { id } = req.params;
  const { status, progress } = req.body;

  const project = (store.projects || []).find(p => p.id === id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found.' });
  }

  if (status) project.status = status;
  if (progress !== undefined) project.progress = parseInt(progress);

  store.sync('projects');
  res.json({ message: 'Project updated successfully.', project });
};

module.exports = {
  getProjects,
  createProject,
  updateProjectStatus
};
