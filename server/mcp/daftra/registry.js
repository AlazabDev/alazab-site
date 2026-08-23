'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EXPECTED_MANIFEST = require('./catalog/manifest.json');
const OPENAPI_FILE = process.env.DAFTRA_OPENAPI_FILE || path.join(__dirname, 'openapi', 'Default module.openapi.json');

if (!fs.existsSync(OPENAPI_FILE)) {
  throw new Error(`Daftra OpenAPI file is missing: ${OPENAPI_FILE}`);
}

const raw = fs.readFileSync(OPENAPI_FILE);
const sourceSha256 = crypto.createHash('sha256').update(raw).digest('hex');
const spec = JSON.parse(raw.toString('utf8'));
const ALLOWED_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[{}]/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'root';
}

function primaryGroup(tags = []) {
  return tags.find((x) => String(x).startsWith('Endpoints/')) || tags[0] || 'Untagged';
}

function domainFromTags(tags = []) {
  const tag = primaryGroup(tags);
  if (tag.startsWith('Endpoints/')) return tag.slice('Endpoints/'.length).trim().split('/')[0].trim() || 'Other';
  return tag.split('/')[0].trim() || 'Other';
}

function requestBody(operation) {
  const rb = operation.requestBody || null;
  if (!rb) return null;
  const content = rb.content || {};
  const preference = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded'];
  const mediaType = preference.find((x) => content[x]) || Object.keys(content)[0] || null;
  return {
    required: Boolean(rb.required),
    media_type: mediaType,
    schema: mediaType ? content[mediaType]?.schema || null : null,
  };
}

function normalizeParameters(operation) {
  return (operation.parameters || [])
    .filter((p) => p && typeof p === 'object' && !p.$ref)
    .map((p) => ({
      name: p.name,
      in: p.in,
      required: Boolean(p.required),
      description: p.description || '',
      schema: p.schema || null,
    }));
}

const operations = [];
for (const [apiPath, pathItem] of Object.entries(spec.paths || {})) {
  for (const [method, operation] of Object.entries(pathItem || {})) {
    if (!ALLOWED_METHODS.has(method.toLowerCase()) || !operation || typeof operation !== 'object') continue;
    const tags = operation.tags || [];
    operations.push({
      key: `daftra.raw.${method.toLowerCase()}.${slug(apiPath)}`,
      method: method.toUpperCase(),
      path: apiPath,
      summary: operation.summary || '',
      description: operation.description || '',
      group: primaryGroup(tags),
      domain: domainFromTags(tags),
      tags,
      parameters: normalizeParameters(operation),
      body: requestBody(operation),
      responses: operation.responses || {},
      security: operation.security,
      deprecated: Boolean(operation.deprecated),
    });
  }
}

if (new Set(operations.map((x) => x.key)).size !== operations.length) {
  throw new Error('Daftra OpenAPI generated duplicate operation keys');
}

const expectedCount = Number(process.env.DAFTRA_OPENAPI_EXPECT_OPERATIONS || EXPECTED_MANIFEST.operation_count || 0);
if (expectedCount && operations.length !== expectedCount) {
  throw new Error(`Daftra OpenAPI operation count mismatch: expected ${expectedCount}, got ${operations.length}`);
}
if (process.env.DAFTRA_OPENAPI_STRICT_HASH === 'true' && EXPECTED_MANIFEST.source_sha256 && sourceSha256 !== EXPECTED_MANIFEST.source_sha256) {
  throw new Error(`Daftra OpenAPI SHA256 mismatch: expected ${EXPECTED_MANIFEST.source_sha256}, got ${sourceSha256}`);
}

const byKey = new Map(operations.map((op) => [op.key, op]));
const groupCounts = new Map();
const domainCounts = new Map();
for (const op of operations) {
  groupCounts.set(op.group, (groupCounts.get(op.group) || 0) + 1);
  domainCounts.set(op.domain, (domainCounts.get(op.domain) || 0) + 1);
}

