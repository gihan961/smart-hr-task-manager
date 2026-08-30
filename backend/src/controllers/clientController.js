const { v4: uuidv4 } = require('uuid');
const store = require('../store/persistentStore');

// 1. Get All Clients & Hierarchy
const getClients = (req, res) => {
  const clients = store.clients || [];
  const groups = store.groups || [];
  const masterTasks = store.masterTasks || [];

  const enrichedClients = clients.map(client => {
    const linkedGroups = groups.filter(g => g.clientId === client.id);
    const linkedMasterTasks = masterTasks.filter(mt => mt.clientId === client.id);

    const totalSubTasks = linkedMasterTasks.reduce((sum, mt) => sum + (mt.subTasksCount || 0), 0);
    const completedSubTasks = linkedMasterTasks.reduce((sum, mt) => sum + (mt.completedSubTasksCount || 0), 0);
    const slaProgressPct = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 100;

    return {
      ...client,
      teamsCount: linkedGroups.length,
      teams: linkedGroups.map(g => ({
        id: g.id,
        name: g.name,
        processCategory: g.processCategory || 'AR',
        teamLeadId: g.teamLeadId,
        teamLeadName: g.teamLeadName,
        membersCount: g.memberIds ? g.memberIds.length : 0
      })),
      openMasterTasksCount: linkedMasterTasks.filter(mt => mt.status !== 'COMPLETED').length,
      completedMasterTasksCount: linkedMasterTasks.filter(mt => mt.status === 'COMPLETED').length,
      slaProgressPct
    };
  });

  res.json(enrichedClients);
};

// 2. Create New Client
const createClient = (req, res) => {
  const { name, code, specialty, accountManager, slaTargetPct, notes } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Client name is required.' });
  }

  const newClient = {
    id: `client-${uuidv4().substring(0, 8)}`,
    name,
    code: code || name.substring(0, 4).toUpperCase(),
    specialty: specialty || 'Multispecialty Healthcare',
    accountManager: accountManager || `${req.user.firstName} ${req.user.lastName}`,
    slaTargetPct: Number(slaTargetPct) || 98.5,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  store.clients.unshift(newClient);
  store.sync('clients');

  res.status(201).json({ message: 'Client created successfully.', client: newClient });
};

// 3. Link Group/Team under Client & Set Process Category (AR, BILLING, QA, CODING, VOB)
const linkGroupToClient = (req, res) => {
  const { id } = req.params; // clientId
  const { groupId, processCategory } = req.body;

  const client = store.clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found.' });
  }

  const group = store.groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ message: 'Group team not found.' });
  }

  group.clientId = client.id;
  group.clientName = client.name;
  group.processCategory = processCategory || group.processCategory || 'AR';

  store.sync('groups');

  res.json({ message: `Group "${group.name}" linked under Client "${client.name}" successfully.`, group });
};

// 4. Get Master Tasks
const getMasterTasks = (req, res) => {
  const masterTasks = store.masterTasks || [];
  const tasks = store.tasks || [];

  const enrichedMasterTasks = masterTasks.map(mt => {
    const linkedSubTasks = tasks.filter(t => t.masterTaskId === mt.id);
    const completedCount = linkedSubTasks.filter(t => t.status === 'COMPLETED').length;
    const totalCount = linkedSubTasks.length || mt.subTasksCount || 0;

    let currentStatus = mt.status;
    if (totalCount > 0 && completedCount === totalCount) {
      currentStatus = 'COMPLETED';
    } else if (linkedSubTasks.length > 0) {
      currentStatus = 'IN_PROGRESS';
    }

    return {
      ...mt,
      subTasksCount: totalCount,
      completedSubTasksCount: completedCount,
      status: currentStatus,
      subTasks: linkedSubTasks
    };
  });

  res.json(enrichedMasterTasks);
};

// 5. Admin / PM Dispatches Special Master Task to Team Lead
const dispatchMasterTask = (req, res) => {
  const { title, description, clientId, processCategory, targetTeamLeadId, groupId, priority, slaDeadline, fileUrl, fileName } = req.body;

  if (!title || !targetTeamLeadId) {
    return res.status(400).json({ message: 'Master task title and target Team Lead are required.' });
  }

  const client = store.clients.find(c => c.id === clientId);
  const tlUser = store.users.find(u => u.id === targetTeamLeadId);
  const group = store.groups.find(g => g.id === groupId);

  const newMasterTask = {
    id: `mtask-${uuidv4().substring(0, 8)}`,
    title,
    description: description || '',
    clientId: client ? client.id : null,
    clientName: client ? client.name : 'Enterprise Operations',
    processCategory: processCategory || (group ? group.processCategory : 'AR'),
    targetTeamLeadId,
    targetTeamLeadName: tlUser ? `${tlUser.firstName} ${tlUser.lastName}` : 'Team Lead',
    groupId: group ? group.id : null,
    groupName: group ? group.name : 'Operations Group',
    priority: priority || 'HIGH',
    slaDeadline: slaDeadline || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    fileUrl: fileUrl || '',
    fileName: fileName || '',
    status: 'DISPATCHED',
    subTasksCount: 0,
    completedSubTasksCount: 0,
    createdBy: `${req.user.firstName} ${req.user.lastName}`,
    createdAt: new Date().toISOString()
  };

  store.masterTasks.unshift(newMasterTask);
  store.sync('masterTasks');

  res.status(201).json({ message: 'Special Master Task dispatched to Team Lead successfully.', masterTask: newMasterTask });
};

