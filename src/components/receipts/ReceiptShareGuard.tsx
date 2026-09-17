import { ReactNode, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

const REVIEW_SESSION_KEY = "auf-review-session-token-v1";
const SHARE_DEVICE_KEY = "auf-share-device-v1";

type GuardState = "checking" | "allowed" | "denied";

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
          setMessage(
            "رابط المشاركة غير صالح أو انتهت صلاحيته. افتح رابط المشاركة الأصلي المرسل لك.",
          );
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
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"
      >
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#FFB900]" />
          <h1 className="text-xl font-bold">Alazab Review</h1>
          <p className="mt-3 text-sm text-slate-300">{message}</p>
        </div>
      </main>
    );
  }

  if (state === "denied") {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6"
      >
        <div className="w-full max-w-lg rounded-2xl border border-red-400/20 bg-white/5 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl text-red-300">
            ×
          </div>
          <h1 className="text-2xl font-bold">رابط مشاركة مطلوب</h1>
          <p className="mt-4 leading-7 text-slate-300">{message}</p>
          <p className="mt-5 text-xs text-slate-500">
            لا توجد كلمة مرور أو صفحة تسجيل دخول لهذا المسار.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
