/* eslint-disable @typescript-eslint/no-explicit-any, no-case-declarations */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN");
if (!VERIFY_TOKEN) {
  console.error("WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured");
}

// Rate limiting: in-memory store (per cold-start)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max events per phone per minute
const RATE_WINDOW = 60_000;

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(phone, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// HMAC-SHA256 signature verification
async function verifySignature(rawBody: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature) return false;
  const expected = signature.replace("sha256=", "");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === expected;
}

// Deduplicate by message ID
const processedIds = new Map<string, number>();
const DEDUP_TTL = 300_000; // 5 minutes

function isDuplicate(messageId: string): boolean {
  const now = Date.now();
  // Cleanup old entries periodically
  if (processedIds.size > 5000) {
    for (const [id, ts] of processedIds) {
      if (now - ts > DEDUP_TTL) processedIds.delete(id);
    }
  }
  if (processedIds.has(messageId)) return true;
  processedIds.set(messageId, now);
  return false;
}

// Extract message content with rich type support
function extractContent(message: any): { content: string; mediaUrl: string | null; mediaMime: string | null } {
  let content = "";
  let mediaUrl: string | null = null;
  let mediaMime: string | null = null;

  switch (message.type) {
    case "text":
      content = message.text?.body || "";
      break;
    case "image":
      content = message.image?.caption || "[صورة]";
      mediaUrl = message.image?.id || null;
      mediaMime = message.image?.mime_type || "image/jpeg";
      break;
    case "document":
      content = message.document?.caption || `[مستند: ${message.document?.filename || ""}]`;
      mediaUrl = message.document?.id || null;
      mediaMime = message.document?.mime_type || "application/pdf";
      break;
    case "audio":
      content = "[رسالة صوتية]";
      mediaUrl = message.audio?.id || null;
      mediaMime = message.audio?.mime_type || "audio/ogg";
      break;
    case "video":
      content = message.video?.caption || "[فيديو]";
      mediaUrl = message.video?.id || null;
      mediaMime = message.video?.mime_type || "video/mp4";
      break;
    case "sticker":
      content = "[ملصق]";
      mediaUrl = message.sticker?.id || null;
      mediaMime = message.sticker?.mime_type || "image/webp";
      break;
    case "location":
      content = `[موقع: ${message.location?.latitude}, ${message.location?.longitude}]`;
      break;
    case "contacts":
      const c = message.contacts?.[0];
      content = c ? `[جهة اتصال: ${c.name?.formatted_name || ""}]` : "[جهة اتصال]";
      break;
    case "interactive":
      const reply = message.interactive?.button_reply || message.interactive?.list_reply;
      content = reply?.title || "[رد تفاعلي]";
      break;
    case "reaction":
      content = `[تفاعل: ${message.reaction?.emoji || ""}]`;
      break;
    case "order":
      content = "[طلب شراء]";
      break;
    default:
      content = `[${message.type || "غير معروف"}]`;
  }

  return { content, mediaUrl, mediaMime };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ─── GET: Webhook Verification ───
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified successfully");
      return new Response(challenge, { status: 200 });
    }

    console.warn("❌ Webhook verification failed — token mismatch");
    return new Response("Forbidden", { status: 403 });
  }

  // ─── POST: Incoming Events ───
  if (req.method === "POST") {
    const rawBody = await req.text();

    // Signature verification (if FACEBOOK_APP_SECRET is set)
    const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");
    if (appSecret) {
      const sig = req.headers.get("x-hub-signature-256");
      const valid = await verifySignature(rawBody, sig, appSecret);
      if (!valid) {
        console.error("❌ Invalid webhook signature");
        return new Response("Invalid signature", { status: 401 });
      }
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("❌ Invalid JSON body");
      return new Response("Bad Request", { status: 400 });
    }

    // Quick acknowledge — Meta requires 200 within 20s
    // Process async
    try {
      if (body.object !== "whatsapp_business_account") {
        console.log("Ignoring non-WhatsApp event:", body.object);
        return new Response("OK", { status: 200 });
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Store raw event for audit
      const eventHash = await hashEvent(rawBody);
      await supabase.from("webhook_events").insert({
        source: "whatsapp",
        payload: body,
        raw_body: rawBody.length > 50000 ? null : rawBody,
        signature: req.headers.get("x-hub-signature-256") || null,
        event_hash: eventHash,
      }).then(({ error }) => {
        if (error) console.warn("Failed to store webhook event:", error.message);
      });

      const entries = body.entry || [];
      let messagesProcessed = 0;
      let statusesProcessed = 0;
      let errorsCount = 0;

      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field !== "messages") continue;

          const value = change.value;
          const metadata = value.metadata || {};
          const phoneNumberId = metadata.phone_number_id;
          const messages = value.messages || [];
          const statuses = value.statuses || [];
          const contacts = value.contacts || [];
          const errors = value.errors || [];

          // ─── Handle Errors ───
          for (const err of errors) {
            console.error("WhatsApp API error:", JSON.stringify(err));
            errorsCount++;
          }

          // ─── Handle Incoming Messages ───
          for (const message of messages) {
            // Deduplication
            if (isDuplicate(message.id)) {
              console.log(`⏭️ Skipping duplicate message: ${message.id}`);
              continue;
            }

            // Rate limiting
            if (isRateLimited(message.from)) {
              console.warn(`⚠️ Rate limited: ${message.from}`);
              continue;
            }

            const contactName = contacts.find((c: any) => c.wa_id === message.from)?.profile?.name || null;
            const { content, mediaUrl, mediaMime } = extractContent(message);

            try {
              const { error: insertErr } = await supabase.from("whatsapp_messages").insert({
                wa_message_id: message.id,
                phone_number: message.from,
                customer_name: contactName,
                direction: "inbound",
                message_type: message.type,
                content,
                media_url: mediaUrl,
                media_mime_type: mediaMime,
                status: "received",
              });

              if (insertErr) {
                // Could be duplicate constraint
                if (insertErr.code === "23505") {
                  console.log(`⏭️ Message already exists: ${message.id}`);
                } else {
                  console.error("Insert error:", insertErr.message);
                  errorsCount++;
                }
              } else {
                messagesProcessed++;
                console.log(`📩 Stored message from ${message.from} (${message.type})`);
              }

              // Download and store media if applicable
              if (mediaUrl && message.type !== "text") {
                try {
                  await downloadAndStoreMedia(supabase, mediaUrl, mediaMime, message, phoneNumberId);
                } catch (mediaErr) {
                  console.error("Media download error:", mediaErr);
                }
              }
            } catch (err) {
              console.error("Message processing error:", err);
              errorsCount++;
            }
          }

          // ─── Handle Status Updates ───
          for (const status of statuses) {
            if (!status.id) continue;

            try {
              const { error: updateErr } = await supabase
                .from("whatsapp_messages")
                .update({ status: status.status })
                .eq("wa_message_id", status.id);

              if (!updateErr) {
                statusesProcessed++;
              }

              // Update quotation notification status if applicable
              if (status.status === "delivered" || status.status === "read" || status.status === "failed") {
                await supabase
                  .from("quotation_notifications")
                  .update({ status: status.status })
                  .eq("wa_message_id", status.id);
              }

              // Handle failures with error info
              if (status.status === "failed" && status.errors?.length) {
                console.error(`❌ Message ${status.id} failed:`, JSON.stringify(status.errors));
              }
            } catch (err) {
              console.error("Status update error:", err);
              errorsCount++;
            }
          }
        }
      }

      console.log(`✅ Webhook processed: ${messagesProcessed} msgs, ${statusesProcessed} statuses, ${errorsCount} errors`);

      return new Response(
        JSON.stringify({ success: true, messages: messagesProcessed, statuses: statusesProcessed, errors: errorsCount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error: unknown) {
      console.error("❌ Webhook processing error:", error);
      // Always return 200 to Meta to prevent retry storms
      return new Response(
        JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers: corsHeaders });
});

