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
    descriptionAr: "خط إنتاج متخصص في تقديم خدمات تشطيب فائقة الجودة للوحدات السكنية الراقية (الفلل، الشقق، الدوبلكس).",
    descriptionEn: "A specialized production line offering ultra-high-quality finishing services for upscale residential units (villas, apartments, duplexes).",
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
    descriptionAr: "حلول متكاملة لتجهيز وتشطيب وفرش المحلات التجارية. نترجم هوية علامتك التجارية إلى مساحة مادية جاذبة.",
    descriptionEn: "Integrated solutions for fitting out, finishing, and furnishing retail outlets. We translate your brand identity into an attractive physical space.",
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
    descriptionAr: "خط إنتاجي متخصص في تقديم حلول الصيانة المعمارية السريعة والمبتكرة للمحلات التجارية والوحدات السكنية.",
    descriptionEn: "A specialized production line offering rapid and innovative architectural maintenance solutions for commercial shops and residential units.",
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
    descriptionAr: "خط إنتاج متخصص في توفير الخامات المعمارية التي يصعب العثور عليها من جميع أنحاء العالم.",
    descriptionEn: "A specialized production line focused on sourcing hard-to-find architectural materials from around the world.",
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
