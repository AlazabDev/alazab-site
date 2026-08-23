'use strict';

const { searchOperations, getOperation, methodForAction } = require('./registry');

function riskOf(op) {
  if (op.method === 'DELETE') return 'destructive';
  if (['POST', 'PUT', 'PATCH'].includes(op.method)) {
    if (/Finance|Accounting|Purchases|invoice|payment|expense|income|journal|credit|refund|treasur/i.test(`${op.domain} ${op.group} ${op.path}`)) return 'financial_write';
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
    method: input.method || methodForAction(input.action || intent),
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

module.exports = { plan, riskOf };
