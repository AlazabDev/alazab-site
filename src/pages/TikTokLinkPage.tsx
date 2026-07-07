import React from 'react';
import { Helmet } from 'react-helmet-async';
import { BarChart3, Megaphone, Bot, ArrowLeft, Lock, ExternalLink } from 'lucide-react';

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.87a8.16 8.16 0 0 0 4.77 1.52V6.95a4.85 4.85 0 0 1-1.84-.26z" />
  </svg>
);

const features = [
  {
    icon: BarChart3,
    title: 'تحليلات متقدمة',
    desc: 'تابع أداء حملاتك في الوقت الفعلي',
  },
  {
    icon: Megaphone,
    title: 'إدارة الحملات',
    desc: 'أنشئ وعدّل حملاتك بسهولة',
  },
  {
    icon: Bot,
    title: 'توصيات ذكية',
    desc: 'تحسين الأداء باستخدام الذكاء الاصطناعي',
  },
];

const TIKTOK_URL = 'https://www.tiktok.com/@alazab.eg';
const TIKTOK_EMAIL = 'alazab.com@';

const TikTokLinkPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>ربط حساب TikTok | العزب للمقاولات المتكاملة</title>
        <meta name="description" content="اربط حسابك التجاري على TikTok لإدارة حملاتك الإعلانية بذكاء من منصة العزب." />
      </Helmet>

      <main
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 py-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -10%, hsl(340 90% 55% / 0.15), transparent 60%), radial-gradient(900px 500px at 90% 110%, hsl(180 90% 55% / 0.15), transparent 60%), #0b1220',
        }}
      >
        <section
          className="w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl"
          style={{
            backgroundColor: 'rgba(17, 25, 40, 0.75)',
            borderColor: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {/* Logo */}
          <div
            className="mx-auto mb-6 flex h-24 w-full max-w-[240px] items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <img
              src="/logo.gif"
              alt="al-azab.co"
              className="h-14 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {/* Title */}
          <div className="text-center mb-2 flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold text-white">ربط حساب TikTok</h1>
            <TikTokIcon className="w-6 h-6 text-[#ff2d55]" />
          </div>

          <p className="text-center text-sm text-gray-300 flex items-center justify-center gap-1.5">
            <ExternalLink className="w-4 h-4 text-emerald-400" />
            <span>
              قم بربط حسابك التجاري على <span className="text-emerald-400 font-medium">{TIKTOK_EMAIL}</span>
            </span>
          </p>
          <p className="text-center text-xs text-gray-400 mt-1 mb-6">
            لإدارة حملاتك الإعلانية بذكاء من منصة العزب
          </p>

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-xl border p-3.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex-1 text-right">
                  <div className="text-white font-semibold text-sm">{title}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{desc}</div>
                </div>
                <div className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-[#ff2d55]/15 text-[#ff2d55]">
                  <Icon className="w-5 h-5" />
                </div>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <a
            href={TIKTOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'linear-gradient(90deg, #22d3ee 0%, #a855f7 50%, #ff2d55 100%)',
              boxShadow: '0 12px 40px -12px rgba(255,45,85,0.6)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ربط حساب TikTok الآن</span>
            <TikTokIcon className="w-4 h-4" />
          </a>

          <p className="mt-4 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#ff2d55]" />
            سيتم توجيهك إلى صفحة مصادقة TikTok الآمنة
          </p>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-gray-400">© 2025 العزب للمقاولات المتكاملة</p>
            <p className="text-[11px] text-gray-500 mt-1">
              <a href="/privacy-policy" className="hover:text-gray-300">سياسة الخصوصية</a>
              <span className="mx-2">•</span>
              <a href="/terms-of-service" className="hover:text-gray-300">شروط الخدمة</a>
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default TikTokLinkPage;
