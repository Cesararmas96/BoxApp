import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MainLayout } from './layouts/MainLayout';
import { Login } from './pages/Login';
import { Members } from './pages/Members';
import { Leads } from './pages/Leads';
import { Wods } from './pages/Wods';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Dashboard } from './pages/Dashboard';
import { Schedule } from './pages/Schedule';
import { Billing } from './pages/Billing';
import { Benchmarks } from './pages/Benchmarks';
import { ThemeProvider } from './components/theme-provider';
import './index.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, role_id')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  if (!session) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Login />
      </ThemeProvider>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'members':
        return <Members />;
      case 'leads':
        return <Leads />;
      case 'wods':
        return <Wods />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'schedule':
        return <Schedule />;
      case 'billing':
        return <Billing />;
      case 'benchmarks':
        return <Benchmarks />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <MainLayout
        activePage={activePage}
        onNavigate={setActivePage}
        userProfile={userProfile}
      >
        {renderPage()}
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
