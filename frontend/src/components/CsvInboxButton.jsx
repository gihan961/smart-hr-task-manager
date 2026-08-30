import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Inbox,
  FileSpreadsheet,
  X,
  CheckCheck,
  AlertCircle,
  CalendarClock,
  ChevronRight
} from 'lucide-react';

// Stores read sheet IDs per user in localStorage
const STORAGE_KEY = (userId) => `csv_inbox_read_${userId}`;

export default function CsvInboxButton({ onNavigateToCsvSheets }) {
  const { user } = useAuth();
  const [sheets, setSheets] = useState([]);
  const [unreadIds, setUnreadIds] = useState(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const getReadIds = useCallback(() => {
    if (!user) return new Set();
    try {
      const raw = localStorage.getItem(STORAGE_KEY(user.id));
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  }, [user]);

  const saveReadIds = useCallback((ids) => {
    if (!user) return;
    localStorage.setItem(STORAGE_KEY(user.id), JSON.stringify([...ids]));
  }, [user]);

  // Fetch ONLY sheets assigned to the current logged-in user
  const fetchMyInbox = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/csv-sheets/my-inbox');
      const mySheets = res.data || [];
      setSheets(mySheets);

      const readIds = getReadIds();
      const newUnread = new Set(
        mySheets
          .filter(s => !readIds.has(s.id))
          .map(s => s.id)
      );
      setUnreadIds(newUnread);
    } catch (err) {
      // silently fail — inbox is non-critical
    }
  }, [user, getReadIds]);

  useEffect(() => {
    fetchMyInbox();
    // Poll every 60 seconds for new assigned sheets
    const interval = setInterval(fetchMyInbox, 60000);
    return () => clearInterval(interval);
  }, [fetchMyInbox]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    const allIds = new Set(sheets.map(s => s.id));
    setUnreadIds(new Set());
    saveReadIds(allIds);
  };

  const markOneRead = (sheetId) => {
    const readIds = getReadIds();
    readIds.add(sheetId);
    saveReadIds(readIds);
    setUnreadIds(prev => {
      const next = new Set(prev);
      next.delete(sheetId);
      return next;
    });
  };

  const handleOpenSheet = (sheetId) => {
    markOneRead(sheetId);
    setIsOpen(false);
    if (onNavigateToCsvSheets) onNavigateToCsvSheets(sheetId);
  };

  const unreadCount = unreadIds.size;

  const catColors = {
    BILLING: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    AR:      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    QA:      'bg-purple-500/20 text-purple-300 border-purple-500/30',
    CODING:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
    VOB:     'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    GENERAL: 'bg-slate-600/40 text-slate-300 border-slate-600/40'
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Inbox Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className={`p-2 rounded-xl border transition-all relative group ${
          isOpen
            ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-300'
            : 'bg-slate-800/60 hover:bg-slate-700/60 border-slate-700 text-slate-400 hover:text-slate-200'
        }`}
        title={`My CSV Work Sheet Inbox${unreadCount > 0 ? ` — ${unreadCount} new` : ''}`}
      >
        <Inbox className="w-4 h-4 group-hover:scale-110 transition-transform" />

        {/* Unread badge — only when there are new sheets */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#0b0f19] animate-bounce z-10">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Inbox Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 z-50 glass-panel rounded-2xl border border-slate-700 shadow-2xl shadow-black/60 overflow-hidden"
          style={{ backdropFilter: 'blur(20px)' }}
        >
          {/* Panel Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <Inbox className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">My Work Sheet Inbox</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-indigo-400 hover:text-indigo-200 font-semibold flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" /> All read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assigned-to info */}
          <div className="px-4 py-2 bg-indigo-500/5 border-b border-slate-800/50">
            <p className="text-[10px] text-indigo-300 font-semibold">
              Showing sheets assigned to: <span className="text-white">{user.firstName} {user.lastName}</span>
            </p>
          </div>

          {/* Sheet list */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
            {sheets.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-500 font-semibold">No sheets assigned to you</p>
                <p className="text-[10px] text-slate-600">Your Team Lead will assign CSV work sheets here.</p>
              </div>
            ) : (
              sheets.map(sheet => {
                const isUnread = unreadIds.has(sheet.id);
                const isOverdue = sheet.deadline && new Date(sheet.deadline) < new Date() && (sheet.completionPct || 0) < 100;
                const catColor = catColors[sheet.processCategory] || catColors.GENERAL;

                return (
                  <button
                    key={sheet.id}
                    onClick={() => handleOpenSheet(sheet.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-800/60 transition-all group ${
                      isUnread ? 'bg-indigo-500/5 border-l-2 border-indigo-500/60' : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <div className="mt-1.5 shrink-0">
                        {isUnread ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-700" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${catColor}`}>
                            {sheet.processCategory}
                          </span>
                          {isUnread && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              NEW
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[9px] font-bold text-rose-400 flex items-center gap-0.5">
                              <AlertCircle className="w-2.5 h-2.5" /> OVERDUE
                            </span>
                          )}
                        </div>

                        <p className={`text-xs font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                          {sheet.title}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-500 truncate">
                            Assigned by: <span className="text-slate-400 font-semibold">{sheet.createdBy}</span>
                          </span>
                          {sheet.deadline && (
                            <span className={`text-[10px] font-mono flex items-center gap-0.5 shrink-0 ${
                              isOverdue ? 'text-rose-400' : 'text-slate-500'
                            }`}>
                              <CalendarClock className="w-2.5 h-2.5" />
                              {sheet.deadline}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                              style={{ width: `${sheet.completionPct || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {sheet.completedRows}/{sheet.totalRows} done
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors mt-1 shrink-0" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/40">
            <button
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToCsvSheets) onNavigateToCsvSheets(null);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-200 font-semibold flex items-center gap-1.5 w-full justify-center"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Open CSV Work Sheets Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
