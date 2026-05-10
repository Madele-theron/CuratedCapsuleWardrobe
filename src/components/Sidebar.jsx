import { Palette, ShoppingBag, LayoutTemplate, Settings, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Sidebar = ({ activeView, setActiveView }) => {
  const menuItems = [
    { id: 'moodboard', label: 'Moodboard', icon: Palette },
    { id: 'shopping', label: 'Shopping List', icon: ShoppingBag },
    { id: 'scrapbook', label: 'Outfit Recreate', icon: LayoutTemplate },
    { id: 'purge', label: 'Closet Purge', icon: Sparkles },
  ];

  return (
    <div className="sidebar">
      <div className="app-logo" style={{ color: 'var(--accent-dark)', letterSpacing: '1px' }}>
        STUDIO NORTH STAR
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
      <div className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }} onClick={() => supabase.auth.signOut()}>
        <LogOut size={20} />
        <span>Sign Out</span>
      </div>
    </div>
  );
};

export default Sidebar;
