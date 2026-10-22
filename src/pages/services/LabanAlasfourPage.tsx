import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, Zap, SlidersHorizontal, Smartphone, ShieldCheck, Building2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const SmartLightPage: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const services = [
    { icon: Lightbulb, ar: 'إضاءة LED داخلية وخارجية', en: 'Indoor & Outdoor LED', desc: 'اختيار وحدات الإضاءة الملائمة لكل مساحة ومشروع.' },
    { icon: SlidersHorizontal, ar: 'أنظمة التحكم الذكي', en: 'Smart Lighting Controls', desc: 'التحكم في مستويات الإضاءة والمشاهد والجداول الزمنية.' },
    { icon: Smartphone, ar: 'الربط والأتمتة', en: 'Automation & Integration', desc: 'ربط الإضاءة بالأنظمة وواجهات التحكم المتوافقة.' },
    { icon: Building2, ar: 'إضاءة المحلات والمشروعات', en: 'Commercial Lighting', desc: 'حلول إضاءة للمحال والمكاتب والمشروعات.' },
    { icon: Zap, ar: 'كفاءة الطاقة', en: 'Energy Efficiency', desc: 'ترشيد الاستهلاك باختيار تقنيات ومكونات ملائمة.' },
    { icon: ShieldCheck, ar: 'مراجعة المواصفات والتوريد', en: 'Specifications & Supply', desc: 'مراجعة المواصفات والكميات والتوافق قبل التنفيذ.' },
  ];
  return <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
    <Header />
    <main>
      <section className="bg-[#030957] px-4 py-24 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFB900] px-4 py-2 text-[#FFB900]"><Lightbulb className="h-5 w-5" />{t('حلول الإضاءة الذكية', 'Smart Lighting Solutions')}</div>
          <h1 className="mt-8 text-5xl font-bold">{t('سمارت لايت', 'Smart Light')}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-9 text-white/80">{t('حلول الإضاءة الذكية والموفرة للطاقة: التصميم واختيار المواصفات والتوريد والتحكم والتشغيل.', 'Smart and energy-efficient lighting: specification, supply, control and operation.')}</p>
          <Link to="/contact" className="mt-8 inline-block rounded-lg bg-[#FFB900] px-7 py-3 font-bold text-[#030957]">{t('تواصل معنا', 'Contact us')}</Link>
        </div>
      </section>
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-10 text-3xl font-bold">{t('خدمات سمارت لايت', 'Smart Light Services')}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({icon: Icon,ar,en,desc}) => <article key={en} className="rounded-xl border bg-card p-6 shadow-sm">
            <Icon className="mb-4 h-9 w-9 text-[#FFB900]" /><h3 className="mb-3 text-xl font-bold">{t(ar,en)}</h3><p className="leading-7 text-muted-foreground">{desc}</p>
          </article>)}
        </div>
      </section>
    </main>
    <Footer />
  </div>;
};
export default SmartLightPage;
