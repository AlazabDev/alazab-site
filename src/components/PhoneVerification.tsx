import React, { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const axios: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const PhoneInput: any;

interface PhoneVerificationProps {
  onVerified?: () => void;
}

const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onVerified }) => {
  const [step, setStep] = useState('input'); // input, verify, success
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);

  const handleSendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/auth/request-verification', {
        phoneNumber: '+' + phoneNumber
      });
      
      if (response.data.success) {
        setStep('verify');
        startTimer(60); // 60 ثانية عد تنازلي
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('الرجاء إدخال الرمز كاملاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-phone', {
        code: fullCode
      });

      if (response.data.success) {
        setStep('success');
        onVerified?.();
        setTimeout(() => {
          // إغلاق المودال أو التوجيه
        }, 2000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل التحقق');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (seconds) => {
    setTimer(seconds);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        {step === 'input' && 'تأكيد رقم الهاتف'}
        {step === 'verify' && 'إدخال رمز التحقق'}
        {step === 'success' && 'تم التحقق بنجاح!'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {step === 'input' && (
        <div className="space-y-4">
          <PhoneInput
            country={'sa'}
            value={phoneNumber}
            onChange={setPhoneNumber}
            inputStyle={{
              width: '100%',
              height: '48px',
              fontSize: '16px',
              borderRadius: '8px',
            }}
            containerStyle={{
              width: '100%',
            }}
            buttonStyle={{
              borderRadius: '8px 0 0 8px',
            }}
          />

          <button
            onClick={handleSendCode}
            disabled={loading || phoneNumber.length < 10}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-6">
          <p className="text-center text-gray-600">
            تم إرسال رمز التحقق إلى الرقم:
            <br />
            <span className="font-bold text-gray-900">+{phoneNumber}</span>
          </p>

          <div className="flex justify-center gap-2 rtl:flex-row-reverse" dir="ltr">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
              />
            ))}
          </div>

          {timer > 0 ? (
            <p className="text-center text-sm text-gray-500">
              يمكنك طلب رمز جديد بعد {timer} ثانية
            </p>
          ) : (
            <button
              onClick={handleSendCode}
              className="text-indigo-600 hover:text-indigo-500 text-sm block mx-auto"
            >
              إعادة إرسال الرمز
            </button>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={loading || code.join('').length !== 6}
            className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'جاري التحقق...' : 'تأكيد'}
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">تم التحقق من رقم هاتفك بنجاح</p>
        </div>
      )}
    </div>
  );
};

export default PhoneVerification;
