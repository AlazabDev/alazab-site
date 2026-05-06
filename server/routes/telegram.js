const express = require('express');
const crypto = require('crypto');

const router = express.Router();

/**
 * =========================================================
 * Telegram OIDC configuration
 * =========================================================
 */
const TELEGRAM_OIDC_ISSUER = 'https://oauth.telegram.org';
const TELEGRAM_AUTH_URL = 'https://oauth.telegram.org/auth';
const TELEGRAM_TOKEN_URL = 'https://oauth.telegram.org/token';
const TELEGRAM_JWKS_URL = 'https://oauth.telegram.org/.well-known/jwks.json';

const TELEGRAM_CLIENT_ID = String(process.env.TELEGRAM_CLIENT_ID || '').trim();
const TELEGRAM_CLIENT_SECRET = String(process.env.TELEGRAM_CLIENT_SECRET || '').trim();
const TELEGRAM_REDIRECT_URI = String(
  process.env.TELEGRAM_REDIRECT_URI || 'https://alazab.com/api/auth/telegram/callback'
).trim();

const FRONTEND_URL = String(process.env.FRONTEND_URL || 'https://alazab.com').trim();
const TELEGRAM_SCOPES = String(
  process.env.TELEGRAM_SCOPES || 'openid profile phone telegram:bot_access'
).trim();

const COOKIE_PREFIX = 'tg_oidc_';
const COOKIE_STATE = `${COOKIE_PREFIX}state`;
const COOKIE_VERIFIER = `${COOKIE_PREFIX}verifier`;
const COOKIE_NONCE = `${COOKIE_PREFIX}nonce`;
const COOKIE_MAX_AGE = 10 * 60; // 10 minutes

/**
 * =========================================================
 * Supabase client resolution
 * يعتمد على ملف ../supabase.js الموجود عندك
 * =========================================================
 */
let supabase;
try {
  const supabaseModule = require('../supabase');
  supabase =
    supabaseModule?.supabaseAdmin ||
    supabaseModule?.admin ||
    supabaseModule?.supabase ||
    supabaseModule?.client ||
    supabaseModule;
} catch (err) {
  console.error('[telegram] failed to load ../supabase.js:', err.message);
}

function ensureSupabase() {
  if (!supabase || typeof supabase.from !== 'function') {
    throw new Error('Supabase client is not available. Check ../supabase.js export.');
  }
}

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
function base64UrlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(normalized + padding, 'base64');
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest();
}

function randomString(size = 32) {
  return base64UrlEncode(crypto.randomBytes(size));
}

function toUnix(date) {
  return Math.floor(date.getTime() / 1000);
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};

  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) return;
    out[key] = decodeURIComponent(value);
  });

  return out;
}

function setCookie(res, name, value, maxAgeSeconds = COOKIE_MAX_AGE) {
  const isSecure = TELEGRAM_REDIRECT_URI.startsWith('https://');
  const cookie = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
    `Max-Age=${maxAgeSeconds}`,
  ]
    .filter(Boolean)
    .join('; ');

  res.append('Set-Cookie', cookie);
}

function clearCookie(res, name) {
  const isSecure = TELEGRAM_REDIRECT_URI.startsWith('https://');
  const cookie = [
    `${name}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isSecure ? 'Secure' : '',
    'Max-Age=0',
  ]
    .filter(Boolean)
    .join('; ');

  res.append('Set-Cookie', cookie);
}

function clearTelegramCookies(res) {
  clearCookie(res, COOKIE_STATE);
  clearCookie(res, COOKIE_VERIFIER);
  clearCookie(res, COOKIE_NONCE);
}

function buildTelegramAuthUrl({ state, codeChallenge, nonce }) {
  const url = new URL(TELEGRAM_AUTH_URL);

  url.searchParams.set('client_id', TELEGRAM_CLIENT_ID);
  url.searchParams.set('redirect_uri', TELEGRAM_REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', TELEGRAM_SCOPES);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return url.toString();
}

function buildBasicAuthHeader(clientId, clientSecret) {
  const raw = `${clientId}:${clientSecret}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}

async function exchangeCodeForTokens({ code, codeVerifier }) {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('redirect_uri', TELEGRAM_REDIRECT_URI);
  body.set('client_id', TELEGRAM_CLIENT_ID);
  body.set('code_verifier', codeVerifier);

  const response = await fetch(TELEGRAM_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: buildBasicAuthHeader(TELEGRAM_CLIENT_ID, TELEGRAM_CLIENT_SECRET),
    },
    body: body.toString(),
  });

  const rawText = await response.text();
  let payload = null;

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { raw: rawText };
  }

  if (!response.ok) {
    const err = new Error('Telegram token exchange failed');
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return payload;
}

let jwksCache = {
  fetchedAt: 0,
  keys: [],
};

