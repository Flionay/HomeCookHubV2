import React from 'react';
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
  AlertCircle
} from 'lucide-react';

const Dashboard = () => {
  const { inventory, recipes } = useApp();

  // Calculate Stats
  const totalItems = inventory.length;
  const expiringSoon = inventory.filter(i => {
    if (!i.expiry) return false;
    const days = (new Date(i.expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 3 && days >= 0;
  }).length;

  const totalRecipes = recipes.length;
  const topRatedRecipes = recipes.filter(r => r.rating === 5).length;

  // Get a random recommendation
  const recommendation = recipes.length > 0 
    ? recipes[Math.floor(Math.random() * recipes.length)] 
    : null;

  const StatCard = ({ icon: Icon, label, value, subValue, colorClass, to }) => (
    <Link to={to} className="block group">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all h-full relative overflow-hidden">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
          <Icon size={64} />
        </div>
        <div className="relative z-10">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClass.replace('text-', 'bg-').replace('500', '50')} ${colorClass}`}>
            <Icon size={24} />
          </div>
          <h3 className="text-gray-500 font-medium text-sm mb-1">{label}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">{value}</span>
            {subValue && <span className="text-xs font-medium text-gray-400">{subValue}</span>}
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              欢迎回到 HomeCook<span className="text-orange-500">Hub</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              今天想吃点什么？你的智能厨房助手已准备就绪。
              <br className="hidden md:block" />
              我们可以帮你管理食材、记录菜谱，甚至为你设计今日菜单。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/ai-chef" 
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-900/20 flex items-center gap-2 active:scale-95"
              >
                <ChefHat size={20} />
                <span>AI 智能点餐</span>
              </Link>
              <Link 
                to="/inventory" 
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <Refrigerator size={20} />
                <span>查看冰箱</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Refrigerator}
          label="库存食材"
          value={totalItems}
          subValue={expiringSoon > 0 ? `${expiringSoon} 个临期` : "状态良好"}
          colorClass="text-blue-500"
          to="/inventory"
        />
        <StatCard 
          icon={BookOpen}
          label="拿手菜谱"
          value={totalRecipes}
          subValue={`${topRatedRecipes} 个五星好评`}
          colorClass="text-green-500"
          to="/recipes"
        />
        <StatCard 
          icon={TrendingUp}
          label="本周烹饪"
          value="0" // Placeholder for future feature
          subValue="次"
          colorClass="text-purple-500"
          to="#"
        />
      </div>

      {/* Daily Recommendation */}
      {recommendation && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="text-orange-500" size={24} fill="currentColor" />
              今日推荐
            </h2>
            <Link to="/recipes" className="text-sm text-gray-500 hover:text-orange-600 flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-orange-50 flex items-center justify-center text-4xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                👨‍🍳
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">
                    {recommendation.type}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold">
                    {recommendation.chef}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold">
                    {recommendation.flavor}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {recommendation.name}
                </h3>
                {recommendation.notes && (
                  <p className="text-gray-500 text-sm line-clamp-2 italic">
                    "{recommendation.notes}"
                  </p>
                )}
              </div>
              <div className="flex md:flex-col gap-2 shrink-0">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      className={i < recommendation.rating ? "text-yellow-400" : "text-gray-200"} 
                      fill={i < recommendation.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
