'use strict';
const { test }=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createStore,createTools}=require('./tools');

test('knowledge filesystem boundaries, paging, search and session continuity',async()=>{
  const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'az-knowledge-'));
  try {
    const root=path.join(tmp,'az');
    await fs.mkdir(root);
    await fs.writeFile(path.join(root,'manifest.json'),'{"portal":"test"}');
    await fs.mkdir(path.join(root,'docs'));
    await fs.writeFile(path.join(root,'docs','arabic.md'),'abcdefعربي tail');
    await fs.writeFile(path.join(tmp,'secret.txt'),'not visible');
    await fs.symlink(path.join(tmp,'secret.txt'),path.join(root,'link.txt'));
    await fs.writeFile(path.join(root,'.env'),'not visible');
    const store=createStore(root);
    assert.equal((await store.context()).session_state,'missing');
    assert.deepEqual((await store.list()).entries.map(x=>x.name),['docs','manifest.json']);
    await assert.rejects(store.read({relative_path:'../secret.txt'}));
    await assert.rejects(store.read({relative_path:'link.txt'}));
    await assert.rejects(store.list({relative_path:'/'}));
    const chunk=await store.read({relative_path:'docs/arabic.md',limit:7});
    assert.equal(chunk.text,'abcdef');
    assert.equal(chunk.next_offset,6);
    assert.equal((await store.read({relative_path:'docs/arabic.md',offset:6})).text,'عربي tail');
    assert.equal((await store.search({query:'عربي'})).results[0].id,'docs/arabic.md');
    assert.throws(()=>store.saveSession({content:'test',publish_safe:true}));
    const writable=createStore(root,{writable:true});
    assert.throws(()=>writable.saveSession({content:'test',publish_safe:false}));
    const result=await writable.saveSession({content:'# Session\nVerified progress',publish_safe:true});
    assert.equal((await writable.context()).latest.text,'# Session\nVerified progress\n');
    assert.equal((await writable.read({relative_path:result.path})).text,'# Session\nVerified progress\n');
    assert.equal(createTools({root,writable:false,securitySchemes:[]}).length,5);
    assert.equal(createTools({root,writable:true,securitySchemes:[]}).length,6);
  } finally {await fs.rm(tmp,{recursive:true,force:true});}
});
