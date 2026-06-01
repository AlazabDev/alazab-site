import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calculator, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import WhatsAppQuickReplies from './WhatsAppQuickReplies';

/**
 * Mobile-only sticky bottom CTA.
 * Appears after the user scrolls past ~40% of the page.
 * Hidden on auth/admin/dashboard routes to avoid clutter.
 */
const StickyMobileCTA: React.FC = () => {
  const { isRTL, language } = useLanguage();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [waOpen, setWaOpen] = useState(false);

  const hiddenRoutes = ['/auth', '/admin', '/dashboard', '/profile', '/settings', '/reset-password'];
  const shouldHide = hiddenRoutes.some((r) => location.pathname.startsWith(r));

  useEffect(() => {
    if (shouldHide) return;
    const onScroll = () => {
      const scrolled = window.scrollY;
      const threshold = Math.max(300, window.innerHeight * 0.4);
      setVisible(scrolled > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [shouldHide]);

  if (shouldHide) return null;

  const labels = {
    quote: language === 'ar' ? 'احسب التكلفة' : 'Get Quote',
    whatsapp: language === 'ar' ? 'واتساب' : 'WhatsApp',
  };

  return (
    <>
      <div
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-2 pointer-events-none transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <div className="pointer-events-auto flex gap-2 bg-background/95 backdrop-blur-md border border-border rounded-full shadow-2xl p-1.5">
          <Link
            to="/cost-calculator"
            className="flex-1 flex items-center justify-center gap-2 bg-construction-primary hover:bg-construction-primary/90 text-construction-primary-foreground font-semibold text-sm py-3 rounded-full transition-colors"
          >
            <Calculator className="h-4 w-4" />
            {labels.quote}
          </Link>
          <button
            type="button"
            onClick={() => setWaOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm py-3 rounded-full transition-colors"
            aria-label={labels.whatsapp}
          >
            <MessageSquare className="h-4 w-4" />
            {labels.whatsapp}
          </button>
        </div>
      </div>
      <WhatsAppQuickReplies open={waOpen} onClose={() => setWaOpen(false)} />
    </>
  );
};

export default StickyMobileCTA;
