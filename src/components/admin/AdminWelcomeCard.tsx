import React from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

interface AdminWelcomeCardProps {
  userName?: string;
}

export const AdminWelcomeCard: React.FC<AdminWelcomeCardProps> = ({ userName }) => {
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className="rounded-xl p-8 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, var(--azab-primary) 0%, var(--azab-secondary) 100%)`,
        boxShadow: 'var(--azab-shadow-lg)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full border-2 border-white"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full border border-white"></div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Welcome Text */}
          <div className="mb-6 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              مرحباً بك {userName ? `، ${userName.split('@')[0]}` : ''}
            </h1>
            <p className="text-xl opacity-90 mb-4">
              مرحباً بك في لوحة تحكم المدير - شركة العزب للمقاولات
            </p>
            <div className="flex flex-wrap items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{currentDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{currentTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>أداء ممتاز هذا الشهر</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold">12</div>
              <div className="text-sm opacity-80">مشروع نشط</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold">8</div>
              <div className="text-sm opacity-80">طلب صيانة</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-2xl md:text-3xl font-bold">45</div>
              <div className="text-sm opacity-80">مهمة مكتملة</div>
            </div>
            <div className="text-center col-span-2 md:col-span-1">
              <div className="text-2xl md:text-3xl font-bold">98%</div>
              <div className="text-sm opacity-80">معدل الرضا</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};