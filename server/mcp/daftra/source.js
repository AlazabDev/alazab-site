'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const manifest = require('./catalog/manifest.json');

const SERVER_DIR = path.resolve(__dirname, '../..');
const LEGACY = path.join(__dirname, 'openapi', 'Default module.openapi.json');
const TRACKED = path.resolve(__dirname, '../../../public/az/api/daftra.openapi.json');
const TRACKED_SHA = 'dc72322180a88451307675feb4bfcf31a9ee1a1942c2619f62b69898e4b1de0c';
const EXCLUDED = [
  '/api2/reports/revenue',
  '/api2/reports/products',
  '/api2/reports/payments',
  '/api2/reports/accounts_profit_accrual',
];

function loadSource() {
  const configured = process.env.DAFTRA_OPENAPI_FILE;
  let file = configured ? path.resolve(SERVER_DIR, configured) : LEGACY;
  // A clean checkout lacks the old unversioned export. Only the pinned,
  // reviewed replacement may be used in its place.
  if (file === LEGACY && !fs.existsSync(file)) file = TRACKED;
  const raw = fs.readFileSync(file);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  const strict = process.env.NODE_ENV === 'production' ||
    process.env.DAFTRA_OPENAPI_STRICT_HASH === 'true' || file === TRACKED;
  let contract = 'development-unpinned';
  if (sha === manifest.source_sha256) contract = 'original-301';
  else if (sha === TRACKED_SHA) contract = 'tracked-compat-301';
  else if (strict) throw new Error('Daftra OpenAPI hash mismatch: ' + sha);

  const spec = JSON.parse(raw.toString('utf8'));
  if (contract === 'tracked-compat-301') {
    for (const route of EXCLUDED) {
      if (!spec.paths[route]?.get) throw new Error('Missing reviewed report path: ' + route);
      delete spec.paths[route];
    }
    const operation = spec.paths['/v2/api/multi-entity']?.post;
    if (!operation?.tags?.includes('Endpoints/Multi Entity Request')) {
      throw new Error('Missing reviewed multi-entity group');
    }
    operation.tags = operation.tags.map((tag) =>
      tag === 'Endpoints/Multi Entity Request' ? 'Endpoints/Multity entity request' : tag);
  }
  return { file, sha, spec, contract, strict: strict || contract !== 'development-unpinned' };
}

function verifySummary(summary) {
  for (const name of ['operation_count', 'path_count', 'group_count', 'domain_count']) {
    if (summary[name] !== manifest[name]) throw new Error('Daftra contract mismatch: ' + name);
  }
  for (const [method, count] of Object.entries(manifest.methods)) {
    if (summary.methods[method] !== count) throw new Error('Daftra method mismatch: ' + method);
  }
  for (const field of ['groups', 'domains']) {
    const actual = new Map(summary[field].map(({name, count}) => [name, count]));
    for (const {name, count} of manifest[field]) {
      if (actual.get(name) !== count) throw new Error('Daftra ' + field + ' mismatch: ' + name);
    }
  }
}

module.exports = { loadSource, verifySummary };
