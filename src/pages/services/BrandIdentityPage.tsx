import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Palette, Building2, Users, Target, CheckCircle, Eye, Ruler, Store, TrendingUp, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/brand-identity-hero.jpg';
import cafeImg from '@/assets/services/brand-identity-2.jpg';

const BrandIdentityPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Building2, titleAr: "تجهيز المحلات التجارية", titleEn: "Retail Outlet Fitting", descriptionAr: "تجهيز وتشطيب المحلات التجارية وفق معايير العلامة التجارية مع الالتزام بدليل الهوية البصرية", descriptionEn: "Fitting and finishing retail outlets per brand standards with strict adherence to visual identity guidelines" },
    { icon: Palette, titleAr: "التصميم الداخلي المؤسسي", titleEn: "Corporate Interior Design", descriptionAr: "تصميم داخلي يجسد قيم ورؤية الشركة في كل تفصيلة من الألوان إلى المواد", descriptionEn: "Interior design that embodies company values in every detail from colors to materials" },
    { icon: Users, titleAr: "سلاسل الإمداد الكبرى", titleEn: "Major Supply Chains", descriptionAr: "خبرة واسعة في تجهيز سلاسل المتاجر والفرانشايز بمعايير موحدة ومتسقة", descriptionEn: "Extensive experience outfitting retail chains and franchises to uniform, consistent standards" },
    { icon: Target, titleAr: "الهوية البصرية التطبيقية", titleEn: "Applied Visual Identity", descriptionAr: "تطبيق دقيق للهوية البصرية على جميع عناصر المكان من اللافتات للأرضيات", descriptionEn: "Precise application of visual identity to all spatial elements from signage to flooring" },
    { icon: Store, titleAr: "تجهيز المعارض والصالات", titleEn: "Exhibition & Showroom Setup", descriptionAr: "تصميم وتنفيذ المعارض وصالات العرض بما يعكس هوية العلامة التجارية", descriptionEn: "Design and execution of exhibitions and showrooms reflecting brand identity" },
    { icon: Eye, titleAr: "تجربة العميل المكانية", titleEn: "Spatial Customer Experience", descriptionAr: "تصميم رحلة العميل داخل المساحة لتعزيز تجربة الشراء والولاء للعلامة", descriptionEn: "Designing the customer journey within the space to enhance buying experience and brand loyalty" },
  ];

  const features = [
    { ar: "تصميم واجهات المحلات التجارية بما يتوافق مع الهوية", en: "Storefront design aligned with brand identity" },
    { ar: "تجهيز داخلي كامل وفق دليل العلامة التجارية (Brand Book)", en: "Complete interior fit-out per Brand Book guidelines" },
    { ar: "تصميم وتنفيذ اللافتات والإعلانات الداخلية والخارجية", en: "Interior and exterior signage design and execution" },
    { ar: "تخطيط المساحات التجارية الوظيفي وتحسين تدفق العملاء", en: "Functional commercial space planning and customer flow optimization" },
    { ar: "اختيار الألوان والمواد والأثاث المطابق للهوية البصرية", en: "Brand-matched color, material, and furniture selection" },
    { ar: "تنسيق وتجهيز المعارض وصالات العرض الدائمة والمؤقتة", en: "Permanent and temporary exhibition and showroom coordination" },
    { ar: "أنظمة الإضاءة التجارية المتخصصة", en: "Specialized commercial lighting systems" },
    { ar: "حلول العرض والتخزين المبتكرة", en: "Innovative display and storage solutions" },
  ];

  const clients = [
    { nameAr: "أبو عوف", nameEn: "Abou Ouf", descAr: "تجهيز أكثر من 50 فرعاً بمعايير موحدة", descEn: "Outfitting over 50 branches to uniform standards" },
    { nameAr: "سفن فيرجن", nameEn: "Seven Virgin", descAr: "تصميم وتنفيذ هوية الفروع التجارية", descEn: "Branch commercial identity design and execution" },
    { nameAr: "سلاسل مطاعم", nameEn: "Restaurant Chains", descAr: "تجهيز سلاسل مطاعم ومقاهي متعددة الفروع", descEn: "Multi-branch restaurant and café chain fitting" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero */}
      <section className="relative min-h-[85vh] mt-16 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t('هوية العلامة التجارية', 'Brand Identity')} className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 backdrop-blur-sm border border-purple-400/30 rounded-full px-4 py-2 mb-6">
              <Palette className="w-5 h-5 text-purple-300" />
              <span className="text-purple-200 text-sm font-medium">{t('خط إنتاج متخصص', 'Specialized Production Line')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {t('هوية العلامة التجارية', 'Brand Identity')}
            </h1>
            <p className="text-xl md:text-2xl text-purple-200 italic font-medium mb-4">
              {t('مساحتك التجارية... مرآة علامتك', 'Your commercial space... the mirror of your brand')}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'حلول متكاملة لتجهيز وتشطيب وفرش المحلات التجارية وسلاسل الفرانشايز. نترجم هوية علامتك التجارية إلى مساحة مادية جاذبة تعزز تجربة عملائك وتزيد من ولائهم.',
                'Integrated solutions for fitting out, finishing, and furnishing retail outlets and franchise chains. We translate your brand identity into an attractive physical space that enhances customer experience and loyalty.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-8 text-lg">
                <Link to="/contact">
                  {t('ابدأ مشروعك', 'Start Your Project')}
                  <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-5 h-5`} />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
                <Link to="/projects">{t('شاهد أعمالنا', 'View Our Work')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('خدماتنا المتخصصة', 'Our Specialized Services')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('حلول شاملة تحول علامتك التجارية إلى تجربة مكانية متكاملة', 'Comprehensive solutions that transform your brand into a complete spatial experience')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
                  <CardHeader>
                    <div className="w-18 h-18 bg-purple-100 text-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center p-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl font-bold">{t(service.titleAr, service.titleEn)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600 leading-relaxed">{t(service.descriptionAr, service.descriptionEn)}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Image + Text Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={cafeImg} alt={t('تجهيز محل تجاري', 'Retail outlet fitting')} className="w-full h-96 object-cover" loading="lazy" width={1024} height={1024} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('خبرة في أكبر السلاسل التجارية', 'Expertise in Major Retail Chains')}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {t(
                  'نفتخر بشراكاتنا مع أكبر السلاسل التجارية في مصر والمنطقة. خبرتنا الممتدة لأكثر من 20 عامًا في تجهيز المحلات التجارية تضمن لك تنفيذًا متقنًا يعكس هوية علامتك التجارية بدقة متناهية.',
                  'We take pride in our partnerships with the largest retail chains in Egypt and the region. Our 20+ years of experience in retail fitting ensures precise execution that perfectly reflects your brand identity.'
                )}
              </p>
              <div className="space-y-4">
                {clients.map((client, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
                    <Award className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900">{t(client.nameAr, client.nameEn)}</h4>
                      <p className="text-gray-600 text-sm">{t(client.descAr, client.descEn)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">{t('ما نقدمه لك', 'What We Offer')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-800 font-medium">{t(feature.ar, feature.en)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-700 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <TrendingUp className="w-12 h-12 text-purple-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('جاهز لتطوير هويتك التجارية؟', 'Ready to develop your brand identity?')}</h2>
          <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">{t('دعنا نساعدك في إنشاء مساحة تجارية تعكس قيم وهوية علامتك وتجذب عملاءك', 'Let us help you create a commercial space that reflects your brand values and attracts customers')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-purple-700 hover:bg-gray-100 rounded-full px-8 text-lg">
              <Link to="/contact">{t('ابدأ مشروعك', 'Start Your Project')}</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
              <Link to="/projects">{t('شاهد أعمالنا السابقة', 'View Our Previous Work')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrandIdentityPage;
