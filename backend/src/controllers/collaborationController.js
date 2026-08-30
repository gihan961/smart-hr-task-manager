const { v4: uuidv4 } = require('uuid');
const store = require('../store/memoryStore');

const getAnnouncements = (req, res) => {
  res.json(store.announcements || []);
};

const createAnnouncement = (req, res) => {
  const { title, content } = req.body;
  const user = req.user;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const announcement = {
    id: `anc-${uuidv4().substring(0, 8)}`,
    title,
    content,
    authorName: user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Administrator',
    createdAt: new Date().toISOString()
  };

  store.announcements = store.announcements || [];
  store.announcements.unshift(announcement);
  store.sync('announcements');

  store.addAuditLog(
    user ? user.id : 'system',
    user ? `${user.firstName} ${user.lastName}` : 'Admin',
    user ? user.role : 'ADMIN',
    'CREATE_ANNOUNCEMENT',
    'COLLABORATION_SERVICE',
    req.ip,
    `Published noticeboard announcement: "${announcement.title}".`
  );

  res.status(201).json({ message: 'Announcement created successfully.', announcement });
};

const getTaskMessages = (req, res) => {
  const { taskId } = req.params;
  const msgs = (store.chatMessages || []).filter(m => m.taskId === taskId || !taskId);
  res.json(msgs);
};

const sendTaskMessage = (req, res) => {
  const { taskId, content } = req.body;
  const user = req.user;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Message text cannot be empty.' });
  }

  const newMsg = {
    id: `msg-${uuidv4().substring(0, 8)}`,
    taskId: taskId || 'general',
    senderId: user.id,
    senderName: `${user.firstName} ${user.lastName}`,
    senderAvatar: user.avatar,
    senderRole: user.role,
    content: content.trim(),
    timestamp: new Date().toISOString()
  };

  store.chatMessages = store.chatMessages || [];
  store.chatMessages.push(newMsg);
  store.sync('chatMessages');

  res.status(201).json(newMsg);
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  getTaskMessages,
  sendTaskMessage
};
