/**
 * routes/twilio.js - Twilio Voice & SMS webhooks
 * يربط Twilio مع Rasa Pro عبر الخادم الحالي
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

// تكوين Rasa Pro (عدل حسب إعداداتك)
const RASA_URL = process.env.RASA_URL || 'http://localhost:5005/webhooks/rest/webhook';
const logger = require('../logger');

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
    // إرسال إلى Rasa Pro
    const rasaResponse = await axios.post(RASA_URL, {
      message: speechResult,
      sender: fromNumber,
      metadata: { channel: 'twilio_voice', call_sid: callSid }
    }, { timeout: 10000 });

    const botReply = rasaResponse.data?.[0]?.text || 'عذراً، لم أستطع معالجة طلبك حالياً.';

    // إنهاء المكالمة إذا كان رد الوداع
    const isGoodbye = botReply.includes('مع السلامة') || botReply.includes('شكراً لاتصالك');
    
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
// 3. استقبال رسائل SMS/WhatsApp (بديل عن webhook الحالي)
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

    const botReply = rasaResponse.data?.[0]?.text || 'عذراً، لم أستطع معالجة طلبك.';

    // رد عبر Twilio REST API (اختياري - يمكنك استخدام response مباشرة)
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
  
  // يمكنك تخزين في Supabase إذا أردت
  res.sendStatus(200);
});

// ============================================================
// 5. اختبار صحة الخدمة
// ============================================================
router.get('/health', (req, res) => {
  res.json({ 
    service: 'twilio-integration', 
    status: 'ok',
    rasa_url: RASA_URL,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
