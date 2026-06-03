// routes/supabase-webhook.js
const express = require('express');
const router = express.Router();

// تخزين مؤقت للآخر استلام (اختياري)
let lastReceived = null;
let dailyStats = {
  lastUpdate: null,
  totalUpdates: 0,
  daysWithUpdates: 0,
  daysWithoutUpdates: 0
};

/**
 * POST /api/supabase/daily
 * يستقبل الإشعار اليومي من Supabase
 */
router.post('/daily', async (req, res) => {
  const startTime = Date.now();
  const { timestamp, updates_count, updates, has_changes } = req.body;
  
  // سجل الاستلام (دائماً)
  console.log(`\n📡 [Supabase Webhook] ${new Date().toISOString()}`);
  console.log(`   Has updates: ${has_changes}, Count: ${updates_count || 0}`);
  
  // تحديث الإحصائيات
  lastReceived = new Date();
  if (has_changes && updates_count > 0) {
    dailyStats.totalUpdates += updates_count;
    dailyStats.daysWithUpdates++;
    console.log(`   🎯 New records: ${updates_count}`);
    
    // عرض أول 3 تحديثات كعينة
    if (updates && updates.length > 0) {
      console.log(`   📝 Sample updates:`);
      updates.slice(0, 3).forEach((item, idx) => {
        console.log(`      ${idx+1}. ${JSON.stringify(item).substring(0, 100)}`);
      });
    }
  } else {
    dailyStats.daysWithoutUpdates++;
    console.log(`   ✅ No new updates - Heartbeat received`);
  }
  dailyStats.lastUpdate = new Date();
  
  // ✅ دائماً نرد بـ 200 (حتى لو مفيش تحديثات)
  // ده يضمن أن Supabase يشوف إن الإرسال نجح ومايعيدش المحاولة
  res.status(200).json({
    status: 'success',
    received_at: new Date().toISOString(),
    processed: true,
    has_changes: has_changes || false,
    updates_count: updates_count || 0,
    message: has_changes ? 'Updates processed successfully' : 'Heartbeat acknowledged - no updates'
  });
});

/**
 * GET /api/supabase/stats
 * استعراض إحصائيات الـ webhook (للاختبار والمراقبة)
 */
router.get('/stats', (req, res) => {
  res.json({
    status: 'active',
    last_received: lastReceived,
    daily_stats: dailyStats,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage()
  });
});

/**
 * GET /api/supabase/health
 * نقطة فحص الصحة (اللي ظهرت في اختبارك ts-links.sh)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'supabase-daily-webhook',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/supabase/test
 * للاختبار اليدوي (بدون Supabase)
 */
router.post('/test', (req, res) => {
  console.log(`\n🧪 [Test Mode] Manual test at ${new Date().toISOString()}`);
  console.log(`   Test payload:`, req.body);
  
  res.json({
    status: 'test_received',
    timestamp: new Date().toISOString(),
    your_payload: req.body
  });
});

module.exports = router;