// Hash event body for dedup in webhook_events
async function hashEvent(body: string): Promise<string> {
  const data = new TextEncoder().encode(body);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 64);
}

// Download media from WhatsApp and store in Supabase Storage
async function downloadAndStoreMedia(
  supabase: any,
  mediaId: string,
  mimeType: string | null,
  message: any,
  phoneNumberId: string
) {
  const waToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  if (!waToken) return;

  // Get media URL from WhatsApp
  const mediaResp = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${waToken}` },
  });

  if (!mediaResp.ok) {
    console.error("Failed to get media URL:", mediaResp.status);
    return;
  }

  const mediaData = await mediaResp.json();
  const downloadUrl = mediaData.url;
  if (!downloadUrl) return;

  // Download the actual file
  const fileResp = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${waToken}` },
  });

  if (!fileResp.ok) {
    console.error("Failed to download media:", fileResp.status);
    return;
  }

  const fileBuffer = await fileResp.arrayBuffer();
  const ext = getExtFromMime(mimeType || "application/octet-stream");
  const filePath = `whatsapp/${message.from}/${message.id}${ext}`;

  // Upload to Supabase Storage
  const { error: uploadErr } = await supabase.storage
    .from("media")
    .upload(filePath, fileBuffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: true,
    });

  if (uploadErr) {
    console.error("Storage upload error:", uploadErr.message);
    return;
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath);

  // Update the message with the stored media URL
  await supabase
    .from("whatsapp_messages")
    .update({ media_url: urlData.publicUrl })
    .eq("wa_message_id", message.id);

  console.log(`📎 Media stored: ${filePath}`);
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
    "video/mp4": ".mp4", "audio/ogg": ".ogg", "audio/mpeg": ".mp3",
    "application/pdf": ".pdf", "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  };
  return map[mime] || ".bin";
}
