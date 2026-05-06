import React, { useState, useEffect } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const axios: any;

interface TwoFactorSetupProps {
  onEnabled?: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onEnabled }) => {
  const [step, setStep] = useState('intro'); // intro, qr, verify, success
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (step === 'qr') {
      fetchQRCode();
    }
  }, [step]);

  const fetchQRCode = async () => {
    try {
      const response = await axios.post('/api/auth/2fa/setup');
      setSecret(response.data.secret);
      setQrCode(response.data.qrCode);
    } catch (err) {
      setError('فشل تحميل QR code');
    }
  };

  const handleEnable = async () => {
    if (token.length !== 6) {
      setError('الرجاء إدخال رمز صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/2fa/enable', { token });
      
      if (response.data.success) {
        setStep('success');
        onEnabled?.();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تفعيل المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        إعداد المصادقة الثنائية (2FA)
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'intro' && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">ما هي المصادقة الثنائية؟</h3>
            <p className="text-blue-600 text-sm">
              تضيف المصادقة الثنائية طبقة أمان إضافية لحسابك. بعد تفعيلها،
              ستحتاج إلى إدخال رمز مؤقت من تطبيق Google Authenticator بالإضافة
              إلى كلمة المرور عند تسجيل الدخول.
            </p>
          </div>

          <button
            onClick={() => setStep('qr')}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
        متابعة
          </button>
        </div>
      )}

      {step === 'qr' && qrCode && (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              امسح رمز QR باستخدام تطبيق Google Authenticator
            </p>
            
            <div className="bg-gray-100 p-4 rounded-lg inline-block">
              <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <p className="text-sm text-gray-500 mt-4">
              أو أدخل هذا المفتاح يدوياً:
              <br />
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {secret}
              </code>
            </p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              placeholder="أدخل الرمز من التطبيق"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
              maxLength={6}
              dir="ltr"
            />

            <button
              onClick={handleEnable}
              disabled={loading || token.length !== 6}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'جاري التفعيل...' : 'تفعيل المصادقة الثنائية'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            تم تفعيل المصادقة الثنائية بنجاح
          </p>
          <p className="text-sm text-gray-500">
            في المرة القادمة التي تسجل فيها الدخول، ستحتاج إلى إدخال رمز من تطبيق Google Authenticator
          </p>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
