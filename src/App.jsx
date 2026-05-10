import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Sidebar from './components/Sidebar';
import Moodboard from './views/Moodboard';
import Kanban from './views/Kanban';
import Scrapbook from './views/Scrapbook';
import ClosetPurge from './views/ClosetPurge';
import Auth from './components/Auth';
import { DataProvider } from './context/DataContext';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('moodboard');

  useEffect(() => {
    // Get active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display' }}>
        <h3>Loading Studio...</h3>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'moodboard':
        return <Moodboard />;
      case 'shopping':
        return <Kanban />;
      case 'scrapbook':
        return <Scrapbook />;
      case 'purge':
        return <ClosetPurge />;
      default:
        return <Moodboard />;
    }
  };

  return (
    <DataProvider session={session}>
      <div className="app-layout">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </DataProvider>
  );
}

export default App;
