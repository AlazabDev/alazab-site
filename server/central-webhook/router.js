'use strict';

const express = require('express');
const { verifyMeta, verifyGitHub, verifyGeneric } = require('./verify');
const { github, generic } = require('./normalizers');
const { persistEvent, markNotification, persistCommand, makeId } = require('./store');
const { notifyEvent, sendText, sendFlow, config: whatsappConfig } = require('./whatsapp');
const { commandCatalog, requestCommand, confirmCommand, allowedSender } = require('./commands');

const router = express.Router();

function adminAuthorized(req) {
  const expected = process.env.CENTRAL_WEBHOOK_ADMIN_KEY || process.env.ADMIN_API_KEY;
  return Boolean(expected && req.headers['x-admin-key'] === expected);
}

function severityRank(value) {
  return ({ debug: 0, info: 1, notice: 2, warning: 3, error: 4, critical: 5 })[value] ?? 1;
}

function shouldNotify(event) {
  if (event.source === 'whatsapp' && /^whatsapp\.(delivery|status)/.test(event.event_type)) return false;
  const min = process.env.CENTRAL_NOTIFY_MIN_SEVERITY || 'debug';
  return severityRank(event.severity) >= severityRank(min);
}

async function storeAndNotify(event) {
  const stored = await persistEvent(event);
  if (stored.duplicate) return { ...stored, notified: false };
  if (!shouldNotify(stored.event)) return { ...stored, notified: false, notification_status: 'suppressed' };

  try {
    const response = await notifyEvent(stored.event);
    await markNotification(stored.event.id, 'sent', response);
    return { ...stored, notified: true, notification_status: 'sent' };
  } catch (error) {
    const response = { error: error.message, data: error.response_data };
    await markNotification(stored.event.id, 'failed', response);
    return { ...stored, notified: false, notification_status: 'failed', notification_error: response };
  }
}

function metaMessages(body) {
  const items = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      const value = change?.value || {};
      const metadata = value.metadata || {};
      for (const message of value.messages || []) {
        items.push({ message, metadata, contacts: value.contacts || [] });
      }
    }
  }
  return items;
}

function parseFlowPayload(message) {
  if (message?.type === 'interactive') {
    const interactive = message.interactive || {};
    if (interactive.nfm_reply?.response_json) {
      try { return JSON.parse(interactive.nfm_reply.response_json); } catch { return null; }
    }
    const id = interactive.button_reply?.id || interactive.list_reply?.id;
    if (id) {
      try { return JSON.parse(id); } catch { return { action: id }; }
    }
  }

  if (message?.type === 'text') {
    const body = String(message.text?.body || '').trim();
    const lowered = body.toLowerCase();
    if (['menu', 'م', 'القائمة', 'الاوامر', 'الأوامر'].includes(lowered)) return { action: 'menu' };
    if (['status', 'الحالة', 'حاله', 'حالة'].includes(lowered)) return { action: 'system.health' };
    if (lowered.startsWith('confirm ')) return { action: 'confirm', token: body.split(/\s+/)[1] };
  }
  return null;
}

function compactResult(result) {
  const text = JSON.stringify(result, null, 2);
  return text.length <= 3000 ? text : `${text.slice(0, 2980)}\n...`;
}

