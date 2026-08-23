'use strict';

const { searchOperations, getOperation } = require('./registry');

const FINANCIAL_RE = /Finance|Accounting|Purchases|invoice|payment|expense|income|journal|credit|refund|treasur|purchase/i;
const MUTATING_GET_RE = /(?:^|[\s/_-])(update|change|convert|trigger|send|activate|deactivate|lock|unlock|assign|set|approve|reject)(?:[\s/_-]|$)/i;

function isStateChanging(op) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(op.method)) return true;
  if (op.method !== 'GET') return false;
  return MUTATING_GET_RE.test(`${op.summary || ''} ${op.path || ''}`);
}

function riskOf(op) {
  if (op.method === 'DELETE') return 'destructive';
  if (isStateChanging(op)) {
    if (FINANCIAL_RE.test(`${op.domain} ${op.group} ${op.path} ${op.summary}`)) return 'financial_write';
    return 'write';
  }
  return 'read';
}

function plan(input = {}) {
  if (input.operation_key) {
    const op = getOperation(input.operation_key);
    return { resolved: true, confidence: 1, risk: riskOf(op), operation: op, candidates: [{ ...op, score: 10000 }] };
  }

  const intent = input.intent || [input.action, input.resource, input.description].filter(Boolean).join(' ');
  const candidates = searchOperations(intent, {
    action: input.action,
    resource: input.resource,
    group: input.group,
    domain: input.domain,
    // Only an explicitly supplied HTTP method is a hard constraint. Daftra contains
    // legacy state-changing GET endpoints, so intent inference must not discard them.
    method: input.method,
    limit: 8,
  });

  if (!candidates.length) return { resolved: false, confidence: 0, reason: 'no_matching_operation', candidates: [] };
  const first = candidates[0];
  const second = candidates[1];
  const margin = second ? first.score - second.score : first.score;
  const confidence = Math.min(0.99, Math.max(0.25, 0.55 + margin * 0.04 + first.score * 0.01));
  const resolved = first.score >= 10 && (margin >= 3 || !second);

  return {
    resolved,
    confidence: Number(confidence.toFixed(2)),
    reason: resolved ? 'matched' : 'ambiguous',
    risk: riskOf(first),
    operation: first,
    candidates,
  };
}

module.exports = { plan, riskOf, isStateChanging };
