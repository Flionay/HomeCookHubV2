import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, inventory as inventoryApi, recipes as recipesApi, settings as settingsApi, cookingLogs as cookingLogsApi } from '../apiClient';

const AppContext = createContext();

export const useApp = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    apiUrl: 'https://api.openai.com/v1',
    apiToken: '',
    model: 'gpt-3.5-turbo',
    imageModel: 'dall-e-3',
    shareImageModel: 'dall-e-3'
  });

  const [cookingLogs, setCookingLogs] = useState([]);

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token by fetching user profile
          const userData = await auth.getUser();
          setUser(userData);
        } catch (error) {
          console.error("Session invalid:", error);
          auth.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Fetch data when user exists
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setRecipes([]);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch Settings
        try {
            const settingsData = await settingsApi.get();
            if (settingsData) {
              setSettings({
                id: settingsData.id,
                apiUrl: settingsData.api_url,
                apiToken: settingsData.api_token,
                model: settingsData.model,
                imageModel: settingsData.image_model,
                shareImageModel: settingsData.share_image_model || 'dall-e-3'
              });
            }
        } catch (e) {
            console.error("Error fetching settings", e);
        }

        // Fetch Cooking Logs
        try {
            const logsData = await cookingLogsApi.getAll();
            setCookingLogs(logsData || []);
        } catch (e) {
            console.error("Error fetching logs", e);
        }

        // Fetch Inventory
        try {
            const inventoryData = await inventoryApi.getAll();
            setInventory(inventoryData || []);
        } catch (e) {
            console.error("Error fetching inventory", e);
        }

        // Fetch Recipes
        try {
            const recipesData = await recipesApi.getAll();
            // Map snake_case to camelCase for recipes
            const formattedRecipes = (recipesData || []).map(recipe => ({
              ...recipe,
              imageUrl: recipe.image_url,
            }));
            setRecipes(formattedRecipes);
        } catch (e) {
            console.error("Error fetching recipes", e);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Actions
  const login = async (email, password) => {
      try {
          const data = await auth.login(email, password);
          setUser(data.user);
          return true;
      } catch (error) {
          console.error("Login failed:", error);
          throw error;
      }
  };

  const logout = () => {
      auth.logout();
      setUser(null);
  };

  const addInventoryItem = async (item) => {
    if (!user) return;
    try {
      const newItem = await inventoryApi.add(item);
      setInventory(prev => [...prev, newItem]);
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const removeInventoryItem = async (id) => {
    if (!user) return;
    try {
      await inventoryApi.remove(id);
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing inventory item:', error);
    }
  };

  const updateInventoryItem = async (id, updates) => {
    if (!user) return;
    try {
      const updatedItem = await inventoryApi.update(id, updates);
      setInventory(prev => prev.map(item => item.id === id ? updatedItem : item));
    } catch (error) {
      console.error('Error updating inventory item:', error);
    }
  };

  const addRecipe = async (recipe) => {
    if (!user) return null;
    try {
      const dbRecipe = {
        name: recipe.name,
        chef: recipe.chef,
        type: recipe.type,
        flavor: recipe.flavor,
        rating: recipe.rating,
        notes: recipe.notes,
        image_url: recipe.imageUrl
      };

      const newRecipeData = await recipesApi.add(dbRecipe);
      
      const newRecipe = {
        ...newRecipeData,
        imageUrl: newRecipeData.image_url
      };
      setRecipes(prev => [...prev, newRecipe]);
      return newRecipe.id;
    } catch (error) {
      console.error('Error adding recipe:', error);
      return null;
    }
  };

  const removeRecipe = async (id) => {
    if (!user) return;
    try {
      await recipesApi.remove(id);
      setRecipes(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing recipe:', error);
    }
  };

  const updateRecipe = async (id, updates) => {
    if (!user) return;
    try {
      const dbUpdates = { ...updates };
      if (updates.imageUrl !== undefined) {
        dbUpdates.image_url = updates.imageUrl;
        delete dbUpdates.imageUrl;
      }

      const updatedRecipeData = await recipesApi.update(id, dbUpdates);
      
      const updatedRecipe = {
        ...updatedRecipeData,
        imageUrl: updatedRecipeData.image_url
      };
      setRecipes(prev => prev.map(item => item.id === id ? updatedRecipe : item));
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    if (!user) return;
    
    setSettings(newSettings);

    try {
      const dbSettings = {
        api_url: newSettings.apiUrl,
        api_token: newSettings.apiToken,
        model: newSettings.model,
        image_model: newSettings.imageModel,
        share_image_model: newSettings.shareImageModel
      };

      if (newSettings.id) {
        await settingsApi.update(newSettings.id, dbSettings);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const addCookingLog = async (logData) => {
      if (!user) return;
      try {
          // Convert camelCase to snake_case for DB
          const dbLog = {
            meal_name: logData.mealName,
            menu: logData.menu,
            ingredients: logData.ingredients,
            mood_text: logData.moodText,
            image_url: logData.imageUrl,
            tags: logData.tags,
            date: new Date().toISOString()
          };

          const newLogData = await cookingLogsApi.add(dbLog);
          
          const newLog = {
              ...newLogData,
              mealName: newLogData.meal_name,
              moodText: newLogData.mood_text,
              imageUrl: newLogData.image_url
          };
          setCookingLogs(prev => [newLog, ...prev]);
          return newLog;
      } catch (error) {
          console.error("Error adding cooking log:", error);
          throw error;
      }
  };

  const value = {
    user,
    inventory,
    recipes,
    settings,
    cookingLogs,
    loading,
    login,
    logout,
    addInventoryItem,
    removeInventoryItem,
    updateInventoryItem,
    addRecipe,
    removeRecipe,
    updateRecipe,
    updateSettings,
    addCookingLog
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
