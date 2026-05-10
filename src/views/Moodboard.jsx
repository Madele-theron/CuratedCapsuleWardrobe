import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useData } from '../context/DataContext';
import { readFileAsDataURL } from '../hooks/useFileReader';
import { Plus, Trash2, Image as ImageIcon, Droplet, UploadCloud, Loader2, Pencil, PlusCircle, Edit3, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';

const DEFAULT_PALETTE = [
  {
    category: "The Foundation Pillars (70%)",
    items: [
      { name: "Crisp Porcelain", data: "#F9F9F9", desc: "Cotton tees, linen shirts, summer trousers." },
      { name: "Warm Oat", data: "#E8E2D6", desc: "Knitted vests, trench coats, wool trousers." },
      { name: "Classic Camel", data: "#D2B48C", desc: "Structured blazers, leather belts, loafers." },
      { name: "Soft Onyx", data: "#1A1A1A", desc: "Evening trousers, cinched waist dresses, boots." },
      { name: "Heather Slate", data: "#8E9196", desc: "Relaxed lounge sets, lightweight knits." }
    ]
  },
  {
    category: "The Jewel Accents (20%)",
    items: [
      { name: "Deep Burgundy", data: "#630D16", desc: "Mock-neck sleeveless tops, evening skirts." },
      { name: "Midnight Teal", data: "#0E4D44", desc: "Flowy midi dresses, silk scarves." },
      { name: "Muted Olive", data: "#4B5332", desc: "Utility-style trousers, structured waistcoats." },
      { name: "Highland Sage", data: "#A3B18A", desc: "Lightweight spring sweaters, linen vests." },
      { name: "Royal Plum", data: "#4D1F3B", desc: "Statement coats, rich velvet accessories." }
    ]
  },
  {
    category: "The Wildcards (10%)",
    items: [
      { name: "Lemon Sorbet", data: "#F4D03F", desc: "Summer sundresses, playful accessories." },
      { name: "Terracotta", data: "#B35C44", desc: "Linen shorts, watercolor-patterned tops." },
      { name: "Brick Red", data: "#922B21", desc: "Checkered patterns, bold lip color, or nails." }
    ]
  },
  {
    category: "Powdered Pastels",
    items: [
      { name: "Powdered Purple", data: "#D6CADD", desc: "Soft feminine accent layers." },
      { name: "Powdered Blue", data: "#B9D9EB", desc: "Cool soothing casual wear." },
      { name: "Butter Yellow", data: "#FFFACD", desc: "Warm sunshine and spring palettes." }
    ]
  }
];

export default function Moodboard() {
  const { swatches, inspoPhotos, swatchCategories, loadMoodboard } = useData();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  
  const [newSwatch, setNewSwatch] = useState({ name: '', type: 'color', data: '#ffffff', description: '', category_id: null });
  const [editingCat, setEditingCat] = useState(null);
  const [catFormName, setCatFormName] = useState("");

  const [isLoading, setIsLoading] = useState(swatches === null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handlePaste = async (e) => {
      if (!showAddModal) return;
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          const b64 = await readFileAsDataURL(blob);
          setNewSwatch(prev => ({ ...prev, data: b64, type: 'texture' }));
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showAddModal]);

  const fetchData = async (force = false) => {
    try {
      const { swatchCategories: existingCats } = await loadMoodboard(force);
      
      // Auto-seeding logic if NO categories exist
      if (!existingCats || existingCats.length === 0) {
        console.log("Seeding user's initial palette system...");
        setIsUploading(true);
        for (let i = 0; i < DEFAULT_PALETTE.length; i++) {
          const section = DEFAULT_PALETTE[i];
          const { data: catRet } = await supabase.from('swatch_categories').insert([{ name: section.category, display_order: i }]).select();
          if (catRet && catRet.length > 0) {
            const catId = catRet[0].id;
            const toInsert = section.items.map(item => ({
              type: 'color',
              name: item.name,
              data: item.data,
              description: item.desc,
              category_id: catId
            }));
            await supabase.from('swatches').insert(toInsert);
          }
        }
        await loadMoodboard(true); // Refetch seeded
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  // SWATCH ACTIONS
  const handleSwatchFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await readFileAsDataURL(file);
      setNewSwatch({ ...newSwatch, data: base64, type: 'texture' });
    }
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

  const saveSwatch = async () => {
    if (!newSwatch.name) return triggerWarning('Please provide a name for this swatch.');
    setIsUploading(true);
    try {
      await supabase.from('swatches').insert([{
        type: newSwatch.type,
        name: newSwatch.name,
        data: newSwatch.data,
        description: newSwatch.description,
        category_id: newSwatch.category_id
      }]);
      setShowAddModal(false);
      setNewSwatch({ name: '', type: 'color', data: '#ffffff', description: '', category_id: null });
      await fetchData(true);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerDeleteSwatch = (id, e) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: "Delete swatch?",
      message: "This will permanently remove this color/texture from your palette.",
      type: 'danger',
      onConfirm: async () => {
        await supabase.from('swatches').delete().eq('id', id);
        setConfirmState({ isOpen: false });
        fetchData(true);
      }
    });
  };

  // CATEGORY ACTIONS
  const openAddSwatchToCat = (catId) => {
    setNewSwatch({ ...newSwatch, category_id: catId });
    setShowAddModal(true);
  };

  const openAddCat = () => {
    setEditingCat(null);
    setCatFormName("");
    setShowCatModal(true);
  };

  const openEditCat = (cat, e) => {
    e.stopPropagation();
    setEditingCat(cat);
    setCatFormName(cat.name);
    setShowCatModal(true);
  };

  const saveCategory = async () => {
    if (!catFormName.trim()) return triggerWarning("Please enter a group title.");
    setIsUploading(true);
    try {
      if (editingCat) {
        await supabase.from('swatch_categories').update({ name: catFormName }).eq('id', editingCat.id);
      } else {
        await supabase.from('swatch_categories').insert([{ name: catFormName, display_order: (swatchCategories || []).length }]);
      }
      setShowCatModal(false);
      await fetchData(true);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerDeleteCat = (id, e) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: "Delete this section?",
      message: "This deletes the heading. Any swatches within it will move to 'Unassigned'.",
      type: 'danger',
      onConfirm: async () => {
        await supabase.from('swatch_categories').delete().eq('id', id);
        setConfirmState({ isOpen: false });
        await fetchData(true);
      }
    });
  };

  // INSPO ACTIONS
  const handleInspoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if(files.length === 0) return;
    setIsUploading(true);
    try {
      for (let file of files) {
        const base64 = await readFileAsDataURL(file);
        await supabase.from('inspo_photos').insert([{ data: base64 }]);
      }
      await fetchData(true); 
    } finally {
      setIsUploading(false);
    }
  };

  const triggerDeleteInspo = (id, e) => {
    e.stopPropagation();
    setConfirmState({
      isOpen: true,
      title: "Remove inspiration?",
      message: "This image will be permanently deleted from your moodboard storage.",
      type: 'danger',
      onConfirm: async () => {
        await supabase.from('inspo_photos').delete().eq('id', id);
        setConfirmState({ isOpen: false });
        fetchData(true);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <Loader2 size={32} className="animate-spin" style={{ marginBottom: '16px', color: 'var(--accent)' }} />
        <p>Curating your palette...</p>
      </div>
    );
  }

  // Prepare grouping render
  const groupedSwatches = {};
  (swatchCategories || []).forEach(cat => {
    groupedSwatches[cat.id] = (swatches || []).filter(s => s.category_id === cat.id);
  });
  const unassigned = (swatches || []).filter(s => !s.category_id);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="header-bar">
        <h1 style={{ fontSize: '24px' }}>The Moodboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isUploading && (
            <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-dark)' }}>
              <Loader2 size={14} className="animate-spin" /> Syncing...
            </div>
          )}
          <input type="file" multiple accept="image/*" id="bulkInspoUpload" style={{ display: 'none' }} onChange={handleInspoUpload} disabled={isUploading} />
          <label htmlFor="bulkInspoUpload" className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.5 : 1 }}>
            <UploadCloud size={16} />
            <span>Upload Inspo</span>
          </label>
          <button className="btn-primary" onClick={openAddCat} disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>New Section</span>
          </button>
        </div>
      </header>

      <div className="content-scroll-area">
        
        {/* Categories Loops */}
        {(swatchCategories || []).map(cat => (
          <div key={cat.id} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-main)' }}>
                  {cat.name}
                </h2>
                <button onClick={(e) => openEditCat(cat, e)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={(e) => triggerDeleteCat(cat.id, e)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <button onClick={() => openAddSwatchToCat(cat.id)} style={{ border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <Plus size={14} /> Add Swatch
              </button>
            </div>

            {groupedSwatches[cat.id]?.length === 0 ? (
              <div onClick={() => openAddSwatchToCat(cat.id)} style={{ height: 60, border: '1px dashed var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                Click to add the first swatch to this group
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                {(groupedSwatches[cat.id] || []).map(swatch => (
                  <SwatchCard key={swatch.id} swatch={swatch} onDelete={triggerDeleteSwatch} />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Unassigned Loop */}
        {unassigned.length > 0 && (
          <div style={{ marginBottom: '40px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Unassigned
                </h2>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                {unassigned.map(swatch => (
                  <SwatchCard key={swatch.id} swatch={swatch} onDelete={triggerDeleteSwatch} />
                ))}
             </div>
          </div>
        )}

        {/* Inspiration Space */}
        <div style={{ marginTop: '56px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
          <h2 style={{ fontSize: '18px', fontFamily: 'Inter', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Style & Outfit Inspiration
          </h2>
        </div>

        {inspoPhotos.length === 0 ? (
          <label htmlFor="bulkInspoUpload" style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
            height: '240px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', cursor: isUploading ? 'wait' : 'pointer',
            color: 'var(--text-muted)', opacity: isUploading ? 0.5 : 1
          }}>
            {isUploading ? <Loader2 size={32} className="animate-spin" /> : <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />}
            <p style={{ fontStyle: 'italic', marginTop: 8 }}>{isUploading ? 'Processing...' : 'Drop your inspo screenshots here.'}</p>
          </label>
        ) : (
          <div className="inspo-grid">
            {inspoPhotos.map(photo => (
              <div key={photo.id} className="inspo-item">
                <img src={photo.data} className="inspo-image" loading="lazy" />
                <div className="action-overlay">
                  <button 
                    onClick={(e) => triggerDeleteInspo(photo.id, e)}
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

      {/* MODAL: Swatch Creator */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '24px' }}>New Swatch</h2>
            
            <div className="form-group">
              <label>Group Selection</label>
              <select 
                disabled={isUploading}
                style={{ width: '100%' }} 
                value={newSwatch.category_id || ""}
                onChange={e => setNewSwatch({ ...newSwatch, category_id: e.target.value ? parseInt(e.target.value) : null })}
              >
                <option value="">-- No Specific Group --</option>
                {(swatchCategories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Swatch Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  disabled={isUploading}
                  className={`btn-outline`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: newSwatch.type === 'color' ? '2px solid var(--accent)' : '1px solid var(--border)', background: newSwatch.type === 'color' ? 'var(--accent-light)' : '' }}
                  onClick={() => setNewSwatch({ ...newSwatch, type: 'color', data: '#d0b393' })}
                >
                  <Droplet size={16} /> Solid Color
                </button>
                <button 
                  disabled={isUploading}
                  className={`btn-outline`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: newSwatch.type === 'texture' ? '2px solid var(--accent)' : '1px solid var(--border)', background: newSwatch.type === 'texture' ? 'var(--accent-light)' : '' }}
                  onClick={() => setNewSwatch({ ...newSwatch, type: 'texture', data: '' })}
                >
                  <ImageIcon size={16} /> Fabric Texture
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input 
                disabled={isUploading}
                type="text" placeholder="e.g. Camel Cashmere" 
                style={{ width: '100%' }} value={newSwatch.name}
                onChange={e => setNewSwatch({ ...newSwatch, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Best Use / Description</label>
              <input 
                disabled={isUploading}
                type="text" placeholder="e.g. Summer trousers, trench coats" 
                style={{ width: '100%' }} value={newSwatch.description}
                onChange={e => setNewSwatch({ ...newSwatch, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Visual Content</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  disabled={isUploading} 
                  placeholder="Paste raw Image URL here (instead of file)..." 
                  style={{ flex: 1, fontSize: '13px' }} 
                  onChange={e => {
                    const val = e.target.value;
                    if(val.trim()) {
                       setNewSwatch({...newSwatch, data: val, type: val.includes('#') ? 'color' : 'texture'});
                    }
                  }} 
                />
              </div>
              {newSwatch.type === 'color' ? (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <input 
                    disabled={isUploading}
                    type="color" value={newSwatch.data.startsWith('#') ? newSwatch.data : '#d0b393'}
                    onChange={e => setNewSwatch({ ...newSwatch, data: e.target.value })}
                    style={{ width: '60px', height: '40px', cursor: 'pointer' }}
                  />
                  <input 
                    disabled={isUploading}
                    type="text" value={newSwatch.data}
                    onChange={e => setNewSwatch({ ...newSwatch, data: e.target.value })}
                    style={{ flexGrow: 1 }}
                  />
                </div>
              ) : (
                <div>
                  <input type="file" accept="image/*" onChange={handleSwatchFileUpload} style={{ display: 'none' }} id="fileInputSwatch" disabled={isUploading} />
                  <label htmlFor="fileInputSwatch" style={{ 
                    display: 'block', border: '2px dashed var(--border)', padding: '30px', textAlign: 'center', 
                    cursor: isUploading ? 'not-allowed' : 'pointer', background: '#F9FAFB'
                  }}>
                    {newSwatch.data && newSwatch.data.length > 30 ? (
                      <img src={newSwatch.data} style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px' }} />
                    ) : (
                      <>
                        <div style={{ fontWeight: 600 }}>Upload Texture Photo</div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>OR just Cmd+V paste a screenshot!</div>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn-outline" disabled={isUploading} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={isUploading} onClick={saveSwatch} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isUploading && <Loader2 size={16} className="animate-spin" />}
                {isUploading ? 'Saving...' : 'Add to Palette'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Category Creator */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowCatModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h2>{editingCat ? "Edit Section" : "New Palette Section"}</h2>
            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Heading Name</label>
              <input 
                disabled={isUploading}
                autoFocus
                type="text" placeholder="e.g. My Accent Tones" 
                style={{ width: '100%' }} value={catFormName}
                onChange={e => setCatFormName(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn-outline" disabled={isUploading} onClick={() => setShowCatModal(false)}>Cancel</button>
              <button className="btn-primary" disabled={isUploading} onClick={saveCategory} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isUploading && <Loader2 size={16} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState({ isOpen: false })}
      />
    </div>
  );
}

// SUB-COMPONENT FOR SWATCH VISUAL TO KEEP MAIN CLEAN
function SwatchCard({ swatch, onDelete }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ 
        position: 'relative', 
        aspectRatio: '1', 
        borderRadius: 'var(--radius-md)', 
        overflow: 'hidden', 
        boxShadow: 'var(--shadow-sm)', 
        border: '1px solid #eee' 
      }}>
        {swatch.type === 'color' ? (
          <div style={{ height: '100%', width: '100%', backgroundColor: swatch.data }} />
        ) : (
          <img src={swatch.data} alt="" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
        )}
        <button 
          onClick={(e) => onDelete(swatch.id, e)}
          style={{ 
            position: 'absolute', top: '6px', right: '6px', background: 'rgba(255,255,255,0.9)',
            border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            backdropFilter: 'blur(4px)'
          }}>
          <Trash2 size={10} color="#B04B4B" />
        </button>
      </div>
      <div style={{ padding: '2px 4px' }}>
        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-main)' }}>{swatch.name}</div>
        {swatch.type === 'color' && <div style={{ fontSize: '11px', color: '#aaa', fontFamily: 'monospace', marginTop: '2px' }}>{swatch.data}</div>}
        {swatch.description && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', lineHeight: '1.3' }}>
            {swatch.description}
          </div>
        )}
      </div>
    </div>
  );
}
