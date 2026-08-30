const { v4: uuidv4 } = require('uuid');
const store = require('../store/memoryStore');

// ─────────────────────────────────────────────
// PERSONAL TASKS (private per-user)
// ─────────────────────────────────────────────

const getMyTasks = (req, res) => {
  const userId = req.user.id;
  const tasks = (store.personalTasks || []).filter(t => t.userId === userId);
  res.json(tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

const createMyTask = (req, res) => {
  const userId = req.user.id;
  const { title, description, priority, dueDate, tags, status } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Task title is required.' });
  }

  const task = {
    id: `ptask-${uuidv4().substring(0, 8)}`,
    userId,
    title: title.trim(),
    description: description || '',
    priority: priority || 'MEDIUM',
    status: status || 'TODO',
    dueDate: dueDate || null,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null
  };

  if (!store.personalTasks) store.personalTasks = [];
  store.personalTasks.unshift(task);
  store.sync('personalTasks');

  res.status(201).json({ message: 'Personal task created.', task });
};

const updateMyTask = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, description, priority, dueDate, tags, status } = req.body;

  const task = (store.personalTasks || []).find(t => t.id === id && t.userId === userId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  if (title !== undefined)       task.title       = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined)    task.priority    = priority;
  if (dueDate !== undefined)     task.dueDate     = dueDate;
  if (tags !== undefined)        task.tags        = tags;
  if (status !== undefined) {
    task.status = status;
    if (status === 'DONE') {
      task.completedAt = new Date().toISOString();
    } else {
      task.completedAt = null;
    }
  }

  task.updatedAt = new Date().toISOString();
  store.sync('personalTasks');

  res.json({ message: 'Task updated.', task });
};

const deleteMyTask = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!store.personalTasks) return res.status(404).json({ message: 'Task not found.' });

  const idx = store.personalTasks.findIndex(t => t.id === id && t.userId === userId);
  if (idx === -1) return res.status(404).json({ message: 'Task not found or access denied.' });

  store.personalTasks.splice(idx, 1);
  store.sync('personalTasks');

  res.json({ message: 'Task deleted.' });
};

// ─────────────────────────────────────────────
// PERSONAL NOTES (private per-user)
// ─────────────────────────────────────────────

const getMyNotes = (req, res) => {
  const userId = req.user.id;
  const notes = (store.personalNotes || []).filter(n => n.userId === userId);
  res.json(notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
};

const createMyNote = (req, res) => {
  const userId = req.user.id;
  const { title, body, color } = req.body;

  const ALLOWED_COLORS = ['yellow', 'blue', 'green', 'pink', 'purple'];
  const noteColor = ALLOWED_COLORS.includes(color) ? color : 'yellow';

  const note = {
    id: `note-${uuidv4().substring(0, 8)}`,
    userId,
    title: (title || '').trim() || 'Untitled Note',
    body: body || '',
    color: noteColor,
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!store.personalNotes) store.personalNotes = [];
  store.personalNotes.unshift(note);
  store.sync('personalNotes');

  res.status(201).json({ message: 'Note created.', note });
};

const updateMyNote = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { title, body, color, pinned } = req.body;

  const note = (store.personalNotes || []).find(n => n.id === id && n.userId === userId);
  if (!note) return res.status(404).json({ message: 'Note not found.' });

  if (title !== undefined) note.title  = title;
  if (body  !== undefined) note.body   = body;
  if (color !== undefined) note.color  = color;
  if (pinned !== undefined) note.pinned = pinned;
  note.updatedAt = new Date().toISOString();
  store.sync('personalNotes');

  res.json({ message: 'Note updated.', note });
};

const deleteMyNote = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!store.personalNotes) return res.status(404).json({ message: 'Note not found.' });

  const idx = store.personalNotes.findIndex(n => n.id === id && n.userId === userId);
  if (idx === -1) return res.status(404).json({ message: 'Note not found or access denied.' });

  store.personalNotes.splice(idx, 1);
  store.sync('personalNotes');

  res.json({ message: 'Note deleted.' });
};

// ─────────────────────────────────────────────
// COMPANY HUB (org info + holidays)
// ─────────────────────────────────────────────

