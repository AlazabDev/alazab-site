import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const WA_NUMBER = '201004006620';

interface Props {
  open: boolean;
  onClose: () => void;
}

const WhatsAppQuickReplies: React.FC<Props> = ({ open, onClose }) => {
  const { language, isRTL } = useLanguage();

  const replies = language === 'ar'
    ? [
        'أرغب في طلب عرض سعر للتشطيب الفاخر',
        'أحتاج خدمة صيانة سريعة لفرعي',
        'أريد الاستفسار عن خدمات إدارة المرافق',
        'أبحث عن مورد أثاث ومستلزمات للمكتب',
        'أحتاج تصميم هوية بصرية لمشروعي',
        'كم يستغرق تنفيذ المشروع عادةً؟',
      ]
    : [
        'I want a quote for luxury finishing',
        'I need urgent maintenance for my branch',
        'Tell me about facility management services',
        'I need an office furniture supplier',
        'I need a brand identity for my project',
        'How long does a typical project take?',
      ];

  const send = (text: string) => {
    const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(href, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
          />
          <motion.div
            dir={isRTL ? 'rtl' : 'ltr'}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full md:w-[28rem] z-[71] bg-background border border-border rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-[#25D366] text-white">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {language === 'ar' ? 'تواصل سريع' : 'Quick Chat'}
                  </h3>
                  <p className="text-xs flex items-center gap-1 opacity-90">
                    <Clock className="w-3 h-3" />
                    {language === 'ar' ? 'الرد خلال 5 دقائق عادةً' : 'Usually replies in 5 min'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'ar'
                  ? 'اختر رسالة جاهزة لتبدأ المحادثة فوراً:'
                  : 'Pick a ready message to start chatting instantly:'}
              </p>
              {replies.map((text) => (
                <button
                  key={text}
                  onClick={() => send(text)}
                  className="w-full text-start p-3 rounded-2xl bg-muted hover:bg-[#25D366]/10 hover:border-[#25D366] border border-transparent text-sm font-medium text-foreground transition-all"
                >
                  {text}
                </button>
              ))}
              <button
                onClick={() => send(language === 'ar' ? 'مرحباً' : 'Hello')}
                className="w-full mt-2 p-3 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                {language === 'ar' ? 'بدء محادثة جديدة' : 'Start new chat'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppQuickReplies;
