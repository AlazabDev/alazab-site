import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AuthCard from './AuthCard';
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import { AUTH_PASSWORD_MIN_LENGTH, validateAuthPassword } from '@/lib/auth-password';

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSwitchToLogin, onSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      const redirect = new URL('/auth', window.location.origin);
      if (returnTo) redirect.searchParams.set('returnTo', returnTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirect.toString() },
      });
      if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء التسجيل", variant: "destructive" });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "خطأ في كلمة المرور", description: "كلمة المرور وتأكيد كلمة المرور غير متطابقتين", variant: "destructive" });
      return;
    }

    const passwordError = validateAuthPassword(formData.password);
    if (passwordError) {
      toast({ title: "كلمة المرور غير مطابقة للسياسة", description: passwordError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { name: formData.name.trim() },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) {
        toast({ title: "خطأ في إنشاء الحساب", description: error.message, variant: "destructive" });
        return;
      }

      if (data.session) {
        toast({ title: "تم إنشاء الحساب بنجاح", description: "تم تسجيل الدخول" });
        onSuccess();
        return;
      }

      toast({
        title: "تم إنشاء الحساب",
        description: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني. أكد البريد ثم سجّل الدخول.",
      });
      onSwitchToLogin();
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء إنشاء الحساب", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="إنشاء حساب جديد">
      <div className="space-y-4" dir="rtl">
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => handleSocialLogin('google')} disabled={!!socialLoading} className="w-full h-11">
            {socialLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Google'}
          </Button>
          <Button type="button" variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={!!socialLoading} className="w-full h-11">
            {socialLoading === 'facebook' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Facebook'}
          </Button>
        </div>

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">أو بالبريد الإلكتروني</span>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required autoComplete="name" className="pr-10" placeholder="الاسم الكامل" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" className="pr-10" dir="ltr" placeholder="example@email.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" className="pr-10" dir="ltr" placeholder="8+ أحرف: كبير، صغير، رقم، رمز" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" className="pr-10" dir="ltr" placeholder="أعد كتابة كلمة المرور" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-construction-primary hover:bg-construction-secondary text-white h-11" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جارٍ إنشاء الحساب...</> : "إنشاء حساب"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">لديك حساب بالفعل؟ </span>
            <button type="button" onClick={onSwitchToLogin} className="text-sm text-primary hover:underline font-medium">تسجيل الدخول</button>
          </div>
        </form>
      </div>
    </AuthCard>
  );
};

export default SignupForm;
