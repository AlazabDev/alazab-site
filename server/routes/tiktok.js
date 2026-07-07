// routes/tiktok.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../logger');
const config = require('../config/tiktok.config');

// ============================================
// 1. بدء عملية المصادقة OAuth
// ============================================
router.get('/auth', (req, res) => {
    try {
        const state = crypto.randomBytes(16).toString('hex');
        // تخزين الـ state في الجلسة أو الـ Cookie
        res.cookie('tiktok_state', state, { 
            httpOnly: true, 
            secure: true, 
            maxAge: 600000 // 10 دقائق
        });
        
        const authUrl = `${config.authUrl}?` + new URLSearchParams({
            client_key: config.appId,
            response_type: 'code',
            scope: config.scope,
            redirect_uri: config.redirectUri,
            state: state
        });
        
        logger.info(`TikTok: بدء المصادقة, state: ${state}`);
        res.redirect(authUrl);
    } catch (error) {
        logger.error(`TikTok: خطأ في بدء المصادقة: ${error.message}`);
        res.status(500).json({ error: 'فشل بدء عملية المصادقة' });
    }
});

// ============================================
// 2. استقبال الكود وإصدار الـ Access Token
// ============================================
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        
        // التحقق من الـ state لمنع هجمات CSRF
        const savedState = req.cookies.tiktok_state;
        if (state !== savedState) {
            logger.warn(`TikTok: عدم تطابق الـ state`);
            return res.status(403).json({ error: 'Invalid state parameter' });
        }
        
        if (error) {
            logger.error(`TikTok: خطأ من المنصة: ${error}`);
            return res.status(400).json({ error: `TikTok error: ${error}` });
        }
        
        // تبادل الكود للحصول على التوكن
        const tokenResponse = await axios.post(config.tokenUrl, {
            client_key: config.appId,
            client_secret: config.appSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: config.redirectUri
        });
        
        const { access_token, refresh_token, expires_in, advertiser_ids } = tokenResponse.data.data;
        
        // تسجيل التوكن في قاعدة البيانات
        const db = require('../db');
        await db.query(
            `INSERT INTO tiktok_tokens (access_token, refresh_token, expires_at, advertiser_ids) 
             VALUES ($1, $2, NOW() + INTERVAL '${expires_in} seconds', $3)
             ON CONFLICT (id) DO UPDATE SET 
             access_token = EXCLUDED.access_token,
             refresh_token = EXCLUDED.refresh_token,
             expires_at = EXCLUDED.expires_at,
             updated_at = NOW()`,
            [access_token, refresh_token, advertiser_ids.join(',')]
        );
        
        logger.info(`TikTok: تم الحصول على التوكن بنجاح`);
        res.json({
            success: true,
            message: 'تم المصادقة بنجاح مع TikTok',
            access_token: access_token.substring(0, 20) + '...' // للإخفاء
        });
    } catch (error) {
        logger.error(`TikTok: خطأ في الـ callback: ${error.message}`);
        res.status(500).json({ error: 'فشل تبادل الكود للحصول على التوكن' });
    }
});

