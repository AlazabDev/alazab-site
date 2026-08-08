import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AuthCard from './AuthCard';
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToReset: () => void;
  onSwitchToWhatsApp?: () => void;
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup, onSwitchToReset, onSwitchToWhatsApp, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error?.message === 'Invalid login credentials' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : (error?.message || 'تعذر إنشاء جلسة تسجيل الدخول'),
          variant: "destructive",
        });
        return;
      }

      toast({ title: "تم تسجيل الدخول بنجاح", description: "مرحباً بك مرة أخرى!" });
      onSuccess();
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء تسجيل الدخول", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      const current = new URL(window.location.href);
      const returnTo = current.searchParams.get('returnTo');
      const callback = new URL('/auth', window.location.origin);
      if (returnTo) callback.searchParams.set('returnTo', returnTo);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callback.toString() },
      });

      if (error) toast({ title: "خطأ في تسجيل الدخول", description: error.message, variant: "destructive" });
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء تسجيل الدخول", variant: "destructive" });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <AuthCard title="تسجيل الدخول">
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="pr-10" dir="ltr" placeholder="example@email.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="pr-10" dir="ltr" placeholder="••••••••" />
            </div>
          </div>

          <div className="text-left">
            <button type="button" onClick={onSwitchToReset} className="text-sm text-primary hover:underline">نسيت كلمة المرور؟</button>
          </div>

          <Button type="submit" className="w-full bg-construction-primary hover:bg-construction-secondary text-white h-11" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جارٍ تسجيل الدخول...</> : "تسجيل الدخول"}
          </Button>

          <div className="text-center">
            <span className="text-sm text-muted-foreground">ليس لديك حساب؟ </span>
            <button type="button" onClick={onSwitchToSignup} className="text-sm text-primary hover:underline font-medium">إنشاء حساب جديد</button>
          </div>
        </form>

        {onSwitchToWhatsApp && (
          <Button type="button" variant="outline" onClick={onSwitchToWhatsApp} className="w-full h-11">تسجيل الدخول عبر واتساب</Button>
        )}
      </div>
    </AuthCard>
  );
};

export default LoginForm;
