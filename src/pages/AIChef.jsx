import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, RotateCw, Utensils, Users, User, MessageSquare } from 'lucide-react';

const AIChef = () => {
  const { inventory, recipes, settings } = useApp();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [peopleCount, setPeopleCount] = useState(3);
  const [chefName, setChefName] = useState('随机');

  const getChefSpecialties = (chef) => {
    if (chef === '随机') return '各式菜系';
    const chefRecipes = recipes.filter(r => r.chef === chef);
    if (chefRecipes.length === 0) return '暂无特定记录';
    
    const types = [...new Set(chefRecipes.map(r => r.type))];
    const flavors = [...new Set(chefRecipes.map(r => r.flavor))];
    
    return `${types.join('、')}，擅长口味：${flavors.join('、')}`;
  };

  const generateMenu = async () => {
    if (!settings.apiToken) {
      alert('请先在设置页面配置 AI API Token');
      return;
    }

    setLoading(true);
    setResult(null);

    const inventoryStr = inventory.map(i => `${i.name}(${i.quantity}${i.unit})`).join(', ') || "暂无食材";
    const recipeStr = recipes.map(r => `${r.name}(${r.chef}, ${r.type}, ${r.flavor})`).join('\n') || "暂无菜谱记录";
    const chefSpecialties = getChefSpecialties(chefName);

    const promptText = `
     你是一位专业的家庭主厨，正在为通过家庭库存和历史食谱规划一顿美餐。
     
     当前家庭库存 (Inventory):
     ${inventoryStr}
 
     家庭拿手菜谱 (History):
     ${recipeStr}
 
     需求详情:
     - 掌勺大厨: ${chefName} 他的可参考拿手菜系是${chefSpecialties}
     - 用餐人数: ${peopleCount}
     - 特殊备注/想吃什么: ${customPrompt || "无"}
 
     任务:
     请根据库存和偏好设计一份和谐的菜单（通常1-2道菜，根据人数变化）。
     1. 优先消耗库存中的食材。
     2. 可以从拿手菜谱中选择，也可以根据库存推荐新菜。
     3. 所有的输出必须是**简体中文**。
     4. 菜名要好听，步骤要简洁明了。
   `;

    try {
      const response = await fetch(`${settings.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiToken}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: '你是一位专业的家庭主厨助手，擅长根据现有食材或历史喜好推荐菜谱。请用温馨、简洁的中文回答。' },
            { role: 'user', content: promptText }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }
      setResult(data.choices[0].message.content);
    } catch (error) {
      console.error('AI Request failed:', error);
      setResult(`抱歉，AI 主厨开小差了：${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Sparkles className="text-orange-500" />
          AI 智能主厨
        </h1>
        <p className="text-gray-500 mt-1">告诉 AI 你的需求，为你定制今日完美菜单</p>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* People Count */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users size={18} className="text-orange-500" />
                用餐人数
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all"
              />
            </div>

            {/* Chef Selection */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <User size={18} className="text-orange-500" />
                掌勺大厨
              </label>
              <select
                value={chefName}
                onChange={(e) => setChefName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all"
              >
                <option value="随机">随机安排</option>
                <option value="男主人">男主人</option>
                <option value="女主人">女主人</option>
                <option value="其他">其他</option>
              </select>
            </div>
          </div>

          {/* Special Notes */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MessageSquare size={18} className="text-orange-500" />
              特殊备注 / 想吃什么
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 min-h-[100px] resize-none"
              placeholder="例如：今天想吃清淡点的，冰箱里那块牛肉必须消耗掉..."
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateMenu}
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
          >
            {loading ? (
              <>
                <RotateCw className="animate-spin" />
                AI 正在精心设计菜单...
              </>
            ) : (
              <>
                <Utensils />
                生成今日菜单
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Area */}
      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-orange-100 animate-in slide-in-from-bottom-4 duration-500">
          <div className="prose prose-orange max-w-none">
            <div className="whitespace-pre-wrap font-medium text-gray-800 leading-relaxed">
              {result}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => setResult(null)}
              className="text-gray-500 hover:text-gray-800 text-sm font-medium flex items-center gap-1"
            >
              <RotateCw size={14} /> 重置
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChef;
