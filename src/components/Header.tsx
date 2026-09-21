
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Globe, ChevronDown, User, Settings, HelpCircle, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import Logo from "@/components/shared/Logo";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdvancedSidebar } from './layout/AdvancedSidebar';
import ThemeToggle from './shared/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();

  const userMetadata = user?.user_metadata ?? {};
  const displayName =
    [userMetadata.full_name, userMetadata.name, userMetadata.display_name]
      .find((value) => typeof value === 'string' && value.trim().length > 0)
      ?.trim() ||
    user?.email?.split('@')[0] ||
    user?.phone ||
    t('المستخدم', 'User');

  const avatarUrl =
    [userMetadata.avatar_url, userMetadata.picture, userMetadata.photo_url, userMetadata.image]
      .find((value) => typeof value === 'string' && value.trim().length > 0)
      ?.trim() || '';

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
    }
    return (parts[0] || 'U').slice(0, 2).toUpperCase();
  };

  const userInitials = getInitials(displayName);

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: t('تعذر تسجيل الخروج', 'Unable to sign out'),
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('تم تسجيل الخروج', 'Signed out'),
      description: t('تم إنهاء جلسة حسابك بنجاح', 'Your account session has been closed successfully'),
    });
    navigate('/');
  };

  const productionLines = [
    { 
      name: t('التشطيب الراقي (Luxury Finishing)', 'Luxury Finishing'), 
      href: '/services/luxury-finishing' 
    },
    { 
      name: t('هوية العلامة التجارية (Brand Identity)', 'Brand Identity'), 
      href: '/services/brand-identity' 
    },
    { 
      name: t('أوبرفيكس (UberFix) - حلول الصيانة المعمارية', 'UberFix - Architectural Maintenance'), 
      href: '/services/uberfix' 
    },
    { 
      name: t('لبن العصفور (Laban Alasfour) - توريدات الخامات', 'Laban Alasfour - Raw Materials Supply'), 
      href: '/services/laban-alasfour' 
    },
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
    <header className="bg-white shadow-md fixed top-0 w-full z-50" role="banner">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="full" showText={true} className="hidden md:flex" />
            <Logo variant="icon" showText={false} className="md:hidden" />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4" role="navigation" aria-label={t('التنقل الرئيسي', 'Main Navigation')}>
            {navigationItems.map((item) => (
              item.isDropdown ? (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`text-base font-medium transition-colors hover:text-construction-accent focus:outline-none focus:ring-2 focus:ring-construction-accent rounded px-2 py-1 whitespace-nowrap flex items-center gap-1 ${
                        isActive(item.href) 
                          ? 'text-construction-accent' 
                          : 'text-gray-700'
                      }`}
                    >
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-72">
                    {productionLines.map((line) => (
                      <DropdownMenuItem key={line.href} asChild>
                        <Link 
                          to={line.href}
                          className="cursor-pointer text-sm py-3 px-4"
                        >
                          {line.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-base font-medium transition-colors hover:text-construction-accent focus:outline-none focus:ring-2 focus:ring-construction-accent rounded px-2 py-1 whitespace-nowrap ${
                    isActive(item.href) 
                      ? 'text-construction-accent border-b-2 border-construction-accent pb-1' 
                      : 'text-gray-700'
                  }`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              )
            ))}
          </nav>

          {/* CTA Buttons and Sidebar Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1 text-xs font-semibold"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
              {language === 'ar' ? 'EN' : 'عربي'}
            </Button>

            {/* ERP Link - Hidden on Mobile */}
            <a
              href="https://erp.alaza.cloud/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex h-10 min-w-14 items-center justify-center rounded-xl border-2 border-construction-primary bg-construction-accent px-3 text-sm font-extrabold tracking-wide text-construction-primary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              aria-label={t('فتح نظام ERP', 'Open ERP')}
              title={t('نظام ERP', 'ERP System')}
            >
              ERP
            </a>

            {/* Advanced Sidebar Toggle */}
            {isMobile ? (
              <Drawer open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <DrawerTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white"
                    aria-label={t('فتح القائمة الجانبية', 'Open sidebar')}
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh]">
                  <AdvancedSidebar onClose={() => setIsSidebarOpen(false)} />
                </DrawerContent>
              </Drawer>
            ) : (
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white"
                    aria-label={t('فتح القائمة الجانبية', 'Open sidebar')}
                  >
                    <Menu className="h-5 w-5" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0">
                  <AdvancedSidebar onClose={() => setIsSidebarOpen(false)} />
                </SheetContent>
              </Sheet>
            )}

            {/* Login Button */}
            <div className="hidden md:flex">
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  className="border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white focus:ring-2 focus:ring-construction-primary"
                >
                  {t('تسجيل الدخول', 'Login')}
                </Button>
              </Link>
            </div>

            {/* Authenticated Account Menu */}
            {user && (
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-construction-accent focus-visible:ring-offset-2"
                      aria-label={t('فتح قائمة الحساب', 'Open account menu')}
                      title={displayName}
                    >
                      <Avatar className="h-10 w-10 border-2 border-construction-primary shadow-sm">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                        <AvatarFallback className="bg-construction-accent text-sm font-bold text-construction-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="start"
                    sideOffset={8}
                    className="w-64 p-2"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <div className="flex items-center gap-3 px-2 py-2.5">
                      <Avatar className="h-9 w-9 border border-border">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
                        <AvatarFallback className="bg-construction-accent text-xs font-bold text-construction-primary">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email || user.phone || ''}
                        </p>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="h-4 w-4" />
                        <span>{t('ملف التعريف', 'Profile')}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="cursor-pointer">
                        <Settings className="h-4 w-4" />
                        <span>{t('الإعدادات', 'Settings')}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to="/contact" className="cursor-pointer">
                        <HelpCircle className="h-4 w-4" />
                        <span>{t('المساعدة', 'Help')}</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onSelect={() => void handleLogout()}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('تسجيل الخروج', 'Sign out')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden"
                aria-label={isMenuOpen ? t('إغلاق القائمة', 'Close menu') : t('فتح القائمة', 'Open menu')}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side={language === 'ar' ? 'right' : 'left'} className="w-80">
              <nav className="flex flex-col gap-4 mt-6" role="navigation" aria-label={t('التنقل المتنقل', 'Mobile navigation')}>
                {navigationItems.map((item) => (
                  item.isDropdown ? (
                    <div key={item.name}>
                      <button
                        onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                        className={`w-full text-lg font-medium transition-colors hover:text-construction-accent flex items-center justify-between px-2 py-1 ${
                          isActive(item.href) ? 'text-construction-accent' : 'text-gray-700'
                        }`}
                      >
                        {item.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${mobileProductsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {mobileProductsOpen && (
                        <div className="mt-2 space-y-2 ps-4">
                          {productionLines.map((line) => (
                            <Link
                              key={line.href}
                              to={line.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="block text-sm text-gray-600 hover:text-construction-accent py-2 px-2 rounded transition-colors"
                            >
                              {line.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-construction-accent px-2 py-1 ${
                        isActive(item.href) ? 'text-construction-accent' : 'text-gray-700'
                      }`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  )
                ))}
                
                <div className="border-t pt-6 space-y-3">
                  <Link to="/maintenance-request" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-construction-primary hover:bg-construction-dark text-white">
                      {t('طلب صيانة', 'Request Maintenance')}
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white">
                      {t('تسجيل الدخول', 'Login')}
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
