import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, media_url, media_type, caption, customer_name } = await req.json();

    if (!phone || !media_url || !media_type) {
      return new Response(
        JSON.stringify({ error: 'بيانات ناقصة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('0')) cleanPhone = '20' + cleanPhone.substring(1);

    if (!/^\d{10,15}$/.test(cleanPhone)) {
      return new Response(
        JSON.stringify({ error: 'رقم هاتف غير صالح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        JSON.stringify({ error: 'لم يتم إعداد حساب واتساب' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build media message body
    const typeMap: Record<string, string> = {
      image: 'image',
      video: 'video',
      audio: 'audio',
      document: 'document',
    };

    const waType = typeMap[media_type] || 'document';
    const mediaBody: Record<string, string> = { link: media_url };
    if (caption && (waType === 'image' || waType === 'video' || waType === 'document')) {
      mediaBody.caption = caption;
    }
    if (waType === 'document') {
      mediaBody.filename = caption || 'file';
    }

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
          type: waType,
          [waType]: mediaBody,
        }),
      }
    );

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error('WhatsApp API error:', waResult);
      return new Response(
        JSON.stringify({ error: 'فشل إرسال الملف' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const messageId = waResult.messages?.[0]?.id;

    await supabase.from('whatsapp_messages').insert({
      wa_message_id: messageId,
      phone_number: cleanPhone,
      customer_name: customer_name || null,
      direction: 'outbound',
      message_type: waType,
      content: caption || `[${waType}]`,
      media_url: media_url,
      media_mime_type: media_type,
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
