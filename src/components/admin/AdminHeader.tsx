import React from 'react';
import { Bell, Settings, User, LogOut, Search, Menu } from 'lucide-react';
import Logo from "@/components/shared/Logo";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "تم تسجيل خروجك من النظام",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  return (
    <header 
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'white',
        borderColor: 'var(--azab-border-color)',
        boxShadow: 'var(--azab-shadow-sm)'
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Right Side - Logo & Title */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <Logo variant="compact" linkTo="/admin-dashboard" showText={false} />
          <div>
            <h1 
              className="text-xl font-bold"
              style={{ color: 'var(--azab-primary)' }}
            >
              لوحة تحكم المدير
            </h1>
            <p className="text-sm text-gray-500">شركة العزب للمقاولات</p>
          </div>
        </div>

        {/* Left Side - Actions */}
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="البحث..."
              className="pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              style={{
                borderColor: 'var(--azab-border-color)'
              }}
            />
          </div>

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ transition: 'var(--azab-transition)' }}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full text-xs flex items-center justify-center"
              style={{ backgroundColor: 'var(--azab-error)' }}
            ></span>
          </button>

          {/* Settings */}
          <button 
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ transition: 'var(--azab-transition)' }}
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p 
                className="text-xs"
                style={{ color: 'var(--azab-secondary)' }}
              >
                مدير النظام
              </p>
            </div>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: 'var(--azab-primary)' }}
            >
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              style={{ transition: 'var(--azab-transition)' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};