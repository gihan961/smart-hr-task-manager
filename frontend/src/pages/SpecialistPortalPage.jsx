import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SlaCountdown from '../components/SlaCountdown';
import { 
  UserCheck, 
  Clock, 
  Calendar, 
  Send, 
  CheckCircle2, 
  BrainCircuit, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  Edit3, 
  Camera, 
  CheckCheck, 
  AlertCircle,
  Briefcase,
  Layers,
  Sparkles,
  LogOut,
  LogIn
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Morgan',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Riley'
];

export default function SpecialistPortalPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('leaves'); // leaves, attendance, demographics, tasks

  // Data States
  const [myTasks, setMyTasks] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'ANNUAL',
    targetTeamLeadId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });
  const [submittedLeave, setSubmittedLeave] = useState(null);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  // Demographics Form
  const [demoForm, setDemoForm] = useState({
    phone: '',
    emergencyContact: '',
    address: '',
    avatar: ''
  });
  const [demoMsg, setDemoMsg] = useState('');

  // Clock status
  const [clockedIn, setClockedIn] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, [user]);

  const fetchPortalData = async () => {
    if (!user) return;
    try {
      const [tasksRes, leavesRes, attRes, empRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/hr/leaves'),
        api.get('/hr/attendance'),
        api.get('/hr/employees')
      ]);

      if (tasksRes.status === 'fulfilled') {
        const filtered = (tasksRes.value.data || []).filter(t => t.assignedTo === user.id);
        setMyTasks(filtered);
      }

      if (leavesRes.status === 'fulfilled') {
        const filtered = (leavesRes.value.data || []).filter(l => l.userId === user.id);
        setMyLeaves(filtered);
      }

      if (attRes.status === 'fulfilled') {
        const filtered = (attRes.value.data || []).filter(a => a.userId === user.id);
        setMyAttendance(filtered);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAtt = filtered.find(a => a.date === todayStr);
        if (todayAtt && todayAtt.clockIn && !todayAtt.clockOut) {
          setClockedIn(true);
        } else {
          setClockedIn(false);
        }
      }

      if (empRes.status === 'fulfilled') {
        const allStaff = empRes.value.data || [];
        const tls = allStaff.filter(e => ['TEAM_LEADER', 'PROJECT_MANAGER', 'SYSTEM_ADMIN'].includes(e.role));
        setTeamLeads(tls);

        const currentEmp = allStaff.find(e => e.id === user.id);
        if (currentEmp) {
          setMyProfile(currentEmp.profile || {});
          setDemoForm({
            phone: currentEmp.profile?.phone || '',
            emergencyContact: currentEmp.profile?.emergencyContact || '',
            address: currentEmp.profile?.address || '',
            avatar: currentEmp.avatar || user.avatar || ''
          });
        }
      }
    } catch (err) {
      console.error('Portal data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    setSubmittedLeave(null);
    try {
      const res = await api.post('/hr/leaves', leaveForm);
      setSubmittedLeave(res.data.leave);
      setLeaveForm({ leaveType: 'ANNUAL', targetTeamLeadId: '', startDate: '', endDate: '', reason: '' });
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await api.patch(`/hr/leaves/${leaveId}/cancel`);
      alert('Leave request cancelled successfully.');
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel leave request.');
    }
  };

  const handleClockToggle = async () => {
    try {
      if (!clockedIn) {
        const res = await api.post('/hr/attendance/clock-in');
        alert(res.data.message || 'Clocked in successfully!');
        setClockedIn(true);
      } else {
        const res = await api.post('/hr/attendance/clock-out');
        alert(res.data.message || 'Clocked out successfully!');
        setClockedIn(false);
      }
      fetchPortalData();
    } catch (err) {
      alert(err.response?.data?.message || 'Attendance action failed.');
    }
  };

  const handleUpdateDemographics = async (e) => {
    e.preventDefault();
    setDemoMsg('');
    try {
      const res = await api.patch('/hr/me/demographics', demoForm);
      setDemoMsg('Demographics and profile photo updated successfully!');
      if (res.data.user) {
        setUser(prev => ({ ...prev, ...res.data.user }));
      }
      fetchPortalData();
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const leaveBals = myProfile?.leaveBalances || { annual: 14, sick: 7, casual: 5, medical: 10 };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading My HR & Self-Service Portal...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName}`}
            alt=""
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500 bg-slate-800"
          />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Welcome, {user?.firstName} {user?.lastName}!
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                {user?.role}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {myProfile?.jobTitle || 'RCM Operations Specialist'} &bull; {user?.email}
            </p>
          </div>
        </div>

        {/* Quick Shift Clock In / Clock Out Widget */}
        <div className="flex items-center space-x-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
          <div className="text-right text-xs">
            <span className="text-[10px] text-slate-400 block font-semibold">Shift Status</span>
            <span className={`font-bold font-mono ${clockedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
              {clockedIn ? '🟢 Active Shift' : '⚪ Clocked Out'}
            </span>
          </div>
          <button
            onClick={handleClockToggle}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-lg ${
              clockedIn
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {clockedIn ? <><LogOut className="w-3.5 h-3.5" /> Clock Out</> : <><LogIn className="w-3.5 h-3.5" /> Clock In</>}
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex space-x-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🌴 My Leaves & Applications ({myLeaves.length})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'attendance' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⏰ Manage Attendance ({myAttendance.length})
        </button>
        <button
          onClick={() => setActiveTab('demographics')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'demographics' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Demographics & Profile Photo
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚡ My Assigned Tasks ({myTasks.length})
        </button>
      </div>

      {/* ── TAB 1: MY LEAVES & APPLICATIONS ── */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Leave Balances Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Annual Leave</span>
              <p className="text-xl font-bold text-indigo-300 font-mono">{leaveBals.annual} Days</p>
              <span className="text-[10px] text-slate-500">Paid Leave Allowance</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Sick Leave</span>
              <p className="text-xl font-bold text-emerald-400 font-mono">{leaveBals.sick} Days</p>
              <span className="text-[10px] text-slate-500">Medical Allowance</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Casual Leave</span>
              <p className="text-xl font-bold text-amber-400 font-mono">{leaveBals.casual} Days</p>
              <span className="text-[10px] text-slate-500">Personal Allowance</span>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold block">Medical Leave</span>
              <p className="text-xl font-bold text-purple-300 font-mono">{leaveBals.medical} Days</p>
              <span className="text-[10px] text-slate-500">Special Leave</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: My Leave History & Applications */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                My Submitted Leave Applications
              </h3>

              {myLeaves.length === 0 ? (
                <div className="glass-panel p-8 text-center text-xs text-slate-500 rounded-2xl">
                  No leave requests submitted yet. Use the form on the right to apply.
                </div>
              ) : (
                <div className="space-y-3">
                  {myLeaves.map(leave => {
                    const isPending = leave.status === 'PENDING';
                    const isApproved = leave.status === 'APPROVED';
                    const isCancelled = leave.status === 'CANCELLED';

                    return (
                      <div key={leave.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-white">{leave.leaveType} Leave</span>
                            <span className="text-xs text-slate-400">({leave.daysCount} Days)</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                            isApproved ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            isPending ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            isCancelled ? 'bg-slate-800 text-slate-400 border-slate-700' :
                            'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}>
                            {leave.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300">
                          Dates: <span className="font-mono text-indigo-300">{leave.startDate} to {leave.endDate}</span> &bull; Reason: {leave.reason}
                        </p>

                        {/* AI Risk Score Notice */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> AI Risk Pre-Score: {leave.aiRiskScore}%
                          </span>

                          {/* Cancel Button if Pending */}
                          {isPending && (
                            <button
                              onClick={() => handleCancelLeave(leave.id)}
                              className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel Leave Request
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Submit Leave Request Form */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Apply for New Leave
              </h3>
              <p className="text-xs text-slate-400">
                Submissions automatically sync live to your Team Lead and HR Managers.
              </p>

              <form onSubmit={handleLeaveSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-indigo-300 font-semibold block mb-1">
                    Select Team Lead / Approver
                  </label>
                  <select
                    value={leaveForm.targetTeamLeadId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, targetTeamLeadId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="">-- Choose Team Lead / Supervisor --</option>
                    {teamLeads.map(tl => (
                      <option key={tl.id} value={tl.id}>
                        👤 {tl.firstName} {tl.lastName} ({tl.profile?.jobTitle || tl.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Leave Category</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-semibold"
                  >
                    <option value="ANNUAL">Annual Leave</option>
                    <option value="SICK">Sick Leave</option>
                    <option value="CASUAL">Casual Leave</option>
                    <option value="MEDICAL">Medical Leave</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Reason</label>
                  <textarea
                    required
                    rows={3}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1"
                    placeholder="Provide details..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={leaveSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Send className="w-4 h-4" /> {leaveSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>

              {submittedLeave && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span>Submitted to Team Lead & HR!</span>
                    <span>AI Risk: {submittedLeave.aiRiskScore}%</span>
                  </div>
                  <p className="text-[11px] text-emerald-200">{submittedLeave.aiRiskReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: MANAGE SHIFT ATTENDANCE ── */}
      {activeTab === 'attendance' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                Shift Attendance Management & Time Logs
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Record your daily shift clock in/out times and view your hours worked history.
              </p>
            </div>

            <button
              onClick={handleClockToggle}
              className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all ${
                clockedIn
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {clockedIn ? <><LogOut className="w-4 h-4" /> Clock Out Current Shift</> : <><LogIn className="w-4 h-4" /> Clock In New Shift</>}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Clock In Time</th>
                  <th className="p-4">Clock Out Time</th>
                  <th className="p-4">Total Hours Worked</th>
                  <th className="p-4">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {myAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No shift attendance records found. Click Clock In to start your shift.</td>
                  </tr>
                ) : (
                  myAttendance.map(a => (
                    <tr key={a.id} className="hover:bg-slate-900/40">
                      <td className="p-4 font-mono font-bold text-white">{a.date}</td>
                      <td className="p-4 font-mono text-emerald-400">{a.clockIn}</td>
                      <td className="p-4 font-mono text-amber-400">{a.clockOut || 'Active Shift'}</td>
                      <td className="p-4 font-mono font-bold text-white">{a.hoursWorked} hrs</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DEMOGRAPHICS & PROFILE PHOTO ── */}
      {activeTab === 'demographics' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Update Personal Demographics & Profile Photo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Keep your contact details, emergency contacts, and profile photo up-to-date.
            </p>
          </div>

          {demoMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> {demoMsg}
            </div>
          )}

          <form onSubmit={handleUpdateDemographics} className="space-y-4 text-xs">
            {/* Profile Avatar Picker */}
            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">Select Profile Avatar / Photo</label>
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_AVATARS.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt=""
                    onClick={() => setDemoForm({ ...demoForm, avatar: url })}
                    className={`w-12 h-12 rounded-2xl cursor-pointer transition-all border-2 bg-slate-900 ${
                      demoForm.avatar === url ? 'border-indigo-500 scale-110 ring-4 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  />
                ))}
              </div>

              <div className="pt-2">
                <label className="text-slate-400 text-[11px] block">Or Enter Custom Image / Avatar URL</label>
                <input
                  type="text"
                  value={demoForm.avatar}
                  onChange={(e) => setDemoForm({ ...demoForm, avatar: e.target.value })}
                  placeholder="https://example.com/my-photo.png"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={demoForm.emergencyContact}
                  onChange={(e) => setDemoForm({ ...demoForm, emergencyContact: e.target.value })}
                  placeholder="Name & Phone Number"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Office / Residential Address</label>
              <input
                type="text"
                value={demoForm.address}
                onChange={(e) => setDemoForm({ ...demoForm, address: e.target.value })}
                placeholder="Address..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" /> Save Demographics & Profile Photo
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 4: MY ASSIGNED TASKS ── */}
      {activeTab === 'tasks' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            My Active Operational Tasks
          </h3>

          <div className="space-y-3">
            {myTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No active tasks assigned to you currently.</div>
            ) : (
              myTasks.map(t => (
                <div key={t.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{t.title}</span>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{t.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400">Timely Filing SLA Deadline:</span>
                    <SlaCountdown deadline={t.dueDate} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
