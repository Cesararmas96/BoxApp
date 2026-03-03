import React, { useEffect } from 'react';
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
import { SuspendedScreen } from './components/SuspendedScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider, useTenant } from './contexts/TenantContext';
import './index.css';

// ── Inline screen for unknown tenant slugs ──────────────────────────────────
const TenantNotFoundScreen: React.FC = () => (
  <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4">
    <div className="text-center space-y-4 max-w-sm">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
        <span className="text-2xl">🔍</span>
      </div>
      <h1 className="text-xl font-bold">Box no encontrado</h1>
      <p className="text-sm text-white/40">
        Este box no existe o ha sido eliminado.
      </p>
      <a
        href="/register"
        className="inline-block text-sm text-white/50 hover:text-white transition-colors mt-2"
      >
        ¿Quieres registrar tu box? →
      </a>
    </div>
  </div>
);

// ── Inline loading spinner ──────────────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
      <p className="text-sm text-muted-foreground">Cargando...</p>
    </div>
  </div>
);

// ── AppContent — requires both TenantContext and AuthContext ─────────────────
function AppContent() {
  const { isSuspended, tenantNotFound, isLoading: tenantLoading } = useTenant();
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

  // 1. Wait for tenant resolution (slug → box fetch)
  if (tenantLoading) {
    return <LoadingSpinner />;
  }

  // 2. Unknown slug — show friendly error instead of blank screen
  if (tenantNotFound) {
    return <TenantNotFoundScreen />;
  }

  // 3. Suspended tenant — block ALL access, including authenticated users
  if (isSuspended) {
    return <SuspendedScreen />;
  }

  // 4. Wait for auth session resolution
  if (loading) {
    return <LoadingSpinner />;
  }

  // 5. Unauthenticated — show public routes only
  if (!session) {
    const hasOAuthHash =
      window.location.hash.includes('access_token=') ||
      window.location.hash.includes('refresh_token=') ||
      window.location.hash.includes('error=');

    return (
      <Routes>
        {/* OAuth callback — must be available before session is established */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Root hash from some OAuth providers (e.g. magic link) */}
        <Route path="/" element={hasOAuthHash ? <AuthCallback /> : <Navigate to="/login" replace />} />
        {/* Main login — used by all users and super-admin */}
        <Route path="/login" element={<Login />} />
        {/* Self-service box registration */}
        <Route path="/register" element={<RegisterBox />} />
        {/* Admin redirects to login when unauthenticated */}
        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (userProfile?.force_password_change) {
    return <ForceChangePassword />;
  }

  // Super-admin: root user sees the admin panel
  const isSuperAdmin =
    session?.user?.email === 'root@test.com' ||
    session?.user?.user_metadata?.is_root === true;

  return (
    <Routes>
      {/* ── Super-admin panel ── */}
      <Route
        path="/admin"
        element={isSuperAdmin ? <SuperAdmin /> : <Navigate to="/dashboard" replace />}
      />

      {/* Standalone pages (no layout wrapper) */}
      <Route path="/box-display" element={<BoxDisplay />} />
      <Route path="/competitions/:id/live" element={<LiveLeaderboard />} />

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

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />} />
        <Route path="*" element={<Navigate to={isSuperAdmin ? '/admin' : '/dashboard'} replace />} />
      </Route>
    </Routes>
  );
}

// ── Bridge: reads TenantContext to inject tenantBoxId into AuthProvider ──────
function AuthProviderWithTenant({ children }: { children: React.ReactNode }) {
  const { tenantBox } = useTenant();
  return (
    <AuthProvider tenantBoxId={tenantBox?.id}>
      {children}
    </AuthProvider>
  );
}

// ── Root: TenantProvider → BrowserRouter → AuthProviderWithTenant → AppContent
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <TenantProvider>
        <BrowserRouter>
          <AuthProviderWithTenant>
            <AppContent />
          </AuthProviderWithTenant>
        </BrowserRouter>
      </TenantProvider>
    </ThemeProvider>
  );
}

export default App;
