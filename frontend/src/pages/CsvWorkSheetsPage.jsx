import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileSpreadsheet,
  Upload,
  ChevronDown,
  ChevronUp,
  Plus,
  MessageSquare,
  Send,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  BarChart3,
  Users,
  CalendarClock,
  FileText,
  Download,
  UserCheck,
  UserPlus
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:     { label: 'Pending',     color: 'bg-slate-700/60 text-slate-300 border-slate-600',      icon: Clock,          dot: 'bg-slate-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: TrendingUp,     dot: 'bg-indigo-400' },
  DONE:        { label: 'Done',        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: CheckCircle2, dot: 'bg-emerald-400' },
  HOLD:        { label: 'On Hold',     color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',   icon: PauseCircle,    dot: 'bg-amber-400' },
  DENIED:      { label: 'Denied',      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',      icon: XCircle,        dot: 'bg-rose-400' }
};

const PROCESS_CATEGORIES = ['AR', 'BILLING', 'QA', 'CODING', 'VOB', 'GENERAL'];

export default function CsvWorkSheetsPage() {
  const { user } = useAuth();
  const isUploader = ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD'].includes(user?.role);

  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'sheet'

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', processCategory: 'BILLING', deadline: '', clientId: ''
  });
  const [csvText, setCsvText] = useState('');
  const [csvPreviewHeaders, setCsvPreviewHeaders] = useState([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Sheet viewer state
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [commentSubmitting, setCommentSubmitting] = useState({});
  const [rowUpdating, setRowUpdating] = useState({});

  // Clients and employees for selectors
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignedToUserIds, setAssignedToUserIds] = useState([]);

  const fetchSheets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/csv-sheets');
      setSheets(res.data || []);
    } catch (err) {
      console.error('Failed to fetch CSV sheets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSheet = useCallback(async (id) => {
    setSheetLoading(true);
    try {
      const res = await api.get(`/csv-sheets/${id}`);
      setSelectedSheet(res.data);
    } catch (err) {
      console.error('Failed to fetch sheet:', err);
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSheets();
    api.get('/clients').then(r => setClients(r.data || [])).catch(() => {});
    // Load all employees for the assign-to multi-select
    api.get('/hr/employees').then(r => {
      const all = r.data || [];
      setEmployees(all);
    }).catch(() => {});
  }, [fetchSheets]);

  useEffect(() => {
    if (selectedSheetId) {
      fetchSheet(selectedSheetId);
    }
  }, [selectedSheetId, fetchSheet]);

  // Auto-refresh sheet every 30 seconds when viewing
  useEffect(() => {
    if (view === 'sheet' && selectedSheetId) {
      const interval = setInterval(() => fetchSheet(selectedSheetId), 30000);
      return () => clearInterval(interval);
    }
  }, [view, selectedSheetId, fetchSheet]);

  const openSheet = (sheetId) => {
    setSelectedSheetId(sheetId);
    setView('sheet');
    setStatusFilter('ALL');
    setSearchQuery('');
    setExpandedRowId(null);
  };

  // --- CSV File Parsing ---
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let insideQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!uploadForm.title) {
      setUploadForm(f => ({ ...f, title: file.name.replace('.csv', '') }));
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setCsvText(text);
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length >= 1) {
        const headers = parseCSVLine(lines[0]);
        setCsvPreviewHeaders(headers);
        const preview = lines.slice(1, 6).map(line => parseCSVLine(line));
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!csvText) return alert('Please select a CSV file.');
    if (assignedToUserIds.length === 0) return alert('Please assign this work sheet to at least one employee.');
    setUploading(true);
    try {
      await api.post('/csv-sheets', { ...uploadForm, csvText, assignedToUserIds });
      setShowUploadModal(false);
      setCsvText('');
      setCsvPreviewHeaders([]);
      setCsvPreviewRows([]);
      setUploadForm({ title: '', description: '', processCategory: 'BILLING', deadline: '', clientId: '' });
      setAssignedToUserIds([]);
      fetchSheets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload CSV sheet.');
    } finally {
      setUploading(false);
    }
  };

  const toggleAssignEmployee = (empId) => {
    setAssignedToUserIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const selectAllEmployees = () => setAssignedToUserIds(employees.map(e => e.id));
  const clearAllEmployees = () => setAssignedToUserIds([]);

  // --- Row Updates ---
  const handleStatusChange = async (rowId, newStatus) => {
    if (!selectedSheet) return;
    setRowUpdating(prev => ({ ...prev, [rowId]: true }));
    try {
      await api.patch(`/csv-sheets/${selectedSheet.id}/rows/${rowId}`, { workStatus: newStatus });
      await fetchSheet(selectedSheet.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update row status.');
    } finally {
      setRowUpdating(prev => ({ ...prev, [rowId]: false }));
    }
  };

  const handleNotesChange = async (rowId, notes) => {
    if (!selectedSheet) return;
    try {
      await api.patch(`/csv-sheets/${selectedSheet.id}/rows/${rowId}`, { workNotes: notes });
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  const handleAddComment = async (rowId) => {
    const text = commentInputs[rowId];
    if (!text || !text.trim() || !selectedSheet) return;
    setCommentSubmitting(prev => ({ ...prev, [rowId]: true }));
    try {
      await api.post(`/csv-sheets/${selectedSheet.id}/rows/${rowId}/comments`, { text });
      setCommentInputs(prev => ({ ...prev, [rowId]: '' }));
      await fetchSheet(selectedSheet.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setCommentSubmitting(prev => ({ ...prev, [rowId]: false }));
    }
  };

  const handleDeleteSheet = async (sheetId) => {
    if (!window.confirm('Are you sure you want to permanently delete this work sheet?')) return;
    try {
      await api.delete(`/csv-sheets/${sheetId}`);
      if (selectedSheetId === sheetId) {
        setView('list');
        setSelectedSheetId(null);
        setSelectedSheet(null);
      }
      fetchSheets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete sheet.');
    }
  };

  // --- Download Sheet as CSV with employee work data appended ---
  const downloadSheetAsCSV = () => {
    if (!selectedSheet) return;

    const escapeCell = (val) => {
      const str = String(val ?? '');
      // Wrap in quotes if contains comma, newline or double-quote
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build header row: original columns + work tracking columns
    const extraHeaders = [
      'Work Status',
      'Work Notes',
      'Last Updated By',
      'Last Updated At',
      'Total Comments',
      'Comments Thread'
    ];
    const allHeaders = [...selectedSheet.headers, ...extraHeaders];
    const headerRow = allHeaders.map(escapeCell).join(',');

    // Build each data row
    const dataRows = selectedSheet.rows.map(row => {
      const originalCells = selectedSheet.headers.map(h => escapeCell(row.data[h] ?? ''));

      // Format comments as a readable block: "[AuthorName (Role) @ timestamp]: text"
      const commentsThread = row.comments.length > 0
        ? row.comments.map(c =>
            `[${c.authorName} (${c.authorRole}) @ ${new Date(c.createdAt).toLocaleString()}]: ${c.text}`
          ).join(' | ')
        : '';

      const extraCells = [
        escapeCell(STATUS_CONFIG[row.workStatus]?.label || row.workStatus),
        escapeCell(row.workNotes || ''),
        escapeCell(row.lastUpdatedBy || ''),
        escapeCell(row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toLocaleString() : ''),
        escapeCell(row.comments.length),
        escapeCell(commentsThread)
      ];

      return [...originalCells, ...extraCells].join(',');
    });

    // Build summary footer rows
    const blankRow = allHeaders.map(() => '').join(',');
    const summaryRows = [
      blankRow,
      `"=== WORK SHEET SUMMARY ===",${"".padStart(allHeaders.length - 1, ',')}`,
      `"Sheet Title:",${escapeCell(selectedSheet.title)}`,
      `"Process Category:",${escapeCell(selectedSheet.processCategory)}`,
      `"Deadline:",${escapeCell(selectedSheet.deadline || 'Not set')}`,
      `"Created By:",${escapeCell(selectedSheet.createdBy)}`,
      `"Downloaded On:",${escapeCell(new Date().toLocaleString())}`,
      `"Total Rows:",${escapeCell(selectedSheet.rows.length)}`,
      `"Completed (Done):",${escapeCell(selectedSheet.rows.filter(r => r.workStatus === 'DONE').length)}`,
      `"In Progress:",${escapeCell(selectedSheet.rows.filter(r => r.workStatus === 'IN_PROGRESS').length)}`,
      `"On Hold:",${escapeCell(selectedSheet.rows.filter(r => r.workStatus === 'HOLD').length)}`,
      `"Denied:",${escapeCell(selectedSheet.rows.filter(r => r.workStatus === 'DENIED').length)}`,
      `"Completion %:",${escapeCell((selectedSheet.completionPct || 0) + '%')}`
    ];

    const csvContent = [headerRow, ...dataRows, ...summaryRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (selectedSheet.title || 'work-sheet').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.download = `${safeName}_with_employee_work_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- Filtered Rows for Sheet Viewer ---
  const filteredRows = (selectedSheet?.rows || []).filter(row => {
    if (statusFilter !== 'ALL' && row.workStatus !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return Object.values(row.data).some(v => String(v).toLowerCase().includes(q));
    }
    return true;
  });

  const getStatusCounts = (rows) => {
    return Object.keys(STATUS_CONFIG).reduce((acc, s) => {
      acc[s] = rows.filter(r => r.workStatus === s).length;
      return acc;
    }, {});
  };

  // =====================================================================
  // RENDER: LIST VIEW
  // =====================================================================
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-cyan-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                CSV Work Sheets
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  Live Collaborative Tracker
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Upload billing, AR, QA, or coding CSV files — employees update status and comments per row in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSheets}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isUploader && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload CSV Work Sheet
              </button>
            )}
          </div>
        </div>

        {/* Sheets Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs">Loading work sheets...</div>
        ) : sheets.length === 0 ? (
          <div className="glass-panel p-14 rounded-3xl text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">No CSV Work Sheets Yet</h3>
            <p className="text-xs text-slate-400">
              Team Leads can upload billing, AR, QA, or coding CSV files to create collaborative work sheets that employees can track row by row.
            </p>
            {isUploader && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload First Work Sheet
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sheets.map(sheet => {
              const pct = sheet.completionPct || 0;
              const catColors = {
                BILLING: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                AR:      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                QA:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
                CODING:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
                VOB:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
                GENERAL: 'bg-slate-600/40 text-slate-300 border-slate-600/40'
              };
              const catColor = catColors[sheet.processCategory] || catColors.GENERAL;
              const isOverdue = sheet.deadline && new Date(sheet.deadline) < new Date() && pct < 100;

              return (
                <div key={sheet.id} className="glass-panel p-5 rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColor}`}>
                          {sheet.processCategory}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-500/20 text-rose-300 border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{sheet.title}</h3>
                      {sheet.description && (
                        <p className="text-xs text-slate-400 truncate">{sheet.description}</p>
                      )}
                    </div>
                    {isUploader && (
                      <button
                        onClick={() => handleDeleteSheet(sheet.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                        title="Delete sheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-emerald-400 font-mono">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Row Counts */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <p className="font-bold font-mono text-slate-200">{sheet.totalRows}</p>
                      <p className="text-slate-500">Total</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="font-bold font-mono text-emerald-400">{sheet.completedRows}</p>
                      <p className="text-emerald-500">Done</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <p className="font-bold font-mono text-indigo-400">{sheet.inProgressRows || 0}</p>
                      <p className="text-indigo-500">WIP</p>
                    </div>
                    <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="font-bold font-mono text-amber-400">{sheet.holdRows || 0}</p>
                      <p className="text-amber-500">Hold</p>
                    </div>
                  </div>

                  {/* Assigned employees chips */}
                  {sheet.assignedUsers && sheet.assignedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider w-full">Assigned to:</span>
                      {sheet.assignedUsers.slice(0, 3).map(u => (
                        <span key={u.id} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25 font-semibold">
                          {u.name}
                        </span>
                      ))}
                      {sheet.assignedUsers.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          +{sheet.assignedUsers.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>By: <span className="text-slate-300 font-semibold">{sheet.createdBy}</span></span>
                    </div>
                    {sheet.deadline && (
                      <div className="flex items-center space-x-1 font-mono">
                        <CalendarClock className="w-3.5 h-3.5" />
                        <span className={isOverdue ? 'text-rose-400' : ''}>{sheet.deadline}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => openSheet(sheet.id)}
                    className="w-full px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4" /> Open Work Sheet
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 max-w-2xl w-full space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" /> Upload CSV Work Sheet
                </h3>
                <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drop zone */}
                <div
                  className="border-2 border-dashed border-indigo-500/40 rounded-2xl p-6 text-center space-y-2 cursor-pointer hover:border-indigo-400/70 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-indigo-400" />
                  <p className="text-sm font-bold text-white">Click to select CSV file</p>
                  <p className="text-xs text-slate-400">Supports any CSV — billing, AR, QA, coding work lists</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {csvText && (
                    <p className="text-xs text-emerald-400 font-semibold">
                      ✓ CSV loaded — {csvPreviewRows.length + 1}+ rows detected
                    </p>
                  )}
                </div>

                {/* CSV Preview */}
                {csvPreviewHeaders.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-[10px] text-slate-300 min-w-max">
                      <thead className="bg-slate-900 text-slate-400 font-bold">
                        <tr>
                          {csvPreviewHeaders.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left border-b border-slate-800 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreviewRows.map((row, ri) => (
                          <tr key={ri} className="border-b border-slate-800/60">
                            {csvPreviewHeaders.map((h, ci) => (
                              <td key={ci} className="px-3 py-1.5 whitespace-nowrap max-w-[120px] truncate font-mono text-slate-300">
                                {row[ci] || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-[10px] text-slate-500 p-2 text-center">Preview (first 5 rows)</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Work Sheet Title *</label>
                    <input
                      type="text"
                      required
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Apex Billing Batch - Aug 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Process Category</label>
                    <select
                      value={uploadForm.processCategory}
                      onChange={(e) => setUploadForm(f => ({ ...f, processCategory: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    >
                      {PROCESS_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Deadline Date</label>
                    <input
                      type="date"
                      value={uploadForm.deadline}
                      onChange={(e) => setUploadForm(f => ({ ...f, deadline: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Linked Client (optional)</label>
                    <select
                      value={uploadForm.clientId}
                      onChange={(e) => setUploadForm(f => ({ ...f, clientId: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    >
                      <option value="">— No client —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Description / Instructions for Team</label>
                  <textarea
                    rows="2"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Special instructions for the team on how to process this batch..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 resize-none"
                  ></textarea>
                </div>

                {/* Assign to Employees */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                      Assign to Employees *
                      <span className="text-[10px] text-rose-400">(required — inbox notifications go only to assigned employees)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={selectAllEmployees} className="text-[10px] text-indigo-400 hover:underline font-semibold">All</button>
                      <span className="text-slate-700">|</span>
                      <button type="button" onClick={clearAllEmployees} className="text-[10px] text-slate-400 hover:underline font-semibold">None</button>
                    </div>
                  </div>

                  {assignedToUserIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      {assignedToUserIds.map(id => {
                        const emp = employees.find(e => e.id === id);
                        return emp ? (
                          <span key={id} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold">
                            {emp.firstName} {emp.lastName}
                            <button type="button" onClick={() => toggleAssignEmployee(id)} className="text-indigo-400 hover:text-white ml-0.5">×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  <div className="max-h-44 overflow-y-auto space-y-1 bg-slate-900/60 rounded-xl border border-slate-700 p-2">
                    {employees.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-4">No employees found. Add employees via HR Management first.</p>
                    ) : (
                      employees.map(emp => {
                        const isChecked = assignedToUserIds.includes(emp.id);
                        return (
                          <label key={emp.id} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                            isChecked ? 'bg-indigo-500/15 border border-indigo-500/30' : 'hover:bg-slate-800/60 border border-transparent'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAssignEmployee(emp.id)}
                              className="w-3.5 h-3.5 accent-indigo-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-semibold text-white block">{emp.firstName} {emp.lastName}</span>
                              <span className="text-[10px] text-slate-400">{emp.role} {emp.department ? `· ${emp.department}` : ''}</span>
                            </div>
                            {isChecked && <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !csvText}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30"
                  >
                    {uploading ? 'Uploading...' : 'Create Work Sheet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // RENDER: SHEET VIEWER
  // =====================================================================
  if (view === 'sheet') {
    const statusCounts = getStatusCounts(selectedSheet?.rows || []);

    return (
      <div className="space-y-5">
        {/* Top Bar */}
        <div className="glass-panel p-5 rounded-3xl border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => { setView('list'); fetchSheets(); }}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {sheetLoading ? 'Loading...' : selectedSheet?.title}
                  {selectedSheet?.processCategory && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedSheet.processCategory}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedSheet?.description || 'Live collaborative work sheet — update each row status as you process records.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSheet(selectedSheetId)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
                title="Refresh sheet data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {isUploader && selectedSheet && (
                <button
                  onClick={downloadSheetAsCSV}
                  className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Download sheet as CSV with employee status, notes & comments"
                >
                  <Download className="w-4 h-4" /> Download CSV
                </button>
              )}
              {isUploader && (
                <button
                  onClick={() => handleDeleteSheet(selectedSheetId)}
                  className="p-2 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded-xl border border-rose-500/30 transition-all"
                  title="Delete this sheet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* KPI Stats Row */}
          {selectedSheet && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                const count = statusCounts[status] || 0;
                const pct = selectedSheet.rows?.length > 0 ? Math.round((count / selectedSheet.rows.length) * 100) : 0;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(statusFilter === status ? 'ALL' : status)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      statusFilter === status
                        ? cfg.color + ' ring-2 ring-offset-1 ring-offset-slate-900 ring-indigo-500/60'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-lg font-bold font-mono text-white">{count}</p>
                    <p className="text-[11px] font-semibold text-slate-400">{cfg.label}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{pct}%</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Overall Progress Bar */}
          {selectedSheet && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                  Overall Sheet Completion
                </span>
                <span className="text-emerald-400 font-mono">{selectedSheet.completionPct || 0}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${selectedSheet.completionPct || 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs flex-1 min-w-48">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search any column value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white flex-1 focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL" className="bg-slate-900">All Statuses ({selectedSheet?.rows?.length || 0})</option>
              {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                <option key={s} value={s} className="bg-slate-900">{cfg.label} ({statusCounts[s] || 0})</option>
              ))}
            </select>
          </div>
          <span className="flex items-center text-xs text-slate-500 px-2">
            Showing {filteredRows.length} of {selectedSheet?.rows?.length || 0} rows
          </span>
        </div>

        {/* Data Table */}
        {sheetLoading ? (
          <div className="text-center py-20 text-slate-500 text-xs">Loading work sheet rows...</div>
        ) : !selectedSheet ? (
          <div className="text-center py-20 text-slate-500 text-xs">Sheet not found.</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">No rows match the current filter.</div>
        ) : (
          <div className="space-y-2">
            {/* Column Headers */}
            <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-800 hidden md:grid gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
              style={{ gridTemplateColumns: `40px repeat(${Math.min(selectedSheet.headers.length, 5)}, 1fr) 130px 36px` }}
            >
              <span>#</span>
              {selectedSheet.headers.slice(0, 5).map((h, i) => <span key={i} className="truncate">{h}</span>)}
              <span>Status</span>
              <span></span>
            </div>

            {filteredRows.map((row, idx) => {
              const isExpanded = expandedRowId === row.id;
              const cfg = STATUS_CONFIG[row.workStatus] || STATUS_CONFIG.PENDING;
              const StatusIcon = cfg.icon;

              return (
                <div key={row.id} className={`glass-panel rounded-2xl border overflow-hidden transition-all ${
                  isExpanded ? 'border-indigo-500/40' : 'border-slate-800 hover:border-slate-700'
                }`}>
                  {/* Row Summary (collapsed) */}
                  <div
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedRowId(isExpanded ? null : row.id)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Row number */}
                      <span className="text-[11px] font-mono text-slate-500 w-8 shrink-0">{row.rowIndex}</span>

                      {/* Data columns - first 5 */}
                      <div className="grid flex-1 gap-3 min-w-0" style={{ gridTemplateColumns: `repeat(${Math.min(selectedSheet.headers.length, 5)}, 1fr)` }}>
                        {selectedSheet.headers.slice(0, 5).map((h, i) => (
                          <div key={i} className="min-w-0">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">{h}</p>
                            <p className="text-xs text-slate-200 font-semibold truncate">{row.data[h] || '—'}</p>
                          </div>
                        ))}
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>

                        {row.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                            <MessageSquare className="w-3 h-3" />
                            {row.comments.length}
                          </span>
                        )}

                        <span className="text-slate-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row Details */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 space-y-4">
                      {/* All Columns Data */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Full Row Data
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {selectedSheet.headers.map((h, i) => (
                            <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider truncate">{h}</p>
                              <p className="text-xs text-white font-semibold mt-0.5 break-words">{row.data[h] || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Status Update */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Update Row Status</label>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([status, scfg]) => {
                              const SIcon = scfg.icon;
                              return (
                                <button
                                  key={status}
                                  disabled={rowUpdating[row.id]}
                                  onClick={() => handleStatusChange(row.id, status)}
                                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
                                    row.workStatus === status
                                      ? scfg.color + ' ring-1 ring-offset-1 ring-offset-slate-900 ring-white/20'
                                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                                  } ${rowUpdating[row.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <SIcon className="w-3 h-3" />
                                  {scfg.label}
                                </button>
                              );
                            })}
                          </div>
                          {row.lastUpdatedBy && (
                            <p className="text-[10px] text-slate-500 mt-1.5">
                              Last updated by <span className="text-slate-300 font-semibold">{row.lastUpdatedBy}</span> &bull; {new Date(row.lastUpdatedAt).toLocaleString()}
                            </p>
                          )}
                        </div>

                        {/* Work Notes */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Work Notes</label>
                          <textarea
                            rows="3"
                            defaultValue={row.workNotes}
                            onBlur={(e) => handleNotesChange(row.id, e.target.value)}
                            placeholder="Add processing notes, denial reason, or action taken..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-indigo-500/60"
                          ></textarea>
                          <p className="text-[10px] text-slate-500 mt-1">Notes auto-save on blur</p>
                        </div>
                      </div>

                      {/* Comments Thread */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Comments ({row.comments.length})
                        </h4>

                        {row.comments.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {row.comments.map(cmt => (
                              <div key={cmt.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-indigo-300">{cmt.authorName}</span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {new Date(cmt.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-200">{cmt.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Comment */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={commentInputs[row.id] || ''}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [row.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && !commentSubmitting[row.id] && handleAddComment(row.id)}
                            placeholder="Add a comment on this record... (Enter to send)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60"
                          />
                          <button
                            disabled={commentSubmitting[row.id] || !commentInputs[row.id]?.trim()}
                            onClick={() => handleAddComment(row.id)}
                            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
}
