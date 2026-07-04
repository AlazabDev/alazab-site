/**
 * routes/mcp.js — Secured proxy routes for local MCP gateway.
 * Public prefix when mounted by index.js: /api/mcp
 */

'use strict';

const express = require('express');
const axios = require('axios');

const router = express.Router();

function getConfiguredAccessKey() {
  return process.env.MCP_API_KEY || process.env.MCP_INTERNAL_KEY || process.env.ADMIN_API_KEY || '';
}

function requireMcpAccess(req, res, next) {
  const configuredKey = getConfiguredAccessKey();
  if (!configuredKey) {
    return res.status(503).json({ ok: false, error: 'MCP API access key is not configured' });
  }

  const provided =
    req.headers['x-mcp-key'] ||
    req.headers['x-admin-key'] ||
    req.headers['x-api-key'] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    '';

  if (!provided || provided !== configuredKey) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  return next();
}

router.use(requireMcpAccess);

function mcpBaseUrl() {
  return (process.env.MCP_BASE_URL || `http://127.0.0.1:${process.env.MCP_PORT || 4005}`).replace(/\/+$/, '');
}

function proxyHeaders(req) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Request-Id': req.requestId || req.headers['x-request-id'] || '',
  };

  if (process.env.MCP_INTERNAL_KEY) {
    headers['X-MCP-Key'] = process.env.MCP_INTERNAL_KEY;
  }

  return headers;
}

async function proxyGet(req, res, targetPath) {
  try {
    const response = await axios.get(`${mcpBaseUrl()}${targetPath}`, {
      params: req.query,
      headers: proxyHeaders(req),
      timeout: Number(process.env.MCP_PROXY_TIMEOUT_MS || 120000),
      validateStatus: () => true,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message, upstream: mcpBaseUrl() });
  }
}

async function proxyPost(req, res, targetPath) {
  try {
    const response = await axios.post(`${mcpBaseUrl()}${targetPath}`, req.body || {}, {
      headers: proxyHeaders(req),
      timeout: Number(process.env.MCP_PROXY_TIMEOUT_MS || 120000),
      validateStatus: () => true,
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(502).json({ ok: false, error: error.message, upstream: mcpBaseUrl() });
  }
}

router.get('/health', (req, res) => proxyGet(req, res, '/health'));
router.get('/tools', (req, res) => proxyGet(req, res, '/tools'));
router.get('/catalog/daftra', (req, res) => proxyGet(req, res, '/catalog/daftra'));
router.get('/catalog/maintenance', (req, res) => proxyGet(req, res, '/catalog/maintenance'));

router.post('/call', (req, res) => proxyPost(req, res, '/call'));
router.post('/mcp', (req, res) => proxyPost(req, res, '/mcp'));
router.post('/v1', (req, res) => proxyPost(req, res, '/v1'));
router.post('/v1/', (req, res) => proxyPost(req, res, '/v1'));
router.post('/', (req, res) => proxyPost(req, res, '/call'));

module.exports = router;
