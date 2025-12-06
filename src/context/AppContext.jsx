import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AppContext = createContext();

export const useApp = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  // State
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    apiUrl: 'https://api.openai.com/v1',
    apiToken: '',
    model: 'gpt-3.5-turbo',
    imageModel: 'dall-e-3'
  });

  // Handle Auth Session
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when session exists
  useEffect(() => {
    if (!session) {
      // Clear data if logged out
      setInventory([]);
      setRecipes([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();

        if (!settingsError && settingsData) {
          setSettings({
            id: settingsData.id, // Keep ID for updates
            apiUrl: settingsData.api_url,
            apiToken: settingsData.api_token,
            model: settingsData.model,
            imageModel: settingsData.image_model
          });
        } else if (settingsError && settingsError.code === 'PGRST116') {
           // No settings found, create default
           const defaultSettings = {
             api_url: 'https://api.openai.com/v1',
             model: 'gpt-3.5-turbo',
             image_model: 'dall-e-3'
           };
           const { data: newSettings } = await supabase
             .from('settings')
             .insert([defaultSettings])
             .select()
             .single();
             
           if (newSettings) {
             setSettings({
               id: newSettings.id,
               apiUrl: newSettings.api_url,
               apiToken: newSettings.api_token,
               model: newSettings.model,
               imageModel: newSettings.image_model
             });
           }
        }

        // Fetch Inventory
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('inventory')
          .select('*')
          .order('created_at', { ascending: true });
          
        if (inventoryError) throw inventoryError;
        setInventory(inventoryData || []);

        // Fetch Recipes
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: true });

        if (recipesError) throw recipesError;
        
        // Map snake_case to camelCase for recipes
        const formattedRecipes = (recipesData || []).map(recipe => ({
          ...recipe,
          imageUrl: recipe.image_url,
        }));
        
        setRecipes(formattedRecipes);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  // Actions
  const addInventoryItem = async (item) => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([item])
        .select();
        
      if (error) throw error;
      
      if (data) {
        setInventory(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const removeInventoryItem = async (id) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing inventory item:', error);
    }
  };

  const updateInventoryItem = async (id, updates) => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  const addRecipe = async (recipe) => {
    if (!session) return null;
    try {
      // Map camelCase to snake_case for DB
      const dbRecipe = {
        name: recipe.name,
        chef: recipe.chef,
        type: recipe.type,
        flavor: recipe.flavor,
        rating: recipe.rating,
        notes: recipe.notes,
        image_url: recipe.imageUrl
      };

      const { data, error } = await supabase
        .from('recipes')
        .insert([dbRecipe])
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const newRecipe = {
          ...data[0],
          imageUrl: data[0].image_url
        };
        setRecipes(prev => [...prev, newRecipe]);
        return newRecipe.id;
      }
    } catch (error) {
      console.error('Error adding recipe:', error);
      return null;
    }
  };

  const removeRecipe = async (id) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setRecipes(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  const updateRecipe = async (id, updates) => {
    if (!session) return;
    try {
      // Map updates to snake_case
      const dbUpdates = { ...updates };
      if (updates.imageUrl !== undefined) {
        dbUpdates.image_url = updates.imageUrl;
        delete dbUpdates.imageUrl;
      }

      const { data, error } = await supabase
        .from('recipes')
        .update(dbUpdates)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const updatedRecipe = {
          ...data[0],
          imageUrl: data[0].image_url
        };
        setRecipes(prev => prev.map(item => item.id === id ? updatedRecipe : item));
      }
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    if (!session) return;
    
    // Optimistic update
    setSettings(newSettings);

    try {
      const dbSettings = {
        api_url: newSettings.apiUrl,
        api_token: newSettings.apiToken,
        model: newSettings.model,
        image_model: newSettings.imageModel
      };

      if (newSettings.id) {
        const { error } = await supabase
          .from('settings')
          .update(dbSettings)
          .eq('id', newSettings.id);
        if (error) throw error;
      } else {
        // Should not happen if fetched correctly, but handle just in case
        const { data, error } = await supabase
          .from('settings')
          .insert([dbSettings])
          .select()
          .single();
        if (error) throw error;
        if (data) setSettings(prev => ({ ...prev, id: data.id }));
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert or show error? For now just log.
    }
  };

  const value = {
    user,
    session,
    inventory,
    recipes,
    settings,
    loading,
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
