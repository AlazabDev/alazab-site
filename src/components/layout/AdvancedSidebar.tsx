
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Wrench, 
  Building, 
  Users, 
  MessageSquare, 
  Settings, 
  User, 
  FileText, 
  Calculator, 
  ChevronDown, 
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Award,
  Target,
  Briefcase,
  Camera,
  Search,
  TrendingUp,
  PlusCircle,
  Database,
  Hammer,
  UserCircle,
  HardDrive,
  Send,
  DollarSign,
  HeadphonesIcon,
  BarChart3,
  Newspaper,
  Printer,
  Palette,
  Languages,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  expandable?: boolean;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
  comingSoon?: boolean;
  external?: boolean;
}

interface AdvancedSidebarProps {
  onClose: () => void;
}

const mainSections: SidebarSection[] = [
  {
    title: "التنقل الأساسي",
    items: [
      { title: "الرئيسية", href: "/", icon: Home, description: "العودة للصفحة الرئيسية" },
      { title: "خدماتنا", href: "/services", icon: Wrench, description: "تصفح جميع خدماتنا" },
      { title: "مشاريعنا", href: "/projects-gallery", icon: Building, description: "معرض المشاريع المنجزة" },
      { title: "معرض الأثاث", href: "/furniture-gallery", icon: Camera, description: "أثاث وتصميم داخلي فاخر", badge: "جديد" },
      { title: "من نحن", href: "/about", icon: Users, description: "تعرف على شركتنا" },
      { title: "اتصل بنا", href: "/contact", icon: Phone, description: "طرق التواصل معنا" },
    ]
  },
  {
    title: "الخدمات التفاعلية",
    items: [
      { title: "الشات بوت", href: "/chatbot", icon: MessageSquare, description: "مساعد ذكي للإجابة على استفساراتك" },
      { title: "طلب صيانة", href: "/maintenance-request", icon: Wrench, description: "تقديم طلب صيانة جديد", badge: "جديد" },
      { title: "تتبع الطلبات", href: "/maintenance-tracking", icon: Search, description: "تتبع حالة طلبات الصيانة" },
    ]
  },
  {
    title: "لوحة التحكم",
    expandable: true,
    items: [
      { title: "لوحة التحكم", href: "/dashboard", icon: TrendingUp, description: "إحصائيات ونظرة عامة" },
      { title: "لوحة الإدارة", href: "/admin-dashboard", icon: Settings, description: "لوحة تحكم المسؤول" },
      { title: "إدارة المشاريع", href: "/project-management", icon: Briefcase, description: "إدارة المشاريع الجارية" },
      { title: "قائمة الصيانة", href: "/maintenance-list", icon: FileText, description: "جميع طلبات الصيانة" },
      { title: "الملف الشخصي", href: "/profile", icon: User, description: "إعدادات الحساب الشخصي" },
      { title: "الإعدادات", href: "/settings", icon: Settings, description: "إعدادات النظام" },
    ]
  }
];

const erpAppsSections: SidebarSection[] = [
  {
    title: "تطبيقات ERP الأساسية",
    expandable: true,
    items: [
      { title: "Frappe - النظام الأساسي", href: "https://erp.alazab.com/app", icon: Building, description: "منصة فرابي الأساسية", external: true, badge: "رئيسي" },
      { title: "ERPNext - تخطيط الموارد", href: "https://erp.alazab.com/app/erpnext", icon: Database, description: "نظام إدارة موارد المؤسسة", external: true },
      { title: "CRM - إدارة العملاء", href: "https://erp.alazab.com/app/crm", icon: UserCircle, description: "علاقات العملاء والمبيعات", external: true },
      { title: "HRMS - الموارد البشرية", href: "https://erp.alazab.com/app/hrms", icon: Users, description: "إدارة الموظفين والرواتب", external: true },
    ]
  },
  {
    title: "التواصل والدعم",
    expandable: true,
    items: [
      { title: "Telephony - الاتصالات", href: "https://erp.alazab.com/app/telephony", icon: Phone, description: "إدارة المكالمات والاتصالات", external: true },
      { title: "Mail - البريد", href: "https://erp.alazab.com/app/mail", icon: Mail, description: "البريد الإلكتروني المؤسسي", external: true },
      { title: "Helpdesk - الدعم الفني", href: "https://erp.alazab.com/app/helpdesk", icon: HeadphonesIcon, description: "تذاكر الدعم الفني", external: true },
      { title: "Raven - الرسائل", href: "https://erp.alazab.com/app/raven", icon: MessageCircle, description: "الرسائل الداخلية", external: true },
      { title: "AzaBot - واتساب", href: "https://erp.alazab.com/app/whatsapp", icon: MessageSquare, description: "تشاتبوت واتساب الذكي", external: true, badge: "AI" },
    ]
  },
  {
    title: "المالية والمدفوعات",
    expandable: true,
    items: [
      { title: "Payments - المدفوعات", href: "https://erp.alazab.com/app/payments", icon: DollarSign, description: "بوابات الدفع الإلكتروني", external: true },
      { title: "Azab Tax - الضرائب", href: "https://erp.alazab.com/app/tax", icon: FileText, description: "الامتثال الضريبي المصري", external: true },
    ]
  },
  {
    title: "التحليلات والتقارير",
    expandable: true,
    items: [
      { title: "Insights - التحليلات", href: "https://erp.alazab.com/app/insights", icon: BarChart3, description: "تقارير وتحليلات متقدمة", external: true },
      { title: "LMS - التعلم", href: "https://erp.alazab.com/app/lms", icon: Award, description: "نظام إدارة التعلم", external: true },
    ]
  },
  {
    title: "التصميم والبناء",
    expandable: true,
    items: [
      { title: "Builder - المنشئ", href: "https://erp.alazab.com/app/builder", icon: Hammer, description: "بناء الصفحات", external: true },
      { title: "Print Designer - الطباعة", href: "https://erp.alazab.com/app/print-designer", icon: Printer, description: "تصميم قوالب الطباعة", external: true },
      { title: "GamePlan - المشاريع", href: "https://erp.alazab.com/app/gameplan", icon: Target, description: "إدارة خطط المشاريع", external: true },
    ]
  },
  {
    title: "التجارة والذكاء الاصطناعي",
    expandable: true,
    items: [
      { title: "Azab Store - المتجر", href: "https://erp.alazab.com/app/ecommerce", icon: Briefcase, description: "التجارة الإلكترونية", external: true },
      { title: "AI Core - الذكاء الاصطناعي", href: "https://erp.alazab.com/app/ai", icon: TrendingUp, description: "محرك الذكاء الاصطناعي", external: true, badge: "AI" },
    ]
  }
];

