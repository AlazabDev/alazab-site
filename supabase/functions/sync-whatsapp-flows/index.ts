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

    const { data: secrets } = await supabase
      .from('app_secrets')
      .select('key, value')
      .in('key', ['WHATSAPP_ACCESS_TOKEN', 'WABA_ID']);

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

    // Fetch flows from Meta Graph API
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(wabaId)}/flows?limit=100`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta API error:', result);
      return new Response(
        JSON.stringify({ error: 'فشل جلب التدفقات من Meta', details: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const flows = result.data || [];
    let synced = 0;

    for (const flow of flows) {
      const { error } = await supabase
        .from('whatsapp_flows')
        .upsert({
          wa_flow_id: flow.id,
          name: flow.name,
          status: flow.status,
          categories: flow.categories || [],
          validation_errors: flow.validation_errors || null,
          json_version: flow.json_version || null,
          preview_url: flow.preview?.preview_url || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'wa_flow_id' });

      if (!error) synced++;
    }

    return new Response(
      JSON.stringify({ success: true, synced, total: flows.length }),
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
