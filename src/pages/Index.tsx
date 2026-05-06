
import React, { useEffect } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Services from "../components/Services";
import PremiumServices from "../components/PremiumServices";
import Projects from "../components/Projects";
import About from "../components/About";
import CompanyVision from "../components/CompanyVision";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const Index: React.FC = () => {
  // تحسين scroll animation handler
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const elements = document.querySelectorAll('.fade-in-view, .slide-up-view');
          
          elements.forEach((element) => {
            const position = element.getBoundingClientRect();
            
            if (position.top < window.innerHeight - 100) {
              element.classList.add('animated');
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // فحص أولي
    handleScroll();
    
    // إضافة scroll event listener مع passive
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>شركة العزب للمقاولات العامة - خدمات إنشاء وصيانة متميزة</title>
        <meta name="description" content="شركة العزب للمقاولات العامة - رائدة في مجال المقاولات والإنشاءات في المملكة العربية السعودية. نقدم خدمات متميزة في البناء والصيانة والتطوير العقاري." />
        <meta name="keywords" content="مقاولات, إنشاءات, صيانة, السعودية, البناء, التطوير العقاري" />
        <meta property="og:title" content="شركة العزب للمقاولات العامة" />
        <meta property="og:description" content="رائدة في مجال المقاولات والإنشاءات في المملكة العربية السعودية" />
        <meta property="og:type" content="website" />
        <meta property="fb:app_id" content="889346333913449" />
        <meta property="og:image" content="https://alazab.com/alazab-icon.png" />
        <meta property="og:url" content="https://alazab.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://alazab.com/alazab-icon.png" />
        <link rel="canonical" href="https://alazab.com" />
      </Helmet>

      <div className="bg-white min-h-screen" dir="rtl">
        <Header />
        <main className="space-y-0">
          <Hero />
          
          {/* أزرار الخدمات السريعة */}
          <section className="py-12 bg-gradient-to-r from-gray-50 to-gray-100" aria-labelledby="quick-services">
            <div className="container mx-auto px-4">
              <h2 id="quick-services" className="text-2xl font-bold text-center text-construction-primary mb-8">خدمات سريعة</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  className="bg-construction-accent hover:bg-construction-accent/90 text-white py-3 px-6 rounded-md text-lg transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-construction-accent"
                  asChild
                >
                  <Link to="/maintenance-request">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2" aria-hidden="true">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    تقديم طلب صيانة
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  className="bg-white border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white py-3 px-6 rounded-md text-lg transition-all duration-200 hover:scale-105"
                  asChild
                >
                  <a href="https://erp.alazab.com/apps" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                    نظام ERP الإداري
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </Button>
              </div>
            </div>
          </section>
          
          <PremiumServices />
          <Services />
          <Projects />
          <About />
          <CompanyVision />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
