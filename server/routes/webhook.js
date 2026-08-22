const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const pool = require('../db');
const axios = require('axios');

const MCP_URL = process.env.MCP_URL || 'http://localhost:4005/mcp';

// ──── Enhanced MCP caller with retry logic ────
async function callMCP(tool, payload, retries = 2) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await axios.post(
        MCP_URL,
        {
          tool,
          payload,
        },
        {
          timeout: 5000, // 5 seconds timeout
          headers: {
            'Content-Type': 'application/json',
            'X-Tool': tool,
          },
        }
      );

      console.log(`✅ MCP ${tool} success:`, res.data?.message || 'OK');
      return res.data;
    } catch (e) {
      const isLastAttempt = attempt === retries + 1;
      const errorMsg = e.code === 'ECONNREFUSED' ? 'MCP server not running' : e.message;

      if (isLastAttempt) {
        console.error(`❌ MCP ${tool} failed after ${retries + 1} attempts:`, errorMsg);
        // Store failed MCP call in DB for retry later
        await storeFailedMCPCall(tool, payload, errorMsg);
        return null;
      }

      console.warn(`⚠️ MCP ${tool} attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
}

// ──── Store failed MCP calls for later retry ────
async function storeFailedMCPCall(tool, payload, error) {
  try {
    await pool.query(
      `INSERT INTO mcp_failed_calls (tool, payload, error, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [tool, JSON.stringify(payload), error]
    );
  } catch (dbError) {
    console.error('Failed to store MCP error:', dbError.message);
  }
}

// ──── Retry failed MCP calls (call this periodically) ────
async function retryFailedMCPCalls() {
  try {
    const { rows } = await pool.query(
      `SELECT id, tool, payload FROM mcp_failed_calls 
       WHERE retry_count < 3 AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC LIMIT 100`
    );

    for (const row of rows) {
      const result = await callMCP(row.tool, row.payload, 1);
      if (result) {
        await pool.query('DELETE FROM mcp_failed_calls WHERE id = $1', [row.id]);
      } else {
        await pool.query(
          'UPDATE mcp_failed_calls SET retry_count = retry_count + 1, last_retry = NOW() WHERE id = $1',
          [row.id]
        );
      }
    }
  } catch (err) {
    console.error('Retry MCP failed calls error:', err.message);
  }
}

// Run retry every hour
setInterval(retryFailedMCPCalls, 3600000);

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

// ──── Enhanced rate limiter with Redis-like interface (memory fallback) ────
class RateLimiter {
  constructor(limit = 30, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.store = new Map();
  }

  isLimited(key) {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return false;
    }

    entry.count++;
    const isLimited = entry.count > this.limit;

    if (isLimited) {
      console.warn(`Rate limit exceeded for ${key}, reset at ${new Date(entry.resetAt)}`);
    }

    return isLimited;
  }

  // Clean up old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

class Deduplicator {
  constructor(ttl = 300000, maxSize = 5000) {
    this.ttl = ttl;
    this.maxSize = maxSize;
    this.store = new Map();
  }

  isDuplicate(id) {
    const now = Date.now();

    // Clean up expired entries
    if (this.store.size > this.maxSize) {
      this.cleanup();
    }

    if (this.store.has(id)) {
      const entry = this.store.get(id);
      if (now - entry.timestamp < this.ttl) {
        return true;
      }
    }

    this.store.set(id, { timestamp: now });
    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [id, entry] of this.store) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(id);
      }
    }
  }
}

const rateLimiter = new RateLimiter(30, 60000);
const deduplicator = new Deduplicator(300000, 5000);

// Run cleanup every 5 minutes
setInterval(() => {
  rateLimiter.cleanup();
  deduplicator.cleanup();
}, 300000);

// ──── Webhook event store (in-memory for frontend monitoring) ────
const webhookEvents = [];
const MAX_EVENTS = 500;

function storeEvent(event) {
  webhookEvents.unshift({
    ...event,
    id: crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
  });
  if (webhookEvents.length > MAX_EVENTS) webhookEvents.pop();
}

