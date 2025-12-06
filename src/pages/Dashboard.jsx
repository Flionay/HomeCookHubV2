import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Refrigerator, 
  BookOpen, 
  ChefHat, 
  ArrowRight, 
  TrendingUp, 
  Star, 
  Clock,
  AlertCircle,
  Plus,
  Zap,
  ShoppingBag,
  Image as ImageIcon,
  Sun,
  Moon,
  Coffee
} from 'lucide-react';

const Dashboard = () => {
  const { inventory, recipes } = useApp();
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 11) {
      setGreeting('早上好');
      setTimeIcon(<Coffee className="text-orange-500" size={24} />);
    } else if (hour < 14) {
      setGreeting('中午好');
      setTimeIcon(<Sun className="text-orange-500" size={24} />);
    } else if (hour < 18) {
      setGreeting('下午好');
      setTimeIcon(<Sun className="text-orange-400" size={24} />);
    } else {
      setGreeting('晚上好');
      setTimeIcon(<Moon className="text-indigo-500" size={24} />);
    }
  }, []);

  // Calculate Stats
  const totalItems = inventory.length;
  const expiringSoon = inventory.filter(i => {
    if (!i.expiry) return false;
    const days = (new Date(i.expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 3 && days >= 0;
  }).length;

  const totalRecipes = recipes.length;
  const topRatedRecipes = recipes.filter(r => r.rating === 5).length;

  // Get a random recommendation (prefer ones with images)
  const recommendation = React.useMemo(() => {
    if (recipes.length === 0) return null;
    const withImages = recipes.filter(r => r.imageUrl);
    if (withImages.length > 0) {
      return withImages[Math.floor(Math.random() * withImages.length)];
    }
    return recipes[Math.floor(Math.random() * recipes.length)];
  }, [recipes]);

  const StatCard = ({ icon: Icon, label, value, subValue, colorClass, bgClass, to }) => (
    <Link to={to} className="block group h-full">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${bgClass}`} />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${bgClass} bg-opacity-10 ${colorClass}`}>
              <Icon size={24} className="stroke-[2.5px]" />
            </div>
            {subValue && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                subValue.includes('临期') ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
              }`}>
                {subValue}
              </span>
            )}
          </div>
          
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">{label}</h3>
            <span className="text-4xl font-bold text-gray-900 tracking-tight">{value}</span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-gray-500 font-medium">
            {timeIcon}
            <span>{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {greeting}，大厨
          </h1>
        </div>
        
        <div className="flex gap-3">
          <Link to="/ai-chef" className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95">
            <ChefHat size={20} />
            <span className="hidden md:inline">AI 灵感</span>
          </Link>
          <Link to="/inventory" className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95">
            <Plus size={20} />
            <span className="hidden md:inline">记食材</span>
          </Link>
        </div>
      </div>

      {/* Hero / Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Stats */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-6">
          <StatCard 
            icon={Refrigerator}
            label="库存食材"
            value={totalItems}
            subValue={expiringSoon > 0 ? `${expiringSoon} 临期` : "新鲜"}
            colorClass="text-blue-600"
            bgClass="bg-blue-500"
            to="/inventory"
          />
          <StatCard 
            icon={BookOpen}
            label="拿手菜谱"
            value={totalRecipes}
            subValue={`${topRatedRecipes} 五星`}
            colorClass="text-orange-600"
            bgClass="bg-orange-500"
            to="/recipes"
          />
        </div>

        {/* Right Column - Featured / Recommendation */}
        <div className="md:col-span-8">
          <div className="h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
            {recommendation ? (
              <Link to="/recipes" className="block h-full relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                
                {recommendation.imageUrl ? (
                  <img 
                    src={recommendation.imageUrl} 
                    alt={recommendation.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                    <span className="text-9xl">🍲</span>
                  </div>
                )}

                <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md">
                      今日推荐
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                      {recommendation.chef} 的拿手菜
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                        {recommendation.name}
                      </h2>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={18} 
                            className={i < recommendation.rating ? "text-yellow-400" : "text-gray-400"} 
                            fill={i < recommendation.rating ? "currentColor" : "none"}
                          />
                        ))}
                        <span className="text-gray-300 text-sm ml-2">
                          {recommendation.type} · {recommendation.flavor}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white text-black p-3 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowRight size={24} />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                  <ChefHat size={48} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">还没有菜谱？</h3>
                <p className="text-gray-500 mb-6">记录下你的第一道拿手菜，让 AI 为你推荐。</p>
                <Link to="/recipes" className="text-orange-600 font-bold hover:underline">
                  去添加菜谱 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Actions / Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/ai-chef" className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform" />
          <Zap size={32} className="mb-4 text-yellow-300" />
          <div className="font-bold text-lg">AI 极速点餐</div>
          <div className="text-indigo-100 text-sm opacity-80">不知道吃什么？</div>
        </Link>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-orange-200 transition-all">
          <div className="flex justify-between items-start">
            <ShoppingBag size={32} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">即将推出</span>
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">购物清单</div>
            <div className="text-gray-400 text-sm">自动生成补货单</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-orange-200 transition-all">
          <div className="flex justify-between items-start">
            <TrendingUp size={32} className="text-gray-400 group-hover:text-green-500 transition-colors" />
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-lg">即将推出</span>
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">健康周报</div>
            <div className="text-gray-400 text-sm">家庭营养分析</div>
          </div>
        </div>

        <Link to="/settings" className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex flex-col justify-between hover:bg-gray-100 transition-all">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ImageIcon size={20} className="text-gray-600" />
          </div>
          <div>
            <div className="font-bold text-lg text-gray-900">系统设置</div>
            <div className="text-gray-500 text-sm">模型与偏好</div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
