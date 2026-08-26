'use strict';

const os = require('os');
const crypto = require('crypto');
const { promisify } = require('util');
const { execFile } = require('child_process');
const axios = require('axios');

const execFileAsync = promisify(execFile);
const pending = new Map();

function csv(name, fallback = '') {
  return new Set(String(process.env[name] || fallback).split(',').map((x) => x.trim()).filter(Boolean));
}

function normalizePhone(value) {
  return String(value || '').replace(/\D+/g, '');
}

function allowedSender(sender) {
  const allow = new Set([...csv('CENTRAL_WHATSAPP_COMMAND_ALLOWLIST')].map(normalizePhone).filter(Boolean));
  return allow.size > 0 && allow.has(normalizePhone(sender));
}

function pm2Allowlist() {
  return csv('CENTRAL_COMMAND_PM2_ALLOWLIST', 'alazab-api,alazab-mcp,alazab-daftra-mcp,alazab-openai-mcp,alazab-central-webhook');
}

function commandCatalog() {
  return [
    { action: 'system.health', mutating: false, description: 'حالة السيرفر والذاكرة والتحميل' },
    { action: 'server.disk', mutating: false, description: 'مساحة القرص' },
    { action: 'pm2.status', mutating: false, description: 'حالة خدمات PM2' },
    { action: 'pm2.restart', mutating: true, targets: [...pm2Allowlist()], description: 'إعادة تشغيل خدمة PM2 معتمدة' },
    { action: 'nginx.test', mutating: false, description: 'فحص إعداد Nginx' },
    { action: 'nginx.reload', mutating: true, description: 'إعادة تحميل Nginx بعد الفحص' },
    { action: 'daftra.health', mutating: false, description: 'حالة Azab Daftra MCP' },
    { action: 'git.status', mutating: false, description: 'حالة مستودع alazab-site على السيرفر' },
  ];
}

function isMutating(action) {
  return ['pm2.restart', 'nginx.reload'].includes(action);
}

function validateTarget(action, target) {
  if (action === 'pm2.restart' && !pm2Allowlist().has(String(target || ''))) {
    throw new Error(`PM2 target is not allowed: ${target || 'missing'}`);
  }
}

async function runFile(file, args = [], options = {}) {
  const result = await execFileAsync(file, args, {
    timeout: Number(process.env.CENTRAL_COMMAND_TIMEOUT_MS || 20000),
    maxBuffer: 1024 * 1024,
    ...options,
  });
  return {
    stdout: String(result.stdout || '').trim().slice(0, 12000),
    stderr: String(result.stderr || '').trim().slice(0, 12000),
  };
}

async function execute(action, target) {
  validateTarget(action, target);

  if (action === 'system.health') {
    return {
      hostname: os.hostname(),
      uptime_seconds: Math.floor(os.uptime()),
      loadavg: os.loadavg(),
      total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
      free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
      node: process.version,
    };
  }
  if (action === 'server.disk') return runFile('/usr/bin/df', ['-h', '/']);
  if (action === 'pm2.status') return runFile(process.env.CENTRAL_PM2_BIN || 'pm2', ['jlist']);
  if (action === 'pm2.restart') return runFile(process.env.CENTRAL_PM2_BIN || 'pm2', ['restart', target, '--update-env']);
  if (action === 'nginx.test') return runFile(process.env.CENTRAL_NGINX_BIN || '/usr/sbin/nginx', ['-t']);
  if (action === 'nginx.reload') {
    await runFile(process.env.CENTRAL_NGINX_BIN || '/usr/sbin/nginx', ['-t']);
    return runFile(process.env.CENTRAL_SYSTEMCTL_BIN || '/usr/bin/systemctl', ['reload', 'nginx']);
  }
  if (action === 'daftra.health') {
    const response = await axios.get(process.env.CENTRAL_DAFTRA_HEALTH_URL || 'http://127.0.0.1:4007/healthz', {
      timeout: 5000,
      validateStatus: () => true,
    });
    return { status: response.status, data: response.data };
  }
  if (action === 'git.status') {
    const cwd = process.env.CENTRAL_REPO_PATH || '/var/www/core/alazab-site';
    const branch = await runFile('/usr/bin/git', ['branch', '--show-current'], { cwd });
    const status = await runFile('/usr/bin/git', ['status', '--short'], { cwd });
    const head = await runFile('/usr/bin/git', ['rev-parse', '--short', 'HEAD'], { cwd });
    return { branch: branch.stdout, head: head.stdout, status: status.stdout || 'clean' };
  }
  throw new Error(`Unknown command action: ${action}`);
}

function cleanupPending() {
  const now = Date.now();
  for (const [token, item] of pending) if (item.expires_at <= now) pending.delete(token);
}

function confirmationRequest(sender, action, target) {
  cleanupPending();
  const token = crypto.randomBytes(6).toString('hex');
  const ttl = Number(process.env.CENTRAL_COMMAND_CONFIRM_TTL_SECONDS || 300) * 1000;
  pending.set(token, {
    sender: normalizePhone(sender),
    action,
    target: target || '',
    expires_at: Date.now() + ttl,
  });
  return { requires_confirmation: true, token, expires_in_seconds: Math.floor(ttl / 1000), action, target: target || '' };
}

async function requestCommand(sender, action, target) {
  if (!allowedSender(sender)) throw new Error('Sender is not authorized for operations commands');
  const known = commandCatalog().find((x) => x.action === action);
  if (!known) throw new Error(`Command is not allowed: ${action}`);
  validateTarget(action, target);
  if (isMutating(action)) return confirmationRequest(sender, action, target);
  return { executed: true, action, target: target || '', result: await execute(action, target) };
}

async function confirmCommand(sender, token) {
  cleanupPending();
  const pendingItem = pending.get(String(token || ''));
  if (!pendingItem) throw new Error('Confirmation token is invalid or expired');
  if (pendingItem.sender !== normalizePhone(sender)) throw new Error('Confirmation token belongs to another sender');
  pending.delete(String(token));
  return {
    executed: true,
    confirmed: true,
    action: pendingItem.action,
    target: pendingItem.target,
    result: await execute(pendingItem.action, pendingItem.target),
  };
}

module.exports = { commandCatalog, requestCommand, confirmCommand, allowedSender };
