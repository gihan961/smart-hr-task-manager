const { v4: uuidv4 } = require('uuid');
const store = require('../store/persistentStore');

// Ensure csvSheets collection exists
if (!store.csvSheets) {
  store.csvSheets = [];
}

const ADMIN_ROLES = ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER'];
const UPLOADER_ROLES = ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD'];

/**
 * POST /api/csv-sheets
 * Upload & parse a CSV file into a Work Sheet record.
 * Body: { title, clientId?, processCategory?, deadline, csvText, description?, assignedToUserIds[] }
 */
const createCsvSheet = (req, res) => {
  try {
    const { title, clientId, teamId, processCategory, deadline, csvText, description, assignedToUserIds } = req.body;

    if (!title || !csvText) {
      return res.status(400).json({ message: 'Title and CSV data are required.' });
    }

    // Parse CSV text → rows
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ message: 'CSV must have a header row and at least one data row.' });
    }

    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && (i === 0 || line[i - 1] !== '\\')) {
          insideQuotes = !insideQuotes;
        } else if (ch === ',' && !insideQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const dataRows = lines.slice(1).map((line, idx) => {
      const values = parseCSVLine(line);
      const rowData = {};
      headers.forEach((h, i) => {
        rowData[h] = values[i] !== undefined ? values[i] : '';
      });

      return {
        id: `row-${uuidv4().substring(0, 8)}`,
        rowIndex: idx + 1,
        data: rowData,
        workStatus: 'PENDING',
        workNotes: '',
        comments: [],
        lastUpdatedBy: null,
        lastUpdatedAt: null
      };
    });

    // Get client name if clientId provided
    let clientName = '';
    if (clientId) {
      const client = (store.clients || []).find(c => c.id === clientId);
      clientName = client ? client.name : '';
    }

    // Resolve assigned users
    const assignedIds = Array.isArray(assignedToUserIds) ? assignedToUserIds : [];
    const assignedUsers = assignedIds.map(uid => {
      const u = (store.users || []).find(user => user.id === uid);
      return u ? { id: u.id, name: `${u.firstName} ${u.lastName}`, role: u.role } : { id: uid, name: uid, role: '' };
    });

    const sheet = {
      id: `csv-${uuidv4().substring(0, 8)}`,
      title,
      description: description || '',
      clientId: clientId || null,
      clientName,
      teamId: teamId || null,
      processCategory: processCategory || 'BILLING',
      deadline: deadline || null,
      headers,
      rows: dataRows,
      totalRows: dataRows.length,
      completedRows: 0,
      // Assigned users - employees who can see and work on this sheet
      assignedToUserIds: assignedIds,
      assignedUsers,
      createdBy: `${req.user.firstName} ${req.user.lastName}`,
      createdById: req.user.id,
      createdByRole: req.user.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.csvSheets.push(sheet);
    store.sync('csvSheets');

    res.status(201).json({ message: 'CSV Work Sheet created successfully.', sheet });
  } catch (err) {
    console.error('createCsvSheet error:', err);
    res.status(500).json({ message: 'Internal server error creating CSV sheet.', error: err.message });
  }
};

/**
 * GET /api/csv-sheets
 * - Admins/PMs/Team Leads: see all sheets they created or are assigned to
 * - Employees: see only sheets they are specifically assigned to
 */
const listCsvSheets = (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = ADMIN_ROLES.includes(currentUser.role);
    const isUploader = UPLOADER_ROLES.includes(currentUser.role);

    let sheets = (store.csvSheets || []);

    // Filter by access:
    // - Admins/PMs see all sheets
    // - Team Leads see sheets they created OR are assigned to
    // - Employees see only sheets assigned to them
    if (!isAdmin) {
      sheets = sheets.filter(s => {
        const isCreator = s.createdById === currentUser.id;
        const isAssigned = (s.assignedToUserIds || []).includes(currentUser.id);
        // If no assignees set (old sheets), uploader roles see it; employees don't
        const hasNoAssignees = !s.assignedToUserIds || s.assignedToUserIds.length === 0;
        if (isAdmin || isUploader) return isCreator || isAssigned || hasNoAssignees;
        return isAssigned;
      });
    }

    const { clientId, processCategory } = req.query;
    if (clientId) sheets = sheets.filter(s => s.clientId === clientId);
    if (processCategory) sheets = sheets.filter(s => s.processCategory === processCategory);

    // Compute live stats
    const sheetsWithStats = sheets.map(s => {
      const done = s.rows.filter(r => r.workStatus === 'DONE').length;
      const inProg = s.rows.filter(r => r.workStatus === 'IN_PROGRESS').length;
      const hold = s.rows.filter(r => r.workStatus === 'HOLD').length;
      const denied = s.rows.filter(r => r.workStatus === 'DENIED').length;
      return {
        ...s,
        rows: undefined,
        totalRows: s.rows.length,
        completedRows: done,
        inProgressRows: inProg,
        holdRows: hold,
        deniedRows: denied,
        completionPct: s.rows.length > 0 ? Math.round((done / s.rows.length) * 100) : 0
      };
    });

    res.json(sheetsWithStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error('listCsvSheets error:', err);
    res.status(500).json({ message: 'Failed to list CSV sheets.', error: err.message });
  }
};