async function processWhatsAppCommand(item) {
  const sender = String(item.message?.from || '').replace(/\D+/g, '');
  const messageId = item.message?.id || null;
  const configuredPhoneId = process.env.CENTRAL_WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;

  if (configuredPhoneId && String(item.metadata?.phone_number_id || '') !== String(configuredPhoneId)) return;
  if (!allowedSender(sender)) return;

  const input = parseFlowPayload(item.message);
  if (!input) return;

  const commandId = makeId('cmd');
  await persistCommand({
    id: commandId,
    sender,
    action: input.action || '',
    target: input.target || '',
    status: 'received',
    request_payload: input,
    whatsapp_message_id: messageId,
  });

  try {
    if (input.action === 'menu') {
      await sendFlow('مركز تشغيل العزب — اختر الأمر المطلوب', sender);
      await persistCommand({ id: commandId, sender, action: 'menu', status: 'completed', request_payload: input, result_payload: { flow_sent: true }, whatsapp_message_id: messageId });
      return;
    }

    let result;
    if (input.action === 'confirm') {
      result = await confirmCommand(sender, input.token || input.confirmation_token);
    } else {
      result = await requestCommand(sender, input.action, input.target);
    }

    await persistCommand({ id: commandId, sender, action: input.action, target: input.target, status: result.requires_confirmation ? 'pending_confirmation' : 'completed', request_payload: input, result_payload: result, whatsapp_message_id: messageId });

    if (result.requires_confirmation) {
      await sendText(
        `⚠️ تأكيد أمر تشغيل\nالأمر: ${result.action}\nالهدف: ${result.target || '-'}\nرمز التأكيد: ${result.token}\nصالح لمدة ${result.expires_in_seconds} ثانية.\n\nأرسل: confirm ${result.token}`,
        sender
      );
    } else {
      await sendText(`✅ تم تنفيذ الأمر: ${result.action}\n${compactResult(result.result)}`, sender);
    }
  } catch (error) {
    await persistCommand({ id: commandId, sender, action: input.action || '', target: input.target || '', status: 'failed', request_payload: input, result_payload: { error: error.message }, whatsapp_message_id: messageId });
    await sendText(`❌ فشل أمر التشغيل\n${input.action || 'unknown'}\n${error.message}`, sender).catch(() => {});
  }
}

router.get('/health', (req, res) => {
  const wa = whatsappConfig();
  res.json({
    ok: true,
    service: 'alazab-central-webhook',
    whatsapp_sender_configured: Boolean(wa.token && wa.phoneNumberId),
    whatsapp_admin_configured: Boolean(wa.to),
    flow_configured: Boolean(wa.flowId),
    command_allowlist_configured: Boolean(process.env.CENTRAL_WHATSAPP_COMMAND_ALLOWLIST),
    notify_min_severity: process.env.CENTRAL_NOTIFY_MIN_SEVERITY || 'debug',
    timestamp: new Date().toISOString(),
  });
});

router.get('/catalog', (req, res) => {
  if (!adminAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ commands: commandCatalog() });
});

// Dedicated Meta callback for the operations WhatsApp number/app.
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = process.env.CENTRAL_WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected) return res.status(200).send(challenge);
  return res.sendStatus(403);
});

router.post('/whatsapp', (req, res) => {
  const secret = process.env.CENTRAL_WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  const verified = verifyMeta(req, secret);
  if (!verified.ok) return res.status(401).json({ error: verified.reason });

  // Acknowledge Meta immediately; command processing continues asynchronously.
  res.sendStatus(200);
  const body = req.body || {};
  setImmediate(async () => {
    try {
      for (const item of metaMessages(body)) await processWhatsAppCommand(item);
    } catch (error) {
      console.error('[central-webhook] WhatsApp command processing failed:', error.message);
    }
  });
});

router.post('/:source', async (req, res) => {
  const source = String(req.params.source || '').toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(source)) return res.status(400).json({ error: 'Invalid source name' });
  if (source === 'whatsapp') return res.status(405).json({ error: 'Use /api/events/whatsapp for Meta WhatsApp callbacks' });

  const verified = source === 'github'
    ? verifyGitHub(req, process.env.CENTRAL_GITHUB_WEBHOOK_SECRET || process.env.GITHUB_WEBHOOK_SECRET)
    : verifyGeneric(req, source);

  if (!verified.ok) return res.status(401).json({ error: verified.reason });

  const event = source === 'github' ? github(req) : generic(source, req);
  const result = await storeAndNotify(event);
  return res.status(202).json({
    accepted: true,
    event_id: result.event.id,
    duplicate: result.duplicate,
    storage: result.storage,
    notification_status: result.notification_status || (result.notified ? 'sent' : 'not_sent'),
  });
});

module.exports = router;
