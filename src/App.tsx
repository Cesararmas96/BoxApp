import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
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
import { LiveLeaderboard } from './pages/LiveLeaderboard';
import { ForceChangePassword } from './pages/ForceChangePassword';
import { SuperAdmin } from './pages/SuperAdmin';
import { RegisterBox } from './pages/RegisterBox';
import { ThemeProvider, useTheme } from './components/theme-provider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';

function AppContent() {
  const { session, userProfile, currentBox, loading } = useAuth();
  const { setPrimaryColor, setRadius, setDesignStyle } = useTheme();

  useEffect(() => {
    if (currentBox) {
      // Update Branding (Title & Favicon)
      const baseTitle = 'BoxApp';
      const boxName = currentBox.name || 'CrossFit Management';
      document.title = `${boxName} | ${baseTitle}`;

      if (currentBox.favicon_url) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = currentBox.favicon_url;
      }

      // Update Theme Config
      if (currentBox.theme_config) {
        const config = currentBox.theme_config as any;
        if (config.primaryColor) setPrimaryColor(config.primaryColor);
        if (config.radius) setRadius(config.radius);
        if (config.designStyle) setDesignStyle(config.designStyle);
      }
    }
  }, [currentBox, setPrimaryColor, setRadius, setDesignStyle]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    const hasOAuthHash =
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('refresh_token=') ||
      window.location.hash.includes('error=');

    return (
      <Routes>
        {/* OAuth callback — must be available before session is fully established */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Some providers may return tokens on root hash (/#access_token=...). Handle that too. */}
        <Route path="/" element={hasOAuthHash ? <AuthCallback /> : <Navigate to="/login" replace />} />
        {/* Multi-tenant: box-specific login via slug */}
        <Route path="/box/:boxSlug" element={<Login />} />
        {/* Default login — also used by super-admin */}
        <Route path="/login" element={<Login />} />
        {/* Self-service box registration */}
        <Route path="/register" element={<RegisterBox />} />
        {/* Admin route redirects to login when unauthenticated */}
        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (userProfile?.force_password_change) {
    return <ForceChangePassword />;
  }

  // Super-admin: root user sees the admin panel
  const isSuperAdmin = session?.user?.email === 'root@test.com' || session?.user?.user_metadata?.is_root === true;

  return (
    <Routes>
      {/* ── Super-admin panel ── */}
      <Route
        path="/admin"
        element={
          isSuperAdmin ? <SuperAdmin /> : <Navigate to="/dashboard" replace />
        }
      />

      {/* Standalone pages */}
      <Route path="/box-display" element={<BoxDisplay />} />
      <Route path="/competitions/:id/live" element={<LiveLeaderboard />} />

      {/* Multi-tenant: box-specific login (redirect to dashboard if already logged in) */}
      <Route path="/box/:boxSlug" element={<Navigate to="/dashboard" replace />} />

      {/* Layout wrapper pages */}
      <Route element={<MainLayout userProfile={userProfile} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route
          path="/members"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coach', 'receptionist']}>
              <Members userProfile={userProfile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
              <Leads />
            </ProtectedRoute>
          }
        />
        <Route path="/wods" element={<Wods />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
              <Billing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roles"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Roles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route
          path="/competitions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coach']}>
              <Competitions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movements"
          element={
            <ProtectedRoute allowedRoles={['admin', 'coach']}>
              <Movements />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />

        {/* Default Redirect — root goes to admin panel, others to dashboard */}
        <Route path="/" element={<Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />} />
        <Route path="*" element={<Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

