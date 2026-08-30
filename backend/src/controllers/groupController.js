const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const store = require('../store/memoryStore');

// 1. Create Group
const createGroup = async (req, res) => {
  const { name, description, projectId, memberIds } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required.' });
  }

  const groupId = `group-${uuidv4().substring(0, 8)}`;
  const group = {
    id: groupId,
    name,
    description: description || '',
    teamLeadId: req.user.id,
    teamLeadName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Team Lead',
    memberIds: Array.isArray(memberIds) ? memberIds : [],
    projectId: projectId || null,
    announcements: [],
    createdAt: new Date().toISOString()
  };

  store.groups.push(group);
  store.sync('groups');

  store.addAuditLog(
    req.user.id,
    `${req.user.firstName} ${req.user.lastName}`,
    req.user.role,
    'GROUP_CREATED',
    'GROUP_SERVICE',
    req.ip,
    `Created group "${name}" with ${group.memberIds.length} initial members.`
  );

  res.status(201).json({
    message: 'Team Lead group created successfully!',
    group
  });
};

// 2. Get Groups List
const getGroups = (req, res) => {
  const userRole = req.user.role;
  const userId = req.user.id;

  let filtered = store.groups;

  // Filter if regular Team Lead (show groups they manage or belong to)
  if (userRole === 'TEAM_LEADER') {
    filtered = store.groups.filter(g => g.teamLeadId === userId || (g.memberIds && g.memberIds.includes(userId)));
  }

  // Format member details
  const enriched = filtered.map(g => {
    const members = store.users.filter(u => g.memberIds && g.memberIds.includes(u.id)).map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      avatar: u.avatar
    }));

    const groupTasks = store.tasks.filter(t => t.groupId === g.id || (g.memberIds && g.memberIds.includes(t.assignedTo)));
    const completedCount = groupTasks.filter(t => t.status === 'COMPLETED').length;
    const progressPct = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;

    return {
      ...g,
      members,
      memberCount: members.length,
      taskCount: groupTasks.length,
      completedTaskCount: completedCount,
      progressPct
    };
  });

  res.json(enriched);
};

// 2b. Get Groups for the logged-in employee (groups they are a member of)
const getMyGroups = (req, res) => {
  const userId = req.user.id;
  const myGroups = store.groups.filter(g => g.memberIds && g.memberIds.includes(userId));

  const enriched = myGroups.map(g => {
    const teamLead = store.users.find(u => u.id === g.teamLeadId) || {};
    const members = store.users.filter(u => g.memberIds && g.memberIds.includes(u.id)).map(u => ({
      id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email,
      role: u.role, avatar: u.avatar
    }));
    const groupTasks = store.tasks.filter(t => t.groupId === g.id || (g.memberIds && g.memberIds.includes(t.assignedTo)));
    const myTasks = groupTasks.filter(t => t.assignedTo === userId);
    const completedCount = groupTasks.filter(t => t.status === 'COMPLETED').length;
    const progressPct = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;

    return {
      ...g,
      teamLeadName: teamLead.firstName ? `${teamLead.firstName} ${teamLead.lastName}` : 'Team Lead',
      members,
      memberCount: members.length,
      groupTasks,
      myTasks,
      totalTasks: groupTasks.length,
      completedCount,
      progressPct
    };
  });

  res.json(enriched);
};

const getGroupDetails = (req, res) => {
  const { groupId } = req.params;
  const group = store.groups.find(g => g.id === groupId);

  if (!group) {
    return res.status(404).json({ message: 'Group not found.' });
  }

  // Members with live task workload
  const members = store.users.filter(u => group.memberIds && group.memberIds.includes(u.id)).map(u => {
    const profile = store.employeeProfiles.find(ep => ep.userId === u.id) || {};
    const activeTasks = store.tasks.filter(t => t.assignedTo === u.id && t.status !== 'COMPLETED').length;
    const completedTasks = store.tasks.filter(t => t.assignedTo === u.id && t.status === 'COMPLETED').length;
    const capacityLoad = Math.min(100, Math.round((activeTasks / 5) * 100));

    return {
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role,
      jobTitle: profile.jobTitle || u.role,
      avatar: u.avatar,
      taskAccuracyRate: profile.taskAccuracyRate || 98.0,
      activeTasksCount: activeTasks,
      completedTasksCount: completedTasks,
      capacityLoadPercent: capacityLoad,
      capacityAvailablePercent: 100 - capacityLoad
    };
  });

  // Group tasks
  const groupTasks = store.tasks.filter(t => t.groupId === group.id || (group.memberIds && group.memberIds.includes(t.assignedTo)));

  const completedCount = groupTasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressCount = groupTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const reviewCount = groupTasks.filter(t => t.status === 'REVIEW').length;
  const todoCount = groupTasks.filter(t => t.status === 'TO_DO').length;
  const progressPct = groupTasks.length > 0 ? Math.round((completedCount / groupTasks.length) * 100) : 0;

  res.json({
    group,
    members,
    tasks: groupTasks,
    stats: {
      totalMembers: members.length,
      totalTasks: groupTasks.length,
      completedCount,
      inProgressCount,
      reviewCount,
      todoCount,
      progressPct
    }
  });
};

