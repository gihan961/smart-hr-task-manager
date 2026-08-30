import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, StickyNote, Building2, User, Plus, Trash2, Edit3, Save, X,
  Clock, Star, Flag, Calendar, Tag, AlertTriangle, ChevronDown, ChevronUp,
  Building, Phone, Mail, Globe, MapPin, Users, Briefcase, Award,
  CheckCircle, Circle, CircleDot, ArrowRight, Sparkles, Pin, PinOff,
  Target, TrendingUp, BadgeDollarSign, ShieldCheck, Gift, CalendarDays,
  Hash, Activity, RefreshCw, Search
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const TASK_PRIORITIES = {
  LOW:    { label: 'Low',    color: 'text-slate-400 border-slate-600 bg-slate-800/60' },
  MEDIUM: { label: 'Medium', color: 'text-blue-300 border-blue-500/30 bg-blue-500/10' },
  HIGH:   { label: 'High',   color: 'text-amber-300 border-amber-500/30 bg-amber-500/10' },
  URGENT: { label: 'Urgent', color: 'text-rose-300 border-rose-500/30 bg-rose-500/10' }
};

const TASK_STATUSES = {
  TODO:        { label: 'To Do',       icon: Circle,    color: 'text-slate-400' },
  IN_PROGRESS: { label: 'In Progress', icon: CircleDot, color: 'text-amber-400' },
  DONE:        { label: 'Done',        icon: CheckCircle, color: 'text-emerald-400' }
};

const NOTE_COLORS = {
  yellow: { bg: 'bg-amber-950/60',  border: 'border-amber-500/40', title: 'text-amber-200',  body: 'text-amber-100/80',  dot: 'bg-amber-400' },
  blue:   { bg: 'bg-blue-950/60',   border: 'border-blue-500/40',  title: 'text-blue-200',   body: 'text-blue-100/80',   dot: 'bg-blue-400' },
  green:  { bg: 'bg-emerald-950/60',border: 'border-emerald-500/40',title: 'text-emerald-200',body: 'text-emerald-100/80',dot: 'bg-emerald-400' },
  pink:   { bg: 'bg-pink-950/60',   border: 'border-pink-500/40',  title: 'text-pink-200',   body: 'text-pink-100/80',   dot: 'bg-pink-400' },
  purple: { bg: 'bg-purple-950/60', border: 'border-purple-500/40',title: 'text-purple-200', body: 'text-purple-100/80', dot: 'bg-purple-400' }
};

