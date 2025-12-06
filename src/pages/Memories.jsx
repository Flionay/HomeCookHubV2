import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Calendar, Clock, ChefHat, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

const Memories = () => {
  const { cookingLogs, user } = useApp();
  const [showSettingsHint, setShowSettingsHint] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500 relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-3xl">📸</span>
            温馨食光
          </h1>
          <p className="text-sm text-gray-500 mt-1">记录每一次烹饪的幸福时刻</p>
        </div>
        
        <Link 
          to="/settings"
          className="text-gray-300 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          onMouseEnter={() => setShowSettingsHint(true)}
          onMouseLeave={() => setShowSettingsHint(false)}
        >
          <SettingsIcon size={20} />
          {showSettingsHint && (
            <div className="absolute right-0 top-12 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
              系统设置
            </div>
          )}
        </Link>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto px-1 pb-20">
        {cookingLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 mt-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Camera size={40} className="text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">还没有烹饪记录</p>
            <p className="text-sm mt-2">点击右下角的 "开始烹饪" 记录你的第一顿大餐吧！</p>
          </div>
        ) : (
          <div className="relative space-y-12 pl-6 before:absolute before:left-2 before:top-2 before:bottom-0 before:w-0.5 before:bg-gradient-to-b before:from-orange-200 before:to-transparent">
            {cookingLogs.map((log) => (
              <div key={log.id} className="relative animate-in slide-in-from-bottom-4 duration-500">
                {/* Timeline Dot */}
                <div className="absolute -left-[29px] top-2 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-sm ring-1 ring-orange-100" />
                
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-3 text-sm text-gray-500">
                  <span className="font-bold text-gray-800 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(log.date)}
                  </span>
                  <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                    <Clock size={12} />
                    {formatTime(log.date)}
                  </span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="md:flex">
                    {/* Image Section */}
                    <div className="md:w-1/3 aspect-[4/3] md:aspect-auto relative overflow-hidden bg-gray-100">
                      {log.image_url ? (
                        <img 
                          src={log.image_url} 
                          alt={log.meal_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ChefHat size={40} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
                      <div className="absolute bottom-4 left-4 right-4 text-white md:hidden">
                        <h3 className="text-xl font-bold font-serif">{log.meal_name}</h3>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 md:w-2/3 flex flex-col justify-between">
                      <div>
                        <h3 className="hidden md:block text-2xl font-bold font-serif text-gray-800 mb-2">
                          {log.meal_name}
                        </h3>
                        
                        <div className="space-y-4">
                          <p className="text-gray-600 italic border-l-2 border-orange-200 pl-3 py-1">
                            "{log.mood_text || '又是美味的一餐~'}"
                          </p>

                          {log.menu && (
                            <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 p-3 rounded-xl">
                              <div className="space-y-1">
                                <span className="text-xs text-gray-400 font-bold uppercase">菜品</span>
                                <p className="text-gray-700 truncate">{log.menu.dishes?.join('、') || '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-gray-400 font-bold uppercase">汤饮</span>
                                <p className="text-gray-700 truncate">{log.menu.soups?.join('、') || '-'}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-gray-400 font-bold uppercase">主食</span>
                                <p className="text-gray-700 truncate">{log.menu.staples?.join('、') || '-'}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                        <div className="flex gap-2">
                          {log.tags && log.tags.map(tag => (
                            <span key={tag} className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-md font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          ID: {log.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Memories;
