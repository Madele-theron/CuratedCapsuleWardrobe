import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { readFileAsDataURL } from '../hooks/useFileReader';
import { Plus, Trash2, Image as ImageIcon, Droplet, UploadCloud } from 'lucide-react';

export default function Moodboard() {
  const [swatches, setSwatches] = useState([]);
  const [inspoPhotos, setInspoPhotos] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSwatch, setNewSwatch] = useState({ name: '', type: 'color', data: '#ffffff' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: swt } = await supabase.from('swatches').select('*').order('created_at', { ascending: true });
    const { data: inspo } = await supabase.from('inspo_photos').select('*').order('created_at', { ascending: false });
    setSwatches(swt || []);
    setInspoPhotos(inspo || []);
  };

  const handleSwatchFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await readFileAsDataURL(file);
      setNewSwatch({ ...newSwatch, data: base64, type: 'texture' });
    }
  };

  const handleInspoUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      const base64 = await readFileAsDataURL(file);
      await supabase.from('inspo_photos').insert([{ data: base64 }]);
    }
    fetchData();
  };

  const saveSwatch = async () => {
    if (!newSwatch.name) return alert('Please give your swatch a name.');
    
    await supabase.from('swatches').insert([{
      type: newSwatch.type,
      name: newSwatch.name,
      data: newSwatch.data
    }]);
    
    setShowAddModal(false);
    setNewSwatch({ name: '', type: 'color', data: '#ffffff' });
    fetchData();
  };

  const deleteSwatch = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Delete this swatch?")) {
      await supabase.from('swatches').delete().eq('id', id);
      fetchData();
    }
  };

  const deleteInspoPhoto = async (id, e) => {
    e.stopPropagation();
    if(window.confirm("Remove this inspiration photo?")) {
      await supabase.from('inspo_photos').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <h1 style={{ fontSize: '24px' }}>The Moodboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input type="file" multiple accept="image/*" id="bulkInspoUpload" style={{ display: 'none' }} onChange={handleInspoUpload} />
          <label htmlFor="bulkInspoUpload" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <UploadCloud size={16} />
            <span>Upload Inspo Screenshots</span>
          </label>
          <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>New Swatch</span>
          </button>
        </div>
      </header>

      <div className="content-scroll-area">
        
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h2 style={{ fontSize: '18px', fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Foundational Palette
          </h2>
        </div>
        
        <div className="swatch-grid">
          {swatches.map(swatch => (
            <div key={swatch.id} className="swatch-item">
              {swatch.type === 'color' ? (
                <div style={{ flexGrow: 1, backgroundColor: swatch.data }} />
              ) : (
                <img src={swatch.data} alt={swatch.name} style={{ flexGrow: 1, objectFit: 'cover', height: '100%', width: '100%' }} />
              )}
              <div className="swatch-info">
                {swatch.name}
              </div>
              <button 
                onClick={(e) => deleteSwatch(swatch.id, e)}
                style={{ 
                  position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,255,255,0.85)',
                  border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  backdropFilter: 'blur(4px)'
                }}>
                <Trash2 size={12} color="#B04B4B" />
              </button>
            </div>
          ))}
          
          <div 
            onClick={() => setShowAddModal(true)}
            style={{ 
              aspectRatio: '1', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-muted)', transition: 'var(--transition)'
            }}
          >
            <Plus size={20} style={{ marginBottom: '4px' }} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>Add Swatch</span>
          </div>
        </div>

        <div style={{ marginTop: '56px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Style & Outfit Inspiration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Your visuals saved securely to the cloud.</p>
        </div>

        {inspoPhotos.length === 0 ? (
          <label htmlFor="bulkInspoUpload" style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            height: '240px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            color: 'var(--text-muted)'
          }}>
            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontStyle: 'italic' }}>No inspiration items yet.</p>
          </label>
        ) : (
          <div className="inspo-grid">
            {inspoPhotos.map(photo => (
              <div key={photo.id} className="inspo-item">
                <img src={photo.data} className="inspo-image" loading="lazy" />
                <div className="action-overlay">
                  <button 
                    onClick={(e) => deleteInspoPhoto(photo.id, e)}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', 
                      width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                    <Trash2 size={14} color="#B04B4B" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>New Palette Swatch</h2>
            
            <div className="form-group">
              <label>Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className={`btn-outline`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: newSwatch.type === 'color' ? '2px solid var(--accent)' : '1px solid var(--border)', background: newSwatch.type === 'color' ? 'var(--accent-light)' : '' }}
                  onClick={() => setNewSwatch({ ...newSwatch, type: 'color', data: '#d0b393' })}
                >
                  <Droplet size={16} /> Solid Color
                </button>
                <button 
                  className={`btn-outline`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: newSwatch.type === 'texture' ? '2px solid var(--accent)' : '1px solid var(--border)', background: newSwatch.type === 'texture' ? 'var(--accent-light)' : '' }}
                  onClick={() => setNewSwatch({ ...newSwatch, type: 'texture', data: '' })}
                >
                  <ImageIcon size={16} /> Fabric/Texture
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Swatch Name</label>
              <input 
                type="text" placeholder="e.g. Camel Cashmere" 
                style={{ width: '100%' }} value={newSwatch.name}
                onChange={e => setNewSwatch({ ...newSwatch, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Visual Content</label>
              {newSwatch.type === 'color' ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <input 
                    type="color" value={newSwatch.data}
                    onChange={e => setNewSwatch({ ...newSwatch, data: e.target.value })}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" value={newSwatch.data}
                    onChange={e => setNewSwatch({ ...newSwatch, data: e.target.value })}
                    style={{ flexGrow: 1 }}
                  />
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*" onChange={handleSwatchFileUpload} style={{ display: 'none' }} id="fileInputSwatch" />
                  <label htmlFor="fileInputSwatch" style={{ display: 'block', border: '2px dashed var(--border)', padding: '30px', textAlign: 'center', cursor: 'pointer' }}>
                    {newSwatch.data ? (
                      <img src={newSwatch.data} style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px' }} />
                    ) : (
                      <>Upload Texture Screenshot</>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSwatch}>Add to Palette</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
