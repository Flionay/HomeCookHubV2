import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Calendar, Clock, ChefHat, Camera, X, Download, Share2, ZoomIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const Memories = () => {
  const { cookingLogs, user } = useApp();
  const [showSettingsHint, setShowSettingsHint] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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

  const handleDownload = async (imageUrl, fileName) => {
      try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName || 'memory-image.jpg';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
      } catch (error) {
          console.error('Download failed:', error);
          alert('下载失败，请重试');
      }
  };

  const handleShare = async (imageUrl, title) => {
      if (navigator.share) {
          try {
              await navigator.share({
                  title: title || '温馨食光',
                  text: '看看我做的美食！',
                  url: imageUrl
              });
          } catch (error) {
              console.error('Share failed:', error);
          }
      } else {
          // Fallback for browsers that don't support Web Share API
          navigator.clipboard.writeText(imageUrl).then(() => {
              alert('图片链接已复制到剪贴板');
          }, (err) => {
              console.error('Async: Could not copy text: ', err);
          });
      }
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
                    <div 
                        className="md:w-1/3 aspect-[4/3] md:aspect-auto relative overflow-hidden bg-gray-100 cursor-zoom-in"
                        onClick={() => log.image_url && setPreviewImage({ url: log.image_url, title: log.meal_name })}
                    >
                      {log.image_url ? (
                        <>
                            <img 
                              src={log.image_url} 
                              alt={log.meal_name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="text-white drop-shadow-md" size={32} />
                            </div>
                        </>
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewImage(null)}
        >
            <div 
                className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
                onClick={e => e.stopPropagation()}
            >
                {/* Toolbar */}
                <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
                     <button 
                        onClick={() => handleShare(previewImage.url, previewImage.title)}
                        className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                        title="分享"
                    >
                        <Share2 size={20} />
                    </button>
                    <button 
                        onClick={() => handleDownload(previewImage.url, `${previewImage.title}.jpg`)}
                        className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                        title="下载"
                    >
                        <Download size={20} />
                    </button>
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Image */}
                <img 
                    src={previewImage.url} 
                    alt={previewImage.title} 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                
                {/* Caption */}
                <div className="mt-4 text-white/90 font-medium text-lg">
                    {previewImage.title}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Memories;
