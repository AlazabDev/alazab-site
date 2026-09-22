import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Globe2, Key, Moon, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const updatePassword = async (): Promise<void> => {
    if (password.length < 8) {
      toast({ title: 'كلمة المرور قصيرة', description: 'استخدم 8 أحرف على الأقل.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'كلمتا المرور غير متطابقتين', variant: 'destructive' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmPassword('');
      toast({ title: 'تم تحديث كلمة المرور' });
    } catch (error) {
      toast({
        title: 'تعذر تحديث كلمة المرور',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الإعدادات</h2>
          <p className="text-muted-foreground">إعدادات فعالة فقط؛ تم حذف عناصر النسخ الاحتياطي والإشعارات الوهمية.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5" />المظهر واللغة</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="arabic-language">اللغة العربية</Label>
                <Switch id="arabic-language" checked={language === 'ar'} onCheckedChange={(checked) => setLanguage(checked ? 'ar' : 'en')} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dark-mode" className="flex items-center gap-2"><Moon className="h-4 w-4" />الوضع الداكن</Label>
                <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" />تغيير كلمة المرور</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <Button className="w-full" onClick={() => void updatePassword()} disabled={savingPassword}>
                {savingPassword ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />بيانات الحساب</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">الاسم والصورة والهاتف والعنوان تتم إدارتها من الملف الشخصي الموحد.</p>
              <Button variant="outline" asChild><Link to="/profile">فتح الملف الشخصي</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
