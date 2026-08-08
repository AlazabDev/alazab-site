import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

async function hashOtp(otp: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp + salt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone_number, otp_code } = await req.json();
    if (!phone_number || !otp_code) {
      return new Response(JSON.stringify({ error: "رقم الهاتف ورمز التحقق مطلوبان" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^\d{6}$/.test(otp_code)) {
      return new Response(JSON.stringify({ error: "رمز التحقق يجب أن يكون 6 أرقام" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanPhone = phone_number.replace(/[\s+]/g, "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id, phone_number, otp_code, expires_at, verified, attempts, created_at")
      .eq("phone_number", cleanPhone)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !otpRecord) {
      return new Response(JSON.stringify({ error: "رمز التحقق منتهي الصلاحية أو غير موجود" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (otpRecord.attempts >= 5) {
      return new Response(JSON.stringify({ error: "تم تجاوز عدد المحاولات المسموحة" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nextAttempts = otpRecord.attempts + 1;
    const { data: attemptUpdate, error: attemptError } = await supabase
      .from("otp_codes")
      .update({ attempts: nextAttempts })
      .eq("id", otpRecord.id)
      .eq("attempts", otpRecord.attempts)
      .select("id")
      .maybeSingle();

    if (attemptError || !attemptUpdate) {
      return new Response(JSON.stringify({ error: "تعذر التحقق من الرمز، حاول مرة أخرى" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [salt, storedHash] = String(otpRecord.otp_code).split(":");
    if (!salt || !storedHash) {
      console.error("Rejected legacy or malformed OTP record", otpRecord.id);
      await supabase.from("otp_codes").delete().eq("id", otpRecord.id);
      return new Response(JSON.stringify({ error: "رمز التحقق غير صالح، اطلب رمزاً جديداً" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputHash = await hashOtp(otp_code, salt);
    if (inputHash !== storedHash) {
      return new Response(JSON.stringify({ error: "رمز التحقق غير صحيح", remaining_attempts: 5 - nextAttempts }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: consumed, error: consumeError } = await supabase
      .from("otp_codes")
      .update({ verified: true })
      .eq("id", otpRecord.id)
      .eq("verified", false)
      .select("id")
      .maybeSingle();

    if (consumeError || !consumed) {
      return new Response(JSON.stringify({ error: "تم استخدام رمز التحقق بالفعل" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = `${cleanPhone}@whatsapp.alazab.com`;
    let existingUser = null;
    const perPage = 1000;
    for (let page = 1; page <= 20; page += 1) {
      const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({ page, perPage });
      if (listError) throw listError;
      existingUser = pageData.users.find((u) => u.email === email) || null;
      if (existingUser || pageData.users.length < perPage) break;
    }

    let user = existingUser;
    if (!user) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { phone: cleanPhone, auth_method: "whatsapp_otp" },
      });
      if (createError || !newUser.user) {
        console.error("Create user error:", createError?.message);
        return new Response(JSON.stringify({ error: "خطأ في إنشاء الحساب" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = newUser.user;
    }

    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (tokenError || !tokenData?.properties?.hashed_token) {
      console.error("Token generation error:", tokenError?.message);
      return new Response(JSON.stringify({ error: "خطأ في إنشاء الجلسة" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("otp_codes").delete().eq("phone_number", cleanPhone).eq("verified", true);
    console.log(`OTP verified for ${cleanPhone.slice(-4)}`);

    return new Response(JSON.stringify({
      success: true,
      message: "تم التحقق بنجاح",
      user_id: user.id,
      token_hash: tokenData.properties.hashed_token,
      verification_type: tokenData.properties.verification_type,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("OTP verify error:", err);
    return new Response(JSON.stringify({ error: "حدث خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
