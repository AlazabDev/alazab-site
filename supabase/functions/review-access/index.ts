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

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const getIp = (req: Request) => {
  const value = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "";
  return value.split(",")[0].trim() || null;
};

const loadContext = async (admin: any, documentId: string, token: string) => {
  if (token.length < 40 || token.length > 256) return { error: "INVALID_TOKEN" as const };
  const hash = await sha256(token);

  const { data: reviewer, error: reviewerError } = await admin
    .from("document_reviewers")
    .select("id,document_id,reviewer_name,reviewer_email,department,status,signed_at,rejection_reason,token_expires_at,access_count")
    .eq("document_id", documentId)
    .eq("access_token_hash", hash)
    .maybeSingle();

  if (reviewerError) throw reviewerError;
  if (!reviewer) return { error: "INVALID_TOKEN" as const };
  if (!reviewer.token_expires_at || new Date(reviewer.token_expires_at).getTime() <= Date.now()) {
    return { error: "TOKEN_EXPIRED" as const };
  }

  const { data: document, error: documentError } = await admin
    .from("documents")
    .select("id,number,title,description,type,client_name,total,currency,date,status,file_bucket,file_path,file_url,pdf_url,created_at")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError) throw documentError;
  if (!document) return { error: "DOCUMENT_NOT_FOUND" as const };

  return { reviewer, document };
};

const buildView = async (admin: any, reviewer: any, document: any) => {
  let fileUrl = document.file_url || document.pdf_url || null;

  if (document.file_bucket && document.file_path) {
    const { data: signed, error: signedError } = await admin.storage
      .from(document.file_bucket)
      .createSignedUrl(document.file_path, 15 * 60);
    if (!signedError && signed?.signedUrl) fileUrl = signed.signedUrl;
  }

  const { data: reviewers, error: reviewersError } = await admin
    .from("document_reviewers")
    .select("id,reviewer_name,department,status,signed_at")
    .eq("document_id", document.id)
    .order("created_at", { ascending: true });
  if (reviewersError) throw reviewersError;

  return {
    document: {
      id: document.id,
      number: document.number,
      title: document.title,
      description: document.description,
      type: document.type,
      clientName: document.client_name,
      total: document.total,
      currency: document.currency,
      date: document.date,
      status: document.status,
      createdAt: document.created_at,
      fileUrl,
    },
    reviewer: {
      id: reviewer.id,
      name: reviewer.reviewer_name,
      department: reviewer.department,
      status: reviewer.status,
      signedAt: reviewer.signed_at,
      rejectionReason: reviewer.rejection_reason,
    },
    reviewers: (reviewers || []).map((item: any) => ({
      id: item.id,
      name: item.reviewer_name,
      department: item.department,
      status: item.status,
      signedAt: item.signed_at,
    })),
  };
};

