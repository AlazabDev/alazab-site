#!/usr/bin/env node
/**
 * scripts/link-audit.js — Comprehensive link and endpoint auditor
 * =================================================================
 * Scans the Express application routes, merges legacy and production
 * endpoints, then checks them against one or more base URLs.
 *
 * CLI:
 *   node scripts/link-audit.js --base https://alazab.com
 *   node scripts/link-audit.js --base https://alazab.com --base https://n8n.alazab.com --json
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

const SERVER_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(SERVER_DIR, '.env');

function loadEnv(file = ENV_PATH) {
  const env = { ...process.env };
  if (!fs.existsSync(file)) return env;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith('#') || !s.includes('=')) continue;
    const idx = s.indexOf('=');
    const key = s.slice(0, idx).trim();
    let value = s.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in env)) env[key] = value;
  }
  return env;
}

const ENV = loadEnv();

function env(...names) {
  for (const name of names) {
    if (ENV[name]) return ENV[name];
  }
  return undefined;
}

function normalizeBaseUrl(input) {
  return String(input || '').trim().replace(/\/+$/, '');
}

function normalizePath(input) {
  let out = String(input || '/').trim();
  if (!out.startsWith('/')) out = `/${out}`;
  out = out.replace(/\/\/+/, '/');
  return out;
}

function joinPath(prefix, child) {
  const a = normalizePath(prefix || '/').replace(/\/+$/, '');
  const b = normalizePath(child || '/');
  if (a === '') return b;
  if (a === '/') return b;
  if (b === '/') return a || '/';
  return `${a}${b}`.replace(/\/+/g, '/');
}

function cleanExpressPath(p) {
  if (!p) return '/';
  let out = String(p)
    .replace(/\/:([A-Za-z0-9_]+)/g, '/TEST_ID')
    .replace(/\{([^}]+)\}/g, 'TEST_ID')
    .replace(/\*/g, 'health')
    .replace(/\/+$/, '');
  return out || '/';
}

function parseRequires(indexContent) {
  const map = new Map();
  const re = /const\s+([A-Za-z0-9_]+)\s*=\s*require\(['"]\.\/routes\/([^'"]+)['"]\)/g;
  let m;
  while ((m = re.exec(indexContent))) {
    map.set(m[1], `${m[2]}.js`);
  }
  return map;
}

