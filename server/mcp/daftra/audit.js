'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const auditFile = process.env.DAFTRA_MCP_AUDIT_FILE || path.join(__dirname, '..', '..', 'logs', 'daftra-mcp-audit.jsonl');

function redact(value, key = '') {
  if (/token|secret|password|authorization|apikey/i.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((x) => redact(x));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redact(v, k)]));
  }
  return value;
}

function append(event) {
  fs.mkdirSync(path.dirname(auditFile), { recursive: true });
  const row = {
    audit_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...redact(event),
  };
  fs.appendFileSync(auditFile, JSON.stringify(row) + '\n', { encoding: 'utf8', mode: 0o600 });
  return row.audit_id;
}

module.exports = { append };
