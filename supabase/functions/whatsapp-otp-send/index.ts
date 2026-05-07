import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

async function hashOtp(otp: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone_number } = await req.json();

    if (!phone_number || !/^\+?\d{10,15}$/.test(phone_number.replace(/[\s-]/g, ""))) {
      return new Response(
        JSON.stringify({ error: "رقم هاتف غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = phone_number.replace(/[\s+]/g, "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!whatsappToken || !phoneNumberId) {
      console.error("Missing WhatsApp credentials");
      return new Response(
        JSON.stringify({ error: "خطأ في إعداد النظام" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Rate limit: max 3 OTPs per phone per 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone_number", cleanPhone)
      .gte("created_at", tenMinAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "تم تجاوز عدد المحاولات، حاول بعد 10 دقائق" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Generate a unique salt and hash the OTP before storing
    const salt = crypto.randomUUID();
    const hashedOtp = await hashOtp(otp, salt);

    // Store hashed OTP with salt
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone_number: cleanPhone,
      otp_code: `${salt}:${hashedOtp}`,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("OTP insert error:", insertError.message);
      return new Response(
        JSON.stringify({ error: "خطأ في حفظ رمز التحقق" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authentication category template: requires body param + button (OTP copy code) param
    const templateName = Deno.env.get("WHATSAPP_OTP_TEMPLATE_NAME") || "delivery_code";
    const templateLang = Deno.env.get("WHATSAPP_OTP_TEMPLATE_LANG") || "en_US";

    const waResponse = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: otp }],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: otp }],
            },
          ],
        },
      }),
    });

    const waData = await waResponse.json();

    if (!waResponse.ok) {
      console.error("WhatsApp OTP delivery failed:", JSON.stringify({ template: templateName, language: templateLang, error: waData }));
      return new Response(
        JSON.stringify({
          error: "فشل إرسال رمز التحقق عبر واتساب. تأكد من اسم القالب ولغته وحالة الموافقة.",
          details: waData,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent to ${cleanPhone.slice(-4)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إرسال رمز التحقق عبر واتساب",
        expires_in: 300,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("OTP send error:", err);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
