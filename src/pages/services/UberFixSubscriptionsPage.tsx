import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { CheckCircle2, Shield, Clock, MapPin, Phone, FileText, ArrowRight, UserCheck, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from '@/contexts/LanguageContext';
import heroImg from '@/assets/services/file_19.jpg';

const UberFixSubscriptionsPage: React.FC = () => {
  const { isRTL } = useLanguage();

  const packages = [
    {
      name: "أساسية",
      price: "2,400",
      description: "صيانة دورية ربع سنوية + دعم فني 8/5",
      features: [
        "صيانة دورية ربع سنوية",
        "دعم فني 8/5",
        "استجابة خلال 24 ساعة"
      ],
      popular: false,
      color: "border-blue-200"
    },
    {
      name: "احترافية",
      price: "4,800",
      description: "صيانة دورية شهرية + دعم 24/7 + أولوية البلاغات",
      features: [
        "صيانة دورية شهرية",
        "دعم فني 24/7",
        "أولوية في البلاغات",
        "استجابة خلال 4 ساعات"
      ],
      popular: true,
      color: "border-blue-600 shadow-xl scale-105"
    },
    {
      name: "مميزة",
      price: "8,400",
      description: "صيانة شاملة + خصومات على قطع الغيار",
      features: [
        "كل مميزات الباقة الاحترافية",
        "زيارات استباقية شهرية",
        "تقارير أداء دورية",
        "خصم 20% على قطع الغيار",
        "استجابة خلال ساعتين"
      ],
      popular: false,
      color: "border-teal-200"
    }
  ];

  const features = [
    { icon: UserCheck, title: "فريق فني معتمد", desc: "خبراء مدربون على أعلى مستوى" },
    { icon: Clock, title: "استجابة خلال ساعتين", desc: "نحن هنا حينما تحتاجنا" },
    { icon: MapPin, title: "تغطية جميع المدن", desc: "نصلك أينما كان متجرك" },
    { icon: FileText, title: "عقود مرنة", desc: "خيارات تتناسب مع حجم أعمالك" }
  ];

  const testimonials = [
    { name: "أحمد محمود", role: "صاحب سلسلة مطاعم", comment: "باقة UberFix الاحترافية ريحتنا من هم الصيانة الفجائية، الفريق محترف وسريع جداً." },
    { name: "سارة خالد", role: "مديرة مبيعات قطاع التجزئة", comment: "التقارير الدورية وفرت علينا كتير، والخصم على قطع الغيار في الباقة المميزة ممتاز." }
  ];

  const faqs = [
    { q: "ما هي مدة العقد؟", a: "مدة العقد سنة كاملة قابلة للتجديد." },
    { q: "ماذا يشمل العقد؟", a: "يشمل العقد أجور العمالة والصيانة الدورية والطارئة حسب الباقة، ولا يشمل قطع الغيار إلا إذا كانت الباقة تنص على خصومات." },
    { q: "كيف يتم إصدار الفواتير؟", a: "يتم إصدار الفواتير سنوياً أو نصف سنوياً حسب الاتفاق، ويمكن الدفع عن طريق التحويل البنكي أو البطاقات الائتمانية." }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-blue-900 pt-16">
        <div className="absolute inset-0">
          <img src={heroImg} alt="UberFix Subscriptions" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/80 to-blue-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center pt-10">
          <span className="inline-block py-1 px-3 rounded-full bg-teal-500/20 text-teal-300 mb-4 font-semibold tracking-wide border border-teal-500/30">UberFix</span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            ضمان استمرارية عملك
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 mb-10 max-w-2xl mx-auto">
            عقود صيانة سنوية للمحلات التجارية تضمن لك راحة البال واستقرار أعمالك
          </p>
          <Button asChild size="lg" className="bg-teal-500 hover:bg-teal-600 text-white rounded-full px-8 py-6 text-xl shadow-lg hover:shadow-teal-500/25 transition-all">
            <a href="#pricing">
              اختر باقتك الآن
              <ArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} w-6 h-6 inline`} />
            </a>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">لماذا تختار عقود صيانة UberFix؟</h2>
            <div className="w-24 h-1 bg-teal-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">باقات الصيانة السنوية</h2>
            <p className="text-gray-600 max-w-xl mx-auto text-lg">اختر الباقة التي تناسب حجم نشاطك وتضمن لك استمرارية العمل بدون توقف.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {packages.map((pkg, i) => (
              <Card key={i} className={`relative flex flex-col bg-white border-2 ${pkg.color} ${pkg.popular ? 'z-10' : ''}`}>
                {pkg.popular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                    الأكثر طلباً
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</CardTitle>
                  <CardDescription className="h-10 text-gray-600">{pkg.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-blue-900">{pkg.price}</span>
                    <span className="text-gray-500 font-medium ml-2">ج.م / سنوياً</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-4">
                    {pkg.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-8 pb-8">
                  <Button asChild className={`w-full py-6 text-lg rounded-xl ${pkg.popular ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                    <Link to={`/uberfix-subscriptions/register?package=${pkg.name}`}>اختيار الباقة</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">آراء عملائنا</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((test, i) => (
              <Card key={i} className="bg-gray-50 border-none shadow-sm">
                <CardContent className="pt-8">
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-current" />)}
                  </div>
                  <p className="text-gray-700 text-lg italic mb-6">"{test.comment}"</p>
                  <div>
                    <h4 className="font-bold text-gray-900">{test.name}</h4>
                    <span className="text-gray-500 text-sm">{test.role}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">الأسئلة الشائعة</h2>
          </div>
          <Accordion type="single" collapsible className="w-full bg-white rounded-2xl shadow-sm border p-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b-0 mb-2 last:mb-0">
                <AccordionTrigger className="text-right text-lg font-semibold hover:no-underline hover:text-blue-600 px-4 py-4 rounded-lg transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 px-4 pb-4 text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Shield className="w-16 h-16 text-teal-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">هل تحتاج إلى عرض سعر مخصص؟</h2>
          <p className="text-blue-200 text-lg mb-8">
            إذا كان لديك سلسلة محلات كبيرة أو متطلبات خاصة، فريقنا جاهز لتصميم باقة تناسب احتياجاتك بالضبط.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-900 hover:bg-gray-100 rounded-full px-8 py-6 text-xl">
            <Link to="/contact">
              اطلب عرض سعر مخصص
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UberFixSubscriptionsPage;
