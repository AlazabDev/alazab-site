/**
 * routes/admin.js — Admin dashboard API
 * ======================================
 * Protected by ADMIN_API_KEY environment variable.
 * All endpoints return JSON for use by the dashboard UI.
 *
 * Routes:
 *   GET  /api/admin/status   — Full system status
 *   GET  /api/admin/metrics  — Memory, CPU, uptime
 *   GET  /api/admin/logs     — Recent log lines
 *   GET  /api/admin/env      — Masked env check
 *   POST /api/admin/ping-mcp — Ping MCP server
 */

'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// ── Auth middleware ────────────────────────────────────────────
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;

  // If no key configured, block access entirely
  if (!adminKey) {
    return res.status(503).json({
      error: 'Admin API not configured. Set ADMIN_API_KEY in .env',
    });
  }

  const provided =
    req.headers['x-admin-key'] ||
    req.headers['authorization']?.replace('Bearer ', '') ||
    req.query.key;

  if (!provided || provided !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

router.use(requireAdminKey);

// ── Helpers ────────────────────────────────────────────────────
function maskValue(value) {
  if (!value) return '❌ missing';
  if (value.length <= 8) return '••••••••';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function bytesToMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

async function pingMCP() {
  const MCP_URL = process.env.MCP_URL || `http://localhost:${process.env.MCP_PORT || 4005}/mcp`;
  try {
    const res = await axios.post(MCP_URL, { tool: 'ping' }, { timeout: 3000 });
    return { ok: true, data: res.data, url: MCP_URL };
  } catch (err) {
    return { ok: false, error: err.message, url: MCP_URL };
  }
}

async function checkDatabase() {
  try {
    const db = require('../db');
    await db.query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkSupabase() {
  try {
    const { getSupabaseStatus } = require('../supabase');
    return await getSupabaseStatus();
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

function readLogTail(filename, lines = 100) {
  try {
    const logPath = path.join(__dirname, '..', 'logs', filename);
    if (!fs.existsSync(logPath)) return [];

    const content = fs.readFileSync(logPath, 'utf8');
    const allLines = content.trim().split('\n').filter(Boolean);
    const tail = allLines.slice(-lines);

    return tail.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, level: 'raw' };
      }
    });
  } catch {
    return [];
  }
}

// ── GET /api/admin/status ──────────────────────────────────────
router.get('/status', async (req, res) => {
  const [mcp, db, supabase] = await Promise.allSettled([
    pingMCP(),
    checkDatabase(),
    checkSupabase(),
  ]);

  const mem = process.memoryUsage();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    server: {
      name: 'Alazab API Server',
      env: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3004,
      uptime_seconds: Math.floor(process.uptime()),
      uptime_human: formatUptime(process.uptime()),
      pid: process.pid,
      node_version: process.version,
    },
    services: {
      api: { ok: true, port: process.env.PORT || 3004 },
      mcp: mcp.status === 'fulfilled' ? mcp.value : { ok: false, error: mcp.reason?.message },
      database: db.status === 'fulfilled' ? db.value : { ok: false, error: db.reason?.message },
      supabase:
        supabase.status === 'fulfilled'
          ? supabase.value
          : { connected: false, error: supabase.reason?.message },
    },
    memory: {
      rss_mb: bytesToMB(mem.rss),
      heap_used_mb: bytesToMB(mem.heapUsed),
      heap_total_mb: bytesToMB(mem.heapTotal),
      external_mb: bytesToMB(mem.external),
    },
  });
});

// ── GET /api/admin/metrics ─────────────────────────────────────
router.get('/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const cpu = process.cpuUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    cpu: {
      user: cpu.user,
      system: cpu.system,
    },
    pid: process.pid,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
  });
});

// ── GET /api/admin/logs ────────────────────────────────────────
router.get('/logs', (req, res) => {
  const type = req.query.type || 'combined'; // combined | error
  const lines = Math.min(parseInt(req.query.lines) || 100, 500);

  const filename = type === 'error' ? 'app-error.log' : 'app-combined.log';
  const entries = readLogTail(filename, lines);

  res.json({
    ok: true,
    file: filename,
    count: entries.length,
    entries,
  });
});

// ── GET /api/admin/env ─────────────────────────────────────────
router.get('/env', (req, res) => {
  const vars = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    FRONTEND_URL: process.env.FRONTEND_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    WHATSAPP_VERIFY_TOKEN:
      process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    META_APP_SECRET: process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
    ELEVENLABS_AGENT_ID: process.env.ELEVENLABS_AGENT_ID,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    MCP_PORT: process.env.MCP_PORT,
  };

  const masked = {};
  for (const [k, v] of Object.entries(vars)) {
    masked[k] = maskValue(v);
  }

  res.json({ ok: true, env: masked });
});

// ── POST /api/admin/ping-mcp ───────────────────────────────────
router.post('/ping-mcp', async (req, res) => {
  const result = await pingMCP();
  res.json(result);
});

// ── GET /api/admin/log-files ───────────────────────────────────
router.get('/log-files', (req, res) => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) return res.json({ files: [] });

    const files = fs.readdirSync(logsDir).map((name) => {
      const stat = fs.statSync(path.join(logsDir, name));
      return {
        name,
        size_kb: (stat.size / 1024).toFixed(1),
        modified: stat.mtime.toISOString(),
      };
    });

    res.json({ ok: true, files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Helpers ────────────────────────────────────────────────────
function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = router;
