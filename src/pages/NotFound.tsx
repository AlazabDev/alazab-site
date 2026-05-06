import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Home, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-lg mx-auto space-y-6">
          {/* Large 404 */}
          <div className="relative">
            <h1 className="text-[10rem] sm:text-[12rem] font-black leading-none text-primary/10 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-16 h-16 text-primary/40 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t('الصفحة غير موجودة', 'Page Not Found')}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t(
              'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها. يمكنك العودة للصفحة الرئيسية.',
              "Sorry, the page you're looking for doesn't exist or has been moved. You can return to the homepage."
            )}
          </p>

          <div className="text-sm text-muted-foreground/60 bg-muted/50 rounded-lg px-4 py-2 inline-block font-mono">
            {location.pathname}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/">
                <Home className="w-4 h-4" />
                {t('الصفحة الرئيسية', 'Homepage')}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/contact">
                <BackArrow className="w-4 h-4" />
                {t('تواصل معنا', 'Contact Us')}
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
