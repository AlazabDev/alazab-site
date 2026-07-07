/**
 * index.js — Alazab API Server (Production-ready)
 * =================================================
 * Express server with:
 *  - Security headers (Helmet)
 *  - CORS with origin whitelist
 *  - Rate limiting per route group
 *  - Raw-body preservation for webhook signature validation
 *  - Graceful shutdown on SIGTERM/SIGINT
 *  - Admin dashboard API
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ── Routes ────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const webhookRoutes = require('./routes/webhook');
const metaRoutes = require('./routes/meta');
const tiktokRoutes = require('./routes/tiktok');
const twilioRoutes = require('./routes/twilio');
const webhookToolRoutes = require('./routes/webhook-tool');
const whatsappSeafileRoutes = require('./routes/whatsapp-seafile');
const telegramRoutes = require('./routes/telegram');
const elevenlabsRoutes = require('./routes/elevenlabs');
const elevenlabsV1Routes = require('./routes/elevenlabs-v1');
const adminRoutes = require('./routes/admin');
const mcpRoutes = require('./routes/mcp');
const dynamicRoutes = require('./routes/dynamic-routes');

// ── Logger ────────────────────────────────────────────────────
const logger = require('./logger');

const app = express();
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT || 3004);
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_NAME = 'Alazab API Server';

// ── Env check ─────────────────────────────────────────────────
const REQUIRED_ENV = ['PORT'];
const OPTIONAL_ENV = [
  'FRONTEND_URL',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'META_APP_SECRET',
  'FACEBOOK_APP_SECRET',
  'WHATSAPP_ACCESS_TOKEN',
  'PHONE_NUMBER_ID',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_AGENT_ID',
  'ELEVENLABS_WEBHOOK_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_API_KEY',
];

function maskValue(v) {
  if (!v) return 'missing';
  return v.length <= 8 ? '••••••••' : `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function startupEnvCheck() {
  logger.info(`[BOOT] ${APP_NAME} v${require('./package.json').version}`);
  logger.info(`[BOOT] NODE_ENV=${NODE_ENV}  PORT=${PORT}  PID=${process.pid}`);

  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) logger.warn(`[BOOT][WARN] Missing required env: ${key}`);
  }
  for (const key of OPTIONAL_ENV) {
    logger.info(`[BOOT] ${key}=${maskValue(process.env[key])}`);
  }

  // Normalize token key name
  if (!process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    process.env.WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  }
  // Normalize secret key name
  if (!process.env.META_APP_SECRET && process.env.FACEBOOK_APP_SECRET) {
    process.env.META_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
  }

  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    logger.warn('[BOOT][WARN] WHATSAPP_VERIFY_TOKEN missing — webhook verification may fail');
  }
  if (!process.env.META_APP_SECRET) {
    logger.warn('[BOOT][WARN] META_APP_SECRET missing — Meta signature validation disabled');
  }
  if (!process.env.ADMIN_API_KEY) {
    logger.warn('[BOOT][WARN] ADMIN_API_KEY missing — admin dashboard API is disabled');
  }
}

startupEnvCheck();

// ── Security headers ──────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://alazab.com',
  'https://www.alazab.com',
  'https://azab.services',
];

if (NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:8081', 'http://localhost:5173', 'http://localhost:3000');
}

function isOriginAllowed(origin) {
  if (!origin) return true; // server-to-server, curl, webhooks
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.lovable\.app$/i.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      isOriginAllowed(origin) ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ── HTTP Logging (Morgan → Winston) ──────────────────────────
app.use(
  morgan('combined', {
    stream: logger.stream,
    skip: (req) => req.path === '/health' || req.path === '/ready',
  })
);

// ── Rate limits ───────────────────────────────────────────────
const rateLimitKeyGen = (req) => {
  return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.ip;
};

const skipLocal = (req) => {
  const ip = rateLimitKeyGen(req);
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return true;
  if (process.env.ADMIN_API_KEY && req.headers['x-admin-key'] === process.env.ADMIN_API_KEY) return true;
  return false;
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
  keyGenerator: rateLimitKeyGen,
  skip: skipLocal,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts' },
  keyGenerator: rateLimitKeyGen,
  skip: skipLocal,
});

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook requests' },
  keyGenerator: rateLimitKeyGen,
  skip: skipLocal,
});

const elevenlabsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many ElevenLabs requests' },
  keyGenerator: rateLimitKeyGen,
  skip: skipLocal,
});

const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many admin requests' },
  keyGenerator: rateLimitKeyGen,
  skip: skipLocal,
});

app.use(globalLimiter);

// ── Request ID ────────────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ── Helpers ───────────────────────────────────────────────────
function rawBodySaver(req, res, buf) {
  if (buf && buf.length) {
    req.rawBody = Buffer.from(buf);
  }
}

function verifyMetaSignature(req, res, next) {
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  if (!appSecret) {
    return res.status(500).json({ error: 'META_APP_SECRET is missing' });
  }

  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    return res.status(401).json({ error: 'Missing Meta signature header' });
  }

  const rawBody = req.rawBody;

  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    return res.status(400).json({ error: 'Missing raw body' });
  }

  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return res.status(401).json({
      error: 'Invalid Meta signature',
      received_length: sigBuf.length,
      expected_length: expBuf.length,
    });
  }

  return next();
}

// ── Health / readiness ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: APP_NAME,
    env: NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    port: PORT,
    pid: process.pid,
    version: require('./package.json').version,
  });
});

app.get('/ready', (req, res) => {
  const checks = {
    port: Boolean(PORT),
    verifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    metaAppSecret: Boolean(process.env.META_APP_SECRET),
    frontendUrl: Boolean(process.env.FRONTEND_URL),
    adminKey: Boolean(process.env.ADMIN_API_KEY),
  };
  const ready = checks.port;
  res.status(ready ? 200 : 503).json({ ok: ready, checks, timestamp: new Date().toISOString() });
});


// ── Admin graphical dashboard ─────────────────────────────────
app.get(['/dashboard', '/admin', '/admin/dashboard'], (req, res) => {
  res.redirect('/');
});

// ── WhatsApp webhook verification (GET) ───────────────────────
app.get('/api/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!mode || !token || !challenge) {
    return res.status(400).json({ error: 'Missing webhook verification params' });
  }
  if (mode !== 'subscribe') {
    return res.status(400).json({ error: 'Invalid webhook mode' });
  }
  if (token !== process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(403).json({ error: 'Invalid webhook verify token' });
  }
  return res.status(200).send(challenge);
});

// ── Telegram routes (before body parsers) ─────────────────────
app.use('/api', telegramRoutes);

// ── Webhook POST (raw body + Meta signature) ──────────────────
app.use(
  '/api/webhook',
  webhookLimiter,
  express.raw({ type: '*/*', limit: '10mb', verify: rawBodySaver })
);
app.use('/api/webhook', verifyMetaSignature);
app.use('/api/webhook', (req, res, next) => {
  try {
    req.body = req.rawBody?.length ? JSON.parse(req.rawBody.toString('utf8')) : {};
    next();
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload in webhook' });
  }
});
app.use('/api/webhook', webhookRoutes);

