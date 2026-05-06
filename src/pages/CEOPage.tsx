
import React, { useState } from 'react';
import PageLayout from "../components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Building, Award, Users, Target } from 'lucide-react';
import Logo from '@/components/shared/Logo';

const CEOPage: React.FC = () => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const content = {
    ar: {
      title: "محمد عزب",
      subtitle: "المؤسس والرئيس التنفيذي والعضو المنتدب لشركة العزب للإنشاءات",
      about: "محمد عزب هو المهندس المعماري والرائد في مجال التطوير العقاري الذي قام بتأسيس العزب للإنشاءات، وهي الشركة التي أصبحت مرجعًا في تقديم حلول معمارية وإنشائية متكاملة. بشغفه وإبداعه، استطاع محمد أن يبني شركة تتميز بالجودة والاحترافية، وتقدم خدمات متميزة في مجال البناء والتجهيزات والصيانات المعمارية.",
      backgroundTitle: "الخلفية الأكاديمية والمهنية",
      backgroundText: "محمد عزب حاصل على الدرجة الأولى بتزكية في الهندسة المعمارية من أكاديمية الحياة المهنية، وهو عضو في جمعية المهندسين المصرية. بدأ محمد مسيرته المهنية في العمل لدى شركات كبرى في مجال الإنشاءات، حيث اكتسب خبرة واسعة في تصميم وتنفيذ المشاريع المعمارية المتنوعة.",
      visionTitle: "الرؤية والرسالة",
      visionText: "تتمثل رؤية محمد عزب في تقديم حلول معمارية مبتكرة ومستدامة تلبي احتياجات العملاء وتفوق توقعاتهم. يؤمن بأن النجاح الحقيقي لا يتحقق إلا من خلال الالتزام بالجودة والشفافية والاستدامة في كل مشروع. رسالته هي تحويل الأفكار إلى واقع ملموس، وخلق مساحات تلهم وتؤثر إيجابيًا في حياة الناس.",
      achievementsTitle: "الإنجازات",
      achievementsText: "تحت قيادته، نجحت العزب للإنشاءات في تنفيذ العديد من المشاريع الناجحة التي حظيت بإشادة واسعة من العملاء والمجتمع. يشمل ذلك مشروعات تجارية وصناعية وسكنية متكاملة، تمتاز بالجودة العالية والابتكار في التصميم والتنفيذ.",
      valuesTitle: "القيم الأساسية",
      messageTitle: "كلمة الرئيس التنفيذي",
      messageText: "في العزب، نؤمن بأن لكل مشروع قصة فريدة ترويها تفاصيله. نحن هنا لنصنع تلك القصة معًا، من خلال التفاني في العمل والالتزام بالجودة والابتكار في كل ما نقوم به. رؤيتنا تتجاوز مجرد البناء، إنها تتعلق بصنع مساحات تعزز الحياة وتلهم الأجيال القادمة.",
      quote: "في الحياة، إذا قدمت قيمة للآخرين في فترة زمنية أقصر، فسوف تتكافأ وتكافأ جيدًا.",
      contactTitle: "التواصل مع محمد عزب"
    },
    en: {
      title: "Mohamed Azab",
      subtitle: "Founder, CEO and Managing Director of Al-Azab Construction Company",
      about: "Mohamed Azab is an architect and pioneer in the field of real estate development who founded Al-Azab Construction Company, a company that has become a reference in providing integrated architectural and construction solutions. With his passion and creativity, Mohamed was able to build a company that is distinguished by quality and professionalism, and provides distinguished services in the field of construction, equipment, and architectural maintenance.",
      backgroundTitle: "Academic and Professional Background",
      backgroundText: "Mohamed Azab holds a first degree with honors in architecture from the Academy of Professional Life and is a member of the Egyptian Society of Engineers. Mohamed began his career working for major companies in the field of construction, where he gained extensive experience in designing and implementing various architectural projects.",
      visionTitle: "Vision and Mission",
      visionText: "Mohamed Azab's vision is to provide innovative and sustainable architectural solutions that meet the needs of clients and exceed their expectations. He believes that true success can only be achieved through a commitment to quality, transparency, and sustainability in every project. His mission is to transform ideas into tangible reality and create spaces that inspire and positively impact people's lives.",
      achievementsTitle: "Achievements",
      achievementsText: "Under his leadership, Al-Azab Construction has successfully executed many successful projects that have been widely acclaimed by clients and the community. This includes integrated commercial, industrial, and residential projects, characterized by high quality and innovation in design and implementation.",
      valuesTitle: "Core Values",
      messageTitle: "CEO Message",
      messageText: "At Al-Azab, we believe that each project has a unique story to tell. We are here to create that story together, through dedication to work and commitment to quality and innovation in everything we do. Our vision goes beyond just building; it is about creating spaces that enhance lives and inspire future generations.",
      quote: "In life, if you provide value to others in a shorter period of time, you will be rewarded and rewarded well.",
      contactTitle: "Contact Mohamed Azab"
    }
  };

  const values = [
    {
      ar: { title: "الاحترافية", desc: "قيادة فرق العمل بكفاءة لضمان تنفيذ المشاريع بأعلى معايير الجودة" },
      en: { title: "Professionalism", desc: "Leading work teams efficiently to ensure projects are executed with the highest quality standards" },
      icon: Award
    },
    {
      ar: { title: "الجودة", desc: "التزام دائم بتقديم أفضل الحلول الإنشائية والمعمارية" },
      en: { title: "Quality", desc: "A constant commitment to providing the best construction and architectural solutions" },
      icon: Target
    },
    {
      ar: { title: "الشفافية", desc: "بناء علاقات متينة مع العملاء من خلال التواصل الواضح والشفاف" },
      en: { title: "Transparency", desc: "Building strong relationships with clients through clear and transparent communication" },
      icon: Users
    },
    {
      ar: { title: "الاستدامة", desc: "تنفيذ مشاريع تحترم البيئة وتساهم في التنمية المستدامة" },
      en: { title: "Sustainability", desc: "Implementing projects that respect the environment and contribute to sustainable development" },
      icon: Building
    }
  ];

  const currentContent = content[language];

  return (
    <PageLayout>
      <div className={language === 'ar' ? 'arabic-text' : 'english-text'}>
        {/* Header with company logos */}
        <div className="bg-amber-600 text-white p-6 rounded-lg mb-8 flex justify-center items-center">
          <div className="[&_img]:brightness-0 [&_img]:invert">
            <Logo variant="full" linkTo="/" showText={true} className="[&_h1]:text-white [&_p]:text-white/90" />
          </div>
        </div>

        {/* CEO Photo and Basic Info with Language Switch on opposite side */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
          {/* Language Switch - positioned on the left/right opposite to image */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="text-center mb-6">
              <div className="inline-flex rounded-lg border border-gray-200 p-1">
                <Button
                  variant={language === 'ar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('ar')}
                  className="rounded-md bg-amber-600 hover:bg-amber-700"
                >
                  العربية
                </Button>
                <Button
                  variant={language === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLanguage('en')}
                  className="rounded-md bg-amber-600 hover:bg-amber-700"
                >
                  English
                </Button>
              </div>
            </div>
          </div>

          {/* CEO Photo - smaller size */}
          <div className="lg:col-span-1 order-2 lg:order-first">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img 
                  src="https://i.postimg.cc/8JTMcdcN/M-Azab.png" 
                  alt="Mohamed Azab" 
                  className="w-full h-64 object-cover"
                />
              </CardContent>
            </Card>
          </div>
          
          {/* CEO Info */}
          <div className="lg:col-span-2 order-3">
            <h1 className="text-4xl font-bold text-amber-700 mb-4">
              {currentContent.title}
            </h1>
            <h2 className="text-xl text-gray-600 mb-6">
              {currentContent.subtitle}
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {currentContent.about}
            </p>
          </div>
        </div>

        {/* Academic Background */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-amber-700 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6" />
              {currentContent.backgroundTitle}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {currentContent.backgroundText}
            </p>
          </CardContent>
        </Card>

        {/* Vision and Mission */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-amber-700 mb-4 flex items-center gap-2">
              <Target className="w-6 h-6" />
              {currentContent.visionTitle}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {currentContent.visionText}
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-amber-700 mb-4">
              {currentContent.achievementsTitle}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {currentContent.achievementsText}
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-amber-700 mb-6 text-center">
            {currentContent.valuesTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const ValueIcon = value.icon;
              const valueContent = value[language];
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-100 p-3 rounded-full">
                        <ValueIcon className="w-6 h-6 text-amber-700" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-amber-700">
                          {valueContent.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {valueContent.desc}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CEO Message */}
        <Card className="mb-8 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">
              {currentContent.messageTitle}
            </h3>
            <p className="leading-relaxed text-lg mb-4">
              "{currentContent.messageText}"
            </p>
            <p className="italic text-yellow-200 font-medium">
              "{currentContent.quote}"
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-amber-700 mb-6">
              {currentContent.contactTitle}
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-700" />
                <a 
                  href="mailto:mohamed@al-azab.co" 
                  className="text-amber-700 hover:underline"
                >
                  mohamed@al-azab.co
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 p-6 bg-gray-100 rounded-lg text-xs text-gray-600 leading-relaxed">
          <strong>شركة العزب للإنشاءات</strong> شركة تابعة للعلامة التجارية المسجلة D-U-N-S No: 849203826، تعمل تحت الاسم التجاري القانوني "عزب لأعمال الإدارة التنفيذية للمشاريع الصناعية والخدمية والتوريدات العامة". 
          تم إنتاج وتوزيع هذه الرسالة من قبل <strong>شركة العزب</strong> المكتب الرئيسي، العنوان: 8/500 شارع المعادي، القاهرة، مصر الرمز البريدي: 4234570 البريد الإلكتروني: support@al-azab.co الهاتف: 0227047955 الضريبة: 577219804 السجل التجاري: 218670 | 
          شركة العزب للإنشاءات المحدودة أو الشركات التابعة لها. جميع الحقوق محفوظة. اقرأ إشعار الخصوصية الخاص بنا &copy; 2023.
        </div>
      </div>
    </PageLayout>
  );
};

export default CEOPage;
