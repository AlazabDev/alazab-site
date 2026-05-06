
import React, { useEffect } from 'react';
import Header from "../Header";
import Footer from "../Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  // إضافة تأثيرات الظهور عند التمرير
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in-view, .slide-up-view');
      
      elements.forEach((element) => {
        const position = element.getBoundingClientRect();
        
        // التحقق من وجود العنصر في نطاق العرض
        if (position.top < window.innerHeight - 100) {
          element.classList.add('animated');
        }
      });
    };
    
    // فحص أولي
    handleScroll();
    
    // إضافة مستمع للتمرير
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <Header />
      <main className="pt-16 md:pt-24">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="max-w-7xl mx-auto">
            {title && (
              <h1 className="text-3xl md:text-4xl font-bold text-center text-construction-primary mb-8 md:mb-12 fade-in-view">
                {title}
              </h1>
            )}
            <div className="fade-in-view">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PageLayout;
