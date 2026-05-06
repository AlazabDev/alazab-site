
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';
import WhatsAppOTPForm from '../components/auth/WhatsAppOTPForm';

type AuthMode = 'login' | 'signup' | 'reset' | 'whatsapp';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('whatsapp');
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/', { replace: true });
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-construction-light to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === 'whatsapp' && (
          <WhatsAppOTPForm
            onSwitchToEmail={() => setMode('login')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {mode === 'login' && (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onSwitchToReset={() => setMode('reset')}
            onSwitchToWhatsApp={() => setMode('whatsapp')}
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
          <ResetPasswordForm
            onSwitchToLogin={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