// ──── Enhanced signature verification ────
function verifySignature(rawBody, signature) {
  if (!APP_SECRET) {
    console.warn('⚠️ APP_SECRET not set, skipping signature verification');
    return true; // Skip verification if no secret is set (development mode)
  }

  if (!signature) {
    console.error('❌ Missing signature header');
    return false;
  }

  try {
    const expected = signature.replace('sha256=', '');
    const hash = crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));

    if (!isValid) {
      console.error('❌ Signature mismatch');
    }

    return isValid;
  } catch (err) {
    console.error('Signature verification error:', err.message);
    return false;
  }
}

// ──── Enhanced content extraction with validation ────
/* eslint-disable no-useless-assignment -- defaults document and preserve empty-message fallbacks */
function extractContent(message) {
  if (!message || !message.type) {
    return { content: '[رسالة غير صالحة]', mediaUrl: null, mediaMime: null };
  }

  let content = '';
  let mediaUrl = null;
  let mediaMime = null;

  try {
    switch (message.type) {
      case 'text':
        content = message.text?.body?.trim() || '';
        if (!content) content = '[نص فارغ]';
        break;

      case 'image':
        content = message.image?.caption?.trim() || '[صورة]';
        mediaUrl = message.image?.id || null;
        mediaMime = message.image?.mime_type || 'image/jpeg';
        break;

      case 'document': {
        const filename = message.document?.filename || 'مستند';
        content = message.document?.caption?.trim() || `[مستند: ${filename}]`;
        mediaUrl = message.document?.id || null;
        mediaMime = message.document?.mime_type || 'application/octet-stream';
        break;
      }

      case 'audio':
        content = '[رسالة صوتية]';
        mediaUrl = message.audio?.id || null;
        mediaMime = message.audio?.mime_type || 'audio/ogg';
        break;

      case 'video':
        content = message.video?.caption?.trim() || '[فيديو]';
        mediaUrl = message.video?.id || null;
        mediaMime = message.video?.mime_type || 'video/mp4';
        break;

      case 'sticker':
        content = '[ملصق]';
        mediaUrl = message.sticker?.id || null;
        mediaMime = message.sticker?.mime_type || 'image/webp';
        break;

      case 'location': {
        const lat = message.location?.latitude || '?';
        const lng = message.location?.longitude || '?';
        content = `📍 موقع: ${lat}, ${lng}`;
        if (message.location?.name) content += ` (${message.location.name})`;
        break;
      }

      case 'contacts': {
        const contactName = message.contacts?.[0]?.name?.formatted_name || 'جهة اتصال';
        const phones =
          message.contacts?.[0]?.phones?.map((p) => p.wa_id || p.phone).join(', ') || '';
        content = `📇 جهة اتصال: ${contactName}`;
        if (phones) content += ` - ${phones}`;
        break;
      }

      case 'interactive':
        content =
          message.interactive?.button_reply?.title ||
          message.interactive?.list_reply?.title ||
          message.interactive?.nfm_reply?.body ||
          '[رد تفاعلي]';
        break;

      case 'reaction': {
        const emoji = message.reaction?.emoji || '👍';
        const messageId = message.reaction?.message_id || '';
        content = `😊 تفاعل: ${emoji} (على رسالة: ${messageId.substring(0, 8)}...)`;
        break;
      }

      case 'order':
        content = `🛒 طلب: ${message.order?.catalog_id || ''} - ${message.order?.product_items?.length || 0} منتج`;
        break;

      default:
        content = `[${message.type || 'نوع غير معروف'}]`;
    }
  } catch (err) {
    console.error('Error extracting content:', err.message);
    content = '[خطأ في معالجة الرسالة]';
  }

  // Truncate content if too long (for database)
  if (content && content.length > 1000) {
    content = content.substring(0, 997) + '...';
  }

  return { content, mediaUrl, mediaMime };
}
/* eslint-enable no-useless-assignment */

