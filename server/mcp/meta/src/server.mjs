import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(serverRoot, '.env') });
import express from 'express';
import crypto from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

const cfg = process.env;
const graphVersion = cfg.META_GRAPH_VERSION || 'v24.0';
if (!/^v\d+\.\d+$/.test(graphVersion)) throw new Error('Invalid META_GRAPH_VERSION');
const graphHost = 'https://graph.facebook.com/' + graphVersion;
const host = cfg.HOST || '127.0.0.1';
const port = Number(cfg.PORT || 8187);
const maxPages = Math.max(1, Math.min(100, Number(cfg.META_MAX_PAGES || 50)));
const allowBusinesses = new Set((cfg.META_ALLOWED_BUSINESS_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
const allowWabas = new Set((cfg.META_ALLOWED_WABA_IDS || '').split(',').map(s => s.trim()).filter(Boolean));
const allowedOrigins = new Set((cfg.META_MCP_ALLOWED_ORIGINS || 'https://alazab.com').split(',').map(s => s.trim()).filter(Boolean));
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  next();
});

function roleFor(req) {
  const received = /^Bearer (.+)$/i.exec(req.get('authorization') || '')?.[1];
  if (!received) return null;
  for (const [role, key] of [['admin', cfg.META_MCP_ADMIN_KEY], ['foundry', cfg.META_MCP_FOUNDRY_KEY]]) {
    if (!key) continue;
    const a = Buffer.from(received), b = Buffer.from(key);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return role;
  }
  return null;
}
function assertBusiness(id, role) {
  if (role === 'foundry' && !allowBusinesses.size) throw new Error('Foundry business allowlist not configured');
  if (allowBusinesses.size && !allowBusinesses.has(String(id))) throw new Error('Business not allowed');
}
function assertWaba(id, role) {
  if (role === 'foundry' && (!allowWabas.size || !allowWabas.has(String(id)))) throw new Error('WABA not allowed');
}
function sanitize(message) {
  return String(message).replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]').slice(0, 500);
}
async function callGraph(path, params = {}, { token = cfg.META_ACCESS_TOKEN, base = graphHost } = {}) {
  if (!token) throw new Error('META_ACCESS_TOKEN is not configured');
  if (!/^[a-zA-Z0-9_\/-]+$/.test(path)) throw new Error('Invalid Graph path');
  const url = new URL(base + '/' + path.replace(/^\//, ''));
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token },
    signal: AbortSignal.timeout(20000)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error('Graph HTTP ' + response.status + ': ' + sanitize(json.error?.message || 'Request failed'));
  return json;
}
async function listAll(path, params = {}, options = {}) {
  const data = [];
  let after;
  for (let page = 1; page <= maxPages; page++) {
    const response = await callGraph(path, { ...params, limit: 100, ...(after ? { after } : {}) }, options);
    if (!Array.isArray(response.data)) return { data: response, pages: page, complete: true };
    data.push(...response.data);
    if (!response.paging?.next) return { data, pages: page, complete: true };
    const cursor = response.paging?.cursors?.after;
    if (!cursor || cursor === after) return { data, pages: page, complete: false, warning: 'Pagination cursor missing/repeated' };
    after = cursor;
  }
  return { data, pages: maxPages, complete: false, warning: 'Pagination cap reached' };
}
function registerTool(server, name, description, schema, fn) {
  server.tool(name, description, schema, async args => {
    try { return { content: [{ type: 'text', text: JSON.stringify(await fn(args), null, 2) }] }; }
    catch (error) { return { isError: true, content: [{ type: 'text', text: sanitize(error.message) }] }; }
  });
}
const businessEdges = {
  owned_pages: 'id,name,category', client_pages: 'id,name,category',
  owned_ad_accounts: 'id,name,account_id,account_status,currency',
  client_ad_accounts: 'id,name,account_id,account_status,currency',
  owned_instagram_accounts: 'id,username', client_instagram_accounts: 'id,username',
  owned_whatsapp_business_accounts: 'id,name', client_whatsapp_business_accounts: 'id,name',
  owned_pixels: 'id,name', client_pixels: 'id,name',
  owned_product_catalogs: 'id,name', client_product_catalogs: 'id,name',
  owned_apps: 'id,name', client_apps: 'id,name',
  business_users: 'id,name,email', system_users: 'id,name,role'
};
function registerTools(server, role) {
  registerTool(server, 'meta_list_businesses', 'Enumerate visible Meta business portfolios; results may be restricted by permissions.', {}, async () => {
    if (role === 'foundry' && !allowBusinesses.size) throw new Error('Foundry business allowlist not configured');
    const result = await listAll('me/businesses', { fields: 'id,name,verification_status,created_time,updated_time' });
    result.data = result.data.filter(x => !allowBusinesses.size || allowBusinesses.has(String(x.id)));
    return result;
  });
  registerTool(server, 'meta_business_overview', 'Read portfolio details.', { business_id: z.string().regex(/^\d+$/) }, async ({ business_id }) => {
    assertBusiness(business_id, role);
    return callGraph(business_id, { fields: 'id,name,verification_status,created_time,updated_time' });
  });
  registerTool(server, 'meta_list_business_assets', 'List one owned/shared asset category with explicit pagination.', {
    business_id: z.string().regex(/^\d+$/), edge: z.enum(Object.keys(businessEdges))
  }, async ({ business_id, edge }) => {
    assertBusiness(business_id, role);
    return { business_id, edge, ...await listAll(business_id + '/' + edge, { fields: businessEdges[edge] }) };
  });
  registerTool(server, 'meta_portfolio_inventory', 'Audit known portfolio asset categories; record access failures individually.', {
    business_id: z.string().regex(/^\d+$/)
  }, async ({ business_id }) => {
    assertBusiness(business_id, role);
    const assets = {};
    for (const [edge, fields] of Object.entries(businessEdges)) {
      try { assets[edge] = await listAll(business_id + '/' + edge, { fields }); }
      catch (error) { assets[edge] = { complete: false, error: sanitize(error.message) }; }
    }
    return { business_id, assets, note: 'Missing/denied assets do not prove absence; Threads requires distinct API permissions.' };
  });
  registerTool(server, 'meta_waba_phone_numbers', 'Read phone numbers for a permitted WhatsApp Business Account.', {
    waba_id: z.string().regex(/^\d+$/)
  }, async ({ waba_id }) => {
    assertWaba(waba_id, role);
    return listAll(waba_id + '/phone_numbers', { fields: 'id,display_phone_number,verified_name,quality_rating,code_verification_status' });
  });
  registerTool(server, 'meta_waba_templates', 'Read templates in a permitted WhatsApp Business Account.', {
    waba_id: z.string().regex(/^\d+$/)
  }, async ({ waba_id }) => {
    assertWaba(waba_id, role);
    return listAll(waba_id + '/message_templates', { fields: 'id,name,language,status,category' });
  });
  if (role === 'admin') {
    registerTool(server, 'meta_threads_profile', 'Read authorized Threads profile using dedicated Threads token.', {}, async () => {
      if (!cfg.META_THREADS_ACCESS_TOKEN) throw new Error('META_THREADS_ACCESS_TOKEN missing');
      return callGraph('me', { fields: 'id,username,name,threads_profile_picture_url,threads_biography' }, {
        token: cfg.META_THREADS_ACCESS_TOKEN, base: 'https://graph.threads.net'
      });
    });
  }
}
app.get('/health', (_req, res) => res.json({ ok: true, service: 'alazab-meta-mcp', version: '0.3.0' }));
app.all('/mcp', async (req, res) => {
  const role = roleFor(req);
  if (!role) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').json({ error: 'Stateless POST only' });
  const server = new McpServer({ name: 'alazab-meta-mcp', version: '0.3.0' });
  registerTools(server, role);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { void transport.close(); void server.close(); });
  try { await server.connect(transport); await transport.handleRequest(req, res, req.body); }
  catch (error) { if (!res.headersSent) res.status(500).json({ error: sanitize(error.message) }); }
});
app.listen(port, host, () => console.log('Meta MCP listening on ' + host + ':' + port));