const catalogSummary = {
  version: '2.0.0',
  source_file: path.basename(OPENAPI_FILE),
  source_sha256: sourceSha256,
  operation_count: operations.length,
  path_count: Object.keys(spec.paths || {}).length,
  group_count: groupCounts.size,
  domain_count: domainCounts.size,
  methods: Object.fromEntries(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => [m, operations.filter((x) => x.method === m).length])),
  domains: [...domainCounts.entries()].sort().map(([name, count]) => ({ name, count })),
  groups: [...groupCounts.entries()].sort().map(([name, count]) => ({ name, count })),
};

const ARABIC_ALIASES = new Map(Object.entries({
  'مصروف': 'expenses', 'مصروفات': 'expenses', 'نفقة': 'expenses', 'نفقات': 'expenses',
  'دخل': 'incomes', 'ايراد': 'incomes', 'إيراد': 'incomes', 'ايرادات': 'incomes', 'إيرادات': 'incomes',
  'فاتورة بيع': 'invoices', 'فاتورة مبيعات': 'invoices', 'فواتير بيع': 'invoices',
  'فاتورة شراء': 'purchase invoices', 'فواتير شراء': 'purchase invoices',
  'امر شراء': 'purchase orders', 'أمر شراء': 'purchase orders', 'اوامر شراء': 'purchase orders', 'أوامر شراء': 'purchase orders',
  'مرتجع شراء': 'purchase refunds', 'مردود شراء': 'purchase refunds',
  'عميل': 'clients', 'عملاء': 'clients', 'مورد': 'suppliers', 'موردين': 'suppliers',
  'منتج': 'products', 'منتجات': 'products', 'صنف': 'products', 'اصناف': 'products', 'أصناف': 'products',
  'مخزن': 'stores', 'مخازن': 'stores', 'قيد': 'journals', 'قيود': 'journals', 'قيد يومية': 'journals',
  'حساب': 'journal accounts', 'حسابات': 'journal accounts', 'مركز تكلفة': 'cost centers', 'مراكز تكلفة': 'cost centers',
  'خزينة': 'treasuries', 'خزائن': 'treasuries', 'ضريبة': 'taxes', 'ضرائب': 'taxes',
  'موظف': 'staff', 'موظفين': 'staff', 'حضور': 'attendance', 'انصراف': 'attendance', 'اجازة': 'leave application', 'إجازة': 'leave application',
  'امر شغل': 'work orders', 'أمر شغل': 'work orders', 'اوامر شغل': 'work orders', 'أوامر شغل': 'work orders',
  'تقدير': 'estimates', 'عرض سعر': 'estimates', 'اشعار دائن': 'credit notes', 'إشعار دائن': 'credit notes',
  'دفعة فاتورة': 'invoice payments', 'دفعات فاتورة': 'invoice payments', 'حجز': 'bookings', 'حجوزات': 'bookings',
  'فرع': 'branches', 'فروع': 'branches', 'نقاط': 'points credits', 'تتبع وقت': 'time tracking', 'ساعات عمل': 'time tracking',
  'انشاء': 'create', 'إنشاء': 'create', 'اضافة': 'create', 'إضافة': 'create', 'سجل': 'create', 'تسجيل': 'create',
  'عدل': 'update', 'تعديل': 'update', 'حدث': 'update', 'تحديث': 'update', 'غير': 'change', 'غيّر': 'change', 'تغيير': 'change',
  'حول': 'convert', 'حوّل': 'convert', 'تحويل': 'convert', 'تفعيل': 'activate', 'تعطيل': 'deactivate',
  'قفل': 'lock', 'فتح القفل': 'unlock', 'ارسال': 'send', 'إرسال': 'send', 'اعتماد': 'approve', 'رفض': 'reject',
  'احذف': 'delete', 'حذف': 'delete', 'الغاء': 'delete', 'إلغاء': 'delete',
  'اعرض': 'get', 'عرض': 'get', 'هات': 'get', 'اجلب': 'get', 'أجلب': 'get', 'ابحث': 'search', 'بحث': 'search', 'قائمة': 'list'
}));

function normalizeArabic(text) {
  return String(text || '').normalize('NFKC').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْـ]/g, '').toLowerCase();
}

function expandAliases(input) {
  let text = normalizeArabic(input);
  for (const [from, to] of ARABIC_ALIASES.entries()) if (text.includes(normalizeArabic(from))) text += ` ${to}`;
  return text;
}

