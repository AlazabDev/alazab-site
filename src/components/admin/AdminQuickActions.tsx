import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Users, 
  Settings, 
  BarChart3, 
  MessageSquare,
  Calendar,
  Download
} from 'lucide-react';

const quickActions = [
  {
    title: "مشروع جديد",
    description: "إنشاء مشروع جديد",
    icon: Plus,
    path: "/project-management",
    color: "var(--azab-primary)",
    bgColor: "rgba(26, 54, 93, 0.1)"
  },
  {
    title: "طلب صيانة",
    description: "إنشاء طلب صيانة جديد",
    icon: FileText,
    path: "/maintenance-request",
    color: "var(--azab-accent)",
    bgColor: "rgba(245, 158, 11, 0.1)"
  },
  {
    title: "إدارة المستخدمين",
    description: "عرض وإدارة المستخدمين",
    icon: Users,
    path: "/users-management",
    color: "var(--azab-secondary)",
    bgColor: "rgba(45, 90, 123, 0.1)"
  },
  {
    title: "التقارير",
    description: "عرض التقارير والإحصائيات",
    icon: BarChart3,
    path: "/reports",
    color: "var(--azab-success)",
    bgColor: "rgba(16, 185, 129, 0.1)"
  },
  {
    title: "الرسائل",
    description: "إدارة الرسائل والإشعارات",
    icon: MessageSquare,
    path: "/messages",
    color: "var(--azab-warning)",
    bgColor: "rgba(245, 158, 11, 0.1)"
  },
  {
    title: "الإعدادات",
    description: "إعدادات النظام العامة",
    icon: Settings,
    path: "/settings",
    color: "var(--azab-dark)",
    bgColor: "rgba(15, 23, 42, 0.1)"
  }
];

export const AdminQuickActions: React.FC = () => {
  return (
    <div className="azab-card">
      <div className="mb-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--azab-primary)' }}
        >
          الإجراءات السريعة
        </h3>
        <p className="text-gray-600 text-sm">
          الوصول السريع للمهام الأساسية
        </p>
      </div>

      <div className="grid gap-4">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            to={action.path}
            className="group block p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
            style={{
              borderColor: 'var(--azab-border-color)',
              transition: 'var(--azab-transition)'
            }}
          >
            <div className="flex items-center space-x-4 space-x-reverse">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: action.bgColor }}
              >
                <action.icon 
                  className="w-6 h-6" 
                  style={{ color: action.color }} 
                />
              </div>
              <div className="flex-1">
                <h4 
                  className="font-bold text-sm mb-1 group-hover:text-opacity-80"
                  style={{ color: action.color }}
                >
                  {action.title}
                </h4>
                <p className="text-gray-600 text-xs">
                  {action.description}
                </p>
              </div>
              <div 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: action.color }}
              >
                ←
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Actions */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--azab-border-color)' }}>
        <div className="grid grid-cols-2 gap-3">
          <button 
            className="flex items-center justify-center space-x-2 space-x-reverse py-3 px-4 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--azab-border-color)' }}
          >
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">التقويم</span>
          </button>
          <button 
            className="flex items-center justify-center space-x-2 space-x-reverse py-3 px-4 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: 'var(--azab-border-color)' }}
          >
            <Download className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">تصدير</span>
          </button>
        </div>
      </div>
    </div>
  );
};