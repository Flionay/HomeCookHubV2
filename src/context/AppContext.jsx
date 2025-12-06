import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  // Helper to safe parse JSON
  const safeParse = (key, fallback) => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      return fallback;
    }
  };

  // State
  const [inventory, setInventory] = useState(() => safeParse('inventory', []));
  const [recipes, setRecipes] = useState(() => safeParse('recipes', []));
  const [settings, setSettings] = useState(() => safeParse('settings', {
    apiUrl: 'https://api.openai.com/v1',
    apiToken: '',
    model: 'gpt-3.5-turbo'
  }));

  // Persistence effects
  useEffect(() => {
    window.localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    window.localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    window.localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  // Actions
  const addInventoryItem = (item) => {
    setInventory(prev => [...prev, { ...item, id: Date.now() }]);
  };

  const removeInventoryItem = (id) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const updateInventoryItem = (id, updates) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addRecipe = (recipe) => {
    const id = recipe.id || Date.now();
    setRecipes(prev => [...prev, { ...recipe, id, createdAt: new Date().toISOString() }]);
    return id;
  };

  const removeRecipe = (id) => {
    setRecipes(prev => prev.filter(item => item.id !== id));
  };

  const updateRecipe = (id, updates) => {
    setRecipes(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const value = {
    inventory,
    recipes,
    settings,
    addInventoryItem,
    removeInventoryItem,
    updateInventoryItem,
    addRecipe,
    removeRecipe,
    updateRecipe,
    updateSettings
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