const HOLIDAY_TYPE_COLORS = {
  PUBLIC:  { color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', label: 'Public Holiday' },
  COMPANY: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', label: 'Company Day Off' }
};

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAL TASK MANAGER TAB
// ─────────────────────────────────────────────────────────────────────────────
function PersonalTasksTab({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [searchQ, setSearchQ] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', priority: 'MEDIUM', dueDate: '', tags: ''
  });

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/personal/tasks');
      setTasks(res.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      await api.post('/personal/tasks', {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      });
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', tags: '' });
      setShowAdd(false);
      fetch();
    } catch (_) { alert('Failed to create task.'); }
  };

  const handleStatusToggle = async (task) => {
    const next = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
    try {
      await api.patch(`/personal/tasks/${task.id}`, { status: next });
      fetch();
    } catch (_) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/personal/tasks/${id}`);
      fetch();
    } catch (_) {}
  };

  const handleUpdate = async (id, data) => {
    try {
      await api.patch(`/personal/tasks/${id}`, data);
      setEditingId(null);
      fetch();
    } catch (_) {}
  };

  const filtered = tasks
    .filter(t => filter === 'ALL' || t.status === filter)
    .filter(t => t.title.toLowerCase().includes(searchQ.toLowerCase()));

  const counts = {
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter(t => t.status === 'DONE').length,
  };

  if (loading) return <div className="py-12 text-center text-xs text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />Loading tasks…</div>;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search tasks…"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700 rounded-xl p-1">
          {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${filter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              {s === 'ALL' ? `All (${tasks.length})` : s === 'TODO' ? `To Do (${counts.TODO})` : s === 'IN_PROGRESS' ? `Active (${counts.IN_PROGRESS})` : `Done (${counts.DONE})`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Add task form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-indigo-500/30 space-y-3 bg-indigo-950/20">
          <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> New Personal Task</h4>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title (required)"
            required
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)…"
            rows={2}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none">
                {Object.keys(TASK_PRIORITIES).map(p => <option key={p} value={p}>{TASK_PRIORITIES[p].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">Tags (comma-sep)</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="rcm, billing, urgent" className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">Add Task</button>
          </div>
        </form>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl">
          <CheckSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No tasks {filter !== 'ALL' ? `with status "${filter}"` : ''}. Click "New Task" to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const pCfg = TASK_PRIORITIES[task.priority] || TASK_PRIORITIES.MEDIUM;
            const sCfg = TASK_STATUSES[task.status] || TASK_STATUSES.TODO;
            const StatusIcon = sCfg.icon;
            const isEditing = editingId === task.id;
            const isOverdue = task.dueDate && task.status !== 'DONE' && new Date(task.dueDate) < new Date();

            return (
              <div key={task.id} className={`glass-panel p-4 rounded-2xl border transition-all ${
                task.status === 'DONE' ? 'border-emerald-500/20 opacity-70' : isOverdue ? 'border-rose-500/30' : 'border-slate-800'
              }`}>
                {isEditing ? (
                  <EditTaskInline task={task} onSave={data => handleUpdate(task.id, data)} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleStatusToggle(task)} className={`mt-0.5 shrink-0 ${sCfg.color} hover:scale-110 transition-transform`}>
                      <StatusIcon className={`w-5 h-5 ${task.status === 'DONE' ? 'fill-emerald-400' : ''}`} />
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-sm font-semibold ${task.status === 'DONE' ? 'line-through text-slate-500' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pCfg.color}`}>
                          {pCfg.label}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                          </span>
                        )}
                      </div>
                      {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {task.dueDate}
                          </span>
                        )}
                        {task.tags?.length > 0 && task.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-800 rounded-md flex items-center gap-0.5">
                            <Hash className="w-2.5 h-2.5" /> {tag}
                          </span>
                        ))}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.status === 'DONE' ? `Completed ${task.completedAt?.split('T')[0] || ''}` : `Created ${task.createdAt?.split('T')[0] || ''}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingId(task.id)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

function EditTaskInline({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task.title, description: task.description || '',
    priority: task.priority, status: task.status, dueDate: task.dueDate || '',
    tags: (task.tags || []).join(', ')
  });
  return (
    <div className="space-y-2">
      <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500" />
      <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} rows={2} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none" />
      <div className="grid grid-cols-3 gap-2">
        <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none">
          {Object.keys(TASK_PRIORITIES).map(p => <option key={p} value={p}>{TASK_PRIORITIES[p].label}</option>)}
        </select>
        <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none">
          {Object.keys(TASK_STATUSES).map(s => <option key={s} value={s}>{TASK_STATUSES[s].label}</option>)}
        </select>
        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none" />
      </div>
      <input value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="Tags (comma-sep)" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 bg-slate-800 text-slate-400 text-xs rounded-xl">Cancel</button>
        <button onClick={() => onSave({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] })} className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
          <Save className="w-3 h-3" /> Save
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTEPAD TAB
// ─────────────────────────────────────────────────────────────────────────────
function NotepadTab() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', color: 'yellow' });

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/personal/notes');
      setNotes(res.data || []);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/personal/notes', form);
      setForm({ title: '', body: '', color: 'yellow' });
      setShowAdd(false);
      fetch();
    } catch (_) { alert('Failed to create note.'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/personal/notes/${id}`); fetch(); } catch (_) {}
  };

  const handlePin = async (note) => {
    try { await api.patch(`/personal/notes/${note.id}`, { pinned: !note.pinned }); fetch(); } catch (_) {}
  };

  const handleUpdate = async (id, data) => {
    try { await api.patch(`/personal/notes/${id}`, data); setEditingId(null); fetch(); } catch (_) {}
  };

  const pinned   = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);

  if (loading) return <div className="py-12 text-center text-xs text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />Loading notes…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-400" /> My Notepad
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{notes.length} private notes — only visible to you</p>
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Add note form */}
      {showAdd && (
        <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl border border-amber-500/30 space-y-3 bg-amber-950/10">
          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2"><StickyNote className="w-3.5 h-3.5" /> New Note</h4>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Note title…"
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
          <textarea
            value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Write your note here…"
            rows={4}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
          />
          {/* Color picker */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-medium">Color:</span>
            {Object.entries(NOTE_COLORS).map(([color, cfg]) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm(f => ({ ...f, color }))}
                className={`w-6 h-6 rounded-full ${cfg.dot} ring-2 ring-offset-2 ring-offset-slate-900 transition-all ${form.color === color ? 'ring-white scale-110' : 'ring-transparent hover:scale-105'}`}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl">Save Note</button>
          </div>
        </form>
      )}

      {notes.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-3xl">
          <StickyNote className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No notes yet. Create your first private note!</p>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">📌 Pinned</p>
              <NoteGrid notes={pinned} editingId={editingId} setEditingId={setEditingId} onDelete={handleDelete} onPin={handlePin} onUpdate={handleUpdate} />
            </div>
          )}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Other Notes</p>}
              <NoteGrid notes={unpinned} editingId={editingId} setEditingId={setEditingId} onDelete={handleDelete} onPin={handlePin} onUpdate={handleUpdate} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteGrid({ notes, editingId, setEditingId, onDelete, onPin, onUpdate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {notes.map(note => {
        const cfg = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;
        const isEditing = editingId === note.id;
        return (
          <div key={note.id} className={`relative rounded-2xl p-4 border ${cfg.bg} ${cfg.border} space-y-2 min-h-32`}>
            {/* Actions */}
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <button onClick={() => onPin(note)} title={note.pinned ? 'Unpin' : 'Pin'} className="p-1 text-slate-600 hover:text-white rounded-lg transition-colors">
                {note.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </button>
              {!isEditing && (
                <button onClick={() => setEditingId(note.id)} className="p-1 text-slate-600 hover:text-white rounded-lg transition-colors">
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => onDelete(note.id)} className="p-1 text-slate-600 hover:text-rose-400 rounded-lg transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {isEditing ? (
              <EditNoteInline note={note} cfg={cfg} onSave={data => onUpdate(note.id, data)} onCancel={() => setEditingId(null)} />
            ) : (
              <>
                <h4 className={`text-xs font-bold pr-16 ${cfg.title}`}>{note.title}</h4>
                <p className={`text-xs leading-relaxed whitespace-pre-wrap ${cfg.body}`}>{note.body || <span className="italic opacity-50">Empty note</span>}</p>
                <p className={`text-[10px] opacity-50 ${cfg.title}`}>
                  {new Date(note.updatedAt).toLocaleDateString()} {new Date(note.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EditNoteInline({ note, cfg, onSave, onCancel }) {
  const [form, setForm] = useState({ title: note.title, body: note.body, color: note.color });
  return (
    <div className="space-y-2">
      <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className={`w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold ${cfg.title} focus:outline-none`} />
      <textarea value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} rows={4} className={`w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs ${cfg.body} focus:outline-none resize-none`} />
      <div className="flex items-center gap-2">
        {Object.entries(NOTE_COLORS).map(([color, c]) => (
          <button key={color} type="button" onClick={() => setForm(f => ({...f, color}))} className={`w-5 h-5 rounded-full ${c.dot} ring-1 ring-offset-1 ring-offset-slate-900 ${form.color === color ? 'ring-white' : 'ring-transparent'}`} />
        ))}
      </div>
      <div className="flex justify-end gap-1">
        <button onClick={onCancel} className="px-2 py-1 bg-black/20 text-white/70 text-[10px] rounded-lg">Cancel</button>
        <button onClick={() => onSave(form)} className="px-3 py-1 bg-black/30 text-white text-[10px] font-bold rounded-lg">Save</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY HUB TAB
// ─────────────────────────────────────────────────────────────────────────────
function CompanyHubTab({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'PUBLIC' });

  // Org Editing state
  const [isEditingOrg, setIsEditingOrg] = useState(false);
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '', code: '', industry: '', foundedYear: '', ceo: '',
    website: '', address: '', phone: '', email: ''
  });

  const canManageCompany = ['SYSTEM_ADMIN', 'HR_MANAGER'].includes(user?.role);
  const canManageHolidays = canManageCompany;

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/personal/company');
      setData(res.data);
      if (res.data?.organization) {
        const o = res.data.organization;
        setOrgForm({
          name: o.name || '',
          code: o.code || '',
          industry: o.industry || '',
          foundedYear: o.foundedYear || '',
          ceo: o.ceo || '',
          website: o.website || '',
          address: o.address || '',
          phone: o.phone || '',
          email: o.email || ''
        });
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await api.post('/personal/company/holidays', holidayForm);
      setHolidayForm({ name: '', date: '', type: 'PUBLIC' });
      setShowAddHoliday(false);
      fetch();
    } catch (_) { alert('Failed to add holiday.'); }
  };

  const handleDeleteHoliday = async (id) => {
    try { await api.delete(`/personal/company/holidays/${id}`); fetch(); } catch (_) {}
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      await api.patch('/personal/company', orgForm);
      setIsEditingOrg(false);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update company details.');
    } finally {
      setSavingOrg(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-xs text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />Loading company info…</div>;
  if (!data) return null;

  const { organization: org, departments, holidays, upcomingHolidays, stats } = data;

  const today = new Date();
  const nextHoliday = upcomingHolidays?.[0];
  const daysToNext = nextHoliday ? Math.ceil((new Date(nextHoliday.date) - today) / (1000*60*60*24)) : null;

  return (
    <div className="space-y-6">
      {/* Upcoming holiday banner */}
      {nextHoliday && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 to-purple-950/40 flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl shrink-0">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Next Company Holiday</p>
            <h3 className="text-base font-black text-white">{nextHoliday.name}</h3>
            <p className="text-xs text-slate-400">{nextHoliday.date} · {daysToNext === 0 ? '🎉 Today!' : daysToNext === 1 ? 'Tomorrow!' : `${daysToNext} days away`}</p>
          </div>
          <div className="ml-auto text-right">
            <span className={`text-xs px-3 py-1.5 rounded-full border font-bold ${HOLIDAY_TYPE_COLORS[nextHoliday.type]?.color || ''}`}>
              {HOLIDAY_TYPE_COLORS[nextHoliday.type]?.label || nextHoliday.type}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Company info card */}
        <div className="lg:col-span-2 space-y-5">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 relative">
            {canManageCompany && !isEditingOrg && (
              <button
                onClick={() => setIsEditingOrg(true)}
                className="absolute top-5 right-5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Company Info
              </button>
            )}

            {isEditingOrg ? (
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Edit Organization Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingOrg(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">Company Name *</label>
                    <input
                      required
                      value={orgForm.name}
                      onChange={e => setOrgForm({ ...orgForm, name: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">Organization Code</label>
                    <input
                      value={orgForm.code}
                      onChange={e => setOrgForm({ ...orgForm, code: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">Industry</label>
                    <input
                      value={orgForm.industry}
                      onChange={e => setOrgForm({ ...orgForm, industry: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">CEO / Managing Director</label>
                    <input
                      value={orgForm.ceo}
                      onChange={e => setOrgForm({ ...orgForm, ceo: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">Founded Year</label>
                    <input
                      type="number"
                      value={orgForm.foundedYear}
                      onChange={e => setOrgForm({ ...orgForm, foundedYear: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">Phone</label>
                    <input
                      value={orgForm.phone}
                      onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-medium">HR / Contact Email</label>
                    <input
                      type="email"
                      value={orgForm.email}
                      onChange={e => setOrgForm({ ...orgForm, email: e.target.value })}
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">Website URL</label>
                  <input
                    value={orgForm.website}
                    onChange={e => setOrgForm({ ...orgForm, website: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">HQ Address</label>
                  <textarea
                    rows={2}
                    value={orgForm.address}
                    onChange={e => setOrgForm({ ...orgForm, address: e.target.value })}
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingOrg(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOrg}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingOrg ? 'Saving…' : 'Save Details'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl">
                    {org?.code?.substring(0, 2) || 'HR'}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{org?.name}</h2>
                    <p className="text-xs text-indigo-300 font-semibold">{org?.industry}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Est. {org?.foundedYear} · Code: {org?.code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { icon: Users,    label: 'Total Employees', value: `${stats?.totalEmployees || 0} staff` },
                    { icon: Target,   label: 'Active Projects',  value: `${stats?.activeProjects || 0} running` },
                    { icon: Activity, label: 'Open Tasks',       value: `${stats?.openTasks || 0} tasks` },
                    { icon: Building, label: 'CEO / Director',   value: org?.ceo || '–' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                      <item.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <p className="text-slate-500 text-[10px]">{item.label}</p>
                        <p className="text-white font-bold">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
                  {org?.address  && <div className="flex items-center gap-2 text-slate-400"><MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />{org.address}</div>}
                  {org?.phone    && <div className="flex items-center gap-2 text-slate-400"><Phone className="w-3.5 h-3.5 text-slate-600 shrink-0" />{org.phone}</div>}
                  {org?.email    && <div className="flex items-center gap-2 text-slate-400"><Mail className="w-3.5 h-3.5 text-slate-600 shrink-0" />{org.email}</div>}
                  {org?.website  && <div className="flex items-center gap-2 text-indigo-400"><Globe className="w-3.5 h-3.5 shrink-0" /><a href={org.website} target="_blank" rel="noopener" className="hover:underline">{org.website}</a></div>}
                </div>
              </>
            )}
          </div>

          {/* Departments */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-emerald-400" /> Departments
            </h3>
            <div className="space-y-2">
              {departments.map((dept, i) => (
                <div key={dept.id || i} className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <span className="text-xs text-white font-semibold">{dept.name}</span>
                  </div>
                  {dept.headCount && (
                    <span className="text-[10px] text-slate-400 font-mono">{dept.headCount} staff</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Holidays sidebar */}
        <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-400" /> Holidays 2026
            </h3>
            {canManageHolidays && (
              <button
                onClick={() => setShowAddHoliday(s => !s)}
                className="p-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {showAddHoliday && (
            <form onSubmit={handleAddHoliday} className="space-y-2 p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl">
              <input value={holidayForm.name} onChange={e => setHolidayForm(f => ({...f, name: e.target.value}))} required placeholder="Holiday name" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
              <input type="date" value={holidayForm.date} onChange={e => setHolidayForm(f => ({...f, date: e.target.value}))} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
              <select value={holidayForm.type} onChange={e => setHolidayForm(f => ({...f, type: e.target.value}))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                <option value="PUBLIC">Public Holiday</option>
                <option value="COMPANY">Company Day Off</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddHoliday(false)} className="flex-1 py-1.5 bg-slate-800 text-slate-400 text-[10px] rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-lg">Add</button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {holidays.map(h => {
              const typeCfg = HOLIDAY_TYPE_COLORS[h.type] || HOLIDAY_TYPE_COLORS.PUBLIC;
              const isPast = new Date(h.date) < today;
              return (
                <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isPast ? 'opacity-40 border-slate-800' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[10px] text-slate-500 uppercase">{new Date(h.date).toLocaleString('en', {month: 'short'})}</p>
                    <p className="text-base font-black text-white font-mono">{new Date(h.date).getDate()}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{h.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                  </div>
                  {canManageHolidays && (
                    <button onClick={() => handleDeleteHoliday(h.id)} className="p-1 text-slate-700 hover:text-rose-400 transition-colors shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MY PROFILE TAB
// ─────────────────────────────────────────────────────────────────────────────
function MyProfileTab({ user }) {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hr/employees')
      .then(res => {
        const me = (res.data || []).find(e => e.id === user.id);
        setEmployeeData(me);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="py-12 text-center text-xs text-slate-500"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />Loading profile…</div>;

  const profile = employeeData?.profile || {};
  const SENIORITY_COLORS = {
    Executive: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Lead:      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    Senior:    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Mid-level':'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    Junior:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  const seniColor = SENIORITY_COLORS[profile.seniorityLevel] || SENIORITY_COLORS['Mid-level'];

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Avatar card */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 to-purple-950/30">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName}`}
              alt=""
              className="w-20 h-20 rounded-2xl ring-2 ring-indigo-500/40 bg-slate-800"
            />
            <span className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-indigo-300 font-semibold">{profile.jobTitle || user?.role}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${seniColor}`}>
                {profile.seniorityLevel || 'Mid-level'}
              </span>
              {profile.payGrade && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  Grade {profile.payGrade}
                </span>
              )}
              {profile.employeeId && (
                <span className="text-[10px] font-mono text-slate-500">{profile.employeeId}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Mail, label: 'Email', value: user?.email },
          { icon: Phone, label: 'Phone', value: profile.phone || '–' },
          { icon: Briefcase, label: 'Department', value: user?.departmentId || '–' },
          { icon: Calendar, label: 'Joined Date', value: profile.joinedDate || '–' },
          { icon: Star, label: 'Specialty', value: profile.specialty || profile.specialties?.join(', ') || '–' },
          { icon: Clock, label: 'Years at Company', value: profile.yearsAtCompany != null ? `${profile.yearsAtCompany} year(s)` : '–' },
          { icon: Activity, label: 'Daily Capacity', value: `${profile.dailyCapacityHours || 8} hrs/day` },
          { icon: TrendingUp, label: 'Task Accuracy', value: `${profile.taskAccuracyRate || 97}%` },
        ].map(item => (
          <div key={item.label} className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-start gap-3">
            <div className="p-2 bg-slate-900/60 rounded-xl shrink-0">
              <item.icon className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{item.label}</p>
              <p className="text-sm text-white font-semibold mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compensation (blurred for privacy — employees see their own) */}
      <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BadgeDollarSign className="w-4 h-4 text-emerald-400" /> My Compensation Summary
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl">
            <p className="text-[10px] text-slate-500">Monthly Base</p>
            <p className="text-base font-black text-emerald-400 font-mono">${(profile.monthlyBaseSalary || 0).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl">
            <p className="text-[10px] text-slate-500">Hourly Rate</p>
            <p className="text-base font-black text-blue-400 font-mono">${profile.hourlyRate || 0}/hr</p>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-xl">
            <p className="text-[10px] text-slate-500">Pay Grade</p>
            <p className="text-base font-black text-amber-400 font-mono">{profile.payGrade || '–'}</p>
          </div>
        </div>
        {/* Leave balances */}
        {profile.leaveBalances && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Leave Balances</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(profile.leaveBalances).map(([type, days]) => (
                <div key={type} className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                  <p className="text-[9px] text-slate-500 uppercase">{type}</p>
                  <p className="text-sm font-black text-white font-mono">{days}d</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {profile.emergencyContact && (
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-[10px] text-slate-500 mb-0.5">Emergency Contact</p>
            <p className="text-xs text-white font-semibold">{profile.emergencyContact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EMPLOYEE SELF-SERVICE HUB
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeSelfServiceHub({ initialTab = 'tasks' }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const TABS = [
    { id: 'tasks',   label: 'My Tasks',      icon: CheckSquare, color: 'indigo', desc: 'Private personal task manager' },
    { id: 'notes',   label: 'Notepad',        icon: StickyNote,  color: 'amber',  desc: 'Private sticky notes' },
    { id: 'company', label: 'Company Hub',    icon: Building2,   color: 'blue',   desc: 'Company info & holidays' },
    { id: 'profile', label: 'My Profile',     icon: User,        color: 'purple', desc: 'Your account details' },
  ];

  const ACTIVE_COLORS = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-600/30',
    amber:  'bg-amber-600 text-white shadow-amber-600/30',
    blue:   'bg-blue-600 text-white shadow-blue-600/30',
    purple: 'bg-purple-600 text-white shadow-purple-600/30',
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass-panel rounded-3xl border border-indigo-500/30 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName}`}
                alt=""
                className="w-14 h-14 rounded-2xl ring-2 ring-indigo-500/40 bg-slate-800"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">
                My Workspace
                <span className="ml-2 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">Personal</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Welcome back, <span className="text-indigo-300 font-semibold">{user?.firstName}</span> — your private workspace
              </p>
              <p className="text-[10px] text-slate-600 mt-0.5">All tasks and notes here are 100% private to you</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Private & Encrypted
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex-1 md:flex-none justify-center md:justify-start ${
                active
                  ? `${ACTIVE_COLORS[tab.color]} shadow-lg`
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'tasks'   && <PersonalTasksTab user={user} />}
        {activeTab === 'notes'   && <NotepadTab />}
        {activeTab === 'company' && <CompanyHubTab user={user} />}
        {activeTab === 'profile' && <MyProfileTab user={user} />}
      </div>
    </div>
  );
}