function tokenize(input) {
  return expandAliases(input).replace(/[^a-z0-9\u0600-\u06ff]+/gi, ' ').split(/\s+/).map((x) => x.trim()).filter((x) => x.length > 1);
}

function methodForAction(action) {
  const x = expandAliases(action);
  if (/\b(delete|remove|cancel)\b/.test(x)) return 'DELETE';
  if (/\b(update|edit|modify)\b/.test(x)) return 'PUT';
  if (/\b(create|add|record|post)\b/.test(x)) return 'POST';
  if (/\b(get|read|list|search|find|show)\b/.test(x)) return 'GET';
  return null;
}

function scoreOperation(op, query, opts = {}) {
  const explicitMethod = opts.method || null;
  const inferredMethod = methodForAction(opts.action || query);
  if (explicitMethod && op.method !== explicitMethod) return -1000;
  if (opts.domain && normalizeArabic(op.domain) !== normalizeArabic(opts.domain)) return -1000;
  if (opts.group && !normalizeArabic(op.group).includes(normalizeArabic(opts.group))) return -1000;

  const q = tokenize([query, opts.resource, opts.action, opts.group, opts.domain].filter(Boolean).join(' '));
  const summary = expandAliases(op.summary);
  const opPath = expandAliases(op.path);
  const group = expandAliases(`${op.group} ${op.domain} ${(op.tags || []).join(' ')}`);
  const key = expandAliases(op.key);
  const actionTokens = new Set(['create','add','record','post','update','edit','modify','change','convert','activate','deactivate','lock','unlock','send','approve','reject','delete','remove','cancel','get','read','list','search','find','show']);
  let score = 0;
  for (const token of q) {
    if (actionTokens.has(token)) {
      if (summary.includes(token) || opPath.includes(token)) score += 7;
      continue;
    }
    if (opPath.includes(token)) score += 14;
    if (summary.includes(token)) score += 9;
    if (group.includes(token)) score += 7;
    if (key.includes(token)) score += 4;
  }

  // Inferred HTTP method is only a preference. Daftra includes legacy endpoints that
  // mutate state through GET, so hard-filter only when the caller explicitly asks for a method.
  if (inferredMethod && op.method === inferredMethod) score += 6;
  if (opts.resource && expandAliases(`${op.path} ${op.group} ${op.summary}`).includes(expandAliases(opts.resource))) score += 8;
  if (opts.operation_key && op.key === opts.operation_key) score += 10000;
  if (op.deprecated) score -= 4;
  return score;
}

function searchOperations(query = '', opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit || 20), 1), 100);
  return operations.map((op) => ({ op, score: scoreOperation(op, query, opts) })).filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.op.key.localeCompare(b.op.key)).slice(0, limit).map(({ op, score }) => ({ ...op, score }));
}

function getOperation(key) {
  const op = byKey.get(key);
  if (!op) throw new Error(`Unknown Daftra operation: ${key}`);
  return op;
}

function requiredPathParams(op) {
  return [...String(op.path).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).filter((x) => x !== 'format');
}

function schemaHasProperty(schema, propertyName) {
  if (!schema || typeof schema !== 'object') return false;
  if (schema.properties && Object.prototype.hasOwnProperty.call(schema.properties, propertyName)) return true;
  return Object.values(schema.properties || {}).some((child) => schemaHasProperty(child, propertyName));
}

function primaryBodyWrapper(op) {
  const schema = op.body?.schema;
  if (!schema || schema.type !== 'object' || !schema.properties) return null;
  const entries = Object.entries(schema.properties).filter(([, value]) => value && value.type === 'object');
  if (!entries.length) return null;
  const pathToken = op.path.split('/').filter(Boolean)[0]?.replace(/[^a-z]/gi, '').toLowerCase() || '';
  const singular = pathToken.replace(/ies$/, 'y').replace(/s$/, '');
  return (entries.find(([name]) => normalizeArabic(name).includes(singular)) || entries[0])[0];
}

module.exports = { catalogSummary, operations, getOperation, searchOperations, methodForAction, requiredPathParams, schemaHasProperty, primaryBodyWrapper, expandAliases };
