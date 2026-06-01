// Create notification endpoint
// Allows ANY external system (Express server, n8n, webhooks, etc.) to push
// notifications into the admin dashboard via a shared secret OR an admin JWT.
//
// POST https://<project>.functions.supabase.co/create-notification
// Headers: { x-notify-secret: NOTIFY_INGEST_SECRET }  OR  Authorization: Bearer <admin-jwt>
// Body: { title, message?, severity?, source?, link?, metadata? }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const INGEST_SECRET = Deno.env.get('NOTIFY_INGEST_SECRET') || '';

const ALLOWED_SEVERITY = new Set(['info', 'success', 'warning', 'error']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // ── Auth: shared secret OR admin JWT ──
    let authorized = false;
    const providedSecret = req.headers.get('x-notify-secret');
    if (INGEST_SECRET && providedSecret && providedSecret === INGEST_SECRET) {
      authorized = true;
    } else {
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const userClient = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: isAdmin } = await userClient.rpc('is_admin');
          if (isAdmin) authorized = true;
        }
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Validate body ──
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || '').trim();
    if (!title || title.length > 255) {
      return new Response(
        JSON.stringify({ error: 'title is required (1–255 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const severity = ALLOWED_SEVERITY.has(body.severity) ? body.severity : 'info';
    const message = body.message ? String(body.message).slice(0, 2000) : null;
    const source = body.source ? String(body.source).slice(0, 64) : 'system';
    const link = body.link ? String(body.link).slice(0, 500) : null;
    const metadata = typeof body.metadata === 'object' && body.metadata ? body.metadata : {};

    // ── Insert with service role ──
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data, error } = await admin
      .from('admin_notifications')
      .insert({ title, message, severity, source, link, metadata })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, notification: data }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
