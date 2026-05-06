/**
 * mcp/server.js — MCP Gateway Server (CommonJS)
 * ===============================================
 * Receives tool calls from the main API server and dispatches them.
 * Running on MCP_PORT (default: 4005) bound to 127.0.0.1.
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const app = express();
const PORT = Number(process.env.MCP_PORT || 4005);
const APP_NAME = 'alazab-mcp';

app.use(express.json({ limit: '1mb' }));

// ── Request ID ────────────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ── Tool registry ─────────────────────────────────────────────
const tools = {
  ping: async () => ({
    ok: true,
    tool: 'ping',
    message: 'pong',
    timestamp: new Date().toISOString(),
  }),

  echo: async (payload) => ({
    ok: true,
    tool: 'echo',
    payload: payload ?? null,
    timestamp: new Date().toISOString(),
  }),

  health: async () => ({
    ok: true,
    tool: 'health',
    service: APP_NAME,
    port: PORT,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }),

  list_tools: async () => ({
    ok: true,
    tool: 'list_tools',
    tools: Object.keys(tools),
    timestamp: new Date().toISOString(),
  }),

  system_info: async () => ({
    ok: true,
    tool: 'system_info',
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  }),
};

// ── Health endpoint ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: APP_NAME,
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Main MCP endpoint ─────────────────────────────────────────
app.post('/mcp', async (req, res) => {
  try {
    const { tool, payload } = req.body || {};

    if (!tool || typeof tool !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'tool is required and must be a string',
        requestId: req.requestId,
      });
    }

    const handler = tools[tool];

    if (!handler) {
      return res.status(404).json({
        ok: false,
        error: `Unknown tool: ${tool}`,
        available_tools: Object.keys(tools),
        requestId: req.requestId,
      });
    }

    console.log(`[MCP] tool=${tool} requestId=${req.requestId}`);
    const result = await handler(payload);
    return res.json({ ...result, requestId: req.requestId });
  } catch (error) {
    console.error('[MCP ERROR]', { message: error.message, requestId: req.requestId });
    return res.status(500).json({
      ok: false,
      error: error.message || 'Internal MCP server error',
      requestId: req.requestId,
    });
  }
});

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Route not found' });
});

// ── Start ─────────────────────────────────────────────────────
const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`MCP Gateway running on http://127.0.0.1:${PORT}`);
  console.log(`Available tools: ${Object.keys(tools).join(', ')}`);
});

// ── Graceful shutdown ─────────────────────────────────────────
function shutdown(signal) {
  console.log(`[MCP] ${signal} received — shutting down`);
  server.close(() => {
    console.log('[MCP] Server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
