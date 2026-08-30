import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Bell, BellRing, CheckCircle2, Clock, AlertTriangle, Calendar,
  Briefcase, Award, X, ExternalLink, Sparkles, CheckCheck, RefreshCw,
  ShieldAlert, Volume2, Monitor
} from 'lucide-react';

export default function DailyAgendaNotificationModal({ isOpen, onClose, onNavigateTab }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [desktopPermission, setDesktopPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const [agendaData, setAgendaData] = useState({
    tasksDueToday: [],
    overdueTasks: [],
    pendingTasksCount: 0,
    myPersonalTasksDueToday: [],
    pendingReviews: [],
    announcements: []
  });

  const fetchAgenda = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      // Fetch group tasks, personal tasks, master tasks, and appraisals
      const [tasksRes, personalTasksRes, appraisalsRes, groupRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/personal/tasks'),
        api.get('/hr/appraisals'),
        api.get('/groups/my-groups')
      ]);

      const allTasks = tasksRes.status === 'fulfilled' ? (tasksRes.value.data || []) : [];
      const personalTasks = personalTasksRes.status === 'fulfilled' ? (personalTasksRes.value.data || []) : [];
      const appraisals = appraisalsRes.status === 'fulfilled' ? (appraisalsRes.value.data || []) : [];
      const myGroups = groupRes.status === 'fulfilled' ? (groupRes.value.data || []) : [];

      // Filter tasks assigned to current logged in user
      const myAssignedTasks = allTasks.filter(t =>
        t.assignedTo === user.id ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(user.firstName.toLowerCase()))
      );

      // Tasks due today
      const dueToday = myAssignedTasks.filter(t =>
        t.status !== 'COMPLETED' && t.status !== 'DONE' &&
        ((t.dueDate && t.dueDate === todayStr) || (t.slaDeadline && t.slaDeadline === todayStr))
      );

      // Overdue tasks
      const overdue = myAssignedTasks.filter(t =>
        t.status !== 'COMPLETED' && t.status !== 'DONE' &&
        ((t.dueDate && t.dueDate < todayStr) || (t.slaDeadline && t.slaDeadline < todayStr))
      );

      // Total pending
      const pendingCount = myAssignedTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE').length;

      // Personal tasks due today
      const personalDueToday = personalTasks.filter(t =>
        t.status !== 'DONE' && t.dueDate && t.dueDate <= todayStr
      );

      // Reviews awaiting employee acknowledgement
      const pendingMprs = appraisals.filter(a => a.userId === user.id && a.status === 'COMPLETED');

      // Group announcements
      const groupAncs = myGroups.flatMap(g => (g.announcements || []).map(a => ({ ...a, groupName: g.name })));

      const compiled = {
        tasksDueToday: dueToday,
        overdueTasks: overdue,
        pendingTasksCount: pendingCount,
        myPersonalTasksDueToday: personalDueToday,
        pendingReviews: pendingMprs,
        announcements: groupAncs.slice(0, 3)
      };

      setAgendaData(compiled);

      // Trigger Desktop Notification if permission is granted
      sendDesktopNotification(compiled, user);

    } catch (err) {
      console.error('Failed to fetch daily agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchAgenda();
    }
  }, [isOpen, fetchAgenda]);

  // Request browser Notification Permission
  const requestDesktopPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === 'granted') {
        sendDesktopNotification(agendaData, user, true);
      }
    }
  };

  // Helper to trigger Desktop OS Notification
  const sendDesktopNotification = (agenda, currentUser, isTest = false) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const totalDueToday = (agenda.tasksDueToday?.length || 0) + (agenda.myPersonalTasksDueToday?.length || 0);
    const totalOverdue = agenda.overdueTasks?.length || 0;
    const pendingReviews = agenda.pendingReviews?.length || 0;

    let title = `📋 Daily Agenda — ${currentUser?.firstName || 'Employee'}`;
    let body = `You have ${agenda.pendingTasksCount} pending tasks (${totalDueToday} due today).`;

    if (totalOverdue > 0) {
      body += ` ⚠️ ${totalOverdue} overdue item(s)!`;
    }
    if (pendingReviews > 0) {
      body += ` 🌟 ${pendingReviews} performance review(s) awaiting your response.`;
    }
    if (isTest) {
      title = `🔔 Desktop Notifications Enabled!`;
      body = `Smart HR & Task Manager desktop alerts are active for ${currentUser?.firstName}.`;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=smarthr',
        tag: 'smart-hr-daily-agenda',
        requireInteraction: false
      });

      notification.onclick = () => {
        window.focus();
        if (onNavigateTab) {
          if (currentUser?.role === 'EMPLOYEE') onNavigateTab('my-workspace');
          else onNavigateTab('kanban');
        }
        notification.close();
      };
    } catch (e) {
      console.warn('Desktop Notification error:', e);
    }
  };

  if (!isOpen) return null;

  const totalUrgentCount =
    (agendaData.tasksDueToday?.length || 0) +
    (agendaData.overdueTasks?.length || 0) +
    (agendaData.myPersonalTasksDueToday?.length || 0) +
    (agendaData.pendingReviews?.length || 0);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-[#0f1420] border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900/40">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-300">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Daily Work Overview & Agenda
                  {totalUrgentCount > 0 && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {totalUrgentCount} Action Items
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Welcome back, <strong className="text-indigo-300">{user?.firstName}</strong> · {todayFormatted}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Permission Bar */}
          <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-300 font-medium">Desktop OS Alerts:</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                desktopPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                desktopPermission === 'denied' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {desktopPermission}
              </span>
            </div>
            {desktopPermission !== 'granted' ? (
              <button
                onClick={requestDesktopPermission}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg transition-colors shadow"
              >
                Enable Desktop Alerts
              </button>
            ) : (
              <button
                onClick={() => sendDesktopNotification(agendaData, user, true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] font-semibold rounded-lg border border-slate-700"
              >
                Test Notification
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-400 mx-auto" />
              <p>Gathering your works and pending items for today…</p>
            </div>
          ) : (
            <>
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-medium">Total Pending Tasks</p>
                  <p className="text-xl font-black text-white font-mono mt-0.5">{agendaData.pendingTasksCount}</p>
                </div>
                <div className="p-3 bg-amber-950/40 border border-amber-500/20 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-medium">Tasks Due Today</p>
                  <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{agendaData.tasksDueToday.length}</p>
                </div>
                <div className="p-3 bg-rose-950/40 border border-rose-500/20 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-medium">Overdue Items</p>
                  <p className="text-xl font-black text-rose-400 font-mono mt-0.5">{agendaData.overdueTasks.length}</p>
                </div>
                <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-2xl">
                  <p className="text-[10px] text-slate-500 font-medium">Reviews Pending</p>
                  <p className="text-xl font-black text-purple-400 font-mono mt-0.5">{agendaData.pendingReviews.length}</p>
                </div>
              </div>

              {/* Overdue Alert Banner */}
              {agendaData.overdueTasks.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Attention Required: {agendaData.overdueTasks.length} Overdue Task(s)</span>
                  </div>
                  <div className="space-y-1">
                    {agendaData.overdueTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs text-slate-300 bg-black/20 p-2 rounded-xl">
                        <span className="truncate font-medium">{t.title}</span>
                        <span className="text-[10px] font-mono text-rose-400 shrink-0 ml-2">Due: {t.dueDate || t.slaDeadline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Due Today */}
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" /> Works Due Today ({agendaData.tasksDueToday.length})
                </h4>
                {agendaData.tasksDueToday.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 text-center">
                    ✨ No group tasks due today. All clear!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {agendaData.tasksDueToday.map(t => (
                      <div key={t.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate">{t.title}</p>
                          {t.description && <p className="text-[11px] text-slate-400 truncate">{t.description}</p>}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold shrink-0">
                          {t.priority || 'MEDIUM'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Personal Tasks Due Today */}
              {agendaData.myPersonalTasksDueToday.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Private Personal Tasks Due Today ({agendaData.myPersonalTasksDueToday.length})
                  </h4>
                  <div className="space-y-2">
                    {agendaData.myPersonalTasksDueToday.map(t => (
                      <div key={t.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-white truncate">{t.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Due Today</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Performance Reviews */}
              {agendaData.pendingReviews.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-purple-400" /> Performance Reviews Acknowledgement Required ({agendaData.pendingReviews.length})
                  </h4>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-purple-200 font-semibold">Your MPR review is completed. Please acknowledge.</span>
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('my-group-portal');
                      }}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 shrink-0"
                    >
                      Acknowledge Review <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Group Announcements */}
              {agendaData.announcements.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    📢 Group Announcements
                  </h4>
                  <div className="space-y-2">
                    {agendaData.announcements.map((anc, idx) => (
                      <div key={idx} className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs space-y-0.5">
                        <p className="font-bold text-white">{anc.title}</p>
                        <p className="text-[11px] text-slate-400">{anc.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60">
          <button
            onClick={() => {
              fetchAgenda();
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Agenda
          </button>

          <button
            onClick={() => {
              onClose();
              if (onNavigateTab) {
                if (user?.role === 'EMPLOYEE') onNavigateTab('my-workspace');
                else onNavigateTab('kanban');
              }
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            Go to My Workspace <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
