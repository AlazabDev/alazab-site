import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Globe, ChevronDown, Settings, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import Logo from '@/components/shared/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdvancedSidebar } from './layout/AdvancedSidebar';
import ThemeToggle from './shared/ThemeToggle';
import UserAccountMenu from './shared/UserAccountMenu';
import { useAuth } from '@/hooks/useAuth';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  const productionLines = [
    { name: t('التشطيب الراقي (Luxury Finishing)', 'Luxury Finishing'), href: '/services/luxury-finishing' },
    { name: t('هوية العلامة التجارية (Brand Identity)', 'Brand Identity'), href: '/services/brand-identity' },
    { name: t('أوبرفيكس (UberFix) - حلول الصيانة المعمارية', 'UberFix - Architectural Maintenance'), href: '/services/uberfix' },
    { name: t('لبن العصفور (Laban Alasfour) - توريدات الخامات', 'Laban Alasfour - Raw Materials Supply'), href: '/services/laban-alasfour' },
  ];

  const navigationItems = [
    { name: t('الرئيسية', 'Home'), href: '/' },
    { name: t('من نحن', 'About Us'), href: '/about' },
    { name: t('خدماتنا', 'Our Services'), href: '#', isDropdown: true },
    { name: t('خدمات الصيانة', 'Maintenance Services'), href: '/maintenance-services' },
    { name: t('مشاريعنا', 'Projects'), href: '/projects' },
    { name: t('اتصل بنا', 'Contact Us'), href: '/contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    if (href === '#') return location.pathname.startsWith('/services/');
    return location.pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-white shadow-md dark:bg-background" role="banner">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-2 md:h-20">
          <div className="min-w-0 shrink-0">
            <Logo variant="full" showText className="hidden lg:flex" />
            <Logo variant="icon" showText={false} className="lg:hidden" />
          </div>

          <nav className="hidden items-center gap-2 xl:flex 2xl:gap-4" aria-label={t('التنقل الرئيسي', 'Main Navigation')}>
            {navigationItems.map((item) => item.isDropdown ? (
              <DropdownMenu key={item.name}>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1 whitespace-nowrap rounded px-2 py-1 text-sm font-medium transition-colors hover:text-construction-accent focus:outline-none focus:ring-2 focus:ring-construction-accent 2xl:text-base ${isActive(item.href) ? 'text-construction-accent' : 'text-gray-700 dark:text-foreground'}`}>
                    {item.name}<ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-72">
                  {productionLines.map((line) => <DropdownMenuItem key={line.href} asChild><Link to={line.href} className="cursor-pointer px-4 py-3 text-sm">{line.name}</Link></DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link key={item.name} to={item.href} className={`whitespace-nowrap rounded px-2 py-1 text-sm font-medium transition-colors hover:text-construction-accent focus:outline-none focus:ring-2 focus:ring-construction-accent 2xl:text-base ${isActive(item.href) ? 'border-b-2 border-construction-accent text-construction-accent' : 'text-gray-700 dark:text-foreground'}`}>
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex min-w-0 items-center gap-1 sm:gap-2 lg:gap-3">
            <div className="hidden sm:block"><ThemeToggle /></div>
            <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} className="h-9 px-2 text-xs font-semibold" aria-label={t('تغيير اللغة', 'Switch language')}>
              <Globe className="h-4 w-4 sm:me-1" /><span className="hidden sm:inline">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </Button>

            <a href="https://erp.alaza.cloud/apps" target="_blank" rel="noopener noreferrer" className="hidden h-10 items-center justify-center rounded-xl border-2 border-construction-primary bg-construction-accent px-3 text-sm font-extrabold text-construction-primary 2xl:flex">ERP</a>

            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="hidden border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white lg:inline-flex" aria-label={t('فتح القائمة الجانبية', 'Open sidebar')}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-80 p-0"><AdvancedSidebar onClose={() => setIsSidebarOpen(false)} /></SheetContent>
            </Sheet>

            {!user && (
              <Link to="/auth" className="hidden lg:block">
                <Button variant="outline" className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white">{t('تسجيل الدخول', 'Login')}</Button>
              </Link>
            )}

            {user && <UserAccountMenu />}

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden" aria-label={isMenuOpen ? t('إغلاق القائمة', 'Close menu') : t('فتح القائمة', 'Open menu')}>
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-[88vw] max-w-80">
                <nav className="mt-6 flex flex-col gap-3" aria-label={t('التنقل المتنقل', 'Mobile navigation')}>
                  {navigationItems.map((item) => item.isDropdown ? (
                    <div key={item.name}>
                      <button type="button" onClick={() => setMobileProductsOpen((open) => !open)} className={`flex w-full items-center justify-between px-2 py-2 text-lg font-medium ${isActive(item.href) ? 'text-construction-accent' : 'text-gray-700 dark:text-foreground'}`}>
                        {item.name}<ChevronDown className={`h-4 w-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileProductsOpen && <div className="mt-1 space-y-1 ps-4">{productionLines.map((line) => <Link key={line.href} to={line.href} onClick={() => setIsMenuOpen(false)} className="block rounded px-2 py-2 text-sm text-muted-foreground hover:text-construction-accent">{line.name}</Link>)}</div>}
                    </div>
                  ) : (
                    <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)} className={`px-2 py-2 text-lg font-medium ${isActive(item.href) ? 'text-construction-accent' : 'text-gray-700 dark:text-foreground'}`}>{item.name}</Link>
                  ))}

                  <div className="mt-3 space-y-2 border-t pt-5">
                    <Link to="/maintenance-request" onClick={() => setIsMenuOpen(false)}><Button className="w-full">طلب صيانة</Button></Link>
                    {user ? (
                      <>
                        <Link to="/profile" onClick={() => setIsMenuOpen(false)}><Button variant="outline" className="w-full"><User className="me-2 h-4 w-4" />الملف الشخصي</Button></Link>
                        <Link to="/settings" onClick={() => setIsMenuOpen(false)}><Button variant="outline" className="w-full"><Settings className="me-2 h-4 w-4" />الإعدادات</Button></Link>
                      </>
                    ) : (
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}><Button variant="outline" className="w-full">{t('تسجيل الدخول', 'Login')}</Button></Link>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