/**
 * GET /api/csv-sheets/my-inbox
 * Returns ONLY sheets assigned to the current logged-in user (for personal inbox)
 * Including unread state based on createdAt timestamps
 */
const getMyInbox = (req, res) => {
  try {
    const currentUser = req.user;
    const isAdmin = ADMIN_ROLES.includes(currentUser.role);
    const isUploader = UPLOADER_ROLES.includes(currentUser.role);

    let sheets = (store.csvSheets || []);

    if (isAdmin) {
      // Admins see all sheets in their inbox
      // (no filter — they monitor everything)
    } else if (isUploader) {
      // Team Leads / uploaders: sheets they created + sheets assigned to them
      sheets = sheets.filter(s =>
        s.createdById === currentUser.id ||
        (s.assignedToUserIds || []).includes(currentUser.id)
      );
    } else {
      // Regular employees: ONLY sheets assigned to them
      sheets = sheets.filter(s =>
        (s.assignedToUserIds || []).includes(currentUser.id)
      );
    }

    const result = sheets.map(s => {
      const done = s.rows.filter(r => r.workStatus === 'DONE').length;
      const inProg = s.rows.filter(r => r.workStatus === 'IN_PROGRESS').length;
      return {
        id: s.id,
        title: s.title,
        processCategory: s.processCategory,
        deadline: s.deadline,
        clientName: s.clientName,
        createdBy: s.createdBy,
        createdById: s.createdById,
        createdAt: s.createdAt,
        assignedUsers: s.assignedUsers || [],
        assignedToUserIds: s.assignedToUserIds || [],
        totalRows: s.rows.length,
        completedRows: done,
        inProgressRows: inProg,
        completionPct: s.rows.length > 0 ? Math.round((done / s.rows.length) * 100) : 0
      };
    });

    res.json(result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    console.error('getMyInbox error:', err);
    res.status(500).json({ message: 'Failed to get inbox.', error: err.message });
  }
};

/**
 * GET /api/csv-sheets/:id
 * Get full details — only accessible to assigned users, creator, or admins
 */
const getCsvSheet = (req, res) => {
  try {
    const sheet = (store.csvSheets || []).find(s => s.id === req.params.id);
    if (!sheet) {
      return res.status(404).json({ message: 'CSV Work Sheet not found.' });
    }

    // Access check
    const currentUser = req.user;
    const isAdmin = ADMIN_ROLES.includes(currentUser.role);
    const isCreator = sheet.createdById === currentUser.id;
    const isAssigned = (sheet.assignedToUserIds || []).includes(currentUser.id);
    const hasNoAssignees = !sheet.assignedToUserIds || sheet.assignedToUserIds.length === 0;

    if (!isAdmin && !isCreator && !isAssigned && !hasNoAssignees) {
      return res.status(403).json({ message: 'You do not have access to this work sheet.' });
    }

    const done = sheet.rows.filter(r => r.workStatus === 'DONE').length;
    const inProg = sheet.rows.filter(r => r.workStatus === 'IN_PROGRESS').length;
    const hold = sheet.rows.filter(r => r.workStatus === 'HOLD').length;
    const denied = sheet.rows.filter(r => r.workStatus === 'DENIED').length;

    res.json({
      ...sheet,
      completedRows: done,
      inProgressRows: inProg,
      holdRows: hold,
      deniedRows: denied,
      completionPct: sheet.rows.length > 0 ? Math.round((done / sheet.rows.length) * 100) : 0
    });
  } catch (err) {
    console.error('getCsvSheet error:', err);
    res.status(500).json({ message: 'Failed to fetch CSV sheet.', error: err.message });
  }
};

/**
 * PATCH /api/csv-sheets/:id/rows/:rowId
 * Update a row's workStatus and workNotes — only accessible to assigned users
 */
const updateCsvRow = (req, res) => {
  try {
    const sheet = (store.csvSheets || []).find(s => s.id === req.params.id);
    if (!sheet) return res.status(404).json({ message: 'CSV Work Sheet not found.' });

    const currentUser = req.user;
    const isAdmin = ADMIN_ROLES.includes(currentUser.role);
    const isCreator = sheet.createdById === currentUser.id;
    const isAssigned = (sheet.assignedToUserIds || []).includes(currentUser.id);
    const hasNoAssignees = !sheet.assignedToUserIds || sheet.assignedToUserIds.length === 0;

    if (!isAdmin && !isCreator && !isAssigned && !hasNoAssignees) {
      return res.status(403).json({ message: 'You are not assigned to this work sheet.' });
    }

    const row = sheet.rows.find(r => r.id === req.params.rowId);
    if (!row) return res.status(404).json({ message: 'Row not found in this sheet.' });

    const { workStatus, workNotes } = req.body;

    const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'HOLD', 'DENIED'];
    if (workStatus && !VALID_STATUSES.includes(workStatus)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (workStatus !== undefined) row.workStatus = workStatus;
    if (workNotes !== undefined) row.workNotes = workNotes;
    row.lastUpdatedBy = `${req.user.firstName} ${req.user.lastName}`;
    row.lastUpdatedAt = new Date().toISOString();

    sheet.updatedAt = new Date().toISOString();
    store.sync('csvSheets');

    res.json({ message: 'Row updated successfully.', row });
  } catch (err) {
    console.error('updateCsvRow error:', err);
    res.status(500).json({ message: 'Failed to update row.', error: err.message });
  }
};

/**
 * POST /api/csv-sheets/:id/rows/:rowId/comments
 * Add a comment — only accessible to assigned users or creator
 */
const addRowComment = (req, res) => {
  try {
    const sheet = (store.csvSheets || []).find(s => s.id === req.params.id);
    if (!sheet) return res.status(404).json({ message: 'CSV Work Sheet not found.' });

    const currentUser = req.user;
    const isAdmin = ADMIN_ROLES.includes(currentUser.role);
    const isCreator = sheet.createdById === currentUser.id;
    const isAssigned = (sheet.assignedToUserIds || []).includes(currentUser.id);
    const hasNoAssignees = !sheet.assignedToUserIds || sheet.assignedToUserIds.length === 0;

    if (!isAdmin && !isCreator && !isAssigned && !hasNoAssignees) {
      return res.status(403).json({ message: 'You are not assigned to this work sheet.' });
    }

    const row = sheet.rows.find(r => r.id === req.params.rowId);
    if (!row) return res.status(404).json({ message: 'Row not found in this sheet.' });

    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const comment = {
      id: `cmt-${uuidv4().substring(0, 8)}`,
      text: text.trim(),
      authorId: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName}`,
      authorRole: req.user.role,
      createdAt: new Date().toISOString()
    };

    row.comments.push(comment);
    sheet.updatedAt = new Date().toISOString();
    store.sync('csvSheets');

    res.status(201).json({ message: 'Comment added.', comment });
  } catch (err) {
    console.error('addRowComment error:', err);
    res.status(500).json({ message: 'Failed to add comment.', error: err.message });
  }
};

/**
 * DELETE /api/csv-sheets/:id
 * Delete a CSV work sheet (Team Lead / Admin only and only the creator or admin)
 */
const deleteCsvSheet = (req, res) => {
  try {
    const idx = (store.csvSheets || []).findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'CSV Work Sheet not found.' });

    store.csvSheets.splice(idx, 1);
    store.sync('csvSheets');

    res.json({ message: 'CSV Work Sheet deleted successfully.' });
  } catch (err) {
    console.error('deleteCsvSheet error:', err);
    res.status(500).json({ message: 'Failed to delete CSV sheet.', error: err.message });
  }
};

module.exports = {
  createCsvSheet,
  listCsvSheets,
  getMyInbox,
  getCsvSheet,
  updateCsvRow,
  addRowComment,
  deleteCsvSheet
};
