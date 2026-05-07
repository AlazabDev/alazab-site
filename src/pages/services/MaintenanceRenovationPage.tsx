import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Hammer, Wrench, PaintBucket, Zap, CheckCircle, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const MaintenanceRenovationPage: React.FC = () => {
  const services = [
    {
      icon: Wrench,
      title: "عقود صيانة شهرية للفروع",
      description: "زيارات دورية مجدولة (PPM) لمحلات أبو عوف والفروع التجارية، مع تقرير حالة شهري وصور قبل/بعد"
    },
    {
      icon: PaintBucket,
      title: "تجديد جزئي بدون غلق المحل",
      description: "أعمال دهان، استبدال أرضيات، تحديث واجهات، يتم تنفيذها ليلًا أو في أوقات إغلاق الفرع لضمان استمرار البيع"
    },
    {
      icon: Zap,
      title: "استجابة طوارئ خلال ساعتين",
      description: "تسريب مياه، فصل كهرباء، عطل تكييف؟ فني UberFix يصل لأي فرع داخل القاهرة الكبرى خلال ساعتين كحد أقصى"
    },
    {
      icon: Star,
      title: "إعادة تأهيل كاملة (Refit)",
      description: "تجهيز فرع قديم بهوية جديدة: هدم منظم، تشطيب، أثاث، إنارة، وتسليم جاهز للافتتاح خلال 21–30 يوم"
    }
  ];

  const maintenanceTypes = [
    "كهرباء: استبدال لوحات Schneider، إصلاح أعطال الإنارة LED، توصيل أحمال جديدة",
    "سباكة: كشف تسريبات بكاميرا حرارية، تغيير سخانات وخلاطات Grohe",
    "تكييف: غسيل وحدات Carrier وLG، شحن فريون، صيانة دكتات",
    "أبواب وواجهات: ضبط Sectional Doors، إصلاح زجاج الواجهات وSecurit",
    "أرضيات: لحام ودهان إيبوكسي، تلميع رخام، استبدال SPC بدون إخلاء",
    "جدران وأسقف: معالجة شروخ، دهانات Jotun، إصلاح أسقف جبس",
    "ديكور وأثاث: إعادة تنجيد، صيانة فيترينات العرض ورفوف المنتجات",
    "خارجية: تنظيف وتشطيب لوحات إعلانية، إنارة واجهات، صيانة مظلات"
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Hammer className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              صيانة وتجديد الفروع التجارية والسكنية
            </h1>
            <p className="text-xl mb-8 leading-relaxed">
              عقود صيانة شهرية وتجديدات تتم بدون توقف العمل. خبرتنا اتبنت على إدارة فروع أبو عوف ومحلات تجارية فعّالة، مش على شعارات إعلانية.
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 rounded-full px-8"
            >
              <Link to="/maintenance-request">
                اطلب خدمة صيانة
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
              4 خطوط خدمة، كل واحد بـ SLA واضح
            </h2>
            <p className="text-lg text-gray-600">
              الصيانة عندنا مش "نيجي نشوف"، دي عقد مكتوب بمواعيد استجابة وغرامة تأخير
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
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

      {/* Maintenance Types Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                الأعمال اللي بنغطيها يوميًا
              </h2>
              <p className="text-lg text-gray-600">
                قائمة فعلية من تذاكر آخر 90 يوم — مش كتالوج عام منقول من الإنترنت
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maintenanceTypes.map((type, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-orange-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              من فتح التذكرة لقفلها
            </h2>
            <p className="text-lg text-gray-600">
              دورة موثقة على نظام UberFix الداخلي، بتشوفها لحظة بلحظة من بوابة العميل
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">فتح تذكرة</h3>
              <p className="text-gray-600">واتساب أو بوابة العميل، مع صور ووصف العطل، يصدر رقم تذكرة فوري</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">تشخيص وعرض سعر</h3>
              <p className="text-gray-600">معاينة خلال 24 ساعة + عرض مكتوب بالخامات والوقت قبل أي تنفيذ</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">تنفيذ موثّق</h3>
              <p className="text-gray-600">صور قبل/أثناء/بعد ترفع على التذكرة، وتوقيع مدير الفرع على الاستلام</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-bold mb-2">ضمان 6 شهور</h3>
              <p className="text-gray-600">على العمالة، وضمان المصنّع على الخامات، مع متابعة بعد 30 يوم</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-orange-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            تحتاج إلى خدمات صيانة؟
          </h2>
          <p className="text-xl mb-8">
            فريقنا المتخصص جاهز لخدمتك على مدار الساعة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-orange-600 hover:bg-gray-100 rounded-full"
            >
              <Link to="/maintenance-request">
                اطلب صيانة الآن
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-orange-600 rounded-full"
            >
              <Link to="/maintenance-tracking">
                تتبع طلب الصيانة
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MaintenanceRenovationPage;