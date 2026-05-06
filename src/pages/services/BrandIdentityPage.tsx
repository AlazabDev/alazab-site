import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Palette, Building2, Users, Target, CheckCircle, Eye, Ruler, Store, TrendingUp, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/file_3.jpg';
import cafeImg from '@/assets/services/file_11.jpg';

const BrandIdentityPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Building2, titleAr: "تجهيز فرع تجاري في 21 يوم", titleEn: "Retail Fit-Out in 21 Days", descriptionAr: "من استلام المحل خام لافتتاح. متوسط التسليم 21 يوم لمحل 80م، 35 يوم للسلاسل من 200م.", descriptionEn: "From bare shell to grand opening. Average delivery: 21 days for an 80m² store, 35 days for 200m²+ chains." },
    { icon: Palette, titleAr: "ترجمة Brand Book لتفاصيل تنفيذية", titleEn: "Brand Book → Build Drawings", descriptionAr: "بناخد الـ Brand Guidelines من وكالتك، وبنطلع شوب درواينج تنفيذي بكل اللوحات والمواد بكود اللون.", descriptionEn: "We take the brand guidelines from your agency and produce shop drawings with every panel and material spec'd by color code." },
    { icon: Users, titleAr: "تجربة في 50+ فرع لأبو عوف", titleEn: "50+ Abou Ouf Branches", descriptionAr: "نفس البصمة في كل فرع، نفس الخامات، نفس الإضاءة. اللي بيدخل أي فرع يقول \"ده أبو عوف\" من غير لافتة.", descriptionEn: "Same look, same materials, same lighting in every branch. Customers recognize the brand from inside before they see the sign." },
    { icon: Target, titleAr: "تطبيق دقيق للهوية", titleEn: "Faithful Identity Execution", descriptionAr: "كود لون باللوحة، نوع خط اللافتة بالنقطة الواحدة، ارتفاع الكاونتر بالسنتيمتر — مفيش اجتهاد شخصي.", descriptionEn: "Color codes by panel, signage fonts down to the point, counter heights to the centimeter — no improvisation." },
    { icon: Store, titleAr: "Showrooms ومعارض مؤقتة", titleEn: "Showrooms & Pop-Ups", descriptionAr: "تجهيز معارض دائمة وبوزات مؤقتة لـ Cityscape ومعرض القاهرة الدولي خلال 7-10 أيام.", descriptionEn: "Permanent showrooms and temporary booths for Cityscape and Cairo International Fair in 7–10 days." },
    { icon: Eye, titleAr: "تصميم رحلة العميل داخل المحل", titleEn: "In-Store Customer Journey", descriptionAr: "بنرسم خريطة حرارة لتدفق العميل، نحدد \"النقطة الذهبية\" للعرض، وبنخطط الـ Hot Zones.", descriptionEn: "We map the customer heat flow, identify the 'golden display zone,' and plan hot zones strategically." },
  ];

  const features = [
    { ar: "واجهة محل بألوميتال شيكوريل + لافتة LED بحروف بارزة", en: "Schüco aluminum storefront with LED 3D channel-letter signage" },
    { ar: "تجهيز داخلي كامل: أرضيات، أسقف، إضاءة، رفوف، كاونتر", en: "Full interior fit-out: floors, ceilings, lighting, shelving, counter" },
    { ar: "لافتات داخلية وخارجية بمواصفات الـ Brand Book", en: "Indoor and outdoor signage to Brand Book spec" },
    { ar: "تخطيط Planogram ودورة حركة العميل (Customer Flow)", en: "Planogram layout and customer flow design" },
    { ar: "إضاءة محلات تجارية بـ CRI 90+ ودرجة حرارة مخصصة", en: "Retail lighting at CRI 90+ with custom color temperature" },
    { ar: "تنفيذ بأكثر من فرع بنفس البصمة (Brand Consistency)", en: "Multi-branch execution with consistent brand signature" },
    { ar: "كاونترات بأخشاب MDF عالي الكثافة وقشرة Fenix الإيطالية", en: "Counters in HDF with Italian Fenix laminate" },
    { ar: "حلول العرض المخصصة + رفوف Slatwall وGondola مودرن", en: "Custom display solutions, Slatwall, and modern Gondola shelving" },
  ];

  const clients = [
    { nameAr: "أبو عوف", nameEn: "Abou Ouf", descAr: "50+ فرع — توحيد الهوية في القاهرة والإسكندرية والدلتا", descEn: "50+ branches — identity rollout across Cairo, Alexandria, Delta" },
    { nameAr: "سفن فيرجن", nameEn: "Seven Virgin", descAr: "تصميم وتنفيذ هوية فروع مكة المكرمة منذ 2018", descEn: "Mecca branches: identity design and execution since 2018" },
    { nameAr: "سلاسل F&B", nameEn: "F&B Chains", descAr: "تجهيز 12+ سلسلة مطاعم ومقاهي متعددة الفروع", descEn: "12+ multi-branch restaurant and café chains delivered" },
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
              {t('فرعك التاسع لازم يكون نسخة من الأول', "Your 9th branch should be a copy of your first")}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'بنجهّز للسلاسل التجارية في مصر من 2008. سلّمنا أكثر من 340 فرع لأبو عوف وسفن فيرجن وسلاسل مطاعم ومقاهي. التجربة بتقول إن السر مش في التصميم — السر في إن الفرع رقم 50 يطلع زي الفرع رقم 1 بالظبط.',
                "We've outfitted retail chains in Egypt since 2008 — 340+ branches for Abou Ouf, Seven Virgin, and major F&B chains. The lesson: design isn't the hard part. Making branch #50 identical to branch #1 is."
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