// ── ElevenLabs routes ─────────────────────────────────────────
const elevenRawMiddleware = express.raw({ type: '*/*', limit: '30mb', verify: rawBodySaver });
const elevenJsonMiddleware = (req, res, next) => {
  try {
    if (!req.rawBody?.length) {
      req.body = {};
      return next();
    }
    if (req.path === '/webhook') return next();
    req.body = JSON.parse(req.rawBody.toString('utf8'));
    next();
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload in ElevenLabs request' });
  }
};

app.use(
  '/api/elevenlabs',
  elevenlabsLimiter,
  elevenRawMiddleware,
  elevenJsonMiddleware,
  elevenlabsRoutes
);
app.use(
  '/api/v1/elevenlabs',
  elevenlabsLimiter,
  elevenRawMiddleware,
  elevenJsonMiddleware,
  elevenlabsV1Routes
);

// ── Standard body parsing ─────────────────────────────────────
app.use(express.json({ limit: '10mb', verify: rawBodySaver }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Admin dashboard API ───────────────────────────────────────
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/admin', adminLimiter, dynamicRoutes.adminRoutes);
app.use('/api/mcp', adminLimiter, mcpRoutes);

// ── Auth + API + Meta routes ──────────────────────────────────
app.use('/auth/v1', authLimiter, authRoutes);
app.use('/api/v1', apiRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/webhook-tool', webhookToolRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/', whatsappSeafileRoutes);
app.use('/api/v1', whatsappSeafileRoutes);

app.use(dynamicRoutes.dynamicRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('[ERROR]', {
    message: err.message,
    stack: NODE_ENV === 'production' ? undefined : err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large', requestId: req.requestId });
  }
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ error: err.message, requestId: req.requestId });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId,
  });
});

// ── Start server ──────────────────────────────────────────────
const server = app.listen(PORT, '127.0.0.1', () => {
  logger.info(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
  logger.info(`Health:  /health   Ready:   /ready`);
  logger.info(`Auth:    /auth/v1/  API:     /api/v1/`);
  logger.info(`Webhook: GET|POST /api/webhook/whatsapp and /webhook/wauf/whatsapp`);
  logger.info(`Eleven:  /api/elevenlabs/  Meta: /api/meta/`);
  logger.info(`Admin:   /api/admin/status (requires X-Admin-Key header)`);
  logger.info(`MCP:     /api/mcp/health  /api/mcp/tools  /api/mcp/call`);

  // Optional: try DB connection at startup (non-blocking)
  const { testDbConnection } = require('./db');
  testDbConnection().catch((err) => logger.warn('DB connection test failed:', err.message));
});

// ── Graceful shutdown ─────────────────────────────────────────
async function shutdown(signal) {
  logger.info(`[SHUTDOWN] ${signal} received — draining connections...`);

  server.close(async () => {
    logger.info('[SHUTDOWN] HTTP server closed');
    try {
      const { closePool } = require('./db');
      await closePool();
    } catch {
      /* ignore */
    }
    logger.info('[SHUTDOWN] Done. Exiting.');
    process.exit(0);
  });

  // Force exit if not done in 10s
  setTimeout(() => {
    logger.error('[SHUTDOWN] Force exit after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('[uncaughtException]', { message: err.message, stack: err.stack });
});
process.on('unhandledRejection', (reason) => {
  logger.error('[unhandledRejection]', { reason: String(reason) });
});

app.get('/api/tiktok/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'tiktok',
        version: '1.0.0'
    });
});

module.exports = app;