async function fetchJwks() {
  const now = Date.now();
  const cacheAge = 10 * 60 * 1000; // 10 min

  if (jwksCache.keys.length > 0 && now - jwksCache.fetchedAt < cacheAge) {
    return jwksCache.keys;
  }

  const response = await fetch(TELEGRAM_JWKS_URL, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: HTTP ${response.status}`);
  }

  const data = await response.json();
  const keys = Array.isArray(data?.keys) ? data.keys : [];

  if (!keys.length) {
    throw new Error('JWKS response does not contain keys');
  }

  jwksCache = {
    fetchedAt: now,
    keys,
  };

  return keys;
}

function decodeJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf8'));
  const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
  const signature = base64UrlDecode(encodedSignature);
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  return {
    header,
    payload,
    signature,
    signingInput,
  };
}

async function validateIdToken(idToken, expectedNonce) {
  const { header, payload, signature, signingInput } = decodeJwt(idToken);

  if (!header?.kid) {
    throw new Error('Missing kid in ID token header');
  }

  if (!header?.alg) {
    throw new Error('Missing alg in ID token header');
  }

  if (!['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'].includes(header.alg)) {
    throw new Error(`Unsupported JWT alg: ${header.alg}`);
  }

  const keys = await fetchJwks();
  const jwk = keys.find((k) => k.kid === header.kid);

  if (!jwk) {
    throw new Error(`No matching JWK found for kid=${header.kid}`);
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });

  let verifyAlgorithm;
  switch (header.alg) {
    case 'RS256':
      verifyAlgorithm = 'RSA-SHA256';
      break;
    case 'RS384':
      verifyAlgorithm = 'RSA-SHA384';
      break;
    case 'RS512':
      verifyAlgorithm = 'RSA-SHA512';
      break;
    case 'ES256':
      verifyAlgorithm = 'sha256';
      break;
    case 'ES384':
      verifyAlgorithm = 'sha384';
      break;
    case 'ES512':
      verifyAlgorithm = 'sha512';
      break;
    default:
      throw new Error(`Unsupported verification algorithm: ${header.alg}`);
  }

  const isValidSignature = crypto.verify(
    verifyAlgorithm,
    Buffer.from(signingInput),
    publicKey,
    signature
  );

  if (!isValidSignature) {
    throw new Error('Invalid ID token signature');
  }

  const now = toUnix(new Date());

  if (payload.iss !== TELEGRAM_OIDC_ISSUER) {
    throw new Error(`Invalid issuer: ${payload.iss}`);
  }

  if (String(payload.aud) !== String(TELEGRAM_CLIENT_ID)) {
    throw new Error(`Invalid audience: ${payload.aud}`);
  }

  if (!payload.exp || Number(payload.exp) < now) {
    throw new Error('ID token expired');
  }

  if (payload.nbf && Number(payload.nbf) > now) {
    throw new Error('ID token is not active yet (nbf)');
  }

  if (expectedNonce && payload.nonce && payload.nonce !== expectedNonce) {
    throw new Error('Invalid nonce');
  }

  return payload;
}

function buildFrontendRedirect(path, query = {}) {
  const url = new URL(path, FRONTEND_URL);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function normalizeTelegramProfile(claims, tokenResponse) {
  const nowIso = new Date().toISOString();
  const expiresIn = Number(tokenResponse?.expires_in || 3600);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return {
    provider: 'telegram',
    provider_user_id: String(claims.sub || claims.id || ''),
    telegram_id: claims.id ? String(claims.id) : null,
    telegram_sub: claims.sub ? String(claims.sub) : null,
    name: claims.name || null,
    username: claims.preferred_username || null,
    photo_url: claims.picture || null,
    phone_number: claims.phone_number || null,
    access_token: tokenResponse?.access_token || null,
    id_token: tokenResponse?.id_token || null,
    token_type: tokenResponse?.token_type || 'Bearer',
    token_expires_at: tokenExpiresAt,
    auth_time: claims.auth_date || null,
    last_login_at: nowIso,
    raw_user: claims,
    updated_at: nowIso,
  };
}

async function upsertUser(userData) {
  ensureSupabase();

  const payload = {
    provider: userData.provider,
    provider_user_id: userData.provider_user_id,
    telegram_id: userData.telegram_id,
    telegram_sub: userData.telegram_sub,
    name: userData.name,
    username: userData.username,
    photo_url: userData.photo_url,
    phone_number: userData.phone_number,
    access_token: userData.access_token,
    id_token: userData.id_token,
    token_type: userData.token_type,
    token_expires_at: userData.token_expires_at,
    auth_time: userData.auth_time,
    last_login_at: userData.last_login_at,
    raw_user: userData.raw_user,
    updated_at: userData.updated_at,
  };

  const { data, error } = await supabase
    .from('users')
    .upsert(payload, {
      onConflict: 'provider,provider_user_id',
      ignoreDuplicates: false,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  return data;
}

/**
 * =========================================================
 * Health / debug
 * =========================================================
 */
router.get('/auth/telegram/health', async (_req, res) => {
  return res.json({
    ok: true,
    provider: 'telegram',
    oidc_issuer: TELEGRAM_OIDC_ISSUER,
    redirect_uri: TELEGRAM_REDIRECT_URI,
    client_id_present: Boolean(TELEGRAM_CLIENT_ID),
    client_secret_present: Boolean(TELEGRAM_CLIENT_SECRET),
  });
});

/**
 * =========================================================
 * Start login
 * افتح هذا المسار من الزر أو الواجهة:
 * /api/auth/telegram/start
 * =========================================================
 */
router.get('/auth/telegram/start', async (req, res) => {
  try {
    if (!TELEGRAM_CLIENT_ID || !TELEGRAM_CLIENT_SECRET || !TELEGRAM_REDIRECT_URI) {
      return res.status(500).json({
        ok: false,
        error: 'Telegram OIDC env vars are missing',
      });
    }

    const state = randomString(24);
    const verifier = randomString(48);
    const nonce = randomString(24);
    const challenge = base64UrlEncode(sha256(verifier));

    setCookie(res, COOKIE_STATE, state);
    setCookie(res, COOKIE_VERIFIER, verifier);
    setCookie(res, COOKIE_NONCE, nonce);

    const authUrl = buildTelegramAuthUrl({
      state,
      codeChallenge: challenge,
      nonce,
    });

    if ((req.headers.accept || '').includes('application/json')) {
      return res.json({
        ok: true,
        auth_url: authUrl,
      });
    }

    return res.redirect(authUrl);
  } catch (err) {
    console.error('[telegram start error]', err);
    return res.status(500).json({
      ok: false,
      error: 'Failed to start Telegram login',
      details: err.message,
    });
  }
});

/**
 * =========================================================
 * Callback
 * BotFather Redirect URI:
 * https://alazab.com/api/auth/telegram/callback
 * =========================================================
 */
router.get('/auth/telegram/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      clearTelegramCookies(res);
      return res.redirect(
        buildFrontendRedirect('/auth/telegram/error', {
          error,
          error_description: error_description || '',
        })
      );
    }

    if (!code || !state) {
      clearTelegramCookies(res);
      return res.status(400).send('Missing code or state');
    }

    const cookies = parseCookies(req);
    const savedState = cookies[COOKIE_STATE];
    const savedVerifier = cookies[COOKIE_VERIFIER];
    const savedNonce = cookies[COOKIE_NONCE];

    if (!savedState || !savedVerifier) {
      clearTelegramCookies(res);
      return res.status(400).send('Missing PKCE cookies');
    }

    if (String(savedState) !== String(state)) {
      clearTelegramCookies(res);
      return res.status(401).send('Invalid state');
    }

    const tokenResponse = await exchangeCodeForTokens({
      code: String(code),
      codeVerifier: savedVerifier,
    });

    if (!tokenResponse?.id_token) {
      clearTelegramCookies(res);
      return res.status(500).send('Missing id_token in Telegram response');
    }

    const claims = await validateIdToken(tokenResponse.id_token, savedNonce);

    const userData = normalizeTelegramProfile(claims, tokenResponse);

    if (!userData.provider_user_id) {
      clearTelegramCookies(res);
      return res.status(500).send('Missing provider_user_id after token validation');
    }

    const dbUser = await upsertUser(userData);

    clearTelegramCookies(res);

    return res.redirect(
      buildFrontendRedirect('/auth/telegram/success', {
        provider: 'telegram',
        login: 'success',
        user_id: dbUser.id || '',
        telegram_id: dbUser.telegram_id || '',
      })
    );
  } catch (err) {
    clearTelegramCookies(res);

    console.error('[telegram callback error]', {
      message: err.message,
      status: err.status || null,
      payload: err.payload || null,
      stack: err.stack,
    });

    return res.redirect(
      buildFrontendRedirect('/auth/telegram/error', {
        error: 'telegram_callback_failed',
        message: err.message || 'Unknown error',
      })
    );
  }
});

/**
 * =========================================================
 * Optional: current config debug
 * =========================================================
 */
router.get('/auth/telegram/config', async (_req, res) => {
  return res.json({
    ok: true,
    redirect_uri: TELEGRAM_REDIRECT_URI,
    frontend_url: FRONTEND_URL,
    scopes: TELEGRAM_SCOPES,
    client_id_present: Boolean(TELEGRAM_CLIENT_ID),
    client_secret_present: Boolean(TELEGRAM_CLIENT_SECRET),
  });
});

module.exports = router;
