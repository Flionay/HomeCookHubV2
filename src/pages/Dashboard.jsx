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
  Sun,
  Moon,
  Coffee,
  Award,
  Activity,
  Utensils,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Settings as SettingsIcon
} from 'lucide-react';

const Dashboard = () => {
  const { inventory, recipes, cookingLogs } = useApp();
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState(null);
  const [weather, setWeather] = useState(null);

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

    // Fetch Weather
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

  // Weather Icon Helper
  const getWeatherIcon = (w) => {
    if (!w) return <Sun size={20} className="text-orange-500" />;
    if (w.includes('雨')) return <CloudRain size={20} className="text-blue-500" />;
    if (w.includes('雪')) return <CloudSnow size={20} className="text-blue-300" />;
    if (w.includes('雷')) return <CloudLightning size={20} className="text-purple-500" />;
    if (w.includes('云') || w.includes('阴')) return <Cloud size={20} className="text-gray-500" />;
    return <Sun size={20} className="text-orange-500" />;
  };

  // Calculate Stats
  const totalItems = inventory.length;
  const expiringItems = inventory.filter(i => {
    if (!i.expiry) return false;
    const days = (new Date(i.expiry) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 3 && days >= 0;
  });
  const expiringCount = expiringItems.length;

  const totalRecipes = recipes.length;
  const topRatedRecipes = recipes.filter(r => r.rating === 5).length;

  // Calculate Cooking Stats
  const totalCooked = cookingLogs.length;
  
  // Calculate Favorite Dishes
  const dishCounts = {};
  cookingLogs.forEach(log => {
    if (!log.menu) return;
    // Handle menu structure (could be object with categories or flat array if changed later, but currently object)
    const items = [];
    if (log.menu.dishes) items.push(...log.menu.dishes);
    if (log.menu.soups) items.push(...log.menu.soups);
    if (log.menu.staples) items.push(...log.menu.staples);
    
    items.forEach(item => {
      dishCounts[item] = (dishCounts[item] || 0) + 1;
    });
  });

  const topDishes = Object.entries(dishCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

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
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500 ${bgClass}`} />
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-3">
            <div className={`p-3 rounded-2xl ${bgClass} bg-opacity-10 ${colorClass}`}>
              <Icon size={24} className="stroke-[2.5px]" />
            </div>
          </div>
          
          <div>
            <h3 className="text-gray-500 font-medium text-sm mb-1">{label}</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
              {subValue && (
                <span className="text-xs font-medium text-gray-400">
                  {subValue}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="animate-in fade-in duration-700 space-y-6 md:space-y-8 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="w-full md:w-auto">
          {/* Weather & Date */}
          <div className="flex items-center justify-between md:justify-start gap-4 mb-2 text-gray-500 font-medium text-sm md:text-base">
            <div className="flex items-center gap-2">
              {timeIcon}
              <span>{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
            </div>
            
            {weather && (
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                {getWeatherIcon(weather.weather)}
                <span className="text-gray-700">{weather.weather}</span>
                <span className="font-bold text-gray-900">{weather.temperature}°C</span>
                <div className="flex items-center gap-1 text-gray-400 text-xs border-l border-gray-200 pl-2 ml-1">
                  <Wind size={12} />
                  <span>{weather.windpower}级</span>
                </div>
              </div>
            )}

            <Link to="/settings" className="md:hidden p-2 bg-gray-100 rounded-full">
              <SettingsIcon size={20} className="text-gray-600" />
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight flex items-center gap-4">
            {greeting}，大厨
            <Link to="/settings" className="hidden md:flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors" title="系统设置">
              <SettingsIcon size={24} className="text-gray-600" />
            </Link>
          </h1>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <Link to="/ai-chef" className="flex-1 md:flex-none justify-center bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95">
            <ChefHat size={20} />
            <span className="md:inline">AI 灵感</span>
          </Link>
          <Link to="/inventory" className="flex-1 md:flex-none justify-center bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95">
            <Plus size={20} />
            <span className="md:inline">记食材</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <StatCard 
          icon={Refrigerator}
          label="库存食材"
          value={totalItems}
          subValue={expiringCount > 0 ? `${expiringCount} 临期` : "新鲜"}
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
        <div className="col-span-2 md:col-span-1">
          <StatCard 
            icon={Utensils}
            label="烹饪次数"
            value={totalCooked}
            subValue="次下厨"
            colorClass="text-green-600"
            bgClass="bg-green-500"
            to="/memories"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column - Featured Recommendation */}
        <div className="md:col-span-7">
          <div className="h-[300px] md:h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
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
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-1">
                      <Zap size={12} fill="currentColor" />
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

        {/* Right Column - Insights & Stats */}
        <div className="md:col-span-5 flex flex-col gap-4">
          {/* Favorites / Frequency */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-yellow-500" size={20} />
              <h3 className="font-bold text-gray-800">最爱吃</h3>
            </div>
            
            {topDishes.length > 0 ? (
              <div className="space-y-4">
                {topDishes.map((dish, index) => (
                  <div key={index} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-700">{dish.name}</span>
                    </div>
                    <div className="text-sm text-gray-400 group-hover:text-orange-500 transition-colors">
                      {dish.count} 次
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无烹饪记录
              </div>
            )}
          </div>

          {/* Expiring Soon */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="font-bold text-gray-800">急需处理</h3>
            </div>

            {expiringItems.length > 0 ? (
              <div className="space-y-3">
                {expiringItems.slice(0, 3).map((item, index) => {
                  const days = Math.ceil((new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-red-50/50 border border-red-100">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🥕</span>
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded-lg shadow-sm">
                        {days === 0 ? '今天' : `剩 ${days} 天`}
                      </span>
                    </div>
                  );
                })}
                {expiringItems.length > 3 && (
                  <Link to="/inventory" className="text-center block text-xs text-gray-400 hover:text-gray-600 mt-2">
                    查看全部 {expiringItems.length} 个临期食材
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                  <Refrigerator className="text-green-500" size={20} />
                </div>
                食材都很新鲜
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
