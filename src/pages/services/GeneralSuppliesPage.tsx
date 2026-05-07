import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, Package, Clock, Shield, CheckCircle, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const GeneralSuppliesPage: React.FC = () => {
  const features = [
    {
      icon: Package,
      title: "موردين معتمدين بفواتير ضريبية",
      description: "تعامل مباشر مع وكلاء Jotun وSika وSchneider وLegrand بفاتورة ضريبية ومستندات منشأ كاملة"
    },
    {
      icon: Clock,
      title: "جدول توريد ملتزم بالموقع",
      description: "تسليم على دفعات حسب جدول المقاول، ومتابعة يومية مع أمين المخزن لضمان عدم توقف العمالة"
    },
    {
      icon: Shield,
      title: "مطابقة للمواصفات والكود المصري",
      description: "كل توريد مرفق به شهادات مطابقة وdata sheet، ونرفض أي خامة لا تطابق العينة المعتمدة"
    },
    {
      icon: Star,
      title: "مدير حساب لكل مشروع",
      description: "نقطة تواصل واحدة لمتابعة العروض والطلبيات والشحنات، بدل التشتت بين عشرات الموردين"
    }
  ];

  const supplies = [
    "خامات المباني: طوب، أسمنت السويس/العريش، حديد عز/بشاي",
    "كهرباء جهد منخفض: لوحات Schneider، كابلات السويدي، إكسسوارات Legrand",
    "سباكة: مواسير Pexal وGeberit، خلاطات Grohe وHansgrohe",
    "تكييف وتهوية: وحدات Carrier وLG، مجاري هواء معزولة",
    "تشطيبات: دهانات Jotun وCMB، أرضيات HDF/SPC، رخام وجرانيت",
    "مواد عزل ومانعات تسرب: Sika، BASF، MasterRoc",
    "أدوات سلامة: PPE معتمد، طفايات وأنظمة إنذار حريق",
    "إكسسوارات وقطع غيار للصيانة الدورية للفروع"
  ];

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Truck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              توريدات لبن العصفور
            </h1>
            <p className="text-xl mb-8 leading-relaxed">
              ذراع التوريد داخل مجموعة العزب: نوصّل خامات ومعدات المشروع من المورد الأصلي للموقع، بفاتورة ضريبية وجدول تسليم ملتزم، ومن غير وسطاء يرفعوا التكلفة.
            </p>
            <Button 
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-full px-8"
            >
              <Link to="/contact">
                احصل على عرض سعر
                <ArrowRight className="mr-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ليه المقاولين بيشتغلوا معانا؟
            </h2>
            <p className="text-lg text-gray-600">
              لأننا نتعامل كأمين مخزن للمشروع مش كتاجر، وبنحمي المقاول من تذبذب الأسعار وتأخر الشحنات
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supplies List Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                فئات التوريد اللي بنغطيها
              </h2>
              <p className="text-lg text-gray-600">
                من البنية التحتية للمشروع لحد إكسسوارات التشطيب وقطع غيار الصيانة الشهرية
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supplies.map((supply, index) => (
                <div key={index} className="flex items-center space-x-3 space-x-reverse p-4 bg-gray-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{supply}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            هل تحتاج إلى خدمات التوريد؟
          </h2>
          <p className="text-xl mb-8">
            تواصل معنا الآن وسنقوم بتلبية جميع احتياجاتك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 rounded-full"
            >
              <Link to="/contact">
                تواصل معنا
              </Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600 rounded-full"
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

export default GeneralSuppliesPage;