const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONFIG_FILE = path.join(__dirname, '../config/dynamic-endpoints.json');

// ── Auth middleware — same contract as routes/admin.js ─────────────────
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return res.status(503).json({ error: 'Admin API not configured. Set ADMIN_API_KEY in .env' });
  }
  const provided =
    req.headers['x-admin-key'] ||
    (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// SSRF guard: only allow proxying to explicitly allow-listed target hosts.
// Configure via DYNAMIC_PROXY_ALLOWED_HOSTS="api.example.com,other.example.com"
const ALLOWED_TARGET_HOSTS = (process.env.DYNAMIC_PROXY_ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

function isAllowedTarget(target) {
  try {
    const u = new URL(target);
    if (!/^https?:$/.test(u.protocol)) return false;
    if (ALLOWED_TARGET_HOSTS.length === 0) return false;
    return ALLOWED_TARGET_HOSTS.includes(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Ensure config file exists
if (!fs.existsSync(path.dirname(CONFIG_FILE))) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
}
if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify([]));
}

function getEndpoints() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveEndpoints(endpoints) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(endpoints, null, 2));
}

// ── Admin APIs (to manage endpoints) ──────────────────────────────────
// All admin routes require the ADMIN_API_KEY header (see requireAdminKey).
router.use(requireAdminKey);

// GET /api/admin/endpoints
router.get('/endpoints', (req, res) => {
  res.json({ ok: true, endpoints: getEndpoints() });
});

// POST /api/admin/endpoints
router.post('/endpoints', (req, res) => {
  const { path: routePath, target, method = 'ALL', description = '' } = req.body;

  if (!routePath || !target) {
    return res.status(400).json({ ok: false, error: 'path and target are required' });
  }

  if (!isAllowedTarget(target)) {
    return res.status(400).json({
      ok: false,
      error: 'target host is not in DYNAMIC_PROXY_ALLOWED_HOSTS allow-list',
    });
  }

  const endpoints = getEndpoints();
  const existingIndex = endpoints.findIndex(e => e.path === routePath);
  
  const newEndpoint = {
    id: Date.now().toString(),
    path: routePath.startsWith('/') ? routePath : '/' + routePath,
    target,
    method: method.toUpperCase(),
    description,
    createdAt: new Date().toISOString()
  };

  if (existingIndex > -1) {
    endpoints[existingIndex] = { ...endpoints[existingIndex], ...newEndpoint, id: endpoints[existingIndex].id };
  } else {
    endpoints.push(newEndpoint);
  }

  saveEndpoints(endpoints);
  res.json({ ok: true, endpoint: newEndpoint });
});

// DELETE /api/admin/endpoints/:id
router.delete('/endpoints/:id', (req, res) => {
  let endpoints = getEndpoints();
  endpoints = endpoints.filter(e => e.id !== req.params.id);
  saveEndpoints(endpoints);
  res.json({ ok: true });
});

// ── Dynamic Proxy Middleware ─────────────────────────────────────────
const dynamicRouter = express.Router();

dynamicRouter.all('*', async (req, res, next) => {
  const endpoints = getEndpoints();
  
  // Find matching endpoint
  const match = endpoints.find(e => 
    req.path === e.path && 
    (e.method === 'ALL' || e.method === req.method)
  );

  if (!match) {
    return next(); // Continue to other routes if no match
  }

  try {
    const response = await axios({
      method: req.method,
      url: match.target,
      headers: { ...req.headers, host: new URL(match.target).host },
      data: req.body,
      params: req.query,
      validateStatus: () => true
    });

    for (const [key, value] of Object.entries(response.headers)) {
      if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    res.status(response.status).send(response.data);
  } catch (err) {
    res.status(502).json({ error: 'Bad Gateway', details: err.message });
  }
});

module.exports = {
  adminRoutes: router,
  dynamicRouter
};
