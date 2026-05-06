const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/meta/health
router.get('/health', async (req, res) => {
  try {
    let dbOk = false;
    try {
      await pool.query('SELECT 1');
      dbOk = true;
    } catch (_err) {
      void _err;
      // Database health check failure is reflected by dbOk=false.
    }
    res.json({
      status: dbOk ? 'healthy' : 'degraded',
      database: dbOk ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// GET /api/meta/accounts
router.get('/accounts', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meta/accounts/:id
router.get('/accounts/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM accounts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meta/accounts
router.post('/accounts', async (req, res) => {
  try {
    const {
      display_name,
      account_type,
      waba_id,
      phone_number_id,
      phone_number,
      business_name,
      config,
    } = req.body;
    if (!display_name) return res.status(400).json({ error: 'display_name required' });
    const { rows } = await pool.query(
      `INSERT INTO accounts (display_name, account_type, waba_id, phone_number_id, phone_number, business_name, config)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        display_name,
        account_type || 'whatsapp',
        waba_id,
        phone_number_id,
        phone_number,
        business_name,
        config || {},
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/meta/accounts/:id
router.put('/accounts/:id', async (req, res) => {
  try {
    const fields = Object.entries(req.body).filter(([k]) => k !== 'id' && k !== 'created_at');
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
    const sets = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);
    const { rows } = await pool.query(
      `UPDATE accounts SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...values]
    );
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/meta/accounts/:id
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM accounts WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Account not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meta/accounts/:id/stats
router.get('/accounts/:id/stats', async (req, res) => {
  try {
    const id = req.params.id;
    const [total, inbound, outbound, last24h, failed] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM messages WHERE account_id = $1', [id]),
      pool.query("SELECT COUNT(*) FROM messages WHERE account_id = $1 AND direction = 'inbound'", [
        id,
      ]),
      pool.query("SELECT COUNT(*) FROM messages WHERE account_id = $1 AND direction = 'outbound'", [
        id,
      ]),
      pool.query(
        "SELECT COUNT(*) FROM messages WHERE account_id = $1 AND created_at > NOW() - INTERVAL '24 hours'",
        [id]
      ),
      pool.query("SELECT COUNT(*) FROM messages WHERE account_id = $1 AND status = 'failed'", [id]),
    ]);
    res.json({
      messages: {
        total: total.rows[0].count,
        inbound: inbound.rows[0].count,
        outbound: outbound.rows[0].count,
        last_24h: last24h.rows[0].count,
        failed: failed.rows[0].count,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meta/messages/:accountId
router.get('/messages/:accountId', async (req, res) => {
  try {
    const { limit = 50, offset = 0, phone } = req.query;
    let query = 'SELECT * FROM messages WHERE account_id = $1';
    const params = [req.params.accountId];
    if (phone) {
      query += ' AND phone_number LIKE $2';
      params.push(`%${phone}%`);
    }
    query +=
      ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(parseInt(limit), parseInt(offset));
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/meta/messages/:accountId/conversations
router.get('/messages/:accountId/conversations', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT phone_number, customer_name, MAX(created_at) as last_message, COUNT(*) as message_count
       FROM messages WHERE account_id = $1 GROUP BY phone_number, customer_name ORDER BY last_message DESC LIMIT 50`,
      [req.params.accountId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meta/messages/:accountId/send
router.post('/messages/:accountId/send', async (req, res) => {
  try {
    const { to, type = 'text', text, template } = req.body;
    if (!to) return res.status(400).json({ error: 'Recipient (to) required' });

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!accessToken || !phoneNumberId) {
      return res.status(500).json({ error: 'WhatsApp API not configured' });
    }

    let messageBody;
    if (type === 'template' && template) {
      messageBody = { messaging_product: 'whatsapp', to, type: 'template', template };
    } else {
      messageBody = { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } };
    }

    const waRes = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(messageBody),
    });

    const waData = await waRes.json();
    if (!waRes.ok)
      return res.status(waRes.status).json({ error: waData.error?.message || 'Send failed' });

    // Store sent message
    try {
      await pool.query(
        `INSERT INTO messages (wa_message_id, phone_number, direction, message_type, content, status, account_id, phone_number_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          waData.messages?.[0]?.id,
          to,
          'outbound',
          type,
          text || JSON.stringify(template),
          'sent',
          req.params.accountId,
          phoneNumberId,
        ]
      );
    } catch (_err) {
      void _err;
      // Ignore message log insert failure; WhatsApp API response remains the source of truth.
    }

    res.json({ success: true, messageId: waData.messages?.[0]?.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
