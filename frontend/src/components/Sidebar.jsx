import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Kanban, 
  Users, 
  UserPlus,
  DollarSign, 
  BrainCircuit, 
  ShieldAlert, 
  FolderKanban, 
  MessageSquare,
  LayoutDashboard,
  Database,
  ShieldCheck,
  UserCheck,
  Building2,
  CheckSquare,
  StickyNote,
  Globe,
  TableProperties
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'executive-dashboard',
      label: 'Executive Analytics',
      icon: LayoutDashboard,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'client-operations',
      label: 'Client & Process Hub',
      icon: Building2,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD']
    },
    {
      id: 'csv-worksheets',
      label: 'CSV Work Sheets',
      icon: TableProperties,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'HR_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'my-workspace',
      label: 'My Workspace',
      icon: CheckSquare,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'company-hub',
      label: 'Company Hub',
      icon: Globe,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'self-service',
      label: 'My HR & Self-Service',
      icon: UserCheck,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'hr-employees',
      label: 'HR Management & Staff',
      icon: Users,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER']
    },
    {
      id: 'payroll',
      label: 'Automated Payroll',
      icon: DollarSign,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER']
    },
    {
      id: 'create-account',
      label: 'Onboard Employee',
      icon: UserPlus,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER']
    },
    {
      id: 'audit-logs',
      label: 'Security Audit Logs',
      icon: ShieldAlert,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER']
    },
    {
      id: 'collaboration',
      label: 'Collaboration & Chat',
      icon: MessageSquare,
      roles: ['SYSTEM_ADMIN', 'HR_MANAGER', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'team-lead-workspace',
      label: 'Team Lead Workspace',
      icon: ShieldCheck,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD']
    },
    {
      id: 'my-group-portal',
      label: 'My Group & Files',
      icon: FolderKanban,
      roles: ['EMPLOYEE']
    },
    {
      id: 'projects',
      label: 'Projects & Milestones',
      icon: FolderKanban,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'kanban',
      label: 'Task Kanban Board',
      icon: Kanban,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'ai-analytics',
      label: 'AI & Workload Balancer',
      icon: BrainCircuit,
      roles: ['SYSTEM_ADMIN', 'PROJECT_MANAGER', 'TEAM_LEADER', 'TEAM_LEAD', 'EMPLOYEE']
    },
    {
      id: 'database-status',
      label: 'Database Inspector',
      icon: Database,
      roles: ['SYSTEM_ADMIN']
    }
  ];

  const visibleItems = navItems.filter(item => !user || item.roles.includes(user.role) || user.role === 'SYSTEM_ADMIN');

  return (
    <aside className="w-64 glass-panel border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Platform Menu
          </p>
        </div>

        <nav className="space-y-1.5">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 glow-indigo'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <BrainCircuit className="w-3.5 h-3.5 text-emerald-400" />
            AI Machine Learning
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Scikit-Learn Workload & Leave Risk Engines active.
        </p>
      </div>
    </aside>
  );
}
