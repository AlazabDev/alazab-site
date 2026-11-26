import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('discovery manifests match and publish only reviewed HTTPS artifacts',()=>{
  const ard=JSON.parse(read('public/.well-known/ard.json'));
  assert.deepEqual(ard,JSON.parse(read('public/.well-known/ai-catalog.json')));
  assert.equal(ard.specVersion,'1.0');
  assert.ok(ard.entries.length);
  for(const entry of ard.entries){
    assert.match(entry.identifier,/^urn:air:alazab\.com:/);
    assert.ok(entry.displayName);
    assert.equal(entry.type,'application/mcp-server-card+json');
    assert.equal(new URL(entry.url).origin,'https://alazab.com');
    assert.ok(entry.representativeQueries.length>=2 && entry.representativeQueries.length<=5);
    const card=JSON.parse(read('public'+new URL(entry.url).pathname));
    assert.equal(card.authentication.required,true);
  }
});
test('canonical discovery links and nginx allowlist',()=>{
  assert.match(read('public/robots.txt'),/Sitemap: https:\/\/alazab\.com\/sitemap\.xml/);
  assert.match(read('public/robots.txt'),/Agentmap: https:\/\/alazab\.com\/\.well-known\/ard\.json/);
  assert.doesNotMatch(read('public/sitemap.xml'),/azab\.services/);
  assert.match(read('index.html'),/rel="ard"/);
  assert.match(read('server/config/alazab.com'),/ard\|ai-catalog\|mcp-server-card/);
});
test('header does not nest buttons inside links',()=>{
  assert.doesNotMatch(read('src/components/Header.tsx'),/<Link\b[^>]*>\s*<Button\b/);
  assert.match(read('src/components/Header.tsx'),/SheetTitle/);
});
