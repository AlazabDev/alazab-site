import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: simple in-memory tracker
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max messages per window
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(phone);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(phone, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, customer_name } = await req.json();

    // Input validation
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'رقم الهاتف والرسالة مطلوبان' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate types
    if (typeof phone !== 'string' || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'بيانات غير صالحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Message length limit
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    let cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    }
    
    // Strict phone validation
    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'رقم هاتف غير صالح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting
    if (isRateLimited(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'تم تجاوز الحد المسموح. حاول مرة أخرى بعد دقيقة.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize customer name
    const safeName = customer_name
      ? String(customer_name).replace(/[<>"';]/g, '').substring(0, 100)
      : null;

    // Get WhatsApp credentials from app_secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: secrets } = await supabase
      .from('app_secrets')
      .select('key, value')
      .in('key', ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']);

    const secretsMap: Record<string, string> = {};
    secrets?.forEach((s: { key: string; value: string }) => { secretsMap[s.key] = s.value; });

    const accessToken = secretsMap['WHATSAPP_ACCESS_TOKEN'];
    const phoneNumberId = secretsMap['WHATSAPP_PHONE_NUMBER_ID'];

    if (!accessToken || !phoneNumberId) {
      return new Response(
        JSON.stringify({ error: 'لم يتم إعداد حساب واتساب للأعمال بعد' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send message via WhatsApp Cloud API
    const waResponse = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error('WhatsApp API error:', waResult);
      return new Response(
        JSON.stringify({ error: 'فشل إرسال الرسالة' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageId = waResult.messages?.[0]?.id;

    await supabase.from('whatsapp_messages').insert({
      wa_message_id: messageId,
      phone_number: cleanPhone,
      customer_name: safeName,
      direction: 'outbound',
      message_type: 'text',
      content: message,
      status: 'sent',
    });

    return new Response(
      JSON.stringify({ success: true, message_id: messageId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'حدث خطأ داخلي' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
