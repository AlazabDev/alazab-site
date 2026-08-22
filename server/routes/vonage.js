/**
 * Signed Vonage callbacks and read-only webhook endpoints.
 * Callback JWTs are Vonage-generated HS256 tokens, never application JWTs.
 */
'use strict';

const crypto = require('crypto');
const express = require('express');
const logger = require('../logger');
const { getSupabaseAdmin, storeWebhookEvent } = require('../supabase');

const router = express.Router();

function bearerToken(header) {
  const match = /^Bearer\s+([^\s]+)$/i.exec(String(header || '').trim());
  return match ? match[1] : null;
}

function decodePart(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function verifyHs256(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = decodePart(parts[0]);
    const claims = decodePart(parts[1]);
    if (header.alg !== 'HS256' || header.typ && header.typ !== 'JWT') return null;

    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest();
    const supplied = Buffer.from(parts[2], 'base64url');
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
    if (claims.exp !== undefined && (!Number.isFinite(claims.exp) || claims.exp < nowSeconds)) return null;
    if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > nowSeconds + 30)) return null;
    return claims;
  } catch {
    return null;
  }
}

function verifyVonageJwt(req, res, next) {
  const secret = String(process.env.VONAGE_SIGNATURE_SECRET || '').trim();
  if (!secret) {
    logger.error('[Vonage] VONAGE_SIGNATURE_SECRET is not configured');
    return res.status(503).json({ error: 'Vonage webhook verification is unavailable' });
  }

  const token = bearerToken(req.get('authorization'));
  if (!token) return res.status(401).json({ error: 'Missing Vonage signed JWT' });

  const claims = verifyHs256(token, secret);
  if (!claims) return res.status(401).json({ error: 'Invalid Vonage signed JWT' });

  req.vonageJwt = claims;
  req.vonageSignatureHash = crypto.createHash('sha256').update(token).digest('hex');
  return next();
}

function firstValue(payload, keys) {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function requestPayload(req) {
  return req.method === 'GET' ? { ...req.query } : (req.body || {});
}

function clientIp(req) {
  return String(req.ip || req.socket?.remoteAddress || '').slice(0, 255) || null;
}

function uuidOrNull(value) {
  const normalized = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)
    ? normalized
    : null;
}

function describeEvent(product, eventType, status) {
  return `Vonage ${product} ${eventType}${status ? ` (${status})` : ''}`.slice(0, 1000);
}

async function persistCallback(req, product) {
  const payload = requestPayload(req);
  const eventType = String(firstValue(payload, ['type', 'event_type', 'status']) || 'event');
  const statusValue = firstValue(payload, ['status', 'request_status']);
  const status = statusValue === null ? 'received' : String(statusValue);
  const source = `vonage_${product}`;
  const detail = {
    provider: 'vonage',
    product,
    event_type: eventType,
    status,
    jwt_id: req.vonageJwt?.jti || null,
    jwt_issuer: req.vonageJwt?.iss || null,
    payload,
  };
  const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(payload);
  const webhook = await storeWebhookEvent({
    source,
    payload: detail,
    rawBody,
    signature: `sha256:${req.vonageSignatureHash}`,
  });
  if (!webhook.eventHash) throw new Error('Webhook event persistence is unavailable');

  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client is not configured');
  const actorId = firstValue(payload, ['user_id', 'member_id', 'from', 'msisdn', 'request_id']);
  const actorEmail = firstValue(payload, ['email', 'actor_email']);
  const { data, error } = await supabase
    .from('adp_security_events')
    .upsert({
      category: `vonage_${product}`,
      event_type: eventType,
      status,
      actor_id: uuidOrNull(actorId),
      actor_email: actorEmail === null ? null : String(actorEmail),
      description: describeEvent(product, eventType, status),
      detail,
      ip_address: clientIp(req),
      user_agent: String(req.get('user-agent') || '').slice(0, 1000) || null,
      webhook_event_hash: webhook.eventHash,
    }, { onConflict: 'webhook_event_hash', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(`Failed to store security event: ${error.message}`);

  return { duplicate: !Array.isArray(data) || data.length === 0 };
}

function callback(product) {
  return async (req, res, next) => {
    try {
      const result = await persistCallback(req, product);
      return res.status(200).json({ ok: true, duplicate: result.duplicate });
    } catch (error) {
      return next(error);
    }
  };
}

function ncco(text) {
  return [{ action: 'talk', text, language: 'en-US', style: 0 }];
}

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'azvonage',
    signature_verification: Boolean(process.env.VONAGE_SIGNATURE_SECRET),
    database: Boolean(getSupabaseAdmin()),
    timestamp: new Date().toISOString(),
  });
});

router.get('/voice/answer', verifyVonageJwt, (_req, res) => res.json(ncco('Welcome to Alazab.')));
router.post('/voice/event', verifyVonageJwt, callback('voice'));
router.get('/voice/fallback', verifyVonageJwt, (_req, res) => res.json(ncco('We cannot connect your call right now. Please try again later.')));

router.post('/messages/inbound', verifyVonageJwt, callback('messages_inbound'));
router.post('/messages/status', verifyVonageJwt, callback('messages_status'));
router.post('/rtc/event', verifyVonageJwt, callback('rtc'));

for (const endpoint of ['session', 'recording', 'broadcast', 'composer', 'captions', 'sip']) {
  router.post(`/video/${endpoint}`, verifyVonageJwt, callback(`video_${endpoint}`));
}

router.post('/verify/status', verifyVonageJwt, callback('verify'));

// This is the browser/network redirect target, not a signed webhook.
router.get('/verify/callback', (req, res) => {
  res.status(200).json({ ok: true, status: firstValue(req.query, ['status']) });
});

module.exports = router;
module.exports._test = { bearerToken, verifyHs256, verifyVonageJwt, firstValue, uuidOrNull, ncco };
