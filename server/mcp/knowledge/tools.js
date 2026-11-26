'use strict';

const fs = require('node:fs/promises');
const { realpathSync, constants } = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const TEXT_EXTENSIONS = new Set(['.md','.txt','.json','.jsonl','.html','.js','.mjs','.ts','.css','.csv','.xml','.yaml','.yml','.svg']);
const PUBLIC_BASE = 'https://alazab.com/az/';
const MAX_READ = 65536;

function createStore(rootDir, { writable = false } = {}) {
  const root = realpathSync(rootDir);
  let writeQueue = Promise.resolve();
  function segments(relative = '') {
    if (typeof relative !== 'string' || relative.length > 2048 || (relative.includes('\\') || relative.includes(String.fromCharCode(0))) || path.isAbsolute(relative)) throw Error('Invalid relative path');
    if (relative === '' || relative === '.') return [];
    const parts = relative.split('/');
    if (parts.some(p => !p || p.startsWith('.'))) throw Error('Hidden or traversal path denied');
    return parts;
  }
  function bounded(value, fallback, min, max) {
    if (value === undefined) return fallback;
    if (!Number.isSafeInteger(value) || value < min || value > max) throw Error('Invalid numeric argument');
    return value;
  }
  async function resolve(relative) {
    let full = root;
    for (const part of segments(relative)) {
      full = path.join(full, part);
      const info = await fs.lstat(full);
      if (info.isSymbolicLink()) throw Error('Symbolic links are not allowed');
    }
    const actual = await fs.realpath(full);
    if (actual !== root && !actual.startsWith(root + path.sep)) throw Error('Path outside knowledge root');
    return actual;
  }
  function url(relative) {
    return PUBLIC_BASE + segments(relative).map(encodeURIComponent).join('/');
  }
  function textual(name) { return TEXT_EXTENSIONS.has(path.extname(name).toLowerCase()); }
  async function list({ relative_path = '', offset, limit } = {}) {
    const full = await resolve(relative_path);
    const entries = (await fs.readdir(full, {withFileTypes:true}))
      .filter(e => !e.name.startsWith('.') && (e.isDirectory() || e.isFile()))
      .sort((a,b) => a.name.localeCompare(b.name));
    const start = bounded(offset,0,0,1000000);
    const count = bounded(limit,100,1,200);
    return {path:relative_path, total:entries.length,
      entries:entries.slice(start,start+count).map(e=>({name:e.name, type:e.isDirectory()?'directory':'file',
        text_readable:e.isFile()&&textual(e.name)})),
      next_offset:start+count<entries.length?start+count:null};
  }
  async function read({ relative_path, offset, limit } = {}) {
    if (!relative_path || !textual(relative_path)) throw Error('A supported text file is required');
    const full = await resolve(relative_path);
    const file = await fs.open(full, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const stat = await file.stat();
      if (!stat.isFile()) throw Error('Not a regular file');
      const start = bounded(offset,0,0,stat.size);
      const count = bounded(limit,MAX_READ,4,MAX_READ);
      const buffer = Buffer.alloc(Math.min(count+1,stat.size-start));
      const {bytesRead} = await file.read(buffer,0,buffer.length,start);
      if (bytesRead && (buffer[0]&0xc0)===0x80) throw Error('Offset is not a UTF-8 boundary');
      let end = Math.min(bytesRead,count);
      // Do not cut a multibyte character in half between paginated reads.
      if (end < bytesRead) while (end>0 && (buffer[end]&0xc0)===0x80) end--;
      return {path:relative_path,url:url(relative_path),text:buffer.subarray(0,end).toString('utf8'),
        size:stat.size,offset:start,next_offset:start+end<stat.size?start+end:null};
    } finally { await file.close(); }
  }
  async function search({query, relative_path = '', limit} = {}) {
    if (typeof query!=='string'||!query.trim()||query.length>200) throw Error('Query must contain 1–200 characters');
    const scope = await resolve(relative_path);
    if (!(await fs.stat(scope)).isDirectory()) throw Error('Search scope must be a directory');
    const needle=query.trim().toLowerCase(), max=bounded(limit,20,1,50);
    const pending=[relative_path === '.'?'':relative_path], results=[];
    let scanned=0, inspected=0, bytes=0, truncated=false;
    while(pending.length && results.length<max && inspected<4000) {
      const current=pending.pop();
      const dir=await resolve(current);
      const children=await fs.readdir(dir,{withFileTypes:true});
      for(const entry of children) {
        if(++inspected>4000){truncated=true;break;}
        if(entry.name.startsWith('.')||entry.isSymbolicLink()) continue;
        const rel=current?current+'/'+entry.name:entry.name;
        if(entry.isDirectory()){pending.push(rel);continue;}
        if(!entry.isFile()) continue;
        scanned++;
        let match=rel.toLowerCase().includes(needle);
        if(!match && textual(rel) && bytes<4*1024*1024) {
          try {
            const chunk=await read({relative_path:rel,limit:32768});
            bytes+=Buffer.byteLength(chunk.text);
            match=chunk.text.toLowerCase().includes(needle);
            if(chunk.next_offset!==null) truncated=true;
          } catch(error) { if(error.code!=='ENOENT') throw error; }
        } else if(!match && textual(rel)) truncated=true;
        if(match) results.push({id:rel,title:rel,url:url(rel)});
        if(results.length>=max){truncated=true;break;}
      }
    }
    return {results,scanned,truncated:truncated||pending.length>0};
  }
  async function context() {
    const manifest=await read({relative_path:'manifest.json'});
    let latest=null;
    try { latest=await read({relative_path:'sessions/latest.md'}); }
    catch(error){ if(error.code!=='ENOENT') throw error; }
    return {manifest,latest,session_state:latest?'available':'missing'};
  }
  async function ensureDirectory(relative) {
    const dir=path.join(root,...segments(relative));
    try { await fs.mkdir(dir); } catch(error){if(error.code!=='EEXIST')throw error;}
    const info=await fs.lstat(dir);
    if(!info.isDirectory()||info.isSymbolicLink())throw Error('Unsafe session directory');
    return resolve(relative);
  }
  async function atomicWrite(dir, name, text) {
    const temp=path.join(dir,'.session-'+randomUUID()+'.tmp');
    try {
      await fs.writeFile(temp,text,{flag:'wx',mode:0o644});
      await fs.rename(temp,path.join(dir,name));
    } finally { await fs.rm(temp,{force:true}); }
  }
  function saveSession({content,publish_safe} = {}) {
    if(!writable)throw Error('Session writing is disabled');
    if(publish_safe!==true)throw Error('Confirm that the summary is safe to publish');
    if(typeof content!=='string'||!content.trim()||Buffer.byteLength(content)>MAX_READ)throw Error('Invalid session content (maximum 64 KiB)');
    const task=writeQueue.then(async()=>{
      const sessionDir=await ensureDirectory('sessions');
      const history=await ensureDirectory('sessions/history');
      const id=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID();
      const text=content.trimEnd()+'\n';
      await atomicWrite(history,id+'.md',text);
      try { await atomicWrite(sessionDir,'latest.md',text); }
      catch(error){throw Error('History saved as '+id+'; latest update failed: '+error.code, {cause:error});}
      return {id,path:'sessions/history/'+id+'.md',latest:'sessions/latest.md',bytes:Buffer.byteLength(text)};
    });
    writeQueue=task.catch(()=>{});
    return task;
  }
  return {list,read,search,context,saveSession};
}

