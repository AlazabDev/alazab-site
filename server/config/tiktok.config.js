// config/tiktok.config.js
module.exports = {
    // بيانات التطبيق من TikTok Developer Portal
    appId: process.env.TIKTOK_APP_ID,
    appSecret: process.env.TIKTOK_APP_SECRET,
    redirectUri: process.env.TIKTOK_REDIRECT_URI || 'https://alazab.com/api/tiktok/callback',
    
    // نطاقات الصلاحيات المطلوبة
    scope: 'user.info.basic,ad.account.list,ad.account.read,reporting.read,ad.manage',
    
    // عناوين الـ API
    baseUrl: 'https://business-api.tiktok.com/open_api/v1.3',
    authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/token/',
    
    // إعدادات Webhook
    webhook: {
        secret: process.env.TIKTOK_WEBHOOK_SECRET,
        endpoint: '/api/tiktok/webhook'
    }
};
