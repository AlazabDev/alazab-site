
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a recovery session
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    if (type !== 'recovery') {
      // Also check URL params from Supabase redirect
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('code') && !urlParams.get('token_hash')) {
        // No recovery token, redirect to auth
        navigate('/auth', { replace: true });
      }
    }
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "خطأ", description: "كلمات المرور غير متطابقة", variant: "destructive" });
      return;
    }

    if (password.length < 6) {
      toast({ title: "خطأ", description: "يجب أن تكون كلمة المرور 6 أحرف على الأقل", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        setSuccess(true);
        toast({ title: "تم التحديث", description: "تم تغيير كلمة المرور بنجاح" });
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    } catch {
      toast({ title: "خطأ غير متوقع", description: "حدث خطأ أثناء تحديث كلمة المرور", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-construction-light to-gray-50 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">تم تغيير كلمة المرور بنجاح</h2>
            <p className="text-muted-foreground">سيتم تحويلك تلقائياً...</p>
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
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pr-10" dir="ltr" placeholder="6 أحرف على الأقل" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="pr-10" dir="ltr" placeholder="أعد كتابة كلمة المرور" />
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
