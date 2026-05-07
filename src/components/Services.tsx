
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: "🏗️",
    title: "مقاولات هيكلية وتشييد",
    description: "تنفيذ خرسانات مسلحة بكود ECP-203، حديد عز/بشاي وأسمنت السويس، مع مكتب استشاري معتمد لمتابعة الاختبارات في معامل القاهرة."
  },
  {
    icon: "🏢",
    title: "تصميم معماري وShop Drawings",
    description: "رسومات تنفيذية AutoCAD/Revit مع جداول كميات BOQ وتفاصيل عقد، جاهزة لتقديمها للحي أو لشركة الإدارة."
  },
  {
    icon: "🔨",
    title: "صيانة فروع UberFix",
    description: "عقود صيانة شهرية لسلاسل المحلات (نموذج أبو عوف): استجابة طوارئ خلال ساعتين، وفريق مناوبة ليلي للأعمال اللي ما تقفش الفرع."
  },
  {
    icon: "📝",
    title: "استشارات تكلفة وجدوى",
    description: "تحليل BOQ ومقارنة عروض المقاولين، وتقدير تكلفة م² واقعي بالأسعار الحالية لخامات Jotun وSika وSchneider قبل ما توقع أي عقد."
  },
  {
    icon: "🏠",
    title: "تشطيبات Luxury Finishing",
    description: "تشطيب فلل وشقق بمعايير 5 مراحل: من جلسة التصميم لحد ضمان سنتين، مع KNX للإضاءة الذكية ودهانات Jotun وأرضيات Carrara."
  },
  {
    icon: "🚧",
    title: "إدارة مشاريع وفِت أوت تجاري",
    description: "افتتاح فروع تجارية في 21 يوم (Brand Identity)، بمدير مشروع واحد مسؤول عن المقاول والتوريدات والتسليم للعميل."
  },
];

const Services: React.FC = () => {
  return (
    <section id="services" className="section bg-construction-light">
      <div className="container mx-auto">
        <h2 className="section-title">خدماتنا</h2>
        <p className="section-subtitle">نقدم مجموعة متكاملة من الخدمات الهندسية والإنشائية</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{service.icon}</div>
                <CardTitle className="card-title">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="card-content">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
