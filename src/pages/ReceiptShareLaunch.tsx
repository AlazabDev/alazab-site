import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

const TOKEN_RE = /^[0-9a-f]{64}$/i;

export default function ReceiptShareLaunch() {
  const { token = "" } = useParams();
  const valid = TOKEN_RE.test(token);
  const deepLink = useMemo(
    () => (valid ? `alazab://share/${token}` : ""),
    [token, valid],
  );

  useEffect(() => {
    if (!deepLink) return;
    const timer = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 350);
    return () => window.clearTimeout(timer);
  }, [deepLink]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-background flex items-center justify-center px-4"
    >
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold mb-3">مراجعة أذون استلام الصيانة</h1>
        {valid ? (
          <>
            <p className="text-muted-foreground mb-6">
              يتم فتح الرابط داخل تطبيق Alazab Review. إذا لم يفتح التطبيق تلقائيًا، اضغط الزر التالي.
            </p>
            <a
              href={deepLink}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              فتح Alazab Review
            </a>
          </>
        ) : (
          <p className="text-destructive font-medium">رابط المشاركة غير صالح.</p>
        )}
      </section>
    </main>
  );
}