// 4. Add Member to Group
const addMember = (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = store.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found.' });

  if (!group.memberIds) group.memberIds = [];
  if (!group.memberIds.includes(userId)) {
    group.memberIds.push(userId);
    store.sync('groups');
  }

  res.json({ message: 'Member added to group successfully.', group });
};

// 5. Remove Member from Group
const removeMember = (req, res) => {
  const { groupId, userId } = req.params;

  const group = store.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found.' });

  if (group.memberIds) {
    group.memberIds = group.memberIds.filter(id => id !== userId);
    store.sync('groups');
  }

  // Unassign tasks of this user in this group
  store.tasks.forEach(t => {
    if (t.groupId === groupId && t.assignedTo === userId) {
      t.assignedTo = null;
    }
  });
  store.sync('tasks');

  res.json({ message: 'Member removed from group.', group });
};

// 6. Allocate Task to Member
const allocateTask = (req, res) => {
  const { groupId } = req.params;
  const { taskId, userId } = req.body;

  const task = store.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  task.assignedTo = userId;
  task.groupId = groupId;
  if (task.status === 'TO_DO') task.status = 'IN_PROGRESS';

  store.sync('tasks');

  store.addAuditLog(
    req.user.id,
    `${req.user.firstName} ${req.user.lastName}`,
    req.user.role,
    'TASK_ALLOCATED',
    'GROUP_SERVICE',
    req.ip,
    `Allocated task "${task.title}" to user ${userId} in group ${groupId}.`
  );

  res.json({ message: 'Task allocated successfully.', task });
};

// 7. Reallocate Task from one member to another
const reallocateTask = (req, res) => {
  const { groupId } = req.params;
  const { taskId, fromUserId, toUserId } = req.body;

  const task = store.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ message: 'Task not found.' });

  const toUser = store.users.find(u => u.id === toUserId);
  const toName = toUser ? `${toUser.firstName} ${toUser.lastName}` : toUserId;

  task.assignedTo = toUserId;
  task.groupId = groupId;
  store.sync('tasks');

  store.addAuditLog(
    req.user.id,
    `${req.user.firstName} ${req.user.lastName}`,
    req.user.role,
    'TASK_REALLOCATED',
    'GROUP_SERVICE',
    req.ip,
    `Reallocated task "${task.title}" to ${toName}.`
  );

  res.json({ message: `Task reassigned to ${toName} successfully!`, task });
};

