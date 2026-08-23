'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const fallbackFile = process.env.CENTRAL_WEBHOOK_FALLBACK_LOG || path.join(__dirname, '..', 'logs', 'central-webhook-events.jsonl');

function makeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(8).toString('hex')}`;
}

function appendFallback(record) {
  try {
    fs.mkdirSync(path.dirname(fallbackFile), { recursive: true });
    fs.appendFileSync(fallbackFile, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    console.error('[central-webhook] fallback log failed:', error.message);
  }
}

async function persistEvent(event) {
  const row = {
    id: event.id || makeId('evt'),
    source: event.source,
    event_type: event.event_type || 'unknown',
    severity: event.severity || 'info',
    external_id: event.external_id || makeId('ext'),
    title: event.title || event.event_type || 'Event',
    summary: event.summary || '',
    payload: event.payload || {},
    received_at: event.received_at || new Date().toISOString(),
  };

  if (!db.dbAvailable) {
    appendFallback({ kind: 'event', ...row, storage: 'fallback' });
    return { stored: true, storage: 'fallback', duplicate: false, event: row };
  }

  try {
    const result = await db.query(
      `INSERT INTO ops.central_events
       (id, source, event_type, severity, external_id, title, summary, payload, received_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9)
       ON CONFLICT (source, external_id) DO NOTHING
       RETURNING id`,
      [row.id, row.source, row.event_type, row.severity, row.external_id, row.title, row.summary, JSON.stringify(row.payload), row.received_at]
    );
    return { stored: true, storage: 'postgres', duplicate: result.rowCount === 0, event: row };
  } catch (error) {
    appendFallback({ kind: 'event', ...row, storage: 'fallback_after_db_error', db_error: error.message });
    return { stored: true, storage: 'fallback', duplicate: false, event: row, db_error: error.message };
  }
}

async function markNotification(eventId, status, response) {
  if (!db.dbAvailable) {
    appendFallback({ kind: 'notification', event_id: eventId, status, response, at: new Date().toISOString() });
    return;
  }
  try {
    await db.query(
      `UPDATE ops.central_events
       SET notification_status=$2, notification_response=$3::jsonb, notified_at=NOW()
       WHERE id=$1`,
      [eventId, status, JSON.stringify(response || {})]
    );
  } catch (error) {
    appendFallback({ kind: 'notification', event_id: eventId, status, response, db_error: error.message, at: new Date().toISOString() });
  }
}

async function persistCommand(run) {
  const row = {
    id: run.id || makeId('cmd'),
    sender: run.sender || '',
    action: run.action || '',
    target: run.target || '',
    status: run.status || 'received',
    request_payload: run.request_payload || {},
    result_payload: run.result_payload || {},
    whatsapp_message_id: run.whatsapp_message_id || null,
  };

  if (!db.dbAvailable) {
    appendFallback({ kind: 'command', ...row, storage: 'fallback', at: new Date().toISOString() });
    return row;
  }

  try {
    await db.query(
      `INSERT INTO ops.command_runs
       (id, sender, action, target, status, request_payload, result_payload, whatsapp_message_id)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)
       ON CONFLICT (id) DO UPDATE SET
         status=EXCLUDED.status,
         result_payload=EXCLUDED.result_payload,
         updated_at=NOW()`,
      [row.id, row.sender, row.action, row.target, row.status, JSON.stringify(row.request_payload), JSON.stringify(row.result_payload), row.whatsapp_message_id]
    );
  } catch (error) {
    appendFallback({ kind: 'command', ...row, storage: 'fallback_after_db_error', db_error: error.message, at: new Date().toISOString() });
  }
  return row;
}

module.exports = { persistEvent, markNotification, persistCommand, makeId };
