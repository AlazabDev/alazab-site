'use strict';

const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const db = require('../db');

// 1. فحص حالة الربط
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    firebase_initialized: admin.apps.length > 0,
    db_available: db.dbAvailable,
  });
});

// 2. التحقق من تسجيل الدخول وحفظ المستخدم + توكن الإشعارات في PostgreSQL
router.post('/sync', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.body.idToken;

    if (!idToken) {
      return res.status(401).json({ error: 'Missing Firebase ID token' });
    }

    // التحقق من صحة التوكن عبر خوادم جوجل
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, phone_number, name } = decoded;
    const { fcmToken } = req.body;

    // حفظ أو تحديث بيانات المستخدم وتوكن الإشعارات في PostgreSQL
    const result = await db.query(
      `INSERT INTO firebase_users (firebase_uid, email, phone, full_name, fcm_token, last_login_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, NULL), NOW())
       ON CONFLICT (firebase_uid) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, firebase_users.email),
         phone = COALESCE(EXCLUDED.phone, firebase_users.phone),
         full_name = COALESCE(EXCLUDED.full_name, firebase_users.full_name),
         fcm_token = COALESCE(EXCLUDED.fcm_token, firebase_users.fcm_token),
         last_login_at = NOW()
       RETURNING *;`,
      [uid, email || null, phone_number || null, name || null, fcmToken || null]
    );

    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Firebase sync error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token', details: err.message });
  }
});

// 3. إرسال إشعار لمستخدم محدد
router.post('/send-notification', async (req, res) => {
  try {
    const { uid, title, body, data } = req.body;
    if (!uid || !title || !body) {
      return res.status(400).json({ error: 'uid, title, and body are required' });
    }

    const userRes = await db.query(
      'SELECT fcm_token FROM firebase_users WHERE firebase_uid = $1',
      [uid]
    );

    const token = userRes.rows[0]?.fcm_token;
    if (!token) {
      return res.status(404).json({ error: 'User has no registered FCM token' });
    }

    const messageId = await admin.messaging().send({
      token,
      notification: { title, body },
      data: data || {},
    });

    res.json({ ok: true, messageId });
  } catch (err) {
    console.error('FCM send error:', err.message);
    res.status(500).json({ error: 'Failed to send notification', details: err.message });
  }
});

module.exports = router;
