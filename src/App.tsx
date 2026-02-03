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
import './index.css';

function App() {
  const [session, setSession] = useState<any>(null);
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Login />;
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
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </MainLayout>
  );
}

export default App;
