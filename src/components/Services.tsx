
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    icon: "🏗️",
    title: "مقاولات عامة",
    description: "نقدم خدمات شاملة في البناء والتشييد من الأساس حتى التسليم النهائي بأعلى معايير الجودة."
  },
  {
    icon: "🏢",
    title: "تصميم معماري",
    description: "فريق متخصص من المهندسين المعماريين لتصميم مشروعك بالشكل الذي تتخيله."
  },
  {
    icon: "🔨",
    title: "صيانة وترميم",
    description: "خدمات صيانة دورية وترميم للمباني القديمة مع الحفاظ على الطابع الأصلي."
  },
  {
    icon: "📝",
    title: "استشارات هندسية",
    description: "نقدم استشارات هندسية متكاملة لمساعدتك في اتخاذ القرارات المناسبة لمشروعك."
  },
  {
    icon: "🏠",
    title: "تشطيبات داخلية",
    description: "تشطيبات عالية الجودة للمنازل والمكاتب والمحلات التجارية بأحدث التصاميم."
  },
  {
    icon: "🚧",
    title: "إدارة المشاريع",
    description: "إدارة مشروعك من البداية حتى النهاية مع متابعة دقيقة لكل مرحلة من مراحل البناء."
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
