import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { auth, backup } from '../apiClient';
import { 
  Save, Settings as SettingsIcon, Database, Users, Download, 
  Trash2, Edit, Plus, X, Check, Shield, AlertCircle
} from 'lucide-react';

const AIConfigSection = ({ settings, updateSettings }) => {
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    await updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
          <Database size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">AI 模型配置</h2>
          <p className="text-sm text-gray-500">连接到 OpenAI 或兼容的 LLM 服务提供商</p>
        </div>
      </div>

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
            Key 将加密保存在云端数据库，供家庭成员共享使用。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            分享图生成模型 (Share Image Model)
          </label>
          <input
            type="text"
            value={formData.shareImageModel || ''}
            onChange={(e) => setFormData({ ...formData, shareImageModel: e.target.value })}
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 transition-all font-mono text-sm"
            placeholder="gemini-1.5-pro"
          />
          <p className="text-xs text-gray-500">
            用于生成高质量海报式分享图 (Gemini 3 Pro 等)。
          </p>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-6">
          {saved ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg animate-in fade-in">
              <Check size={16} />
              <span className="text-sm font-medium">配置已保存</span>
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
  );
};

const UserManagementSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for create, user obj for edit
  
  // Form state
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await auth.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('无法加载用户列表');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ email: user.email, full_name: user.full_name || '', password: '' });
    setIsEditing(true);
    setError(null);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', full_name: '', password: '' });
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update
        const updateData = { 
          email: formData.email, 
          full_name: formData.full_name 
        };
        if (formData.password) updateData.password = formData.password;
        
        await auth.updateUser(editingUser.id, updateData);
      } else {
        // Create
        if (!formData.password) {
          setError('新建用户必须设置密码');
          return;
        }
        await auth.createUser(formData);
      }
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个用户吗？此操作无法撤销。')) {
      try {
        await auth.deleteUser(id);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.detail || '删除失败');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">用户管理</h2>
            <p className="text-sm text-gray-500">管理家庭成员账号和权限</p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          添加用户
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isEditing ? (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-top-2">
          <h3 className="font-bold text-gray-900 mb-4">{editingUser ? '编辑用户' : '新建用户'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱/用户名</label>
                <input
                  type="text"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? '重置密码 (留空则不修改)' : '设置密码'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editingUser ? "••••••••" : "请输入密码"}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {editingUser ? '保存修改' : '创建用户'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">用户</th>
                  <th className="px-6 py-3">邮箱</th>
                  <th className="px-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">加载中...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">暂无用户</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">{user.full_name || '未命名'}</td>
                      <td className="px-6 py-3 text-gray-500">{user.email}</td>
                      <td className="px-6 py-3 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="编辑"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const BackupSection = () => {
  const handleDownload = async () => {
    try {
      await backup.downloadDb();
    } catch (err) {
      alert('下载失败');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">数据备份</h2>
          <p className="text-sm text-gray-500">下载数据库文件以防止数据丢失</p>
        </div>
      </div>

      <div className="bg-green-50/50 border border-green-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Database className="text-green-600 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">SQLite 数据库备份</h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              下载完整的 homecook.db 文件。包含所有用户、菜谱、库存和设置数据。
              请妥善保管此文件。
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200 active:scale-95"
            >
              <Download size={18} />
              <span className="font-medium">下载数据库文件</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'ai', label: 'AI 配置', icon: SettingsIcon },
    { id: 'backup', label: '数据备份', icon: Database },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <SettingsIcon className="text-gray-600" />
          系统设置
        </h1>
        <p className="text-gray-500 mt-1">配置你的 AI 助手和系统参数</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : ''} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          {activeTab === 'users' && <UserManagementSection />}
          {activeTab === 'ai' && <AIConfigSection settings={settings} updateSettings={updateSettings} />}
          {activeTab === 'backup' && <BackupSection />}
        </div>
      </div>
    </div>
  );
};

export default Settings;