// ──── Enhanced lead saving with MCP and DB fallback ────
async function saveLead(message, contactName, content, location = 'unknown') {
  const leadData = {
    name: contactName || message.from,
    phone: message.from,
    service: content,
    location: location,
    source: 'whatsapp',
    message_id: message.id,
    received_at: new Date().toISOString(),
  };

  // Try MCP first
  const mcpResult = await callMCP('save_lead', leadData);

  if (mcpResult) {
    console.log(`✅ Lead saved via MCP: ${message.from}`);
    return { saved: true, method: 'mcp', data: mcpResult };
  }

  // Fallback to direct database save
  try {
    await pool.query(
      `INSERT INTO leads (phone, name, service, location, source, message_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (phone, created_at::date) DO UPDATE 
       SET service = EXCLUDED.service, last_contact = NOW()`,
      [
        message.from,
        leadData.name,
        leadData.service,
        leadData.location,
        leadData.source,
        message.id,
      ]
    );
    console.log(`✅ Lead saved directly to DB: ${message.from}`);
    return { saved: true, method: 'database' };
  } catch (dbError) {
    console.error(`❌ Failed to save lead ${message.from}:`, dbError.message);
    return { saved: false, error: dbError.message };
  }
}

// ──── Raw body parser for webhook routes ────
router.use(express.raw({ type: 'application/json', limit: '5mb' }));

// ──── GET /api/webhook/whatsapp — Verification ────
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('❌ Webhook verification failed - invalid token or mode');
  console.warn(`Mode: ${mode}, Token provided: ${token ? '***' : 'missing'}`);
  res.sendStatus(403);
});

