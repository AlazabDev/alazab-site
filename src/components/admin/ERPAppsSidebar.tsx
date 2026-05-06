import React, { useState } from 'react';
import { 
  Phone, 
  CreditCard, 
  FileText, 
  Users, 
  Headphones, 
  Mail, 
  Package, 
  GraduationCap, 
  MessageCircle, 
  Bot, 
  BarChart3, 
  UserCircle, 
  Hammer, 
  Palette, 
  Gamepad2, 
  ShoppingCart, 
  Brain,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid
} from 'lucide-react';

const ERP_BASE_URL = 'https://erp.alazab.com';

interface AppItem {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  path: string;
  color: string;
  description: string;
}

const erpApps: AppItem[] = [
  {
    id: 'frappe',
    name: 'Frappe',
    nameAr: 'فرابي',
    icon: LayoutGrid,
    path: '/app',
    color: '#0089FF',
    description: 'النظام الأساسي'
  },
  {
    id: 'telephony',
    name: 'Telephony',
    nameAr: 'الاتصالات',
    icon: Phone,
    path: '/app/telephony',
    color: '#10B981',
    description: 'إدارة المكالمات'
  },
  {
    id: 'payments',
    name: 'Payments',
    nameAr: 'المدفوعات',
    icon: CreditCard,
    path: '/app/payments',
    color: '#F59E0B',
    description: 'بوابات الدفع'
  },
  {
    id: 'azab-tax',
    name: 'Azab Tax',
    nameAr: 'ضرائب العزب',
    icon: FileText,
    path: '/app/tax',
    color: '#EF4444',
    description: 'الامتثال الضريبي'
  },
  {
    id: 'crm',
    name: 'CRM',
    nameAr: 'إدارة العملاء',
    icon: Users,
    path: '/app/crm',
    color: '#8B5CF6',
    description: 'علاقات العملاء'
  },
  {
    id: 'helpdesk',
    name: 'Helpdesk',
    nameAr: 'الدعم الفني',
    icon: Headphones,
    path: '/app/helpdesk',
    color: '#06B6D4',
    description: 'تذاكر الدعم'
  },
  {
    id: 'mail',
    name: 'Mail',
    nameAr: 'البريد',
    icon: Mail,
    path: '/app/mail',
    color: '#EC4899',
    description: 'البريد الإلكتروني'
  },
  {
    id: 'erpnext',
    name: 'ERPNext',
    nameAr: 'نظام ERP',
    icon: Package,
    path: '/app/erpnext',
    color: '#0EA5E9',
    description: 'تخطيط الموارد'
  },
  {
    id: 'lms',
    name: 'LMS',
    nameAr: 'التعلم',
    icon: GraduationCap,
    path: '/app/lms',
    color: '#14B8A6',
    description: 'نظام التعلم'
  },
  {
    id: 'raven',
    name: 'Raven',
    nameAr: 'رافين',
    icon: MessageCircle,
    path: '/app/raven',
    color: '#6366F1',
    description: 'الرسائل الداخلية'
  },
  {
    id: 'azabot',
    name: 'AzaBot',
    nameAr: 'عزبوت',
    icon: Bot,
    path: '/app/whatsapp',
    color: '#25D366',
    description: 'واتساب تشاتبوت'
  },
  {
    id: 'insights',
    name: 'Insights',
    nameAr: 'التحليلات',
    icon: BarChart3,
    path: '/app/insights',
    color: '#F97316',
    description: 'تقارير وتحليلات'
  },
  {
    id: 'hrms',
    name: 'HRMS',
    nameAr: 'الموارد البشرية',
    icon: UserCircle,
    path: '/app/hrms',
    color: '#84CC16',
    description: 'إدارة الموظفين'
  },
  {
    id: 'builder',
    name: 'Builder',
    nameAr: 'المنشئ',
    icon: Hammer,
    path: '/app/builder',
    color: '#A855F7',
    description: 'بناء الصفحات'
  },
  {
    id: 'print-designer',
    name: 'Print Designer',
    nameAr: 'مصمم الطباعة',
    icon: Palette,
    path: '/app/print-designer',
    color: '#F43F5E',
    description: 'تصميم القوالب'
  },
  {
    id: 'gameplan',
    name: 'GamePlan',
    nameAr: 'خطة اللعب',
    icon: Gamepad2,
    path: '/app/gameplan',
    color: '#3B82F6',
    description: 'إدارة المشاريع'
  },
  {
    id: 'azab-store',
    name: 'Azab Store',
    nameAr: 'متجر العزب',
    icon: ShoppingCart,
    path: '/app/ecommerce',
    color: '#22C55E',
    description: 'التجارة الإلكترونية'
  },
  {
    id: 'ai-core',
    name: 'AI Core',
    nameAr: 'الذكاء الاصطناعي',
    icon: Brain,
    path: '/app/ai',
    color: '#7C3AED',
    description: 'محرك AI'
  }
];

interface ERPAppsSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const ERPAppsSidebar: React.FC<ERPAppsSidebarProps> = ({ 
  isCollapsed: externalCollapsed, 
  onToggle: externalToggle 
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const isCollapsed = externalCollapsed ?? internalCollapsed;
  const onToggle = externalToggle ?? (() => setInternalCollapsed(!internalCollapsed));

  const handleAppClick = (app: AppItem) => {
    window.open(`${ERP_BASE_URL}${app.path}`, '_blank');
  };

  return (
    <aside 
      className={`
        fixed right-0 top-0 h-screen z-50 
        bg-white/95 backdrop-blur-md border-l border-gray-200
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-72'}
        shadow-xl
      `}
      style={{ direction: 'rtl' }}
    >
      {/* Header */}
      <div 
        className="h-16 flex items-center justify-between px-4 border-b border-gray-200"
        style={{ background: 'linear-gradient(135deg, var(--azab-primary) 0%, var(--azab-secondary) 100%)' }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-white" />
            <span className="font-bold text-white text-lg">تطبيقات ERP</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-white" />
          ) : (
            <ChevronRight className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Apps Grid */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-3 custom-scrollbar">
        <div className={`
          ${isCollapsed ? 'space-y-2' : 'grid grid-cols-2 gap-3'}
        `}>
          {erpApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={`
                group relative rounded-xl transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${isCollapsed 
                  ? 'w-10 h-10 mx-auto flex items-center justify-center' 
                  : 'p-4 flex flex-col items-center text-center'
                }
              `}
              style={{ 
                background: isCollapsed ? app.color : `linear-gradient(135deg, ${app.color}15, ${app.color}30)`,
                border: `1px solid ${app.color}40`
              }}
              title={isCollapsed ? app.nameAr : undefined}
            >
              <app.icon 
                className={`${isCollapsed ? 'w-5 h-5' : 'w-8 h-8 mb-2'}`}
                style={{ color: app.color }}
              />
              
              {!isCollapsed && (
                <>
                  <span 
                    className="font-semibold text-sm mb-1"
                    style={{ color: app.color }}
                  >
                    {app.nameAr}
                  </span>
                  <span className="text-xs text-gray-500 line-clamp-1">
                    {app.description}
                  </span>
                  
                  {/* External link indicator */}
                  <ExternalLink 
                    className="absolute top-2 left-2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: app.color }}
                  />
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </aside>
  );
};
