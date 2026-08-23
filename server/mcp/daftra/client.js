'use strict';

const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const { getAuthHeaders } = require('./auth');
const { validateOperationBody } = require('./schema-validator');
const { getOperation, requiredPathParams, schemaHasProperty, primaryBodyWrapper } = require('./registry');

function env(...names) {
  for (const name of names) if (process.env[name]) return process.env[name];
  return undefined;
}

function config() {
  const subdomain = env('DAFTRA_SUBDOMAIN') || 'alazab-co';
  return {
    baseUrl: String(env('DAFTRA_BASE_URL', 'DAFTRA_URL') || `https://${subdomain}.daftra.com/api2`).replace(/\/+$/, ''),
    timeout: Number(env('MCP_DAFTRA_TIMEOUT_MS') || 60000),
  };
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  return value;
}

function requestHash(op, payload) {
  return crypto.createHash('sha256').update(JSON.stringify(stable({ key: op.key, payload }))).digest('hex');
}

function buildPath(op, pathParams = {}) {
  let out = op.path;
  const params = { format: '.json', ...pathParams };
  for (const match of out.matchAll(/\{([^}]+)\}/g)) {
    const name = match[1];
    const value = params[name];
    if (value === undefined || value === null || value === '') throw new Error(`Missing path parameter: ${name}`);
    out = out.replace(`{${name}}`, encodeURIComponent(String(value)));
  }
  return out;
}

function normalizeBody(op, input) {
  if (input === undefined || input === null) return input;
  if (typeof input !== 'object' || Array.isArray(input)) return input;
  const schema = op.body?.schema;
  if (!schema?.properties) return input;

  const knownRoot = new Set(Object.keys(schema.properties));
  if (Object.keys(input).some((key) => knownRoot.has(key))) return input;

  const wrapper = primaryBodyWrapper(op);
  if (!wrapper) return input;

  const aux = {};
  const primary = { ...input };

  if (schema.properties.CostCenterTransaction && primary.cost_center_id && primary.amount !== undefined) {
    aux.CostCenterTransaction = [{ cost_center_id: primary.cost_center_id, amount: primary.amount }];
    delete primary.cost_center_id;
  }

  return { [wrapper]: primary, ...aux };
}

function injectIdempotency(op, body, idempotencyKey) {
  if (!body || !idempotencyKey || !schemaHasProperty(op.body?.schema, 'unique_id')) return body;
  const clone = JSON.parse(JSON.stringify(body));
  if (Object.prototype.hasOwnProperty.call(clone, 'unique_id')) return clone;
  const wrapper = primaryBodyWrapper(op);
  if (wrapper && clone[wrapper] && typeof clone[wrapper] === 'object') {
    if (!clone[wrapper].unique_id) clone[wrapper].unique_id = idempotencyKey;
  } else if (!clone.unique_id) {
    clone.unique_id = idempotencyKey;
  }
  return clone;
}

function validateOperationInput(op, payload, normalizedBody) {
  const missingPath = requiredPathParams(op).filter((name) => {
    const v = payload.path_params?.[name] ?? payload.pathParams?.[name] ?? payload[name];
    return v === undefined || v === null || v === '';
  });
  if (missingPath.length) throw new Error(`Missing required path parameter(s): ${missingPath.join(', ')}`);

  const query = payload.query || {};
  const missingQuery = (op.parameters || [])
    .filter((p) => p.in === 'query' && p.required)
    .map((p) => p.name)
    .filter((name) => query[name] === undefined || query[name] === null || query[name] === '');
  if (missingQuery.length) throw new Error(`Missing required query parameter(s): ${missingQuery.join(', ')}`);

  const bodyErrors = validateOperationBody(op, normalizedBody);
  if (bodyErrors.length) {
    const error = new Error(`Daftra OpenAPI validation failed: ${bodyErrors.join('; ')}`);
    error.code = 'DAFTRA_SCHEMA_VALIDATION';
    error.validation_errors = bodyErrors;
    throw error;
  }
}

function encodeBody(op, body) {
  const mediaType = op.body?.media_type || 'application/json';
  if (body === undefined) return { data: undefined, headers: {} };

  if (mediaType === 'multipart/form-data') {
    const form = new FormData();
    for (const [key, value] of Object.entries(body || {})) {
      if (value === undefined || value === null) continue;
      form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    return { data: form, headers: form.getHeaders() };
  }

  if (mediaType === 'application/x-www-form-urlencoded') {
    const form = new URLSearchParams();
    for (const [key, value] of Object.entries(body || {})) {
      if (value === undefined || value === null) continue;
      form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }
    return { data: form.toString(), headers: { 'Content-Type': mediaType } };
  }

  if (mediaType === 'text/plain') {
    const text = typeof body === 'string' ? body : (body?.text ?? body?.value ?? JSON.stringify(body));
    return { data: String(text), headers: { 'Content-Type': 'text/plain' } };
  }

  return { data: body, headers: { 'Content-Type': mediaType } };
}

async function authHeadersFor(op) {
  if (op.path === '/v2/oauth/token') return {};
  return getAuthHeaders();
}

async function callOperation(operationKey, payload = {}) {
  const op = getOperation(operationKey);
  const cfg = config();
  const pathParams = payload.path_params || payload.pathParams || {};
  const query = payload.query || {};
  let body = payload.body !== undefined ? payload.body : payload.data;
  body = normalizeBody(op, body);

  const hash = requestHash(op, { pathParams, query, body });
  const idempotencyKey = payload.idempotency_key || payload.idempotencyKey || `azab-${hash.slice(0, 48)}`;
  body = injectIdempotency(op, body, idempotencyKey);
  validateOperationInput(op, { ...payload, query }, body);

  const authHeaders = await authHeadersFor(op);
  const encoded = encodeBody(op, body);
  const headers = { Accept: 'application/json', ...authHeaders, ...encoded.headers };

  const urlPath = buildPath(op, pathParams);
  const started = Date.now();
  const response = await axios({
    method: op.method,
    url: `${cfg.baseUrl}${urlPath}`,
    params: query,
    data: encoded.data,
    headers,
    timeout: cfg.timeout,
    maxContentLength: Number(process.env.MCP_DAFTRA_MAX_RESPONSE_BYTES || 25 * 1024 * 1024),
    validateStatus: () => true,
  });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    operation: { key: op.key, method: op.method, path: op.path, summary: op.summary, group: op.group, domain: op.domain },
    request: { url_path: urlPath, query, body, request_hash: hash, idempotency_key: idempotencyKey },
    data: response.data,
    elapsed_ms: Date.now() - started,
  };
}

module.exports = { callOperation, normalizeBody, requestHash, buildPath, validateOperationInput };
