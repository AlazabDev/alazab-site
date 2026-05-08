import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('العودة للأعلى', 'Scroll to top')}
      className="fixed bottom-24 left-4 z-40 h-11 w-11 rounded-full bg-construction-primary text-white shadow-lg hover:bg-construction-accent hover:text-construction-primary transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-construction-accent"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;
