import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Refrigerator, BookOpen, ChefHat, Settings, LayoutDashboard, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Layout = ({ children }) => {
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '首页' },
    { path: '/inventory', icon: Refrigerator, label: '食材' },
    { path: '/recipes', icon: BookOpen, label: '菜谱' },
    { path: '/ai-chef', icon: ChefHat, label: '主厨' },
    { path: '/settings', icon: Settings, label: '设置' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Desktop Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-orange-50/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 font-bold text-2xl text-orange-600 tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-2 rounded-xl text-orange-600 shadow-sm">
              <ChefHat className="h-6 w-6" />
            </div>
            <span className="font-serif tracking-tight text-gray-800">HomeCook<span className="text-orange-600">Hub</span></span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      isActive 
                        ? 'bg-orange-50 text-orange-600 shadow-sm' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={18} className={isActive ? "stroke-[2.5px]" : "stroke-2"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 md:hidden z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform ${
                  isActive ? 'text-orange-600' : 'text-gray-400'
                }`}
              >
                <div className={`p-1 rounded-full ${isActive ? 'bg-orange-50' : ''}`}>
                  <Icon className={`h-6 w-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
