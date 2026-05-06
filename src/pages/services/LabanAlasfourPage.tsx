import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Globe, Search, Shield, CheckCircle, Truck, MapPin, Award, Gem, TreePine, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/file_22.jpg';

const LabanAlasfourPage: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    { icon: Search, titleAr: "بنلاقي اللي مفيش حد لاقيه", titleEn: "We Find What Others Can't", descriptionAr: "محتاج رخام Calacatta Borghini لوح بسماكة 6 سم؟ خشب جاك أوف مجفف غرفة بنسبة 8%؟ بنطلع عرض في 72 ساعة.", descriptionEn: "Need 6cm-thick Calacatta Borghini slabs? Kiln-dried Jacaranda at 8% moisture? You'll have a quote in 72 hours." },
    { icon: Globe, titleAr: "مكاتب اتصال في 6 دول", titleEn: "Offices in 6 Countries", descriptionAr: "مكاتب اتصال دائمة في كرارا، فالنسيا، إستانبول، فرانكفورت، شنغهاي، وساوباولو. زيارة المصنع قبل الشحن.", descriptionEn: "Permanent liaisons in Carrara, Valencia, Istanbul, Frankfurt, Shanghai, and São Paulo. We visit the factory before shipping." },
    { icon: Shield, titleAr: "فحص جودة قبل وبعد الشحن", titleEn: "Pre- and Post-Shipment QC", descriptionAr: "فحص بصري وكيميائي للعينات في مختبر معتمد. تقرير مفصل قبل ما توافق على الشحنة.", descriptionEn: "Visual and chemical inspection at an accredited lab. Detailed report before you approve the shipment." },
    { icon: Package, titleAr: "خامات الـ Spec الصعبة", titleEn: "The 'Difficult Spec' Materials", descriptionAr: "خامات بمواصفات معمارية معقدة: زجاج بريستول مقاوم للحريق، رخام بألوان وعروق محددة، أخشاب بشهادة FSC.", descriptionEn: "Materials with complex specs: Pristol fire-rated glass, marble matched to specific veining, FSC-certified woods." },
    { icon: Truck, titleAr: "شحن بحري وجوي مؤمَّن 100%", titleEn: "Sea & Air Freight, Fully Insured", descriptionAr: "شحن من المصنع لباب موقعك. تأمين كامل ضد الكسر. التخليص الجمركي على حسابنا.", descriptionEn: "Door-to-site shipping with full breakage insurance. Customs clearance is on us." },
    { icon: Sparkles, titleAr: "استشارة تقنية للمصممين", titleEn: "Technical Consulting for Designers", descriptionAr: "تقدر تكلّم مهندس عندنا قبل ما تحدد الخامة في الـ Spec — هنوريك بدائل أفضل أو أرخص في 80% من الحالات.", descriptionEn: "Talk to our engineer before you spec a material — we suggest better or cheaper alternatives in 80% of cases." },
  ];

  const materials = [
    { icon: Gem, ar: "رخام كرارا، كالاكاتا، بيانكو ثاسوس، ترافرتين روماني", en: "Carrara, Calacatta, Bianco Thassos, and Roman travertine" },
    { icon: TreePine, ar: "أخشاب الإيبي البرازيلي، جاك أوف الأفريقي، البلوط الأمريكي الأبيض", en: "Brazilian Ipê, African Iroko, American White Oak" },
    { icon: Sparkles, ar: "نحاس وبرونز معماري بألوان مخصصة (Patina) للواجهات", en: "Architectural copper and bronze with custom patina for facades" },
    { icon: Shield, ar: "زجاج معماري Saint-Gobain + زجاج ذكي PDLC من اليابان", en: "Saint-Gobain architectural glass and Japanese PDLC smart glass" },
    { icon: Package, ar: "عوازل Rockwool ودانمركية بأعلى تصنيف حريق A1", en: "Rockwool and Danish insulation with A1 fire rating" },
    { icon: Globe, ar: "خامات معتمدة LEED Platinum وWELL للمشاريع المستدامة", en: "LEED Platinum and WELL-certified materials for sustainable projects" },
  ];

  const countries = [
    { ar: "إيطاليا", en: "Italy", specialtyAr: "الرخام (كرارا، فيرونا)", specialtyEn: "Marble (Carrara, Verona)" },
    { ar: "ألمانيا", en: "Germany", specialtyAr: "Saint-Gobain، Knauf", specialtyEn: "Saint-Gobain, Knauf" },
    { ar: "تركيا", en: "Turkey", specialtyAr: "جرانيت، أونيكس", specialtyEn: "Granite, Onyx" },
    { ar: "البرازيل", en: "Brazil", specialtyAr: "إيبي، جاراندا", specialtyEn: "Ipê, Jacaranda" },
    { ar: "اليابان", en: "Japan", specialtyAr: "زجاج PDLC، Toto", specialtyEn: "PDLC glass, Toto" },
    { ar: "إسبانيا", en: "Spain", specialtyAr: "بورسلين Inalco، Porcelanosa", specialtyEn: "Inalco, Porcelanosa porcelain" },
  ];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero */}
      <section className="relative min-h-[85vh] mt-16 flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="Laban Alasfour" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-6">
              <Package className="w-5 h-5 text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">{t('خط إنتاج متخصص', 'Specialized Production Line')}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              {t('لبن العصفور', 'Laban Alasfour')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-200 italic font-medium mb-4">
              {t('نوفر المستحيل... لنبني المستحيل', 'We provide the impossible... to build the impossible')}
            </p>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed max-w-2xl">
              {t(
                'خط إنتاج متخصص في توفير الخامات المعمارية التي يصعب العثور عليها. نبحث ونجلب لكم أندر وأجود الخامات من أكثر من 30 دولة حول العالم لتلبية احتياجات مشاريعكم الأكثر تطلباً وتميزاً.',
                'A specialized production line focused on sourcing hard-to-find architectural materials. We search for and procure the rarest and highest quality materials from over 30 countries worldwide to meet the demands of your most challenging and distinctive projects.'
              )}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 text-lg">
                <Link to="/contact">
                  {t('احصل على عرض سعر', 'Get a Quote')}
                  <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-5 h-5`} />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-8 text-lg font-bold transition-all">
                <Link to="/projects">{t('شاهد مشاريعنا', 'View Our Projects')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('لماذا لبن العصفور؟', 'Why Laban Alasfour?')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('لأننا نؤمن أن المشاريع الاستثنائية تستحق خامات استثنائية', 'Because we believe exceptional projects deserve exceptional materials')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white group">
                  <CardHeader>
                    <div className="w-18 h-18 bg-blue-100 text-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center p-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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

      {/* Materials */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-14">{t('ما نوفره لك', 'What We Source For You')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-700" />
                  </div>
                  <span className="text-gray-800 font-medium">{t(item.ar, item.en)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Network */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('شبكتنا العالمية', 'Our Global Network')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('نتعامل مع موردين معتمدين في أكثر من 30 دولة', 'We work with certified suppliers in over 30 countries')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {countries.map((country, i) => (
              <div key={i} className="bg-white rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-1">{t(country.ar, country.en)}</h4>
                <p className="text-xs text-blue-600">{t(country.specialtyAr, country.specialtyEn)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-700 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Award className="w-12 h-12 text-blue-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('تحتاج خامات نادرة لمشروعك؟', 'Need Rare Materials for Your Project?')}</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">{t('مهما كان نوع الخامة التي تبحث عنها، فريقنا قادر على توفيرها من أي مكان في العالم', 'Whatever material you\'re looking for, our team can source it from anywhere in the world')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-gray-100 rounded-full px-8 text-lg">
              <Link to="/contact">{t('تواصل معنا الآن', 'Contact Us Now')}</Link>
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

export default LabanAlasfourPage;
