
import React, { useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet';
import { Facebook, Instagram, MessageCircle, ExternalLink, Heart, Users, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const FacebookPage: React.FC = () => {
  useEffect(() => {
    const win = window as unknown as { FB?: { XFBML: { parse: () => void } } };
    if (win.FB) {
      win.FB.XFBML.parse();
    }
  }, []);

  const platforms = [
    {
      name: 'فيسبوك',
      handle: '@alazab24',
      url: 'https://www.facebook.com/alazab24',
      icon: Facebook,
      color: 'from-[#1877F2] to-[#0d5bbf]',
      bgLight: 'bg-[#1877F2]/10',
      textColor: 'text-[#1877F2]',
      description: 'تابع صفحتنا الرسمية على فيسبوك لآخر المشاريع والعروض والأخبار',
      stats: { label: 'متابع', icon: Users },
    },
    {
      name: 'إنستغرام',
      handle: '@alazab.co',
      url: 'https://www.instagram.com/alazab.co/',
      icon: Instagram,
      color: 'from-[#E4405F] to-[#C13584]',
      bgLight: 'bg-[#E4405F]/10',
      textColor: 'text-[#E4405F]',
      description: 'شاهد معرض أعمالنا ومشاريعنا المميزة على إنستغرام',
      stats: { label: 'إعجاب', icon: Heart },
    },
    {
      name: 'واتساب للأعمال',
      handle: '+201004006620',
      url: 'https://wa.me/c/201004006620',
      icon: MessageCircle,
      color: 'from-[#25D366] to-[#128C7E]',
      bgLight: 'bg-[#25D366]/10',
      textColor: 'text-[#25D366]',
      description: 'تواصل معنا مباشرة عبر واتساب للاستفسارات والحجوزات',
      stats: { label: 'تقييم', icon: Star },
    },
  ];

  return (
    <PageLayout>
      <Helmet>
        <title>العزب | تابعنا على وسائل التواصل الاجتماعي</title>
        <meta name="description" content="تابع شركة العزب للمقاولات والتشطيبات على فيسبوك وإنستغرام وواتساب للأعمال. اكتشف أحدث مشاريعنا وعروضنا." />
        <meta property="og:title" content="العزب | تابعنا على وسائل التواصل الاجتماعي" />
        <meta property="og:description" content="تابع شركة العزب للمقاولات والتشطيبات على فيسبوك وإنستغرام وواتساب." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://alazab.com/facebook" />
        <link rel="canonical" href="https://alazab.com/facebook" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-construction-primary via-construction-dark to-construction-accent opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0djJoLTJ2LTJoMnptMC0yaC0ydi0yaDJ2Mmptlt0gMmgtMnYtMmgydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="relative px-6 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            تواصل معنا على جميع المنصات
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            نحن في شركة العزب نحرص على التواجد حيثما تكونون. تابعونا واستمتعوا بآخر الأخبار والعروض الحصرية
          </p>
          <div className="flex items-center justify-center gap-6">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
              >
                <p.icon className="w-7 h-7 text-white" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {platforms.map((platform) => (
          <Card
            key={platform.name}
            className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
          >
            {/* Gradient Header */}
            <div className={`bg-gradient-to-r ${platform.color} p-6 text-white`}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <platform.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{platform.name}</h3>
                  <p className="text-white/80 text-sm">{platform.handle}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {platform.description}
              </p>

              <Button
                asChild
                className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90 text-white border-0 h-12 text-base font-semibold`}
              >
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {platform.name === 'واتساب للأعمال' ? 'تواصل الآن' : 'تابعنا الآن'}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Facebook Page Embed */}
      <section className="mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          صفحتنا على فيسبوك
        </h2>
        <div className="flex justify-center">
          <div
            className="fb-page"
            data-href="https://www.facebook.com/alazab24"
            data-tabs="timeline,events"
            data-width="500"
            data-height="600"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-muted/50 rounded-2xl p-8 md:p-12 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          هل لديك استفسار أو مشروع؟
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
          فريقنا جاهز لمساعدتك في أي وقت. تواصل معنا الآن عبر واتساب أو زر صفحتنا للتعرف على خدماتنا
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <a href="https://wa.me/c/201004006620" target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 ml-2" />
              تواصل عبر واتساب
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/contact">
              <ArrowLeft className="w-5 h-5 ml-2" />
              صفحة اتصل بنا
            </Link>
          </Button>
        </div>
      </section>
    </PageLayout>
  );
};

export default FacebookPage;
