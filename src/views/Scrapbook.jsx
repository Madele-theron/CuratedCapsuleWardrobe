import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { supabase } from '../lib/supabaseClient';
import { readFileAsDataURL } from '../hooks/useFileReader';
import { Plus, Trash2, Image as ImageIcon, Layers, ShoppingBag, ChevronLeft, Calendar, Loader2 } from 'lucide-react';

export default function Scrapbook() {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [activeBoardName, setActiveBoardName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [elements, setElements] = useState([]);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [inspoPhotos, setInspoPhotos] = useState([]);
  const [showAssetDrawer, setShowAssetDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    if (activeBoardId) {
      loadWorkspace(activeBoardId);
      loadAssets();
    }
  }, [activeBoardId]);

  const loadBoards = async () => {
    try {
      const { data } = await supabase.from('scrapbooks').select('*').order('created_at', { ascending: false });
      setBoards(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setNewBoardName(`New Outfit ${boards.length + 1}`);
    setShowModal(true);
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return alert("Name required");
    const { data, error } = await supabase.from('scrapbooks').insert([{ name: newBoardName }]).select();
    if (error) return alert(error.message);
    loadBoards();
    setActiveBoardId(data[0].id);
    setActiveBoardName(newBoardName);
    setShowModal(false);
  };

  const deleteBoard = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Delete this board and its assets forever?")) {
      await supabase.from('scrapbooks').delete().eq('id', id);
      loadBoards();
    }
  };

  const openBoard = (board) => {
    setIsLoading(true);
    setActiveBoardId(board.id);
    setActiveBoardName(board.name);
  };

  const loadWorkspace = async (boardId) => {
    try {
      const { data } = await supabase.from('scrapbook_elements').select('*').eq('scrapbook_id', boardId);
      setElements(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssets = async () => {
    const { data: items } = await supabase.from('items').select('*');
    const { data: inspo } = await supabase.from('inspo_photos').select('*');
    setShoppingItems((items || []).filter(i => i.image));
    setInspoPhotos(inspo || []);
  };

  const addElementToCanvas = async (dataUrl) => {
    setIsUploading(true);
    try {
      const newEl = {
        scrapbook_id: activeBoardId,
        type: 'image',
        content: dataUrl,
        x: 100 + (Math.random() * 50),
        y: 100 + (Math.random() * 50),
        width: 200,
        height: 200,
        z_index: elements.length + 1
      };
      const { data } = await supabase.from('scrapbook_elements').insert([newEl]).select();
      if (data) setElements([...elements, data[0]]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const b64 = await readFileAsDataURL(file);
      addElementToCanvas(b64);
    }
  };

  const updateElement = async (id, updates) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    const mapped = {};
    if (updates.x !== undefined) mapped.x = updates.x;
    if (updates.y !== undefined) mapped.y = updates.y;
    if (updates.width !== undefined) mapped.width = updates.width;
    if (updates.height !== undefined) mapped.height = updates.height;
    if (updates.zIndex !== undefined) mapped.z_index = updates.zIndex;
    await supabase.from('scrapbook_elements').update(mapped).eq('id', id);
  };

  const deleteElement = async (id) => {
    await supabase.from('scrapbook_elements').delete().eq('id', id);
    setElements(elements.filter(el => el.id !== id));
  };

  const bringToFront = async (id) => {
    const maxZ = elements.reduce((max, el) => Math.max(max, el.z_index || 0), 0);
    await updateElement(id, { zIndex: maxZ + 1 });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--accent)' }} />
        <p>Accessing your outfits studio...</p>
      </div>
    );
  }

  if (!activeBoardId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <header className="header-bar">
          <h1 style={{ fontSize: '24px' }}>Outfit Library</h1>
          <button className="btn-primary" onClick={handleOpenModal} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>New Outfit</span>
          </button>
        </header>
        <div className="content-scroll-area">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
            <div onClick={handleOpenModal} style={{ height: '220px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', background: 'var(--bg-panel)' }}>
              <Plus size={28} />
              <span>Create New Board</span>
            </div>
            {boards.map(board => (
              <div key={board.id} onClick={() => openBoard(board)} style={{ height: '220px', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', position: 'relative', cursor: 'pointer' }}>
                <div style={{ flexGrow: 1, height: '70%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                  <ImageIcon size={40} style={{ opacity: 0.1 }} />
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid #eee' }}>
                  <h3 style={{ fontSize: '15px' }}>{board.name}</h3>
                  <button onClick={(e) => deleteBoard(board.id, e)} style={{ position: 'absolute', top: '8px', right: '8px', border: 'none', background: 'white', borderRadius: '50%', width: '24px', height: '24px' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <h2>Name Your Outfit Board</h2>
              <input autoFocus type="text" value={newBoardName} onChange={e => setNewBoardName(e.target.value)} style={{ width: '100%', marginTop: '16px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '12px' }}>
                <button className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleCreateBoard}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <header className="header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => setActiveBoardId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <ChevronLeft size={18} /> Back
          </button>
          <h1>{activeBoardName}</h1>
          {isUploading && (
            <span style={{ fontSize: '11px', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Loader2 size={12} className="animate-spin" /> Uploading...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-outline" onClick={() => setShowAssetDrawer(!showAssetDrawer)}>Assets & Inspo</button>
          <input type="file" id="canvupl" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploading} />
          <label htmlFor="canvupl" className="btn-primary" style={{ cursor: isUploading ? 'wait' : 'pointer', display: 'flex', gap: 8, alignItems: 'center', opacity: isUploading ? 0.7 : 1 }}>
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>Upload</span>
          </label>
        </div>
      </header>
      <div ref={canvasRef} className="canvas-bg" style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', margin: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
        {elements.map((el) => (
          <Rnd
            key={el.id}
            size={{ width: el.width, height: el.height }}
            position={{ x: el.x, y: el.y }}
            onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
            onResizeStop={(e, direction, ref, delta, pos) => updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...pos })}
            lockAspectRatio={true}
            bounds="parent"
            style={{ zIndex: el.z_index }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img src={el.content} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'auto' }} alt="" />
              <div onClick={() => deleteElement(el.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={12} color="red" />
              </div>
              <div onClick={() => bringToFront(el.id)} style={{ position: 'absolute', bottom: 4, right: 4, background: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Layers size={12} />
              </div>
            </div>
          </Rnd>
        ))}
      </div>
      {showAssetDrawer && (
        <div style={{ position: 'absolute', right: 0, top: 70, bottom: 0, width: '300px', background: 'white', zIndex: 50, padding: 20, borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3>Assets</h3>
            <button onClick={() => setShowAssetDrawer(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button onClick={() => setActiveTab('items')} style={{ flex: 1, background: activeTab === 'items' ? '#f0f0f0' : 'none', border: '1px solid #ddd', borderRadius: 4, padding: 6, cursor: 'pointer' }}>Wishlist</button>
            <button onClick={() => setActiveTab('inspo')} style={{ flex: 1, background: activeTab === 'inspo' ? '#f0f0f0' : 'none', border: '1px solid #ddd', borderRadius: 4, padding: 6, cursor: 'pointer' }}>Inspo</button>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflowY: 'auto' }}>
            {activeTab === 'items' ? shoppingItems.map(i => (
              <div key={i.id} onClick={() => !isUploading && addElementToCanvas(i.image)} style={{ cursor: isUploading ? 'wait' : 'pointer', border: '1px solid #eee', padding: 4, borderRadius: 4 }}>
                <img src={i.image} style={{ width: '100%', height: 80, objectFit: 'contain' }} alt="" />
              </div>
            )) : inspoPhotos.map(p => (
              <div key={p.id} onClick={() => !isUploading && addElementToCanvas(p.data)} style={{ cursor: isUploading ? 'wait' : 'pointer', border: '1px solid #eee', padding: 4, borderRadius: 4 }}>
                <img src={p.data} style={{ width: '100%', height: 80, objectFit: 'cover' }} alt="" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