const getCompanyHub = (req, res) => {
  const org = store.organizations[0] || {
    name: 'Smart HR RCM Operations',
    code: 'SMARTHR',
    industry: 'Healthcare Revenue Cycle Management',
    foundedYear: 2019,
    ceo: 'Alexandra Reyes',
    website: 'https://smarthr-rcm.com',
    address: '400 Healthcare Blvd, Suite 2200, Chicago, IL 60601',
    phone: '+1 (312) 555-0100',
    email: 'hr@smarthr-rcm.com'
  };

  const departments = store.departments.length > 0 ? store.departments : [
    { id: 'd1', name: 'Medical Billing & Coding', headCount: 12 },
    { id: 'd2', name: 'Claims Processing', headCount: 8 },
    { id: 'd3', name: 'Quality Assurance', headCount: 5 },
    { id: 'd4', name: 'Technology & Platforms', headCount: 4 },
    { id: 'd5', name: 'Human Resources', headCount: 3 }
  ];

  // Default holidays if none exist
  if (!store.companyHolidays || store.companyHolidays.length === 0) {
    store.companyHolidays = [
      { id: 'hol-01', name: "New Year's Day",           date: '2026-01-01', type: 'PUBLIC' },
      { id: 'hol-02', name: 'Martin Luther King Jr. Day', date: '2026-01-19', type: 'PUBLIC' },
      { id: 'hol-03', name: "Presidents' Day",           date: '2026-02-16', type: 'PUBLIC' },
      { id: 'hol-04', name: 'Memorial Day',              date: '2026-05-25', type: 'PUBLIC' },
      { id: 'hol-05', name: 'Independence Day',          date: '2026-07-04', type: 'PUBLIC' },
      { id: 'hol-06', name: 'Labor Day',                 date: '2026-09-07', type: 'PUBLIC' },
      { id: 'hol-07', name: 'Thanksgiving Day',          date: '2026-11-26', type: 'PUBLIC' },
      { id: 'hol-08', name: 'Day After Thanksgiving',    date: '2026-11-27', type: 'COMPANY' },
      { id: 'hol-09', name: 'Christmas Eve',             date: '2026-12-24', type: 'COMPANY' },
      { id: 'hol-10', name: 'Christmas Day',             date: '2026-12-25', type: 'PUBLIC' },
      { id: 'hol-11', name: "New Year's Eve (Half-Day)", date: '2026-12-31', type: 'COMPANY' }
    ];
    store.sync('companyHolidays');
  }

  const today = new Date();
  const upcoming = store.companyHolidays
    .filter(h => new Date(h.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  res.json({
    organization: org,
    departments,
    holidays: store.companyHolidays.sort((a, b) => new Date(a.date) - new Date(b.date)),
    upcomingHolidays: upcoming,
    employeeCount: store.users.length,
    stats: {
      totalEmployees: store.users.length,
      activeProjects: store.projects.filter(p => p.status === 'ACTIVE').length,
      openTasks: store.tasks.filter(t => t.status !== 'COMPLETED').length
    }
  });
};

const addHoliday = (req, res) => {
  const { name, date, type } = req.body;
  if (!name || !date) return res.status(400).json({ message: 'Holiday name and date required.' });

  if (!store.companyHolidays) store.companyHolidays = [];
  const holiday = {
    id: `hol-${uuidv4().substring(0, 8)}`,
    name,
    date,
    type: type || 'COMPANY',
    addedBy: `${req.user.firstName} ${req.user.lastName}`,
    addedAt: new Date().toISOString()
  };

  store.companyHolidays.push(holiday);
  store.sync('companyHolidays');

  res.status(201).json({ message: 'Holiday added.', holiday });
};

const deleteHoliday = (req, res) => {
  const { id } = req.params;
  if (!store.companyHolidays) return res.status(404).json({ message: 'Holiday not found.' });

  const idx = store.companyHolidays.findIndex(h => h.id === id);
  if (idx === -1) return res.status(404).json({ message: 'Holiday not found.' });

  store.companyHolidays.splice(idx, 1);
  store.sync('companyHolidays');

  res.json({ message: 'Holiday deleted.' });
};

const updateCompanyDetails = (req, res) => {
  const { name, code, industry, foundedYear, ceo, website, address, phone, email } = req.body;

  let org = store.organizations[0];
  if (!org) {
    org = {
      id: `org-${uuidv4().substring(0, 8)}`,
      createdAt: new Date().toISOString()
    };
    store.organizations.push(org);
  }

  if (name !== undefined) org.name = name;
  if (code !== undefined) org.code = code;
  if (industry !== undefined) org.industry = industry;
  if (foundedYear !== undefined) org.foundedYear = parseInt(foundedYear) || org.foundedYear;
  if (ceo !== undefined) org.ceo = ceo;
  if (website !== undefined) org.website = website;
  if (address !== undefined) org.address = address;
  if (phone !== undefined) org.phone = phone;
  if (email !== undefined) org.email = email;

  store.sync('organizations');

  res.json({ message: 'Company details updated successfully.', organization: org });
};

module.exports = {
  getMyTasks, createMyTask, updateMyTask, deleteMyTask,
  getMyNotes, createMyNote, updateMyNote, deleteMyNote,
  getCompanyHub, updateCompanyDetails, addHoliday, deleteHoliday
};
