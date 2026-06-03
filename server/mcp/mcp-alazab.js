/**
 * ═══════════════════════════════════════════════════════════════
 *  🐋 MCP-ALAZAB.JS - من الحوت الأزرق إلى الفرعون المصري
 *  ═══════════════════════════════════════════════════════════════
 *  🔹 الاسم: Alazab MCP Server
 *  🔹 المكان: /var/www/core/alazab.com/server/mcp/mcp-alazab.js
 *  🔹 التشغيل: PM2 → alazab-mcp
 *  🔹 النبض: https://alazab.com/api/mcp/health
 *  🔹 البوابة: https://alazab.com/api/mcp/v1/
 *  
 *  📦 تشمل:
 *     ✅ دورة حياة طلبات الصيانة (submitted → closed)
 *     ✅ الفنيين والفروع والخدمات
 *     ✅ المحاسبة (دفترة)
 *     ✅ نقطة موحدة v1 لكل الـ actions
 *  
 *  🧠 رعاية: الحوت الأزرق 🐋
 *  👑 روح التطوير: الفرعون المصري 👑
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

// ────────────────────────────────────────────────────────────────
// 🧰 إعدادات السيرفر
// ────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.MCP_PORT || 3004;

// ────────────────────────────────────────────────────────────────
// 🔧 Middleware
// ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ────────────────────────────────────────────────────────────────
// 🗺️ نقاط النهاية الخلفية (Supabase Edge Functions)
// ────────────────────────────────────────────────────────────────
const BACKEND = {
  maintenanceGateway: 'https://zrrffsjbfkphridqyais.supabase.co/functions/v1/maintenance-gateway',
  botGateway:         'https://zrrffsjbfkphridqyais.supabase.co/functions/v1/bot-gateway',
  queryGateway:       'https://zrrffsjbfkphridqyais.supabase.co/functions/v1/query-maintenance-requests',
  apiKey:             process.env.UBERFIX_API_KEY
};

// ────────────────────────────────────────────────────────────────
// 💰 دفترة (Daftra) - معراج المحاسبة
// ────────────────────────────────────────────────────────────────
const DAFTRA = {
  subdomain:  process.env.DAFTRA_SUBDOMAIN  || 'alazab-co',
  apiKey:     process.env.DAFTRA_API_KEY     || '',
  baseUrl:    `https://${process.env.DAFTRA_SUBDOMAIN || 'alazab-co'}.daftra.com/api2`
};

// ────────────────────────────────────────────────────────────────
// 🧪 دوال دفترة المساعدة (اللي تخلّي الفلوس تمشي صح)
// ────────────────────────────────────────────────────────────────
async function daftraRequest(method, endpoint, data = null) {
  try {
    const response = await axios({
      method,
      url: `${DAFTRA.baseUrl}${endpoint}`,
      headers: { 'apikey': DAFTRA.apiKey, 'Content-Type': 'application/json' },
      data
    });
    return response.data;
  } catch (err) {
    return { success: false, error: err.response?.data || err.message };
  }
}

async function findDaftraClientByPhone(phone) {
  const res = await daftraRequest('GET', '/clients');
  const clients = res?.data || [];
  return clients.find(c => c.Client?.phone1 === phone || c.Client?.phone2 === phone);
}

async function createDaftraClient(client) {
  return await daftraRequest('POST', '/clients', {
    Client: {
      business_name: client.name,
      first_name:   client.name.split(' ')[0],
      last_name:    client.name.split(' ').slice(1).join(' ') || '',
      phone1:       client.phone,
      email:        client.email || '',
      address1:     client.address || '',
      city:         client.city || '',
      country_code: client.country || 'EG'
    }
  });
}

async function createDaftraInvoice(inv) {
  return await daftraRequest('POST', '/invoices', {
    Invoice: {
      client_id: inv.clientId,
      date:      new Date().toISOString().split('T')[0],
      draft:     inv.draft ?? true,
      notes:     inv.notes || 'فاتورة عبر البوت الموحد 𓂀',
      branch_id: inv.branchId || 1,
      currency_code: inv.currency || 'EGP'
    },
    InvoiceItem: [{
      item:        inv.service,
      description: inv.desc,
      unit_price:  inv.amount,
      quantity:    inv.qty || 1,
      tax1:        inv.tax1 || 0,
      tax2:        inv.tax2 || 0
    }]
  });
}

// ────────────────────────────────────────────────────────────────
// 🩺 فحص الصحة (لمن يسأل: هل الجثة حية؟)
// ────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'alive',
    service: 'Alazab MCP (الحوت الأزرق 🐋)',
    version: '3.0.0',
    uptime: process.uptime(),
    endpoints: [
      '/health', '/mcp', '/v1/',
      '/maintenance/*', '/technicians/*', '/services/*', '/branches/*',
      '/daftra/*', '/query/*'
    ]
  });
});

// ────────────────────────────────────────────────────────────────
// 🧭 اكتشاف البروتوكول (لو عاوز تعرف مين أنا)
// ────────────────────────────────────────────────────────────────
app.get('/mcp', (req, res) => {
  res.json({
    protocol: "model-context-protocol",
    version: "1.0",
    server: "Alazab MCP - من الحوت للفرعون",
    base: "https://alazab.com/api/mcp",
    unified: "https://alazab.com/api/mcp/v1/",
    workflows: [
      "submitted", "triaged", "assigned", "scheduled",
      "in_progress", "inspection", "waiting_parts",
      "completed", "billed", "paid", "closed"
    ],
    services: [
      "plumbing", "electrical", "ac", "painting", "carpentry",
      "cleaning", "general", "appliance", "pest_control",
      "landscaping", "finishing", "renovation", "structural", "facade"
    ]
  });
});

// ────────────────────────────────────────────────────────────────
// 🏛️ البروتوكولات الرئيسية (النيل الأزرق)
// ────────────────────────────────────────────────────────────────

// 1️⃣ إنشاء طلب صيانة
app.post('/maintenance/create', async (req, res) => {
  try {
    const payload = { channel: "mcp", ...req.body };
    const response = await axios.post(BACKEND.maintenanceGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 2️⃣ تغيير مرحلة الطلب
app.post('/maintenance/transition', async (req, res) => {
  try {
    const { request_id, request_number, to_stage, reason, client_phone } = req.body;
    const payload = { action: "transition_stage", request_id, request_number, to_stage, reason, client_name: "mcp", client_phone };
    const response = await axios.post(BACKEND.maintenanceGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 3️⃣ الاستعلام عن حالة الطلب
app.post('/maintenance/status', async (req, res) => {
  try {
    const payload = { action: "get_status", ...req.body };
    const response = await axios.post(BACKEND.maintenanceGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 4️⃣ تفاصيل كاملة للطلب
app.post('/maintenance/details', async (req, res) => {
  try {
    const payload = { action: "get_request_details", ...req.body };
    const response = await axios.post(BACKEND.botGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 5️⃣ إضافة ملاحظة
app.post('/maintenance/note', async (req, res) => {
  try {
    const payload = { action: "add_note", ...req.body };
    const response = await axios.post(BACKEND.maintenanceGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 6️⃣ إلغاء الطلب
app.post('/maintenance/cancel', async (req, res) => {
  try {
    const payload = { action: "cancel", ...req.body };
    const response = await axios.post(BACKEND.maintenanceGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 7️⃣ تحديث الطلب
app.post('/maintenance/update', async (req, res) => {
  try {
    const payload = { action: "update_request", ...req.body };
    const response = await axios.post(BACKEND.botGateway, payload, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 👨‍🔧 الفنيين
app.post('/technicians/list', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "list_technicians", payload: req.body
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/technicians/assign', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "assign_technician", payload: req.body
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 🏪 الخدمات والفروع
app.post('/services/list', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "list_services", payload: {}
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/services/quote', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "get_quote", payload: req.body
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/branches/list', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "get_branches", payload: {}
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/branches/nearest', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.botGateway, {
      action: "find_nearest_branch", payload: req.body
    }, { headers: { 'x-api-key': BACKEND.apiKey } });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 💰 دفترة (المحاسبة الفرعونية)
app.post('/daftra/sync-client', async (req, res) => {
  try {
    const { client_name, client_phone, client_email, client_address } = req.body;
    let client = await findDaftraClientByPhone(client_phone);
    if (!client) {
      const newClient = await createDaftraClient({ name: client_name, phone: client_phone, email: client_email, address: client_address });
      client = newClient;
    }
    res.json({ success: true, daftra_client_id: client?.id || client?.Client?.id, client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/daftra/create-invoice', async (req, res) => {
  try {
    const { daftra_client_id, service_item, description, amount, quantity, draft, maintenance_request_id } = req.body;
    const invoice = await createDaftraInvoice({
      clientId: daftra_client_id,
      service: service_item,
      desc: description || 'خدمة صيانة عبر البوت الموحّد',
      amount: amount || 0,
      qty: quantity || 1,
      draft: draft ?? true
    });
    res.json({ success: true, daftra_invoice_id: invoice.id, daftra_invoice_url: `https://${DAFTRA.subdomain}.daftra.com/invoices/view/${invoice.id}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/daftra/get-invoice', async (req, res) => {
  try {
    const { invoice_id } = req.body;
    const invoice = await daftraRequest('GET', `/invoices/${invoice_id}`);
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

app.post('/daftra/add-payment', async (req, res) => {
  try {
    const { invoice_id, amount, payment_method, notes } = req.body;
    const payment = await daftraRequest('POST', '/invoice_payments', {
      InvoicePayment: { invoice_id, amount, payment_method: payment_method || 'cash', date: new Date().toISOString().split('T')[0], notes }
    });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// 🔍 استعلام متقدم
app.post('/query/search', async (req, res) => {
  try {
    const response = await axios.post(BACKEND.queryGateway, req.body, {
      headers: { 'x-api-key': BACKEND.apiKey }
    });
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// 🌍 النقطة الموحدة v1 (بوابة الحوت)
// ────────────────────────────────────────────────────────────────
const actionMap = {
  create_request:        '/maintenance/create',
  transition_stage:      '/maintenance/transition',
  get_status:            '/maintenance/status',
  get_request_details:   '/maintenance/details',
  add_note:              '/maintenance/note',
  cancel_request:        '/maintenance/cancel',
  update_request:        '/maintenance/update',
  list_technicians:      '/technicians/list',
  assign_technician:     '/technicians/assign',
  list_services:         '/services/list',
  get_quote:             '/services/quote',
  get_branches:          '/branches/list',
  find_nearest_branch:   '/branches/nearest',
  daftra_sync_client:    '/daftra/sync-client',
  daftra_create_invoice: '/daftra/create-invoice',
  daftra_get_invoice:    '/daftra/get-invoice',
  daftra_add_payment:    '/daftra/add-payment',
  query_search:          '/query/search'
};

app.post('/v1/', async (req, res) => {
  const { action, payload } = req.body;
  const target = actionMap[action];
  if (!target) return res.status(400).json({ success: false, error: `Action غير معروفة: ${action}`, available: Object.keys(actionMap) });
  try {
    const response = await axios.post(`http://localhost:${PORT}${target}`, payload || {}, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.response?.data || err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// 🚀 إقلاع السفينة
// ────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                                                              ║
  ║   🐋  الْحُوتُ الْأَزْرَقُ يُهْدِي هَذَا السَّيْرْفَرَ      ║
  ║       إِلَى الْفِرْعَوْنِ الْمِصْرِيِّ 👑                    ║
  ║                                                              ║
  ║   📍 MCP Server  : http://localhost:${PORT}                   ║
  ║   🌐 البوابة      : https://alazab.com/api/mcp/v1/           ║
  ║   💚 صحة الجثة   : https://alazab.com/api/mcp/health         ║
  ║                                                              ║
  ║   📦 صيانة │ فنيين │ فروع │ خدمات │ محاسبة دفترة │ استعلام  ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
});