function createTools({ root, writable, securitySchemes }) {
  const store=createStore(root,{writable});
  const string={type:'string'};
  const integer={type:'integer',minimum:0};
  function tool(name,title,description,properties,required,handler,readOnly=true) {
    return {name,title,description,inputSchema:{type:'object',properties,required,additionalProperties:false},
      annotations:{readOnlyHint:readOnly,destructiveHint:false,idempotentHint:readOnly,openWorldHint:false},
      securitySchemes,handler};
  }
  const tools=[
    tool('knowledge_context','Load current session','Read the manifest and latest handover before starting work.',{},[],()=>store.context()),
    tool('knowledge_list','List knowledge files','List a directory within public/az with pagination.',{relative_path:string,offset:integer,limit:integer},[],args=>store.list(args)),
    tool('knowledge_read','Read knowledge text','Read a UTF-8 text file in bounded chunks. Use next_offset to continue.',{relative_path:string,offset:integer,limit:integer},['relative_path'],args=>store.read(args)),
    tool('search','Search knowledge','Bounded filename and text-prefix search; returns paths and reference URLs.',{query:string,relative_path:string,limit:integer},['query'],args=>store.search(args)),
    tool('fetch','Fetch knowledge','Retrieve a text document by exact search result ID; use knowledge_read for additional chunks.',{id:string},['id'],async({id})=>{
      const item=await store.read({relative_path:id});
      return {id,title:id,text:item.text,url:item.url,metadata:{size:item.size,next_offset:item.next_offset}};
    })
  ];
  if(writable) tools.push(tool('knowledge_save_session','Save session handover',
    'Append a new historical session and atomically update latest.md. Only publish-safe progress, decisions and verified evidence; never secrets or private records.',
    {content:string,publish_safe:{type:'boolean'}},['content','publish_safe'],args=>store.saveSession(args),false));
  return tools;
}

module.exports={createStore,createTools};
