'use strict';

function typeMatches(value, type) {
  if (!type) return true;
  if (value === null) return false;
  if (type === 'object') return typeof value === 'object' && !Array.isArray(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'string') return typeof value === 'string';
  if (type === 'null') return value === null;
  return true;
}

function validate(value, schema, location = 'body', errors = []) {
  if (!schema || typeof schema !== 'object') return errors;
  if (value === null && schema.nullable) return errors;

  if (schema.allOf) for (const child of schema.allOf) validate(value, child, location, errors);
  if (schema.oneOf && !schema.oneOf.some((child) => validate(value, child, location, []).length === 0)) {
    errors.push(`${location}: value does not match any oneOf schema`);
    return errors;
  }
  if (schema.anyOf && !schema.anyOf.some((child) => validate(value, child, location, []).length === 0)) {
    errors.push(`${location}: value does not match any anyOf schema`);
    return errors;
  }

  if (value === undefined) {
    if (schema.required === true) errors.push(`${location}: required value is missing`);
    return errors;
  }

  if (schema.type && !typeMatches(value, schema.type)) {
    errors.push(`${location}: expected ${schema.type}`);
    return errors;
  }

  if (schema.enum && !schema.enum.includes(value)) errors.push(`${location}: value must be one of ${schema.enum.join(', ')}`);

  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${location}: minimum length is ${schema.minLength}`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${location}: maximum length is ${schema.maxLength}`);
    if (schema.pattern) {
      try { if (!(new RegExp(schema.pattern)).test(value)) errors.push(`${location}: does not match required pattern`); } catch { /* invalid source regex: defer to upstream */ }
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${location}: minimum is ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${location}: maximum is ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${location}: requires at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${location}: allows at most ${schema.maxItems} items`);
    if (schema.items) value.forEach((item, index) => validate(item, schema.items, `${location}[${index}]`, errors));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const name of schema.required || []) {
      if (value[name] === undefined || value[name] === null || value[name] === '') errors.push(`${location}.${name}: required field is missing`);
    }
    for (const [name, child] of Object.entries(schema.properties || {})) {
      if (value[name] !== undefined) validate(value[name], child, `${location}.${name}`, errors);
    }
  }

  return errors;
}

function validateOperationBody(op, body) {
  if (body === undefined || body === null) {
    return op.body?.required ? ['body: request body is required'] : [];
  }
  return validate(body, op.body?.schema, 'body', []);
}

module.exports = { validate, validateOperationBody };
