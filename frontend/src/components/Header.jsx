import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  LogOut,
  Activity, 
  Building2,
  Bell
} from 'lucide-react';
import CsvInboxButton from './CsvInboxButton';

export default function Header({ onOpenAuthModal, onOpenAgendaModal, onNavigateToCsvSheets }) {
  const { user, switchRole, logout, loading } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/hr/attendance')
        .then(res => {
          const todayStr = new Date().toISOString().split('T')[0];
          const record = res.data?.find(a => a.userId === user.id && a.date === todayStr);
          if (record && record.clockIn && !record.clockOut) {
            setClockedIn(true);
            setClockTime(record.clockIn);
          } else {
            setClockedIn(false);
            setClockTime('');
          }
        })
        .catch(err => console.warn('Could not load initial attendance status:', err.message));
    }
  }, [user]);

  const handleClockToggle = async () => {
    try {
      if (!clockedIn) {
        const res = await api.post('/hr/attendance/clock-in');
        setClockedIn(true);
        if (res.data && res.data.record) setClockTime(res.data.record.clockIn);
      } else {
        const res = await api.post('/hr/attendance/clock-out');
        setClockedIn(false);
        setClockTime('');
      }
    } catch (err) {
      console.error('Clock action error:', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return { label: 'System Admin', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'HR_MANAGER':
        return { label: 'HR Manager', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'PROJECT_MANAGER':
        return { label: 'Project Manager', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'TEAM_LEADER':
        return { label: 'Team Leader', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'EMPLOYEE':
        return { label: 'Employee', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      default:
        return { label: role || 'User', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const badge = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Brand & Organization Status */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Smart HR & Task Manager
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                AI Platform
              </span>
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {user?.organizationName || 'Global Technology Solutions Ltd.'}
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure & Encrypted
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Clock In/Out & User Profile / Logout */}
      <div className="flex items-center space-x-3">
        {/* Clock In / Out Toggle */}
        <button
          onClick={handleClockToggle}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            clockedIn
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{clockedIn ? `Clocked In (${clockTime})` : 'Clock Out'}</span>
        </button>

        {/* CSV Work Sheet Inbox Bell */}
        {user && (
          <CsvInboxButton onNavigateToCsvSheets={onNavigateToCsvSheets} />
        )}

        {/* Daily Agenda & Desktop Notification Bell Button */}
        {user && (
          <button
            onClick={onOpenAgendaModal}
            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 transition-all relative group"
            title="Daily Agenda & Desktop Notifications"
          >
            <Bell className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          </button>
        )}

        {/* User Profile & Sign Out */}
        {user ? (
          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <img
              src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
              alt={user.firstName}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/30"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white">
                {user.firstName} {user.lastName}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30"
          >
            Sign In to Account
          </button>
        )}
      </div>
    </header>
  );
}
