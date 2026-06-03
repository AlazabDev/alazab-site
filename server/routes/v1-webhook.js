const express = require('express');
const router = express.Router();
const logger = require('../logger');

/**
 * Webhook endpoint V1
 * POST /api/v1/webhook - استقبال البيانات من الخدمات الخارجية
 * GET /api/v1/webhook - التحقق من صحة endpoint
 */

// POST: استقبال webhook
router.post('/', async (req, res) => {
    const startTime = Date.now();
    const webhookData = req.body;
    const source = req.headers['user-agent'] || 'unknown';
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
    
    logger.info(`📨 Webhook V1 received from ${source}`);
    
    try {
        // ✅ أضف التحقق من التوقيع هنا إذا كانت الخدمة تدعمه
        // if (signature && !verifySignature(signature, webhookData)) {
        //     return res.status(401).json({ error: 'Invalid signature' });
        // }
        
        // معالجة حسب نوع الحدث
        const eventType = webhookData.type || webhookData.event || req.headers['x-event-type'];
        
        // هنا يمكنك إضافة منطق مخصص
        switch(eventType) {
            case 'user.created':
                // معالجة مستخدم جديد
                logger.info(`New user created: ${webhookData.user?.email}`);
                break;
            case 'payment.succeeded':
                // معالجة دفع ناجح
                logger.info(`Payment succeeded: ${webhookData.payment?.id}`);
                break;
            default:
                logger.debug(`Unhandled event type: ${eventType}`);
        }
        
        // الرد بسرعة - مهم لتجنب إعادة الإرسال
        res.status(200).json({
            status: 'success',
            message: 'Webhook processed',
            received_at: new Date().toISOString(),
            processing_time_ms: Date.now() - startTime
        });
        
    } catch (error) {
        logger.error('Webhook processing error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// GET: للتحقق (مطلوب من بعض الخدمات مثل WhatsApp Business API)
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // للتحقق من WhatsApp Business API أو Meta webhooks
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        logger.info('Webhook verified with challenge');
        return res.status(200).send(challenge);
    }
    
    // رد عادي
    res.status(200).json({
        status: 'ready',
        version: 'v1',
        endpoints: {
            post: 'POST /api/v1/webhook - Send webhook events',
            health: 'GET /api/v1/webhook/health - Health check'
        },
        supported_events: ['user.created', 'payment.succeeded', 'test']
    });
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
