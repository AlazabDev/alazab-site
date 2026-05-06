import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  Map, Home, Wrench, Building2, Users, Phone, Shield, ExternalLink,
  Globe, Server, BarChart3, UserCog, Package, Mail, Briefcase, Layers
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface SitemapLink {
  to: string;
  label: string;
  external?: boolean;
  badge?: string;
}

interface SitemapSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  links: SitemapLink[];
  accent?: string;
}

const internalSections: SitemapSection[] = [
  {
    title: "الصفحات الرئيسية",
    icon: Home,
    description: "الصفحات الأساسية للموقع",
    accent: "from-blue-500/10 to-blue-600/5",
    links: [
      { to: "/", label: "الرئيسية" },
      { to: "/about", label: "من نحن" },
      { to: "/ceo", label: "كلمة المدير" },
      { to: "/contact", label: "تواصل معنا" },
      { to: "/sitemap", label: "خريطة الموقع" },
    ],
  },
  {
    title: "خدماتنا",
    icon: Wrench,
    description: "خطوط الإنتاج والخدمات المتكاملة",
    accent: "from-amber-500/10 to-amber-600/5",
    links: [
      { to: "/services", label: "جميع الخدمات" },
      { to: "/services/luxury-finishing", label: "التشطيبات الفاخرة" },
      { to: "/services/uberfix", label: "UberFix - الصيانة والتجديد" },
      { to: "/services/brand-identity", label: "الهوية البصرية" },
      { to: "/services/laban-alasfour", label: "لبن العصفور للتوريدات" },
    ],
  },
  {
    title: "المشاريع والأعمال",
    icon: Building2,
    description: "معرض المشاريع والبورتفوليو",
    accent: "from-emerald-500/10 to-emerald-600/5",
    links: [
      { to: "/projects", label: "المشاريع" },
      { to: "/projects-gallery", label: "معرض المشاريع" },
      { to: "/portfolio", label: "البورتفوليو" },
      { to: "/furniture-gallery", label: "معرض الأثاث" },
    ],
  },
  {
    title: "خدمات العملاء",
    icon: Users,
    description: "الطلبات والدعم والتواصل",
    accent: "from-violet-500/10 to-violet-600/5",
    links: [
      { to: "/maintenance-request", label: "طلب صيانة" },
      { to: "/maintenance-tracking", label: "تتبع طلب الصيانة" },
      { to: "/chatbot", label: "المساعد الذكي" },
      { to: "/auth", label: "تسجيل الدخول" },
      { to: "/facebook", label: "صفحة فيسبوك" },
    ],
  },
  {
    title: "الصفحات القانونية",
    icon: Shield,
    description: "السياسات والشروط القانونية",
    accent: "from-slate-500/10 to-slate-600/5",
    links: [
      { to: "/privacy-policy", label: "سياسة الخصوصية" },
      { to: "/terms-of-service", label: "شروط الاستخدام" },
      { to: "/cookie-policy", label: "سياسة ملفات تعريف الارتباط" },
      { to: "/refund-policy", label: "سياسة الاسترداد" },
      { to: "/acceptable-use", label: "سياسة الاستخدام المقبول" },
      { to: "/disclaimer", label: "إخلاء المسؤولية" },
      { to: "/security", label: "الإفصاح الأمني" },
      { to: "/data-deletion", label: "حذف البيانات" },
      { to: "/legal-contact", label: "الاتصال القانوني" },
    ],
  },
];

