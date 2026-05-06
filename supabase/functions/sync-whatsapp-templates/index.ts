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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get credentials from app_secrets
    const { data: secrets } = await supabase
      .from('app_secrets')
      .select('key, value')
      .in('key', ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WABA_ID']);

    const secretsMap: Record<string, string> = {};
    secrets?.forEach((s: { key: string; value: string }) => { secretsMap[s.key] = s.value; });

    const accessToken = secretsMap['WHATSAPP_ACCESS_TOKEN'];
    const wabaId = secretsMap['WABA_ID'];

    if (!accessToken || !wabaId) {
      return new Response(
        JSON.stringify({ error: 'بيانات واتساب غير مكتملة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch templates from Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(wabaId)}/message_templates?limit=100`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta API error:', result);
      return new Response(
        JSON.stringify({ error: 'فشل جلب القوالب من Meta', details: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const templates = result.data || [];
    let synced = 0;

    for (const tpl of templates) {
      const phoneNumberId = secretsMap['WHATSAPP_PHONE_NUMBER_ID'] || 'default';
      const components = tpl.components || [];
      const bodyComponent = components.find((c: Record<string, string>) => c.type === 'BODY');
      const variablesCount = bodyComponent?.example?.body_text?.[0]?.length || 0;

      const { error } = await supabase
        .from('templates')
        .upsert({
          wa_template_name: tpl.name,
          wa_template_code: tpl.id,
          status: tpl.status,
          category: tpl.category,
          language: tpl.language,
          phone_number_id: phoneNumberId,
          preview_text: bodyComponent?.text || null,
          variables_count: variablesCount,
        }, { onConflict: 'wa_template_code' });

      if (!error) synced++;
    }

    return new Response(
      JSON.stringify({ success: true, synced, total: templates.length }),
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
