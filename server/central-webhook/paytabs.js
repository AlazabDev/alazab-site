'use strict';

const crypto = require('crypto');
const express = require('express');
const { rawBody } = require('./verify');

function safeSignature(received, expected) {
  if (typeof received !== 'string' || !/^[0-9a-f]{64}$/i.test(received)) return false;
  return crypto.timingSafeEqual(Buffer.from(received, 'hex'), Buffer.from(expected, 'hex'));
}

function statusLabel(status) {
  return ({ A: 'تم قبول الدفع', D: 'الدفع مرفوض', E: 'خطأ في الدفع',
    P: 'الدفع قيد الانتظار', H: 'الدفع معلّق', V: 'تم إلغاء العملية' })[status] || 'تحديث عملية دفع';
}

function paytabsRouter(storeAndNotify) {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const key = process.env.PAYTABS_SERVER_KEY;
    if (!key) return res.status(503).json({ error: 'paytabs_not_configured' });
    if (!Buffer.isBuffer(req.rawBody)) return res.status(400).json({ error: 'raw_body_required' });

    const signature = req.get('signature') || '';
    const expected = crypto.createHmac('sha256', key).update(rawBody(req)).digest('hex');
    if (!safeSignature(signature, expected)) return res.status(401).json({ error: 'invalid_signature' });

    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      return res.status(400).json({ error: 'invalid_body' });

    const reference = String(payload.tran_ref || '').trim();
    const profile = String(payload.profile_id || '').trim();
    const configuredProfile = process.env.PAYTABS_PROFILE_ID;
    if (configuredProfile && profile !== configuredProfile)
      return res.status(403).json({ error: 'unexpected_profile' });
    if (!reference || !payload.cart_id) return res.status(400).json({ error: 'missing_transaction_reference' });

    const status = String(payload.payment_result?.response_status || payload.response_status || 'UNKNOWN').toUpperCase();
    const kind = String(payload.tran_type || 'transaction').toLowerCase();
    const amount = String(payload.tran_total ?? payload.cart_total ?? '-');
    const currency = String(payload.tran_currency || payload.cart_currency || '-');
    const label = statusLabel(status);
    // Do not persist card information, customer PII or the entire gateway payload.
    const event = {
      source: 'paytabs',
      event_type: `paytabs.${kind}.${status.toLowerCase()}`,
      severity: status === 'A' ? 'notice' : (status === 'D' || status === 'E' ? 'warning' : 'info'),
      external_id: `${profile}:${reference}:${kind}:${status}`,
      title: `PayTabs — ${label}`,
      summary: `المبلغ: ${amount} ${currency} | الطلب: ${String(payload.cart_id).slice(0, 100)} | العملية: ${reference}`,
      payload: {
        tran_ref: reference, cart_id: String(payload.cart_id),
        profile_id: profile, tran_type: kind, response_status: status,
        amount, currency,
      },
    };

    try {
      const result = await storeAndNotify(event);
      // A missing durable store cannot guarantee deduplication across PayTabs retries.
      if (result.storage !== 'postgres') return res.status(503).json({ error: 'durable_storage_unavailable' });
      if (result.notification_status === 'failed')
        return res.status(202).json({ accepted: true, notification_status: 'failed', event_id: result.event.id });
      return res.status(200).json({ accepted: true, duplicate: result.duplicate, event_id: result.event.id,
        notification_status: result.notification_status || (result.notified ? 'sent' : 'suppressed') });
    } catch (error) {
      console.error('[central-webhook][paytabs]', error);
      return res.status(503).json({ error: 'processing_failed' });
    }
  });

  return router;
}

module.exports = { paytabsRouter };
