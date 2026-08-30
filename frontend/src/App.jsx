import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

import ExecutiveDashboard from './pages/ExecutiveDashboard';
import KanbanBoard from './components/KanbanBoard';
import ProjectsPage from './pages/ProjectsPage';
import CollaborationPage from './pages/CollaborationPage';
import HREmployeesPage from './pages/HREmployeesPage';
import AIAnalyticsPage from './pages/AIAnalyticsPage';
import SpecialistPortalPage from './pages/SpecialistPortalPage';
import AuditLogsPage from './pages/AuditLogsPage';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import DatabaseStatusPage from './pages/DatabaseStatusPage';
import TeamLeadDashboardPage from './pages/TeamLeadDashboardPage';
import EmployeeGroupPortalPage from './pages/EmployeeGroupPortalPage';
import ClientOperationsPage from './pages/ClientOperationsPage';
import EmployeeSelfServiceHub from './pages/EmployeeSelfServiceHub';
import CsvWorkSheetsPage from './pages/CsvWorkSheetsPage';
import DailyAgendaNotificationModal from './components/DailyAgendaNotificationModal';

function MainAppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('executive-dashboard');
  const [authScreen, setAuthScreen] = useState(null); // 'login', 'register', or null
  const [showAgendaModal, setShowAgendaModal] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'TEAM_LEADER' || user.role === 'TEAM_LEAD') {
        setActiveTab('team-lead-workspace');
      } else if (user.role === 'HR_MANAGER') {
        setActiveTab('hr-employees');
      } else if (user.role === 'EMPLOYEE') {
        setActiveTab('my-workspace');
      }

      // Check if daily agenda notification was shown for this session
      const key = `dailyAgendaShown_${user.id}_${new Date().toISOString().split('T')[0]}`;
      if (!sessionStorage.getItem(key)) {
        setShowAgendaModal(true);
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [user]);

  const handleNavigateToCsvSheets = (sheetId) => {
    setActiveTab('csv-worksheets');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 text-xs text-slate-400 font-mono">
        Loading Smart HR & Task Management Platform...
      </div>
    );
  }

  const handleSuccessLogin = () => {
    setAuthScreen(null);
    if (user?.role === 'HR_MANAGER') {
      setActiveTab('hr-employees');
    } else if (user?.role === 'TEAM_LEADER' || user?.role === 'TEAM_LEAD') {
      setActiveTab('team-lead-workspace');
    } else if (user?.role === 'EMPLOYEE') {
      setActiveTab('my-workspace');
    } else {
      setActiveTab('executive-dashboard');
    }
  };

  if (authScreen === 'register') {
    return <RegisterPage onNavigateLogin={() => setAuthScreen('login')} onSuccessRegister={handleSuccessLogin} />;
  }
  if (!user || authScreen === 'login') {
    return <LoginPage onNavigateRegister={() => setAuthScreen('register')} onSuccessLogin={handleSuccessLogin} />;
  }


  const renderTabContent = () => {
    switch (activeTab) {
      case 'executive-dashboard':
        return <ExecutiveDashboard />;
      case 'client-operations':
        return <ClientOperationsPage />;
      case 'team-lead-workspace':
        if (user && user.role === 'EMPLOYEE') return <EmployeeGroupPortalPage />;
        return <TeamLeadDashboardPage />;
      case 'my-group-portal':
        return <EmployeeGroupPortalPage />;
      case 'my-workspace':
        return <EmployeeSelfServiceHub />;
      case 'company-hub':
        // Show company hub tab directly
        return <EmployeeSelfServiceHub initialTab="company" />;
      case 'kanban':
        return <KanbanBoard />;
      case 'projects':
        return <ProjectsPage />;
      case 'collaboration':
        return <CollaborationPage />;
      case 'hr-employees':
      case 'payroll':
      case 'attendance':
        return <HREmployeesPage />;
      case 'create-account':
        return <RegisterPage onNavigateLogin={() => setActiveTab('executive-dashboard')} />;
      case 'ai-analytics':
        return <AIAnalyticsPage />;
      case 'csv-worksheets':
        return <CsvWorkSheetsPage />;
      case 'self-service':
        return <SpecialistPortalPage />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'database-status':
        return <DatabaseStatusPage />;
      default:
        return <ExecutiveDashboard />;
    }
  };



  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        onOpenAuthModal={() => setAuthScreen('login')}
        onOpenAgendaModal={() => setShowAgendaModal(true)}
        onNavigateToCsvSheets={handleNavigateToCsvSheets}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 p-6 overflow-y-auto">
          {renderTabContent()}
        </main>
      </div>

      <DailyAgendaNotificationModal
        isOpen={showAgendaModal}
        onClose={() => setShowAgendaModal(false)}
        onNavigateTab={setActiveTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
