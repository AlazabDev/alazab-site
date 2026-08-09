'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = 4115;
const BASE = `http://127.0.0.1:${PORT}`;
const SERVER = path.join(__dirname, 'server.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForHealth() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE}/health`);
      if (response.ok) return response.json();
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw lastError || new Error('MCP health endpoint did not become ready');
}

async function rpc(body, headers = {}) {
  const response = await fetch(`${BASE}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  return {
    status: response.status,
    json: text ? JSON.parse(text) : null,
  };
}

async function main() {
  const child = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      OPENAI_MCP_AUTH_MODE: 'none',
      OPENAI_MCP_HOST: '127.0.0.1',
      OPENAI_MCP_PORT: String(PORT),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  try {
    const health = await waitForHealth();
    assert(health.ok === true, 'health.ok must be true');
    assert(health.tools === 7, `expected 7 tools, got ${health.tools}`);

    const init = await rpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'alazab-ci', version: '1.0.0' },
      },
    });

    assert(init.status === 200, `initialize HTTP ${init.status}`);
    assert(init.json?.result?.protocolVersion === '2025-11-25', 'protocol negotiation failed');
    assert(init.json?.result?.capabilities?.tools, 'tools capability missing');

    const initialized = await rpc(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { 'MCP-Protocol-Version': '2025-11-25' }
    );
    assert(initialized.status === 202, `initialized notification HTTP ${initialized.status}`);

    const list = await rpc(
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      { 'MCP-Protocol-Version': '2025-11-25' }
    );

    assert(list.status === 200, `tools/list HTTP ${list.status}`);
    const tools = list.json?.result?.tools;
    assert(Array.isArray(tools), 'tools/list did not return an array');

    const names = tools.map((tool) => tool.name).sort();
    const expected = [
      'maintenance_get_status',
      'maintenance_catalog',
      'daftra_list_products',
      'daftra_list_clients',
      'daftra_list_invoices',
      'daftra_list_expenses',
      'daftra_list_work_orders',
    ].sort();

    assert(JSON.stringify(names) === JSON.stringify(expected), `unexpected tools: ${names.join(', ')}`);
    assert(
      tools.every(
        (tool) =>
          tool.annotations?.readOnlyHint === true &&
          Array.isArray(tool.securitySchemes) &&
          tool.securitySchemes.some((scheme) => scheme.type === 'oauth2')
      ),
      'every v0.1 tool must be read-only and OAuth-declared'
    );

    const getResponse = await fetch(`${BASE}/mcp`, {
      headers: { accept: 'text/event-stream' },
    });
    assert(getResponse.status === 405, `GET /mcp must return 405 when SSE is not offered; got ${getResponse.status}`);

    console.log(`OpenAI MCP smoke test passed: ${names.length} read-only tools`);
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => {
      child.once('exit', resolve);
      setTimeout(resolve, 2000);
    });
    if (stderr) process.stderr.write(stderr);
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
