import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  MessageCircle, 
  Folder, 
  CheckCircle2, 
  Filter
} from 'lucide-react';

// MOCK DATA for now
const mockNotifications = [
  {
    id: 1,
    source: 'meta',
    title: 'رسالة واتساب جديدة من زريبة ميتا',
    message: 'تم استلام رسالة جديدة من عميل محتمل.',
    isRead: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: 2,
    source: 'seafile',
    title: 'ملف جديد تمت إضافته في سي فايل',
    message: 'تم رفع ملف تصميمات المشروع في المجلد المشترك.',
    isRead: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    source: 'system',
    title: 'تحديث النظام',
    message: 'تم تفعيل التحديثات الجديدة بنجاح وإضافة مصادر إشعارات جديدة.',
    isRead: true,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function NotificationsHub() {
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'meta' | 'seafile'>('all');

  const [settings, setSettings] = useState({
    meta: true,
    seafile: true,
    system: true,
    emailAlerts: false,
    pushAlerts: true,
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'meta': return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'seafile': return <Folder className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'meta': return 'ميتا (WhatsApp/Facebook)';
      case 'seafile': return 'Seafile';
      default: return 'النظام';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    return n.source === filter;
  });

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl mt-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
          <Bell className="w-8 h-8 text-construction-primary" />
          مركز الإشعارات الموحد
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              activeTab === 'list' 
                ? 'border-b-2 border-construction-primary text-construction-primary bg-construction-primary/5' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            تتبع الإشعارات
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${
              activeTab === 'settings' 
                ? 'border-b-2 border-construction-primary text-construction-primary bg-construction-primary/5' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            إعدادات المصادر
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'list' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'all' ? 'bg-construction-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الكل</button>
                <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'unread' ? 'bg-construction-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>غير مقروءة</button>
                <button onClick={() => setFilter('meta')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'meta' ? 'bg-construction-primary text-white shadow-md' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>زريبة ميتا</button>
                <button onClick={() => setFilter('seafile')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${filter === 'seafile' ? 'bg-construction-primary text-white shadow-md' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>سي فايل</button>
              </div>

              {/* List */}
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    لا توجد إشعارات حالياً في هذا القسم.
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                        notification.isRead 
                          ? 'bg-white border-gray-100' 
                          : 'bg-blue-50/50 border-blue-200 shadow-sm transform scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${notification.isRead ? 'bg-gray-50' : 'bg-white shadow-sm'}`}>
                          {getSourceIcon(notification.source)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                  notification.source === 'meta' ? 'bg-green-100 text-green-700' :
                                  notification.source === 'seafile' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {getSourceName(notification.source)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(notification.timestamp).toLocaleString('ar-EG', {
                                    hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <h3 className={`font-semibold text-lg ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                {notification.title}
                              </h3>
                              <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
                                {notification.message}
                              </p>
                            </div>
                            
                            {!notification.isRead && (
                              <button 
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 text-construction-primary hover:bg-construction-primary/10 rounded-full transition-colors"
                                title="تحديد كمقروء"
                              >
                                <CheckCircle2 className="w-6 h-6" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-800">تفعيل المصادر</h3>
                <div className="space-y-4">
                  
                  {/* Meta Settings */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">زريبة ميتا (Meta)</h4>
                        <p className="text-sm text-gray-500">إشعارات من هوكات العجول (WhatsApp / Facebook)</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.meta} onChange={(e) => setSettings({...settings, meta: e.target.checked})} />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>

                  {/* Seafile Settings */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Folder className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">سي فايل (Seafile)</h4>
                        <p className="text-sm text-gray-500">تنبيهات عند دخول ملفات جديدة أو مزامنة</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.seafile} onChange={(e) => setSettings({...settings, seafile: e.target.checked})} />
                      <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-4 border-b pb-2 text-gray-800">طرق الاستلام</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-xl hover:border-gray-300 transition-colors">
                    <div>
                      <h4 className="font-semibold text-gray-900">إشعارات داخل النظام (Push)</h4>
                      <p className="text-sm text-gray-500">ظهور الإشعارات المنبثقة أثناء استخدام المنصة</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.pushAlerts} onChange={(e) => setSettings({...settings, pushAlerts: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-construction-primary"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-xl hover:border-gray-300 transition-colors">
                    <div>
                      <h4 className="font-semibold text-gray-900">رسائل البريد الإلكتروني</h4>
                      <p className="text-sm text-gray-500">استلام ملخص الإشعارات المهمة على البريد</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.emailAlerts} onChange={(e) => setSettings({...settings, emailAlerts: e.target.checked})} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-construction-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 flex justify-end">
                <button className="px-8 py-3 bg-construction-primary text-white rounded-xl shadow-lg shadow-construction-primary/30 hover:bg-construction-primary/90 transition-all font-bold transform hover:scale-105">
                  حفظ الإعدادات
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
