import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createDecipheriv } from 'node:crypto';
import crypto from 'node:crypto';

const source = readFileSync(new URL('../server/routes/whatsapp-embedded-signup.js', import.meta.url), 'utf8');
function fixture({ missingConfig = false, phoneMatches = true, databaseReady = true } = {}) {
  let handler;
  const calls = [];
  const queries = [];
  const key = 'ab'.repeat(32);
  const context = {
    require(name) {
      if (name === 'express') return { Router: () => ({ post: (_path, fn) => { handler = fn; } }) };
      if (name === 'crypto') return crypto;
      if (name === '../db') return { query: async (...args) => {
        queries.push(args);
        if (!databaseReady) throw new Error('No table');
        return { rows: [] };
      } };
      throw new Error(name);
    },
    process: { env: missingConfig ? {} : { META_APP_SECRET: 'secret', META_TOKEN_ENCRYPTION_KEY: key } },
    Buffer, URLSearchParams, AbortSignal, Set, module: { exports: {} },
    fetch: async (url, options) => {
      calls.push({ url, options });
      return { ok: true, json: async () => url.includes('oauth/access_token')
        ? { access_token: 'private-test-token' }
        : { data: [{ id: phoneMatches ? '456' : '789', display_phone_number: '+201146397010' }] } };
    },
  };
  vm.runInNewContext(source, context);
  const response = { statusCode: 200, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
  return { handler, response, calls, queries, key };
}
const body = { code: 'one-use-code', waba_id: '123', phone_number_id: '456' };
test('exchanges server-side, verifies WABA membership and stores an encrypted token', async () => {
  const f = fixture();
  await f.handler({ body }, f.response);
  assert.equal(f.response.statusCode, 200);
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].options.body.get('code'), body.code);
  const stored = f.queries[1][1][3];
  assert.ok(!stored.includes('private-test-token'));
  const [iv, tag, encrypted] = stored.split('.').map((value) => Buffer.from(value, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(f.key, 'hex'), iv);
  decipher.setAuthTag(tag);
  assert.equal(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(), 'private-test-token');
  assert.ok(!JSON.stringify(f.response.body).includes('token'));
});
test('rejects mismatched phone without storing token', async () => {
  const f = fixture({ phoneMatches: false });
  await f.handler({ body }, f.response);
  assert.equal(f.response.statusCode, 400);
  assert.equal(f.queries.length, 1);
});
test('missing configuration or migration does not consume the authorization code', async () => {
  for (const options of [{ missingConfig: true }, { databaseReady: false }]) {
    const f = fixture(options);
    await f.handler({ body }, f.response);
    assert.equal(f.response.statusCode, 503);
    assert.equal(f.calls.length, 0);
  }
});
test('rejects malformed identifiers before external requests', async () => {
  const f = fixture();
  await f.handler({ body: { ...body, waba_id: '../me' } }, f.response);
  assert.equal(f.response.statusCode, 400);
  assert.equal(f.calls.length, 0);
});