// 6. Team Lead Divides & Distributes Master Task to Group Employees
const divideMasterTask = (req, res) => {
  const { id } = req.params; // masterTaskId
  const { subTasks } = req.body; // Array of { title, description, assignedTo, priority, capacityHours }

  const masterTask = store.masterTasks.find(mt => mt.id === id);
  if (!masterTask) {
    return res.status(404).json({ message: 'Master Task not found.' });
  }

  if (!Array.isArray(subTasks) || subTasks.length === 0) {
    return res.status(400).json({ message: 'At least one sub-task must be provided to divide.' });
  }

  const createdTasks = [];
  subTasks.forEach(st => {
    const assignedUser = store.users.find(u => u.id === st.assignedTo);
    const newTask = {
      id: `task-${uuidv4().substring(0, 8)}`,
      masterTaskId: masterTask.id,
      title: st.title || `${masterTask.title} - Subtask`,
      description: st.description || masterTask.description || '',
      assignedTo: st.assignedTo || null,
      assignedToName: assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : 'Unassigned',
      groupId: masterTask.groupId,
      clientId: masterTask.clientId,
      processCategory: masterTask.processCategory,
      priority: st.priority || masterTask.priority || 'MEDIUM',
      status: 'TO_DO',
      slaDeadline: st.dueDate || st.slaDeadline || masterTask.slaDeadline || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      dueDate: st.dueDate || st.slaDeadline || masterTask.slaDeadline || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      estimatedHours: Number(st.capacityHours) || 2,
      createdAt: new Date().toISOString()
    };

    store.tasks.unshift(newTask);
    createdTasks.push(newTask);
  });

  masterTask.status = 'IN_PROGRESS';
  masterTask.subTasksCount = (masterTask.subTasksCount || 0) + createdTasks.length;

  store.sync('tasks');
  store.sync('masterTasks');

  res.json({
    message: `Master Task divided into ${createdTasks.length} sub-tasks and assigned to employees successfully.`,
    subTasks: createdTasks
  });
};

// Update Client Details & Attached File Paths
const updateClient = (req, res) => {
  const { id } = req.params;
  const { name, code, specialty, accountManager, slaTargetPct, notes, attachedFiles } = req.body;

  const client = store.clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found.' });
  }

  if (name !== undefined) client.name = name;
  if (code !== undefined) client.code = code;
  if (specialty !== undefined) client.specialty = specialty;
  if (accountManager !== undefined) client.accountManager = accountManager;
  if (slaTargetPct !== undefined) client.slaTargetPct = Number(slaTargetPct);
  if (notes !== undefined) client.notes = notes;
  if (attachedFiles !== undefined) client.attachedFiles = attachedFiles;
  client.updatedAt = new Date().toISOString();

  store.sync('clients');

  res.json({ message: 'Client details updated successfully.', client });
};

// Add single attached file path / contract document to Client
const attachClientFile = (req, res) => {
  const { id } = req.params;
  const { title, filePath, fileCategory } = req.body;

  const client = store.clients.find(c => c.id === id);
  if (!client) {
    return res.status(404).json({ message: 'Client not found.' });
  }

  if (!client.attachedFiles) {
    client.attachedFiles = [];
  }

  const newFile = {
    id: `cfile-${uuidv4().substring(0, 8)}`,
    title: title || 'Client Document',
    filePath: filePath || '',
    fileCategory: fileCategory || 'CONTRACT_SLA',
    uploadedBy: `${req.user.firstName} ${req.user.lastName}`,
    uploadedAt: new Date().toISOString()
  };

  client.attachedFiles.unshift(newFile);
  store.sync('clients');

  res.status(201).json({ message: 'File path attached to client successfully.', file: newFile, client });
};

// Delete single attached file path from Client
const deleteClientFile = (req, res) => {
  const { id, fileId } = req.params;

  const client = store.clients.find(c => c.id === id);
  if (!client || !client.attachedFiles) {
    return res.status(404).json({ message: 'Client or file not found.' });
  }

  client.attachedFiles = client.attachedFiles.filter(f => f.id !== fileId);
  store.sync('clients');

  res.json({ message: 'File path removed from client.', client });
};

module.exports = {
  getClients,
  createClient,
  updateClient,
  attachClientFile,
  deleteClientFile,
  linkGroupToClient,
  getMasterTasks,
  dispatchMasterTask,
  divideMasterTask
};
