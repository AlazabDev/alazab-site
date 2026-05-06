
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AuthCard from './AuthCard';

interface ResetPasswordFormProps {
  onSwitchToLogin: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: "خطأ في إرسال رابط الاستعادة",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "تم الإرسال بنجاح",
          description: "تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ أثناء إرسال رابط الاستعادة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="استعادة كلمة المرور">
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-right"
            dir="ltr"
            placeholder="أدخل بريدك الإلكتروني"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-construction-primary hover:bg-construction-secondary text-white"
          disabled={loading}
        >
          {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-construction-primary hover:underline"
          >
            العودة إلى تسجيل الدخول
          </button>
        </div>
      </form>
    </AuthCard>
  );
};

export default ResetPasswordForm;
