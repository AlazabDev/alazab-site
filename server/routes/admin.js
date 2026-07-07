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
const { execFile } = require('child_process');
const { buildRegistry, runAudit } = require('../scripts/link-audit');

// ── Auth middleware ────────────────────────────────────────────
function requireAdminKey(req, res, next) {
  const adminKey = process.env.ADMIN_API_KEY;

  // If no key configured, block access entirely
  if (!adminKey) {
    return res.status(503).json({
      error: 'Admin API not configured. Set ADMIN_API_KEY in .env',
    });
  }

  // Only accept the key via headers — never query string (leaks in logs/referrers)
  const provided =
    req.headers['x-admin-key'] ||
    req.headers['authorization']?.replace(/^Bearer\s+/i, '');

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


// ── Service management + link audit ───────────────────────────
const PM2_ALLOWLIST = new Set(
  String(process.env.ADMIN_PM2_SERVICES || 'alazab-api,alazab-mcp')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

const SYSTEMD_ALLOWLIST = new Set(
  String(process.env.ADMIN_SYSTEMD_SERVICES || 'whatsapp-seafile,azab-whatsapp-seafile,nginx,postgresql')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
);

function runExec(command, args = [], options = {}) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: options.timeout || 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        signal: error?.signal,
        stdout: String(stdout || '').trim(),
        stderr: String(stderr || '').trim(),
        command: [command, ...args].join(' '),
      });
    });
  });
}

async function readPm2Services() {
  const result = await runExec('pm2', ['jlist'], { timeout: 10000 });
  if (!result.ok) return { ok: false, error: result.stderr || result.stdout || 'pm2 not available', services: [] };

  try {
    const apps = JSON.parse(result.stdout || '[]');
    return {
      ok: true,
      services: apps.map((app) => ({
        manager: 'pm2',
        name: app.name,
        allowed: PM2_ALLOWLIST.has(app.name),
        status: app.pm2_env?.status || 'unknown',
        pid: app.pid,
        restarts: app.pm2_env?.restart_time,
        uptime: app.pm2_env?.pm_uptime ? new Date(app.pm2_env.pm_uptime).toISOString() : null,
        memory: app.monit?.memory || 0,
        cpu: app.monit?.cpu || 0,
      })),
    };
  } catch (error) {
    return { ok: false, error: error.message, services: [] };
  }
}

async function systemdStatus(name) {
  const [active, enabled] = await Promise.all([
    runExec('systemctl', ['is-active', name], { timeout: 5000 }),
    runExec('systemctl', ['is-enabled', name], { timeout: 5000 }),
  ]);

  return {
    manager: 'systemd',
    name,
    allowed: SYSTEMD_ALLOWLIST.has(name),
    status: active.stdout || 'unknown',
    enabled: enabled.stdout || 'unknown',
    ok: active.stdout === 'active',
  };
}

async function readSystemdServices() {
  const services = await Promise.all(Array.from(SYSTEMD_ALLOWLIST).map(systemdStatus));
  return { ok: true, services };
}

async function runServiceAction(manager, name, action) {
  const safeAction = String(action || '').toLowerCase();
  const safeName = String(name || '').trim();
  const safeManager = String(manager || '').toLowerCase();

  if (!safeName || !/^[a-zA-Z0-9_.@:-]+$/.test(safeName)) {
    throw new Error('Invalid service name');
  }

  if (safeManager === 'pm2') {
    if (!PM2_ALLOWLIST.has(safeName)) throw new Error(`PM2 service is not allowed: ${safeName}`);
    const allowed = new Set(['start', 'stop', 'restart', 'reload', 'delete']);
    if (!allowed.has(safeAction)) throw new Error(`Unsupported PM2 action: ${safeAction}`);
    return runExec('pm2', [safeAction, safeName], { timeout: 30000 });
  }

  if (safeManager === 'systemd') {
    if (!SYSTEMD_ALLOWLIST.has(safeName)) throw new Error(`systemd service is not allowed: ${safeName}`);
    const allowed = new Set(['start', 'stop', 'restart', 'reload', 'status']);
    if (!allowed.has(safeAction)) throw new Error(`Unsupported systemd action: ${safeAction}`);
    return runExec('systemctl', [safeAction, safeName], { timeout: 30000 });
  }

  throw new Error(`Unsupported service manager: ${safeManager}`);
}

// GET /api/admin/services — PM2 + systemd service inventory
router.get('/services', async (req, res) => {
  const [pm2, systemd] = await Promise.allSettled([readPm2Services(), readSystemdServices()]);
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    pm2: pm2.status === 'fulfilled' ? pm2.value : { ok: false, error: pm2.reason?.message, services: [] },
    systemd: systemd.status === 'fulfilled' ? systemd.value : { ok: false, error: systemd.reason?.message, services: [] },
    allowlists: {
      pm2: Array.from(PM2_ALLOWLIST),
      systemd: Array.from(SYSTEMD_ALLOWLIST),
    },
  });
});

// POST /api/admin/services/action — controlled start/stop/restart/reload
router.post('/services/action', async (req, res) => {
  try {
    const { manager, name, action } = req.body || {};
    const result = await runServiceAction(manager, name, action);
    res.status(result.ok ? 200 : 500).json({ ok: result.ok, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

// GET /api/admin/routes — all discovered + legacy routes without network check
router.get('/routes', (req, res) => {
  const routes = buildRegistry();
  res.json({ ok: true, count: routes.length, routes });
});

// GET /api/admin/link-audit — run the comprehensive checker
router.get('/link-audit', async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl || req.query.base || process.env.PUBLIC_BASE_URL || 'https://alazab.com';
    const timeoutMs = Number(req.query.timeoutMs || req.query.timeout || 10000);
    const concurrency = Number(req.query.concurrency || 8);
    const publicOnly = ['1', 'true', 'yes'].includes(String(req.query.publicOnly || '').toLowerCase());
    const report = await runAudit({ baseUrls: String(baseUrl).split(/[\s,]+/), timeoutMs, concurrency, includeOnlyPublic: publicOnly });
    res.json(report);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/admin/link-audit — body-based audit for UI and automations
router.post('/link-audit', async (req, res) => {
  try {
    const body = req.body || {};
    const baseUrls = body.baseUrls || body.base_urls || body.baseUrl || body.base || process.env.PUBLIC_BASE_URL || 'https://alazab.com';
    const report = await runAudit({
      baseUrls: Array.isArray(baseUrls) ? baseUrls : String(baseUrls).split(/[\s,]+/),
      timeoutMs: Number(body.timeoutMs || body.timeout || 10000),
      concurrency: Number(body.concurrency || 8),
      includeOnlyPublic: Boolean(body.publicOnly),
    });
    res.json(report);
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
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
