
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';

const About: React.FC = () => {
  const { t, isRTL } = useLanguage();

  const achievements = [
    { number: "20+", labelAr: "سنة من الخبرة", labelEn: "Years of Experience" },
    { number: "500+", labelAr: "مشروع منجز", labelEn: "Completed Projects" },
    { number: "100+", labelAr: "عميل راضي", labelEn: "Satisfied Clients" },
    { number: "4", labelAr: "خطوط إنتاج متخصصة", labelEn: "Specialized Production Lines" }
  ];

  const values = [
    {
      titleAr: "الجودة العالية", titleEn: "High Quality",
      descriptionAr: "نلتزم بأعلى معايير الجودة في جميع مشاريعنا",
      descriptionEn: "We commit to the highest quality standards in all our projects",
      icon: "🏆"
    },
    {
      titleAr: "الالتزام بالمواعيد", titleEn: "On-Time Delivery",
      descriptionAr: "نحترم مواعيد التسليم ونلتزم بالجداول الزمنية المحددة",
      descriptionEn: "We respect delivery deadlines and adhere to set schedules",
      icon: "⏰"
    },
    {
      titleAr: "الابتكار المستمر", titleEn: "Continuous Innovation",
      descriptionAr: "نستخدم أحدث التقنيات والطرق في مجال البناء",
      descriptionEn: "We use the latest technologies and methods in construction",
      icon: "💡"
    },
    {
      titleAr: "فريق محترف", titleEn: "Professional Team",
      descriptionAr: "فريق من المهندسين والخبراء المتخصصين",
      descriptionEn: "A team of specialized engineers and experts",
      icon: "👥"
    }
  ];

  return (
    <section id="about" className="section bg-construction-light" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* About Image */}
          <div className="relative">
            <div className="absolute -top-4 -right-4 w-72 h-72 lg:w-80 lg:h-80 bg-construction-primary rounded-lg"></div>
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2574&auto=format&fit=crop" 
              alt={t('شركة العزب للمقاولات', 'Alazab General Contracting')} 
              className="relative z-10 w-full h-auto rounded-lg shadow-xl"
            />
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-construction-accent rounded-lg"></div>
          </div>
          
          {/* About Content */}
          <div>
            <div className="inline-block bg-construction-accent/20 text-construction-accent px-3 py-1 rounded-full text-sm font-medium mb-4">
              {t('من نحن', 'About Us')}
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">
              {t(
                <>شركة العزب للمقاولات العامة <br /><span className="text-construction-accent">تاريخ من التميز في البناء والتشطيب</span></>,
                <>Alazab General Contracting <br /><span className="text-construction-accent">A History of Excellence in Construction and Finishing</span></>
              )}
            </h2>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              {t(
                'تأسست شركة العزب للمقاولات منذ أكثر من 20 عاماً لتصبح من الشركات الرائدة في مجال المقاولات والبناء في المملكة العربية السعودية ومصر. قمنا بتطوير هيكلنا التشغيلي ليشمل أربعة خطوط إنتاج متكاملة، يدير كل منها فريق خبراء متخصصين، لتقديم حلول أكثر عمقاً تلبي احتياجات عملائنا.',
                'Founded over 20 years ago, Alazab Contracting has become a leading company in the construction sector in Saudi Arabia and Egypt. We have strategically developed our operational structure to include four integrated production lines, each managed by a team of specialized experts, to provide deeper solutions that meet our clients\' needs.'
              )}
            </p>
            <p className="text-base text-gray-600 mb-8 leading-relaxed">
              {t(
                'رسالتنا تمكينكم من تحقيق رؤاكم المعمارية بمعايير الجودة والالتزام.',
                'Our mission is to empower you to achieve your architectural visions with the highest standards of quality and commitment.'
              )}
            </p>
            
            <Button className="bg-construction-primary hover:bg-construction-dark text-white" asChild>
              <Link to="/about">{t('تعرف علينا أكثر', 'Learn More About Us')}</Link>
            </Button>
          </div>
        </div>

        {/* إحصائيات الشركة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {achievements.map((achievement, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-2xl md:text-3xl font-bold text-construction-primary mb-2">
                  {achievement.number}
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  {t(achievement.labelAr, achievement.labelEn)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* قيمنا الأساسية */}
        <div className="text-center mb-12">
          <h3 className="section-title">{t('قيمنا الأساسية', 'Our Core Values')}</h3>
          <p className="section-subtitle">
            {t(
              'نؤمن بمجموعة من القيم الأساسية التي توجه عملنا وتضمن تحقيق أهدافنا ورضا عملائنا',
              'We believe in a set of core values that guide our work and ensure we achieve our goals and client satisfaction'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {values.map((value, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-3xl mb-4">{value.icon}</div>
                <h4 className="card-title text-lg mb-3">
                  {t(value.titleAr, value.titleEn)}
                </h4>
                <p className="card-content text-sm">
                  {t(value.descriptionAr, value.descriptionEn)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* شهادات الجودة */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-xl md:text-2xl font-bold text-construction-primary mb-4">
              {t('شهادات الجودة والاعتمادات', 'Quality Certifications & Accreditations')}
            </h3>
            <p className="text-base text-gray-600">
              {t('حاصلون على شهادات الجودة العالمية والاعتمادات المحلية', 'Holders of international quality certificates and local accreditations')}
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="outline" className="px-4 py-2 text-sm">ISO 9001:2015</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">{t('شهادة الغرفة التجارية', 'Chamber of Commerce Certificate')}</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">{t('عضوية جمعية المهندسين', 'Engineers Association Membership')}</Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">{t('اعتماد وزارة الإسكان', 'Ministry of Housing Accreditation')}</Badge>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
