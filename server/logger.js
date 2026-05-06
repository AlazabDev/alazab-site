/**
 * logger.js — Winston structured logging for production
 * ======================================================
 * Outputs:
 *   - Console (colorized in dev, JSON in production)
 *   - logs/app-error.log  (errors only)
 *   - logs/app-combined.log (all levels, rotated daily)
 */

const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Try to use Winston; fall back to console if not installed ──
let winston;
try {
  winston = require('winston');
} catch {
  // Winston not installed yet — provide console shim
  const noop = () => {};
  const logger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    http: noop,
    stream: { write: (msg) => console.log(msg.trim()) },
  };
  module.exports = logger;
  return;
}

const { createLogger, format, transports } = winston;

const { combine, timestamp, errors, json, colorize, printf, splat } = format;

const isProduction = process.env.NODE_ENV === 'production';

// ── Formats ────────────────────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
    return `[${ts}] ${level}: ${stack || message}${extras}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

// ── Transports ─────────────────────────────────────────────────
const logTransports = [
  new transports.Console({
    format: isProduction ? prodFormat : devFormat,
    silent: process.env.LOG_SILENT === 'true',
  }),
  new transports.File({
    filename: path.join(logsDir, 'app-error.log'),
    level: 'error',
    format: prodFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true,
  }),
  new transports.File({
    filename: path.join(logsDir, 'app-combined.log'),
    format: prodFormat,
    maxsize: 20 * 1024 * 1024, // 20MB
    maxFiles: 7,
    tailable: true,
  }),
];

// ── Create logger ──────────────────────────────────────────────
const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transports: logTransports,
  exitOnError: false,
});

// Morgan stream adapter
logger.stream = {
  write: (message) => logger.http(message.trim()),
};

module.exports = logger;
