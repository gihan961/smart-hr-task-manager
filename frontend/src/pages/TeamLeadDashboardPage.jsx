import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Plus, 
  CheckCircle2, 
  BrainCircuit, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  UserPlus, 
  UserMinus, 
  ArrowRightLeft, 
  Megaphone, 
  Layers, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Clock,
  Briefcase,
  Trash2,
  File,
  X,
  FolderOpen,
  CheckCheck,
  Calendar,
  XCircle
} from 'lucide-react';

export default function TeamLeadDashboardPage() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupDetails, setGroupDetails] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [masterTasks, setMasterTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active workspace tab: 'dashboard' | 'members' | 'tasks' | 'csv' | 'group-leaves' | 'admin-master-tasks' | 'ai-announcements'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modals
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [showDivideModal, setShowDivideModal] = useState(false);
  const [selectedMasterTaskForDivide, setSelectedMasterTaskForDivide] = useState(null);
  const [divideForm, setDivideForm] = useState([
    { title: '', description: '', assignedTo: '', capacityHours: 2, priority: 'HIGH' }
  ]);
  const [divideSubmitting, setDivideSubmitting] = useState(false);
  const [taskToReallocate, setTaskToReallocate] = useState(null);
  const [targetMemberId, setTargetMemberId] = useState('');

  // Forms
  const [newGroupForm, setNewGroupForm] = useState({ name: '', description: '' });
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState('');
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  // File Upload to Employee States
  const [fileTargetEmployeeId, setFileTargetEmployeeId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileDragging, setFileDragging] = useState(false);
  const [fileUploadMessage, setFileUploadMessage] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [employeeFilesList, setEmployeeFilesList] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);  // live polling ref

  useEffect(() => {
    fetchInitialData();
    // Live poll: refresh every 10s for real-time group progress & leaves
    pollRef.current = setInterval(() => {
      if (selectedGroupId) fetchGroupDetails(selectedGroupId);
      fetchLeaves();
      fetchMasterTasks();
    }, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchLeaves = async () => {
    try {
      const res = await api.get('/hr/leaves');
      setAllLeaves(res.data || []);
    } catch (err) {}
  };

  const fetchMasterTasks = async () => {
    try {
      const res = await api.get('/clients/master-tasks');
      setMasterTasks(res.data || []);
    } catch (err) {}
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [groupsRes, empRes, leavesRes, masterRes] = await Promise.allSettled([
        api.get('/groups'),
        api.get('/hr/employees'),
        api.get('/hr/leaves'),
        api.get('/clients/master-tasks')
      ]);

      if (groupsRes.status === 'fulfilled' && groupsRes.value.data) {
        const fetchedGroups = groupsRes.value.data;
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0 && !selectedGroupId) {
          setSelectedGroupId(fetchedGroups[0].id);
        }
      }

      if (empRes.status === 'fulfilled' && empRes.value.data) {
        setAllEmployees(empRes.value.data);
      }

      if (leavesRes.status === 'fulfilled' && leavesRes.value.data) {
        setAllLeaves(leavesRes.value.data);
      }

      if (masterRes.status === 'fulfilled' && masterRes.value.data) {
        setMasterTasks(masterRes.value.data);
      }
    } catch (err) {
      console.error('Error loading Team Lead data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupLeaveAction = async (leaveId, status) => {
    try {
      await api.patch(`/hr/leaves/${leaveId}/status`, { status });
      fetchLeaves();
    } catch (err) {
      alert('Failed to update leave status.');
    }
  };

  const fetchGroupDetails = async (groupId) => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroupDetails(res.data);
    } catch (err) {
      console.error('Error loading group details:', err);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/groups', newGroupForm);
      setShowCreateGroupModal(false);
      setNewGroupForm({ name: '', description: '' });
      await fetchInitialData();
      if (res.data?.group?.id) {
        setSelectedGroupId(res.data.group.id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create group.');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !selectedMemberToAdd) return;
    try {
      await api.post(`/groups/${selectedGroupId}/members`, { userId: selectedMemberToAdd });
      setShowAddMemberModal(false);
      setSelectedMemberToAdd('');
      fetchGroupDetails(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Are you sure you want to remove this member from the group?')) return;
    try {
      await api.delete(`/groups/${selectedGroupId}/members/${userId}`);
      fetchGroupDetails(selectedGroupId);
    } catch (err) {
      alert('Failed to remove member.');
    }
  };

  const handleReallocateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskToReallocate || !targetMemberId) return;
    try {
      await api.post(`/groups/${selectedGroupId}/reallocate-task`, {
        taskId: taskToReallocate.id,
        toUserId: targetMemberId
      });
      setShowReallocateModal(false);
      setTaskToReallocate(null);
      setTargetMemberId('');
      fetchGroupDetails(selectedGroupId);
    } catch (err) {
      alert('Failed to reallocate task.');
    }
  };

  // ── FILE UPLOAD TO EMPLOYEE HANDLERS ──

  const addFilesToQueue = (newFiles) => {
    const arr = Array.from(newFiles);
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeFileFromQueue = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const fetchEmployeeFiles = async (employeeId) => {
    if (!employeeId) { setEmployeeFilesList([]); return; }
    setFilesLoading(true);
    try {
      const res = await api.get(`/files/employee/${employeeId}`);
      setEmployeeFilesList(res.data || []);
    } catch (_) {
      setEmployeeFilesList([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleEmployeeSelect = (empId) => {
    setFileTargetEmployeeId(empId);
    setFileUploadMessage('');
    setFileUploadError('');
    fetchEmployeeFiles(empId);
  };

  const handleFileUploadToEmployee = async () => {
    setFileUploadMessage('');
    setFileUploadError('');
    if (!fileTargetEmployeeId) {
      setFileUploadError('Please select an employee first.');
      return;
    }
    if (selectedFiles.length === 0) {
      setFileUploadError('Please choose at least one file to upload.');
      return;
    }
    setFileUploading(true);
    try {
      const formData = new FormData();
      formData.append('employeeId', fileTargetEmployeeId);
      selectedFiles.forEach(f => formData.append('files', f));

      const res = await api.post('/files/upload-to-employee', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFileUploadMessage(res.data.message || 'Files uploaded successfully!');
      setSelectedFiles([]);
      fetchEmployeeFiles(fileTargetEmployeeId);
    } catch (err) {
      setFileUploadError(err.response?.data?.message || err.message || 'Upload failed. Please try again.');
    } finally {
      setFileUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setEmployeeFilesList(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      alert('Failed to delete file.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType, name) => {
    if (!mimeType && !name) return '📄';
    const ext = name?.split('.').pop()?.toLowerCase();
    if (mimeType?.includes('pdf') || ext === 'pdf') return '📕';
    if (mimeType?.includes('sheet') || mimeType?.includes('excel') || ext === 'xlsx' || ext === 'xls') return '📗';
    if (mimeType?.includes('csv') || ext === 'csv') return '📊';
    if (mimeType?.includes('word') || ext === 'docx' || ext === 'doc') return '📘';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('zip')) return '🗜️';
    return '📄';
  };

  const handleAIAutoBalance = async () => {
    if (!selectedGroupId) return;
    try {
      const res = await api.post(`/groups/${selectedGroupId}/auto-balance`);
      alert(res.data.message || 'AI Auto-balancer triggered successfully!');
      fetchGroupDetails(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger AI auto-balancer.');
    }
  };

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    if (!selectedGroupId || !announcementForm.title) return;
    try {
      await api.post(`/groups/${selectedGroupId}/announcements`, announcementForm);
      setAnnouncementForm({ title: '', content: '' });
      fetchGroupDetails(selectedGroupId);
    } catch (err) {
      alert('Failed to post announcement.');
    }
  };

  const handleDivideMasterTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMasterTaskForDivide) return;
    setDivideSubmitting(true);
    try {
      await api.post(`/clients/master-tasks/${selectedMasterTaskForDivide.id}/divide`, { subTasks: divideForm });
      setShowDivideModal(false);
      setSelectedMasterTaskForDivide(null);
      setDivideForm([{ title: '', description: '', assignedTo: '', capacityHours: 2, priority: 'HIGH' }]);
      fetchMasterTasks();
      if (selectedGroupId) fetchGroupDetails(selectedGroupId);
      alert('Master task package divided into sub-tasks and assigned to group employees successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to divide master task.');
    } finally {
      setDivideSubmitting(false);
    }
  };

  const currentGroup = groupDetails?.group;
  const members = groupDetails?.members || [];
  const tasks = groupDetails?.tasks || [];
  const stats = groupDetails?.stats || { totalMembers: 0, totalTasks: 0, completedCount: 0, progressPct: 0 };
  const memberLeaves = allLeaves.filter(l => 
    l.teamLeadId === user?.id || 
    l.targetTeamLeadId === user?.id || 
    members.some(m => m.id === l.userId) ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'PROJECT_MANAGER'
  );
  const myMasterTasks = masterTasks.filter(mt =>
    mt.targetTeamLeadId === user?.id ||
    mt.groupId === selectedGroupId ||
    user?.role === 'SYSTEM_ADMIN' ||
    user?.role === 'PROJECT_MANAGER'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Group Switcher */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Team Lead Group Workspace
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Group Operations & Allocation
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Create groups, manage member capacity, allocate/reallocate tasks, and upload files to employees.
            </p>
          </div>
        </div>

        {/* Group Selector & Create Group Button */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {groups.length > 0 && (
            <select
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  👥 {g.name} ({g.memberCount || 0} members)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Group
          </button>
        </div>
      </div>

      {/* Zero State if No Groups exist */}
      {groups.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">No Groups Created Yet</h3>
          <p className="text-xs text-slate-400">
            As Team Lead, create your first operational group to add employees, assign tasks, and monitor group progress.
          </p>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Operational Group
          </button>
        </div>
      ) : (
        <>
          {/* Workspace Section Navigation Tabs */}
          <div className="flex space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📊 Group Progress Dashboard
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'members' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              👥 Group Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Task Allocation Matrix ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'csv' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📤 Upload Files to Employees
            </button>
            <button
              onClick={() => setActiveTab('group-leaves')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'group-leaves' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🌴 Member Leaves ({memberLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('admin-master-tasks')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'admin-master-tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📥 Tasks from Admin/PM ({myMasterTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('ai-announcements')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
                activeTab === 'ai-announcements' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🤖 AI Balancer & Group Board
            </button>
          </div>

          {/* TAB 1: GROUP PROGRESS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Group Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">Active Group Name</span>
                  <p className="text-base font-bold text-white truncate">{currentGroup?.name || 'Group'}</p>
                  <span className="text-[11px] text-indigo-400">Managed by {currentGroup?.teamLeadName || 'Team Lead'}</span>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">Group Completion Velocity</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xl font-bold text-white font-mono">{stats.progressPct}%</span>
                    <span className="text-xs text-emerald-400 font-semibold">{stats.completedCount} / {stats.totalTasks} Done</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${stats.progressPct}%` }}></div>
                  </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">Group Roster</span>
                  <p className="text-xl font-bold text-white font-mono">{stats.totalMembers} Members</p>
                  <p className="text-[11px] text-slate-500">Active assigned specialists</p>
                </div>

                <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">In-Progress Tasks</span>
                  <p className="text-xl font-bold text-indigo-400 font-mono">{stats.inProgressCount || 0} Tasks</p>
                  <p className="text-[11px] text-slate-500">Active operational items</p>
                </div>
              </div>

              {/* Members Capacity & Workload Cards */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Group Member Workload & Free Capacity Distribution
                  </h3>
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    + Manage Members
                  </button>
                </div>

                {members.length === 0 ? (
                  <div className="text-xs text-slate-500 p-6 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
                    No members added to this group yet. Click "Group Members" tab to add staff.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(m => (
                      <div key={m.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                        <div className="flex items-center space-x-3">
                          <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`} alt={m.name} className="w-10 h-10 rounded-xl bg-slate-800" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{m.name}</h4>
                            <p className="text-[11px] text-slate-400 truncate">{m.jobTitle}</p>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">Workload ({m.activeTasksCount} active tasks)</span>
                            <span className="font-bold text-indigo-300">{m.capacityLoadPercent}% Load</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${m.capacityLoadPercent > 80 ? 'bg-rose-500' : m.capacityLoadPercent > 50 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                              style={{ width: `${m.capacityLoadPercent}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <span>Accuracy: <strong className="text-emerald-400">{m.taskAccuracyRate}%</strong></span>
                          <span>Free Capacity: <strong className="text-emerald-300">{m.capacityAvailablePercent}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GROUP MEMBERS & ROSTER */}
          {activeTab === 'members' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Group Member Roster</h3>
                  <p className="text-xs text-slate-400">Manage employees assigned to this group</p>
                </div>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <UserPlus className="w-4 h-4" /> Add Employee to Group
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map(m => (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <img src={m.avatar} alt={m.name} className="w-12 h-12 rounded-xl bg-slate-800" />
                      <div>
                        <h4 className="text-xs font-bold text-white">{m.name}</h4>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                          {m.jobTitle}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30 text-xs flex items-center gap-1 font-semibold"
                    >
                      <UserMinus className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TASK ALLOCATION & REASSIGNMENT */}
          {activeTab === 'tasks' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Task Allocation & Reassignment Matrix</h3>
                  <p className="text-xs text-slate-400">Allocate tasks one-by-one or transfer tasks between team members</p>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
                  No tasks assigned to this group yet. Use the CSV Bulk Upload Hub or create tasks in the Kanban board.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map(t => {
                    const assignedMember = members.find(m => m.id === t.assignedTo);
                    return (
                      <div key={t.id} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              t.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {t.priority}
                            </span>
                            <h4 className="text-xs font-bold text-white">{t.title}</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">{t.description}</p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right text-xs">
                            <span className="text-[10px] text-slate-400 block">Assigned To</span>
                            <span className="font-semibold text-indigo-300">
                              {assignedMember ? assignedMember.name : 'Unassigned'}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setTaskToReallocate(t);
                              setShowReallocateModal(true);
                            }}
                            className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 border border-indigo-500/40 shadow-lg shadow-indigo-600/20"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" /> Reallocate Task
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: UPLOAD FILES TO EMPLOYEES */}
          {activeTab === 'csv' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              {/* Header */}
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-400" />
                  Upload Files to Employees
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select an employee by name or email, then upload any files (CSV, PDF, Excel, Word, images, etc.) directly to them.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── LEFT: Select Employee + Upload ── */}
                <div className="space-y-4">

                  {/* Step 1: Employee Selector */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
                      Select Employee
                    </h4>
                    <select
                      value={fileTargetEmployeeId}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-3 focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="">-- Choose an employee --</option>
                      {allEmployees.map(emp => (
                        <option key={emp.userId || emp.id} value={emp.userId || emp.id}>
                          {emp.firstName} {emp.lastName} — {emp.email}
                        </option>
                      ))}
                    </select>
                    {allEmployees.length === 0 && (
                      <p className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                        ⚠️ No employees found. Add members to this group first.
                      </p>
                    )}
                  </div>

                  {/* Step 2: File Drop Zone */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
                      Choose Files
                    </h4>

                    {/* Success/Error messages */}
                    {fileUploadMessage && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 shrink-0" /> {fileUploadMessage}
                        <button onClick={() => setFileUploadMessage('')} className="ml-auto text-emerald-400/60 hover:text-emerald-300">×</button>
                      </div>
                    )}
                    {fileUploadError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {fileUploadError}
                        <button onClick={() => setFileUploadError('')} className="ml-auto text-rose-400/60 hover:text-rose-300">×</button>
                      </div>
                    )}

                    {/* Drag and Drop zone */}
                    <label
                      htmlFor="employee-file-input"
                      onDragOver={(e) => { e.preventDefault(); setFileDragging(true); }}
                      onDragLeave={() => setFileDragging(false)}
                      onDrop={(e) => { e.preventDefault(); setFileDragging(false); if (e.dataTransfer.files.length) addFilesToQueue(e.dataTransfer.files); }}
                      className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                        fileDragging
                          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                          : 'border-slate-700 hover:border-indigo-500/60 hover:bg-indigo-500/5'
                      }`}
                    >
                      <input
                        id="employee-file-input"
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => { if (e.target.files.length) addFilesToQueue(e.target.files); e.target.value = ''; }}
                      />
                      <UploadCloud className={`w-8 h-8 ${fileDragging ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-300">
                          <span className="text-indigo-400">Click to browse</span> or drag & drop files here
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">CSV, PDF, Excel, Word, Images, ZIP — up to 20MB each</p>
                      </div>
                    </label>

                    {/* File Queue */}
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400 font-semibold">{selectedFiles.length} file(s) ready to upload:</p>
                        {selectedFiles.map((f, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="text-lg">{getFileIcon(f.type, f.name)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{f.name}</p>
                              <p className="text-[10px] text-slate-500">{formatFileSize(f.size)}</p>
                            </div>
                            <button onClick={() => removeFileFromQueue(idx)} className="text-slate-600 hover:text-rose-400 transition-colors">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <button
                      onClick={handleFileUploadToEmployee}
                      disabled={fileUploading || !fileTargetEmployeeId || selectedFiles.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                    >
                      {fileUploading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><UploadCloud className="w-4 h-4" /> Send Files to Employee</>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── RIGHT: Employee's Uploaded Files ── */}
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <File className="w-4 h-4 text-purple-400" />
                      {fileTargetEmployeeId
                        ? `Files Sent to ${allEmployees.find(e => (e.userId || e.id) === fileTargetEmployeeId)?.firstName || 'Employee'}`
                        : 'Uploaded Files (Select Employee)'
                      }
                    </h4>
                    {fileTargetEmployeeId && (
                      <button onClick={() => fetchEmployeeFiles(fileTargetEmployeeId)} className="text-indigo-400 hover:text-indigo-300">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!fileTargetEmployeeId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                      <Users className="w-8 h-8 text-slate-700" />
                      <p className="text-xs text-slate-600">Select an employee on the left to see their files</p>
                    </div>
                  ) : filesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                    </div>
                  ) : employeeFilesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                      <FolderOpen className="w-8 h-8 text-slate-700" />
                      <p className="text-xs text-slate-600">No files uploaded to this employee yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {employeeFilesList.map(f => (
                        <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border group transition-all ${f.isResponse ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40' : 'bg-slate-950 border-slate-800 hover:border-indigo-500/30'}`}>
                          <span className="text-xl shrink-0">{getFileIcon(f.mimeType, f.originalName)}</span>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-white truncate">{f.originalName}</p>
                              {f.isResponse && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">↩ Response</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {formatFileSize(f.sizeBytes)} &bull; {f.isResponse ? 'From employee' : `by ${f.uploadedByName}`} &bull; {new Date(f.uploadedAt).toLocaleDateString()}
                            </p>
                            {f.status && !f.isResponse && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                f.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                f.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                                f.status === 'NEEDS_CLARIFICATION' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                                'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              }`}>
                                Employee: {f.status?.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => window.open(`http://localhost:5000/api/files/download/${f.id}`, '_blank')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-400 hover:text-indigo-300 transition-all"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {!f.isResponse && (
                            <button
                              onClick={() => handleDeleteFile(f.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-rose-400 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEMBER LEAVES */}
          {activeTab === 'group-leaves' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Group Member Leave Applications & AI SLA Risk Scores
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Approve or reject leave applications for members of this group. Updates sync live across HR and worker logins.
                </p>
              </div>

              {memberLeaves.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No leave requests submitted by members of this group.
                </div>
              ) : (
                <div className="space-y-4">
                  {memberLeaves.map(leave => {
                    const isPending = leave.status === 'PENDING';
                    const isHighRisk = leave.aiRiskScore > 50;

                    return (
                      <div key={leave.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-white">{leave.userName}</span>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {leave.leaveType} ({leave.daysCount} Days)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Dates: <span className="text-slate-200 font-mono">{leave.startDate} to {leave.endDate}</span> &bull; Reason: {leave.reason}
                          </p>
                        </div>

                        {/* AI Risk Indicator */}
                        <div className={`p-3 rounded-xl border max-w-sm space-y-1 ${
                          isHighRisk ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        }`}>
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <BrainCircuit className="w-3.5 h-3.5" /> AI SLA Risk Score:
                            </span>
                            <span className="font-mono">{leave.aiRiskScore}%</span>
                          </div>
                          <p className="text-[11px] leading-tight opacity-90">{leave.aiRiskReason}</p>
                        </div>

                        {/* Status or Actions */}
                        <div className="flex items-center space-x-2">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => handleGroupLeaveAction(leave.id, 'APPROVED')}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg shadow-emerald-600/20"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                              </button>
                              <button
                                onClick={() => handleGroupLeaveAction(leave.id, 'REJECTED')}
                                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-lg shadow-rose-600/20"
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                              leave.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              leave.status === 'CANCELLED' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                              'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {leave.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: MASTER TASKS FROM ADMIN/PM */}
          {activeTab === 'admin-master-tasks' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-400" />
                  Special Master Tasks Dispatched by Admin / PM
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Master tasks assigned to you by Admin or Project Managers. Divide these master tasks into sub-tasks and distribute them to your team members.
                </p>
              </div>

              {myMasterTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No special master tasks dispatched to your queue yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {myMasterTasks.map(mt => {
                    const pct = mt.subTasksCount > 0 ? Math.round(((mt.completedSubTasksCount || 0) / mt.subTasksCount) * 100) : 0;

                    return (
                      <div key={mt.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1 max-w-md">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-bold text-white">{mt.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {mt.processCategory || 'AR'} Process
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                              {mt.clientName}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{mt.description}</p>
                          <p className="text-[11px] text-slate-500">
                            Dispatched By: <span className="text-slate-300 font-semibold">{mt.createdBy}</span> &bull; SLA Target: <span className="font-mono text-indigo-300">{mt.slaDeadline}</span>
                          </p>
                        </div>

                        {/* Progress Bar & Subtasks Stats */}
                        <div className="w-48 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-slate-400">Team Execution:</span>
                            <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-500 block text-right">
                            {mt.completedSubTasksCount || 0} / {mt.subTasksCount || 0} Sub-tasks Completed
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedMasterTaskForDivide(mt);
                              setDivideForm([{ title: '', description: '', assignedTo: '', dueDate: mt.slaDeadline || '', priority: 'HIGH', capacityHours: 2 }]);
                              setShowDivideModal(true);
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                          >
                            <Sparkles className="w-4 h-4" /> Divide & Distribute to Employees
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AI AUTO-BALANCER & ANNOUNCEMENTS */}
          {activeTab === 'ai-announcements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Workload Auto-Balancer */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-400">
                    <BrainCircuit className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Workload Auto-Balancer</h3>
                    <p className="text-xs text-slate-400">1-click automated task distribution for unassigned items</p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The Python Scikit-Learn engine scans all unassigned group tasks and balances them across members with the highest free capacity.
                </p>

                <button
                  onClick={handleAIAutoBalance}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Trigger AI Workload Auto-Balancing
                </button>
              </div>

              {/* Group Broadcast Board */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-400" />
                  Group Announcement Board
                </h3>

                <form onSubmit={handlePostAnnouncement} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Announcement Title"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Message content for team..."
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Post Group Announcement
                  </button>
                </form>

                <div className="space-y-2 max-h-40 overflow-y-auto pt-2 border-t border-slate-800">
                  {(currentGroup?.announcements || []).map((anc, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs space-y-1">
                      <h5 className="font-bold text-white">{anc.title}</h5>
                      <p className="text-slate-400 text-[11px]">{anc.content}</p>
                      <span className="text-[10px] text-indigo-300 block text-right">— {anc.authorName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: CREATE GROUP */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white">Create New Operational Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oncology Claims QA Team"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Group scope and objectives..."
                  value={newGroupForm.description}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEMBER */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white">Add Employee to Group</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Select Registered Employee</label>
                <select
                  required
                  value={selectedMemberToAdd}
                  onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Employee --</option>
                  {allEmployees.map(emp => (
                    <option key={emp.userId || emp.id} value={emp.userId || emp.id}>
                      👤 {emp.firstName} {emp.lastName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Add to Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REALLOCATE TASK */}
      {showReallocateModal && taskToReallocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-indigo-500/30 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
              Reallocate Task to Another Member
            </h3>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-1">
              <span className="font-bold text-indigo-300">{taskToReallocate.title}</span>
              <p className="text-slate-400 text-[11px]">{taskToReallocate.description}</p>
            </div>

            <form onSubmit={handleReallocateTaskSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Select New Assignee (Group Member)</label>
                <select
                  required
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Member --</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      👤 {m.name} — {m.capacityAvailablePercent}% Free Capacity ({m.activeTasksCount} tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowReallocateModal(false); setTaskToReallocate(null); }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                >
                  Confirm Reallocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DIVIDE & DISTRIBUTE MASTER TASK TO EMPLOYEES */}
      {showDivideModal && selectedMasterTaskForDivide && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-2xl w-full space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" /> Divide & Distribute Sub-Tasks
                </h3>
                <p className="text-xs text-slate-400">
                  Master Task: <span className="text-indigo-300 font-semibold">{selectedMasterTaskForDivide.title}</span> ({selectedMasterTaskForDivide.clientName})
                </p>
              </div>
              <button onClick={() => setShowDivideModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleDivideMasterTaskSubmit} className="space-y-4">
              <div className="space-y-3">
                {divideForm.map((st, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300">Sub-Task #{idx + 1}</span>
                      {divideForm.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDivideForm(divideForm.filter((_, i) => i !== idx))}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Sub-Task Title *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Audit Batch #104 Claims"
                          value={st.title}
                          onChange={(e) => {
                            const copy = [...divideForm];
                            copy[idx].title = e.target.value;
                            setDivideForm(copy);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Assign to Group Member *</label>
                        <select
                          required
                          value={st.assignedTo}
                          onChange={(e) => {
                            const copy = [...divideForm];
                            copy[idx].assignedTo = e.target.value;
                            setDivideForm(copy);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                        >
                          <option value="">-- Choose Member --</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              👤 {m.name} ({m.specialties || 'Specialist'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Task Deadline (Due Date) *</label>
                        <input
                          type="date"
                          required
                          value={st.dueDate || ''}
                          onChange={(e) => {
                            const copy = [...divideForm];
                            copy[idx].dueDate = e.target.value;
                            setDivideForm(copy);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-medium">Priority Level</label>
                        <select
                          value={st.priority || 'HIGH'}
                          onChange={(e) => {
                            const copy = [...divideForm];
                            copy[idx].priority = e.target.value;
                            setDivideForm(copy);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                        >
                          <option value="URGENT">URGENT</option>
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-medium">Task Description & Instructions</label>
                      <textarea
                        rows={2}
                        placeholder="Provide detailed instructions, process notes, or guidelines for the assigned employee..."
                        value={st.description || ''}
                        onChange={(e) => {
                          const copy = [...divideForm];
                          copy[idx].description = e.target.value;
                          setDivideForm(copy);
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setDivideForm([...divideForm, { title: '', description: '', assignedTo: '', dueDate: selectedMasterTaskForDivide?.slaDeadline || '', priority: 'HIGH', capacityHours: 2 }])}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" /> Add Another Sub-Task Row
              </button>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDivideModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={divideSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  {divideSubmitting ? 'Distributing...' : 'Distribute Sub-Tasks to Employees'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
