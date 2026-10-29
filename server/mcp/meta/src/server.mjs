import dotenv from 'dotenv';
import crypto from 'node:crypto';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { mountOAuth } from './oauth.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(root, '.env'), quiet: true });
const env = process.env;
const version = env.META_GRAPH_VERSION || 'v24.0';
if (!/^v[0-9]+\.[0-9]+$/.test(version)) throw new Error('Invalid META_GRAPH_VERSION');
const host = env.META_MCP_HOST || '127.0.0.1';
const port = Number(env.META_MCP_PORT || '8187');
if (host !== '127.0.0.1' && host !== '::1') throw new Error('Meta MCP must bind to loopback');
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid META_MCP_PORT');

const businessId = env.META_BUSINESS_ID || env.META_ALLOWED_BUSINESS_IDS?.split(',')[0]?.trim();
const businessAllowlist = new Set([businessId].filter(Boolean));
const wabaAllowlist = new Set((env.META_ALLOWED_WABA_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
const originAllowlist = new Set((env.META_MCP_ALLOWED_ORIGINS || 'https://alazab.com,https://chatgpt.com').split(',').map(s => s.trim()).filter(Boolean));
const limitPages = Math.min(100, Math.max(1, Number(env.META_MAX_PAGES || 25)));
const api = 'https://graph.facebook.com/' + version;
const numericId = z.string().regex(/^\d{5,30}$/);
const app = express();
app.disable('x-powered-by');
const oauth = mountOAuth(app, env);
app.use(express.json({ limit: '256kb' }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !originAllowlist.has(origin)) return res.status(403).json({ error: 'Origin forbidden' });
  if (req.path === '/mcp') res.setHeader('Cache-Control', 'no-store');
  next();
});

const required = ['META_ACCESS_TOKEN', 'META_MCP_ADMIN_KEY', 'META_MCP_FOUNDRY_KEY'];
const missing = () => required.filter(k => !env[k]);
const configured = () => !missing().length && businessAllowlist.size > 0;
function roleFor(req) {
  const token = /^Bearer (.+)$/i.exec(req.get('authorization') || '')?.[1] || '';
  for (const [role, key] of [['admin', env.META_MCP_ADMIN_KEY], ['foundry', env.META_MCP_FOUNDRY_KEY]]) {
    if (!key) continue;
    const a = Buffer.from(token), b = Buffer.from(key);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return role;
  }
  if (oauth.verifyAccess(token)) return 'admin';
  return null;
}
function checkBusiness(id, role) {
  if (role === 'foundry' && (!businessAllowlist.size || !businessAllowlist.has(id))) throw new Error('Business is not authorized for Foundry');
  if (businessAllowlist.size && !businessAllowlist.has(id)) throw new Error('Business not in approved inventory');
}
function checkWaba(id, role) {
  if (wabaAllowlist.size && !wabaAllowlist.has(id)) throw new Error('WABA not allowed');
  if (!businessAllowlist.size) throw new Error('Business not configured');
}
async function assertWabaOwnership(wabaId) {
  const found = [];
  for (const edge of ['owned_whatsapp_business_accounts', 'client_whatsapp_business_accounts']) {
    try { found.push(...(await pages(businessId + '/' + edge, 'id')).data); } catch {}
  }
  if (!found.some(item => String(item.id) === String(wabaId))) {
    throw new Error('WhatsApp account not accessible through configured business');
  }
}
function safeError(error) {
  let out = String(error?.message || error || 'Unknown error');
  for (const key of ['META_ACCESS_TOKEN', 'META_THREADS_ACCESS_TOKEN', 'META_MCP_ADMIN_KEY', 'META_MCP_FOUNDRY_KEY', 'META_APP_SECRET']) {
    if (env[key]) out = out.replaceAll(env[key], '[REDACTED]');
  }
  return out.replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]').slice(0, 350);
}
async function graph(resource, params = {}, { token = env.META_ACCESS_TOKEN, origin = api } = {}) {
  if (!token) throw new Error('Meta credential missing');
  if (!/^[a-zA-Z0-9_/-]+$/.test(resource)) throw new Error('Invalid resource path');
  const url = new URL(origin + '/' + resource.replace(/^\//, ''));
  Object.entries(params).forEach(([key, val]) => { if (val !== undefined) url.searchParams.set(key, String(val)); });
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(25000) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Meta Graph ' + response.status + ': ' + (payload.error?.message || 'Request failed'));
  return payload;
}
async function pages(resource, fields) {
  const data = []; let after;
  for (let n = 0; n < limitPages; n++) {
    const result = await graph(resource, { fields, limit: 100, ...(after ? { after } : {}) });
    if (!Array.isArray(result.data)) return { data: result, complete: true, pages: n + 1 };
    data.push(...result.data);
    if (!result.paging?.next) return { data, complete: true, pages: n + 1 };
    const cursor = result.paging?.cursors?.after;
    if (!cursor || cursor === after) return { data, complete: false, pages: n + 1, error: 'Missing or repeated cursor' };
    after = cursor;
  }
  return { data, complete: false, pages: limitPages, error: 'Pagination limit reached' };
}

const edges = Object.freeze({
  owned_pages: 'id,name,category', client_pages: 'id,name,category',
  owned_ad_accounts: 'id,name,account_id,account_status,currency',
  client_ad_accounts: 'id,name,account_id,account_status,currency',
  owned_instagram_accounts: 'id,username', client_instagram_accounts: 'id,username',
  owned_whatsapp_business_accounts: 'id,name', client_whatsapp_business_accounts: 'id,name',
  owned_apps: 'id,name', client_apps: 'id,name',
  owned_pixels: 'id,name', client_pixels: 'id,name',
  owned_product_catalogs: 'id,name', client_product_catalogs: 'id,name',
  system_users: 'id,name,role', business_users: 'id,name,email'
});
function tool(server, name, description, schema, fn) {
  server.tool(name, description, schema, async args => {
    try { return { content: [{ type: 'text', text: JSON.stringify(await fn(args), null, 2) }] }; }
    catch (e) { return { isError: true, content: [{ type: 'text', text: safeError(e) }] }; }
  });
}
function build(role) {
  const server = new McpServer({ name: 'alazab-meta-mcp', version: '1.0.0' });
  tool(server, 'meta_connection_status', 'Check that configured Meta credential reaches Graph API. Does not reveal credentials.', {}, async () => {
    const user = await graph('me', { fields: 'id,name' });
    return { connected: true, graph_version: version, principal: user, business_allowlist_count: businessAllowlist.size, waba_allowlist_count: wabaAllowlist.size };
  });
  tool(server, 'meta_list_businesses', 'Discover business portfolios granted to this Meta credential.', {}, async () => {
    const portfolio = await graph(businessId, { fields: 'id,name,verification_status,created_time,updated_time' });
    return { data: [portfolio], complete: true, source: 'META_BUSINESS_ID' };
  });
  tool(server, 'meta_my_portfolio', 'Read the configured Meta Business Portfolio; no ID input required.', {}, async () => {
    return graph(businessId, { fields: 'id,name,verification_status' });
  });
  tool(server, 'meta_my_assets', 'Inventory all configured portfolio asset types without specifying business IDs. Reports permission failures per edge.', {}, async () => {
    const inventory = {};
    for (const [edge, fields] of Object.entries(edges)) {
      try { inventory[edge] = await pages(businessId + '/' + edge, fields); }
      catch (e) { inventory[edge] = { complete: false, error: safeError(e) }; }
    }
    return { business_id: businessId, inventory };
  });
  tool(server, 'meta_business_details', 'Read a business portfolio.', { business_id: numericId }, async ({ business_id }) => {
    checkBusiness(business_id, role);
    return graph(business_id, { fields: 'id,name,verification_status,created_time,updated_time' });
  });
  tool(server, 'meta_list_business_assets', 'List an owned/shared Meta business asset edge.', {
    business_id: numericId, edge: z.enum(Object.keys(edges))
  }, async ({ business_id, edge }) => {
    checkBusiness(business_id, role);
    return { business_id, edge, ...await pages(business_id + '/' + edge, edges[edge]) };
  });
  tool(server, 'meta_portfolio_inventory', 'Inventory known portfolio edges. Permission failures are retained per edge; missing assets are not assumed absent.', {
    business_id: numericId
  }, async ({ business_id }) => {
    checkBusiness(business_id, role);
    const inventory = {};
    for (const [edge, fields] of Object.entries(edges)) {
      try { inventory[edge] = await pages(business_id + '/' + edge, fields); }
      catch (e) { inventory[edge] = { complete: false, error: safeError(e) }; }
    }
    return { business_id, inventory };
  });
  tool(server, 'meta_page_details', 'Read a Facebook Page and connected Instagram professional account.', { page_id: numericId }, async ({ page_id }) => {
    // Require business allowlist and check Page via allowed owned/client pages.
    if (!businessAllowlist.size) throw new Error('Business allowlist required for page detail access');
    let allowed = false;
    for (const b of businessAllowlist) {
      for (const edge of ['owned_pages', 'client_pages']) {
        try { if ((await pages(b + '/' + edge, 'id')).data.some(x => String(x.id) === page_id)) allowed = true; }
        catch {}
        if (allowed) break;
      }
      if (allowed) break;
    }
    if (!allowed) throw new Error('Page not found in authorized portfolios');
    return graph(page_id, { fields: 'id,name,category,instagram_business_account{id,username},connected_instagram_account{id,username}' });
  });
  tool(server, 'meta_waba_phone_numbers', 'Read WhatsApp phone numbers, verification and quality.', { waba_id: numericId }, async ({ waba_id }) => {
    checkWaba(waba_id, role);
    await assertWabaOwnership(waba_id);
    return pages(waba_id + '/phone_numbers', 'id,display_phone_number,verified_name,quality_rating,code_verification_status');
  });
  tool(server, 'meta_waba_templates', 'Read approved/pending WhatsApp templates.', { waba_id: numericId }, async ({ waba_id }) => {
    checkWaba(waba_id, role);
    await assertWabaOwnership(waba_id);
    return pages(waba_id + '/message_templates', 'id,name,status,language,category');
  });
  tool(server, 'meta_ad_account_details', 'Read authorized Ad Account details, no campaigns are modified.', {
    business_id: numericId, account_id: z.string().regex(/^(act_)?\d+$/)
  }, async ({ business_id, account_id }) => {
    checkBusiness(business_id, role);
    const allowed = [];
    for (const edge of ['owned_ad_accounts', 'client_ad_accounts']) {
      try { allowed.push(...(await pages(business_id + '/' + edge, 'id,account_id')).data); } catch {}
    }
    const id = account_id.replace(/^act_/, '');
    if (!allowed.some(x => String(x.account_id) === id || String(x.id) === 'act_' + id)) throw new Error('Ad Account not in permitted business');
    return graph('act_' + id, { fields: 'id,name,account_id,account_status,currency,timezone_name' });
  });
  if (role === 'admin') {
    tool(server, 'meta_threads_profile', 'Read profile authenticated by Threads OAuth token; Threads is not a Business Manager edge.', {}, async () => {
      if (!env.META_THREADS_ACCESS_TOKEN) throw new Error('META_THREADS_ACCESS_TOKEN missing');
      return graph('me', { fields: 'id,username,name,threads_profile_picture_url,threads_biography' }, {
        token: env.META_THREADS_ACCESS_TOKEN, origin: 'https://graph.threads.net'
      });
    });
  }
  return server;
}

app.get('/health', (_req, res) => res.json({ service: 'alazab-meta-mcp', alive: true, ready: configured(), missing: missing(), graph_tested: false }));
app.get('/ready', async (_req, res) => {
  if (!configured()) return res.status(503).json({ ready: false, missing: missing(), business_allowlist: businessAllowlist.size, waba_allowlist: wabaAllowlist.size });
  try { await graph('me', { fields: 'id' }); return res.json({ ready: true, graph_connected: true }); }
  catch (e) { return res.status(503).json({ ready: false, graph_connected: false, error: safeError(e) }); }
});
app.all('/mcp', async (req, res) => {
  const role = roleFor(req);
  if (!role) return res.status(401).set('WWW-Authenticate', 'Bearer resource_metadata="' + oauth.resourceMetadataUrl + '", scope="meta:read"').json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').json({ error: 'POST only' });
  if (!configured()) return res.status(503).json({ error: 'Meta MCP credentials and allowlists must be configured' });
  const server = build(role);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { void transport.close(); void server.close(); });
  try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
  catch (e) { if (!res.headersSent) res.status(500).json({ error: safeError(e) }); }
});
app.listen(port, host, () => console.log('Meta MCP listening on ' + host + ':' + port));
