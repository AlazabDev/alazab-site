import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Crown, Home, Paintbrush, Gem, CheckCircle, Star, Award, Layers, Lightbulb } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/file_12.jpg';
import bathroomImg from '@/assets/services/file_15.jpg';
import kitchenImg from '@/assets/services/file_16.jpg';

const LuxuryFinishingPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Crown, titleAr: "تشطيب فاخر بمواصفات مكتوبة", titleEn: "Luxury Finishing With Spec Sheets", descriptionAr: "كل غرفة بكراسة مواصفات مفصّلة: نوع الرخام، سُمك الباركيه، شركة الدهان، رقم اللون. مفيش مفاجآت في التسليم.", descriptionEn: "Every room comes with a detailed spec sheet — marble type, parquet thickness, paint brand, color code. No surprises at handover." },
    { icon: Paintbrush, titleAr: "تصميم داخلي بـ 3D قبل البدء", titleEn: "Full 3D Design Before We Start", descriptionAr: "بنطلع لك جولة افتراضية كاملة لكل ركن قبل ما نكسر طوبة. التعديلات مجانية في مرحلة التصميم.", descriptionEn: "A complete virtual walkthrough of every corner before we break ground. Changes are free during design." },
    { icon: Home, titleAr: "فلل وشقق ودوبلكس", titleEn: "Villas, Apartments & Duplexes", descriptionAr: "خبرة في أحياء كومبوندز التجمع والشيخ زايد والساحل. فريق منفصل لكل مشروع، مهندس مقيم في الموقع.", descriptionEn: "Experienced in New Cairo, Sheikh Zayed, and North Coast compounds. A dedicated team per project with a resident on-site engineer." },
    { icon: Gem, titleAr: "خامات مستوردة من المصنع مباشرة", titleEn: "Materials Direct From the Factory", descriptionAr: "علاقات مباشرة مع موردين في كرارا الإيطالية وفالنسيا الإسبانية. بنوفّر لك 18-25% من سعر السوق المحلي.", descriptionEn: "Direct relationships with suppliers in Carrara (Italy) and Valencia (Spain). We save you 18–25% off local market prices." },
    { icon: Lightbulb, titleAr: "إضاءة Smart Home بنظام KNX", titleEn: "KNX Smart Lighting", descriptionAr: "تأسيس نظام KNX الألماني — نفس النظام في فنادق فور سيزونز. تحكم بالتطبيق، سيناريوهات، استشعار حركة.", descriptionEn: "We install the German KNX system — same as Four Seasons hotels. App control, scenes, and motion sensors." },
    { icon: Layers, titleAr: "أسقف وجدران بتصاميم تنفيذية", titleEn: "Ceilings & Walls With Shop Drawings", descriptionAr: "كل سقف وجدار بنرسم له شوب درواينج تنفيذي. الفنيين بيشتغلوا برسم، مش بالعين.", descriptionEn: "Every ceiling and wall has its own shop drawing. Crews work from drawings — not by eye." },
  ];

  const features = [
    { ar: "أرضيات: رخام كرارا، بيانكو ثاسوس، بورسلين 120×60", en: "Floors: Carrara marble, Bianco Thassos, 120×60 porcelain" },
    { ar: "دهانات Jotun الديكورية وورق حائط Versace", en: "Jotun decorative paints and Versace wallpaper" },
    { ar: "إضاءة LED قابلة للتعتيم بدرجة حرارة 2700K-4000K", en: "Dimmable LED 2700K–4000K with full color tuning" },
    { ar: "أسقف جبس مع مخفي كومبا وكورنيش بأشكال مخصصة", en: "Gypsum ceilings with concealed cove lighting and custom cornices" },
    { ar: "مطابخ بأبواب لاكيه + رخام كوارتز سيلستون", en: "Kitchens with lacquer doors and Silestone quartz countertops" },
    { ar: "نظام KNX للتحكم في الإضاءة والستائر والتكييف", en: "KNX system for lighting, curtain, and AC control" },
    { ar: "دريسنج روم مع إضاءة داخل الأدراج وحساس حركة", en: "Dressing rooms with in-drawer lighting and motion sensors" },
    { ar: "أعمال جبس بورد بسماكة 12.5مم Knauf أو Gyproc", en: "12.5mm Knauf or Gyproc gypsum board work" },
  ];

  const stats = [
    { value: "187", labelAr: "فيلا وشقة منذ 2010", labelEn: "Villas & apartments since 2010" },
    { value: "16", labelAr: "سنة في السوق", labelEn: "Years in the market" },
    { value: "94%", labelAr: "تسليم بالموعد المتفق عليه", labelEn: "On-time delivery rate" },
    { value: "23", labelAr: "مهندس ومصمم داخلي", labelEn: "Engineers & interior designers" },
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
              {t('التفاصيل اللي بتفرق', "It's the details that show")}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'بنشتغل في تشطيب الفلل والشقق الراقية في القاهرة الجديدة والشيخ زايد والساحل من 2010. مفيش مفهوم "زي بعضه" — كل بيت بكراسة مواصفات منفصلة، تصميم 3D معتمد منك، ومهندس مقيم على الموقع طول فترة التنفيذ.',
                "We've been finishing high-end villas and apartments across New Cairo, Sheikh Zayed, and the North Coast since 2010. We don't do 'good enough' — every home gets its own spec sheet, a 3D design you sign off on, and a resident on-site engineer for the entire build."
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('اللي بنعمله بالظبط', 'Exactly What We Do')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('ست خدمات رئيسية، كل واحدة بفريق متخصص ومواصفات مكتوبة', 'Six core offerings — each with its own dedicated crew and written specs')}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('شوف بنفسك', 'See For Yourself')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('فيلتين من تسليمات 2024 — التجمع الخامس والساحل الشمالي', 'Two villas from 2024 handovers — Fifth Settlement and North Coast')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group relative overflow-hidden rounded-2xl shadow-xl">
              <img src={bathroomImg} alt={t('حمام فاخر', 'Luxury Bathroom')} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={1024} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">{t('حمام ماستر — فيلا التجمع', 'Master Bath — Fifth Settlement Villa')}</h3>
                  <p className="text-gray-300 text-sm">{t('رخام كالاكاتا أصلي + كرات ذهبية مات من Hansgrohe', 'Authentic Calacatta marble with matte gold Hansgrohe fixtures')}</p>
                </div>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-2xl shadow-xl">
              <img src={kitchenImg} alt={t('مطبخ فاخر', 'Luxury Kitchen')} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={1024} height={1024} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div>
                  <h3 className="text-white text-xl font-bold">{t('مطبخ مفتوح — شالية الساحل', 'Open Kitchen — North Coast Chalet')}</h3>
                  <p className="text-gray-300 text-sm">{t('أبواب لاكيه مات + رخام ديكتون Sirius + جزيرة 3.20 متر', 'Matte lacquer doors, Dekton Sirius slab, and a 3.20m island')}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('المواصفات بالتفصيل', 'The Spec Sheet')}</h2>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">{t('الخمس مراحل اللي بنشتغل بيها', 'Our 5-Stage Process')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: 1, ar: 'جلسة في المكتب', en: 'Office Session', descAr: 'ساعة ونصف بنشوف صور بتحبها، ميزانية واقعية، وجدول زمني مبدئي', descEn: '90 minutes to walk through inspiration, set a realistic budget, and outline a timeline' },
              { step: 2, ar: 'تصميم 3D ومود بورد', en: '3D Design & Mood Board', descAr: 'بنطلع لك جولة 3D + عينات خامات في يدك. التعديلات لحد ما توافق', descEn: 'A 3D walkthrough plus physical material samples in your hand. Revise until you sign off' },
              { step: 3, ar: 'كراسة شروط ومواصفات', en: 'BOQ & Specs', descAr: 'كل بند بسعره منفصل، مواصفات الخامة برقم الموديل، جدول دفعات شفاف', descEn: 'Every line item priced separately, specs by SKU, and a transparent payment schedule' },
              { step: 4, ar: 'تنفيذ بمهندس مقيم', en: 'Build With Resident Engineer', descAr: 'مهندس على الموقع 6 أيام أسبوعياً + تقرير تصوير أسبوعي على واتساب', descEn: 'On-site engineer 6 days a week plus a weekly photo report on WhatsApp' },
              { step: 5, ar: 'تسليم وضمان عامين', en: 'Handover & 2-Year Warranty', descAr: 'Snag list مكتوبة، مفتاح، وضمان سنتين على الأعمال + سنة على الخامات', descEn: 'Written snag list, keys handed over, plus 2-year workmanship and 1-year materials warranty' },
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
              '"اللي عجبني إن كل تعديل طلبته في مرحلة الـ3D اتعمل بدون مناقشة. ساعة التسليم ملقيتش حاجة محتاجة تتعدّل — وده مش طبيعي في السوق المصري"',
              '"What stood out: every change I asked for during the 3D phase happened without pushback. At handover I had nothing to flag — which is rare in this market."'
            )}
          </blockquote>
          <div className="flex items-center justify-center gap-2">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />)}
          </div>
          <p className="text-gray-600 mt-3">{t('م. أحمد السيد — فيلا 480م في كومبوند ميفيدا', 'Eng. Ahmed El-Sayed — 480m² villa, Mivida compound')}</p>
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
