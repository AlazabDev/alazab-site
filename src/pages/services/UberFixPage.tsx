import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Wrench, Zap, Clock, ShieldCheck, CheckCircle, Phone, Hammer, Droplets, Plug, Wind, PaintBucket } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/uberfix-hero.jpg';
import repairImg from '@/assets/services/uberfix-2.jpg';

const UberFixPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Wrench, titleAr: "صيانة معمارية شاملة", titleEn: "Comprehensive Maintenance", descriptionAr: "حلول صيانة متكاملة لجميع جوانب المبنى من الهيكل الإنشائي إلى التشطيبات", descriptionEn: "Integrated maintenance solutions for all building aspects from structure to finishes" },
    { icon: Zap, titleAr: "استجابة سريعة 24/7", titleEn: "24/7 Rapid Response", descriptionAr: "فريق جاهز للتدخل السريع على مدار الساعة في حالات الطوارئ والأعطال المفاجئة", descriptionEn: "A team ready for rapid 24/7 intervention in emergencies and unexpected breakdowns" },
    { icon: Clock, titleAr: "صيانة دورية وقائية", titleEn: "Preventive Maintenance", descriptionAr: "برامج صيانة منتظمة ومجدولة تمنع الأعطال قبل حدوثها وتطيل عمر المبنى", descriptionEn: "Regular scheduled maintenance programs that prevent breakdowns and extend building life" },
    { icon: ShieldCheck, titleAr: "ضمان شامل على الأعمال", titleEn: "Comprehensive Warranty", descriptionAr: "نضمن جودة عملنا ونقدم ضمانًا شاملًا يمتد حتى عام على جميع الأعمال", descriptionEn: "We guarantee work quality with a comprehensive warranty up to one year on all work" },
    { icon: Droplets, titleAr: "أعمال السباكة والصرف", titleEn: "Plumbing & Drainage", descriptionAr: "إصلاح وتجديد شبكات المياه والصرف الصحي بأحدث التقنيات", descriptionEn: "Repair and renewal of water and sewage networks with latest technologies" },
    { icon: Plug, titleAr: "الأعمال الكهربائية", titleEn: "Electrical Work", descriptionAr: "صيانة وإصلاح الشبكات الكهربائية وأنظمة الإضاءة والتيار الخفيف", descriptionEn: "Maintenance and repair of electrical networks, lighting, and low-current systems" },
  ];

  const maintenanceTypes = [
    { icon: Hammer, ar: "أعمال النجارة والألوميتال", en: "Carpentry and aluminum work" },
    { icon: PaintBucket, ar: "الدهانات والديكورات الداخلية", en: "Paints and interior decorations" },
    { icon: Droplets, ar: "العزل المائي والحراري", en: "Waterproofing and thermal insulation" },
    { icon: Wind, ar: "صيانة أنظمة التكييف والتهوية", en: "HVAC system maintenance" },
    { icon: Plug, ar: "الأعمال الكهربائية والإضاءة", en: "Electrical and lighting work" },
    { icon: Wrench, ar: "صيانة المصاعد والأنظمة الميكانيكية", en: "Elevator and mechanical system maintenance" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero */}
      <section className="relative min-h-[85vh] mt-16 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="UberFix" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm border border-orange-400/30 rounded-full px-4 py-2 mb-6">
              <Wrench className="w-5 h-5 text-orange-300" />
              <span className="text-orange-200 text-sm font-medium">{t('خط إنتاج متخصص', 'Specialized Production Line')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">UberFix</h1>
            <p className="text-xl md:text-2xl text-orange-200 italic font-medium mb-4">
              {t('لمسة إصلاح سريعة... تدوم طويلاً', 'A quick fix... that lasts')}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'خط إنتاجي متخصص في تقديم حلول الصيانة المعمارية السريعة والمبتكرة. سواء للمحلات التجارية أو الوحدات السكنية، يضمن فريق UberFix إعادة الحياة إلى مساحاتك بأعلى كفاءة وأسرع وقت.',
                'A specialized production line offering rapid and innovative architectural maintenance solutions. Whether for commercial shops or residential units, the UberFix team ensures your spaces are revitalized with maximum efficiency and speed.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 text-lg">
                <Link to="/maintenance-request">
                  {t('اطلب خدمة صيانة', 'Request Maintenance')}
                  <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-5 h-5`} />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
                <Link to="/maintenance-tracking">{t('تتبع طلبك', 'Track Your Request')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="py-6 bg-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 animate-pulse" />
              <span className="text-lg font-bold">{t('خط الطوارئ متاح 24/7', '24/7 Emergency Line Available')}</span>
            </div>
            <a href="tel:+201000000000" className="bg-white text-orange-600 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition-colors">
              {t('اتصل الآن', 'Call Now')}
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('خدمات UberFix', 'UberFix Services')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('حلول صيانة شاملة ومبتكرة لكل احتياجاتك', 'Comprehensive and innovative maintenance solutions for all your needs')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
                  <CardHeader>
                    <div className="w-18 h-18 bg-orange-100 text-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center p-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
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

      {/* Image + Maintenance Types */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={repairImg} alt={t('صيانة', 'Maintenance')} className="w-full h-96 object-cover" loading="lazy" width={1024} height={1024} />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('أنواع الصيانة', 'Maintenance Types')}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {t('فريق UberFix يغطي جميع أنواع أعمال الصيانة المعمارية بخبرة تمتد لأكثر من عقدين', 'The UberFix team covers all types of architectural maintenance with over two decades of experience')}
              </p>
              <div className="space-y-3">
                {maintenanceTypes.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-gray-800 font-medium">{t(item.ar, item.en)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">{t('كيف يعمل UberFix؟', 'How UberFix Works')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, ar: 'طلب الخدمة', en: 'Request Service', descAr: 'تواصل معنا عبر الموقع أو الهاتف وحدد نوع الصيانة المطلوبة بالتفصيل', descEn: 'Contact us via website or phone and specify the required maintenance in detail' },
              { step: 2, ar: 'المعاينة المجانية', en: 'Free Inspection', descAr: 'فريقنا المتخصص يقوم بمعاينة شاملة للموقع وتقديم عرض سعر تفصيلي', descEn: 'Our specialized team conducts a comprehensive site inspection and provides a detailed quote' },
              { step: 3, ar: 'التنفيذ السريع', en: 'Rapid Execution', descAr: 'تنفيذ الأعمال بأعلى معايير الجودة مع الالتزام بالجدول الزمني المتفق عليه', descEn: 'Work execution with highest quality standards while adhering to agreed timeline' },
              { step: 4, ar: 'الضمان والمتابعة', en: 'Warranty & Follow-up', descAr: 'ضمان شامل على جميع الأعمال مع متابعة دورية لضمان رضاك التام', descEn: 'Comprehensive warranty on all work with periodic follow-up to ensure your full satisfaction' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 text-white rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{t(item.ar, item.en)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(item.descAr, item.descEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Wrench className="w-12 h-12 text-orange-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('تحتاج صيانة؟ UberFix هنا لخدمتك', 'Need Maintenance? UberFix is Here')}</h2>
          <p className="text-xl mb-8 text-orange-100 max-w-2xl mx-auto">{t('لا تنتظر حتى تتفاقم المشكلة. تواصل معنا الآن واحصل على معاينة مجانية', 'Don\'t wait until the problem gets worse. Contact us now and get a free inspection')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-orange-600 hover:bg-gray-100 rounded-full px-8 text-lg">
              <Link to="/maintenance-request">{t('اطلب صيانة الآن', 'Request Maintenance Now')}</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
              <Link to="/maintenance-tracking">{t('تتبع طلب الصيانة', 'Track Maintenance Request')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UberFixPage;
