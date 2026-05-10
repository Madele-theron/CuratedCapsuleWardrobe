import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DataContext = createContext(null);

export const DataProvider = ({ children, session }) => {
  const [swatchCategories, setSwatchCategories] = useState(null);
  const [swatches, setSwatches] = useState(null); 
  const [inspoPhotos, setInspoPhotos] = useState(null);
  const [items, setItems] = useState(null);
  const [boards, setBoards] = useState(null);
  const [todos, setTodos] = useState(null);

  // Reset cache if user logs out
  useEffect(() => {
    if (!session) {
      setSwatchCategories(null);
      setSwatches(null);
      setInspoPhotos(null);
      setItems(null);
      setBoards(null);
      setTodos(null);
    }
  }, [session]);

  const loadMoodboard = async (force = false) => {
    if (!force && swatches !== null && inspoPhotos !== null && swatchCategories !== null) {
      return { swatches, inspoPhotos, swatchCategories };
    }
    const { data: cats } = await supabase.from('swatch_categories').select('*').order('display_order', { ascending: true });
    const { data: swt } = await supabase.from('swatches').select('*').order('created_at', { ascending: true });
    const { data: inspo } = await supabase.from('inspo_photos').select('*').order('created_at', { ascending: false });
    setSwatchCategories(cats || []);
    setSwatches(swt || []);
    setInspoPhotos(inspo || []);
    return { swatchCategories: cats || [], swatches: swt || [], inspoPhotos: inspo || [] };
  };

  const loadItems = async (force = false) => {
    if (!force && items !== null) return items;
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: true });
    setItems(data || []);
    return data || [];
  };

  const loadScrapbooks = async (force = false) => {
    if (!force && boards !== null) return boards;
    const { data } = await supabase.from('scrapbooks').select('*').order('created_at', { ascending: false });
    setBoards(data || []);
    return data || [];
  };

  const loadTodos = async (force = false) => {
    if (!force && todos !== null) return todos;
    const { data } = await supabase.from('todos').select('*').order('id', { ascending: true });
    setTodos(data || []);
    return data || [];
  };

  const value = {
    swatchCategories, setSwatchCategories,
    swatches, setSwatches,
    inspoPhotos, setInspoPhotos,
    items, setItems,
    boards, setBoards,
    todos, setTodos,
    loadMoodboard,
    loadItems,
    loadScrapbooks,
    loadTodos
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
