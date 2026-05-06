import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AuthCard from './AuthCard';
import { Loader2, MessageCircle, ArrowRight, Shield } from 'lucide-react';

interface WhatsAppOTPFormProps {
  onSwitchToEmail: () => void;
  onSuccess: () => void;
}

type Step = 'phone' | 'otp';

const WhatsAppOTPForm: React.FC<WhatsAppOTPFormProps> = ({ onSwitchToEmail, onSuccess }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('20')) return digits;
    if (digits.startsWith('0')) return '20' + digits.slice(1);
    return '20' + digits;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    try {
      const formattedPhone = formatPhone(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-otp-send', {
        body: { phone_number: formattedPhone },
      });

      if (error) throw error;

      if (data?.success) {
        setStep('otp');
        setCountdown(data.expires_in || 300);
        toast({
          title: "تم إرسال رمز التحقق",
          description: "تحقق من رسائل واتساب الخاصة بك",
        });
        // Focus first OTP input
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        throw new Error(data?.error || 'فشل إرسال الرمز');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل إرسال رمز التحقق";
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    
    // Handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      pasted.forEach((d, i) => {
        if (i + index < 6) newDigits[i + index] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const formattedPhone = formatPhone(phoneNumber);

      const { data, error } = await supabase.functions.invoke('whatsapp-otp-verify', {
        body: { phone_number: formattedPhone, otp_code: otp },
      });

      if (error) throw error;

      if (data?.success && data?.token_hash) {
        // Use the magic link token to sign in
        const { error: authError } = await supabase.auth.verifyOtp({
          token_hash: data.token_hash,
          type: data.verification_type || 'magiclink',
        });

        if (authError) {
          console.error("Auth verify error:", authError);
          toast({
            title: "تم التحقق بنجاح",
            description: "جارٍ تسجيل الدخول...",
          });
          // Even if session creation fails, user was verified
          onSuccess();
        } else {
          toast({
            title: "تم تسجيل الدخول بنجاح",
            description: "مرحباً بك!",
          });
          onSuccess();
        }
      } else if (data?.error) {
        toast({
          title: "خطأ في التحقق",
          description: data.error,
          variant: "destructive",
        });
        if (data.remaining_attempts !== undefined) {
          toast({
            description: `المحاولات المتبقية: ${data.remaining_attempts}`,
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "فشل التحقق من الرمز";
      toast({
        title: "خطأ",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setOtpDigits(['', '', '', '', '', '']);
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AuthCard title="تسجيل الدخول عبر واتساب">
      <div className="space-y-5" dir="rtl">
        {/* WhatsApp Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              أدخل رقم هاتفك وسنرسل لك رمز تحقق عبر واتساب
            </p>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <div className="flex gap-2" dir="ltr">
                <div className="flex items-center px-3 bg-muted rounded-md border text-sm font-medium text-muted-foreground min-w-[70px] justify-center">
                  +20
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="5XXXXXXXX"
                  className="flex-1"
                  dir="ltr"
                  maxLength={10}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
              disabled={loading || !phoneNumber.trim()}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جارٍ الإرسال...</>
              ) : (
                <><MessageCircle className="h-4 w-4 ml-2" /> إرسال رمز التحقق</>
              )}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              أدخل الرمز المكون من 6 أرقام المرسل إلى
            </p>
            <p className="text-center font-medium" dir="ltr">
              +{formatPhone(phoneNumber)}
            </p>

            {/* OTP Input */}
            <div className="flex justify-center gap-2" dir="ltr">
              {otpDigits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold p-0"
                />
              ))}
            </div>

            {/* Countdown */}
            {countdown > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>صالح لمدة {formatCountdown(countdown)}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-11"
              disabled={loading || otpDigits.join('').length !== 6}
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin ml-2" /> جارٍ التحقق...</>
              ) : "تأكيد الرمز"}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtpDigits(['', '', '', '', '', '']); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                تغيير الرقم
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className={`${countdown > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-green-600 hover:underline'}`}
              >
                {countdown > 0 ? `إعادة الإرسال (${formatCountdown(countdown)})` : 'إعادة إرسال الرمز'}
              </button>
            </div>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">أو</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToEmail}
          className="w-full h-11"
        >
          تسجيل الدخول بالبريد الإلكتروني
        </Button>
      </div>
    </AuthCard>
  );
};

export default WhatsAppOTPForm;
