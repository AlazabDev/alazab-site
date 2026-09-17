import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ALLOWED_ORIGINS = new Set([
  "https://alazab.com",
  "https://www.alazab.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://alazab.com";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "content-type, x-share-session, x-share-device",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors(req) });
  }

  if (req.method !== "GET") {
    return json(req, { ok: false, error: "method_not_allowed" }, 405);
  }

  const shareSession = (req.headers.get("x-share-session") || "").trim();
  const deviceId = (req.headers.get("x-share-device") || "").trim();

  if (!isUuid(shareSession) || deviceId.length < 8 || deviceId.length > 200) {
    return json(req, { ok: false, error: "share_session_required" }, 401);
  }

  const { data: access, error: accessError } = await admin.rpc(
    "validate_auf_share_session",
    {
      p_session_token: shareSession,
      p_device_id: deviceId,
    },
  );

  if (accessError || !access?.ok) {
    return json(req, { ok: false, error: "share_session_invalid" }, 401);
  }

  const permissions = Array.isArray(access.permissions) ? access.permissions : [];
  if (!permissions.includes("view")) {
    return json(req, { ok: false, error: "view_permission_required" }, 403);
  }

  const url = new URL(req.url);
  const receiptNumber = Number(url.searchParams.get("receipt"));
  const wantsDownload = url.searchParams.get("download") === "1";

  if (!Number.isInteger(receiptNumber) || receiptNumber < 1 || receiptNumber > 120) {
    return json(req, { ok: false, error: "invalid_receipt_number" }, 400);
  }

  if (wantsDownload && !permissions.includes("download")) {
    return json(req, { ok: false, error: "download_permission_required" }, 403);
  }

  const { data: receipt, error: receiptError } = await admin
    .from("auf_maintenance_receipts")
    .select("receipt_code,image_url")
    .eq("receipt_number", receiptNumber)
    .maybeSingle();

  if (receiptError || !receipt?.image_url) {
    return json(req, { ok: false, error: "receipt_not_found" }, 404);
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(receipt.image_url);
  } catch {
    return json(req, { ok: false, error: "receipt_source_invalid" }, 500);
  }

  if (
    sourceUrl.protocol !== "https:" ||
    sourceUrl.hostname !== "r2.alazab.com" ||
    !sourceUrl.pathname.startsWith("/receipts/")
  ) {
    return json(req, { ok: false, error: "receipt_source_not_allowed" }, 500);
  }

  let upstream: Response;
  try {
    upstream = await fetch(sourceUrl.toString(), {
      method: "GET",
      headers: { "User-Agent": "Alazab-Receipt-Gateway/1.0" },
      redirect: "error",
    });
  } catch {
    return json(req, { ok: false, error: "receipt_source_unreachable" }, 502);
  }

  if (!upstream.ok || !upstream.body) {
    return json(req, { ok: false, error: "receipt_source_failed" }, 502);
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return json(req, { ok: false, error: "receipt_source_not_image" }, 502);
  }

  const safeCode = String(receipt.receipt_code || `auf-${receiptNumber}`)
    .replace(/[^a-zA-Z0-9_-]/g, "_");

  const headers = new Headers({
    ...cors(req),
    "Content-Type": contentType,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'",
    "Content-Disposition": `${wantsDownload ? "attachment" : "inline"}; filename=\"${safeCode}.jpg\"`,
  });

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(upstream.body, { status: 200, headers });
});
