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
      title: "مواد عالية الجودة",
      description: "نوفر أفضل المواد والمنتجات من موردين معتمدين"
    },
    {
      icon: Clock,
      title: "تسليم سريع",
      description: "ضمان وصول المواد في المواعيد المحددة"
    },
    {
      icon: Shield,
      title: "ضمان الجودة",
      description: "جميع منتجاتنا مضمونة ومطابقة للمواصفات"
    },
    {
      icon: Star,
      title: "خدمة متميزة",
      description: "فريق متخصص لمتابعة طلباتك على مدار الساعة"
    }
  ];

  const supplies = [
    "مواد البناء والإنشاءات",
    "المعدات والأدوات",
    "الأجهزة الكهربائية والإلكترونية",
    "مواد السباكة والصحية",
    "الدهانات ومواد التشطيب",
    "الأثاث والمفروشات",
    "مواد السلامة والأمان",
    "قطع الغيار والصيانة"
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
              توريدات عامة
            </h1>
            <p className="text-xl mb-8 leading-relaxed">
              حلول إمداد متكاملة وشاملة لدعم جميع احتياجات مشروعك بأعلى معايير الجودة والكفاءة
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
              لماذا تختارنا؟
            </h2>
            <p className="text-lg text-gray-600">
              نقدم خدمات توريد متميزة تلبي جميع احتياجاتك
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
                خدمات التوريد المتاحة
              </h2>
              <p className="text-lg text-gray-600">
                نوفر مجموعة واسعة من المواد والمنتجات لتلبية جميع احتياجاتك
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