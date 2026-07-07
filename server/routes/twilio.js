/**
 * routes/twilio.js - Twilio Voice & SMS webhooks
 * يربط Twilio مع Rasa Pro عبر الخادم الحالي
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../logger');

const RASA_URL = process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
// Public base URL Twilio uses to reach us (must match exactly what's configured in Twilio console).
// Example: "https://api.azab.services". If unset we fall back to reconstructing from the request.
const TWILIO_PUBLIC_BASE_URL = (process.env.TWILIO_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

// ── XML escape for safe interpolation into TwiML ──────────────────────
function xmlEscape(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Twilio request signature verification ─────────────────────────────
// https://www.twilio.com/docs/usage/security#validating-requests
function computeTwilioSignature(url, params, authToken) {
  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + params[key];
  }
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}

function verifyTwilioSignature(req, res, next) {
  if (!TWILIO_AUTH_TOKEN) {
    logger.error('[Twilio] TWILIO_AUTH_TOKEN not configured — refusing webhook');
    return res.status(503).type('text/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>'
    );
  }

  const signature = req.get('X-Twilio-Signature');
  if (!signature) {
    logger.warn('[Twilio] Missing X-Twilio-Signature header');
    return res.status(403).type('text/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>'
    );
  }

  const url = TWILIO_PUBLIC_BASE_URL
    ? TWILIO_PUBLIC_BASE_URL + req.originalUrl
    : `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const params = req.body && typeof req.body === 'object' ? req.body : {};
  const expected = computeTwilioSignature(url, params, TWILIO_AUTH_TOKEN);

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    logger.warn(`[Twilio] Invalid signature for ${url}`);
    return res.status(403).type('text/xml').send(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>'
    );
  }

  next();
}

// Health check — mounted BEFORE the signature middleware so it stays public.
router.get('/health', (req, res) => {
  res.json({
    service: 'twilio-integration',
    status: 'ok',
    rasa_url: RASA_URL,
    signature_verification: TWILIO_AUTH_TOKEN ? 'enabled' : 'disabled (TWILIO_AUTH_TOKEN missing)',
    timestamp: new Date().toISOString()
  });
});

// Apply signature verification to every Twilio webhook route below.
router.use(verifyTwilioSignature);

// ============================================================
// 1. استقبال المكالمات الصوتية الواردة (Voice)
// ============================================================
router.post('/voice/incoming', async (req, res) => {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
    <Gather input="speech" timeout="3" speechTimeout="auto" language="ar-EG" action="/api/twilio/voice/gather" method="POST" enhanced="true">
      <Say voice="Polly.Zeina" language="ar-EG">مرحباً بك في خدمة عملاء Alazab. كيف يمكنني مساعدتك؟</Say>
    </Gather>
    <Redirect>/api/twilio/voice/incoming</Redirect>
  </Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// ============================================================
// 2. معالجة إدخال الصوت من المستخدم
// ============================================================
router.post('/voice/gather', async (req, res) => {
  const speechResult = req.body.SpeechResult;
  const fromNumber = req.body.From;
  const callSid = req.body.CallSid;

  logger.info(`[Twilio Voice] Call ${callSid} from ${fromNumber}: "${speechResult}"`);

  if (!speechResult || speechResult.trim() === '') {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Gather input="speech" timeout="3" speechTimeout="auto" language="ar-EG" action="/api/twilio/voice/gather" method="POST">
        <Say voice="Polly.Zeina">عذراً، لم أسمعك بوضوح. برجاء التحدث مرة أخرى.</Say>
      </Gather>
      <Redirect>/api/twilio/voice/incoming</Redirect>
    </Response>`;
    res.type('text/xml');
    return res.send(twiml);
  }

  try {
    const rasaResponse = await axios.post(RASA_URL, {
      message: speechResult,
      sender: fromNumber,
      metadata: { channel: 'twilio_voice', call_sid: callSid }
    }, { timeout: 10000 });

    const botReplyRaw = rasaResponse.data?.[0]?.text || 'عذراً، لم أستطع معالجة طلبك حالياً.';
    const botReply = xmlEscape(botReplyRaw);

    const isGoodbye = botReplyRaw.includes('مع السلامة') || botReplyRaw.includes('شكراً لاتصالك');

    let twiml;
    if (isGoodbye) {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="Polly.Zeina" language="ar-EG">${botReply}</Say>
        <Say voice="Polly.Zeina">شكراً لاستخدام خدمة العملاء. مع السلامة.</Say>
        <Hangup/>
      </Response>`;
    } else {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Gather input="speech" timeout="5" speechTimeout="auto" language="ar-EG" action="/api/twilio/voice/gather" method="POST">
          <Say voice="Polly.Zeina" language="ar-EG">${botReply}</Say>
        </Gather>
        <Redirect>/api/twilio/voice/incoming</Redirect>
      </Response>`;
    }

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    logger.error(`[Twilio Voice] Rasa error: ${error.message}`);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="Polly.Zeina">عذراً، هناك مشكلة تقنية. برجاء المحاولة لاحقاً.</Say>
      <Hangup/>
    </Response>`;
    res.type('text/xml');
    res.send(twiml);
  }
});

// ============================================================
// 3. استقبال رسائل SMS/WhatsApp
// ============================================================
router.post('/message/incoming', async (req, res) => {
  const fromNumber = req.body.From;
  const messageBody = req.body.Body;
  const messageSid = req.body.MessageSid;

  logger.info(`[Twilio Message] ${messageSid} from ${fromNumber}: "${messageBody}"`);

  try {
    const rasaResponse = await axios.post(RASA_URL, {
      message: messageBody,
      sender: fromNumber,
      metadata: { channel: 'twilio_sms', message_sid: messageSid }
    }, { timeout: 10000 });

    const botReply = xmlEscape(rasaResponse.data?.[0]?.text || 'عذراً، لم أستطع معالجة طلبك.');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${botReply}</Message>
    </Response>`;

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    logger.error(`[Twilio Message] Rasa error: ${error.message}`);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>عذراً، هناك مشكلة حالياً. برجاء المحاولة لاحقاً.</Message>
    </Response>`;
    res.type('text/xml');
    res.send(twiml);
  }
});

// ============================================================
// 4. تسجيل حالة المكالمة (Status Callback)
// ============================================================
router.post('/status', async (req, res) => {
  const { CallSid, CallStatus, Duration, From } = req.body;
  logger.info(`[Twilio Status] Call ${CallSid} from ${From} status: ${CallStatus} duration: ${Duration}s`);
  res.sendStatus(200);
});

// ============================================================
// 5. اختبار صحة الخدمة (health check — no signature required)
// ============================================================
// Note: `router.use(verifyTwilioSignature)` above applies to POSTs from Twilio.
// The health endpoint below is a plain GET and Twilio doesn't sign it — but
// signature verification only rejects when the header is required-and-missing
// on POST requests. GET here will simply not have a body/signature; we short-
// circuit by mounting it on a sub-router that skips verification.
const healthRouter = express.Router();
healthRouter.get('/', (req, res) => {
  res.json({
    service: 'twilio-integration',
    status: 'ok',
    rasa_url: RASA_URL,
    signature_verification: TWILIO_AUTH_TOKEN ? 'enabled' : 'disabled (TWILIO_AUTH_TOKEN missing)',
    timestamp: new Date().toISOString()
  });
});

// Export: mount health separately so it bypasses the signature middleware.
module.exports = router;
module.exports.healthRouter = healthRouter;
