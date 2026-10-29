import { spawn } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';

test('Meta MCP starts with centralized environment and refuses unauthenticated traffic', async () => {
  const port = 28187;
  const child = spawn(process.execPath, ['mcp/meta/src/server.mjs'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      META_MCP_PORT: String(port),
      META_MCP_HOST: '127.0.0.1',
      META_MCP_ADMIN_KEY: 'test-admin-only',
      META_MCP_FOUNDRY_KEY: 'test-foundry-only',
      META_ACCESS_TOKEN: '',
      META_ALLOWED_BUSINESS_IDS: '',
      META_ALLOWED_WABA_IDS: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    let ready = false;
    for (let i = 0; i < 30; i++) {
      if (child.exitCode !== null) throw new Error('Meta MCP exited before listening: ' + child.exitCode);
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/health');
        const json = await response.json();
        assert.equal(response.status, 200);
        assert.equal(json.alive, true);
        assert.equal(json.ready, false);
        ready = true;
        break;
      } catch { await sleep(100); }
    }
    assert.equal(ready, true);
    const unauthorized = await fetch('http://127.0.0.1:' + port + '/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(unauthorized.status, 401);
    const unconfigured = await fetch('http://127.0.0.1:' + port + '/mcp', { method: 'POST', headers: { Authorization: 'Bearer test-admin-only', 'content-type': 'application/json' }, body: '{}' });
    assert.equal(unconfigured.status, 503);
    const readiness = await fetch('http://127.0.0.1:' + port + '/ready');
    assert.equal(readiness.status, 503);
  } finally { child.kill('SIGTERM'); }
});
