import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Plus,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  ChevronRight,
  FolderKanban,
  FileCheck,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Edit3,
  Paperclip,
  ExternalLink,
  FileText,
  Trash2,
  Eye,
  ChevronLeft,
  UploadCloud,
  FolderPlus,
  Upload,
  X,
  File
} from 'lucide-react';

const PROCESS_CATEGORIES = [
  { id: 'AR', label: 'Accounts Receivable (AR)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', badge: 'AR' },
  { id: 'BILLING', label: 'Medical Billing', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', badge: 'Billing' },
  { id: 'QA', label: 'Quality Assurance (QA)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', badge: 'QA' },
  { id: 'CODING', label: 'Medical Coding', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', badge: 'Coding' },
  { id: 'VOB', label: 'Verification of Benefits (VOB)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', badge: 'VOB' }
];

export default function ClientOperationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('clients'); // 'clients', 'inspect', 'dispatch', 'monitor'

  // Data States
  const [clients, setClients] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [masterTasks, setMasterTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // PM & Admin Monitoring Filters State
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [expandedMasterTaskId, setExpandedMasterTaskId] = useState(null);

  // One-by-One Client Inspector State
  const [inspectClientId, setInspectClientId] = useState(null);

  // Edit Client Modal & Attached Files State
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showAttachFileModal, setShowAttachFileModal] = useState(false);
  const [targetClientIdForFile, setTargetClientIdForFile] = useState(null);
  const [showLinkGroupModal, setShowLinkGroupModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedClientIdForLink, setSelectedClientIdForLink] = useState(null);

  const [editClientForm, setEditClientForm] = useState({
    id: '',
    name: '',
    code: '',
    specialty: 'Multispecialty Healthcare',
    accountManager: '',
    slaTargetPct: 98.5,
    notes: ''
  });

  const [attachFileForm, setAttachFileForm] = useState({
    title: '',
    filePath: '',
    fileCategory: 'CONTRACT_SLA'
  });
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  // Forms
  const [clientForm, setClientForm] = useState({
    name: '',
    code: '',
    specialty: 'Multispecialty Healthcare',
    accountManager: '',
    slaTargetPct: 98.5,
    notes: ''
  });

  const [linkGroupForm, setLinkGroupForm] = useState({
    groupId: '',
    processCategory: 'AR'
  });

  const [dispatchForm, setDispatchForm] = useState({
    title: '',
    description: '',
    clientId: '',
    processCategory: 'AR',
    targetTeamLeadId: '',
    groupId: '',
    priority: 'HIGH',
    slaDeadline: '',
    fileName: '',
    fileUrl: ''
  });

  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [clientsRes, groupsRes, empRes, masterRes] = await Promise.allSettled([
        api.get('/clients'),
        api.get('/groups'),
        api.get('/hr/employees'),
        api.get('/clients/master-tasks')
      ]);

      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value.data || []);
      if (groupsRes.status === 'fulfilled') setGroups(groupsRes.value.data || []);
      if (masterRes.status === 'fulfilled') setMasterTasks(masterRes.value.data || []);

      if (empRes.status === 'fulfilled') {
        const allStaff = empRes.value.data || [];
        const tls = allStaff.filter(e => ['TEAM_LEADER', 'TEAM_LEAD', 'PROJECT_MANAGER', 'SYSTEM_ADMIN'].includes(e.role));
        setTeamLeads(tls);
      }
    } catch (err) {
      console.error('Error fetching Client Operations data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', clientForm);
      setShowCreateClientModal(false);
      setClientForm({ name: '', code: '', specialty: 'Multispecialty Healthcare', accountManager: '', slaTargetPct: 98.5, notes: '' });
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create client.');
    }
  };

  const handleOpenEditClient = (client) => {
    setEditClientForm({
      id: client.id,
      name: client.name || '',
      code: client.code || '',
      specialty: client.specialty || 'Multispecialty Healthcare',
      accountManager: client.accountManager || '',
      slaTargetPct: client.slaTargetPct || 98.5,
      notes: client.notes || ''
    });
    setShowEditClientModal(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/clients/${editClientForm.id}`, editClientForm);
      setShowEditClientModal(false);
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update client details.');
    }
  };

  const handleOpenAttachFile = (clientId) => {
    setTargetClientIdForFile(clientId);
    setAttachFileForm({ title: '', filePath: '', fileCategory: 'CONTRACT_SLA' });
    setSelectedFileObj(null);
    setDragActive(false);
    setShowAttachFileModal(true);
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setSelectedFileObj(file);
    setAttachFileForm(prev => ({
      ...prev,
      title: prev.title || file.name,
      filePath: file.name
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAttachFile = async (e) => {
    e.preventDefault();
    if (!targetClientIdForFile) return;
    setUploadSubmitting(true);
    try {
      let finalFilePath = attachFileForm.filePath;
      if (selectedFileObj) {
        const formData = new FormData();
        formData.append('files', selectedFileObj);
        try {
          const uploadRes = await api.post('/files/upload-to-employee', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data?.uploadedFiles?.[0]?.fileUrl) {
            finalFilePath = uploadRes.data.uploadedFiles[0].fileUrl;
          }
        } catch (uploadErr) {
          console.warn('File upload fallback to filename:', uploadErr.message);
        }
      }

      await api.post(`/clients/${targetClientIdForFile}/files`, {
        ...attachFileForm,
        filePath: finalFilePath || selectedFileObj?.name || 'Attached Document'
      });

      setShowAttachFileModal(false);
      setAttachFileForm({ title: '', filePath: '', fileCategory: 'CONTRACT_SLA' });
      setSelectedFileObj(null);
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to attach file to client.');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleDeleteClientFile = async (clientId, fileId) => {
    if (!window.confirm('Are you sure you want to remove this attached file path from client?')) return;
    try {
      await api.delete(`/clients/${clientId}/files/${fileId}`);
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete client file.');
    }
  };

  const handleInspectClient = (clientId) => {
    setInspectClientId(clientId);
    setActiveTab('inspect');
  };

  const handleLinkGroup = async (e) => {
    e.preventDefault();
    if (!selectedClientIdForLink) return;
    try {
      await api.post(`/clients/${selectedClientIdForLink}/link-group`, linkGroupForm);
      setShowLinkGroupModal(false);
      setSelectedClientIdForLink(null);
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to link process group to client.');
    }
  };

  const handleDispatchMasterTask = async (e) => {
    e.preventDefault();
    setDispatchSubmitting(true);
    try {
      await api.post('/clients/master-tasks', dispatchForm);
      setShowDispatchModal(false);
      setDispatchForm({
        title: '',
        description: '',
        clientId: '',
        processCategory: 'AR',
        targetTeamLeadId: '',
        groupId: '',
        priority: 'HIGH',
        slaDeadline: '',
        fileName: '',
        fileUrl: ''
      });
      fetchHubData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch master task package.');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Client & Multi-Process Operations Hub
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                Executive Command & Dispatch
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage client portfolios, allocate AR / Billing / QA / Coding / VOB teams, and dispatch master tasks to Team Leads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateClientModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Client
          </button>
          <button
            onClick={() => setShowDispatchModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
          >
            <Send className="w-4 h-4" /> Dispatch Master Task
          </button>
        </div>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'clients' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏥 Client Portfolio ({clients.length})
        </button>
        <button
          onClick={() => {
            if (!inspectClientId && clients.length > 0) setInspectClientId(clients[0].id);
            setActiveTab('inspect');
          }}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'inspect' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🔍 One-by-One Client Inspector
        </button>
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'dispatch' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🚀 Master Tasks Dispatched ({masterTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'monitor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Process Velocity & Overall PM Analytics
        </button>
      </div>

      {/* TAB 1: CLIENT HIERARCHY & PROCESS TEAMS */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {clients.length === 0 ? (
            <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No Clients Registered Yet</h3>
              <p className="text-xs text-slate-400">
                Create your first healthcare client account to link AR, Billing, QA, Coding, and VOB operational teams.
              </p>
              <button
                onClick={() => setShowCreateClientModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add First Healthcare Client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clients.map(client => (
                <div key={client.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-base font-bold text-white tracking-tight">{client.name}</h3>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {client.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {client.specialty} &bull; Account Mgr: <span className="text-slate-200 font-semibold">{client.accountManager}</span>
                      </p>
                    </div>

                    {/* Actions Bar for Admins & PMs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleInspectClient(client.id)}
                        className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Inspect progress one-by-one"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                      <button
                        onClick={() => handleOpenEditClient(client)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Edit client details & SLA target"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleOpenAttachFile(client.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                        title="Attach contract file or document path"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-purple-400" /> Attach File
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClientIdForLink(client.id);
                          setShowLinkGroupModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Link Team
                      </button>
                    </div>
                  </div>

                  {/* Client Notes if any */}
                  {client.notes && (
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 italic">
                      "{client.notes}"
                    </p>
                  )}

                  {/* Attached Files & File Paths Section */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Attached Contract File Paths ({client.attachedFiles?.length || 0})</span>
                      <button
                        onClick={() => handleOpenAttachFile(client.id)}
                        className="text-indigo-400 hover:underline font-bold normal-case text-[11px] flex items-center gap-1"
                      >
                        + Add File Path
                      </button>
                    </div>

                    {!client.attachedFiles || client.attachedFiles.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No files or contract paths attached yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {client.attachedFiles.map(file => (
                          <div key={file.id} className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                              <div className="truncate">
                                <span className="font-semibold text-white truncate block">{file.title}</span>
                                <span className="text-[10px] font-mono text-indigo-300 truncate block">{file.filePath}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              {file.filePath.startsWith('http') && (
                                <a
                                  href={file.filePath}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-slate-400 hover:text-indigo-300"
                                  title="Open Link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => handleDeleteClientFile(client.id, file.id)}
                                className="p-1 text-slate-500 hover:text-rose-400"
                                title="Remove File Path"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Linked Operational Process Teams (AR, Billing, QA, Coding, VOB) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Linked Operational Process Teams ({client.teams?.length || 0})
                    </span>

                    {!client.teams || client.teams.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No operational teams linked yet. Click "Link Team" above.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {client.teams.map(team => {
                          const catInfo = PROCESS_CATEGORIES.find(c => c.id === team.processCategory) || PROCESS_CATEGORIES[0];
                          return (
                            <div key={team.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{team.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                                  {catInfo.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                TL: <span className="text-slate-200">{team.teamLeadName || 'Unassigned'}</span> &bull; {team.membersCount} Specialists
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SLA Throughput Progress */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-400">Target SLA Throughput:</span>
                      <span className="font-mono font-bold text-white">{client.slaTargetPct}%</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {client.completedMasterTasksCount} Completed Tasks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ONE-BY-ONE CLIENT PROGRESS INSPECTOR */}
      {activeTab === 'inspect' && (() => {
        const currentInspectClient = clients.find(c => c.id === inspectClientId) || clients[0];
        const clientIdx = clients.findIndex(c => c.id === currentInspectClient?.id);
        const prevClient = clients[clientIdx - 1];
        const nextClient = clients[clientIdx + 1];

        if (!currentInspectClient) {
          return (
            <div className="glass-panel p-12 rounded-3xl text-center text-slate-400 text-xs">
              No client selected to inspect. Please create or register a healthcare client first.
            </div>
          );
        }

        const clientMasterTasks = masterTasks.filter(mt => mt.clientId === currentInspectClient.id);
        const totalSubTasks = clientMasterTasks.reduce((sum, mt) => sum + (mt.subTasksCount || 0), 0);
        const completedSubTasks = clientMasterTasks.reduce((sum, mt) => sum + (mt.completedSubTasksCount || 0), 0);
        const slaPct = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : (clientMasterTasks.length > 0 && clientMasterTasks.every(m => m.status === 'COMPLETED') ? 100 : 0);

        return (
          <div className="space-y-6">
            {/* One-by-One Selector Control Bar */}
            <div className="glass-panel p-5 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Client Deep-Dive Progress Inspector
                    <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Client {clientIdx + 1} of {clients.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Inspect operational progress, linked teams, and attached file paths for individual healthcare clients one by one.
                  </p>
                </div>
              </div>

              {/* Selector & Prev/Next Navigation */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  disabled={!prevClient}
                  onClick={() => setInspectClientId(prevClient.id)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold disabled:opacity-40 flex items-center gap-1 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>

                <select
                  value={currentInspectClient.id}
                  onChange={(e) => setInspectClientId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                >
                  {clients.map((c, i) => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                      #{i + 1} - {c.name} ({c.code})
                    </option>
                  ))}
                </select>

                <button
                  disabled={!nextClient}
                  onClick={() => setInspectClientId(nextClient.id)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-semibold disabled:opacity-40 flex items-center gap-1 hover:bg-slate-800"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Single Client Overview Hero Card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-white tracking-tight">{currentInspectClient.name}</h2>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {currentInspectClient.code}
                    </span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {currentInspectClient.specialty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Account Manager: <span className="text-white font-semibold">{currentInspectClient.accountManager}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenEditClient(currentInspectClient)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Edit3 className="w-4 h-4" /> Edit Client Details
                  </button>
                  <button
                    onClick={() => handleOpenAttachFile(currentInspectClient.id)}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all"
                  >
                    <Paperclip className="w-4 h-4" /> Attach File Path
                  </button>
                </div>
              </div>

              {currentInspectClient.notes && (
                <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 italic">
                  "{currentInspectClient.notes}"
                </div>
              )}

              {/* Progress & Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Target SLA Throughput</span>
                  <p className="text-xl font-bold font-mono text-emerald-400">{currentInspectClient.slaTargetPct}%</p>
                  <span className="text-[10px] text-slate-500">Contractual SLA guarantee</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Master Task Packages</span>
                  <p className="text-xl font-bold font-mono text-indigo-300">{clientMasterTasks.length}</p>
                  <span className="text-[10px] text-slate-500">Dispatched for this client</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold block">Sub-task Workload SLA</span>
                  <p className="text-xl font-bold font-mono text-cyan-400">{completedSubTasks} / {totalSubTasks}</p>
                  <span className="text-[10px] text-slate-500">{slaPct}% employee completion throughput</span>
                </div>
              </div>

              {/* Attached Files & File Paths Section for current client */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-purple-400" />
                    Attached Client Contract & SLA File Paths ({currentInspectClient.attachedFiles?.length || 0})
                  </h4>
                  <button
                    onClick={() => handleOpenAttachFile(currentInspectClient.id)}
                    className="text-xs text-indigo-400 hover:underline font-bold flex items-center gap-1"
                  >
                    + Attach New File Path
                  </button>
                </div>

                {!currentInspectClient.attachedFiles || currentInspectClient.attachedFiles.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No files or contract paths attached to this client yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentInspectClient.attachedFiles.map(file => (
                      <div key={file.id} className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center space-x-3 min-w-0">
                          <FileText className="w-5 h-5 text-purple-400 shrink-0" />
                          <div className="truncate space-y-0.5">
                            <span className="font-semibold text-white truncate block">{file.title}</span>
                            <span className="text-[11px] font-mono text-indigo-300 truncate block">{file.filePath}</span>
                            <span className="text-[10px] text-slate-500 block">Uploaded by: {file.uploadedBy}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {file.filePath.startsWith('http') && (
                            <a
                              href={file.filePath}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg"
                              title="Open URL Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteClientFile(currentInspectClient.id, file.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg"
                            title="Delete File Path"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Teams & Processes */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Linked Operational Teams ({currentInspectClient.teams?.length || 0})
                </h4>

                {!currentInspectClient.teams || currentInspectClient.teams.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No process teams linked under this client yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {currentInspectClient.teams.map(team => {
                      const catInfo = PROCESS_CATEGORIES.find(c => c.id === team.processCategory) || PROCESS_CATEGORIES[0];
                      return (
                        <div key={team.id} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{team.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                              {catInfo.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Team Lead: <span className="text-slate-200 font-semibold">{team.teamLeadName || 'Unassigned'}</span> &bull; {team.membersCount} Specialists
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dispatched Master Tasks & Subtask Matrix for this Client */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-indigo-400" />
                  Ongoing Master Tasks & Employee Workload for {currentInspectClient.name} ({clientMasterTasks.length})
                </h4>

                {clientMasterTasks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No master tasks dispatched for this client yet.</p>
                ) : (
                  <div className="space-y-3">
                    {clientMasterTasks.map(mt => {
                      const catInfo = PROCESS_CATEGORIES.find(c => c.id === mt.processCategory) || PROCESS_CATEGORIES[0];
                      const pct = mt.subTasksCount > 0 ? Math.round(((mt.completedSubTasksCount || 0) / mt.subTasksCount) * 100) : 0;

                      return (
                        <div key={mt.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-3">
                                <span className="text-xs font-bold text-white">{mt.title}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                                  {catInfo.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">
                                Dispatched to Team Lead: <span className="text-indigo-300 font-semibold">{mt.targetTeamLeadName}</span> &bull; Deadline: <span className="font-mono text-slate-300">{mt.slaDeadline}</span>
                              </p>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="w-32 space-y-1">
                                <div className="flex justify-between text-[10px] font-semibold">
                                  <span className="text-slate-400 font-mono">{pct}%</span>
                                </div>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-emerald-400 h-full" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>

                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
                                mt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                mt.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                                'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              }`}>
                                {mt.status}
                              </span>
                            </div>
                          </div>

                          {/* Subtasks breakdown */}
                          {mt.subTasks && mt.subTasks.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                              {mt.subTasks.map(st => (
                                <div key={st.id} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="font-semibold text-white block">{st.title}</span>
                                    <span className="text-[10px] text-slate-400">Assigned: <strong className="text-indigo-300">{st.assignedToName}</strong></span>
                                  </div>
                                  <span className="text-[10px] font-semibold text-slate-400">{st.status}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: MASTER TASK DISPATCH ENGINE */}
      {activeTab === 'dispatch' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-400" />
                Special Master Tasks Dispatched to Team Leads
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Admin and PMs dispatch special task packages to Team Leads. Team Leads then divide & distribute sub-tasks to group employees.
              </p>
            </div>

            <button
              onClick={() => setShowDispatchModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Dispatch New Master Task
            </button>
          </div>

          {masterTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No master tasks dispatched yet. Click "Dispatch New Master Task" above.
            </div>
          ) : (
            <div className="space-y-4">
              {masterTasks.map(mt => {
                const catInfo = PROCESS_CATEGORIES.find(c => c.id === mt.processCategory) || PROCESS_CATEGORIES[0];
                const pct = mt.subTasksCount > 0 ? Math.round(((mt.completedSubTasksCount || 0) / mt.subTasksCount) * 100) : 0;

                return (
                  <div key={mt.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-white">{mt.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                          {catInfo.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                          {mt.clientName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{mt.description}</p>
                      <p className="text-[11px] text-slate-500">
                        Dispatched To Team Lead: <span className="text-indigo-300 font-semibold">{mt.targetTeamLeadName}</span> &bull; Deadline: <span className="font-mono text-slate-300">{mt.slaDeadline}</span>
                      </p>
                    </div>

                    {/* Progress Bar & Subtasks Stats */}
                    <div className="w-48 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-slate-400">Employee Completion:</span>
                        <span className="font-mono text-emerald-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-[10px] text-slate-500 block text-right">
                        {mt.completedSubTasksCount || 0} / {mt.subTasksCount || 0} Sub-tasks Done
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        mt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        mt.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                        'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {mt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROCESS VELOCITY & LIVE PM/ADMIN MONITORING DASHBOARD */}
      {activeTab === 'monitor' && (() => {
        const filteredTasks = masterTasks.filter(mt => {
          if (selectedClientFilter !== 'ALL' && mt.clientId !== selectedClientFilter) return false;
          if (selectedCategoryFilter !== 'ALL' && mt.processCategory !== selectedCategoryFilter) return false;
          if (selectedStatusFilter !== 'ALL' && mt.status !== selectedStatusFilter) return false;
          return true;
        });

        const totalSubtasks = masterTasks.reduce((sum, mt) => sum + (mt.subTasksCount || 0), 0);
        const totalCompletedSubtasks = masterTasks.reduce((sum, mt) => sum + (mt.completedSubTasksCount || 0), 0);
        const overallSubtaskCompletionPct = totalSubtasks > 0 ? Math.round((totalCompletedSubtasks / totalSubtasks) * 100) : 0;
        const avgSlaTarget = clients.length > 0 ? Math.round((clients.reduce((sum, c) => sum + (Number(c.slaTargetPct) || 98.5), 0) / clients.length) * 10) / 10 : 98.5;

        return (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    PM & Admin Operations Monitoring Dashboard
                  </h3>
                  <p className="text-xs text-slate-400">
                    Track ongoing client operations, process SLA throughput, and specialist employee sub-task workloads.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-400">Client:</span>
                    <select
                      value={selectedClientFilter}
                      onChange={(e) => setSelectedClientFilter(e.target.value)}
                      className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">All Clients ({clients.length})</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-slate-400">Process:</span>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">All Processes (AR/Billing/QA/Coding/VOB)</option>
                      {PROCESS_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                    <span className="text-slate-400">Status:</span>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
                    >
                      <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
                      <option value="DISPATCHED" className="bg-slate-900 text-white">Dispatched</option>
                      <option value="IN_PROGRESS" className="bg-slate-900 text-white">In Progress</option>
                      <option value="COMPLETED" className="bg-slate-900 text-white">Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Analytics Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Healthcare Portfolios</span>
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-bold font-mono text-white">{clients.length}</p>
                <span className="text-[11px] text-slate-400">Active client systems</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Master Tasks Filtered</span>
                  <Send className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold font-mono text-white">{filteredTasks.length}</p>
                <span className="text-[11px] text-slate-400">Dispatched operational packages</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Employee Sub-Tasks</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold font-mono text-emerald-400">
                  {totalCompletedSubtasks} / {totalSubtasks}
                </p>
                <span className="text-[11px] text-slate-400">{overallSubtaskCompletionPct}% Completion Throughput</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Avg SLA Target</span>
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold font-mono text-cyan-400">{avgSlaTarget}%</p>
                <span className="text-[11px] text-slate-400">Across all client groups</span>
              </div>
            </div>

            {/* Process Velocity Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {PROCESS_CATEGORIES.map(cat => {
                const categoryTasks = masterTasks.filter(mt => mt.processCategory === cat.id);
                const totalSub = categoryTasks.reduce((sum, mt) => sum + (mt.subTasksCount || 0), 0);
                const completedSub = categoryTasks.reduce((sum, mt) => sum + (mt.completedSubTasksCount || 0), 0);
                const pct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : (categoryTasks.length > 0 && categoryTasks.every(t => t.status === 'COMPLETED') ? 100 : 0);

                return (
                  <div key={cat.id} className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block ${cat.color}`}>
                        {cat.badge}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-400">{categoryTasks.length} Pkgs</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{cat.label}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-lg font-bold font-mono text-indigo-300">{pct}%</span>
                        <span className="text-[10px] text-slate-400 font-mono">{completedSub}/{totalSub} subtasks</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Sub-Task & Workload Monitoring Matrix */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-indigo-400" />
                  Live Master Task & Sub-Task Workload Matrix
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Showing {filteredTasks.length} of {masterTasks.length} Master Tasks
                </span>
              </div>

              {filteredTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No active task packages match the selected monitoring filters.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(mt => {
                    const catInfo = PROCESS_CATEGORIES.find(c => c.id === mt.processCategory) || PROCESS_CATEGORIES[0];
                    const pct = mt.subTasksCount > 0 ? Math.round(((mt.completedSubTasksCount || 0) / mt.subTasksCount) * 100) : 0;
                    const isExpanded = expandedMasterTaskId === mt.id;

                    return (
                      <div key={mt.id} className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition-all">
                        <div
                          onClick={() => setExpandedMasterTaskId(isExpanded ? null : mt.id)}
                          className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-white">{mt.title}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catInfo.color}`}>
                                {catInfo.badge}
                              </span>
                              <span className="text-[10px] font-mono text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                                {mt.clientName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Team Lead: <span className="text-indigo-300 font-semibold">{mt.targetTeamLeadName}</span> &bull; Created By: <span className="text-slate-300">{mt.createdBy}</span>
                            </p>
                          </div>

                          <div className="flex items-center space-x-6">
                            <div className="w-36 space-y-1">
                              <div className="flex justify-between text-[10px] font-semibold">
                                <span className="text-slate-400">Progress</span>
                                <span className="text-emerald-400 font-mono">{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-400 h-full" style={{ width: `${pct}%` }}></div>
                              </div>
                            </div>

                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                              mt.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              mt.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                              'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              {mt.status}
                            </span>

                            <button className="p-1 text-slate-400 hover:text-white">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Sub-Task Drill-down Details */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-3 text-xs">
                            <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                              <span>Distributed Sub-Tasks for Specialists ({mt.subTasks?.length || 0}):</span>
                              <span>SLA Deadline: <strong className="text-slate-200 font-mono">{mt.slaDeadline}</strong></span>
                            </div>

                            {!mt.subTasks || mt.subTasks.length === 0 ? (
                              <p className="text-slate-500 italic text-[11px]">
                                Team Lead has not divided this master task into sub-tasks yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {mt.subTasks.map(st => (
                                  <div key={st.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <span className="font-semibold text-white block">{st.title}</span>
                                      <span className="text-[10px] text-slate-400 block">
                                        Assigned: <strong className="text-indigo-300">{st.assignedToName}</strong> ({st.estimatedHours || 2}h)
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                      st.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                                      st.status === 'IN_PROGRESS' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                                      'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                      {st.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODAL 1: CREATE NEW CLIENT */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Create Healthcare Client
              </h3>
              <button onClick={() => setShowCreateClientModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Client Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Health Systems"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Client Code</label>
                  <input
                    type="text"
                    placeholder="e.g. APEX"
                    value={clientForm.code}
                    onChange={(e) => setClientForm({ ...clientForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">SLA Target (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={clientForm.slaTargetPct}
                    onChange={(e) => setClientForm({ ...clientForm, slaTargetPct: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Account Manager</label>
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={clientForm.accountManager}
                  onChange={(e) => setClientForm({ ...clientForm, accountManager: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClientModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LINK PROCESS TEAM TO CLIENT */}
      {showLinkGroupModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> Link Process Team to Client
              </h3>
              <button onClick={() => setShowLinkGroupModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleLinkGroup} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Select Operational Group / Team</label>
                <select
                  required
                  value={linkGroupForm.groupId}
                  onChange={(e) => setLinkGroupForm({ ...linkGroupForm, groupId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                >
                  <option value="">-- Choose Team --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      👥 {g.name} ({g.teamLeadName || 'Team Lead'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400">Process Category</label>
                <select
                  value={linkGroupForm.processCategory}
                  onChange={(e) => setLinkGroupForm({ ...linkGroupForm, processCategory: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                >
                  {PROCESS_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkGroupModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Link Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISPATCH MASTER TASK TO TEAM LEAD */}
      {showDispatchModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" /> Dispatch Special Master Task to Team Lead
              </h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleDispatchMasterTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Master Task Package Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upload & Process 500 BCBS Denial Claims"
                  value={dispatchForm.title}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Select Client</label>
                  <select
                    value={dispatchForm.clientId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, clientId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="">-- Enterprise Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Process Category</label>
                  <select
                    value={dispatchForm.processCategory}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, processCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    {PROCESS_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-purple-300 font-semibold block">Target Team Lead</label>
                  <select
                    required
                    value={dispatchForm.targetTeamLeadId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, targetTeamLeadId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="">-- Choose Team Lead --</option>
                    {teamLeads.map(tl => (
                      <option key={tl.id} value={tl.id}>
                        👤 {tl.firstName} {tl.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Target Group (Optional)</label>
                  <select
                    value={dispatchForm.groupId}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, groupId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="">-- Operational Group --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-indigo-300 font-semibold block">SLA Deadline / Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dispatchForm.slaDeadline}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, slaDeadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block">Priority Level</label>
                  <select
                    value={dispatchForm.priority}
                    onChange={(e) => setDispatchForm({ ...dispatchForm, priority: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="URGENT">URGENT</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Special Instructions & Description *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Enter detailed description and instructions for Team Lead on how to divide and assign this package..."
                  value={dispatchForm.description}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchSubmitting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  {dispatchSubmitting ? 'Dispatching...' : 'Dispatch Package to Team Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLIENT DETAILS */}
      {showEditClientModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" /> Edit Healthcare Client Details
              </h3>
              <button onClick={() => setShowEditClientModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Client Name</label>
                <input
                  type="text"
                  required
                  value={editClientForm.name}
                  onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Client Code</label>
                  <input
                    type="text"
                    value={editClientForm.code}
                    onChange={(e) => setEditClientForm({ ...editClientForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Target SLA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editClientForm.slaTargetPct}
                    onChange={(e) => setEditClientForm({ ...editClientForm, slaTargetPct: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Specialty</label>
                <input
                  type="text"
                  value={editClientForm.specialty}
                  onChange={(e) => setEditClientForm({ ...editClientForm, specialty: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Account Manager</label>
                <input
                  type="text"
                  value={editClientForm.accountManager}
                  onChange={(e) => setEditClientForm({ ...editClientForm, accountManager: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Notes / Operating Instructions</label>
                <textarea
                  rows="2"
                  value={editClientForm.notes}
                  onChange={(e) => setEditClientForm({ ...editClientForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditClientModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30"
                >
                  Save Client Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ATTACH CLIENT FILE (DRAG AND DROP OR FILE SELECT) */}
      {showAttachFileModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-purple-400" /> Attach Document to Client
              </h3>
              <button 
                onClick={() => setShowAttachFileModal(false)} 
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-all"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAttachFile} className="space-y-4">
              {/* Drag and Drop Zone / File Selection Box */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">Select or Drop File *</label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer relative ${
                    dragActive 
                      ? 'border-indigo-400 bg-indigo-500/20 scale-[1.01]' 
                      : selectedFileObj
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-indigo-500/50 bg-slate-900/60 hover:bg-indigo-500/5'
                  }`}
                >
                  {selectedFileObj ? (
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-emerald-500/40 text-left">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{selectedFileObj.name}</p>
                          <p className="text-[10px] text-slate-400">{(selectedFileObj.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFileObj(null);
                          setAttachFileForm(prev => ({ ...prev, filePath: '' }));
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                        title="Remove selected file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <UploadCloud className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Drag & drop file here or <span className="text-indigo-400 underline">click to browse from computer</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Supports PDF, DOCX, XLSX, CSV, PNG, JPG (Up to 20MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="text-xs text-slate-400 block font-medium">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master SLA Contract 2026.pdf"
                  value={attachFileForm.title}
                  onChange={(e) => setAttachFileForm({ ...attachFileForm, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* File Path or URL */}
              <div>
                <label className="text-xs text-slate-400 block font-medium">File Path or Link URL (Optional / Auto-filled)</label>
                <input
                  type="text"
                  placeholder="e.g. C:\Contracts\SLA-2026.pdf or https://drive.google.com/..."
                  value={attachFileForm.filePath}
                  onChange={(e) => setAttachFileForm({ ...attachFileForm, filePath: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono focus:ring-1 focus:ring-indigo-500 outline-none text-[11px]"
                />
              </div>

              {/* Document Category */}
              <div>
                <label className="text-xs text-slate-400 block font-medium">Document Category</label>
                <select
                  value={attachFileForm.fileCategory}
                  onChange={(e) => setAttachFileForm({ ...attachFileForm, fileCategory: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="CONTRACT_SLA">Master SLA & Contract</option>
                  <option value="SOP_MANUAL">Standard Operating Procedure (SOP)</option>
                  <option value="RATE_CARD">Billing Rate Card & Fee Structure</option>
                  <option value="GENERAL_INTAKE">General Client Intake Document</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttachFileModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadSubmitting ? 'Attaching File...' : 'Attach Document to Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
