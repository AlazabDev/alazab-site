import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://alazab.com",
  "https://www.alazab.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://alazab.com",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char] || char));

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json(req, { success: false, error: "SERVER_NOT_CONFIGURED" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.slice(7));
    if (authError || !user) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const { data: membership, error: membershipError } = await admin
      .from("approval_memberships")
      .select("role,active")
      .eq("user_id", user.id)
      .maybeSingle();
    if (membershipError) throw membershipError;

    if (!membership?.active || !["owner", "admin", "reviewer", "approver"].includes(membership.role)) {
      return json(req, { success: false, error: "APPROVAL_ACCESS_DENIED" }, 403);
    }

    const body = await req.json();
    const reviewerId = typeof body?.reviewerId === "string" ? body.reviewerId : "";
    if (!reviewerId) return json(req, { success: false, error: "REVIEWER_ID_REQUIRED" }, 400);

    const { data: reviewer, error: reviewerError } = await admin
      .from("document_reviewers")
      .select("id,document_id,reviewer_name,reviewer_email,status")
      .eq("id", reviewerId)
      .maybeSingle();
    if (reviewerError) throw reviewerError;
    if (!reviewer) return json(req, { success: false, error: "REVIEWER_NOT_FOUND" }, 404);
    if (reviewer.status !== "pending") return json(req, { success: false, error: "REVIEW_ALREADY_COMPLETED" }, 409);

    const { data: document, error: documentError } = await admin
      .from("documents")
      .select("id,number,title")
      .eq("id", reviewer.document_id)
      .maybeSingle();
    if (documentError) throw documentError;
    if (!document) return json(req, { success: false, error: "DOCUMENT_NOT_FOUND" }, 404);

    const { data: actorProfile } = await admin
      .from("adp_profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const token = randomToken();
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { error: tokenError } = await admin.from("document_reviewers").update({
      access_token_hash: tokenHash,
      token_expires_at: expiresAt,
      last_accessed_at: null,
      access_count: 0,
    }).eq("id", reviewer.id);
    if (tokenError) throw tokenError;

    const siteUrl = (Deno.env.get("SITE_URL") || "https://alazab.com").replace(/\/$/, "");
    const reviewLink = `${siteUrl}/review/${document.id}?token=${token}`;
    const documentTitle = document.title || `مستند #${document.number}`;
    const senderName = actorProfile?.full_name || user.user_metadata?.full_name || user.email || "نظام العزب";

    let emailSent = false;
    let emailError: string | null = null;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Alazab Approvals <noreply@alazab.com>",
          to: [reviewer.reviewer_email],
          subject: `طلب مراجعة: ${documentTitle}`,
          html: `<!doctype html>
<html lang="ar" dir="rtl">
  <body style="font-family:Arial,Tahoma,sans-serif;background:#f5f6f8;color:#111827;margin:0;padding:24px">
    <div style="max-width:620px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:#030957;color:#fff;padding:24px;text-align:center">
        <h2 style="margin:0">نظام اعتماد مستندات العزب</h2>
      </div>
      <div style="padding:28px">
        <p>مرحبًا ${escapeHtml(reviewer.reviewer_name)}،</p>
        <p>أرسل لك ${escapeHtml(senderName)} المستند التالي للمراجعة:</p>
        <p style="font-weight:700">${escapeHtml(documentTitle)}</p>
        <p style="text-align:center;margin:30px 0">
          <a href="${reviewLink}" style="display:inline-block;background:#FFB900;color:#030957;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:10px">فتح المراجعة</a>
        </p>
        <p style="font-size:12px;color:#6b7280">الرابط شخصي وصالح لمدة 14 يومًا. لا تقم بإعادة مشاركته.</p>
      </div>
    </div>
  </body>
</html>`,
        }),
      });

      if (response.ok) {
        emailSent = true;
        await admin.from("document_reviewers").update({
          email_sent_at: new Date().toISOString(),
        }).eq("id", reviewer.id);
      } else {
        const bodyText = await response.text();
        emailError = `RESEND_${response.status}: ${bodyText.slice(0, 250)}`;
        console.error("send-review-email", emailError);
      }
    } else {
      emailError = "RESEND_API_KEY_NOT_CONFIGURED";
    }

    await admin.from("document_audit_logs").insert({
      document_id: document.id,
      actor_id: user.id,
      actor_name: senderName,
      action: emailSent ? "review_invitation_sent" : "review_invitation_created",
      metadata: {
        reviewer_id: reviewer.id,
        reviewer_email: reviewer.reviewer_email,
        expires_at: expiresAt,
        email_sent: emailSent,
      },
    });

    return json(req, {
      success: true,
      reviewerId: reviewer.id,
      reviewLink,
      expiresAt,
      emailSent,
      emailError,
    });
  } catch (error) {
    console.error("send-review-email error", error);
    return json(req, {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    }, 500);
  }
});
