import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Home, Paintbrush, Gem, CheckCircle, Star, Award, Layers, Lightbulb } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/luxury-finishing-hero.jpg';
import bathroomImg from '@/assets/services/luxury-finishing-2.jpg';
import kitchenImg from '@/assets/services/luxury-finishing-3.jpg';

const LuxuryFinishingPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Crown, titleAr: "تشطيبات فائقة الجودة", titleEn: "Ultra-High-Quality Finishes", descriptionAr: "تشطيبات راقية تعكس الذوق الرفيع باستخدام أحدث التصاميم العالمية وأرقى الخامات المستوردة", descriptionEn: "Refined finishes reflecting refined taste using the latest international designs and premium imported materials" },
    { icon: Paintbrush, titleAr: "تصميم داخلي حصري", titleEn: "Exclusive Interior Design", descriptionAr: "تصميمات داخلية مبتكرة من فريق مهندسين متخصصين يحولون رؤيتك إلى واقع مبهر", descriptionEn: "Innovative interior designs from a specialized engineering team that turns your vision into stunning reality" },
    { icon: Home, titleAr: "فلل وشقق ودوبلكس", titleEn: "Villas, Apartments & Duplexes", descriptionAr: "حلول تشطيب شاملة لجميع أنواع الوحدات السكنية الراقية بمعايير فندقية عالمية", descriptionEn: "Comprehensive finishing solutions for all upscale residential units with international hotel standards" },
    { icon: Gem, titleAr: "أفخم الخامات العالمية", titleEn: "The Finest Global Materials", descriptionAr: "نستخدم أجود الخامات المستوردة من إيطاليا وإسبانيا وتركيا لضمان الجودة والمتانة", descriptionEn: "We use the finest materials imported from Italy, Spain, and Turkey to ensure quality and durability" },
    { icon: Lightbulb, titleAr: "إضاءة ذكية متكاملة", titleEn: "Integrated Smart Lighting", descriptionAr: "أنظمة إضاءة ذكية ومخفية تخلق أجواء مثالية وتوفر الطاقة بتقنيات حديثة", descriptionEn: "Smart concealed lighting systems that create perfect ambiance and save energy with modern technology" },
    { icon: Layers, titleAr: "أسقف وجدران فنية", titleEn: "Artistic Ceilings & Walls", descriptionAr: "أسقف معلقة بتصاميم فنية فريدة وجدران ديكورية بلمسات إبداعية مميزة", descriptionEn: "Suspended ceilings with unique artistic designs and decorative walls with creative distinctive touches" },
  ];

  const features = [
    { ar: "تشطيب الأرضيات بالرخام الإيطالي والباركيه الفاخر", en: "Italian marble and luxury parquet flooring" },
    { ar: "دهانات ديكورية وورق حائط من أرقى الماركات العالمية", en: "Decorative paints and wallpaper from top international brands" },
    { ar: "أنظمة إضاءة ذكية ومخفية بتقنية LED متطورة", en: "Smart and concealed LED lighting systems" },
    { ar: "أسقف معلقة بتصاميم فنية ثلاثية الأبعاد", en: "3D artistic suspended ceiling designs" },
    { ar: "مطابخ وحمامات بمعايير فندقية خمس نجوم", en: "Five-star hotel-standard kitchens and bathrooms" },
    { ar: "أنظمة أتمتة المنزل الذكي (Smart Home)", en: "Smart home automation systems" },
    { ar: "تصميم وتنفيذ الدريسنج روم والخزائن المدمجة", en: "Dressing room and built-in closet design and execution" },
    { ar: "أعمال الجبس بورد والكرانيش بتصاميم كلاسيكية ومودرن", en: "Gypsum board and cornice work in classic and modern designs" },
  ];

  const stats = [
    { value: "500+", labelAr: "مشروع منجز", labelEn: "Completed Projects" },
    { value: "20+", labelAr: "سنة خبرة", labelEn: "Years Experience" },
    { value: "98%", labelAr: "رضا العملاء", labelEn: "Client Satisfaction" },
    { value: "50+", labelAr: "مهندس متخصص", labelEn: "Specialized Engineers" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero Section with Image */}
      <section className="relative min-h-[85vh] mt-16 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={t('التشطيب الراقي', 'Luxury Finishing')} className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full px-4 py-2 mb-6">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-amber-200 text-sm font-medium">{t('خط إنتاج متخصص', 'Specialized Production Line')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {t('التشطيب الراقي', 'Luxury Finishing')}
            </h1>
            <p className="text-xl md:text-2xl text-amber-200 italic font-medium mb-4">
              {t('حيث تتحول المساحات إلى تحف فنية', 'Where spaces turn into masterpieces')}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'خط إنتاج متخصص في تقديم خدمات تشطيب فائقة الجودة للوحدات السكنية الراقية. نستخدم أحدث التصاميم العالمية وأفضل الخامات المستوردة لتحويل منزلك إلى مساحة تعكس ذوقك الرفيع وتفوق توقعاتك.',
                'A specialized production line offering ultra-high-quality finishing services for upscale residential units. We use the latest international designs and finest imported materials to transform your home into a space that reflects your refined taste and exceeds your expectations.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-8 text-lg">
                <Link to="/contact">
                  {t('ابدأ مشروعك الآن', 'Start Your Project Now')}
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

      {/* Stats Section */}
      <section className="py-12 bg-amber-700 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-amber-200 text-sm md:text-base">{t(stat.labelAr, stat.labelEn)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('خدماتنا المتخصصة', 'Our Specialized Services')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('نقدم مجموعة شاملة من خدمات التشطيب الراقي تغطي كل تفاصيل مساحتك', 'We offer a comprehensive range of luxury finishing services covering every detail of your space')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
                  <CardHeader>
                    <div className="w-18 h-18 bg-amber-100 text-amber-700 rounded-2xl mx-auto mb-4 flex items-center justify-center p-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
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

      {/* Gallery / Showcase */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('من أعمالنا', 'From Our Work')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('نماذج من مشاريعنا في التشطيبات الفاخرة', 'Samples from our luxury finishing projects')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative overflow-hidden rounded-2xl shadow-xl">
              <img src={bathroomImg} alt={t('حمام فاخر', 'Luxury Bathroom')} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={1024} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">{t('حمامات بمعايير فندقية', 'Hotel-Standard Bathrooms')}</h3>
                  <p className="text-gray-300 text-sm">{t('رخام كالاكاتا مع تركيبات ذهبية', 'Calacatta marble with golden fixtures')}</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-xl">
              <img src={kitchenImg} alt={t('مطبخ فاخر', 'Luxury Kitchen')} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={1024} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">{t('مطابخ عصرية متكاملة', 'Modern Integrated Kitchens')}</h3>
                  <p className="text-gray-300 text-sm">{t('تصميم عصري مع أسطح رخام وإضاءة مخفية', 'Modern design with marble countertops and concealed lighting')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Checklist */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('ما نقدمه لك', 'What We Offer')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 p-5 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-gray-800 font-medium">{t(feature.ar, feature.en)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">{t('مراحل العمل', 'Our Process')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: 1, ar: 'الاستشارة', en: 'Consultation', descAr: 'جلسة استشارية لفهم رؤيتك واحتياجاتك', descEn: 'Consultation session to understand your vision and needs' },
              { step: 2, ar: 'التصميم', en: 'Design', descAr: 'تصميم ثلاثي الأبعاد شامل مع اختيار الخامات', descEn: 'Comprehensive 3D design with material selection' },
              { step: 3, ar: 'الاعتماد', en: 'Approval', descAr: 'مراجعة التصميم والتعديلات حتى الرضا التام', descEn: 'Design review and adjustments until full satisfaction' },
              { step: 4, ar: 'التنفيذ', en: 'Execution', descAr: 'تنفيذ دقيق بإشراف مهندسين متخصصين', descEn: 'Precise execution supervised by specialized engineers' },
              { step: 5, ar: 'التسليم', en: 'Delivery', descAr: 'تسليم نهائي مع ضمان شامل على الأعمال', descEn: 'Final delivery with comprehensive work warranty' },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 text-white rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{t(item.ar, item.en)}</h3>
                <p className="text-gray-600 text-sm">{t(item.descAr, item.descEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-amber-50">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Star className="w-10 h-10 text-amber-500 mx-auto mb-6" />
          <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 mb-6 leading-relaxed">
            {t(
              '"التعامل مع فريق التشطيب الراقي كان تجربة استثنائية. حولوا فيلتنا إلى قصر بأدق التفاصيل"',
              '"Working with the Luxury Finishing team was an exceptional experience. They turned our villa into a palace with the finest details"'
            )}
          </blockquote>
          <div className="flex items-center justify-center gap-2">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />)}
          </div>
          <p className="text-gray-600 mt-3">{t('م. أحمد السيد - القاهرة الجديدة', 'Eng. Ahmed El-Sayed - New Cairo')}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-700 to-amber-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-300 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Award className="w-12 h-12 text-amber-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('جاهز لتحويل مساحتك؟', 'Ready to transform your space?')}</h2>
          <p className="text-xl mb-8 text-amber-100 max-w-2xl mx-auto">{t('دعنا نحول منزلك إلى تحفة فنية تعكس ذوقك الرفيع وتفوق كل التوقعات', 'Let us turn your home into a masterpiece that reflects your refined taste and exceeds all expectations')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-amber-700 hover:bg-gray-100 rounded-full px-8 text-lg">
              <Link to="/contact">{t('احجز استشارة مجانية', 'Book a Free Consultation')}</Link>
            </Button>
            <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
              <Link to="/projects">{t('شاهد أعمالنا', 'View Our Work')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LuxuryFinishingPage;
