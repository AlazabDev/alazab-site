import crypto from 'node:crypto';
import express from 'express';

export function mountOAuth(app, env) {
  const base = 'https://alazab.com/meta';
  const resource = base + '/mcp';
  const issuer = base;
  const key = crypto.createHash('sha256').update('alazab-meta-oauth-v1:' + env.META_MCP_ADMIN_KEY).digest();
  const codes = new Map();
  const b64 = x => Buffer.from(JSON.stringify(x)).toString('base64url');
  const mac = s => crypto.createHmac('sha256', key).update(s).digest('base64url');
  function issue(type, data) {
    const body = b64({ ...data, typ: type, iss: issuer, aud: resource });
    return body + '.' + mac(body);
  }
  function verify(value, typ) {
    const parts = String(value || '').split('.');
    if (parts.length !== 2) return null;
    const expected = mac(parts[0]);
    if (expected.length !== parts[1].length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts[1]))) return null;
    try {
      const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      if (data.typ !== typ || data.iss !== issuer || data.aud !== resource || data.exp <= Date.now()) return null;
      return data;
    } catch { return null; }
  }
  function permitted(uri) {
    try {
      const u = new URL(uri);
      return u.protocol === 'https:' &&
        (u.hostname === 'chatgpt.com' || u.hostname === 'openai.com' || u.hostname.endsWith('.openai.com')) &&
        !u.username && !u.password && !u.hash;
    } catch { return false; }
  }
  function authClient(id, redirect) {
    const d = verify(id, 'client');
    return d && d.redirects.includes(redirect) && permitted(redirect) ? d : null;
  }
  const metadata = {
    issuer,
    authorization_endpoint: base + '/oauth/authorize',
    token_endpoint: base + '/oauth/token',
    registration_endpoint: base + '/oauth/register',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['none'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: ['meta:read', 'offline_access'],
  };
  const resourceMetadata = { resource, authorization_servers: [issuer], scopes_supported: ['meta:read'] };
  app.get('/.well-known/oauth-protected-resource', (_req, res) => res.json(resourceMetadata));
  app.get('/.well-known/oauth-authorization-server', (_req, res) => res.json(metadata));
  app.post('/oauth/register', (req, res) => {
    const body = req.body || {};
    if (!Array.isArray(body.redirect_uris) || body.redirect_uris.length < 1 || body.redirect_uris.length > 5 || !body.redirect_uris.every(permitted))
      return res.status(400).json({ error: 'invalid_redirect_uri' });
    if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== 'none')
      return res.status(400).json({ error: 'invalid_client_metadata' });
    const client_id = issue('client', { redirects: body.redirect_uris, exp: Date.now() + 365 * 86400000 });
    return res.status(201).json({ client_id, client_id_issued_at: Math.floor(Date.now() / 1000),
      redirect_uris: body.redirect_uris, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'], client_name: String(body.client_name || 'ChatGPT').slice(0, 90) });
  });
  function requestParams(body) {
    const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state, resource: requestedResource } = body;
    if (!authClient(client_id, redirect_uri) || response_type !== 'code' ||
        !/^[A-Za-z0-9_-]{43,128}$/.test(code_challenge || '') || code_challenge_method !== 'S256' ||
        requestedResource !== resource) return null;
    return { client_id, redirect_uri, code_challenge, state: String(state || ''), resource };
  }
  app.get('/oauth/authorize', (req, res) => {
    const p = requestParams(req.query);
    if (!p) return res.status(400).send('Invalid OAuth request');
    const fields = Object.entries(req.query).map(([k,v]) =>
      '<input type="hidden" name="' + escapeHTML(k) + '" value="' + escapeHTML(String(v)) + '">').join('');
    res.set('Cache-Control', 'no-store').type('html').send('<!doctype html><html><head><meta charset="utf-8"><title>Alazab Meta Authorization</title></head><body><main><h1>Authorize Alazab Meta MCP</h1><p>Grant read-only access to the configured Business Portfolio.</p><form action="/meta/oauth/authorize" method="post">' +
      fields + '<label>Meta MCP admin key <input name="admin_key" type="password" autocomplete="off" required></label><button type="submit">Authorize</button></form></main></body></html>');
  });
  app.post('/oauth/authorize', express.urlencoded({ extended: false, limit: '16kb' }), (req, res) => {
    const p = requestParams(req.body);
    if (!p) return res.status(400).send('Invalid OAuth request');
    const supplied = Buffer.from(String(req.body.admin_key || ''));
    const actual = Buffer.from(env.META_MCP_ADMIN_KEY || '');
    if (!actual.length || supplied.length !== actual.length || !crypto.timingSafeEqual(supplied, actual))
      return res.status(403).send('Authorization denied');
    const code = crypto.randomBytes(32).toString('base64url');
    codes.set(code, { ...p, exp: Date.now() + 300000 });
    const url = new URL(p.redirect_uri);
    url.searchParams.set('code', code);
    if (p.state) url.searchParams.set('state', p.state);
    res.set('Cache-Control', 'no-store').redirect(303, url.toString());
  });
  app.post('/oauth/token', express.urlencoded({ extended: false, limit: '16kb' }), (req, res) => {
    res.set('Cache-Control', 'no-store');
    const b = req.body || {};
    if (b.resource !== resource) return res.status(400).json({ error: 'invalid_target' });
    if (b.grant_type === 'authorization_code') {
      const p = codes.get(b.code);
      codes.delete(b.code);
      if (!p || p.exp < Date.now() || p.client_id !== b.client_id || p.redirect_uri !== b.redirect_uri ||
          !authClient(b.client_id, b.redirect_uri) ||
          !/^[A-Za-z0-9._~-]{43,128}$/.test(b.code_verifier || ''))
        return res.status(400).json({ error: 'invalid_grant' });
      const challenge = crypto.createHash('sha256').update(b.code_verifier).digest('base64url');
      if (challenge !== p.code_challenge) return res.status(400).json({ error: 'invalid_grant' });
      return res.json(tokens(b.client_id));
    }
    if (b.grant_type === 'refresh_token') {
      const previous = verify(b.refresh_token, 'refresh');
      if (!previous || previous.client_id !== b.client_id) return res.status(400).json({ error: 'invalid_grant' });
      return res.json(tokens(b.client_id));
    }
    return res.status(400).json({ error: 'unsupported_grant_type' });
  });
  function tokens(client_id) {
    return { access_token: issue('access', { client_id, scope: 'meta:read', exp: Date.now() + 3600000 }),
      token_type: 'Bearer', expires_in: 3600, scope: 'meta:read',
      refresh_token: issue('refresh', { client_id, exp: Date.now() + 30 * 86400000 }) };
  }
  function verifyAccess(token) {
    const d = verify(token, 'access');
    return d && d.scope === 'meta:read' ? d : null;
  }
  return { verifyAccess, resourceMetadataUrl: base + '/.well-known/oauth-protected-resource' };
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
