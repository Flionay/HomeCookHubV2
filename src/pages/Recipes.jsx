import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { Plus, Star, Trash2, ChefHat, Clock, User, Edit2, X, Search, Filter, Loader, Image as ImageIcon, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: '🍽️' },
  { id: '荤菜', label: '荤菜', icon: '🍖' },
  { id: '素菜', label: '素菜', icon: '🥦' },
  { id: '汤/粥', label: '汤粥', icon: '🥣' },
  { id: '主食', label: '主食', icon: '🍚' },
  { id: '饮料/甜品', label: '甜品', icon: '🍰' }
];

const FLAVORS = ['辣', '清淡', '家常', '酸甜', '咸鲜'];
const CHEFS = ['男主人', '女主人', '其他'];

const Recipes = () => {
  const { recipes, addRecipe, removeRecipe, updateRecipe, settings } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [generatingImages, setGeneratingImages] = useState({}); // Map of recipeId -> boolean
  
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    chef: '女主人',
    type: '荤菜',
    flavor: '家常',
    rating: 0,
    notes: '',
    imageUrl: ''
  });

  const uploadImageToSupabase = async (imageUrl, recipeId) => {
    try {
      // 1. Download image from AI URL (proxy might be needed if CORS issues arise, but often works directly or via backend)
      // Note: Fetching directly from browser might fail due to CORS on OpenAI side. 
      // If it fails, we might need a proxy. But let's try direct fetch first or assume a server function.
      // Actually, for a pure client-side app, we often use a serverless function to proxy this.
      // However, assuming standard behavior:
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const fileName = `${recipeId}-${Date.now()}.png`;
      
      // 2. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, blob);

      if (error) throw error;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload image to Supabase:', error);
      // Fallback: return original URL but warn
      return imageUrl;
    }
  };

  const generateRecipeImage = async (recipeId, recipeName) => {
    if (!settings.apiToken || !settings.imageModel) return;

    setGeneratingImages(prev => ({ ...prev, [recipeId]: true }));

    try {
      const prompt = `生成一张${recipeName}菜品的高清建模图，画面比例是16:9 菜品新鲜，秀色可餐，灯光温和，氛围感，4k`;
      
      // Handle trailing slash in apiUrl
      const baseUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
      const url = `${baseUrl}/images/generations`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          model: settings.imageModel,
          prompt: prompt,
          n: 1,
          size: "1024x1024"
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.data && data.data.length > 0) {
        let imageUrl = data.data[0].url;
        
        // Try to persist the image to Supabase Storage
        // We do this because AI generated links expire
        const permanentUrl = await uploadImageToSupabase(imageUrl, recipeId);
        
        updateRecipe(recipeId, { imageUrl: permanentUrl });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      // Optionally show an error toast or notification
    } finally {
      setGeneratingImages(prev => {
        const newState = { ...prev };
        delete newState[recipeId];
        return newState;
      });
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!newRecipe.name) return;
    
    let recipeId;
    if (editingId) {
      updateRecipe(editingId, newRecipe);
      recipeId = editingId;
    } else {
      recipeId = await addRecipe(newRecipe);
    }
    
    // Trigger image generation if configured and no image exists (or we want to regenerate? 
    // Maybe only if it's new or user explicitly asks? 
    // The requirement says "when user saves recipe". 
    // If editing, maybe we don't want to overwrite existing image unless empty?
    // Let's generate if imageUrl is empty.
    if (!newRecipe.imageUrl && settings.imageModel && recipeId) {
      generateRecipeImage(recipeId, newRecipe.name);
    }

    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewRecipe({
      name: '',
      chef: '女主人',
      type: '荤菜',
      flavor: '家常',
      rating: 0,
      notes: '',
      imageUrl: ''
    });
  };

  const startEditing = (recipe) => {
    setNewRecipe(recipe);
    setEditingId(recipe.id);
    setIsAdding(true);
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.type === selectedCategory;
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 px-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">拿手菜谱</h1>
        </div>
        <button
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-orange-600 text-white px-4 py-2 rounded-full flex items-center gap-2 hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95 text-sm font-medium"
        >
          <Plus size={18} />
          <span>添加</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative shrink-0">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索菜谱..."
          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Left Sidebar - Categories */}
        <div className="w-24 bg-gray-50 border-r border-gray-100 overflow-y-auto no-scrollbar">
          <div className="flex flex-col">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center justify-center py-4 px-1 transition-all relative ${
                  selectedCategory === cat.id
                    ? 'bg-white text-orange-600 font-bold'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {selectedCategory === cat.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-600 rounded-r-full" />
                )}
                <span className="text-2xl mb-1">{cat.icon}</span>
                <span className="text-xs">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Content - Recipes List */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">
              {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              <span className="ml-2 text-xs font-normal text-gray-500">({filteredRecipes.length})</span>
            </h2>
          </div>

          {filteredRecipes.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">👨‍🍳</span>
              <span className="text-sm">该分类下暂无菜谱</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} className="bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-all group relative overflow-hidden">
                  {/* Image Section */}
                  <div className="aspect-video w-full bg-gray-100 rounded-lg mb-3 relative overflow-hidden flex items-center justify-center">
                    {generatingImages[recipe.id] ? (
                      <div className="flex flex-col items-center text-orange-500 animate-pulse">
                        <Loader size={24} className="animate-spin mb-2" />
                        <span className="text-xs font-medium">AI 绘图中...</span>
                      </div>
                    ) : recipe.imageUrl ? (
                      <img 
                        src={recipe.imageUrl} 
                        alt={recipe.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center">
                        <ImageIcon size={32} className="mb-1" />
                        <span className="text-xs">暂无图片</span>
                      </div>
                    )}

                    {/* Regenerate Button */}
                    {settings.imageModel && !generatingImages[recipe.id] && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          generateRecipeImage(recipe.id, recipe.name);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black/40 backdrop-blur-sm text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-600 hover:scale-110"
                        title="AI 生成/重新生成图片"
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 line-clamp-1">{recipe.name}</h3>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          className={i < recipe.rating ? "text-yellow-400" : "text-gray-200"} 
                          fill={i < recipe.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <ChefHat size={10} />
                      {recipe.chef}
                    </span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                      {recipe.flavor}
                    </span>
                  </div>

                  {recipe.notes && (
                    <p className="text-gray-500 text-xs line-clamp-2 bg-gray-50 p-2 rounded-lg italic mb-8">
                      "{recipe.notes}"
                    </p>
                  )}
                  
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => startEditing(recipe)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => removeRecipe(recipe.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Recipe Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-800">
                {editingId ? '编辑菜谱' : '添加新菜谱'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddRecipe} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">菜名</label>
                <input
                  type="text"
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all"
                  placeholder="例如：红烧肉"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">大厨</label>
                  <select
                    value={newRecipe.chef}
                    onChange={(e) => setNewRecipe({ ...newRecipe, chef: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                  >
                    {CHEFS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase">类型</label>
                  <select
                    value={newRecipe.type}
                    onChange={(e) => setNewRecipe({ ...newRecipe, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">口味</label>
                <select
                  value={newRecipe.flavor}
                  onChange={(e) => setNewRecipe({ ...newRecipe, flavor: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                >
                  {FLAVORS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">评分</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRecipe({ ...newRecipe, rating: star })}
                      className={`p-2 rounded-full transition-colors ${
                        star <= newRecipe.rating ? 'text-yellow-400' : 'text-gray-200'
                      }`}
                    >
                      <Star size={24} fill={star <= newRecipe.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">备注</label>
                <textarea
                  value={newRecipe.notes}
                  onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all h-24 resize-none"
                  placeholder="记录一下关键步骤或家人的评价..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95"
              >
                {editingId ? '保存修改' : '保存菜谱'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
