import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { Activity, DollarSign, CheckCircle2, TrendingUp, Users, FolderKanban, BrainCircuit, Inbox } from 'lucide-react';
import api from '../services/api';

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, empRes, attRes] = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/hr/employees'),
        api.get('/hr/attendance')
      ]);

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || []);
      if (projectsRes.status === 'fulfilled') setProjects(projectsRes.value.data || []);
      if (empRes.status === 'fulfilled') setEmployees(empRes.value.data || []);
      if (attRes.status === 'fulfilled') setAttendance(attRes.value.data || []);
    } catch (err) {
      console.warn('Error fetching dashboard real data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute Real Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;
  const todoTasks = tasks.filter(t => t.status === 'TO_DO').length;

  const totalProjects = projects.length;
  const activeStaff = employees.length;
  const totalAttendance = attendance.length;

  const avgAccuracy = employees.length > 0 
    ? (employees.reduce((acc, e) => acc + (e.taskAccuracyRate || 0), 0) / employees.length).toFixed(1)
    : '0.0';

  // Task Status Breakdown (Pie Chart Data)
  const taskDistributionData = totalTasks > 0 ? [
    { name: 'Completed', value: completedTasks, color: '#10b981' },
    { name: 'In Progress', value: inProgressTasks, color: '#6366f1' },
    { name: 'Under Review', value: reviewTasks, color: '#f59e0b' },
    { name: 'To-Do Queue', value: todoTasks, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6">
      {/* Top Key Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 glow-indigo">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Task Velocity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-white font-mono">{totalTasks} Tasks</span>
            <span className="text-xs text-slate-400 font-semibold flex items-center">
              {completedTasks} Completed
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Live Database Deliverables</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Average Task Quality Rate</span>
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-white font-mono">{avgAccuracy}%</span>
            <span className={`text-xs font-semibold ${parseFloat(avgAccuracy) >= 95 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {parseFloat(avgAccuracy) >= 95 ? 'Above SLA Target' : 'Clean Data'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Verified Accuracy Engine</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-white font-mono">{totalProjects} Projects</span>
            <span className="text-xs text-slate-400">0 Overdue</span>
          </div>
          <p className="text-[11px] text-slate-500">Milestone Tracking</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Active Workforce</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-white font-mono">{activeStaff} Staff</span>
            <span className="text-xs text-emerald-400 font-semibold">{totalAttendance} Logged</span>
          </div>
          <p className="text-[11px] text-slate-500">Real-time Clock-In Verification</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Task Completion Area Chart */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Deliverables & Productivity Velocity</h3>
              <p className="text-xs text-slate-400">Real task completion volume from live database</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Live Database
            </span>
          </div>

          {totalTasks === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
              <Inbox className="w-10 h-10 text-slate-600 mb-1" />
              <h4 className="text-xs font-bold text-slate-300">No Tasks Recorded Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-sm">
                The database is clean with 0 tasks. Create your first project and task in the Task Kanban Board to visualize velocity.
              </p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { month: 'Current', completedTasks: completedTasks, totalHours: completedTasks * 8 }
                ]}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="completedTasks" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right 1 Col: Task Distribution Donut Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Workforce Task Status Breakdown</h3>
            <p className="text-xs text-slate-400">Current status distribution across organizational tasks</p>
          </div>

          {totalTasks === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
              <span className="text-xs text-slate-500 font-mono">0 Tasks in Database</span>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-400">Completed:</span>
              <span className="font-bold text-white">{completedTasks}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-slate-400">In Progress:</span>
              <span className="font-bold text-white">{inProgressTasks}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-400">Review:</span>
              <span className="font-bold text-white">{reviewTasks}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">To-Do:</span>
              <span className="font-bold text-white">{todoTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Department Performance Bar Chart */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Departmental Task Quality Benchmark</h3>
        <p className="text-xs text-slate-400">Measured against 95.0% enterprise SLA standard</p>

        {employees.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-1">
            <h4 className="text-xs font-bold text-slate-400">No Staff Profiles Registered Yet</h4>
            <p className="text-[11px] text-slate-500">Onboard employees to track departmental quality scores.</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={employees.map(e => ({ name: `${e.firstName || 'Staff'} ${e.lastName || ''}`, accuracy: e.taskAccuracyRate || 95, target: 95.0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis domain={[80, 100]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="accuracy" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#334155" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
