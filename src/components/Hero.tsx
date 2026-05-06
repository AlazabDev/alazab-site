
import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <div className="relative bg-gray-900 min-h-screen flex items-center" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2370&auto=format&fit=crop')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.3)"
        }}
      ></div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {t(
              <>أربعة مسارات متكاملة.. <span className="text-construction-accent">لبناء مساحات استثنائية</span></>,
              <>Four Integrated Pathways... <span className="text-construction-accent">To Build Exceptional Spaces.</span></>
            )}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            {t(
              'شركة العزب (Alazab)، ومن خلال أربعة خطوط إنتاج متخصصة، تقدم حلولاً شاملة لا مثيل لها. خبرتنا تمتد لعقدين من الزمن، وتتجلى اليوم في: التشطيب الراقي للوحدات السكنية، هوية العلامة التجارية للمحلات التجارية الكبرى، UberFix للصيانة المعمارية المتطورة، و Laban Alasfour لتوفير أصعب الخامات.',
              'Alazab, through four specialized production lines, offers unparalleled comprehensive solutions. Our expertise spans two decades and is now embodied in: Luxury Finishing for residential units, Brand Identity for major retail outlets, UberFix for advanced architectural maintenance, and Laban Alasfour for sourcing the rarest materials.'
            )}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-construction-accent hover:bg-construction-accent/90 text-white text-base px-6 py-3" asChild>
              <Link to="/contact">{t('تواصل معنا', 'Contact Us')}</Link>
            </Button>
            <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 text-base px-6 py-3" asChild>
              <Link to="/projects">{t('مشاريعنا', 'Our Projects')}</Link>
            </Button>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-construction-accent">+300</div>
              <div className="text-sm md:text-base text-white">{t('مشروع منجز', 'Completed Projects')}</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-construction-accent">20+</div>
              <div className="text-sm md:text-base text-white">{t('سنوات خبرة', 'Years of Experience')}</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-construction-accent">4</div>
              <div className="text-sm md:text-base text-white">{t('خطوط إنتاج', 'Production Lines')}</div>
            </div>
            <div className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="text-2xl md:text-3xl font-bold text-construction-accent">50+</div>
              <div className="text-sm md:text-base text-white">{t('خبير متخصص', 'Expert Specialists')}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Down Arrow */}
      <a 
        href="#premium-services" 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white animate-bounce"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </a>
    </div>
  );
};

export default Hero;
