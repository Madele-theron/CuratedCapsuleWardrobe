import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useData } from '../context/DataContext';
import { Plus, Trash2, CheckCircle2, Circle, PencilLine, X, Loader2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const DEFAULT_MISSION = [
  {
    title: 'Step 1: The "Best Base" Test',
    description: 'Put on your absolute favorite pair of trousers and your most comfortable "nice" shoes. This is your "control group". As you go through your closet, you aren\'t just looking at clothes; you are testing them against this base. If a top doesn\'t look "Elegant and Clean" when paired with your best trousers, it likely doesn\'t belong in your new vision.'
  },
  {
    title: 'Step 2: The Three-Pile Sort',
    description: 'Set a timer for 30 minutes to identify the "low-hanging fruit".\n\n• The North Star Core: Fits your analyzed aesthetic perfectly.\n• The "Almost" Items: Love the color/fabric, but fit is off. (Tailor Bag).\n• The Friction Items: Makes you feel frumpy or holds bad memories. (Purge).'
  },
  {
    title: 'Step 3: The "Ghost" Shopping List',
    description: 'Notice "ghosts"—items that should be there to make an outfit work but are missing. (Example: perfect wide-leg trousers, but no high-neck tank to tuck into them). Add to Priority 1 list.'
  },
  {
    title: 'Step 4: The "Uniform" Trial',
    description: 'Pick one outfit from your "North Star Core" pile and hang it outside your door for tomorrow. Wear it while tackling your routine tasks. Notice if you act differently, focus better, or feel more assertive.'
  },
  {
    title: 'The "Wildcard" Tactical Tip',
    description: 'Check jewelry and belts. Sometimes an outfit fails simple because it lacks a belt or gold accent. Cinch a friction item before deciding to toss it.'
  }
];

export default function ClosetPurge() {
  const { todos, setTodos, loadTodos } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(todos === null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  useEffect(() => {
    fetchAndSeedData();
  }, []);

  const fetchAndSeedData = async (force = false) => {
    try {
      let data = await loadTodos(force);
      
      if (!data || data.length === 0) {
        await supabase.from('todos').insert(DEFAULT_MISSION);
        data = await loadTodos(true); // Re-fetch forced
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    setTodos(todos.map(t => t.id === id ? { ...t, is_done: newStatus } : t));
    await supabase.from('todos').update({ is_done: newStatus }).eq('id', id);
  };

  const triggerWarning = (msg) => {
    setConfirmState({
      isOpen: true,
      title: "Missing Info",
      message: msg,
      type: 'warning',
      onConfirm: () => setConfirmState({ isOpen: false })
    });
  };

  const saveTodo = async () => {
    if (!formData.title) return triggerWarning("Please provide a task name.");
    const payload = { title: formData.title, description: formData.description };

    if (editingId) {
      await supabase.from('todos').update(payload).eq('id', editingId);
    } else {
      await supabase.from('todos').insert([payload]);
    }

    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', description: '' });
    fetchAndSeedData(true);
  };

  const triggerDelete = (id, e) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: "Delete step?",
      message: "This will permanently remove this guideline from your purge checklist.",
      type: 'danger',
      onConfirm: async () => {
        setConfirmState({ isOpen: false });
        await supabase.from('todos').delete().eq('id', id);
        fetchAndSeedData(true);
      }
    });
  };

  const openEdit = (todo, e) => {
    e.stopPropagation();
    setEditingId(todo.id);
    setFormData({ title: todo.title, description: todo.description });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ title: '', description: '' });
    setShowModal(true);
  };

  const safeTodos = todos || [];
  const completedCount = safeTodos.filter(t => t.is_done).length;
  const progressPercent = safeTodos.length > 0 ? Math.round((completedCount / safeTodos.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--accent)' }} />
        <p>Loading checklist...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <div>
          <h1 style={{ fontSize: '24px' }}>Closet Purge Mission</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>The North Star Filter Audit</p>
        </div>
        <button className="btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </header>

      <div className="content-scroll-area">
        <div style={{ background: 'white', border: '1px solid var(--border-subtle)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '15px' }}>Mission Progress</span>
            <span style={{ color: 'var(--accent-dark)', fontWeight: 600 }}>{progressPercent}% Completed</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--bg-app)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${progressPercent}%`, transition: 'width 0.5s ease-out' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' }}>
          {safeTodos.map((todo) => {
            const isDone = todo.is_done;
            return (
              <div 
                key={todo.id} 
                onClick={() => toggleStatus(todo.id, todo.is_done)}
                style={{ 
                  display: 'flex', gap: '16px', padding: '20px', background: isDone ? 'transparent' : 'white', 
                  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  transition: 'all 0.2s ease', boxShadow: isDone ? 'none' : 'var(--shadow-sm)',
                  opacity: isDone ? 0.7 : 1
                }}
              >
                <div style={{ paddingTop: '2px' }}>
                  {isDone ? (
                    <CheckCircle2 size={22} color="var(--accent)" />
                  ) : (
                    <Circle size={22} color="#D1D5DB" />
                  )}
                </div>
                
                <div style={{ flexGrow: 1 }}>
                  <h3 style={{ 
                    fontSize: '16px', fontWeight: 600, color: 'var(--text-main)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    fontFamily: 'Inter'
                  }}>
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p style={{ 
                      fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5,
                      whiteSpace: 'pre-line'
                    }}>
                      {todo.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                  <button onClick={(e) => openEdit(todo, e)} style={{ border: 'none', background: 'transparent', color: '#A1A1AA', padding: '4px', cursor: 'pointer' }}>
                    <PencilLine size={16} />
                  </button>
                  <button onClick={(e) => triggerDelete(todo.id, e)} style={{ border: 'none', background: 'transparent', color: '#A1A1AA', padding: '4px', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>{editingId ? 'Edit Item' : 'New Step'}</h2>
              <X size={20} onClick={() => setShowModal(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%' }} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={5} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTodo}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
