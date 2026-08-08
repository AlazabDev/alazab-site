import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import { AUTH_PASSWORD_MIN_LENGTH, validateAuthPassword } from '@/lib/auth-password';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const validateRecovery = async (): Promise<void> => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      const hasRecoveryMarker =
        hashParams.get('type') === 'recovery' ||
        urlParams.get('type') === 'recovery' ||
        Boolean(urlParams.get('code')) ||
        Boolean(urlParams.get('token_hash'));

      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;

      if (!session && !hasRecoveryMarker) {
        navigate('/auth', { replace: true });
        return;
      }

      setCheckingRecovery(false);
    };

    void validateRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || session) setCheckingRecovery(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" });
      return;
    }

    const passwordError = validateAuthPassword(password);
    if (passwordError) {
      toast({ title: "كلمة المرور غير مطابقة للسياسة", description: passwordError, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
        return;
      }

      setSuccess(true);
      toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
      window.setTimeout(() => navigate('/auth', { replace: true }), 2000);
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء تحديث كلمة المرور", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-construction-light to-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-construction-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-construction-light to-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">تم تغيير كلمة المرور بنجاح</h2>
            <p className="text-muted-foreground">سيتم تحويلك إلى تسجيل الدخول...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-construction-light to-gray-50 flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-construction-primary">تعيين كلمة مرور جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" className="pr-10" dir="ltr" placeholder="8+ أحرف: كبير، صغير، رقم، رمز" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={AUTH_PASSWORD_MIN_LENGTH} autoComplete="new-password" className="pr-10" dir="ltr" placeholder="أعد كتابة كلمة المرور" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-construction-primary hover:bg-construction-secondary text-white h-11" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جارٍ التحديث...</> : "تحديث كلمة المرور"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
