'use strict';

const crypto = require('crypto');

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function rawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (Buffer.isBuffer(req.body)) return req.body;
  return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
}

function hmacHex(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function verifyMeta(req, secret) {
  if (!secret) return { ok: false, reason: 'meta_secret_missing' };
  const received = String(req.headers['x-hub-signature-256'] || '');
  if (!received.startsWith('sha256=')) return { ok: false, reason: 'meta_signature_missing' };
  const expected = `sha256=${hmacHex(secret, rawBody(req))}`;
  return { ok: safeEqual(received, expected), reason: safeEqual(received, expected) ? 'ok' : 'meta_signature_invalid' };
}

function verifyGitHub(req, secret) {
  if (!secret) return { ok: false, reason: 'github_secret_missing' };
  const received = String(req.headers['x-hub-signature-256'] || '');
  if (!received.startsWith('sha256=')) return { ok: false, reason: 'github_signature_missing' };
  const expected = `sha256=${hmacHex(secret, rawBody(req))}`;
  return { ok: safeEqual(received, expected), reason: safeEqual(received, expected) ? 'ok' : 'github_signature_invalid' };
}

function sourceSecrets() {
  try {
    return JSON.parse(process.env.CENTRAL_WEBHOOK_SOURCE_SECRETS_JSON || '{}');
  } catch {
    return {};
  }
}

function verifyGeneric(req, source) {
  const secrets = sourceSecrets();
  const secret = secrets[source] || process.env.CENTRAL_WEBHOOK_SECRET;
  if (!secret) return { ok: false, reason: 'source_secret_missing' };

  const timestamp = String(req.headers['x-azab-timestamp'] || '');
  const signature = String(req.headers['x-azab-signature'] || '');
  if (!timestamp || !signature) return { ok: false, reason: 'signature_headers_missing' };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'timestamp_invalid' };
  const now = Math.floor(Date.now() / 1000);
  const skew = Number(process.env.CENTRAL_WEBHOOK_MAX_SKEW_SECONDS || 300);
  if (Math.abs(now - ts) > skew) return { ok: false, reason: 'timestamp_expired' };

  const body = rawBody(req);
  const signed = Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), body]);
  const expected = `sha256=${hmacHex(secret, signed)}`;
  return { ok: safeEqual(signature, expected), reason: safeEqual(signature, expected) ? 'ok' : 'signature_invalid' };
}

module.exports = { verifyMeta, verifyGitHub, verifyGeneric, rawBody, safeEqual };
