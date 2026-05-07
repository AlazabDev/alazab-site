import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Home, Sparkles, ShieldCheck, Clock, CheckCircle, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const LuxuryCleaningPage: React.FC = () => {
  const services = [
    {
      icon: Sparkles,
      title: "تسليم ما بعد التشطيب (Post-Construction)",
      description: "إزالة بقايا الجبس والدهان والسيليكون من الفيلات والمحلات الجديدة، تلميع الرخام، تنظيف الزجاج والواجهات قبل التسليم النهائي للمالك"
    },
    {
      icon: ShieldCheck,
      title: "تطهير المطاعم وفروع F&B",
      description: "بروتوكول مطابق لاشتراطات أبو عوف: تنظيف الهود والشفاطات بالبخار، تطهير ثلاجات العرض، إزالة الدهون من الأرضيات بمواد Diversey معتمدة"
    },
    {
      icon: Clock,
      title: "Deep Cleaning مجدول كل 90 يوم",
      description: "للفلل والمكاتب التنفيذية: تنظيف السجاد بماكينات استخلاص، تلميع رخام بالكريستالايزر، غسيل ستائر دون فك"
    },
    {
      icon: Star,
      title: "خدمة هاوس كيبر مقيمة",
      description: "عاملة مدربة من فريقنا، مع إشراف ميداني أسبوعي ومتابعة عبر تطبيق UberFix لتقييم الأداء وتغطية الإجازات"
    }
  ];

  const cleaningTypes = [
    "فيلات ومجمعات سكنية في التجمع والشيخ زايد والساحل",
    "محلات أبو عوف والفروع التجارية بمراكز التسوق",
    "مكاتب إدارية وعيادات تجميل في المهندسين والزمالك",
    "مطاعم وكافيهات ومخابز (تنظيف يومي وعميق)",
    "صالات عرض السيارات والمعارض التجارية",
    "فنادق بوتيك وشقق مفروشة Airbnb",
    "مدارس دولية ورياض أطفال (مواد آمنة على الأطفال)",
    "مستودعات ومصانع غذائية بمعايير HACCP"
  ];

  const features = [
    "مواد ألمانية وأمريكية: Kärcher وDiversey وEcolab بدلًا من الكلور التجاري",
    "فريق ثابت لكل عميل، مع بطاقات تعريف ومعاينة دورية للمشرف",
    "ماكينات استخلاص وبخار وتلميع رخام بدل الدلو والممسحة",
    "تأمين تأميني على العمالة وضمان ضد أي ضرر بالأثاث",
    "تسعير شفاف بالساعة أو بالمتر، بدون رسوم مفاجئة",
    "تقرير تسليم بصور ووقت الدخول والخروج لكل زيارة",
    "مرونة في المواعيد بما فيها الجمعة وبعد منتصف الليل",
    "ضمان إعادة التنفيذ مجانًا خلال 24 ساعة لو في ملاحظة"
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-green-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Home className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              تنظيف احترافي للفلل والمحلات
            </h1>
            <p className="text-xl mb-8 leading-relaxed">
              مش شركة نظافة منزلية عادية. فريق متخصص في تسليم ما بعد التشطيب، وصيانة نظافة فروع F&B، ومتابعة فلل التجمع والساحل بمعدات Kärcher ومواد Diversey.
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 rounded-full px-8"
            >
              <Link to="/contact">
                احجز خدمة التنظيف
                <ArrowRight className="mr-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              4 خطوط خدمة، كل واحد بمعداته الخاصة
            </h2>
            <p className="text-lg text-gray-600">
              مفيش "كل حاجة لكل حد" — كل قطاع له بروتوكول ومواد ومعدات مختلفة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {service.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cleaning Types Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                مين بيتعامل معانا فعلًا
              </h2>
              <p className="text-lg text-gray-600">
                عينة من ملف عملاء آخر سنة، بدل قائمة عامة لكل أنواع المباني الموجودة
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cleaningTypes.map((type, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              الفرق بيننا وبين شركة نظافة عادية
            </h2>
            <p className="text-lg text-gray-600">
              تفاصيل تشغيلية مش شعارات تسويقية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              من المعاينة لتقرير التسليم
            </h2>
            <p className="text-lg text-gray-600">
              4 خطوات موثقة، مفيش مفاجآت في الفاتورة ولا في النتيجة
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">معاينة على الطبيعة</h3>
              <p className="text-gray-600">مشرف يزور الموقع، يقيس المساحات، ويحدد نوع الخامات والمعدات المطلوبة</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">عرض سعر مكتوب</h3>
              <p className="text-gray-600">سعر بالساعة أو بالمتر، عدد العمالة، الوقت المتوقع، والمواد المستخدمة بالاسم</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">تنفيذ بإشراف ميداني</h3>
              <p className="text-gray-600">مشرف ثابت طوال الزيارة، تسجيل وقت الدخول والخروج، صور لكل مرحلة</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold mb-2">تقرير + ضمان 24 ساعة</h3>
              <p className="text-gray-600">تقرير PDF بالصور، وأي ملاحظة خلال 24 ساعة بنرجع نعالجها مجانًا</p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              باقات الخدمة
            </h2>
            <p className="text-lg text-gray-600">
              اختر الباقة التي تناسب احتياجاتك
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-600">باقة أساسية</CardTitle>
                <CardDescription>للتنظيف الدوري والأساسي</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-right space-y-2 mb-6">
                  <li>• تنظيف الأرضيات والأسطح</li>
                  <li>• تنظيف النوافذ والمرايا</li>
                  <li>• تفريغ سلال المهملات</li>
                  <li>• تنظيف دورات المياه</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700 rounded-full">
                  اطلب الآن
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl text-center bg-green-50 border-green-200 border-2">
              <CardHeader>
                <div className="bg-green-600 text-white px-4 py-1 rounded-full text-sm mx-auto mb-4 w-fit">
                  الأكثر شعبية
                </div>
                <CardTitle className="text-2xl font-bold text-green-600">باقة متقدمة</CardTitle>
                <CardDescription>للتنظيف الشامل والمتقدم</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-right space-y-2 mb-6">
                  <li>• جميع خدمات الباقة الأساسية</li>
                  <li>• تنظيف الأثاث والمفروشات</li>
                  <li>• تعقيم وتطهير شامل</li>
                  <li>• تنظيف المطابخ بالتفصيل</li>
                  <li>• تنظيف التكييف</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700 rounded-full">
                  اطلب الآن
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-green-600">باقة فاخرة</CardTitle>
                <CardDescription>للتنظيف الفاخر والمتكامل</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-right space-y-2 mb-6">
                  <li>• جميع خدمات الباقة المتقدمة</li>
                  <li>• تنظيف الحدائق والمساحات الخارجية</li>
                  <li>• خدمة تنظيف السجاد والستائر</li>
                  <li>• صيانة دورية للنظافة</li>
                  <li>• خدمة عملاء مخصصة</li>
                </ul>
                <Button className="w-full bg-green-600 hover:bg-green-700 rounded-full">
                  اطلب الآن
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            جاهز لتجربة التنظيف الفاخر؟
          </h2>
          <p className="text-xl mb-8">
            فريقنا المتخصص جاهز لتقديم أفضل خدمات التنظيف
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-green-600 hover:bg-gray-100 rounded-full"
            >
              <Link to="/contact">
                احجز الآن
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600 rounded-full"
            >
              <Link to="/projects">
                شاهد أعمالنا
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LuxuryCleaningPage;