const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getSupabaseAdmin() {
  if (supabaseAdmin) {
    return supabaseAdmin;
  }

  const supabaseUrl = normalizeString(process.env.SUPABASE_URL);
  const serviceRoleKey = normalizeString(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdmin;
}

async function loadAppSecrets(keys) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !Array.isArray(keys) || keys.length === 0) {
    return {};
  }

  const normalizedKeys = Array.from(
    new Set(keys.map((key) => normalizeString(key)).filter(Boolean))
  );
  if (normalizedKeys.length === 0) {
    return {};
  }

  const { data, error } = await supabase
    .from('app_secrets')
    .select('key, value')
    .in('key', normalizedKeys);

  if (error) {
    throw new Error(`Failed to load app_secrets: ${error.message}`);
  }

  const map = {};
  for (const row of data || []) {
    map[row.key] = row.value;
  }

  return map;
}

function buildEventHash(source, rawBody) {
  return crypto
    .createHash('sha256')
    .update(`${normalizeString(source)}:${rawBody || ''}`)
    .digest('hex');
}

async function getSupabaseStatus() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { connected: false, error: 'Supabase admin client is not configured' };
  }

  const { error } = await supabase
    .from('webhook_events')
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (error) {
    return { connected: false, error: error.message };
  }

  return { connected: true, error: null };
}

async function storeWebhookEvent({ source, payload, rawBody = null, signature = null }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { stored: false, reason: 'Supabase admin client is not configured' };
  }

  const bodyString =
    typeof rawBody === 'string'
      ? rawBody
      : rawBody
        ? JSON.stringify(rawBody)
        : JSON.stringify(payload || {});
  const eventHash = buildEventHash(source, bodyString);

  const { error } = await supabase.from('webhook_events').insert({
    source: normalizeString(source) || 'unknown',
    payload: payload || {},
    raw_body: bodyString.length > 50000 ? null : bodyString,
    signature: signature || null,
    event_hash: eventHash,
  });

  if (error) {
    throw new Error(`Failed to store webhook event: ${error.message}`);
  }

  return { stored: true, eventHash };
}

module.exports = {
  getSupabaseAdmin,
  loadAppSecrets,
  getSupabaseStatus,
  storeWebhookEvent,
};
