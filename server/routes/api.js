const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/v1/ — API info
router.get('/', (req, res) => {
  res.json({
    name: 'Alazab API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/v1/callback',
      api: '/api/v1/',
      elevenlabs: '/api/v1/elevenlabs',
      chatbotSession: '/api/v1/elevenlabs/session',
      webhook: '/api/webhook/whatsapp',
      meta: '/api/meta/',
      health: '/health',
    },
  });
});

// GET /api/v1/status — System status
router.get('/status', async (req, res) => {
  try {
    let dbStatus = 'disconnected';
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    res.json({
      server: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/contact — Contact form
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, message, subject } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields: name, email, message' });
    }

    // Store in DB if available
    try {
      await pool.query(
        'INSERT INTO contact_submissions (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5)',
        [name, email, phone || null, subject || null, message]
      );
    } catch {
      /* DB optional */
    }

    res.json({ success: true, message: 'تم استلام رسالتك بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/newsletter — Newsletter subscription
router.post('/newsletter', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    try {
      await pool.query(
        'INSERT INTO newsletter_subscribers (email, name) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING',
        [email, name || null]
      );
    } catch {
      /* DB optional */
    }

    res.json({ success: true, message: 'تم الاشتراك بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
