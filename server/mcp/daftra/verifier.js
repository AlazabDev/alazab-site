'use strict';

const { operations, requiredPathParams } = require('./registry');
const { callOperation } = require('./client');

function findId(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
  if (typeof value !== 'object') return null;
  for (const key of ['id', 'ID', 'ref', 'reference']) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== '') return value[key];
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const id = findId(item, depth + 1);
      if (id !== null) return id;
    }
  } else {
    for (const child of Object.values(value)) {
      const id = findId(child, depth + 1);
      if (id !== null) return id;
    }
  }
  return null;
}

function verifierFor(op) {
  return operations
    .filter((x) => x.method === 'GET' && x.group === op.group)
    .map((x) => ({ op: x, params: requiredPathParams(x) }))
    .filter((x) => x.params.length === 1 && /\{[^}]*id[^}]*\}/i.test(x.op.path))
    .sort((a, b) => {
      const as = /single|one|detail/i.test(a.op.summary) ? 10 : 0;
      const bs = /single|one|detail/i.test(b.op.summary) ? 10 : 0;
      return bs - as || a.op.path.length - b.op.path.length;
    })[0] || null;
}

async function verifyWrite(op, writeResult, payload = {}) {
  if (!writeResult?.ok || !['POST', 'PUT', 'PATCH'].includes(op.method)) {
    return { attempted: false, verified: false, reason: 'not_applicable' };
  }
  const verify = verifierFor(op);
  if (!verify) return { attempted: false, verified: false, reason: 'no_readback_operation' };

  let id = findId(writeResult.data);
  if (id === null) {
    const source = payload.path_params || payload.pathParams || {};
    id = source[verify.params[0]] ?? source.id ?? source.ID ?? null;
  }
  if (id === null) return { attempted: false, verified: false, reason: 'no_record_id' };

  try {
    const readback = await callOperation(verify.op.key, { path_params: { [verify.params[0]]: id } });
    return {
      attempted: true,
      verified: Boolean(readback.ok),
      record_id: id,
      operation_key: verify.op.key,
      status: readback.status,
      data: readback.data,
    };
  } catch (error) {
    return { attempted: true, verified: false, record_id: id, operation_key: verify.op.key, error: error.message };
  }
}

module.exports = { verifyWrite, findId };
