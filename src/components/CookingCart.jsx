import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Check, Utensils, ShoppingBag, ArrowLeft, Camera, Sparkles, ChefHat, Trash2, AlertCircle, Plus, Search, BookOpen, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';

const STEPS = [
  { id: 1, title: '今日菜单', icon: Utensils },
  { id: 2, title: '食材消耗', icon: ShoppingBag },
  { id: 3, title: '确认清单', icon: Check },
  { id: 4, title: '生成回忆', icon: Camera }
];

const MENU_CATEGORIES = [
  { id: 'dishes', label: '菜品', icon: Utensils, recipeTypes: ['荤菜', '素菜'], allowInventory: true },
  { id: 'soups', label: '汤饮', icon: ChefHat, recipeTypes: ['汤/粥', '饮料/甜品'], allowInventory: true },
  { id: 'staples', label: '主食', icon: ShoppingBag, recipeTypes: ['主食'], allowInventory: true }
];

const USAGE_OPTIONS = [
  { value: 0.25, label: '1/4' },
  { value: 0.33, label: '1/3' },
  { value: 0.5, label: '1/2' },
  { value: 1, label: '全部' }
];

const ItemSelector = ({ category, recipes, inventory, onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('recipes'); // 'recipes' | 'inventory'
  const [search, setSearch] = useState('');

  const categoryConfig = MENU_CATEGORIES.find(c => c.id === category);
  
  // Filter recipes
  const filteredRecipes = (recipes || []).filter(r => {
    if (categoryConfig?.recipeTypes && !categoryConfig.recipeTypes.includes(r.type)) {
       return false;
    }
    return r.name.toLowerCase().includes(search.toLowerCase());
  });

  // Filter inventory
  const filteredInventory = (inventory || []).filter(i => {
    return i.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
       {/* Header */}
       <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
         <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
           <ArrowLeft size={20} className="text-gray-600"/>
         </button>
         <h3 className="font-bold text-gray-800">添加{categoryConfig?.label}</h3>
       </div>

       {/* Search */}
       <div className="p-4 pb-0">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              className="w-full bg-gray-100 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="搜索..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
         </div>
       </div>

       {/* Tabs */}
       <div className="flex px-4 mt-4 border-b border-gray-100">
         <button 
           onClick={() => setActiveTab('recipes')}
           className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'recipes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}
         >
           <span className="flex items-center justify-center gap-2">
             <BookOpen size={14} />
             菜谱库
           </span>
         </button>
         {categoryConfig?.allowInventory && (
           <button 
             onClick={() => setActiveTab('inventory')}
             className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inventory' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400'}`}
           >
             <span className="flex items-center justify-center gap-2">
               <Package size={14} />
               库存
             </span>
           </button>
         )}
       </div>

       {/* List */}
       <div className="flex-1 overflow-y-auto p-4">
         {activeTab === 'recipes' ? (
           <div className="space-y-2">
             {filteredRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">没有找到相关菜谱</div>
             ) : (
                filteredRecipes.map(r => (
                  <button 
                    key={r.id} 
                    onClick={() => onSelect(r.name)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium text-gray-700">{r.name}</span>
                    <Plus size={16} className="text-gray-300 group-hover:text-orange-500" />
                  </button>
                ))
             )}
           </div>
         ) : (
           <div className="space-y-2">
             {filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">没有找到相关库存</div>
             ) : (
                filteredInventory.map(i => (
                  <button 
                    key={i.id} 
                    onClick={() => onSelect(i.name)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-medium text-gray-700">{i.name}</span>
                    <Plus size={16} className="text-gray-300 group-hover:text-orange-500" />
                  </button>
                ))
             )}
           </div>
         )}
       </div>
    </div>
  );
};

const CookingCart = ({ isOpen, onClose }) => {
  const { inventory, removeInventoryItem, updateInventoryItem, settings, addCookingLog, recipes } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [menu, setMenu] = useState({ dishes: [], soups: [], staples: [] });
  const [selectorOpen, setSelectorOpen] = useState(null); // 'dishes' | 'soups' | 'staples' | null
  const [selectedIngredients, setSelectedIngredients] = useState([]); // Array of { id, usage: 1 }
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [weather, setWeather] = useState(null);

  // Fetch Weather on Mount
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const key = import.meta.env.VITE_WEATHER_KEY;
        if (!key) return;
        
        const response = await fetch(`https://restapi.amap.com/v3/weather/weatherInfo?city=110108&key=${key}`);
        const data = await response.json();
        if (data.status === '1' && data.lives && data.lives.length > 0) {
          setWeather(data.lives[0]);
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      }
    };
    
    fetchWeather();
  }, []);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setMenu({ dishes: [], soups: [], staples: [] });
      setSelectorOpen(null);
      setSelectedIngredients([]);
      setGeneratedResult(null);
    }
  }, [isOpen]);

  const removeMenuItem = (category, index) => {
    setMenu(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
  };

  const handleAddItem = (item) => {
    if (!selectorOpen) return;
    // Check if already added
    if (menu[selectorOpen].includes(item)) return;
    
    setMenu(prev => ({
      ...prev,
      [selectorOpen]: [...prev[selectorOpen], item]
    }));
  };

  const toggleIngredient = (item) => {
    if (selectedIngredients.find(i => i.id === item.id)) {
      setSelectedIngredients(prev => prev.filter(i => i.id !== item.id));
    } else {
      setSelectedIngredients(prev => [...prev, { ...item, usage: 1 }]);
    }
  };

  const updateUsage = (itemId, usage) => {
    setSelectedIngredients(prev => prev.map(item => 
      item.id === itemId ? { ...item, usage } : item
    ));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // 1. Prepare Data
      const mealName = [...menu.dishes, ...menu.staples].join(' & ') || '美味的一餐';
      const ingredientNames = selectedIngredients.map(i => i.name);
      
      const hour = new Date().getHours();
      let mealType = '晚餐';
      if (hour >= 5 && hour < 11) mealType = '早餐';
      else if (hour >= 11 && hour < 17) mealType = '午餐';

      // 2. Process Inventory (Only delete if usage is 1)
      // Note: We do this *after* successful generation in a real app, but here we simulate flow
      // Actually user said "Full usage deletes inventory", partial usage only records.
      // We will handle the actual deletion in the "Save" step or here? 
      // Let's do it here as part of the "Cook" action.
      
      // 3. Generate Image using AI
      // Construct prompt for the share image
      const prompt = `
        这是一张温馨的家庭晚餐海报。
        
        今日菜单：
        ${menu.dishes.length > 0 ? `菜品：${menu.dishes.join(', ')}` : ''}
        ${menu.soups.length > 0 ? `汤饮：${menu.soups.join(', ')}` : ''}
        ${menu.staples.length > 0 ? `主食：${menu.staples.join(', ')}` : ''}
        
        使用了以下新鲜食材：
        ${ingredientNames.join(', ')}
        
        风格要求：
        温馨、治愈氛围感海报风格、高质量摄影、暖色调，突出家庭温馨幸福，菜品可口美味。
        请将上述菜单文字以艺术字形式融入图片，或生成一张展示这些菜品的美食摄影图, 高级光感，摄影师级别。
      `;

      const baseUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
      let imageUrl = 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070&auto=format&fit=crop'; // Fallback
      
      if (settings.apiToken && settings.shareImageModel) {
         try {
           const response = await fetch(`${baseUrl}/images/generations`, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${settings.apiToken}`
             },
             body: JSON.stringify({
               model: settings.shareImageModel, // Use the specific share model
               prompt: prompt,
               n: 1,
               size: "1024x1024"
             })
           });
           
           const data = await response.json();
           if (data.data && data.data[0].url) {
             imageUrl = data.data[0].url;
           }
         } catch (err) {
           console.error("Image generation failed", err);
         }
      }

      // 4. Generate Mood Text & Tags (AI)
      let moodText = "烟火气，是家里最温暖的味道。";
      let aiTags = [];

      if (settings.apiToken) {
        try {
          const weatherText = weather ? `${weather.weather} ${weather.temperature}°C` : '';
          const timeText = new Date().toLocaleString('zh-CN');
          const menuText = [...menu.dishes, ...menu.soups, ...menu.staples].join('、');
          
          const textPrompt = `
          请根据以下信息，生成本次烹饪的心情语录和标签。
          
          当前时间：${timeText} (${mealType})
          ${weatherText ? `天气：${weatherText}` : ''}
          今日菜单：${menuText}
          使用了食材：${ingredientNames.join('、')}
          
          请返回标准的 JSON 格式，不要包含Markdown标记（如 \`\`\`json），包含以下两个字段：
          1. "mood_text": 一句简短温馨的心情语录（15字以内）。
          2. "tags": 一个包含3-4个标签的数组。标签应包含：
             - 天气/氛围感（如"雨天治愈"、"冬日暖阳"）
             - 能量/营养估算（如"高蛋白"、"低卡轻食"、"约600卡"）
             - 菜品特色（如"家常味"、"快手菜"）
             - 标签要简短（4字以内）。
          `;

          const response = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.apiToken}`
              },
              body: JSON.stringify({
                model: settings.model || 'gpt-3.5-turbo',
                messages: [
                    { role: "system", content: "你是一个热爱生活、擅长烹饪的生活家。请只返回纯 JSON 字符串。" },
                    { role: "user", content: textPrompt }
                ],
                temperature: 0.7,
                max_tokens: 200
              })
          });

          const data = await response.json();
          if (data.choices && data.choices.length > 0) {
              const content = data.choices[0].message.content.trim();
              // Try to parse JSON, handling potential markdown code blocks
              const jsonStr = content.replace(/^```json\s*|\s*```$/g, '');
              try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.mood_text) moodText = parsed.mood_text;
                  if (parsed.tags && Array.isArray(parsed.tags)) aiTags = parsed.tags;
              } catch (e) {
                  console.error("Failed to parse AI response", e);
                  // Fallback: try to extract text if JSON parse fails
                  moodText = content.split('\n')[0].replace(/['"]/g, '').slice(0, 15);
              }
          }
        } catch (error) {
          console.error('Failed to generate mood text:', error);
        }
      }

      // 5. Create Result Object
      const result = {
        mealName,
        menu,
        ingredients: ingredientNames,
        moodText,
        imageUrl,
        tags: aiTags.length > 0 ? [mealType, ...aiTags] : [mealType, '家庭料理']
      };

      setGeneratedResult(result);
      
      // 6. Save to DB and Update Inventory
      await addCookingLog(result);
      
      // Process inventory deletion
      for (const item of selectedIngredients) {
        if (item.usage === 1) {
          await removeInventoryItem(item.id);
        } else if (item.usage > 0) {
          // Try to reduce quantity if it's a number
          const currentQty = parseFloat(item.quantity);
          if (!isNaN(currentQty)) {
            const newQty = Math.max(0, currentQty * (1 - item.usage));
            // Only update if it's significantly different (e.g. > 0.01 change)
            if (Math.abs(currentQty - newQty) > 0.01) {
               const formattedQty = Number.isInteger(newQty) ? newQty.toString() : newQty.toFixed(2);
               await updateInventoryItem(item.id, { quantity: formattedQty });
            }
          }
        }
      }

      setCurrentStep(4);

    } catch (error) {
      console.error(error);
      alert('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl pointer-events-auto relative z-50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50 rounded-t-2xl relative z-10">
          <div className="flex items-center gap-2">
            <ChefHat className="text-orange-500" size={20} />
            <h2 className="font-bold text-gray-800">开始烹饪</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between px-8 py-4 bg-white">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep >= step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center gap-1 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}>
                  <Icon size={14} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`absolute top-4 left-8 w-[calc(100%+1rem)] h-[2px] -z-10 ${
                    currentStep > step.id ? 'bg-orange-200' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10 bg-white">
          {/* Step 1: Menu Input */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {selectorOpen && (
                <ItemSelector 
                   category={selectorOpen}
                   recipes={recipes}
                   inventory={inventory}
                   onSelect={(item) => {
                     handleAddItem(item);
                     setSelectorOpen(null);
                   }}
                   onClose={() => setSelectorOpen(null)}
                />
              )}

              {MENU_CATEGORIES.map(cat => (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    {cat.id === 'dishes' ? '🍳' : cat.id === 'soups' ? '🥣' : '🍚'} {cat.label}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {menu[cat.id].map((item, idx) => (
                      <span key={idx} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {item}
                        <button onClick={() => removeMenuItem(cat.id, idx)} className="hover:text-orange-900">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setSelectorOpen(cat.id)}
                      className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 hover:bg-gray-200 transition-colors border border-gray-200 border-dashed"
                    >
                      <Plus size={14} />
                      添加
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 2: Ingredient Selection */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-2">请选择本次烹饪消耗的食材及用量</p>
              {inventory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  冰箱空空如也，快去添加食材吧
                </div>
              ) : (
                <div className="space-y-3">
                  {inventory.map(item => {
                    const selected = selectedIngredients.find(i => i.id === item.id);
                    return (
                      <div key={item.id} className={`p-3 rounded-xl border transition-all ${
                        selected ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleIngredient(item)}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'
                            }`}>
                              {selected && <Check size={12} className="text-white" />}
                            </div>
                            <span className={`font-medium ${selected ? 'text-gray-900' : 'text-gray-600'}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{item.quantity}{item.unit}</span>
                        </div>
                        
                        {selected && (
                          <div className="pl-8 pt-2 border-t border-orange-100 flex gap-2 overflow-x-auto pb-1">
                            {USAGE_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => updateUsage(item.id, opt.value)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                  selected.usage === opt.value
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {opt.label}
                                {opt.value === 1 && <span className="ml-1 text-[10px] opacity-75">(删除)</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">今日菜单</h4>
                  <div className="space-y-1">
                    {[...menu.dishes, ...menu.staples, ...menu.soups].length > 0 ? (
                      <>
                         {menu.dishes.length > 0 && <div className="text-sm"><span className="text-gray-500">菜品：</span>{menu.dishes.join('、')}</div>}
                         {menu.soups.length > 0 && <div className="text-sm"><span className="text-gray-500">汤饮：</span>{menu.soups.join('、')}</div>}
                         {menu.staples.length > 0 && <div className="text-sm"><span className="text-gray-500">主食：</span>{menu.staples.join('、')}</div>}
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">未填写菜单</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">消耗食材</h4>
                  {selectedIngredients.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedIngredients.map(item => (
                        <span key={item.id} className={`text-xs px-2 py-1 rounded-md border ${
                          item.usage === 1 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {item.name} {USAGE_OPTIONS.find(u => u.value === item.usage)?.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">未选择消耗食材</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-blue-700 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <p>点击"开始烹饪"将生成美食回忆卡片，自动扣除选择"全部"的食材，部分使用的食材将自动计算剩余量。</p>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {currentStep === 4 && generatedResult && (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden shadow-lg relative mb-4 group">
                <img 
                  src={generatedResult.imageUrl} 
                  alt={generatedResult.mealName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <h3 className="text-2xl font-bold font-serif mb-2">{generatedResult.mealName}</h3>
                  <p className="text-sm opacity-90 mb-4">{generatedResult.moodText}</p>
                  <div className="text-xs opacity-75 font-mono">
                    {new Date().toLocaleDateString()} · HomeCookHub
                  </div>
                </div>
              </div>
              <p className="text-green-600 font-medium flex items-center gap-2">
                <Check size={18} />
                已记录到回忆时间线
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <div className="flex gap-3">
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                上一步
              </button>
            )}
            
            {currentStep < 3 && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                下一步
                <ChevronRight size={18} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成回忆中...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    开始烹饪 & 生成回忆
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={onClose}
                className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-black transition-all"
              >
                完成
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for the Plus icon since I used it above but didn't import it in the right scope? 
// Wait, I imported Plus from lucide-react at the top. But I used Plus inside the map loop. 
// I need to make sure imports are correct.
export default CookingCart;
