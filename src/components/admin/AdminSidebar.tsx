import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Wrench, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Folder,
  Calendar,
  MessageSquare,
  Webhook
} from 'lucide-react';

const menuItems = [
  {
    title: 'لوحة التحكم',
    icon: LayoutDashboard,
    path: '/admin-dashboard',
    badge: null
  },
  {
    title: 'المشاريع',
    icon: Building,
    path: '/project-management',
    badge: null
  },
  {
    title: 'طلبات الصيانة',
    icon: Wrench,
    path: '/maintenance-list',
    badge: '8'
  },
  {
    title: 'المستخدمين',
    icon: Users,
    path: '/users-management',
    badge: null
  },
  {
    title: 'التقارير',
    icon: BarChart3,
    path: '/reports',
    badge: null
  },
  {
    title: 'الملفات',
    icon: Folder,
    path: '/files-management',
    badge: null
  },
  {
    title: 'الرسائل',
    icon: MessageSquare,
    path: '/messages',
    badge: '3'
  },
  {
    title: 'مراقبة الويب هوك',
    icon: Webhook,
    path: '/webhook-monitor',
    badge: null
  },
  {
    title: 'التقويم',
    icon: Calendar,
    path: '/calendar',
    badge: null
  },
  {
    title: 'الإعدادات',
    icon: Settings,
    path: '/settings',
    badge: null
  },
  {
    title: 'المساعدة',
    icon: HelpCircle,
    path: '/help',
    badge: null
  }
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside 
      className="w-64 min-h-screen border-l"
      style={{
        backgroundColor: 'white',
        borderColor: 'var(--azab-border-color)'
      }}
    >
      <div className="p-6">
        {/* Navigation Menu */}
        <nav className="mt-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'text-white shadow-md' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? 'var(--azab-primary)' : 'transparent',
                    transition: 'var(--azab-transition)'
                  }}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  {item.badge && (
                    <span 
                      className="px-2 py-1 text-xs rounded-full text-white"
                      style={{ backgroundColor: 'var(--azab-accent)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div 
          className="mt-8 p-4 rounded-lg"
          style={{ backgroundColor: 'var(--azab-light)' }}
        >
          <h4 
            className="font-bold text-sm mb-2"
            style={{ color: 'var(--azab-primary)' }}
          >
            الإحصائيات السريعة
          </h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>المشاريع النشطة</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span>طلبات معلقة</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span>مهام اليوم</span>
              <span className="font-medium">5</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};