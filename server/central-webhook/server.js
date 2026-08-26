'use strict';

const express = require('express');
const helmet = require('helmet');
const router = require('./router');

require('dotenv').config();

const app = express();
const HOST = process.env.CENTRAL_WEBHOOK_HOST || '127.0.0.1';
const PORT = Number(process.env.CENTRAL_WEBHOOK_PORT || 4010);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({
  limit: process.env.CENTRAL_WEBHOOK_JSON_LIMIT || '10mb',
  verify(req, res, buf) {
    if (buf?.length) req.rawBody = Buffer.from(buf);
  },
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/', router);

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.originalUrl }));
app.use((error, req, res, _next) => {
  console.error('[central-webhook]', error.message);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Alazab Central Webhook listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`[central-webhook] ${signal} received`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('[central-webhook][unhandledRejection]', reason));
process.on('uncaughtException', (error) => {
  console.error('[central-webhook][uncaughtException]', error);
  shutdown('uncaughtException');
});

module.exports = app;
