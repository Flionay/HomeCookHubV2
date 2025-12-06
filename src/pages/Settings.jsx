import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Save, Settings as SettingsIcon, Database } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  // Sync form data when settings change in context
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = (e) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-gray-600" />
          系统设置
        </h1>
        <p className="text-gray-500 mt-1">配置你的 AI 助手和系统参数</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Database size={20} className="text-orange-500" />
            AI 模型配置
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            连接到 OpenAI 或兼容的 LLM 服务提供商
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                API Base URL
              </label>
              <input
                type="text"
                value={formData.apiUrl}
                onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all font-mono text-sm"
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-gray-500">
                如果你使用 OpenAI 兼容的接口（如 DeepSeek, Moonshot 等），请填写对应的 Base URL。
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                API Token (Key)
              </label>
              <input
                type="password"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all font-mono text-sm"
                placeholder="sk-..."
              />
              <p className="text-xs text-gray-500">
                Key 仅保存在本地浏览器中，不会上传到任何第三方服务器。
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                模型名称 (Model)
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all font-mono text-sm"
                placeholder="gpt-3.5-turbo"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                绘图模型名称 (Image Model)
              </label>
              <input
                type="text"
                value={formData.imageModel || ''}
                onChange={(e) => setFormData({ ...formData, imageModel: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all font-mono text-sm"
                placeholder="dall-e-3"
              />
              <p className="text-xs text-gray-500">
                用于生成菜品配图，需支持 OpenAI 格式的 /v1/images/generations 接口。
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-6">
              {saved ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg animate-in fade-in">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium">设置已保存</span>
                </div>
              ) : (
                <span></span>
              )}
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
              >
                <Save size={18} />
                <span className="font-medium">保存配置</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
