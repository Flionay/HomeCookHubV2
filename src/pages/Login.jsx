import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, ArrowRight, Loader } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      
      // Navigate to dashboard on success
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4 text-orange-600 shadow-inner">
            <ChefHat size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">欢迎回家</h1>
          <p className="text-gray-500 mt-2">HomeCookHub 家庭厨房助手</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 animate-in slide-in-from-top-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">邮箱</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                placeholder="enter@email.com"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 ml-1">密码</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader className="animate-spin" size={20} /> : (
              <>
                <span>登录</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>

          <div className="text-center mt-6 text-xs text-gray-400">
            私人家庭应用，请联系管理员获取账号
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
