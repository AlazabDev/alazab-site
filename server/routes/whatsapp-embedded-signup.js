const express = require('express');
const { createCipheriv, randomBytes } = require('crypto');
const pool = require('../db');
const router = express.Router();

// Mounted after meta.js's existing admin authentication middleware.
router.post('/complete', async (req, res) => {
  const { code, waba_id: wabaId, phone_number_id: phoneNumberId } = req.body || {};
  if (typeof code !== 'string' || !code || code.length > 8192 ||
      typeof wabaId !== 'string' || !/^\d+$/.test(wabaId) ||
      typeof phoneNumberId !== 'string' || !/^\d+$/.test(phoneNumberId)) {
    return res.status(400).json({ error: 'يلزم رمز التسجيل ومعرّفات حساب واتساب والهاتف.' });
  }
  const appId = process.env.META_APP_ID || '1061494059972503';
  const secret = process.env.META_APP_SECRET;
  const encryptionKey = Buffer.from(process.env.META_TOKEN_ENCRYPTION_KEY || '', 'hex');
  if (!secret || encryptionKey.length !== 32) {
    return res.status(503).json({ error: 'يلزم إعداد META_APP_SECRET وMETA_TOKEN_ENCRYPTION_KEY على الخادم.' });
  }
  try {
    // Check migration before consuming a one-use authorization code.
    await pool.query('SELECT 1 FROM whatsapp_embedded_connections LIMIT 0');
  } catch {
    return res.status(503).json({ error: 'يلزم تجهيز جدول whatsapp_embedded_connections قبل التسجيل.' });
  }
  const graph = 'https://graph.facebook.com/v26.0';
  const graphRequest = async (path, options = {}) => {
    const response = await fetch(`${graph}/${path}`, { ...options, signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    if (!response.ok || body.error) throw new Error('Meta request failed');
    return body;
  };
  try {
    const token = await graphRequest('oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: appId, client_secret: secret, code }),
    });
    if (typeof token.access_token !== 'string' || !token.access_token) throw new Error('Missing token');
    const headers = { Authorization: `Bearer ${token.access_token}` };
    // Verify the claimed phone belongs to the selected WABA; follow all pages.
    let after;
    let phone;
    const cursors = new Set();
    do {
      const params = new URLSearchParams({ fields: 'id,display_phone_number', limit: '100' });
      if (after) params.set('after', after);
      const list = await graphRequest(`${wabaId}/phone_numbers?${params}`, { headers });
      phone = list.data?.find((item) => item.id === phoneNumberId);
      after = list.paging?.next ? list.paging?.cursors?.after : undefined;
      if (after && cursors.has(after)) throw new Error('Repeated cursor');
      if (after) cursors.add(after);
    } while (!phone && after);
    if (!phone) return res.status(400).json({ error: 'الهاتف غير موجود ضمن حساب واتساب المحدد.' });

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(token.access_token, 'utf8'), cipher.final()]);
    const encryptedToken = [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64')).join('.');
    await pool.query(
      `INSERT INTO whatsapp_embedded_connections
       (waba_id, phone_number_id, display_phone_number, encrypted_access_token)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone_number_id) DO UPDATE SET
       waba_id = EXCLUDED.waba_id, display_phone_number = EXCLUDED.display_phone_number,
       encrypted_access_token = EXCLUDED.encrypted_access_token, updated_at = NOW()`,
      [wabaId, phoneNumberId, phone.display_phone_number || null, encryptedToken]
    );
    return res.json({ waba_id: wabaId, phone_number_id: phoneNumberId, display_phone_number: phone.display_phone_number });
  } catch {
    // Never log authorization codes, tokens, app secrets, or provider responses.
    return res.status(502).json({ error: 'تعذر إكمال مبادلة الرمز أو حفظ الربط. ابدأ التسجيل مجددًا بعد التحقق من إعدادات الخادم.' });
  }
});

module.exports = router;
