'use strict';

const { callOperation } = require('./client');

const ENTITY_CONFIG = {
  project: { operation_key: 'daftra.raw.get.listing_model_format', path_params: { model: 'Project' }, listing: true },
  client: { operation_key: 'daftra.raw.get.clients_format', query_key: 'keywords' },
  supplier: { operation_key: 'daftra.raw.get.suppliers_format', query_key: 'name' },
  product: { operation_key: 'daftra.raw.get.products_format', query_key: 'keywords' },
  cost_center: { operation_key: 'daftra.raw.get.cost_center_list_1', query_key: 'filter[name]', per_page_key: 'per_page' },
  treasury: { operation_key: 'daftra.raw.get.treasuries_format' },
  staff: { operation_key: 'daftra.raw.get.staff_format', query_key: 'name' },
  branch: { operation_key: 'daftra.raw.get.branch_list_1', query_key: 'filter[name][contains]', per_page_key: 'per_page' },
  store: { operation_key: 'daftra.raw.get.stores_format' },
  work_order: { operation_key: 'daftra.raw.get.work_orders_format' },
};

const TYPE_ALIASES = {
  'مشروع': 'project', 'المشروع': 'project', 'project': 'project',
  'عميل': 'client', 'العميل': 'client', 'client': 'client',
  'مورد': 'supplier', 'المورد': 'supplier', 'supplier': 'supplier',
  'منتج': 'product', 'صنف': 'product', 'product': 'product',
  'مركز تكلفة': 'cost_center', 'مركز التكلفة': 'cost_center', 'cost center': 'cost_center', 'cost_center': 'cost_center',
  'خزينة': 'treasury', 'الخزينة': 'treasury', 'treasury': 'treasury',
  'موظف': 'staff', 'staff': 'staff',
  'فرع': 'branch', 'branch': 'branch',
  'مخزن': 'store', 'store': 'store',
  'أمر شغل': 'work_order', 'امر شغل': 'work_order', 'work order': 'work_order', 'work_order': 'work_order',
};

function norm(value) {
  return String(value || '').normalize('NFKC').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْـ]/g, '').toLowerCase().trim();
}

function canonicalType(type) {
  const n = norm(type);
  return TYPE_ALIASES[n] || n.replace(/\s+/g, '_');
}

function objectCandidates(value, out = []) {
  if (Array.isArray(value)) {
    for (const item of value) objectCandidates(item, out);
    return out;
  }
  if (!value || typeof value !== 'object') return out;

  const keys = Object.keys(value);
  const idKey = keys.find((k) => /^(id|ID|ref|reference)$/i.test(k));
  const nameKey = keys.find((k) => /^(name|title|business_name|first_name)$/i.test(k));
  if (idKey && nameKey) {
    const extra = {};
    for (const key of ['code', 'email', 'email_address', 'business_name', 'first_name', 'last_name', 'status']) {
      if (value[key] !== undefined) extra[key] = value[key];
    }
    out.push({ id: value[idKey], name: value[nameKey], ...extra, raw: value });
  }

  for (const child of Object.values(value)) objectCandidates(child, out);
  return out;
}

function listingCandidates(data) {
  const listing = data?.data?.Listing || data?.Listing;
  if (!listing || typeof listing !== 'object' || Array.isArray(listing)) return [];
  return Object.entries(listing).map(([id, name]) => ({ id: /^\d+$/.test(id) ? Number(id) : id, name }));
}

function scoreCandidate(candidate, search) {
  const q = norm(search);
  const hay = norm([candidate.name, candidate.business_name, candidate.first_name, candidate.last_name, candidate.code, candidate.email, candidate.email_address].filter(Boolean).join(' '));
  if (!q) return 1;
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  if (hay.includes(q)) return 60;
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.reduce((score, token) => score + (hay.includes(token) ? 10 : 0), 0);
}

function projectMap() {
  try {
    const parsed = JSON.parse(process.env.DAFTRA_PROJECT_COST_CENTER_MAP || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    throw new Error(`Invalid DAFTRA_PROJECT_COST_CENTER_MAP JSON: ${error.message}`);
  }
}

function mappedProject(name) {
  const wanted = norm(name);
  for (const [alias, value] of Object.entries(projectMap())) {
    if (norm(alias) === wanted) {
      const mapping = typeof value === 'number' ? { cost_center_id: value } : { ...(value || {}) };
      return { alias, ...mapping };
    }
  }
  return null;
}

async function resolveEntity(type, name, options = {}) {
  const entityType = canonicalType(type);
  const cfg = ENTITY_CONFIG[entityType];
  if (!cfg) {
    return { ok: false, resolved: false, reason: 'unsupported_entity_type', supported_types: Object.keys(ENTITY_CONFIG) };
  }

  const query = { ...(options.query || {}) };
  if (cfg.query_key && name) query[cfg.query_key] = name;
  if (!cfg.listing) {
    if (!query.limit && !query.per_page) query[cfg.per_page_key || 'limit'] = Math.min(Number(options.limit || 100), 100);
    if (!query.page) query.page = 1;
  }

  const result = await callOperation(cfg.operation_key, { path_params: cfg.path_params || {}, query });
  if (!result.ok) return { ok: false, resolved: false, entity_type: entityType, upstream: result };

  let candidates = cfg.listing ? listingCandidates(result.data) : objectCandidates(result.data);
  const seen = new Set();
  candidates = candidates.filter((x) => {
    const key = `${x.id}|${x.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((x) => ({ ...x, score: scoreCandidate(x, name) })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, Number(options.max_candidates || 10));

  const first = candidates[0];
  const second = candidates[1];
  const resolved = Boolean(first && first.score >= 60 && (!second || first.score - second.score >= 15));
  return {
    ok: true,
    resolved,
    entity_type: entityType,
    query: name,
    match: resolved ? first : null,
    candidates,
  };
}

async function resolveProjectAccounting(name) {
  const mapping = mappedProject(name);
  const project = await resolveEntity('project', name);
  if (!project.resolved) return { ok: false, resolved: false, stage: 'project', project, mapping };

  if (mapping?.cost_center_id) {
    return {
      ok: true,
      resolved: true,
      project,
      cost_center: { id: Number(mapping.cost_center_id), name: mapping.cost_center_name || project.match.name, source: 'explicit_map' },
      mapping,
    };
  }

  const costCenter = await resolveEntity('cost_center', mapping?.cost_center_name || project.match.name || name);
  if (!costCenter.resolved) return { ok: false, resolved: false, stage: 'cost_center', project, cost_center: costCenter, mapping };

  return { ok: true, resolved: true, project, cost_center: { ...costCenter.match, source: 'name_resolution' }, mapping };
}

module.exports = { resolveEntity, resolveProjectAccounting, canonicalType, ENTITY_CONFIG, mappedProject };
