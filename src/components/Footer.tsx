import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/logo-alazab-animated.gif';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-b from-construction-primary to-construction-dark text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="العزب للمقاولات" 
                className="h-12 w-auto brightness-0 invert"
              />
              <div>
                <h3 className="text-lg font-bold text-white">العزب</h3>
                <p className="text-xs text-gray-300">للمقاولات المتكاملة</p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 leading-relaxed text-sm">
              شركة رائدة في مجال المقاولات والإنشاءات، نقدم خدمات متكاملة بأعلى معايير الجودة والاحترافية.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <div className="text-center">
                <div className="text-xl font-bold text-construction-accent">20+</div>
                <div className="text-xs">سنة خبرة</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-construction-accent">500+</div>
                <div className="text-xs">مشروع</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-construction-accent">100+</div>
                <div className="text-xs">عميل</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white border-b border-construction-accent/30 pb-2">روابط سريعة</h3>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'الرئيسية' },
                { to: '/about', label: 'من نحن' },
                { to: '/services', label: 'خدماتنا' },
                { to: '/projects', label: 'مشاريعنا' },
                { to: '/brands', label: 'علاماتنا التجارية' },
                { to: '/knowledge', label: 'قاعدة المعرفة' },
                { to: '/blogs', label: 'المدونة' },
                { to: '/guidance', label: 'الأدلة العملية' },
                { to: '/faq', label: 'الأسئلة الشائعة' },
                { to: '/contact', label: 'اتصل بنا' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-gray-300 hover:text-construction-accent transition-colors duration-300 text-sm flex items-center gap-2"
                  >
                    <span className="text-construction-accent">←</span>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a 
                  href="https://erp.alaza.cloud/apps" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-300 hover:text-construction-accent transition-colors duration-300 text-sm flex items-center gap-2"
                >
                  <span className="text-construction-accent">←</span>
                  نظام ERP الإداري
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white border-b border-construction-accent/30 pb-2">خدماتنا</h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              {[
                { to: '/services/luxury-finishing', label: 'التشطيب الراقي' },
                { to: '/services/brand-identity', label: 'هوية العلامة التجارية' },
                { to: '/services/uberfix', label: 'أوبرفيكس - الصيانة المعمارية' },
                { to: '/services/laban-alasfour', label: 'لبن العصفور - التوريدات' },
              ].map((service) => (
                <li key={service.to}>
                  <Link to={service.to} className="flex items-center gap-2 hover:text-construction-accent transition-colors">
                    <span className="w-1.5 h-1.5 bg-construction-accent rounded-full shrink-0"></span>
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-5 text-white border-b border-construction-accent/30 pb-2">معلومات الاتصال</h3>
            <div className="space-y-4 text-sm">
              {[
                { title: 'المقر الرئيسي - القاهرة', address: 'مصر، القاهرة، المعادي', phone: '201004006620+' },
                { title: 'فرع الدقهلية - نبروه', address: 'مصر، الدقهلية، مدينة نبروه', phone: '201014536600+' },
                { title: 'فرع الإسكندرية', address: 'مصر، الإسكندرية، سموحة', phone: '201004006620+' },
              ].map((branch) => (
                <div key={branch.title} className="bg-white/5 rounded-lg p-3">
                  <p className="font-medium text-white text-xs mb-1">{branch.title}</p>
                  <p className="text-gray-400 text-xs">{branch.address}</p>
                  <p className="text-construction-accent text-xs mt-1" dir="ltr">{branch.phone}</p>
                </div>
              ))}
              
              <div className="pt-2 space-y-2">
                <a href="mailto:support@al-azab.co" className="text-gray-300 hover:text-construction-accent transition-colors flex items-center gap-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  support@al-azab.co
                </a>
                <a href="https://al-azab.co" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-construction-accent transition-colors flex items-center gap-2 text-xs">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  al-azab.co
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-white/10 pt-8 mt-10">
          <h3 className="text-sm font-bold mb-4 text-white/80 text-center">الصفحات القانونية</h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-400">
            {[
              { to: '/privacy-policy', label: 'سياسة الخصوصية' },
              { to: '/terms-of-service', label: 'الشروط والأحكام' },
              { to: '/cookie-policy', label: 'سياسة الكوكيز' },
              { to: '/data-deletion', label: 'حذف البيانات' },
              { to: '/refund-policy', label: 'الاسترداد والإلغاء' },
              { to: '/acceptable-use', label: 'الاستخدام المقبول' },
              { to: '/disclaimer', label: 'إخلاء المسؤولية' },
              { to: '/security', label: 'الأمان' },
              { to: '/legal-contact', label: 'الاتصال القانوني' },
            ].map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-construction-accent transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <hr className="border-white/10 my-6" />

        {/* Copyright */}
        <div className="text-center text-gray-400 text-xs">
          <p className="mb-2">
            جميع الحقوق محفوظة © {new Date().getFullYear()} شركة العزب للمقاولات
          </p>
          <p className="leading-relaxed max-w-2xl mx-auto opacity-70">
            شركة العزب للإنشاءات تعمل تحت العلامة التجارية المسجلة D-U-N-S No: 849203826
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