const externalSections: SitemapSection[] = [
  {
    title: "المنصات الرئيسية",
    icon: Globe,
    description: "مواقع ونطاقات المؤسسة",
    accent: "from-cyan-500/10 to-cyan-600/5",
    links: [
      { to: "https://alazab.com", label: "الموقع الرئيسي", external: true },
      { to: "https://luxury-finishing.alazab.com", label: "التشطيبات الفاخرة", external: true },
      { to: "https://brand-identity.alazab.com", label: "الهوية البصرية", external: true },
      { to: "https://uberfix.alazab.com", label: "UberFix", external: true },
      { to: "https://uberfix.shop/service-request", label: "طلب خدمة UberFix", external: true },
      { to: "https://laban-alasfour.alazab.com", label: "لبن العصفور", external: true },
      { to: "https://alazab-co.daftra.com", label: "دفترة المحاسبي", external: true, badge: "محاسبة" },
    ],
  },
  {
    title: "نظام ERP الأساسي",
    icon: Server,
    description: "تطبيقات إدارة الأعمال المركزية",
    accent: "from-indigo-500/10 to-indigo-600/5",
    links: [
      { to: "https://erp.alazab.com/app/home", label: "الرئيسية", external: true },
      { to: "https://erp.alazab.com/app/erpnext-settings", label: "إعدادات ERP", external: true },
      { to: "https://erp.alazab.com/app/crm", label: "إدارة العلاقات (CRM)", external: true },
      { to: "https://erp.alazab.com/app/helpdesk", label: "مكتب المساعدة", external: true },
      { to: "https://erp.alazab.com/app/drive", label: "التخزين السحابي", external: true },
      { to: "https://erp.alazab.com/app/raven", label: "المراسلة الداخلية", external: true },
      { to: "https://erp.alazab.com/app/frappe-builder", label: "منشئ الصفحات", external: true },
      { to: "https://erp.alazab.com/app/website", label: "إدارة الموقع", external: true },
      { to: "https://erp.alazab.com/app/users", label: "المستخدمون", external: true },
      { to: "https://erp.alazab.com/app/integrations", label: "التكاملات", external: true },
    ],
  },
  {
    title: "العمليات التشغيلية",
    icon: BarChart3,
    description: "المبيعات والمشتريات والمخزون",
    accent: "from-orange-500/10 to-orange-600/5",
    links: [
      { to: "https://erp.alazab.com/app/selling", label: "المبيعات", external: true },
      { to: "https://erp.alazab.com/app/buying", label: "المشتريات", external: true },
      { to: "https://erp.alazab.com/app/stock", label: "المخزون", external: true },
      { to: "https://erp.alazab.com/app/projects", label: "المشاريع", external: true },
      { to: "https://erp.alazab.com/app/manufacturing", label: "التصنيع", external: true },
      { to: "https://erp.alazab.com/app/subcontracting", label: "المقاولات الباطنة", external: true },
      { to: "https://erp.alazab.com/app/invoicing", label: "الفواتير", external: true },
      { to: "https://erp.alazab.com/app/financial-reports", label: "التقارير المالية", external: true },
    ],
  },
  {
    title: "الموارد البشرية",
    icon: UserCog,
    description: "إدارة شؤون الموظفين",
    accent: "from-pink-500/10 to-pink-600/5",
    links: [
      { to: "https://erp.alazab.com/app/people", label: "الموظفون", external: true },
      { to: "https://erp.alazab.com/app/payroll", label: "الرواتب", external: true },
      { to: "https://erp.alazab.com/app/leaves", label: "الإجازات", external: true },
      { to: "https://erp.alazab.com/app/expenses", label: "المصروفات", external: true },
      { to: "https://erp.alazab.com/app/recruitment", label: "التوظيف", external: true },
      { to: "https://erp.alazab.com/app/performance", label: "الأداء", external: true },
      { to: "https://erp.alazab.com/app/shift-attendance", label: "الورديات والحضور", external: true },
      { to: "https://erp.alazab.com/app/tax-benefits", label: "الضرائب والمزايا", external: true },
      { to: "https://erp.alazab.com/app/tenure", label: "مدة الخدمة", external: true },
    ],
  },
  {
    title: "تطبيقات إضافية",
    icon: Package,
    description: "أدوات متقدمة ومتنوعة",
    accent: "from-teal-500/10 to-teal-600/5",
    links: [
      { to: "https://erp.alazab.com/app/lending", label: "التمويل", external: true },
      { to: "https://erp.alazab.com/app/assets", label: "الأصول", external: true },
      { to: "https://erp.alazab.com/app/quality", label: "الجودة", external: true },
      { to: "https://erp.alazab.com/app/support", label: "الدعم الفني", external: true },
    ],
  },
  {
    title: "البريد الإلكتروني",
    icon: Mail,
    description: "خدمة البريد المؤسسي",
    accent: "from-rose-500/10 to-rose-600/5",
    links: [
      { to: "https://mail.alazab.com/mail", label: "صندوق البريد", external: true },
      { to: "https://mail.alazab.com/mail/login", label: "تسجيل دخول البريد", external: true },
    ],
  },
];

const SectionCard: React.FC<{ section: SitemapSection }> = ({ section }) => (
  <div className="group rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
    <div className={`bg-gradient-to-br ${section.accent || 'from-primary/10 to-primary/5'} p-5 border-b border-border/50`}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
          <section.icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-card-foreground">{section.title}</h2>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
          )}
        </div>
      </div>
    </div>
    <div className="p-4">
      <ul className="space-y-1">
        {section.links.map((link) => (
          <li key={link.to}>
            {link.external ? (
              <a
                href={link.to}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors text-sm group/link"
              >
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {link.badge}
                    </span>
                  )}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
            ) : (
              <Link
                to={link.to}
                className="flex items-center justify-between py-2 px-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors text-sm"
              >
                <span>{link.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const SitemapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Helmet>
        <title>خريطة الموقع | العزب للمقاولات</title>
        <meta name="description" content="خريطة موقع شركة العزب للمقاولات المتكاملة - تصفح جميع صفحات ومنصات وأنظمة المؤسسة" />
        <link rel="canonical" href="https://alazab.com/sitemap" />
      </Helmet>
      <Header />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4 shadow-lg">
              <Map className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              خريطة الموقع
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              دليل شامل لجميع صفحات ومنصات وأنظمة شركة العزب للمقاولات المتكاملة
            </p>
          </div>

          {/* Internal Routes */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">صفحات الموقع الداخلية</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internalSections.map((section) => (
                <SectionCard key={section.title} section={section} />
              ))}
            </div>
          </div>

          {/* External Platforms */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">المنصات والأنظمة الخارجية</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {externalSections.map((section) => (
                <SectionCard key={section.title} section={section} />
              ))}
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">ملاحظة:</strong> الروابط الخارجية تفتح في نافذة جديدة. بعض الأنظمة تتطلب تسجيل دخول مسبق.
                جميع روابط ERP تعتمد على النمط <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">erp.alazab.com/app/&lt;workspace&gt;</code>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SitemapPage;
