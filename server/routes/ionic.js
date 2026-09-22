// ==============================================================
// routes/ionic.js
// معالجة Webhooks من Ionic Appflow
// يدعم: Native Build, Web Build, Automation
// ==============================================================

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ==============================================================
// 1. استقبال Webhook من Ionic Appflow
// ==============================================================
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        
        // التحقق من صحة البيانات
        if (!payload || !payload.appId) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صالحة: يجب أن تحتوي على appId'
            });
        }

        // تسجيل الوصول للـ Webhook (للتتبع)
        console.log(`[Ionic Webhook] Received for app: ${payload.appId}`);
        console.log(`[Ionic Webhook] State: ${payload.state}, Type: ${payload.type || payload.buildInfo?.job_type}`);

        // معالجة أنواع مختلفة من الـ Webhooks
        const isNativeBuild = payload.artifacts && payload.artifacts.some(a => a.artifactType === 'APK' || a.artifactType === 'AAB');
        const isWebBuild = payload.artifacts && payload.artifacts.some(a => a.artifactType === 'WWW_ZIP');
        const isAutomation = payload.automationId && payload.automation;

        let buildType = 'unknown';
        if (isNativeBuild) buildType = 'native';
        else if (isWebBuild) buildType = 'web';
        else if (isAutomation) buildType = 'automation';

        console.log(`[Ionic Webhook] Build Type: ${buildType}`);

        // ==========================================================
        // معالجة حسب نوع البناء
        // ==========================================================
        const result = await processBuild(payload, buildType);

        // الرد بـ 200 لإعلام Ionic بأنه تم استلام الـ Webhook بنجاح
        res.status(200).json({
            success: true,
            message: 'Webhook received successfully',
            processed: result
        });

    } catch (error) {
        console.error('[Ionic Webhook] Error:', error);
        
        // حتى في حالة الخطأ، نرد بـ 200 لمنع إعادة المحاولات غير الضرورية
        // لكن نسجل الخطأ في السجلات
        res.status(200).json({
            success: false,
            message: 'Webhook received but processing failed',
            error: error.message
        });
    }
});

// ==============================================================
// 2. الحصول على معلومات بناء معين
// ==============================================================
router.get('/build/:buildId', (req, res) => {
    res.status(501).json({
        success: false,
        code: 'IONIC_BUILD_PROVIDER_NOT_CONFIGURED',
        message: 'Build lookup is disabled until an Ionic build provider is configured.',
        buildId: req.params.buildId
    });
});

// ==============================================================
// 3. الحصول على قائمة البناءات الأخيرة
// ==============================================================
router.get('/builds', (_req, res) => {
    res.status(501).json({
        success: false,
        code: 'IONIC_BUILD_PROVIDER_NOT_CONFIGURED',
        message: 'Build history is disabled until an Ionic build provider is configured.'
    });
});

// ==============================================================
// 4. حالة الخدمة (Health Check)
// ==============================================================
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'ionic-webhook-handler',
        timestamp: new Date().toISOString()
    });
});

// ==============================================================
// دالة مساعدة لمعالجة البناء
// ==============================================================
async function processBuild(payload, buildType) {
    const result = {
        buildId: payload.id,
        appId: payload.appId,
        state: payload.state,
        buildType: buildType,
        processedAt: new Date().toISOString(),
        actions: []
    };

    // ====== معالجة Native Build ======
    if (buildType === 'native') {
        console.log('[Ionic] Processing Native Build...');
        
        // 1. التحقق من وجود ملفات APK/AAB
        const apkArtifact = payload.artifacts.find(a => a.artifactType === 'APK');
        const aabArtifact = payload.artifacts.find(a => a.artifactType === 'AAB');
        
        if (apkArtifact) {
            console.log(`[Ionic] APK available: ${apkArtifact.url}`);
            result.actions.push({
                type: 'apk_available',
                url: apkArtifact.url,
                name: apkArtifact.name
            });
            
            // يمكن إضافة منطق لحفظ الرابط أو إرسال إشعار
            // await saveBuildArtifact(payload.appId, payload.id, 'APK', apkArtifact.url);
        }
        
        if (aabArtifact) {
            console.log(`[Ionic] AAB available: ${aabArtifact.url}`);
            result.actions.push({
                type: 'aab_available',
                url: aabArtifact.url,
                name: aabArtifact.name
            });
        }

        // 2. تحديث حالة البناء في قاعدة البيانات
        // await updateBuildStatus(payload.appId, payload.id, payload.state);
        
        // 3. إرسال إشعار (إذا كان البناء ناجحاً)
        if (payload.state === 'success') {
            console.log(`[Ionic] Build ${payload.id} completed successfully!`);
            // await sendNotification(`تم بناء التطبيق بنجاح!`, payload);
        }
    }

    // ====== معالجة Web Build ======
    else if (buildType === 'web') {
        console.log('[Ionic] Processing Web Build...');
        
        const wwwArtifact = payload.artifacts.find(a => a.artifactType === 'WWW_ZIP');
        if (wwwArtifact) {
            console.log(`[Ionic] WWW ZIP available: ${wwwArtifact.url}`);
            result.actions.push({
                type: 'www_zip_available',
                url: wwwArtifact.url,
                name: wwwArtifact.name
            });
        }
    }

    // ====== معالجة Automation ======
    else if (buildType === 'automation') {
        console.log(`[Ionic] Processing Automation: ${payload.automation?.name || 'Unknown'}`);
        
        result.automation = {
            id: payload.automationId,
            name: payload.automation?.name || 'Unknown',
            platform: payload.automation?.platform || 'Unknown',
            profile: payload.automation?.profile || 'Unknown'
        };
    }

    // ====== معالجة الفشل ======
    if (payload.state === 'failed') {
        console.error(`[Ionic] Build ${payload.id} FAILED!`);
        result.actions.push({
            type: 'build_failed',
            message: 'فشل عملية البناء'
        });
        // await notifyAdmin(`فشل بناء التطبيق: ${payload.id}`);
    }

    return result;
}

// ==============================================================
// دوال مساعدة (يمكن تفعيلها حسب الحاجة)
// ==============================================================

/*
// حفظ بيانات البناء في قاعدة البيانات
async function saveBuildArtifact(appId, buildId, type, url) {
    // منطق حفظ البيانات في قاعدة البيانات
    // يمكن استخدام Supabase أو PostgreSQL
}

// تحديث حالة البناء
async function updateBuildStatus(appId, buildId, state) {
    // تحديث حالة البناء في قاعدة البيانات
}

// إرسال إشعار
async function sendNotification(message, payload) {
    // إرسال إشعار عبر Telegram أو Email
}
*/

module.exports = router;
