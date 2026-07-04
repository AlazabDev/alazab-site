const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const CONFIG_FILE = path.join(__dirname, '../config/dynamic-endpoints.json');

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
