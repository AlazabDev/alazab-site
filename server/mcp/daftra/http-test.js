'use strict';
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => listener.once('error', reject).listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  return port;
}

async function main() {
  const port = await freePort();
  const base = 'http://127.0.0.1:' + port;
  const child = spawn(process.execPath, [path.join(__dirname, 'bootstrap.js')], {
    env: {...process.env, NODE_ENV:'production', MCP_DAFTRA_PORT:String(port),
      MCP_DAFTRA_HOST:'127.0.0.1', MCP_DAFTRA_API_KEY:'ci-only-not-a-production-key',
      DAFTRA_OPENAPI_FILE:'', DAFTRA_OPENAPI_STRICT_HASH:'true'},
    stdio:['ignore','ignore','pipe']
  });
  let errors = '';
  child.stderr.on('data', chunk => { errors += chunk.toString(); });
  let session;
  const headers = { authorization:'Bearer ci-only-not-a-production-key',
    'content-type':'application/json', accept:'application/json, text/event-stream' };
  async function rpc(method, params, id) {
    const response = await fetch(base + '/mcp', {
      method:'POST', headers:{...headers, ...(session ? {'Mcp-Session-Id':session} : {}),
        ...(method === 'initialize' ? {} : {'MCP-Protocol-Version':'2025-03-26'})},
      body:JSON.stringify({jsonrpc:'2.0', method, params, ...(id === undefined ? {} : {id})}),
      signal:AbortSignal.timeout(10000)
    });
    session = response.headers.get('mcp-session-id') || session;
    const body = await response.text();
    assert.ok(response.ok, 'HTTP ' + response.status + ': ' + body);
    if (!body) return null;
    const data = response.headers.get('content-type')?.includes('text/event-stream')
      ? body.split('\n').find(line => line.startsWith('data:'))?.slice(5).trim() : body;
    return JSON.parse(data);
  }
  try {
    let health;
    for(let i=0;i<80;i++) {
      if(child.exitCode !== null) throw Error('Server exited: ' + errors);
      try {
        const res=await fetch(base+'/healthz',{signal:AbortSignal.timeout(1000)});
        if(res.ok){health=await res.json();break;}
      } catch { /* wait for bind */ }
      await new Promise(r=>setTimeout(r,125));
    }
    assert.equal(health?.operation_count,301);
    const unauthorized = await fetch(base+'/mcp',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});
    assert.equal(unauthorized.status,401);
    const init = await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},
      clientInfo:{name:'ci',version:'1'}},1);
    assert.ok(init?.result?.capabilities?.tools);
    await rpc('notifications/initialized',{},undefined);
    const tools = await rpc('tools/list',{},2);
    assert.ok(tools?.result?.tools?.some(t=>t.name==='daftra_execute'));
    const summary=await rpc('tools/call',{name:'daftra_catalog_summary',arguments:{}},3);
    assert.equal(JSON.parse(summary.result.content[0].text).operation_count,301);
    console.log('Daftra HTTP MCP smoke test passed (no business writes)');
  } finally {
    child.kill('SIGTERM');
    if (child.exitCode === null) await new Promise(resolve=>{
      child.once('exit',resolve); setTimeout(()=>{child.kill('SIGKILL');resolve();},5500).unref();
    });
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
