import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { readFileAsDataURL } from '../hooks/useFileReader';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Trash2, ExternalLink, Pencil } from 'lucide-react';

const COLUMNS = [
  { id: 'urgent', title: '🚨 High Priority', color: 'var(--status-urgent)' },
  { id: 'planning', title: '📝 Planning', color: 'var(--status-planning)' },
  { id: 'waiting', title: '⏳ Waiting Room', color: 'var(--status-waiting)' },
  { id: 'bought', title: '✅ Acquired', color: 'var(--status-bought)' },
];

export default function Kanban() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', urls: '', category: '', image: null });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: true });
    setItems(data || []);
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const itemId = parseInt(draggableId);
    const newStatus = destination.droppableId;

    setItems(items.map(it => it.id === itemId ? { ...it, status: newStatus } : it));
    await supabase.from('items').update({ status: newStatus }).eq('id', itemId);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if(file) {
      const b64 = await readFileAsDataURL(file);
      setFormData({...formData, image: b64});
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', urls: '', category: '', image: null });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      price: item.price || '',
      category: item.category || '',
      urls: Array.isArray(item.urls) ? item.urls.join('\n') : '',
      image: item.image || null
    });
    setShowModal(true);
  };

  const saveItem = async () => {
    if (!formData.name) return alert("Please name your item");
    
    const itemPayload = {
      name: formData.name,
      price: parseFloat(formData.price) || null,
      category: formData.category,
      urls: formData.urls.split('\n').filter(l => l.trim() !== ''),
      image: formData.image
    };

    if (editingId) {
      await supabase.from('items').update(itemPayload).eq('id', editingId);
    } else {
      await supabase.from('items').insert([{
        ...itemPayload,
        status: 'planning'
      }]);
    }
    
    setShowModal(false);
    setFormData({ name: '', price: '', urls: '', category: '', image: null });
    setEditingId(null);
    fetchItems();
  };

  const deleteItem = async (id) => {
    if(window.confirm("Remove item from wishlist?")) {
      await supabase.from('items').delete().eq('id', id);
      fetchItems();
    }
  };

  const getColumnItems = (colId) => items.filter(i => i.status === colId);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="header-bar">
        <h1 style={{ fontSize: '24px' }}>Shopping List</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Syncing to Cloud</span>
          <button className="btn-primary" onClick={openAddModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Add Item</span>
          </button>
        </div>
      </header>

      <div className="content-scroll-area" style={{ overflow: 'hidden' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-container">
            {COLUMNS.map(col => (
              <div className="kanban-column" key={col.id}>
                <div className="column-header" style={{ borderTop: `3px solid ${col.color}` }}>
                  <span>{col.title}</span>
                  <span className="column-count">{getColumnItems(col.id).length}</span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div className="item-list scrollbar-hide" {...provided.droppableProps} ref={provided.innerRef}>
                      {getColumnItems(col.id).map((item, index) => (
                        <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                          {(provided) => (
                            <div 
                              className="card" 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps}
                              onDoubleClick={() => handleEditClick(item)}
                            >
                              {item.image && <img src={item.image} className="card-thumb" />}
                              <div className="card-title">{item.name}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span className="card-price">{item.price ? `R ${item.price}` : '—'}</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {item.urls && item.urls.length > 0 && (
                                    <a href={item.urls[0]} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: 'var(--accent)' }}>
                                      <ExternalLink size={14} />
                                    </a>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleEditClick(item); }} style={{ border: 'none', background: 'none', color: '#aaa', cursor: 'pointer' }}>
                                    <Pencil size={14} />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} style={{ border: 'none', background: 'none', color: '#aaa', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingId ? 'Edit Item' : 'Add Item'}</h2>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Product Photo</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} id="prodImage" />
              <label htmlFor="prodImage" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--border)', padding: '20px', height: '140px', cursor: 'pointer' }}>
                {formData.image ? (
                  <img src={formData.image} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <>
                    <Plus size={24} style={{ color: 'var(--text-muted)' }} />
                    <span>Upload Photo</span>
                  </>
                )}
              </label>
            </div>

            <div className="form-group">
              <label>Item Name</label>
              <input type="text" style={{ width: '100%' }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Category</label>
                <input type="text" style={{ width: '100%' }} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price</label>
                <input type="number" style={{ width: '100%' }} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label>URLs (One per line)</label>
              <textarea style={{ width: '100%', minHeight: '80px' }} value={formData.urls} onChange={e => setFormData({ ...formData, urls: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
              <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveItem}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
