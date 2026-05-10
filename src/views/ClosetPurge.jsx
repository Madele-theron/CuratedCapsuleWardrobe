import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, CheckCircle2, Circle, PencilLine, X } from 'lucide-react';

const DEFAULT_MISSION = [
  { title: 'Step 1: The "Best Base" Test', description: 'Put on favorite trousers & shoes. Test all clothing against this clean base.' },
  { title: 'Step 2: The Three-Pile Sort', description: '30 min timer: 1. North Star Core (Keep), 2. The Almost (Tailor), 3. Friction (Purge).' },
  { title: 'Step 3: The "Ghost" Shopping List', description: 'Note the missing pieces needed to complete your current combinations.' },
  { title: 'Step 4: The "Uniform" Trial', description: 'Wear tomorrow\'s outfit today. See if you act differently or focus better.' },
  { title: 'The "Wildcard" Tactical Tip', description: 'Test belts and jewelry before writing an item off completely.' }
];

export default function ClosetPurge() {
  const [todos, setTodos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchAndSeedData();
  }, []);

  const fetchAndSeedData = async () => {
    let { data } = await supabase.from('todos').select('*').order('created_at', { ascending: true });
    
    if ((!data || data.length === 0)) {
      await supabase.from('todos').insert(DEFAULT_MISSION);
      const { data: refreshed } = await supabase.from('todos').select('*').order('created_at', { ascending: true });
      data = refreshed;
    }
    setTodos(data || []);
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = !currentStatus;
    setTodos(todos.map(t => t.id === id ? { ...t, is_done: newStatus } : t));
    await supabase.from('todos').update({ is_done: newStatus }).eq('id', id);
  };

  const saveTodo = async () => {
    if (!formData.title) return alert("Title is required");
    const payload = { title: formData.title, description: formData.description };

    if (editingId) {
      await supabase.from('todos').update(payload).eq('id', editingId);
    } else {
      await supabase.from('todos').insert([payload]);
    }

    setShowModal(false);
    setEditingId(null);
    setFormData({ title: '', description: '' });
    fetchAndSeedData();
  };

  const deleteTodo = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete permanently?")) {
      await supabase.from('todos').delete().eq('id', id);
      fetchAndSeedData();
    }
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

  const completedCount = todos.filter(t => t.is_done).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <div><h1>Closet Purge</h1></div>
        <button className="btn-primary" onClick={openAdd}>Add Item</button>
      </header>

      <div className="content-scroll-area">
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px' }}>
            <div style={{ height: '100%', background: 'var(--accent)', width: `${progressPercent}%`, transition: 'width 0.4s' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todos.map((todo) => (
            <div key={todo.id} onClick={() => toggleStatus(todo.id, todo.is_done)} style={{ display: 'flex', gap: '15px', padding: '20px', background: 'white', border: '1px solid #eee', borderRadius: '12px', cursor: 'pointer', opacity: todo.is_done ? 0.6 : 1 }}>
              <div>{todo.is_done ? <CheckCircle2 size={20} color="green" /> : <Circle size={20} color="#ccc" />}</div>
              <div style={{ flexGrow: 1 }}>
                <strong style={{ textDecoration: todo.is_done ? 'line-through' : 'none' }}>{todo.title}</strong>
                {todo.description && <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{todo.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <PencilLine size={16} color="#aaa" onClick={(e) => openEdit(todo, e)} />
                <Trash2 size={16} color="#aaa" onClick={(e) => deleteTodo(todo.id, e)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit' : 'New Task'}</h2>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Task name" style={{ width: '100%', marginTop: '15px' }} />
            <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Notes" style={{ width: '100%', marginTop: '15px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={saveTodo} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