// ============================================
// 3. جلب معلومات الحساب المعلن
// ============================================
router.get('/advertisers', async (req, res) => {
    try {
        const token = await getValidAccessToken();
        
        const response = await axios.get(`${config.baseUrl}/advertiser/list/`, {
            headers: {
                'Access-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        res.json(response.data);
    } catch (error) {
        logger.error(`TikTok: خطأ في جلب المعلنين: ${error.message}`);
        res.status(500).json({ error: 'فشل جلب قائمة المعلنين' });
    }
});

// ============================================
// 4. جلب تقارير الأداء للحملات
// ============================================
router.post('/report', async (req, res) => {
    try {
        const { advertiser_id, start_date, end_date, dimensions } = req.body;
        const token = await getValidAccessToken();
        
        const response = await axios.post(`${config.baseUrl}/report/integrated/get/`, {
            advertiser_id: advertiser_id,
            service_type: 'AUCTION',
            report_type: 'BASIC',
            data_level: 'CAMPAIGN',
            start_date: start_date,
            end_date: end_date,
            dimensions: dimensions || ['campaign_name', 'adgroup_name'],
            metrics: ['impressions', 'clicks', 'ctr', 'spend', 'conversions']
        }, {
            headers: {
                'Access-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        logger.info(`TikTok: تم جلب التقرير بنجاح للمعلن ${advertiser_id}`);
        res.json(response.data);
    } catch (error) {
        logger.error(`TikTok: خطأ في جلب التقرير: ${error.message}`);
        res.status(500).json({ error: 'فشل جلب تقرير الأداء' });
    }
});

// ============================================
// 5. إنشاء حملة إعلانية جديدة
// ============================================
router.post('/campaign', async (req, res) => {
    try {
        const { advertiser_id, campaign_name, budget, objective } = req.body;
        const token = await getValidAccessToken();
        
        const response = await axios.post(`${config.baseUrl}/campaign/create/`, {
            advertiser_id: advertiser_id,
            campaign_name: campaign_name,
            objective: objective || 'CONVERSIONS',
            budget: budget,
            budget_type: 'DAILY'
        }, {
            headers: {
                'Access-Token': token,
                'Content-Type': 'application/json'
            }
        });
        
        logger.info(`TikTok: تم إنشاء حملة جديدة: ${campaign_name}`);
        res.json(response.data);
    } catch (error) {
        logger.error(`TikTok: خطأ في إنشاء الحملة: ${error.message}`);
        res.status(500).json({ error: 'فشل إنشاء الحملة الإعلانية' });
    }
});

// ============================================
// 6. تحديث التوكن تلقائياً
// ============================================
async function getValidAccessToken() {
    const db = require('../db');
    const result = await db.query(
        `SELECT access_token, refresh_token, expires_at FROM tiktok_tokens 
         WHERE id = 1 ORDER BY created_at DESC LIMIT 1`
    );
    
    if (result.rows.length === 0) {
        throw new Error('لا يوجد توكن TikTok صالح. يرجى المصادقة أولاً.');
    }
    
    const { access_token, refresh_token, expires_at } = result.rows[0];
    const now = new Date();
    const expiry = new Date(expires_at);
    
    // إذا كان التوكن منتهياً أو سينتهي خلال 5 دقائق
    if ((expiry - now) < 300000) {
        // تحديث التوكن
        const refreshResponse = await axios.post(config.tokenUrl, {
            client_key: config.appId,
            client_secret: config.appSecret,
            refresh_token: refresh_token,
            grant_type: 'refresh_token'
        });
        
        const { access_token: new_token, refresh_token: new_refresh, expires_in } = refreshResponse.data.data;
        
        await db.query(
            `UPDATE tiktok_tokens SET 
             access_token = $1, 
             refresh_token = $2, 
             expires_at = NOW() + INTERVAL '${expires_in} seconds',
             updated_at = NOW()
             WHERE id = 1`,
            [new_token, new_refresh]
        );
        
        return new_token;
    }
    
    return access_token;
}

// ============================================
// 7. ويب هوك لاستقبال أحداث TikTok
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-tiktok-signature'];
        const payload = req.body;
        
        // التحقق من التوقيع
        const expectedSignature = crypto
            .createHmac('sha256', config.webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        if (signature !== expectedSignature) {
            logger.warn('TikTok: توقيع ويب هوك غير صالح');
            return res.status(403).json({ error: 'Invalid signature' });
        }
        
        // معالجة الأحداث
        const { event_type, data } = payload;
        logger.info(`TikTok: استقبال حدث ${event_type}`);
        
        switch (event_type) {
            case 'CAMPAIGN_STATUS_CHANGED':
                // معالجة تغيير حالة الحملة
                await handleCampaignStatusChange(data);
                break;
            case 'ADGROUP_BUDGET_UPDATED':
                // معالجة تحديث الميزانية
                await handleBudgetUpdate(data);
                break;
            case 'CONVERSION_TRACKING':
                // معالجة تتبع التحويلات
                await handleConversionTracking(data);
                break;
            default:
                logger.info(`TikTok: حدث غير معروف ${event_type}`);
        }
        
        res.json({ success: true });
    } catch (error) {
        logger.error(`TikTok: خطأ في ويب هوك: ${error.message}`);
        res.status(500).json({ error: 'فشل معالجة الويب هوك' });
    }
});

// دوال مساعدة لمعالجة الأحداث
async function handleCampaignStatusChange(data) {
    // تحديث حالة الحملة في قاعدة البيانات
}

async function handleBudgetUpdate(data) {
    // تسجيل تغيير الميزانية للتحليل
}

async function handleConversionTracking(data) {
    // تحديث بيانات التحويلات
}

module.exports = router;

// مسار الصحة
router.get('/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'tiktok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/tiktok/auth',
            callback: '/api/tiktok/callback',
            advertisers: '/api/tiktok/advertisers',
            report: '/api/tiktok/report',
            campaigns: '/api/tiktok/campaigns/:advertiser_id',
            webhook: '/api/tiktok/webhook'
        }
    });
});