const futureSections: SidebarSection[] = [
  {
    title: "ميزات قادمة",
    items: [
      { title: "حاسبة التكلفة", href: "#", icon: Calculator, description: "احسب تكلفة مشروعك", comingSoon: true },
      { title: "شهادات الجودة", href: "#", icon: Award, description: "شهاداتنا ومعاييرنا", comingSoon: true },
      { title: "رؤيتنا", href: "#", icon: Target, description: "رؤية ومهمة الشركة", comingSoon: true },
    ]
  }
];

export const AdvancedSidebar: React.FC<AdvancedSidebarProps> = ({ onClose }) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['التنقل الأساسي', 'الخدمات التفاعلية']);

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle) 
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const linkContent = (
      <div className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
        item.comingSoon 
          ? 'cursor-not-allowed opacity-60' 
          : 'hover:bg-construction-primary/10 hover:shadow-md'
      }`}>
        <div className={`p-2 rounded-md ${
          item.comingSoon 
            ? 'bg-gray-100 text-gray-400' 
            : 'bg-construction-primary/20 text-construction-primary group-hover:bg-construction-primary group-hover:text-white'
        } transition-colors`}>
          <item.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${
              item.comingSoon ? 'text-gray-400' : 'text-gray-900 group-hover:text-construction-primary'
            }`}>
              {item.title}
            </span>
            {item.external && <ExternalLink className="w-3 h-3 text-gray-400" />}
            {item.badge && (
              <Badge variant="secondary" className="text-xs bg-construction-accent text-white">
                {item.badge}
              </Badge>
            )}
            {item.comingSoon && (
              <Badge variant="outline" className="text-xs">
                قريباً
              </Badge>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-1 group-hover:text-gray-600">
              {item.description}
            </p>
          )}
        </div>
      </div>
    );

    if (item.external) {
      return (
        <a
          key={item.title}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {linkContent}
        </a>
      );
    }

    return (
      <Link
        key={item.title}
        to={item.href}
        onClick={item.comingSoon ? undefined : onClose}
        className="block"
      >
        {linkContent}
      </Link>
    );
  };

  const renderSection = (section: SidebarSection) => {
    const isExpanded = expandedSections.includes(section.title);

    return (
      <div key={section.title} className="space-y-2">
        {section.expandable ? (
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full flex items-center justify-between p-2 text-sm font-semibold text-gray-700 hover:text-construction-primary transition-colors"
          >
            <span>{section.title}</span>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <h3 className="p-2 text-sm font-semibold text-gray-700">
            {section.title}
          </h3>
        )}
        
        {(!section.expandable || isExpanded) && (
          <div className="space-y-1">
            {section.items.map(renderSidebarItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-construction-primary rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-construction-primary">شركة العزب</h2>
            <p className="text-sm text-gray-600">للمقاولات العامة</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Main Sections */}
        {mainSections.map(renderSection)}
        
        <Separator className="my-4" />
        
        {/* ERP Apps Sections */}
        <div className="bg-gradient-to-br from-construction-primary/5 to-construction-accent/5 rounded-lg p-3">
          <h3 className="text-sm font-bold text-construction-primary mb-3 flex items-center gap-2">
            <Building className="w-4 h-4" />
            تطبيقات نظام ERP
          </h3>
          {erpAppsSections.map(renderSection)}
        </div>
        
        <Separator className="my-4" />
        
        {/* Future Sections */}
        {futureSections.map(renderSection)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>المملكة العربية السعودية</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4" />
            <span>info@alazab.com</span>
          </div>
          <Button 
            onClick={onClose}
            variant="outline" 
            size="sm" 
            className="w-full mt-3"
          >
            إغلاق القائمة
          </Button>
        </div>
      </div>
    </div>
  );
};
