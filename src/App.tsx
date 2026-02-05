import { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Members } from './pages/Members';
import { Leads } from './pages/Leads';
import { Wods } from './pages/Wods';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Dashboard } from './pages/Dashboard';
import { Roles } from './pages/Roles';
import { Schedule } from './pages/Schedule';
import { Billing } from './pages/Billing';
import { Benchmarks } from './pages/Benchmarks';
import { BoxDisplay } from './pages/BoxDisplay';
import { Competitions } from './pages/Competitions';
import { AuditLogs } from './pages/AuditLogs';
import { Movements } from './pages/Movements';
import { Profile } from './pages/Profile';
import { ThemeProvider } from './components/theme-provider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const { session, userProfile, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#050508]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-zinc-500 font-black italic uppercase tracking-[0.2em] text-xs">Synchronizing Core OS...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (activePage === 'box-display') {
    return <BoxDisplay />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'members':
        return (
          <ProtectedRoute allowedRoles={['admin', 'coach', 'receptionist']}>
            <Members userProfile={userProfile} />
          </ProtectedRoute>
        );
      case 'leads':
        return (
          <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
            <Leads />
          </ProtectedRoute>
        );
      case 'wods':
        return <Wods />;
      case 'analytics':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        );
      case 'settings':
        return <Settings />;
      case 'schedule':
        return <Schedule />;
      case 'billing':
        return (
          <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
            <Billing />
          </ProtectedRoute>
        );
      case 'roles':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <Roles />
          </ProtectedRoute>
        );
      case 'audit-logs':
        return (
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        );
      case 'benchmarks':
        return <Benchmarks />;
      case 'competitions':
        return (
          <ProtectedRoute allowedRoles={['admin', 'coach']}>
            <Competitions />
          </ProtectedRoute>
        );
      case 'movements':
        return (
          <ProtectedRoute allowedRoles={['admin', 'coach']}>
            <Movements />
          </ProtectedRoute>
        );
      case 'profile':
        return <Profile />;
      case 'dashboard':
      default:
        return <Dashboard userProfile={userProfile} />;
    }
  };

  return (
    <MainLayout
      activePage={activePage}
      onNavigate={setActivePage}
      userProfile={userProfile}
    >
      {renderPage()}
    </MainLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

