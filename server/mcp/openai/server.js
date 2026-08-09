'use strict';

const path = require('path');
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const PORT = Number(process.env.OPENAI_MCP_PORT || 4015);
const HOST = process.env.OPENAI_MCP_HOST || '127.0.0.1';
const PUBLIC_ORIGIN = String(process.env.OPENAI_MCP_PUBLIC_ORIGIN || 'https://api.alazab.com').replace(/\/$/, '');
const RESOURCE = String(process.env.OPENAI_MCP_RESOURCE || PUBLIC_ORIGIN).replace(/\/$/, '');
const INTERNAL_GATEWAY_URL = process.env.OPENAI_MCP_INTERNAL_GATEWAY_URL || 'http://127.0.0.1:4005/call';
const AUTH_MODE = String(process.env.OPENAI_MCP_AUTH_MODE || 'supabase').toLowerCase();
const AUTH_SUPABASE_URL = String(
  process.env.ALAZAB_AUTH_SUPABASE_URL || process.env.SUPABASE_URL || ''
).replace(/\/$/, '');
const AUTH_SUPABASE_KEY =
  process.env.ALAZAB_AUTH_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';
const REQUIRED_SCOPE = process.env.OPENAI_MCP_REQUIRED_SCOPE || 'email';
const ALLOWED_ROLES = new Set(
  String(process.env.OPENAI_MCP_ALLOWED_ROLES || 'admin,user')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const ALLOWED_ORIGINS = new Set(
  String(
    process.env.OPENAI_MCP_ALLOWED_ORIGINS ||
      'https://chatgpt.com,https://chat.openai.com,https://ai-azab.co,https://api.alazab.com'
  )
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
);

const CURRENT_PROTOCOL = '2025-11-25';
const SUPPORTED_PROTOCOLS = new Set(['2025-11-25', '2025-06-18', '2025-03-26']);
const SECURITY_SCHEMES = [{ type: 'oauth2', scopes: [REQUIRED_SCOPE] }];

if (AUTH_MODE === 'none' && process.env.NODE_ENV === 'production') {
  throw new Error('OPENAI_MCP_AUTH_MODE=none is not allowed in production');
}

if (AUTH_MODE === 'supabase' && (!AUTH_SUPABASE_URL || !AUTH_SUPABASE_KEY)) {
  throw new Error(
    'Supabase auth is enabled but ALAZAB_AUTH_SUPABASE_URL / ALAZAB_AUTH_SUPABASE_PUBLISHABLE_KEY are missing'
  );
}

function metadataUrl() {
  return `${PUBLIC_ORIGIN}/.well-known/oauth-protected-resource`;
}

function oauthChallenge(error = 'invalid_token', description = 'Authentication is required') {
  const safeDescription = String(description).replace(/["\\]/g, ' ');
  return `Bearer resource_metadata="${metadataUrl()}", error="${error}", error_description="${safeDescription}"`;
}

function jsonRpcError(id, code, message, data) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return { jsonrpc: '2.0', id: id ?? null, error };
}

function jsonRpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function decodeJwtPart(part) {
  const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function decodeJwt(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  return {
    header: decodeJwtPart(parts[0]),
    claims: decodeJwtPart(parts[1]),
  };
}

function bearerToken(req) {
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function normalizeAud(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return [value];
  return [];
}

function assertTokenClaims(token, userInfo) {
  const { claims } = decodeJwt(token);
  const now = Math.floor(Date.now() / 1000);
  const expectedIssuer = `${AUTH_SUPABASE_URL}/auth/v1`;

  if (claims.iss !== expectedIssuer) throw new Error('Token issuer mismatch');
  if (!Number.isFinite(Number(claims.exp)) || Number(claims.exp) <= now) throw new Error('Token expired');
  if (claims.nbf !== undefined && Number(claims.nbf) > now) throw new Error('Token is not active yet');
  if (!claims.sub || claims.sub !== userInfo.sub) throw new Error('Token subject mismatch');
  if (!claims.client_id) throw new Error('Token was not issued through an OAuth client');
  if (!normalizeAud(claims.aud).includes(RESOURCE)) throw new Error('Token audience mismatch');

  return claims;
}

async function validateOAuthScope(token) {
  const response = await axios.get(`${AUTH_SUPABASE_URL}/auth/v1/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 8000,
    validateStatus: () => true,
  });

  if (response.status !== 200 || !response.data?.sub) {
    throw new Error('Supabase rejected the OAuth access token');
  }

  if (REQUIRED_SCOPE === 'email' && !response.data.email) {
    throw new Error('OAuth token is missing the required email scope');
  }

  return response.data;
}

async function loadUserRoles(token, userId) {
  const response = await axios.get(`${AUTH_SUPABASE_URL}/rest/v1/user_roles`, {
    headers: {
      apikey: AUTH_SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    params: {
      select: 'role',
      user_id: `eq.${userId}`,
    },
    timeout: 8000,
    validateStatus: () => true,
  });

  if (response.status !== 200 || !Array.isArray(response.data)) {
    throw new Error(`Unable to resolve Alazab user roles (HTTP ${response.status})`);
  }

  return response.data.map((row) => String(row.role || '')).filter(Boolean);
}

async function authenticate(req) {
  if (AUTH_MODE === 'none') {
    return {
      user: { id: 'development', email: 'development@local' },
      claims: { client_id: 'development' },
      roles: ['admin'],
    };
  }

  const token = bearerToken(req);
  if (!token) {
    const error = new Error('No access token provided');
    error.oauthError = 'invalid_token';
    throw error;
  }

  let userInfo;
  try {
    userInfo = await validateOAuthScope(token);
  } catch (cause) {
    const error = new Error(cause.message || 'Invalid access token');
    error.oauthError = 'invalid_token';
    throw error;
  }

  const claims = assertTokenClaims(token, userInfo);
  const roles = await loadUserRoles(token, claims.sub);

  if (!roles.some((role) => ALLOWED_ROLES.has(role))) {
    const error = new Error(`User role is not allowed for Alazab MCP: ${roles.join(', ') || 'none'}`);
    error.oauthError = 'insufficient_scope';
    throw error;
  }

  return {
    token,
    user: { id: claims.sub, email: userInfo.email || claims.email || null },
    claims,
    roles,
  };
}

async function callInternalGateway(tool, payload = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MCP_INTERNAL_KEY) headers['x-mcp-key'] = process.env.MCP_INTERNAL_KEY;

  const response = await axios.post(
    INTERNAL_GATEWAY_URL,
    { tool, payload },
    {
      headers,
      timeout: Number(process.env.OPENAI_MCP_INTERNAL_TIMEOUT_MS || 20000),
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status >= 300) {
    const error = new Error(`Internal gateway ${tool} failed with HTTP ${response.status}`);
    error.details = response.data;
    throw error;
  }

  return response.data;
}

function integerSchema(minimum, maximum, defaultValue) {
  const schema = { type: 'integer', minimum, maximum };
  if (defaultValue !== undefined) schema.default = defaultValue;
  return schema;
}

const TOOLS = [
  {
    name: 'maintenance_get_status',
    title: 'Maintenance request status',
    description: 'Read the current UberFix maintenance request status using an exact request UUID or request number. Does not change production state.',
    inputSchema: {
      type: 'object',
      properties: {
        request_id: { type: 'string', description: 'Exact maintenance request UUID.' },
        request_number: { type: 'string', description: 'Exact maintenance request number.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => {
      if (!args.request_id && !args.request_number) {
        throw new Error('Provide request_id or request_number');
      }
      return callInternalGateway('maintenance.get_status', {
        ...(args.request_id ? { request_id: args.request_id } : {}),
        ...(args.request_number ? { request_number: args.request_number } : {}),
      });
    },
  },
  {
    name: 'maintenance_catalog',
    title: 'Maintenance tool catalog',
    description: 'Read the maintenance gateway catalog and workflow metadata. Does not change production state.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    securitySchemes: SECURITY_SCHEMES,
    handler: async () => callInternalGateway('maintenance.catalog', {}),
  },
  {
    name: 'daftra_list_products',
    title: 'List Daftra products',
    description: 'Read products from Daftra using the existing Alazab gateway. Does not create or update products.',
    inputSchema: {
      type: 'object',
      properties: {
        page: integerSchema(1, 100000, 1),
        limit: integerSchema(1, 100, 25),
        search: { type: 'string', description: 'Optional product search text.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => callInternalGateway('daftra.products.list', args),
  },
  {
    name: 'daftra_list_clients',
    title: 'List Daftra clients',
    description: 'Read clients from Daftra using the existing Alazab gateway. Does not create or update clients.',
    inputSchema: {
      type: 'object',
      properties: {
        page: integerSchema(1, 100000, 1),
        limit: integerSchema(1, 100, 25),
        search: { type: 'string', description: 'Optional client search text.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => callInternalGateway('daftra.clients.list', args),
  },
  {
    name: 'daftra_list_invoices',
    title: 'List Daftra invoices',
    description: 'Read invoice records from Daftra using the existing Alazab gateway. Does not create, update, approve, or pay invoices.',
    inputSchema: {
      type: 'object',
      properties: {
        page: integerSchema(1, 100000, 1),
        limit: integerSchema(1, 100, 25),
        search: { type: 'string', description: 'Optional invoice search text.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => callInternalGateway('daftra.invoices.list', args),
  },
  {
    name: 'daftra_list_expenses',
    title: 'List Daftra expenses',
    description: 'Read expense records from Daftra using the existing Alazab gateway. Does not create, update, approve, or pay expenses.',
    inputSchema: {
      type: 'object',
      properties: {
        page: integerSchema(1, 100000, 1),
        limit: integerSchema(1, 100, 25),
        search: { type: 'string', description: 'Optional expense search text.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => callInternalGateway('daftra.expenses.list', args),
  },
  {
    name: 'daftra_list_work_orders',
    title: 'List Daftra work orders',
    description: 'Read work-order records from Daftra using the existing Alazab gateway. Does not change work orders.',
    inputSchema: {
      type: 'object',
      properties: {
        page: integerSchema(1, 100000, 1),
        limit: integerSchema(1, 100, 25),
        search: { type: 'string', description: 'Optional work-order search text.' },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
    securitySchemes: SECURITY_SCHEMES,
    handler: async (args) => callInternalGateway('daftra.work_orders.list', args),
  },
];

const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.name, tool]));

function publicTool(tool) {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: tool.annotations,
    securitySchemes: tool.securitySchemes,
  };
}

function toolErrorResult(message, challenge) {
  const result = {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
  if (challenge) result._meta = { 'mcp/www_authenticate': [challenge] };
  return result;
}

function toolSuccessResult(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: { data },
  };
}

function requestedProtocol(req) {
  const header = req.headers['mcp-protocol-version'];
  if (!header) return '2025-03-26';
  return String(header);
}

function validateProtocolHeader(req, body) {
  if (body?.method === 'initialize') return null;
  const version = requestedProtocol(req);
  return SUPPORTED_PROTOCOLS.has(version) ? null : version;
}

function validateOrigin(req, res, next) {
  const origin = req.headers.origin;
  if (!origin) return next();
  const normalized = String(origin).replace(/\/$/, '');
  if (!ALLOWED_ORIGINS.has(normalized)) {
    return res.status(403).json(jsonRpcError(null, -32000, 'Forbidden origin'));
  }
  return next();
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(validateOrigin);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'alazab-openai-mcp',
    version: '0.1.0',
    protocol: CURRENT_PROTOCOL,
    auth: AUTH_MODE,
    resource: RESOURCE,
    internal_gateway: INTERNAL_GATEWAY_URL,
    tools: TOOLS.length,
  });
});

app.get('/.well-known/oauth-protected-resource', (_req, res) => {
  if (AUTH_MODE !== 'supabase') {
    return res.json({ resource: RESOURCE, scopes_supported: [] });
  }

  return res.json({
    resource: RESOURCE,
    authorization_servers: [`${AUTH_SUPABASE_URL}/auth/v1`],
    scopes_supported: [REQUIRED_SCOPE],
    resource_documentation: 'https://ai-azab.co',
  });
});

app.get('/mcp', (_req, res) => {
  res.set('Allow', 'POST');
  res.status(405).end();
});

app.delete('/mcp', (_req, res) => {
  res.set('Allow', 'POST');
  res.status(405).end();
});

app.post('/mcp', async (req, res) => {
  const body = req.body;

  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return res.status(400).json(jsonRpcError(body?.id ?? null, -32600, 'Invalid Request'));
  }

  const unsupportedVersion = validateProtocolHeader(req, body);
  if (unsupportedVersion) {
    return res
      .status(400)
      .json(jsonRpcError(body.id ?? null, -32600, `Unsupported MCP-Protocol-Version: ${unsupportedVersion}`));
  }

  if (body.id === undefined || body.id === null) {
    if (body.method === 'notifications/initialized' || body.method === 'notifications/cancelled') {
      return res.status(202).end();
    }
    return res.status(202).end();
  }

  if (body.method === 'initialize') {
    const clientVersion = String(body.params?.protocolVersion || CURRENT_PROTOCOL);
    const negotiated = SUPPORTED_PROTOCOLS.has(clientVersion) ? clientVersion : CURRENT_PROTOCOL;
    return res.json(
      jsonRpcResult(body.id, {
        protocolVersion: negotiated,
        capabilities: { tools: { listChanged: false } },
        serverInfo: {
          name: 'alazab-operations',
          title: 'Alazab Operations',
          version: '0.1.0',
          description: 'Read-first Alazab maintenance and Daftra operations gateway.',
          websiteUrl: 'https://ai-azab.co',
        },
        instructions:
          'Read-only production access. Never infer missing identifiers. This endpoint does not expose approval, payment, raw SQL, shell, secret, or destructive tools.',
      })
    );
  }

  if (body.method === 'ping') {
    return res.json(jsonRpcResult(body.id, {}));
  }

  if (body.method === 'tools/list') {
    return res.json(jsonRpcResult(body.id, { tools: TOOLS.map(publicTool) }));
  }

  if (body.method === 'tools/call') {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};
    const tool = TOOL_MAP.get(toolName);

    if (!tool) {
      return res.json(jsonRpcError(body.id, -32602, `Unknown tool: ${toolName || '<missing>'}`));
    }

    let auth;
    try {
      auth = await authenticate(req);
    } catch (error) {
      const challenge = oauthChallenge(error.oauthError || 'invalid_token', error.message);
      res.set('WWW-Authenticate', challenge);
      return res.json(
        jsonRpcResult(
          body.id,
          toolErrorResult(`Authentication required: ${error.message}`, challenge)
        )
      );
    }

    try {
      const data = await tool.handler(args, auth);
      return res.json(jsonRpcResult(body.id, toolSuccessResult(data)));
    } catch (error) {
      const details = error.details ? `\n${JSON.stringify(error.details)}` : '';
      return res.json(
        jsonRpcResult(body.id, toolErrorResult(`Tool failed: ${error.message}${details}`))
      );
    }
  }

  return res.json(jsonRpcError(body.id, -32601, `Method not found: ${body.method}`));
});

app.use((error, _req, res, _next) => {
  console.error('[alazab-openai-mcp]', error);
  if (res.headersSent) return;
  res.status(500).json(jsonRpcError(null, -32603, 'Internal error'));
});

app.listen(PORT, HOST, () => {
  console.log(`[alazab-openai-mcp] listening on http://${HOST}:${PORT}/mcp`);
  console.log(`[alazab-openai-mcp] resource=${RESOURCE} auth=${AUTH_MODE} tools=${TOOLS.length}`);
});
