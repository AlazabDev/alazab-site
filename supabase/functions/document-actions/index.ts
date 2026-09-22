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

type Action =
  | "submit_review"
  | "request_fix"
  | "approve"
  | "sign"
  | "archive"
  | "add_comment"
  | "resolve_comment"
  | "update_quote_item"
  | "approve_quote_items";

type QuoteItemStatus = "pending" | "approved" | "rejected" | "revision_requested";

interface ActionRequest {
  action: Action;
  documentId: string;
  comment?: string;
  signatureData?: string;
  commentId?: string;
  quoteItemId?: string;
  quoteItemStatus?: QuoteItemStatus;
  reason?: string;
}

const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });

const statusTransitions: Record<string, { next: string; from: string[] }> = {
  submit_review: { next: "in_review", from: ["draft", "needs_fix"] },
  request_fix: { next: "needs_fix", from: ["in_review", "ready_to_approve"] },
  approve: { next: "approved", from: ["in_review", "ready_to_approve"] },
  sign: { next: "signed", from: ["approved"] },
  archive: { next: "archived", from: ["draft", "in_review", "needs_fix", "ready_to_approve", "approved", "signed"] },
};

const getActorName = async (admin: any, user: any) => {
  const { data } = await admin
    .from("adp_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();
  return data?.full_name || user.user_metadata?.full_name || user.email || user.phone || "مستخدم";
};

const audit = async (
  admin: any,
  documentId: string,
  actorId: string,
  actorName: string,
  action: string,
  oldValue: unknown = null,
  newValue: unknown = null,
  metadata: unknown = null,
) => {
  const { error } = await admin.from("document_audit_logs").insert({
    document_id: documentId,
    actor_id: actorId,
    actor_name: actorName,
    action,
    old_value: oldValue,
    new_value: newValue,
    metadata,
  });
  if (error) throw error;
};

const updateDocumentStatus = async (
  admin: any,
  documentId: string,
  action: keyof typeof statusTransitions,
  actorId: string,
  actorName: string,
  comment?: string,
  signatureData?: string,
) => {
  const { data: document, error: docError } = await admin
    .from("documents")
    .select("id,status,number")
    .eq("id", documentId)
    .maybeSingle();

  if (docError) throw docError;
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");

  const transition = statusTransitions[action];
  if (!transition.from.includes(document.status)) {
    throw new Error(`INVALID_TRANSITION:${document.status}->${transition.next}`);
  }

  if (action === "sign") {
    if (!signatureData || !signatureData.startsWith("data:image/") || signatureData.length > 1_500_000) {
      throw new Error("VALID_SIGNATURE_REQUIRED");
    }

    const ip = (reqIpHolder.value || "0.0.0.0").split(",")[0].trim();
    const { error: signatureError } = await admin.from("document_signatures").insert({
      document_id: documentId,
      signer_id: actorId,
      signer_name: actorName,
      signature_data: signatureData,
      ip_address: ip === "unknown" ? null : ip,
    });
    if (signatureError) throw signatureError;
  }

  const { data, error } = await admin
    .from("documents")
    .update({ status: transition.next })
    .eq("id", documentId)
    .select("id,status,number")
    .single();
  if (error) throw error;

  if (action === "request_fix" && comment?.trim()) {
    const { error: commentError } = await admin.from("document_comments").insert({
      document_id: documentId,
      user_id: actorId,
      user_name: actorName,
      text: `طلب تعديل: ${comment.trim()}`,
    });
    if (commentError) throw commentError;
  }

  await audit(
    admin,
    documentId,
    actorId,
    actorName,
    action === "sign" ? "document_signed" : "status_change",
    { status: document.status },
    { status: transition.next },
    comment?.trim() ? { comment: comment.trim() } : null,
  );

  return data;
};

const reqIpHolder = { value: "unknown" };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  reqIpHolder.value =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json(req, { success: false, error: "SERVER_NOT_CONFIGURED" }, 500);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    const { data: membership, error: membershipError } = await admin
      .from("approval_memberships")
      .select("role,active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) throw membershipError;
    if (!membership?.active) return json(req, { success: false, error: "APPROVAL_ACCESS_DENIED" }, 403);

    const body = (await req.json()) as ActionRequest;
    if (!body.action || !body.documentId) return json(req, { success: false, error: "INVALID_REQUEST" }, 400);

    const actorName = await getActorName(admin, user);
    const privileged = ["owner", "admin", "approver"].includes(membership.role);
    const canReview = privileged || membership.role === "reviewer";

    if (["approve", "sign", "archive"].includes(body.action) && !privileged) {
      return json(req, { success: false, error: "INSUFFICIENT_ROLE" }, 403);
    }
    if (["submit_review", "request_fix", "update_quote_item", "approve_quote_items"].includes(body.action) && !canReview) {
      return json(req, { success: false, error: "INSUFFICIENT_ROLE" }, 403);
    }

    if (body.action in statusTransitions) {
      const data = await updateDocumentStatus(
        admin,
        body.documentId,
        body.action as keyof typeof statusTransitions,
        user.id,
        actorName,
        body.comment,
        body.signatureData,
      );
      return json(req, { success: true, action: body.action, data });
    }

    if (body.action === "add_comment") {
      const text = body.comment?.trim();
      if (!text) return json(req, { success: false, error: "COMMENT_REQUIRED" }, 400);

      const { data, error } = await admin.from("document_comments").insert({
        document_id: body.documentId,
        user_id: user.id,
        user_name: actorName,
        text,
      }).select().single();
      if (error) throw error;

      await audit(admin, body.documentId, user.id, actorName, "comment_added", null, { text });
      return json(req, { success: true, data });
    }

    if (body.action === "resolve_comment") {
      if (!body.commentId) return json(req, { success: false, error: "COMMENT_ID_REQUIRED" }, 400);

      const { data, error } = await admin.from("document_comments")
        .update({ resolved: true, resolved_by: user.id, resolved_at: new Date().toISOString() })
        .eq("id", body.commentId)
        .eq("document_id", body.documentId)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return json(req, { success: false, error: "COMMENT_NOT_FOUND" }, 404);

      await audit(admin, body.documentId, user.id, actorName, "comment_resolved", null, { comment_id: body.commentId });
      return json(req, { success: true, data });
    }

    if (body.action === "update_quote_item") {
      if (!body.quoteItemId || !body.quoteItemStatus) {
        return json(req, { success: false, error: "QUOTE_ITEM_ACTION_INVALID" }, 400);
      }

      const allowed: QuoteItemStatus[] = ["pending", "approved", "rejected", "revision_requested"];
      if (!allowed.includes(body.quoteItemStatus)) {
        return json(req, { success: false, error: "QUOTE_ITEM_STATUS_INVALID" }, 400);
      }

      const { data: item, error } = await admin.from("quote_items").update({
        approval_status: body.quoteItemStatus,
        approved_by: body.quoteItemStatus === "approved" ? user.id : null,
        approved_at: body.quoteItemStatus === "approved" ? new Date().toISOString() : null,
        rejection_reason: ["rejected", "revision_requested"].includes(body.quoteItemStatus)
          ? (body.reason?.trim() || null)
          : null,
      }).eq("id", body.quoteItemId).eq("document_id", body.documentId).select().maybeSingle();

      if (error) throw error;
      if (!item) return json(req, { success: false, error: "QUOTE_ITEM_NOT_FOUND" }, 404);

      await audit(admin, body.documentId, user.id, actorName, "quote_item_status_change", null, {
        quote_item_id: body.quoteItemId,
        status: body.quoteItemStatus,
        reason: body.reason?.trim() || null,
      });

      const { data: items, error: itemsError } = await admin.from("quote_items")
        .select("approval_status")
        .eq("document_id", body.documentId);
      if (itemsError) throw itemsError;

      if (items?.length) {
        const statuses = items.map((row: any) => row.approval_status);
        const nextStatus = statuses.every((s: string) => s === "approved")
          ? "ready_to_approve"
          : statuses.some((s: string) => s === "rejected" || s === "revision_requested")
            ? "needs_fix"
            : null;

        if (nextStatus) {
          const { data: doc } = await admin.from("documents").select("status").eq("id", body.documentId).maybeSingle();
          if (doc && doc.status !== nextStatus && doc.status !== "signed" && doc.status !== "archived") {
            await admin.from("documents").update({ status: nextStatus }).eq("id", body.documentId);
            await audit(admin, body.documentId, user.id, actorName, "status_change", { status: doc.status }, { status: nextStatus });
          }
        }
      }

      return json(req, { success: true, data: item });
    }

    if (body.action === "approve_quote_items") {
      const { data: before, error: beforeError } = await admin.from("quote_items")
        .select("id")
        .eq("document_id", body.documentId)
        .eq("approval_status", "pending");
      if (beforeError) throw beforeError;

      const { error } = await admin.from("quote_items").update({
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      }).eq("document_id", body.documentId).eq("approval_status", "pending");
      if (error) throw error;

      const { data: doc } = await admin.from("documents").select("status").eq("id", body.documentId).maybeSingle();
      if (doc && !["approved", "signed", "archived"].includes(doc.status)) {
        await admin.from("documents").update({ status: "ready_to_approve" }).eq("id", body.documentId);
        await audit(admin, body.documentId, user.id, actorName, "status_change", { status: doc.status }, { status: "ready_to_approve" });
      }

      await audit(admin, body.documentId, user.id, actorName, "quote_items_bulk_approved", null, { count: before?.length || 0 });
      return json(req, { success: true, approved: before?.length || 0 });
    }

    return json(req, { success: false, error: "UNKNOWN_ACTION" }, 400);
  } catch (error) {
    console.error("document-actions error", error);
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "DOCUMENT_NOT_FOUND" ? 404 : message.startsWith("INVALID_TRANSITION") ? 409 : 500;
    return json(req, { success: false, error: message }, status);
  }
});
