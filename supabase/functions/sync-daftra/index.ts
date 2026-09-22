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

type Raw = Record<string, any>;

const asArray = (payload: any): Raw[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;

  for (const key of ["invoices", "estimates", "quotes", "Invoices", "Estimates", "Quotes"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  const candidate = Object.values(payload || {}).find((value) => Array.isArray(value));
  return Array.isArray(candidate) ? candidate as Raw[] : [];
};

const unwrap = (raw: Raw): Raw =>
  raw.Invoice || raw.Estimate || raw.Quote || raw.invoice || raw.estimate || raw.quote || raw;

const normalizeDate = (value: unknown) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split("-");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
};

const numberValue = (value: unknown) => {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { success: false, error: "METHOD_NOT_ALLOWED" }, 405);

  let admin: any;
  let logId: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const daftraApiKey = Deno.env.get("DAFTRA_API_KEY");
    const daftraSubdomainRaw = Deno.env.get("DAFTRA_SUBDOMAIN");

    if (!supabaseUrl || !serviceKey) return json(req, { success: false, error: "SERVER_NOT_CONFIGURED" }, 500);
    if (!daftraApiKey || !daftraSubdomainRaw) {
      return json(req, { success: false, error: "DAFTRA_NOT_CONFIGURED" }, 503);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(req, { success: false, error: "UNAUTHORIZED" }, 401);

    admin = createClient(supabaseUrl, serviceKey, {
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
    if (!membership?.active || !["owner", "admin"].includes(membership.role)) {
      return json(req, { success: false, error: "SYNC_ACCESS_DENIED" }, 403);
    }

    let body: Raw = {};
    try { body = await req.json(); } catch { body = {}; }

    const requested = String(body.type || body.documentType || "all").toLowerCase();
    const page = Math.max(1, Number.parseInt(String(body.page || 1), 10) || 1);
    const limit = Math.min(25, Math.max(1, Number.parseInt(String(body.limit || 15), 10) || 15));
    const skipDetails = body.skipDetails === true;

    const endpoints =
      requested === "all" ? ["invoices", "estimates"] :
      requested === "quotes" || requested === "quote" || requested === "estimates" ? ["estimates"] :
      requested === "invoices" || requested === "invoice" ? ["invoices"] :
      null;

    if (!endpoints) return json(req, { success: false, error: "UNSUPPORTED_DOCUMENT_TYPE" }, 400);

    const { data: log, error: logError } = await admin.from("document_sync_logs").insert({
      requested_by: user.id,
      document_type: requested,
      page,
      status: "running",
    }).select("id").single();
    if (logError) throw logError;
    logId = log.id;

    const cleanSubdomain = daftraSubdomainRaw
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\.daftra\.com.*$/i, "")
      .replace(/\/+$/, "");

    let totalSynced = 0;
    let totalItems = 0;
    let totalErrors = 0;
    const results: Array<Record<string, unknown>> = [];

    const fetchDaftra = async (url: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      try {
        const response = await fetch(url, {
          headers: { APIKEY: daftraApiKey, Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) {
          const detail = (await response.text()).slice(0, 300);
          throw new Error(`DAFTRA_${response.status}:${detail}`);
        }
        return await response.json();
      } finally {
        clearTimeout(timeout);
      }
    };

    for (const endpoint of endpoints) {
      let synced = 0;
      let itemsSynced = 0;
      let errors = 0;

      try {
        const listUrl = `https://${cleanSubdomain}.daftra.com/api2/${endpoint}?page=${page}&limit=${limit}`;
        const listPayload = await fetchDaftra(listUrl);
        const rows = asArray(listPayload);

        for (const raw of rows) {
          try {
            const listDoc = unwrap(raw);
            if (!listDoc?.id) {
              errors += 1;
              continue;
            }

            const rawId = String(listDoc.id);
            let fullPayload: any = null;
            if (!skipDetails) {
              try {
                fullPayload = await fetchDaftra(`https://${cleanSubdomain}.daftra.com/api2/${endpoint}/${rawId}`);
              } catch (detailError) {
                console.warn("Daftra detail fallback", endpoint, rawId, detailError);
              }
            }

            const doc = unwrap(fullPayload?.data || fullPayload || listDoc);
            const client = doc.Client || doc.client || {};
            const mappedType = endpoint === "invoices" ? "invoice" : "quote";
            const daftraId = `${endpoint}:${rawId}`;
            const docNumber = String(doc.no || doc.number || `${mappedType.toUpperCase()}-${rawId}`);
            const clientName = String(
              doc.client_business_name ||
              client.business_name ||
              [doc.client_first_name || client.first_name, doc.client_last_name || client.last_name].filter(Boolean).join(" ") ||
              "غير محدد"
            );
            const paymentRaw = String(doc.payment_status ?? "").toLowerCase();
            const paymentNumeric = Number.parseInt(paymentRaw, 10);
            const paymentStatus =
              paymentRaw === "paid" || paymentNumeric === 2 ? "paid" :
              paymentRaw === "partial" || paymentNumeric === 1 ? "partial" :
              "unpaid";

            const { data: stored, error: docError } = await admin.from("documents").upsert({
              daftra_id: daftraId,
              type: mappedType,
              number: docNumber,
              client_name: clientName,
              client_email: doc.client_email || client.email || null,
              total: numberValue(doc.summary_total ?? doc.total),
              currency: String(doc.currency_code || doc.currency || "EGP"),
              date: normalizeDate(doc.date || doc.issue_date),
              payment_status: paymentStatus,
              pdf_url: doc.invoice_pdf_url || doc.quote_pdf_url || doc.estimate_pdf_url || doc.pdf_url || null,
              html_url: doc.invoice_html_url || doc.quote_html_url || doc.estimate_html_url || doc.html_url || null,
              raw_json: fullPayload || raw,
              synced_at: new Date().toISOString(),
            }, { onConflict: "daftra_id" }).select("id").single();

            if (docError) throw docError;
            synced += 1;

            const items = doc.InvoiceItem || doc.QuoteItem || doc.EstimateItem || [];
            if (Array.isArray(items) && stored?.id) {
              const { error: deleteError } = await admin.from("quote_items").delete().eq("document_id", stored.id);
              if (deleteError) throw deleteError;

              if (items.length) {
                const mappedItems = items.map((item: Raw) => ({
                  document_id: stored.id,
                  daftra_item_id: item.id ? String(item.id) : null,
                  product_name: String(item.item || item.product || item.name || item.description || "منتج/خدمة"),
                  product_description: item.description ? String(item.description) : null,
                  quantity: numberValue(item.quantity) || 1,
                  unit_price: numberValue(item.unit_price ?? item.price),
                  total_price: numberValue(item.subtotal ?? item.total) || ((numberValue(item.quantity) || 1) * numberValue(item.unit_price ?? item.price)),
                  notes: item.notes ? String(item.notes) : null,
                }));
                const { error: itemsError } = await admin.from("quote_items").insert(mappedItems);
                if (itemsError) throw itemsError;
                itemsSynced += mappedItems.length;
              }
            }
          } catch (rowError) {
            errors += 1;
            console.error("Daftra row sync failed", endpoint, rowError);
          }
        }

        results.push({ endpoint, synced, itemsSynced, errors, total: rows.length });
      } catch (endpointError) {
        errors += 1;
        results.push({
          endpoint,
          synced,
          itemsSynced,
          errors,
          error: endpointError instanceof Error ? endpointError.message : "UNKNOWN_ERROR",
        });
      }

      totalSynced += synced;
      totalItems += itemsSynced;
      totalErrors += errors;
    }

    const status = totalErrors > 0 && totalSynced === 0 ? "error" : "success";
    const message = totalErrors
      ? `Completed with ${totalErrors} error(s)`
      : "Completed successfully";

    await admin.from("document_sync_logs").update({
      status,
      synced_count: totalSynced,
      items_synced: totalItems,
      error_count: totalErrors,
      message,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    return json(req, {
      success: status === "success",
      synced: totalSynced,
      itemsSynced: totalItems,
      errors: totalErrors,
      page,
      limit,
      results,
    }, status === "success" ? 200 : 502);
  } catch (error) {
    console.error("sync-daftra error", error);
    if (admin && logId) {
      await admin.from("document_sync_logs").update({
        status: "error",
        error_count: 1,
        message: error instanceof Error ? error.message.slice(0, 1000) : "UNKNOWN_ERROR",
        completed_at: new Date().toISOString(),
      }).eq("id", logId);
    }
    return json(req, {
      success: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    }, 500);
  }
});
