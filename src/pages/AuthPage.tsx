import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import LoginForm from '@/components/auth/LoginForm';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import SignupForm from '@/components/auth/SignupForm';
import WhatsAppOTPForm from '@/components/auth/WhatsAppOTPForm';
import PhoneOTPForm from '@/components/auth/PhoneOTPForm';

type AuthMode = 'login' | 'signup' | 'reset' | 'whatsapp' | 'phone';

const resolveReturnTo = (rawValue: string | null): string => {
  if (!rawValue) return '/';

  try {
    const target = new URL(rawValue, window.location.origin);
    if (target.origin !== window.location.origin || target.pathname === '/auth') {
      return '/';
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return '/';
  }
};

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = resolveReturnTo(searchParams.get('returnTo'));

  useEffect(() => {
    let active = true;

    const checkUser = async (): Promise<void> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (active && session) {
        navigate(returnTo, { replace: true });
      }
    };

    void checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        navigate(returnTo, { replace: true });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate, returnTo]);

  const handleAuthSuccess = (): void => {
    navigate(returnTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-construction-light to-gray-50 p-4">
      <div className="w-full max-w-md">
        {mode === 'login' && (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onSwitchToReset={() => setMode('reset')}
            onSwitchToWhatsApp={() => setMode('whatsapp')}
            onSwitchToPhone={() => setMode('phone')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {mode === 'phone' && (
          <PhoneOTPForm
            onSwitchToEmail={() => setMode('login')}
            onSwitchToWhatsApp={() => setMode('whatsapp')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {mode === 'whatsapp' && (
          <WhatsAppOTPForm
            onSwitchToEmail={() => setMode('login')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {mode === 'signup' && (
          <SignupForm
            onSwitchToLogin={() => setMode('login')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {mode === 'reset' && (
          <ResetPasswordForm onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
