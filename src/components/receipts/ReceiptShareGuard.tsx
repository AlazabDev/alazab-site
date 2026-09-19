import { ReactNode, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

const REVIEW_SESSION_KEY = "auf-review-session-token-v1";
const SHARE_DEVICE_KEY = "auf-share-device-v1";

type GuardState = "checking" | "allowed" | "denied";

function accessMessage(error: unknown): string {
  const raw = String((error as any)?.message || (error as any)?.details || error || "");
  if (raw.includes("share_link_expired")) return "انتهت صلاحية رابط المراجعة. اطلب رابطًا جديدًا من فريق العزب.";
  if (raw.includes("share_device_limit_reached")) return "تم الوصول إلى الحد المسموح للأجهزة لهذا الرابط. افتح الرابط من جهاز مسجل أو اطلب رابطًا جديدًا.";
  if (raw.includes("share_session_missing")) return "هذه الصفحة تحتاج رابط المراجعة الأصلي الذي تم إرساله لك.";
  if (raw.includes("share_session_invalid")) return "انتهت جلسة المراجعة على هذا الجهاز. افتح رابط المشاركة الأصلي مرة أخرى.";
  return "تعذر التحقق من رابط المراجعة. تأكد أنك تستخدم الرابط الأصلي المرسل لك.";
}

interface ReceiptShareGuardProps {
  children: ReactNode;
}

function clearAccess() {
  window.localStorage.removeItem(REVIEW_SESSION_KEY);
}

function getOrCreateDeviceId(): string {
  const stored = window.localStorage.getItem(SHARE_DEVICE_KEY)?.trim() || "";
  if (stored) return stored;

  const deviceId = crypto.randomUUID();
  window.localStorage.setItem(SHARE_DEVICE_KEY, deviceId);
  return deviceId;
}

export default function ReceiptShareGuard({ children }: ReceiptShareGuardProps) {
  const [state, setState] = useState<GuardState>("checking");
  const [message, setMessage] = useState("جارٍ التحقق من رابط المشاركة...");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const hashToken = params.get("hash")?.trim() || "";
        const legacyShareToken = params.get("share")?.trim() || "";
        const shareToken = hashToken || legacyShareToken;
        const queryDeviceId = params.get("device")?.trim() || "";

        if (shareToken) {
          const deviceId = queryDeviceId || getOrCreateDeviceId();

          const { data, error } = await (supabase as any).rpc(
            "redeem_auf_share_link",
            {
              p_token: shareToken,
              p_device_id: deviceId,
              p_device_name: navigator.userAgent.slice(0, 180),
            },
          );

          if (error || !data?.session_token) {
            throw error || new Error("share_link_invalid");
          }

          window.localStorage.setItem(REVIEW_SESSION_KEY, data.session_token);
          window.localStorage.setItem(SHARE_DEVICE_KEY, deviceId);

          // Capability token is used once, then removed from the browser address bar.
          window.history.replaceState({}, document.title, "/receipts");

          if (active) setState("allowed");
          return;
        }

        const storedSession = window.localStorage.getItem(REVIEW_SESSION_KEY) || "";
        const storedDevice = window.localStorage.getItem(SHARE_DEVICE_KEY) || "";

        if (!storedSession || !storedDevice) {
          throw new Error("share_session_missing");
        }

        const { data, error } = await (supabase as any).rpc(
          "validate_auf_share_session",
          {
            p_session_token: storedSession,
            p_device_id: storedDevice,
          },
        );

        if (error || !data?.ok) {
          throw error || new Error("share_session_invalid");
        }

        if (active) setState("allowed");
      } catch (error) {
        console.error("Receipt share access denied:", error);
        clearAccess();
        if (active) {
          setMessage(accessMessage(error));
          setState("denied");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (state === "checking") {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f4f7fb] text-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-black tracking-wide text-[#FFB900]">UberFix • Alazab</div>
              <h1 className="mt-1 text-2xl font-black text-[#030957]">بوابة مراجعة الصيانة</h1>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eef2ff]">
              <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#030957]/15 border-t-[#030957]" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="m-0 text-sm font-bold text-slate-700">{message}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#030957]" />
            </div>
          </div>
          <p className="mt-5 mb-0 text-xs leading-6 text-slate-500">يتم التحقق من الرابط والجهاز قبل تحميل مستندات المراجعة.</p>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f4f7fb] text-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl font-black text-red-700">×</div>
          <div className="text-[11px] font-black tracking-wide text-[#FFB900]">UberFix • Alazab</div>
          <h1 className="mt-2 text-2xl font-black text-[#030957]">تعذر فتح جلسة المراجعة</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">{message}</p>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-500">
            لا تحتاج هذه البوابة إلى كلمة مرور. الوصول يتم من خلال رابط المراجعة الآمن المرسل لك.
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
