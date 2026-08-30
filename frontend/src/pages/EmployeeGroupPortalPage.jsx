import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, CheckCircle2, Clock, UploadCloud, Download, RefreshCw,
  FolderOpen, File, Trash2, X, AlertCircle, CheckCheck,
  Briefcase, BrainCircuit, ArrowUpRight, ChevronDown,
  Award, Star, TrendingUp, Gift, Calendar, Target
} from 'lucide-react';

const STATUS_CONFIG = {
  RECEIVED:            { label: 'Received',            color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  IN_PROGRESS:         { label: 'In Progress',         color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  COMPLETED:           { label: 'Completed',           color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  NEEDS_CLARIFICATION: { label: 'Needs Clarification', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function EmployeeGroupPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-group');
  const [myGroups, setMyGroups] = useState([]);
  const [myFiles, setMyFiles] = useState([]);
  const [myAppraisals, setMyAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  // File interaction state
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseFiles, setResponseFiles] = useState([]);
  const [responseDragging, setResponseDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadErr, setUploadErr] = useState('');
  const fileInputRef = useRef(null);

  // Status dropdown state
  const [statusDropdown, setStatusDropdown] = useState(null);

  // Live polling ref
  const pollRef = useRef(null);

  useEffect(() => {
    fetchAll();
    // Live poll every 10s
    pollRef.current = setInterval(fetchAll, 10000);
    return () => clearInterval(pollRef.current);
  }, []);

  const fetchAll = async () => {
    try {
      const [groupsRes, filesRes, appraisalRes] = await Promise.allSettled([
        api.get('/groups/my-groups'),
        api.get('/files/my-files'),
        api.get('/hr/appraisals')
      ]);
      if (groupsRes.status === 'fulfilled') setMyGroups(groupsRes.value.data || []);
      if (filesRes.status === 'fulfilled') setMyFiles(filesRes.value.data || []);
      if (appraisalRes.status === 'fulfilled') {
        // Filter to only this user's appraisals
        const all = appraisalRes.value.data || [];
        setMyAppraisals(all);
      }
    } catch (err) {
      console.error('Employee portal fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeMPR = async (appraisalId) => {
    try {
      await api.patch(`/hr/appraisals/${appraisalId}`, { status: 'ACKNOWLEDGED' });
      fetchAll();
    } catch (err) {
      alert('Failed to acknowledge review.');
    }
  };

  const handleUpdateStatus = async (fileId, status) => {
    try {
      await api.patch(`/files/${fileId}/status`, { status });
      setMyFiles(prev => prev.map(f => f.id === fileId ? { ...f, status } : f));
      setStatusDropdown(null);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleRespond = async (fileId) => {
    if (responseFiles.length === 0) {
      setUploadErr('Please attach at least one file.');
      return;
    }
    setUploading(true);
    setUploadErr('');
    try {
      const formData = new FormData();
      responseFiles.forEach(f => formData.append('files', f));
      const res = await api.post(`/files/${fileId}/respond`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg(res.data.message || 'Response sent!');
      setRespondingTo(null);
      setResponseFiles([]);
      fetchAll();
    } catch (err) {
      setUploadErr(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType, name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (mimeType?.includes('pdf') || ext === 'pdf') return '📕';
    if (mimeType?.includes('sheet') || ext === 'xlsx' || ext === 'xls') return '📗';
    if (mimeType?.includes('csv') || ext === 'csv') return '📊';
    if (mimeType?.includes('word') || ext === 'docx' || ext === 'doc') return '📘';
    if (mimeType?.includes('image')) return '🖼️';
    return '📄';
  };

  const allMyTasks = myGroups.flatMap(g => (g.myTasks || []).map(t => ({ ...t, groupName: g.name })));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <FolderOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              My Group Portal
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              View your group membership, files from your Team Lead, and your assigned tasks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <RefreshCw className="w-3 h-3" /> Auto-refreshes every 10s
        </div>
      </div>

      {/* No Group State */}
      {myGroups.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Not Yet Added to a Group</h3>
          <p className="text-xs text-slate-400">
            Your Team Lead has not added you to a group yet. Once added, your group, tasks, and files will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('my-group')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${activeTab === 'my-group' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              👥 My Group ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('my-files')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${activeTab === 'my-files' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              📂 My Files ({myFiles.length})
            </button>
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${activeTab === 'my-tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              ✅ My Tasks ({allMyTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('my-reviews')}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${activeTab === 'my-reviews' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🌟 My Reviews ({myAppraisals.length})
              {myAppraisals.some(a => a.status === 'COMPLETED') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* ── TAB 1: MY GROUP ── */}
          {activeTab === 'my-group' && (
            <div className="space-y-4">
              {myGroups.map(group => (
                <div key={group.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
                  {/* Group Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        👥 {group.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Team Lead: <span className="text-indigo-300 font-semibold">{group.teamLeadName}</span>
                        {group.description && <> &bull; {group.description}</>}
                      </p>
                    </div>
                    {/* Progress */}
                    <div className="shrink-0 text-right space-y-1">
                      <span className="text-2xl font-black text-white">{group.progressPct}%</span>
                      <p className="text-[11px] text-slate-500">{group.completedCount}/{group.totalTasks} tasks done</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 rounded-full"
                      style={{ width: `${group.progressPct}%` }}
                    />
                  </div>

                  {/* Stat Pills */}
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[11px] font-semibold text-indigo-300">
                      {group.memberCount} Members
                    </span>
                    <span className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-[11px] font-semibold text-slate-300">
                      {group.totalTasks} Total Tasks
                    </span>
                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] font-semibold text-emerald-300">
                      {group.completedCount} Completed
                    </span>
                    <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] font-semibold text-amber-300">
                      {group.myTasks?.length || 0} My Tasks
                    </span>
                  </div>

                  {/* Member Avatars */}
                  <div>
                    <p className="text-[11px] text-slate-500 mb-2 font-semibold uppercase tracking-wider">Group Members</p>
                    <div className="flex flex-wrap gap-3">
                      {group.members.map(m => (
                        <div key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${m.id === user?.id ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                          <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`} alt={m.name} className="w-6 h-6 rounded-lg" />
                          <span className="font-semibold">{m.name}</span>
                          {m.id === user?.id && <span className="text-[10px] text-indigo-400">(You)</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group Announcements */}
                  {group.announcements && group.announcements.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">📢 Group Announcements</p>
                      {group.announcements.slice(0, 3).map((anc, i) => (
                        <div key={i} className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
                          <p className="text-xs font-bold text-white">{anc.title}</p>
                          {anc.content && <p className="text-[11px] text-slate-400 mt-0.5">{anc.content}</p>}
                          <span className="text-[10px] text-indigo-400 block mt-1">— {anc.authorName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── TAB 2: MY FILES ── */}
          {activeTab === 'my-files' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <File className="w-4 h-4 text-indigo-400" />
                  Files From Your Team Lead
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Download files, update your progress status, and upload response files back to your Team Lead.
                </p>
              </div>

              {uploadMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCheck className="w-4 h-4" /> {uploadMsg}
                  <button onClick={() => setUploadMsg('')} className="ml-auto">×</button>
                </div>
              )}

              {myFiles.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <FolderOpen className="w-10 h-10 mx-auto text-slate-700" />
                  <p className="text-sm text-slate-500">No files have been sent to you yet.</p>
                  <p className="text-xs text-slate-600">Your Team Lead will upload files directly to your account.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFiles.map(f => {
                    const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.RECEIVED;
                    const isResponding = respondingTo === f.id;
                    return (
                      <div key={f.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                        {/* File Row */}
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0 mt-0.5">{getFileIcon(f.mimeType, f.originalName)}</span>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-xs font-bold text-white truncate">{f.originalName}</p>
                            <p className="text-[11px] text-slate-500">
                              {formatFileSize(f.sizeBytes)} &bull; Sent by <span className="text-indigo-300">{f.uploadedByName}</span> &bull; {new Date(f.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Status Badge + Dropdown */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setStatusDropdown(statusDropdown === f.id ? null : f.id)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold ${statusCfg.color} transition-all hover:opacity-80`}
                            >
                              {statusCfg.label} <ChevronDown className="w-3 h-3" />
                            </button>
                            {statusDropdown === f.id && (
                              <div className="absolute right-0 top-full mt-1 z-20 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-xl w-48">
                                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                  <button
                                    key={key}
                                    onClick={() => handleUpdateStatus(f.id, key)}
                                    className={`w-full text-left px-3 py-2 text-[11px] font-semibold hover:bg-slate-800 ${f.status === key ? 'text-white bg-slate-800' : 'text-slate-400'}`}
                                  >
                                    {cfg.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                          <a
                            href={`http://localhost:5000/api/files/download/${f.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </a>
                          <button
                            onClick={() => {
                              setRespondingTo(isResponding ? null : f.id);
                              setResponseFiles([]);
                              setUploadErr('');
                            }}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            {isResponding ? 'Cancel Response' : 'Upload Response'}
                          </button>
                          {f.respondedAt && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Responded {new Date(f.respondedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Response Upload Panel */}
                        {isResponding && (
                          <div className="pt-2 space-y-3 border-t border-slate-800/60">
                            {uploadErr && (
                              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5" /> {uploadErr}
                              </div>
                            )}
                            <label
                              htmlFor={`respond-input-${f.id}`}
                              onDragOver={(e) => { e.preventDefault(); setResponseDragging(true); }}
                              onDragLeave={() => setResponseDragging(false)}
                              onDrop={(e) => { e.preventDefault(); setResponseDragging(false); const files = Array.from(e.dataTransfer.files); setResponseFiles(prev => [...prev, ...files]); }}
                              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all ${responseDragging ? 'border-purple-400 bg-purple-500/10' : 'border-slate-700 hover:border-purple-500/50 hover:bg-purple-500/5'}`}
                            >
                              <input
                                id={`respond-input-${f.id}`}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => { setResponseFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = ''; }}
                              />
                              <UploadCloud className="w-5 h-5 text-purple-400" />
                              <span className="text-[11px] text-slate-400 text-center">
                                <span className="text-purple-400 font-semibold">Click to browse</span> or drag & drop response files
                              </span>
                            </label>

                            {responseFiles.length > 0 && (
                              <div className="space-y-1.5">
                                {responseFiles.map((rf, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
                                    <span>{getFileIcon(rf.type, rf.name)}</span>
                                    <span className="flex-1 truncate text-white font-semibold">{rf.name}</span>
                                    <span className="text-slate-500">{formatFileSize(rf.size)}</span>
                                    <button onClick={() => setResponseFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-rose-400">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              onClick={() => handleRespond(f.id)}
                              disabled={uploading || responseFiles.length === 0}
                              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                              {uploading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><ArrowUpRight className="w-3.5 h-3.5" /> Send Response to Team Lead</>}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 3: MY TASKS ── */}
          {activeTab === 'my-tasks' && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                Tasks Assigned to Me
              </h3>
              {allMyTasks.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-slate-700" />
                  <p className="text-xs text-slate-500">No tasks assigned to you yet in any group.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allMyTasks.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            t.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                            t.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>{t.priority}</span>
                          <h4 className="text-xs font-bold text-white">{t.title}</h4>
                        </div>
                        {t.description && <p className="text-[11px] text-slate-300 leading-relaxed">{t.description}</p>}
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                          <span>Group: <span className="text-indigo-400 font-semibold">{t.groupName}</span></span>
                          {(t.dueDate || t.slaDeadline) && (
                            <span className="text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              🗓️ Deadline: {t.dueDate || t.slaDeadline}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                          t.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>{t.status?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB 4: MY PERFORMANCE REVIEWS ── */}
          {activeTab === 'my-reviews' && (
            <div className="space-y-4">
              {myAppraisals.some(a => a.status === 'COMPLETED') && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-300">Action Required</p>
                    <p className="text-xs text-slate-400">You have completed reviews awaiting your acknowledgement.</p>
                  </div>
                </div>
              )}

              {myAppraisals.length === 0 ? (
                <div className="glass-panel p-16 text-center rounded-3xl">
                  <Award className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">No performance reviews yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Your HR manager will create reviews here.</p>
                </div>
              ) : (
                myAppraisals.map(a => {
                  const STATUS_CFG = {
                    DRAFT:        { label: 'Draft',        color: 'bg-slate-700/60 text-slate-300 border-slate-600' },
                    IN_REVIEW:    { label: 'In Review',    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                    COMPLETED:    { label: 'Completed — Action Required', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                    ACKNOWLEDGED: { label: 'Acknowledged', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' }
                  };
                  const stCfg = STATUS_CFG[a.status] || STATUS_CFG.DRAFT;

                  return (
                    <div key={a.id} className={`glass-panel p-6 rounded-3xl space-y-4 border ${
                      a.status === 'COMPLETED' ? 'border-emerald-500/40' : 'border-slate-800'
                    }`}>
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-purple-300">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                              {a.type || 'MPR'} — {a.reviewPeriod}
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${stCfg.color}`}>
                                {stCfg.label}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400">Reviewed by <strong className="text-slate-300">{a.reviewerName}</strong></p>
                          </div>
                        </div>

                        {a.overallRating && (
                          <div className="flex items-center gap-2 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Your Rating</span>
                              <span className="text-lg font-black text-white font-mono">{a.overallRating} / 5.0</span>
                            </div>
                            <div className="flex text-amber-400">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.floor(a.overallRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* KPI Scores (if available) */}
                      {a.kpiScores && Object.values(a.kpiScores).some(v => v) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/60 text-xs">
                          {Object.entries(a.kpiScores).filter(([,v]) => v).map(([key, val]) => (
                            <div key={key} className="text-center">
                              <p className="text-slate-500 capitalize text-[10px]">{key}</p>
                              <p className="text-white font-black font-mono text-base">{val}<span className="text-slate-600 text-xs">/5</span></p>
                              <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(parseFloat(val)/5)*100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Salary Outcome */}
                      {(a.salaryAdjustmentPct > 0 || a.bonusAwarded > 0) && (
                        <div className="flex flex-wrap gap-3">
                          {a.salaryAdjustmentPct > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              <div>
                                <p className="text-[10px] text-slate-400">Salary Increment</p>
                                <p className="text-sm font-black text-emerald-400">+{a.salaryAdjustmentPct}%</p>
                              </div>
                            </div>
                          )}
                          {a.bonusAwarded > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <Gift className="w-4 h-4 text-amber-400" />
                              <div>
                                <p className="text-[10px] text-slate-400">Bonus Awarded</p>
                                <p className="text-sm font-black text-amber-400">${a.bonusAwarded?.toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {a.incrementEffectiveDate && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <div>
                                <p className="text-[10px] text-slate-400">Effective From</p>
                                <p className="text-sm font-black text-blue-300">{a.incrementEffectiveDate}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Feedback */}
                      {(a.strengths || a.areasForImprovement) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {a.strengths && (
                            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                              <p className="font-bold text-emerald-400 mb-1">✨ Your Strengths</p>
                              <p className="text-slate-300 leading-relaxed">{a.strengths}</p>
                            </div>
                          )}
                          {a.areasForImprovement && (
                            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                              <p className="font-bold text-amber-400 mb-1">📈 Development Focus</p>
                              <p className="text-slate-300 leading-relaxed">{a.areasForImprovement}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Acknowledge Button */}
                      {a.status === 'COMPLETED' && (
                        <div className="pt-3 border-t border-slate-800">
                          <button
                            onClick={() => handleAcknowledgeMPR(a.id)}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                          >
                            <CheckCheck className="w-4 h-4" />
                            I Acknowledge This Performance Review
                          </button>
                        </div>
                      )}

                      {a.status === 'ACKNOWLEDGED' && (
                        <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-xs text-blue-400">
                          <CheckCheck className="w-4 h-4" />
                          <span>You acknowledged this review on {a.acknowledgedAt ? new Date(a.acknowledgedAt).toLocaleDateString() : 'record'}</span>
                        </div>
                      )}

                      {a.status === 'DRAFT' && (
                        <div className="p-3 bg-slate-900/60 border border-slate-700/60 rounded-xl">
                          <p className="text-xs text-slate-500">{a.notes || 'This review is currently being prepared by HR. You will be notified when it is ready.'}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