function extractIndexRoutes(indexContent) {
  const routes = [];
  const methodRe = /app\.(get|post|put|patch|delete|all)\(\s*(['"])([^'"]+)\2/g;
  let m;
  while ((m = methodRe.exec(indexContent))) {
    routes.push({ method: m[1].toUpperCase(), path: cleanExpressPath(m[3]), source: 'index.js', auth: 'public' });
  }
  return routes;
}

function extractMounts(indexContent, requireMap) {
  const mounts = [];
  const useRe = /app\.use\(\s*(['"])([^'"]+)\1\s*,\s*(?:[A-Za-z0-9_]+\s*,\s*)*([A-Za-z0-9_]+)\s*\)/g;
  let m;
  while ((m = useRe.exec(indexContent))) {
    const prefix = cleanExpressPath(m[2]);
    const variable = m[3];
    const file = requireMap.get(variable);
    if (file) mounts.push({ prefix, variable, file });
  }
  return mounts;
}

function extractRouterRoutes(filePath, prefix) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const routes = [];
  const routeFile = path.relative(SERVER_DIR, filePath);
  const re = /router\.(get|post|put|patch|delete|all)\(\s*(['"])([^'"]*)\2/g;
  let m;
  while ((m = re.exec(content))) {
    routes.push({
      method: m[1].toUpperCase(),
      path: cleanExpressPath(joinPath(prefix, m[3] || '/')),
      source: routeFile,
      auth: inferAuth(prefix, routeFile, content),
    });
  }
  return routes;
}

function inferAuth(prefix, source, content = '') {
  if (prefix.startsWith('/api/admin') || prefix.startsWith('/api/mcp')) return 'admin';
  if (source.includes('elevenlabs-v1')) return 'elevenlabs';
  if (source.includes('webhook') && content.includes('verifyMetaSignature')) return 'meta_signed';
  return 'public';
}

function discoverExpressRoutes() {
  const indexPath = path.join(SERVER_DIR, 'index.js');
  if (!fs.existsSync(indexPath)) return [];
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const requireMap = parseRequires(indexContent);
  const routes = extractIndexRoutes(indexContent);
  const mounts = extractMounts(indexContent, requireMap);
  for (const mount of mounts) {
    routes.push(...extractRouterRoutes(path.join(SERVER_DIR, 'routes', mount.file), mount.prefix));
  }
  return routes;
}

function legacyRoutes() {
  return [
    { method: 'GET', path: '/', group: 'core', auth: 'public', note: 'site root' },
    { method: 'GET', path: '/dashboard', group: 'admin-ui', auth: 'public', note: 'new graphical dashboard' },
    { method: 'GET', path: '/admin', group: 'admin-ui', auth: 'public', note: 'dashboard alias' },
    { method: 'GET', path: '/admin/dashboard', group: 'admin-ui', auth: 'public', note: 'dashboard alias' },
    { method: 'GET', path: '/webhook/wauf/whatsapp', group: 'whatsapp-seafile', auth: 'whatsapp_verify', note: 'production direct webhook' },
    { method: 'POST', path: '/webhook/wauf/whatsapp', group: 'whatsapp-seafile', auth: 'public', note: 'production direct webhook POST' },
    { method: 'GET', path: '/api/v1/webhook/wauf/whatsapp', group: 'legacy', auth: 'whatsapp_verify', note: 'legacy alias' },
    { method: 'POST', path: '/api/v1/webhook/wauf/whatsapp', group: 'legacy', auth: 'public', note: 'legacy alias' },
    { method: 'GET', path: '/api/webhook/whatsapp', group: 'whatsapp-old', auth: 'whatsapp_verify', note: 'old API webhook verify' },
    { method: 'POST', path: '/api/webhook/whatsapp', group: 'whatsapp-old', auth: 'meta_signed', note: 'old API webhook signed POST' },
    { method: 'GET', path: '/api/mcp/health', group: 'mcp', auth: 'admin' },
    { method: 'GET', path: '/api/mcp/tools', group: 'mcp', auth: 'admin' },
    { method: 'GET', path: '/api/mcp/catalog/daftra', group: 'mcp', auth: 'admin' },
    { method: 'GET', path: '/api/mcp/catalog/maintenance', group: 'mcp', auth: 'admin' },
    { method: 'POST', path: '/api/mcp/call', group: 'mcp', auth: 'admin', payload: { tool: 'ping', args: {} } },
    { method: 'POST', path: '/api/mcp/v1', group: 'mcp', auth: 'admin', payload: { tool: 'ping', args: {} } },
    { method: 'GET', path: '/api/admin/services', group: 'admin', auth: 'admin' },
    { method: 'GET', path: '/api/admin/routes', group: 'admin', auth: 'admin' },
  ];
}

function routeKey(route) {
  return `${route.method.toUpperCase()} ${route.path}`;
}

function buildRegistry(options = {}) {
  const discovered = discoverExpressRoutes().map((r) => ({ ...r, group: r.group || 'discovered' }));
  const manual = legacyRoutes();
  const all = [...manual, ...discovered];
  const seen = new Map();
  for (const r of all) {
    if (r.path === '/api/admin/link-audit') continue; // Prevent infinite recursion

    const method = (r.method || 'GET').toUpperCase();
    const route = {
      method,
      path: cleanExpressPath(r.path),
      group: r.group || 'discovered',
      auth: r.auth || 'public',
      source: r.source || 'manual',
      note: r.note || '',
      payload: r.payload,
      expected: r.expected,
    };
    const key = routeKey(route);
    if (!seen.has(key)) seen.set(key, route);
    else {
      const current = seen.get(key);
      seen.set(key, { ...current, ...route, source: `${current.source},${route.source}` });
    }
  }
  const routes = Array.from(seen.values()).sort((a, b) => `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`));
  if (options.includeOnlyPublic) return routes.filter((r) => r.auth === 'public' || r.auth === 'whatsapp_verify');
  return routes;
}

function buildRequest(route, baseUrl) {
  const adminKey = env('ADMIN_API_KEY');
  const elevenKey = env('ELEVENLABS_CHATBOT_API_KEY', 'ELEVENLABS_ADMIN_API_KEY', 'ELEVENLABS_API_KEY');
  const verifyToken = env('WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'WA_VERIFY_TOKEN');
  const appSecret = env('META_APP_SECRET', 'FACEBOOK_APP_SECRET');
  let pathWithQuery = route.path;
  let body = route.payload !== undefined ? JSON.stringify(route.payload) : '{}';
  const headers = {
    Accept: 'application/json,text/plain,*/*',
    'User-Agent': 'Alazab-Link-Auditor/2.0',
  };

  if (route.auth === 'admin' && adminKey) {
    headers['X-Admin-Key'] = adminKey;
    headers.Authorization = `Bearer ${adminKey}`;
  }

  if (route.auth === 'elevenlabs' && elevenKey) {
    headers['X-API-Key'] = elevenKey;
    headers['x-api-key'] = elevenKey;
    headers['X-Admin-Key'] = env('ELEVENLABS_ADMIN_API_KEY') || elevenKey;
  }

  if (route.auth === 'whatsapp_verify') {
    const sep = pathWithQuery.includes('?') ? '&' : '?';
    pathWithQuery += `${sep}hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken || 'AZAB_TEST_TOKEN')}&hub.challenge=AZAB_TEST_OK`;
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method)) {
    headers['Content-Type'] = 'application/json';
  }

  if (route.auth === 'meta_signed' && appSecret) {
    body = JSON.stringify({ object: 'whatsapp_business_account', entry: [{ id: 'test', changes: [] }] });
    headers['Content-Type'] = 'application/json';
    headers['x-hub-signature-256'] = 'sha256=' + crypto.createHmac('sha256', appSecret).update(body).digest('hex');
  }

  return {
    url: `${normalizeBaseUrl(baseUrl)}${pathWithQuery}`,
    method: route.method,
    headers,
    body,
  };
}

function requestOnce(config, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const started = Date.now();
    let url;
    try {
      url = new URL(config.url);
    } catch (error) {
      return resolve({ status: 0, ok: false, error: error.message, ms: 0 });
    }

    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      url,
      {
        method: config.method,
        headers: config.headers,
        timeout: timeoutMs,
        rejectUnauthorized: false,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          if (data.length < 500) data += chunk.toString('utf8');
        });
        res.on('end', () => {
          resolve({
            status: res.statusCode || 0,
            ok: classifyStatus(res.statusCode || 0),
            ms: Date.now() - started,
            content_type: res.headers['content-type'] || '',
            sample: data.slice(0, 240),
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    req.on('error', (error) => {
      resolve({ status: 0, ok: false, error: error.message, ms: Date.now() - started });
    });

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) req.write(config.body || '{}');
    req.end();
  });
}

function classifyStatus(status) {
  // 400/401/403/405 are treated as reachable because they prove the link is alive
  // and protected/validated. 404 and 000 remain failures.
  return [200, 201, 202, 204, 301, 302, 304, 400, 401, 403, 405].includes(Number(status));
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, next));
  return results;
}

async function runAudit(options = {}) {
  const baseUrls = (options.baseUrls || [options.baseUrl || env('LINK_BASE_URLS') || env('PUBLIC_BASE_URL') || 'https://alazab.com'])
    .flatMap((v) => String(v).split(/[\s,]+/))
    .map(normalizeBaseUrl)
    .filter(Boolean);

  const timeoutMs = Number(options.timeoutMs || options.timeout || env('LINK_CHECK_TIMEOUT_MS') || 10000);
  const concurrency = Number(options.concurrency || env('LINK_CHECK_CONCURRENCY') || 8);
  const routes = options.routes || buildRegistry(options);
  const targets = [];

  for (const baseUrl of baseUrls) {
    for (const route of routes) targets.push({ baseUrl, route });
  }

  const results = await runWithConcurrency(targets, concurrency, async ({ baseUrl, route }) => {
    const req = buildRequest(route, baseUrl);
    const res = await requestOnce(req, timeoutMs);
    return {
      base_url: baseUrl,
      method: route.method,
      path: route.path,
      group: route.group,
      auth: route.auth,
      source: route.source,
      note: route.note,
      url: req.url,
      status: res.status,
      ok: res.ok,
      ms: res.ms,
      content_type: res.content_type,
      error: res.error,
      sample: res.sample,
    };
  });

  const summary = {
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    total: results.length,
    base_urls: baseUrls,
    route_count: routes.length,
    checked_at: new Date().toISOString(),
  };

  return { ok: summary.failed === 0, summary, routes, results };
}

function parseCliArgs(argv) {
  const options = { baseUrls: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--base' || arg === '--base-url') options.baseUrls.push(argv[++i]);
    else if (arg.startsWith('--base=')) options.baseUrls.push(arg.split('=').slice(1).join('='));
    else if (arg === '--json') options.json = true;
    else if (arg === '--public-only') options.includeOnlyPublic = true;
    else if (arg === '--timeout') options.timeoutMs = Number(argv[++i]);
    else if (arg.startsWith('--timeout=')) options.timeoutMs = Number(arg.split('=')[1]);
    else if (arg === '--concurrency') options.concurrency = Number(argv[++i]);
    else if (arg.startsWith('--concurrency=')) options.concurrency = Number(arg.split('=')[1]);
  }
  if (!options.baseUrls.length) {
    const fromEnv = env('LINK_BASE_URLS') || env('PUBLIC_BASE_URL') || 'https://alazab.com';
    options.baseUrls = String(fromEnv).split(/[\s,]+/).filter(Boolean);
  }
  return options;
}

function printHuman(report) {
  console.log('===== ALAZAB LINK AUDIT =====');
  console.log(`Checked: ${report.summary.checked_at}`);
  console.log(`Bases:   ${report.summary.base_urls.join(', ')}`);
  console.log(`Routes:  ${report.summary.route_count}`);
  console.log(`OK:      ${report.summary.ok}`);
  console.log(`Failed:  ${report.summary.failed}`);
  console.log('');
  for (const r of report.results) {
    const icon = r.ok ? '✅' : '❌';
    const code = String(r.status || '000').padEnd(4, ' ');
    const method = r.method.padEnd(6, ' ');
    const group = String(r.group || '').padEnd(18, ' ').slice(0, 18);
    const ms = `${r.ms || 0}ms`.padStart(7, ' ');
    console.log(`${icon} ${code} ${method} ${group} ${ms} ${r.url}`);
    if (!r.ok && r.error) console.log(`   └─ ${r.error}`);
  }
}

if (require.main === module) {
  (async () => {
    const options = parseCliArgs(process.argv.slice(2));
    const report = await runAudit(options);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printHuman(report);
    process.exit(report.summary.failed > 0 ? 1 : 0);
  })().catch((error) => {
    if (process.argv.includes('--json')) console.log(JSON.stringify({ ok: false, error: error.message }, null, 2));
    else console.error('LINK_AUDIT_FAILED:', error.message);
    process.exit(1);
  });
}

module.exports = {
  buildRegistry,
  runAudit,
  loadEnv,
};
