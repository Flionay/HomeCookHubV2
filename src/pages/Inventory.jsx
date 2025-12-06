import React, { useState } from 'react';
import { Plus, Trash2, Snowflake, Sun, Calendar, Minus, Search, Edit2, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

const LOCATIONS = [
  { id: 'fridge-cold', label: '冷藏', icon: Snowflake, color: 'text-blue-500 bg-blue-50' },
  { id: 'fridge-frozen', label: '冷冻', icon: Snowflake, color: 'text-cyan-500 bg-cyan-50' },
  { id: 'pantry', label: '常温', icon: Sun, color: 'text-orange-500 bg-orange-50' },
];

const CATEGORIES = [
  { id: 'all', label: '全部', icon: '🍽️' },
  { id: '蔬菜', label: '蔬菜', icon: '🥬' },
  { id: '肉类', label: '肉类', icon: '🥩' },
  { id: '海鲜', label: '海鲜', icon: '🐟' },
  { id: '水果', label: '水果', icon: '🍎' },
  { id: '饮品', label: '饮品', icon: '🥤' },
  { id: '调味品', label: '调味', icon: '🧂' },
  { id: '干货', label: '干货', icon: '📦' },
  { id: '其他', label: '其他', icon: '🔖' }
];

const Inventory = () => {
  const { inventory, addInventoryItem, removeInventoryItem, updateInventoryItem, settings } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    unit: '个',
    location: 'fridge-cold',
    category: '蔬菜',
    expiry: ''
  });

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name) return;
    addInventoryItem(newItem);
    setIsAdding(false);
    setNewItem({
      name: '',
      quantity: '',
      unit: '个',
      location: 'fridge-cold',
      category: '蔬菜',
      expiry: ''
    });
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) return;
    
    try {
        await updateInventoryItem(editingItem.id, {
            name: editingItem.name,
            image_url: editingItem.image_url
        });
        setEditingItem(null);
    } catch (error) {
        console.error("Failed to update item:", error);
        alert("更新失败");
    }
  };

  const handleGenerateImage = async () => {
    if (!settings.apiToken) {
      alert('请先在设置页面配置 AI API Token');
      return;
    }
    
    setIsGeneratingImage(true);
    try {
      const response = await fetch(`${settings.apiUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          model: settings.imageModel || "dall-e-3",
          prompt: `Generate a rendered image of ${editingItem.name}, one of the smallest counting units, 300x300 size (use suggested size) exquisite modeling, high-definition rendering always with gray 	
#F5F5F5 background`,
          n: 1,
          size: "300x300"
        })
      });

      const data = await response.json();
      if (data.error) {
          throw new Error(data.error.message);
      }
      
      if (data.data && data.data.length > 0) {
          const imageUrl = data.data[0].url;
          setEditingItem(prev => ({ ...prev, image_url: imageUrl }));
      } else {
          throw new Error("No image data received");
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      alert(`生成失败: ${error.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const adjustQuantity = (item, amount) => {
    const currentQty = parseFloat(item.quantity) || 0;
    const newQty = Math.max(0, currentQty + amount);
    if (newQty === 0) {
      if (window.confirm(`确认吃完/用完 ${item.name} 了吗？`)) {
        removeInventoryItem(item.id);
      }
    } else {
      updateInventoryItem(item.id, { quantity: newQty.toString() });
    }
  };

  const filteredItems = inventory.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getLocationInfo = (id) => LOCATIONS.find(l => l.id === id) || LOCATIONS[0];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500">
      {/* Top Header Area */}
      <div className="flex justify-between items-center mb-4 px-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">我的厨房</h1>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
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
          placeholder="搜索食材..."
          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      </div>

      {/* Split Layout Container */}
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

        {/* Right Content - Items */}
        <div className="flex-1 overflow-y-auto p-4 bg-white">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">
              {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              <span className="ml-2 text-xs font-normal text-gray-500">({filteredItems.length})</span>
            </h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl mb-2">🍽️</span>
              <span className="text-sm">该分类下暂无食材</span>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredItems.map(item => {
                const locationInfo = getLocationInfo(item.location);
                const LocIcon = locationInfo.icon;
                
                return (
                  <li key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-orange-100 hover:shadow-sm transition-all bg-white group">
                    {/* Item Icon/Image Placeholder */}
                    <div className="w-16 h-16 rounded-lg bg-gray-50 flex items-center justify-center text-2xl shrink-0 overflow-hidden relative">
                      {item.image_url ? (
                         <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                         CATEGORIES.find(c => c.id === item.category)?.icon || '📦'
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-gray-800 truncate pr-2">{item.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 ${locationInfo.color}`}>
                            <LocIcon size={10} />
                            {locationInfo.label}
                          </span>
                        </div>
                        {item.expiry && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                            <Calendar size={10} />
                            <span>{item.expiry}</span>
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-1">
                             <button
                                onClick={() => setEditingItem(item)}
                                className="text-gray-300 hover:text-orange-500 transition-colors p-1"
                                title="编辑"
                              >
                                <Edit2 size={14} />
                              </button>
                             <button
                                onClick={() => removeInventoryItem(item.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="删除"
                              >
                                <Trash2 size={14} />
                              </button>
                         </div>
                          
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => adjustQuantity(item, -1)}
                             className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all"
                           >
                             <Minus size={12} />
                           </button>
                           <div className="flex items-baseline gap-0.5 min-w-[2rem] justify-center">
                             <span className="text-sm font-bold text-gray-900">{item.quantity}</span>
                             <span className="text-xs text-gray-400">{item.unit}</span>
                           </div>
                           <button 
                             onClick={() => adjustQuantity(item, 1)}
                             className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white transition-all"
                           >
                             <Plus size={12} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">添加新食材</h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <Minus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddItem} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">名称</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                  placeholder="例如：土豆"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">数量</label>
                  <input
                    type="text"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                    placeholder="1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">单位</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                    placeholder="个"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">分类</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                  >
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">位置</label>
                  <select
                    value={newItem.location}
                    onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
               <div className="space-y-1">
                 <label className="text-xs font-bold text-gray-500 uppercase">过期时间</label>
                 <input
                   type="date"
                   value={newItem.expiry}
                   onChange={(e) => setNewItem({ ...newItem, expiry: e.target.value })}
                   className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50"
                 />
               </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95 mt-2"
              >
                确认添加
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">编辑食材</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <Minus size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-4">
                  <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-4xl relative overflow-hidden group">
                      {editingItem.image_url ? (
                          <img src={editingItem.image_url} alt={editingItem.name} className="w-full h-full object-cover" />
                      ) : (
                          CATEGORIES.find(c => c.id === editingItem.category)?.icon || '📦'
                      )}
                      
                      {isGeneratingImage && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <Loader2 className="animate-spin text-orange-500" size={24} />
                          </div>
                      )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="mt-2 text-xs flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 bg-orange-50 rounded-full hover:bg-orange-100 transition-colors"
                  >
                    <RefreshCw size={12} className={isGeneratingImage ? "animate-spin" : ""} />
                    {isGeneratingImage ? "正在生成..." : "生成精美模型图"}
                  </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">名称</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                  placeholder="例如：土豆"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 active:scale-95 mt-2"
              >
                保存修改
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
