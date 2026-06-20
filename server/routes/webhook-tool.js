const express = require('express');
const router = express.Router();
const logger = require('../logger');

// ==============================================
// Supabase - اختياري، لن يفشل التطبيق إذا لم يكن موجوداً
// ==============================================
let supabase = null;
let supabaseAvailable = false;

try {
  // محاولة تحميل Supabase فقط إذا كانت المتغيرات موجودة
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseAvailable = true;
    logger.info('[Webhook Tool] ✅ Supabase connected successfully');
  } else {
    logger.warn('[Webhook Tool] ⚠️ Supabase credentials missing, using in-memory storage');
  }
} catch (error) {
  logger.warn(`[Webhook Tool] ⚠️ Supabase not available: ${error.message}`);
}

// ==============================================
// تخزين مؤقت في الذاكرة (بديل Supabase)
// ==============================================
const inMemoryEvents = [];
let eventIdCounter = 1;

// ==============================================
// دوال مساعدة للتخزين
// ==============================================
const storeEvent = async (eventData) => {
  if (supabaseAvailable && supabase) {
    try {
      const { data, error } = await supabase
        .from('webhook_events_log')
        .insert(eventData)
        .select();
      if (!error && data) return data[0];
    } catch (e) {
      logger.warn(`[Webhook Tool] Supabase insert failed: ${e.message}`);
    }
  }

  // التخزين المؤقت في الذاكرة
  const event = {
    id: eventIdCounter++,
    ...eventData,
    created_at: new Date().toISOString()
  };
  inMemoryEvents.unshift(event);
  if (inMemoryEvents.length > 1000) inMemoryEvents.pop();
  return event;
};

const getEvents = async (limit = 50) => {
  if (supabaseAvailable && supabase) {
    try {
      const { data, error } = await supabase
        .from('webhook_events_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    } catch (e) {
      logger.warn(`[Webhook Tool] Supabase fetch failed: ${e.message}`);
    }
  }
  return inMemoryEvents.slice(0, limit);
};

// ==============================================
// Middleware للمصادقة
// ==============================================
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Missing or invalid token'
    });
  }
  const token = authHeader.split(' ')[1];
  const validToken = process.env.WEBHOOK_TOOL_API_KEY || 'QvacXnwH_5QWUTKsEsxEgtYd8kHpVcf3U';
  if (token !== validToken) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid API Key'
    });
  }
  next();
};

// ==============================================
// ===== المسارات (ROUTES) =====
// ==============================================

// 1. GET /config - جلب التكوين
router.get('/config', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      webhooks: [
        { id: 'webhook-1', name: 'Example Webhook', url: 'https://example.com/webhook' }
      ],
      default_headers: { 'Content-Type': 'application/json' },
      retry_policy: { max_attempts: 3, delay: 1000 },
      supabase_available: supabaseAvailable,
      storage: supabaseAvailable ? 'Supabase' : 'In-Memory'
    }
  });
});

// 2. GET /events - جلب سجل الأحداث
router.get('/events', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await getEvents(limit);
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error(`[Webhook Tool] Error fetching events: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

// 3. POST /send - إرسال ويب هوك
router.post('/send', authenticate, async (req, res) => {
  const { url, method = 'POST', headers = {}, body = {}, webhook_id = null } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'Target URL is required' });
  }

  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Alazab-Webhook-Tool/1.0',
        ...headers,
      },
      body: method.toUpperCase() !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    await storeEvent({
      webhook_id,
      target_url: url,
      method: method.toUpperCase(),
      request_body: body,
      response_status: response.status,
      response_body: responseBody,
      duration_ms: duration,
      status: response.ok ? 'success' : 'failed'
    });

    res.status(response.status).json({
      success: response.ok,
      status: response.status,
      duration,
      data: responseBody,
    });
  } catch (error) {
    logger.error(`[Webhook Tool] Error sending webhook: ${error.message}`);

    await storeEvent({
      webhook_id,
      target_url: url,
      method: method.toUpperCase(),
      request_body: body,
      status: 'error',
      error_message: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to send webhook',
      details: error.message
    });
  }
});

// 4. POST /retry - إعادة محاولة ويب هوك فاشل
router.post('/retry', authenticate, async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, error: 'Event ID is required' });
  }

  try {
    let event = null;

    if (supabaseAvailable && supabase) {
      const { data, error } = await supabase
        .from('webhook_events_log')
        .select('*')
        .eq('id', eventId)
        .single();
      if (!error && data) event = data;
    }

    if (!event) {
      event = inMemoryEvents.find(e => e.id === parseInt(eventId));
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    const retryCount = (event.retry_count || 0) + 1;
    if (retryCount > 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum retry attempts (3) exceeded'
      });
    }

    const response = await fetch(event.target_url, {
      method: event.method,
      headers: { 'Content-Type': 'application/json' },
      body: event.method !== 'GET' ? JSON.stringify(event.request_body) : undefined,
    });

    const responseBody = await response.text();

    if (!supabaseAvailable) {
      event.retry_count = retryCount;
      event.retry_status = response.status;
      event.retry_response = responseBody;
      event.status = response.ok ? 'success' : 'failed';
    }

    res.json({
      success: response.ok,
      status: response.status,
      data: responseBody,
      retry_count: retryCount
    });
  } catch (error) {
    logger.error(`[Webhook Tool] Error retrying webhook: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to retry webhook' });
  }
});

// 5. DELETE /events/:id - حذف حدث
router.delete('/events/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id);
  const index = inMemoryEvents.findIndex(e => e.id === id);
  if (index !== -1) {
    inMemoryEvents.splice(index, 1);
    res.json({ success: true, message: 'Event deleted successfully' });
  } else {
    res.status(404).json({ success: false, error: 'Event not found' });
  }
});

// 6. GET /stats - إحصائيات
router.get('/stats', authenticate, async (req, res) => {
  const events = await getEvents(1000);
  const stats = {
    total: events.length,
    success: events.filter(e => e.status === 'success').length,
    failed: events.filter(e => e.status === 'failed').length,
    error: events.filter(e => e.status === 'error').length
  };
  res.json({ success: true, data: stats });
});

module.exports = router;
