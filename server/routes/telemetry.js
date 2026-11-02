'use strict';

// Signed operational telemetry ingestion for the Alazab main API.
const crypto = require('crypto');
const express = require('express');
const { persistEvent } = require('../central-webhook/store');

const router = express.Router();
const LEVELS = new Set(['debug', 'info', 'notice', 'warning', 'error', 'critical']);

router.get('/health', (req, res) => {
  res.json({ service: 'alazab-telemetry', configured: Boolean(process.env.TELEMETRY_INGEST_SECRET), timestamp: new Date().toISOString() });
});

router.post('/', async (req, res) => {
  const secret = process.env.TELEMETRY_INGEST_SECRET;
  if (!secret) return res.status(503).json({ error: 'telemetry_not_configured' });
  if (!Buffer.isBuffer(req.rawBody)) return res.status(400).json({ error: 'raw_body_required' });

  const given = String(req.get('x-telemetry-signature') || '').replace(/^sha256=/i, '');
  if (!/^[a-f0-9]{64}$/i.test(given)) return res.status(401).json({ error: 'invalid_signature' });
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(given, 'hex')))
    return res.status(401).json({ error: 'invalid_signature' });

  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return res.status(400).json({ error: 'invalid_payload' });
  const eventId = String(data.event_id || '');
  const type = String(data.type || '');
  if (!/^[a-zA-Z0-9._:-]{1,128}$/.test(eventId) || !/^[a-zA-Z0-9._:-]{1,128}$/.test(type))
    return res.status(400).json({ error: 'event_id_and_type_required' });

  const severity = String(data.severity || 'info').toLowerCase();
  if (!LEVELS.has(severity)) return res.status(400).json({ error: 'invalid_severity' });
  const source = String(data.source || 'alazab').slice(0, 100);
  const event = {
    source: 'telemetry',
    event_type: type,
    severity,
    external_id: eventId,
    title: String(data.title || type).slice(0, 200),
    summary: `[${source}] ${String(data.message || '').slice(0, 1800)}`,
    payload: { source, attributes: data.attributes && typeof data.attributes === 'object' && !Array.isArray(data.attributes) ? data.attributes : {} },
  };

  try {
    const stored = await persistEvent(event);
    if (stored.storage !== 'postgres') return res.status(503).json({ error: 'storage_unavailable' });
    return res.status(202).json({ accepted: true, duplicate: stored.duplicate, event_id: stored.event.id });
  } catch (error) {
    console.error('[telemetry] persistence failed:', error.message);
    return res.status(503).json({ error: 'storage_unavailable' });
  }
});

module.exports = router;
