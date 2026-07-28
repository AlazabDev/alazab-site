import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, PhoneCall, Home } from 'lucide-react';

const UberFixSubscriptionComplete: React.FC = () => {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-grow flex items-center justify-center py-24 px-4 pt-32">
        <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-teal-500 text-center">
          <CardContent className="pt-10 pb-8 px-6">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-teal-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              تم استلام طلبك بنجاح!
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              شكراً لاختيارك باقات صيانة UberFix. فريقنا يقوم حالياً بمراجعة طلبك وسنتواصل معك في أقرب وقت لإتمام إجراءات التعاقد.
            </p>

            <div className="bg-blue-50 p-4 rounded-xl mb-8 inline-flex items-center gap-3 text-blue-800">
              <PhoneCall className="w-5 h-5" />
              <span>هل لديك استفسار عاجل؟ اتصل بنا على: <strong>16000</strong></span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full">
                <Link to="/services">
                  تصفح المزيد من الخدمات
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  العودة للرئيسية
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default UberFixSubscriptionComplete;