// 8. Bulk Upload Employees via CSV
const bulkUploadEmployeesCSV = async (req, res) => {
  const { groupId } = req.params;
  const { csvRows } = req.body; // Array of { firstName, lastName, email, role, jobTitle }

  if (!Array.isArray(csvRows) || csvRows.length === 0) {
    return res.status(400).json({ message: 'No valid CSV employee rows provided.' });
  }

  const group = store.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found.' });

  const addedEmployees = [];
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('password123', salt);

  for (const row of csvRows) {
    if (!row.email) continue;
    const email = row.email.toLowerCase().trim();

    let user = store.users.find(u => u.email === email);
    if (!user) {
      user = {
        id: `user-${uuidv4().substring(0, 8)}`,
        organizationId: req.user.organizationId || 'org-apex-01',
        email,
        passwordHash: defaultPasswordHash,
        firstName: row.firstName || 'Employee',
        lastName: row.lastName || 'Staff',
        role: row.role || 'EMPLOYEE',
        departmentId: 'dept-01',
        status: 'ACTIVE',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.firstName || email}`
      };
      store.users.push(user);
      store.sync('users');

      const profile = {
        id: `emp-${uuidv4().substring(0, 8)}`,
        userId: user.id,
        jobTitle: row.jobTitle || 'Specialist',
        taskAccuracyRate: 98.0,
        dailyCapacityHours: 8,
        hourlyRate: 40.0,
        monthlyBaseSalary: 6400,
        joinedDate: new Date().toISOString().split('T')[0]
      };
      store.employeeProfiles.push(profile);
      store.sync('employeeProfiles');
    }

    if (!group.memberIds.includes(user.id)) {
      group.memberIds.push(user.id);
    }
    addedEmployees.push(user);
  }

  store.sync('groups');

  res.json({
    message: `Bulk CSV imported: ${addedEmployees.length} employees onboarded and added to group!`,
    employeesCount: addedEmployees.length
  });
};

// 9. Bulk Upload Tasks via CSV
const bulkUploadTasksCSV = (req, res) => {
  const { groupId } = req.params;
  const { csvRows } = req.body; // Array of { title, description, priority, estimatedHours, assignedEmail }

  if (!Array.isArray(csvRows) || csvRows.length === 0) {
    return res.status(400).json({ message: 'No valid CSV task rows provided.' });
  }

  const group = store.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found.' });

  const createdTasks = [];

  for (const row of csvRows) {
    if (!row.title) continue;

    let assignedUserId = null;
    if (row.assignedEmail) {
      const u = store.users.find(usr => usr.email.toLowerCase() === row.assignedEmail.toLowerCase().trim());
      if (u) assignedUserId = u.id;
    }

    const newTask = {
      id: `task-${uuidv4().substring(0, 8)}`,
      title: row.title,
      description: row.description || '',
      groupId,
      status: assignedUserId ? 'IN_PROGRESS' : 'TO_DO',
      priority: row.priority ? row.priority.toUpperCase() : 'MEDIUM',
      complexityIndex: parseFloat(row.complexityIndex) || 6.5,
      estimatedHours: parseFloat(row.estimatedHours) || 8.0,
      assignedTo: assignedUserId,
      dueDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    store.tasks.push(newTask);
    createdTasks.push(newTask);
  }

  store.sync('tasks');

  res.json({
    message: `Bulk CSV imported: ${createdTasks.length} tasks created for group!`,
    tasksCount: createdTasks.length
  });
};

// 10. AI Auto-Balance Group Workload
const autoBalanceGroupWorkload = (req, res) => {
  const { groupId } = req.params;
  const group = store.groups.find(g => g.id === groupId);

  if (!group) return res.status(404).json({ message: 'Group not found.' });
  if (!group.memberIds || group.memberIds.length === 0) {
    return res.status(400).json({ message: 'No members in group to balance tasks across.' });
  }

  const unassignedTasks = store.tasks.filter(t => (t.groupId === groupId || !t.groupId) && !t.assignedTo);
  const groupMembers = store.users.filter(u => group.memberIds.includes(u.id));

  let assignedCount = 0;

  unassignedTasks.forEach(t => {
    // Find member with lowest active tasks
    const memberTaskCounts = groupMembers.map(m => ({
      member: m,
      count: store.tasks.filter(tk => tk.assignedTo === m.id && tk.status !== 'COMPLETED').length
    }));
    memberTaskCounts.sort((a, b) => a.count - b.count);

    if (memberTaskCounts.length > 0) {
      t.assignedTo = memberTaskCounts[0].member.id;
      t.groupId = groupId;
      t.status = 'IN_PROGRESS';
      assignedCount++;
    }
  });

  store.sync('tasks');

  res.json({
    message: `AI Auto-Balancer completed! ${assignedCount} unassigned tasks distributed across team members.`,
    assignedCount
  });
};

// 11. Post Group Announcement
const postGroupAnnouncement = (req, res) => {
  const { groupId } = req.params;
  const { title, content } = req.body;

  const group = store.groups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found.' });

  const anc = {
    id: `anc-${uuidv4().substring(0, 8)}`,
    title,
    content,
    authorName: `${req.user.firstName} ${req.user.lastName}`,
    createdAt: new Date().toISOString()
  };

  if (!group.announcements) group.announcements = [];
  group.announcements.unshift(anc);
  store.sync('groups');

  res.json({ message: 'Announcement posted to group.', announcement: anc });
};

module.exports = {
  createGroup,
  getGroups,
  getMyGroups,
  getGroupDetails,
  addMember,
  removeMember,
  allocateTask,
  reallocateTask,
  bulkUploadEmployeesCSV,
  bulkUploadTasksCSV,
  autoBalanceGroupWorkload,
  postGroupAnnouncement
};
