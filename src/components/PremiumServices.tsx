import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Crown, Palette, Wrench, Package } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const premiumServices = [
  {
    id: "luxury-finishing",
    icon: Crown,
    titleAr: "التشطيب الراقي",
    titleEn: "Luxury Finishing",
    taglineAr: "حيث تتحول المساحات إلى تحف فنية",
    taglineEn: "Where spaces turn into masterpieces",
    descriptionAr: "تشطيب فلل ودوبلكس بنظام 5 مراحل (من جلسة المكتب لحد ضمان سنتين)، بدهانات Jotun وأنظمة KNX ورخام Carrara، مع مدير مشروع مقيم في الموقع.",
    descriptionEn: "Villa & duplex finishing on a 5-stage system (office session through 2-year warranty), with Jotun paints, KNX smart systems, Carrara marble and an on-site project manager.",
    color: "bg-amber-50 text-amber-700",
    gradient: "from-amber-600 to-amber-800",
    route: "/services/luxury-finishing"
  },
  {
    id: "brand-identity",
    icon: Palette,
    titleAr: "هوية العلامة التجارية",
    titleEn: "Brand Identity",
    taglineAr: "مساحتك التجارية... مرآة علامتك",
    taglineEn: "Your commercial space... the mirror of your brand",
    descriptionAr: "فِت أوت كامل لفروع الـ Retail وF&B في 21 يوم: ترجمة الـ Brand Book لرسومات تنفيذية، تنفيذ الديكور والإضاءة، وتسليم الفرع جاهز للافتتاح (مرجعنا: شبكة أبو عوف).",
    descriptionEn: "Full Retail/F&B fit-out in 21 days: translating your Brand Book into shop drawings, executing décor and lighting, and handing over a ready-to-open branch (reference: Abu Auf chain).",
    color: "bg-purple-50 text-purple-600",
    gradient: "from-purple-600 to-purple-800",
    route: "/services/brand-identity"
  },
  {
    id: "uberfix",
    icon: Wrench,
    titleAr: "أوبرفيكس",
    titleEn: "UberFix",
    taglineAr: "لمسة إصلاح سريعة... تدوم طويلاً",
    taglineEn: "A quick fix... that lasts",
    descriptionAr: "عقود صيانة شهرية وطوارئ لسلاسل الفروع: استجابة خلال ساعتين، كشف تسريبات بكاميرا حرارية، استبدال لوحات Schneider وقطع Legrand، وتقرير PDF بعد كل زيارة.",
    descriptionEn: "Monthly + emergency maintenance contracts for branch chains: 2-hour response, thermal-camera leak detection, Schneider panel & Legrand part replacement, and a PDF report after every visit.",
    color: "bg-orange-50 text-orange-600",
    gradient: "from-orange-600 to-orange-800",
    route: "/services/uberfix"
  },
  {
    id: "laban-alasfour",
    icon: Package,
    titleAr: "لبن العصفور",
    titleEn: "Laban Alasfour",
    taglineAr: "نوفر المستحيل... لنبني المستحيل",
    taglineEn: "We provide the impossible... to build the impossible",
    descriptionAr: "توريد خامات نادرة من 6 دول (إيطاليا، إسبانيا، البرازيل…): زجاج PDLC الذكي، أخشاب FSC، رخام طبيعي وإكسسوارات Grohe/Hansgrohe، بفاتورة ضريبية وتخليص جمركي كامل.",
    descriptionEn: "Sourcing rare materials from 6 countries (Italy, Spain, Brazil…): PDLC smart glass, FSC woods, natural marble and Grohe/Hansgrohe fixtures — with full tax invoice and customs clearance.",
    color: "bg-blue-50 text-blue-600",
    gradient: "from-blue-600 to-blue-800",
    route: "/services/laban-alasfour"
  },
];

const PremiumServices: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <section id="premium-services" className="py-20 bg-gradient-to-b from-gray-50 to-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('خطوط إنتاجنا المتخصصة', 'Our Specialized Production Lines')}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {t(
              'أربعة خطوط إنتاج متكاملة، يدير كل منها فريق خبراء متخصصين، لتقديم حلول أكثر عمقاً تلبي احتياجات عملائنا',
              'Four integrated production lines, each managed by a team of specialized experts, to provide deeper solutions that meet our clients\' needs'
            )}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {premiumServices.map((service) => {
            const IconComponent = service.icon;
            return (
              <Card key={service.id} className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group overflow-hidden">
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 rounded-full ${service.color} mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 mb-1">
                    {t(service.titleAr, service.titleEn)}
                  </CardTitle>
                  <p className="text-sm font-medium text-construction-accent italic">
                    {t(service.taglineAr, service.taglineEn)}
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-6 leading-relaxed text-sm">
                    {t(service.descriptionAr, service.descriptionEn)}
                  </CardDescription>
                  <Button 
                    asChild
                    className="w-full bg-construction-primary hover:bg-construction-dark text-white rounded-full transition-all duration-200"
                  >
                    <Link to={service.route}>
                      {t('اعرف أكثر', 'Learn More')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PremiumServices;
