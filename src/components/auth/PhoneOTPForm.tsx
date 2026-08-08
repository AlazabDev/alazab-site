import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import AuthCard from './AuthCard';
import { Loader2, Phone } from 'lucide-react';

interface PhoneOTPFormProps {
  onSwitchToEmail: () => void;
  onSwitchToWhatsApp: () => void;
  onSuccess: () => void;
}

type Step = 'phone' | 'otp';

const normalizeEgyptPhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '');
  let national = digits;

  if (national.startsWith('0020')) national = national.slice(4);
  if (national.startsWith('20')) national = national.slice(2);
  if (national.startsWith('0')) national = national.slice(1);

  if (!/^1[0125]\d{8}$/.test(national)) return null;
  return `+20${national}`;
};

const PhoneOTPForm: React.FC<PhoneOTPFormProps> = ({ onSwitchToEmail, onSwitchToWhatsApp, onSuccess }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeEgyptPhone(phone);

    if (!normalizedPhone) {
      toast({ title: 'رقم غير صالح', description: 'أدخل رقم موبايل مصري صحيح مثل 01012345678', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: { shouldCreateUser: true },
      });

      if (error) {
        toast({ title: 'تعذر إرسال كود الهاتف', description: error.message, variant: 'destructive' });
        return;
      }

      setPhone(normalizedPhone);
      setStep('otp');
      toast({ title: 'تم إرسال الكود', description: 'أدخل رمز التحقق المرسل عبر SMS' });
    } catch {
      toast({ title: 'خطأ غير متوقع', description: 'تعذر إرسال رمز التحقق', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast({ title: 'كود غير صالح', description: 'رمز التحقق يجب أن يكون 6 أرقام', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error || !data.session) {
        toast({ title: 'فشل التحقق', description: error?.message || 'تعذر إنشاء جلسة تسجيل الدخول', variant: 'destructive' });
        return;
      }

      toast({ title: 'تم تسجيل الدخول', description: 'تم التحقق من رقم الهاتف بنجاح' });
      onSuccess();
    } catch {
      toast({ title: 'خطأ غير متوقع', description: 'تعذر التحقق من الرمز', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="تسجيل الدخول بالهاتف">
      <div className="space-y-4" dir="rtl">
        {step === 'phone' ? (
          <form onSubmit={handleSend} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auth-phone">رقم الهاتف</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="auth-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="pr-10"
                  dir="ltr"
                  placeholder="01012345678"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جارٍ الإرسال...</> : 'إرسال كود SMS'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground" dir="ltr">{phone}</p>
            <div className="space-y-2">
              <Label htmlFor="phone-otp">رمز التحقق</Label>
              <Input
                id="phone-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="text-center text-2xl tracking-[0.4em]"
                dir="ltr"
                placeholder="000000"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading || otp.length !== 6}>
              {loading ? <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جارٍ التحقق...</> : 'تأكيد الكود'}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('phone'); setOtp(''); }}>
              تغيير الرقم
            </Button>
          </form>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onSwitchToEmail}>البريد</Button>
          <Button type="button" variant="outline" onClick={onSwitchToWhatsApp}>واتساب</Button>
        </div>
      </div>
    </AuthCard>
  );
};

export default PhoneOTPForm;
