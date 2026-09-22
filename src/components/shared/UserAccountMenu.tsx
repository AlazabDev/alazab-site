import React from 'react';
import { HelpCircle, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UserAvatar from './UserAvatar';

interface UserAccountMenuProps {
  showIdentity?: boolean;
}

const UserAccountMenu: React.FC<UserAccountMenuProps> = ({ showIdentity = false }) => {
  const { language, t } = useLanguage();
  const { profile, roleLabel } = useUserProfile();
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: t('تعذر تسجيل الخروج', 'Unable to sign out'), description: error.message, variant: 'destructive' });
      return;
    }
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-w-0 items-center gap-2 rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-construction-accent focus-visible:ring-offset-2"
          aria-label={t('فتح قائمة الحساب', 'Open account menu')}
          title={profile?.fullName || t('الحساب', 'Account')}
        >
          <UserAvatar className="h-9 w-9 border-2 border-construction-primary shadow-sm" />
          {showIdentity && (
            <div className="hidden min-w-0 text-start md:block">
              <p className="max-w-44 truncate text-sm font-medium">{profile?.fullName || t('المستخدم', 'User')}</p>
              <p className="max-w-44 truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={language === 'ar' ? 'start' : 'end'}
        sideOffset={8}
        className={language === 'ar' ? 'w-64 p-2 text-right' : 'w-64 p-2'}
      >
        <div className="flex items-center gap-3 px-2 py-2.5">
          <UserAvatar className="h-10 w-10 border border-border" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{profile?.fullName || t('المستخدم', 'User')}</p>
            <p className="truncate text-xs text-muted-foreground">{profile?.email || profile?.phone || ''}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="h-4 w-4" />
            <span>{t('الملف الشخصي', 'Profile')}</span>
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
        <DropdownMenuItem onSelect={() => void handleLogout()} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" />
          <span>{t('تسجيل الخروج', 'Sign out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountMenu;