// ──── POST /api/webhook/whatsapp — Incoming events (enhanced) ────
router.post('/whatsapp', async (req, res) => {
  const rawBody = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
  const startTime = Date.now();

  // Verify signature
  if (!verifySignature(rawBody, req.headers['x-hub-signature-256'])) {
    console.error('❌ Invalid webhook signature - rejecting request');
    storeEvent({
      type: 'error',
      error: 'Invalid signature',
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });
    return res.status(401).send('Invalid signature');
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (parseError) {
    console.error('❌ Failed to parse webhook body:', parseError.message);
    return res.status(400).send('Bad Request - Invalid JSON');
  }

  // Always respond 200 immediately to Meta
  res.sendStatus(200);

  // Process asynchronously
  setImmediate(async () => {
    try {
      if (body.object !== 'whatsapp_business_account') {
        console.log(`Ignoring non-WhatsApp object: ${body.object}`);
        return;
      }

      const result = { messagesProcessed: 0, statusesProcessed: 0, leadsSaved: 0, errors: 0 };
      const entries = body.entry || [];

      for (const entry of entries) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;

          const value = change.value;
          const metadata = value.metadata || {};
          const messages = value.messages || [];
          const statuses = value.statuses || [];
          const contacts = value.contacts || [];

          // Process messages
          for (const message of messages) {
            // Validation
            if (!message.id || !message.from) {
              console.warn('Skipping message with missing id or from field');
              continue;
            }

            if (deduplicator.isDuplicate(message.id)) {
              console.log(`Duplicate message ${message.id} - skipping`);
              continue;
            }

            if (rateLimiter.isLimited(message.from)) {
              console.warn(`Rate limit exceeded for ${message.from} - skipping`);
              storeEvent({
                type: 'rate_limited',
                phone: message.from,
                messageId: message.id,
              });
              continue;
            }

            const contactName =
              contacts.find((c) => c.wa_id === message.from)?.profile?.name || null;
            const { content, mediaUrl, mediaMime } = extractContent(message);

            // ✨ SAVE LEAD USING MCP (as requested) ✨
            const leadResult = await saveLead(message, contactName, content, 'whatsapp');
            if (leadResult.saved) {
              result.leadsSaved++;
            }

            const event = {
              type: 'message',
              id: message.id,
              from: message.from,
              customerName: contactName,
              direction: 'inbound',
              messageType: message.type,
              content,
              mediaUrl,
              mediaMime,
              phoneNumberId: metadata.phone_number_id,
              status: 'received',
              leadSaved: leadResult.saved,
              leadMethod: leadResult.method,
            };

            storeEvent(event);

            // Store in DB
            try {
              await pool.query(
                `INSERT INTO messages (wa_message_id, phone_number, customer_name, direction, message_type, content, media_url, media_mime_type, status, phone_number_id, lead_saved, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                 ON CONFLICT (wa_message_id) DO UPDATE 
                 SET status = EXCLUDED.status, lead_saved = EXCLUDED.lead_saved`,
                [
                  message.id,
                  message.from,
                  contactName,
                  'inbound',
                  message.type,
                  content,
                  mediaUrl,
                  mediaMime,
                  'received',
                  metadata.phone_number_id,
                  leadResult.saved,
                ]
              );
              result.messagesProcessed++;
            } catch (err) {
              console.error('DB insert error:', err.message);
              result.errors++;
            }
          }

          // Process statuses (delivery/read receipts)
          for (const status of statuses) {
            if (!status.id) continue;

            const statusEvent = {
              type: 'status',
              messageId: status.id,
              status: status.status,
              recipientId: status.recipient_id,
              timestamp: new Date().toISOString(),
              errors: status.errors || null,
            };
            storeEvent(statusEvent);

            try {
              await pool.query(
                'UPDATE messages SET status = $1, updated_at = NOW() WHERE wa_message_id = $2',
                [status.status, status.id]
              );
              result.statusesProcessed++;
            } catch (dbError) {
              console.error(`Failed to update status for ${status.id}:`, dbError.message);
              result.errors++;
            }
          }

          // Process errors from Meta
          for (const err of value.errors || []) {
            storeEvent({
              type: 'error',
              error: err,
              timestamp: new Date().toISOString(),
            });
            result.errors++;
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Webhook processed in ${duration}ms: ${result.messagesProcessed} msgs, ${result.statusesProcessed} statuses, ${result.leadsSaved} leads, ${result.errors} errors`
      );
    } catch (err) {
      console.error('❌ Webhook processing error:', err);
      storeEvent({
        type: 'error',
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
    }
  });
});

// ──── GET /api/webhook/events — Enhanced monitoring endpoint ────
router.get('/events', (req, res) => {
  const { type, limit = 100, since, leadStatus } = req.query;
  let events = [...webhookEvents];

  if (type) events = events.filter((e) => e.type === type);
  if (since) events = events.filter((e) => new Date(e.timestamp) > new Date(since));
  if (leadStatus === 'saved') events = events.filter((e) => e.leadSaved === true);
  if (leadStatus === 'failed') events = events.filter((e) => e.leadSaved === false);

  res.json({
    total: events.length,
    events: events.slice(0, parseInt(limit)),
    stats: {
      total: webhookEvents.length,
      messages: webhookEvents.filter((e) => e.type === 'message').length,
      statuses: webhookEvents.filter((e) => e.type === 'status').length,
      errors: webhookEvents.filter((e) => e.type === 'error').length,
      leadsSaved: webhookEvents.filter((e) => e.leadSaved === true).length,
    },
  });
});

// ──── GET /api/webhook/config — Webhook config ────
router.get('/config', (req, res) => {
  res.json({
    whatsapp: {
      verifyToken: VERIFY_TOKEN ? '***configured***' : 'NOT SET',
      appSecret: APP_SECRET ? '***configured***' : 'NOT SET',
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ? '***configured***' : 'NOT SET',
      webhookUrl: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/webhook/whatsapp`,
      mcpUrl: MCP_URL,
    },
    limits: {
      rateLimit: 30,
      rateWindowMs: 60000,
      dedupTTLMs: 300000,
      maxEvents: MAX_EVENTS,
    },
  });
});

// ──── POST /api/webhook/test — Test webhook ────
router.post('/test', express.json(), (req, res) => {
  const testEvent = {
    type: 'test',
    payload: req.body,
    source: 'manual_test',
  };
  storeEvent(testEvent);
  console.log('Test event stored:', testEvent);
  res.json({ success: true, message: 'Test event stored', eventId: testEvent.id });
});

// ──── DELETE /api/webhook/events — Clear events ────
router.delete('/events', (req, res) => {
  const clearedCount = webhookEvents.length;
  webhookEvents.length = 0;
  console.log(`Cleared ${clearedCount} events`);
  res.json({ success: true, message: `Cleared ${clearedCount} events` });
});

// ──── POST /api/webhook/retry-mcp — Manually retry failed MCP calls ────
router.post('/retry-mcp', async (req, res) => {
  await retryFailedMCPCalls();
  res.json({ success: true, message: 'Retry process initiated' });
});

module.exports = router;
