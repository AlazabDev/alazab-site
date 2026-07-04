/**
 * mcp/server.js — Alazab MCP Gateway
 * ==================================
 * Production-safe local MCP-style gateway bound to 127.0.0.1.
 * Exposes operational tools for:
 *  - Maintenance Gateway lifecycle
 *  - Daftra OpenAPI operations (200 generated operations)
 *  - WhatsApp → Seafile ingest database checks
 *  - Seafile library checks
 *  - System/diagnostic tools
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const { Pool } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = Number(process.env.MCP_PORT || 4005);
const APP_NAME = 'alazab-mcp';
const APP_VERSION = '4.0.0';

app.set('trust proxy', 1);
app.use(express.json({ limit: process.env.MCP_JSON_LIMIT || '10mb' }));

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

function mask(value) {
  if (!value) return 'missing';
  const s = String(value);
  return s.length <= 8 ? '********' : `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function env(...names) {
  for (const name of names) {
    if (process.env[name]) return process.env[name];
  }
  return undefined;
}

function boolEnv(name, fallback = false) {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

function requireEnv(...names) {
  const value = env(...names);
  if (!value) throw new Error(`Missing environment variable: ${names.join(' or ')}`);
  return value;
}

function loadJson(relativePath, fallback) {
  try {
    const fullPath = path.join(__dirname, relativePath);
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch {
    return fallback;
  }
}

const daftraCatalog = loadJson('catalog/daftra-operations.json', { count: 0, operations: [] });
const maintenanceCatalog = loadJson('catalog/maintenance-tools.json', { actions: [], workflow_stages: [] });
const daftraOperations = new Map((daftraCatalog.operations || []).map((op) => [op.key, op]));

function createWaIngestPool() {
  const host = env('WA_INGEST_PG_HOST', 'PG_HOST');
  const database = env('WA_INGEST_PG_DATABASE', 'PG_DATABASE');
  const user = env('WA_INGEST_PG_USER', 'PG_USER');
  const password = env('WA_INGEST_PG_PASSWORD', 'PG_PASSWORD');
  const port = Number(env('WA_INGEST_PG_PORT', 'PG_PORT') || 5432);

  if (!host || !database || !user) return null;

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    max: Number(process.env.WA_INGEST_PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

const waIngestPool = createWaIngestPool();

function getMaintenanceConfig() {
  return {
    url: requireEnv('MAINTENANCE_GATEWAY_URL', 'UBERFIX_GATEWAY_URL'),
    apiKey: requireEnv('MAINTENANCE_API_KEY', 'UBERFIX_API_KEY', 'BOT_API_KEY'),
  };
}

async function callMaintenanceGateway(payload) {
  const cfg = getMaintenanceConfig();
  const response = await axios.post(cfg.url, payload, {
    headers: {
      'x-api-key': cfg.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: Number(process.env.MCP_MAINTENANCE_TIMEOUT_MS || 60000),
  });
  return response.data;
}

function getDaftraConfig() {
  const subdomain = env('DAFTRA_SUBDOMAIN') || 'alazab-co';
  const baseUrl = (env('DAFTRA_BASE_URL', 'DAFTRA_URL') || `https://${subdomain}.daftra.com/api2`).replace(/\/+$/, '');
  return {
    subdomain,
    baseUrl,
    apiKey: env('DAFTRA_API_KEY'),
    accessToken: env('DAFTRA_ACCESS_TOKEN'),
  };
}

function buildPathFromTemplate(pathTemplate, pathParams = {}) {
  let urlPath = pathTemplate;
  const params = { format: '.json', ...pathParams };

  for (const match of urlPath.matchAll(/\{([^}]+)\}/g)) {
    const name = match[1];
    const value = params[name];
    if (value === undefined || value === null) {
      throw new Error(`Missing path parameter: ${name}`);
    }
    urlPath = urlPath.replace(`{${name}}`, encodeURIComponent(String(value)));
  }

  return urlPath;
}

async function callDaftraOperation(operationKey, payload = {}) {
  const op = daftraOperations.get(operationKey);
  if (!op) {
    throw new Error(`Unknown Daftra operation: ${operationKey}`);
  }

  const cfg = getDaftraConfig();
  const pathParams = payload.path_params || payload.pathParams || {};
  const query = payload.query || {};
  const body = payload.body ?? payload.data ?? undefined;
  const urlPath = buildPathFromTemplate(op.path, pathParams);

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (cfg.accessToken) headers.Authorization = `Bearer ${cfg.accessToken}`;
  if (cfg.apiKey) headers.apikey = cfg.apiKey;

  const response = await axios({
    method: op.method,
    url: `${cfg.baseUrl}${urlPath}`,
    params: query,
    data: ['GET', 'DELETE'].includes(op.method) ? undefined : body,
    headers,
    timeout: Number(process.env.MCP_DAFTRA_TIMEOUT_MS || 60000),
    validateStatus: () => true,
  });

  return {
    operation: op,
    request: {
      method: op.method,
      url: `${cfg.baseUrl}${urlPath}`,
      query,
      has_body: body !== undefined,
      auth: {
        apikey: Boolean(cfg.apiKey),
        bearer: Boolean(cfg.accessToken),
      },
    },
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    data: response.data,
  };
}

async function callDaftraCrud(resource, action, payload = {}) {
  const resourceMap = {
    clients: 'clients',
    invoices: 'invoices',
    estimates: 'estimates',
    products: 'products',
    expenses: 'expenses',
    suppliers: 'suppliers',
    work_orders: 'work_orders',
    invoice_payments: 'invoice_payments',
    purchase_invoices: 'purchase_invoices',
    stores: 'stores',
    taxes: 'taxes',
    staff: 'staff',
  };

  const group = resourceMap[resource] || resource;
  const keyByAction = {
    list: `daftra.${group}.list`,
    create: `daftra.${group}.create`,
    get: `daftra.${group}.get_one`,
    update: `daftra.${group}.update`,
    delete: `daftra.${group}.delete`,
  };

  const key = keyByAction[action];
  if (!key) throw new Error(`Unsupported Daftra CRUD action: ${action}`);

  const normalizedPayload = { ...payload };
  if (['get', 'update', 'delete'].includes(action)) {
    normalizedPayload.path_params = {
      ...(payload.path_params || payload.pathParams || {}),
      id: payload.id || payload?.path_params?.id || payload?.pathParams?.id,
      format: payload.format || '.json',
    };
  } else {
    normalizedPayload.path_params = {
      ...(payload.path_params || payload.pathParams || {}),
      format: payload.format || '.json',
    };
  }

  return callDaftraOperation(key, normalizedPayload);
}

function getSeafileConfig() {
  return {
    baseUrl: requireEnv('SEAFILE_BASE_URL'),
    token: requireEnv('SEAFILE_TOKEN'),
    repoId: env('SEAFILE_ID', 'SEAFILE_REPO_ID'),
  };
}

async function seafileRequest(method, endpoint, data) {
  const cfg = getSeafileConfig();
  const response = await axios({
    method,
    url: `${cfg.baseUrl.replace(/\/+$/, '')}${endpoint}`,
    headers: {
      Authorization: `Token ${cfg.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    data,
    timeout: Number(process.env.MCP_SEAFILE_TIMEOUT_MS || 30000),
    validateStatus: () => true,
  });
  return { status: response.status, ok: response.status >= 200 && response.status < 300, data: response.data };
}

async function queryWaIngest(sql, params = []) {
  if (!waIngestPool) {
    throw new Error('WA ingest PostgreSQL connection is not configured. Set WA_INGEST_PG_* or PG_* variables.');
  }
  const result = await waIngestPool.query(sql, params);
  return result.rows;
}

function limitValue(input, fallback = 20, max = 200) {
  const n = Number(input || fallback);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

const toolDefinitions = {
  ping: {
    title: 'Ping MCP server',
    input: {},
    run: async () => ({ message: 'pong' }),
  },

  health: {
    title: 'MCP health check',
    input: {},
    run: async () => ({
      service: APP_NAME,
      version: APP_VERSION,
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      catalog: {
        daftra_operations: daftraCatalog.count,
        maintenance_actions: maintenanceCatalog.actions?.length || 0,
      },
      env: {
        maintenance_gateway: mask(env('MAINTENANCE_GATEWAY_URL', 'UBERFIX_GATEWAY_URL')),
        daftra_base_url: mask(env('DAFTRA_BASE_URL', 'DAFTRA_URL')),
        seafile_base_url: mask(env('SEAFILE_BASE_URL')),
        wa_ingest_db: mask(env('WA_INGEST_PG_DATABASE', 'PG_DATABASE')),
      },
    }),
  },

  system_info: {
    title: 'System information',
    input: {},
    run: async () => ({
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      pid: process.pid,
      uptime: process.uptime(),
      loadavg: os.loadavg(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    }),
  },

  list_tools: {
    title: 'List MCP tools',
    input: { group: 'optional string prefix' },
    run: async (payload = {}) => {
      const prefix = payload.group || payload.prefix || '';
      const tools = Object.keys(toolDefinitions)
        .filter((name) => !prefix || name.startsWith(prefix))
        .sort()
        .map((name) => ({ name, title: toolDefinitions[name].title, input: toolDefinitions[name].input || {} }));
      return { count: tools.length, tools };
    },
  },

  tool_schema: {
    title: 'Get one tool schema',
    input: { tool: 'required tool name' },
    run: async (payload = {}) => {
      const def = toolDefinitions[payload.tool];
      if (!def) throw new Error(`Unknown tool: ${payload.tool}`);
      return { name: payload.tool, title: def.title, input: def.input || {} };
    },
  },

  'maintenance.catalog': {
    title: 'Maintenance actions and lifecycle catalog',
    input: {},
    run: async () => maintenanceCatalog,
  },

  'maintenance.create_request': {
    title: 'Create maintenance request through API Gateway',
    input: { client_name: 'string', client_phone: 'string', service_type: 'string', description: 'string', priority: 'low|normal|high|urgent' },
    run: async (payload = {}) => callMaintenanceGateway({ channel: 'mcp', ...payload }),
  },

  'maintenance.get_status': {
    title: 'Get maintenance request status',
    input: { request_id: 'uuid optional', request_number: 'string optional' },
    run: async (payload = {}) => callMaintenanceGateway({ channel: 'mcp', action: 'get_status', client_name: payload.client_name || 'mcp', ...payload }),
  },

  'maintenance.transition_stage': {
    title: 'Move maintenance request to another workflow stage',
    input: { request_id: 'uuid optional', request_number: 'string optional', to_stage: 'workflow stage', reason: 'string' },
    run: async (payload = {}) => callMaintenanceGateway({ channel: 'mcp', action: 'transition_stage', client_name: payload.client_name || 'mcp', ...payload }),
  },

  'maintenance.add_note': {
    title: 'Add note to maintenance request',
    input: { request_id: 'uuid optional', request_number: 'string optional', note: 'string' },
    run: async (payload = {}) => callMaintenanceGateway({ channel: 'mcp', action: 'add_note', client_name: payload.client_name || 'mcp', ...payload }),
  },

  'maintenance.cancel': {
    title: 'Cancel maintenance request',
    input: { request_id: 'uuid optional', request_number: 'string optional', reason: 'string' },
    run: async (payload = {}) => callMaintenanceGateway({ channel: 'mcp', action: 'cancel', client_name: payload.client_name || 'mcp', ...payload }),
  },

  'maintenance.call': {
    title: 'Raw call to maintenance gateway',
    input: { payload: 'object sent to gateway' },
    run: async (payload = {}) => callMaintenanceGateway(payload.payload || payload),
  },

  'maintenance.run_lifecycle_test': {
    title: 'Create a request and run selected lifecycle stages',
    input: { create: 'create request payload', stages: 'array of stages optional', reason: 'string optional' },
    run: async (payload = {}) => {
      const stages = payload.stages || ['triaged', 'assigned', 'scheduled', 'in_progress', 'inspection', 'completed'];
      const created = await callMaintenanceGateway({ channel: 'mcp', ...(payload.create || {}) });
      const request_id = created.request_id;
      const steps = [{ action: 'create_request', result: created }];
      for (const stage of stages) {
        const result = await callMaintenanceGateway({
          channel: 'mcp',
          action: 'transition_stage',
          client_name: 'mcp',
          request_id,
          to_stage: stage,
          reason: payload.reason || `MCP lifecycle test → ${stage}`,
        });
        steps.push({ action: 'transition_stage', stage, result });
      }
      return { request_id, request_number: created.request_number, steps };
    },
  },

  'daftra.list_operations': {
    title: 'List generated Daftra OpenAPI operations',
    input: { search: 'optional search text', tag: 'optional tag', limit: 'optional number' },
    run: async (payload = {}) => {
      const search = String(payload.search || '').toLowerCase();
      const tag = String(payload.tag || '').toLowerCase();
      const limit = limitValue(payload.limit, 50, 500);
      const operations = (daftraCatalog.operations || [])
        .filter((op) => !search || `${op.key} ${op.summary} ${op.path}`.toLowerCase().includes(search))
        .filter((op) => !tag || (op.tags || []).join(' ').toLowerCase().includes(tag))
        .slice(0, limit);
      return { total: daftraCatalog.count, count: operations.length, operations };
    },
  },

  'daftra.call_operation': {
    title: 'Call any Daftra OpenAPI operation by generated key',
    input: { operation_key: 'required key from daftra.list_operations', path_params: 'object', query: 'object', body: 'object' },
    run: async (payload = {}) => callDaftraOperation(payload.operation_key || payload.key, payload),
  },

  'daftra.crud': {
    title: 'Generic Daftra CRUD helper for common resources',
    input: { resource: 'clients|invoices|estimates|products|expenses|suppliers|work_orders|...', action: 'list|create|get|update|delete', id: 'optional', query: 'optional', body: 'optional' },
    run: async (payload = {}) => callDaftraCrud(payload.resource, payload.action, payload),
  },

  'daftra.clients.list': { title: 'List Daftra clients', input: { query: 'object optional' }, run: async (p = {}) => callDaftraCrud('clients', 'list', p) },
  'daftra.clients.create': { title: 'Create Daftra client', input: { body: 'Daftra Client body' }, run: async (p = {}) => callDaftraCrud('clients', 'create', p) },
  'daftra.clients.get': { title: 'Get Daftra client', input: { id: 'required' }, run: async (p = {}) => callDaftraCrud('clients', 'get', p) },
  'daftra.clients.update': { title: 'Update Daftra client', input: { id: 'required', body: 'object' }, run: async (p = {}) => callDaftraCrud('clients', 'update', p) },
  'daftra.invoices.list': { title: 'List Daftra invoices', input: { query: 'object optional' }, run: async (p = {}) => callDaftraCrud('invoices', 'list', p) },
  'daftra.invoices.create': { title: 'Create Daftra invoice', input: { body: 'Daftra Invoice body' }, run: async (p = {}) => callDaftraCrud('invoices', 'create', p) },
  'daftra.invoices.get': { title: 'Get Daftra invoice', input: { id: 'required' }, run: async (p = {}) => callDaftraCrud('invoices', 'get', p) },
  'daftra.invoices.update': { title: 'Update Daftra invoice', input: { id: 'required', body: 'object' }, run: async (p = {}) => callDaftraCrud('invoices', 'update', p) },
  'daftra.products.list': { title: 'List Daftra products', input: { query: 'object optional' }, run: async (p = {}) => callDaftraCrud('products', 'list', p) },
  'daftra.products.create': { title: 'Create Daftra product', input: { body: 'Daftra Product body' }, run: async (p = {}) => callDaftraCrud('products', 'create', p) },
  'daftra.expenses.list': { title: 'List Daftra expenses', input: { query: 'object optional' }, run: async (p = {}) => callDaftraCrud('expenses', 'list', p) },
  'daftra.work_orders.list': { title: 'List Daftra work orders', input: { query: 'object optional' }, run: async (p = {}) => callDaftraCrud('work_orders', 'list', p) },

  'wa_ingest.stats': {
    title: 'WhatsApp-Seafile ingest database counters',
    input: {},
    run: async () => {
      const rows = await queryWaIngest(`
        SELECT
          (SELECT count(*)::int FROM wa_ingest.webhook_events) AS webhook_events,
          (SELECT count(*)::int FROM wa_ingest.messages) AS messages,
          (SELECT count(*)::int FROM wa_ingest.media_files) AS media_files,
          (SELECT count(*)::int FROM wa_ingest.media_files WHERE upload_status='uploaded') AS uploaded_media,
          (SELECT count(*)::int FROM wa_ingest.media_files WHERE upload_status='failed') AS failed_media,
          (SELECT count(*)::int FROM wa_ingest.notification_events) AS notifications
      `);
      return rows[0];
    },
  },

  'wa_ingest.recent_messages': {
    title: 'Recent WhatsApp messages from ingest database',
    input: { limit: 'optional number' },
    run: async (payload = {}) => queryWaIngest(
      `SELECT message_id, sender_wa_id, sender_name, message_type, message_text, created_at
       FROM wa_ingest.messages ORDER BY created_at DESC LIMIT $1`,
      [limitValue(payload.limit, 20, 100)]
    ),
  },

  'wa_ingest.recent_media': {
    title: 'Recent WhatsApp media files and Seafile upload status',
    input: { limit: 'optional number' },
    run: async (payload = {}) => queryWaIngest(
      `SELECT wa_media_id, media_type, mime_type, sender_wa_id, download_status, upload_status, seafile_file_path, last_error, created_at, uploaded_at
       FROM wa_ingest.media_files ORDER BY created_at DESC LIMIT $1`,
      [limitValue(payload.limit, 20, 100)]
    ),
  },

  'wa_ingest.failed_media': {
    title: 'Failed WhatsApp media uploads',
    input: { limit: 'optional number' },
    run: async (payload = {}) => queryWaIngest(
      `SELECT wa_media_id, media_type, sender_wa_id, retry_count, last_error, created_at
       FROM wa_ingest.media_files WHERE upload_status='failed' ORDER BY created_at DESC LIMIT $1`,
      [limitValue(payload.limit, 20, 100)]
    ),
  },

  'wa_ingest.notifications': {
    title: 'Recent notification outbox events',
    input: { limit: 'optional number', status: 'optional delivery_status' },
    run: async (payload = {}) => {
      const limit = limitValue(payload.limit, 20, 100);
      if (payload.status) {
        return queryWaIngest(
          `SELECT id, notification_type, title, severity, delivery_status, created_at, delivered_at
           FROM wa_ingest.notification_events WHERE delivery_status=$1 ORDER BY created_at DESC LIMIT $2`,
          [payload.status, limit]
        );
      }
      return queryWaIngest(
        `SELECT id, notification_type, title, severity, delivery_status, created_at, delivered_at
         FROM wa_ingest.notification_events ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );
    },
  },

  'whatsapp_seafile.health': {
    title: 'Call local WhatsApp-Seafile webhook service health',
    input: {},
    run: async () => {
      const baseUrl = env('WHATSAPP_SEAFILE_URL') || 'http://127.0.0.1:3099';
      const response = await axios.get(`${baseUrl.replace(/\/+$/, '')}/health`, { timeout: 10000, validateStatus: () => true });
      return { status: response.status, ok: response.status >= 200 && response.status < 300, data: response.data };
    },
  },

  'seafile.list_repos': {
    title: 'List Seafile libraries/repositories',
    input: {},
    run: async () => seafileRequest('GET', '/api2/repos/'),
  },

  'seafile.repo_info': {
    title: 'Get configured Seafile repository info',
    input: { repo_id: 'optional repo id' },
    run: async (payload = {}) => {
      const cfg = getSeafileConfig();
      const repoId = payload.repo_id || cfg.repoId;
      if (!repoId) throw new Error('repo_id or SEAFILE_ID is required');
      return seafileRequest('GET', `/api2/repos/${repoId}/`);
    },
  },
};

function getToolNames() {
  return Object.keys(toolDefinitions).sort();
}

async function runTool(tool, payload) {
  const definition = toolDefinitions[tool];
  if (!definition) {
    const err = new Error(`Unknown tool: ${tool}`);
    err.statusCode = 404;
    err.available_tools = getToolNames();
    throw err;
  }
  const started = Date.now();
  const data = await definition.run(payload || {});
  return {
    ok: true,
    tool,
    elapsed_ms: Date.now() - started,
    data,
    timestamp: new Date().toISOString(),
  };
}

function validateInternalKey(req, res, next) {
  if (!boolEnv('MCP_REQUIRE_INTERNAL_KEY', false)) return next();
  const expected = process.env.MCP_INTERNAL_KEY;
  const received = req.headers['x-mcp-key'] || req.headers['x-api-key'];
  if (!expected) return res.status(500).json({ ok: false, error: 'MCP_INTERNAL_KEY is missing' });
  if (received !== expected) return res.status(401).json({ ok: false, error: 'Invalid MCP key' });
  return next();
}

app.get('/health', async (req, res) => {
  try {
    const result = await runTool('health', {});
    res.json(result.data);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message, requestId: req.requestId });
  }
});

app.get('/tools', validateInternalKey, async (req, res) => {
  const result = await runTool('list_tools', { prefix: req.query.prefix || req.query.group });
  res.json({ ...result, requestId: req.requestId });
});

app.post('/call', validateInternalKey, async (req, res) => {
  try {
    const { tool, payload } = req.body || {};
    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({ ok: false, error: 'tool is required and must be a string', requestId: req.requestId });
    }
    const result = await runTool(tool, payload || {});
    return res.json({ ...result, requestId: req.requestId });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message,
      available_tools: error.available_tools,
      requestId: req.requestId,
    });
  }
});

// Legacy endpoint retained for existing callers: { tool, payload }
app.post('/mcp', validateInternalKey, async (req, res) => {
  req.url = '/call';
  return app._router.handle(req, res);
});

// Unified action endpoint: { action, payload }. Dots are recommended.
app.post('/v1', validateInternalKey, async (req, res) => {
  try {
    const { action, payload } = req.body || {};
    const tool = String(action || '').replace(/:/g, '.');
    if (!tool) return res.status(400).json({ ok: false, error: 'action is required', requestId: req.requestId });
    const result = await runTool(tool, payload || {});
    return res.json({ ...result, requestId: req.requestId });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message,
      available_tools: error.available_tools,
      requestId: req.requestId,
    });
  }
});

app.post('/v1/', validateInternalKey, async (req, res) => {
  req.url = '/v1';
  return app._router.handle(req, res);
});

app.get('/catalog/daftra', validateInternalKey, (req, res) => {
  res.json(daftraCatalog);
});

app.get('/catalog/maintenance', validateInternalKey, (req, res) => {
  res.json(maintenanceCatalog);
});

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found', path: req.originalUrl, requestId: req.requestId });
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`${APP_NAME} v${APP_VERSION} running on http://127.0.0.1:${PORT}`);
  console.log(`MCP tools: ${getToolNames().length}; Daftra operations: ${daftraCatalog.count || 0}`);
});

async function shutdown(signal) {
  console.log(`[MCP] ${signal} received — shutting down`);
  server.close(async () => {
    if (waIngestPool) await waIngestPool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[MCP unhandledRejection]', reason));
process.on('uncaughtException', (error) => console.error('[MCP uncaughtException]', error));
