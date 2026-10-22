import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Session = { waba_id: string; phone_number_id: string };
type FacebookSDK = {
  login: (callback: (response: { authResponse?: { code?: string } }) => void, options: Record<string, unknown>) => void;
};
const apiBase = import.meta.env.VITE_META_API_URL || 'https://alazab.com/api/meta';
const setup = {
  business: {
    id: '314437023701205', name: 'AlazabArch', email: 'admin@alazab.com',
    phone: { code: 20, number: '' }, website: 'https://alazab.com/',
    address: { streetAddress1: '8/500 المعادي', city: 'المعادي', state: 'Cairo Governorate', zipPostal: '11472', country: 'EG' },
  },
  phone: { displayName: 'Alazab', description: '' },
  whatsAppBusinessAccount: { ids: ['1303965001665007'] },
};

export default function WhatsAppEmbeddedSignupPage() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<Session | null>(null);
  const pending = useRef<{ code?: string; session?: Session; active: boolean; sending: boolean }>({ active: false, sending: false });
  const complete = useRef<() => Promise<void>>(async () => {});
  const key = useRef('');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const sdk = () => (window as Window & { FB?: FacebookSDK }).FB;
    const poll = setInterval(() => setReady(Boolean(sdk())), 300);
    const finish = async () => {
      const current = pending.current;
      if (!current.active || current.sending || !current.code || !current.session) return;
      current.sending = true;
      if (timeout.current) clearTimeout(timeout.current);
      try {
        const response = await fetch(`${apiBase}/embedded-signup/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': key.current },
          body: JSON.stringify({ code: current.code, ...current.session }),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'تعذر إكمال الربط');
        if (mounted.current) {
          setResult(body);
          setMessage('تمت مبادلة الرمز وحفظ بيانات الربط بنجاح.');
        }
      } catch (error) {
        if (mounted.current) setMessage(error instanceof Error ? error.message : 'تعذر إكمال الربط');
      } finally {
        pending.current = { active: false, sending: false };
        key.current = '';
        if (mounted.current) { setBusy(false); setAdminKey(''); }
      }
    };
    complete.current = finish;
    const listener = (event: MessageEvent) => {
      if (!['https://www.facebook.com', 'https://web.facebook.com', 'https://facebook.com'].includes(event.origin)) return;
      if (!pending.current.active || pending.current.sending) return;
      let payload;
      try { payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data; } catch { return; }
      if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;
      if (payload.event === 'FINISH') {
        const data = payload.data;
        if (!/^\d+$/.test(data?.waba_id || '') || !/^\d+$/.test(data?.phone_number_id || '')) {
          setMessage('اكتمل الدفق دون معرّفات حساب وهاتف صالحة؛ أكمل اختيار الهاتف.');
          return;
        }
        pending.current.session = { waba_id: data.waba_id, phone_number_id: data.phone_number_id };
        try { sessionStorage.setItem('alazab.whatsapp.signup', JSON.stringify(pending.current.session)); } catch { /* Storage may be disabled. */ }
        void finish();
      } else if (payload.event === 'CANCEL' || payload.event === 'ERROR') {
        pending.current = { active: false, sending: false };
        key.current = '';
        if (timeout.current) clearTimeout(timeout.current);
        setBusy(false);
        setMessage(payload.event === 'CANCEL' ? 'تم إلغاء التسجيل.' : 'تعذر إكمال التسجيل لدى Meta.');
      }
    };
    window.addEventListener('message', listener);
    return () => {
      mounted.current = false;
      clearInterval(poll);
      if (timeout.current) clearTimeout(timeout.current);
      pending.current = { active: false, sending: false };
      key.current = '';
      window.removeEventListener('message', listener);
    };
  }, []);

  const launch = () => {
    const fb = (window as Window & { FB?: FacebookSDK }).FB;
    if (!fb || busy || !adminKey.trim()) return;
    key.current = adminKey.trim();
    pending.current = { active: true, sending: false };
    setBusy(true); setResult(null); setMessage('أكمل الخطوات في نافذة Meta.');
    timeout.current = setTimeout(() => {
      pending.current = { active: false, sending: false };
      key.current = ''; setBusy(false); setMessage('انتهت مهلة التسجيل؛ ابدأ محاولة جديدة.');
    }, 10 * 60 * 1000);
    try {
      fb.login((response) => {
        if (!pending.current.active) return;
        if (response.authResponse?.code) {
          pending.current.code = response.authResponse.code;
          void complete.current();
        } else if (!pending.current.sending) {
          pending.current = { active: false, sending: false };
          key.current = ''; setBusy(false); setMessage('لم يتم منح تصريح التسجيل.');
          if (timeout.current) clearTimeout(timeout.current);
        }
      }, {
        config_id: '1815526366103718', response_type: 'code',
        override_default_response_type: true, extras: { version: 'v4', setup },
      });
    } catch {
      pending.current = { active: false, sending: false };
      key.current = ''; setBusy(false); setMessage('تعذر فتح نافذة Meta؛ أعد المحاولة.');
      if (timeout.current) clearTimeout(timeout.current);
    }
  };

  return (
    <main dir="rtl" className="container mx-auto max-w-2xl space-y-6 px-4 py-12">
      <h1 className="text-2xl font-bold text-[#030957]">ربط واتساب للأعمال</h1>
      <p>اختر حساب واتساب والهاتف عبر التسجيل المضمّن من Meta لإكمال ربطهما بالعزب.</p>
      <label className="block space-y-2">
        <span>مفتاح إدارة تكامل Meta</span>
        <Input type="password" autoComplete="off" value={adminKey} disabled={busy} onChange={(event) => setAdminKey(event.target.value)} />
      </label>
      <Button onClick={launch} disabled={!ready || busy || !adminKey.trim()}>
        {busy ? 'جارٍ إكمال التسجيل…' : ready ? 'الربط عبر Facebook' : 'جارٍ تحميل Facebook…'}
      </Button>
      <p role="status" aria-live="polite">{message}</p>
      {result && <dl className="space-y-2 rounded-xl border p-4"><dt>حساب واتساب</dt><dd dir="ltr">{result.waba_id}</dd><dt>معرّف الهاتف</dt><dd dir="ltr">{result.phone_number_id}</dd></dl>}
    </main>
  );
}