const recalculateDocumentStatus = async (admin: any, documentId: string, actorName: string) => {
  const [{ data: reviewers, error: reviewersError }, { data: document, error: docError }] = await Promise.all([
    admin.from("document_reviewers").select("status").eq("document_id", documentId),
    admin.from("documents").select("status").eq("id", documentId).maybeSingle(),
  ]);
  if (reviewersError) throw reviewersError;
  if (docError) throw docError;
  if (!document || ["approved", "signed", "archived"].includes(document.status)) return;

  const statuses = (reviewers || []).map((item: any) => item.status);
  const nextStatus =
    statuses.some((status: string) => status === "rejected")
      ? "needs_fix"
      : statuses.length > 0 && statuses.every((status: string) => status === "approved")
        ? "ready_to_approve"
        : "in_review";

  if (document.status !== nextStatus) {
    const { error } = await admin.from("documents").update({ status: nextStatus }).eq("id", documentId);
    if (error) throw error;

    await admin.from("document_audit_logs").insert({
      document_id: documentId,
      actor_name: actorName,
      action: "external_review_status_change",
      old_value: { status: document.status },
      new_value: { status: nextStatus },
    });
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json(req, { success: false, error: "SERVER_NOT_CONFIGURED" }, 500);

    const body = await req.json();
    const action = typeof body?.action === "string" ? body.action : "get";
    const documentId = typeof body?.documentId === "string" ? body.documentId : "";
    const token = typeof body?.token === "string" ? body.token : "";

    if (!documentId || !token) return json(req, { success: false, error: "INVALID_REQUEST" }, 400);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const context = await loadContext(admin, documentId, token);
    if ("error" in context) {
      const status = context.error === "TOKEN_EXPIRED" ? 410 : context.error === "DOCUMENT_NOT_FOUND" ? 404 : 403;
      return json(req, { success: false, error: context.error }, status);
    }

    const { reviewer, document } = context;

    if (action === "get") {
      await admin.from("document_reviewers").update({
        last_accessed_at: new Date().toISOString(),
        access_count: (reviewer.access_count || 0) + 1,
      }).eq("id", reviewer.id);

      return json(req, { success: true, ...(await buildView(admin, reviewer, document)) });
    }

    if (reviewer.status !== "pending") {
      return json(req, { success: false, error: "REVIEW_ALREADY_COMPLETED" }, 409);
    }

    if (action === "approve") {
      const signatureData = typeof body?.signatureData === "string" ? body.signatureData : "";
      if (!signatureData.startsWith("data:image/") || signatureData.length > 1_500_000) {
        return json(req, { success: false, error: "VALID_SIGNATURE_REQUIRED" }, 400);
      }

      const signedAt = new Date().toISOString();
      const { error: reviewerUpdateError } = await admin.from("document_reviewers").update({
        status: "approved",
        signature_data: signatureData,
        signed_at: signedAt,
        last_accessed_at: signedAt,
        access_count: (reviewer.access_count || 0) + 1,
      }).eq("id", reviewer.id).eq("status", "pending");
      if (reviewerUpdateError) throw reviewerUpdateError;

      const { error: signatureError } = await admin.from("document_signatures").insert({
        document_id: document.id,
        reviewer_id: reviewer.id,
        signer_name: reviewer.reviewer_name,
        signature_data: signatureData,
        ip_address: getIp(req),
      });
      if (signatureError) throw signatureError;

      await admin.from("document_audit_logs").insert({
        document_id: document.id,
        actor_name: reviewer.reviewer_name,
        action: "external_review_approved",
        metadata: { reviewer_id: reviewer.id, department: reviewer.department },
      });

      await recalculateDocumentStatus(admin, document.id, reviewer.reviewer_name);

      const updatedContext = await loadContext(admin, documentId, token);
      if ("error" in updatedContext) throw new Error(updatedContext.error);
      return json(req, { success: true, ...(await buildView(admin, updatedContext.reviewer, updatedContext.document)) });
    }

    if (action === "reject") {
      const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
      if (reason.length < 3 || reason.length > 2000) {
        return json(req, { success: false, error: "REJECTION_REASON_REQUIRED" }, 400);
      }

      const rejectedAt = new Date().toISOString();
      const { error: reviewerUpdateError } = await admin.from("document_reviewers").update({
        status: "rejected",
        rejection_reason: reason,
        last_accessed_at: rejectedAt,
        access_count: (reviewer.access_count || 0) + 1,
      }).eq("id", reviewer.id).eq("status", "pending");
      if (reviewerUpdateError) throw reviewerUpdateError;

      await admin.from("document_audit_logs").insert({
        document_id: document.id,
        actor_name: reviewer.reviewer_name,
        action: "external_review_rejected",
        metadata: { reviewer_id: reviewer.id, department: reviewer.department, reason },
      });

      await recalculateDocumentStatus(admin, document.id, reviewer.reviewer_name);

      const updatedContext = await loadContext(admin, documentId, token);
      if ("error" in updatedContext) throw new Error(updatedContext.error);
      return json(req, { success: true, ...(await buildView(admin, updatedContext.reviewer, updatedContext.document)) });
    }

    return json(req, { success: false, error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("review-access error", error);
    return json(req, {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    }, 500);
  }
});
