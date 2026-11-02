import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pg from 'pg';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { randomBytes, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';

const { Pool } = pg;
const keyHex = process.env.MAIL_GATEWAY_ENCRYPTION_KEY || '';
const token = process.env.MAIL_GATEWAY_API_TOKEN || '';
if (!/^[0-9a-f]{64}$/i.test(keyHex) || token.length < 32 || !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL, 64-hex encryption key and API token (>=32 characters) required');
}
const key = Buffer.from(keyHex, 'hex');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '128kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));
const encrypt = (secret) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
};
const decrypt = (encoded) => {
  const raw = Buffer.from(encoded, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, raw.subarray(0,12));
  decipher.setAuthTag(raw.subarray(12,28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
};
app.get('/health', async (_req,res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); }
  catch { res.status(503).json({ status: 'database_unavailable' }); }
});
app.use((req,res,next) => {
  const header = req.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a,b)) return res.sendStatus(401);
  next();
});
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const getAccount = async id => {
  const result = await pool.query('SELECT * FROM mail_gateway.accounts WHERE id=$1 AND enabled=true',[id]);
  return result.rows[0];
};
const connect = async account => {
  const client = new ImapFlow({
    host: account.imap_host, port: account.imap_port, secure: true,
    auth: { user: account.email, pass: decrypt(account.credentials_enc) },
    logger: false
  });
  await client.connect();
  return client;
};
app.post('/accounts',wrap(async (req,res) => {
  const {email,password,imapHost='imap.migadu.com',imapPort=993,smtpHost='smtp.migadu.com',smtpPort=465} = req.body;
  if (typeof email!=='string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password!=='string' || !password || typeof imapHost!=='string' ||
      typeof smtpHost!=='string' || !Number.isInteger(imapPort) || !Number.isInteger(smtpPort)) {
    return res.status(400).json({error:'invalid_account'});
  }
  // Only Migadu endpoints allowed initially to prevent internal network access via user-supplied hosts.
  if (imapHost!=='imap.migadu.com' || smtpHost!=='smtp.migadu.com' || imapPort!==993 || smtpPort!==465)
    return res.status(400).json({error:'unsupported_mail_provider'});
  const q=await pool.query(
    'INSERT INTO mail_gateway.accounts(email,imap_host,imap_port,smtp_host,smtp_port,credentials_enc) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,enabled',
    [email.toLowerCase(),imapHost,imapPort,smtpHost,smtpPort,encrypt(password)]
  );
  res.status(201).json(q.rows[0]);
}));
app.get('/accounts',wrap(async (_req,res) => {
  const q=await pool.query('SELECT id,email,enabled,created_at FROM mail_gateway.accounts ORDER BY email');
  res.json(q.rows);
}));
const active = new Set();
async function syncAccount(account) {
  if (active.has(account.id)) return {status:'already_running'};
  active.add(account.id);
  let client;
  let lock;
  let count=0;
  try {
    client=await connect(account);
    lock=await client.getMailboxLock('INBOX');
    const validity=String(client.mailbox.uidValidity);
    const state=await pool.query('SELECT last_uid,uid_validity FROM mail_gateway.sync_state WHERE account_id=$1 AND folder=$2',[account.id,'INBOX']);
    const same=state.rows[0]?.uid_validity===validity;
    const last=same ? Number(state.rows[0].last_uid) : 0;
    // UIDVALIDITY changes invalidate prior cached UIDs for the folder.
    if (!same) {
      await pool.query('DELETE FROM mail_gateway.messages WHERE account_id=$1 AND folder=$2',[account.id,'INBOX']);
    }
    const maxUid=Number(client.mailbox.uidNext || 1)-1;
    if (maxUid>last) {
      for await (const item of client.fetch((last+1)+':'+maxUid,{uid:true,source:true,internalDate:true},{uid:true})) {
        const parsed=await simpleParser(item.source);
        const inserted=await pool.query(
          `INSERT INTO mail_gateway.messages(account_id,folder,uid,message_id,from_address,to_addresses,subject,received_at,body_text,body_html)
           VALUES($1,'INBOX',$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT(account_id,folder,uid) DO UPDATE SET subject=EXCLUDED.subject
           RETURNING id`,
          [account.id,item.uid,parsed.messageId||null,parsed.from?.text||null,
            parsed.to?.value?.map(x=>x.address)||[],parsed.subject||null,
            item.internalDate||parsed.date||null,parsed.text||null,
            typeof parsed.html==='string' ? parsed.html : null]
        );
        const messageId=inserted.rows[0].id;
        await pool.query('DELETE FROM mail_gateway.attachments WHERE message_id=$1',[messageId]);
        for(const attachment of parsed.attachments||[]) {
          const cap=Number(process.env.MAIL_MAX_ATTACHMENT_BYTES||10485760);
          if (attachment.size>cap) continue;
          await pool.query(
            'INSERT INTO mail_gateway.attachments(message_id,filename,content_type,content) VALUES($1,$2,$3,$4)',
            [messageId,attachment.filename||null,attachment.contentType||'application/octet-stream',attachment.content]
          );
        }
        count++;
      }
    }
    await pool.query(
      `INSERT INTO mail_gateway.sync_state(account_id,folder,uid_validity,last_uid,last_sync_at,last_error)
       VALUES($1,'INBOX',$2,$3,now(),NULL)
       ON CONFLICT(account_id,folder) DO UPDATE SET uid_validity=$2,last_uid=$3,last_sync_at=now(),last_error=NULL`,
      [account.id,validity,maxUid]
    );
    return {status:'ok',saved:count};
  } catch(err) {
    await pool.query(
      `INSERT INTO mail_gateway.sync_state(account_id,folder,last_error) VALUES($1,'INBOX',$2)
       ON CONFLICT(account_id,folder) DO UPDATE SET last_error=$2`,
      [account.id,String(err.message).slice(0,300)]
    ).catch(()=>{});
    throw err;
  } finally {
    if(lock) lock.release();
    if(client) await client.logout().catch(()=>{});
    active.delete(account.id);
  }
}
app.post('/accounts/:id/sync',wrap(async (req,res)=>{
  const a=await getAccount(req.params.id);
  if(!a)return res.sendStatus(404);
  res.json(await syncAccount(a));
}));
app.get('/accounts/:id/messages',wrap(async(req,res)=>{
  const a=await getAccount(req.params.id); if(!a)return res.sendStatus(404);
  const limit=Math.max(1,Math.min(100,Number(req.query.limit)||50));
  const q=await pool.query(
    'SELECT id,uid,folder,message_id,from_address,to_addresses,subject,received_at,body_text,body_html FROM mail_gateway.messages WHERE account_id=$1 ORDER BY received_at DESC NULLS LAST LIMIT $2',
    [a.id,limit]); res.json(q.rows);
}));
app.get('/accounts/:id/outbox',wrap(async(req,res)=>{
  const a=await getAccount(req.params.id);if(!a)return res.sendStatus(404);
  const q=await pool.query('SELECT id,recipient,subject,state,error,smtp_message_id,sent_at,created_at FROM mail_gateway.outbox WHERE account_id=$1 ORDER BY created_at DESC LIMIT 100',[a.id]);
  res.json(q.rows);
}));
app.post('/accounts/:id/send',wrap(async(req,res)=>{
  const a=await getAccount(req.params.id);if(!a)return res.sendStatus(404);
  const {to,subject,text,html}=req.body;
  if(typeof to!=='string'|| !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
     typeof subject!=='string'|| !subject.trim()|| typeof text!=='string' ||
     (html!==undefined&&typeof html!=='string'))return res.status(400).json({error:'invalid_message'});
  const record=await pool.query('INSERT INTO mail_gateway.outbox(account_id,recipient,subject) VALUES($1,$2,$3) RETURNING id',[a.id,to,subject]);
  const id=record.rows[0].id;
  try{
    const transport=nodemailer.createTransport({
      host:a.smtp_host,port:a.smtp_port,secure:true,auth:{user:a.email,pass:decrypt(a.credentials_enc)}
    });
    const sent=await transport.sendMail({from:a.email,to,subject,text,html});
    await pool.query("UPDATE mail_gateway.outbox SET state='sent',smtp_message_id=$2,sent_at=now() WHERE id=$1",[id,sent.messageId]);
    res.status(201).json({id,state:'sent',messageId:sent.messageId});
  }catch(err){
    await pool.query("UPDATE mail_gateway.outbox SET state='failed',error=$2 WHERE id=$1",[id,String(err.message).slice(0,300)]);
    res.status(502).json({id,state:'failed'});
  }
}));
app.use((err,_req,res,_next)=>{
  console.error('mail_gateway_error',err.code||err.name||'Error');
  res.status(err.code==='23505'?409:500).json({error:'mail_gateway_request_failed'});
});
const interval=Math.max(60_000,Number(process.env.MAIL_SYNC_INTERVAL_MS)||300000);
let running=false;
async function tick(){
  if(running)return;
  running=true;
  try{
    const q=await pool.query('SELECT * FROM mail_gateway.accounts WHERE enabled=true');
    for(const account of q.rows){
      try{await syncAccount(account);}catch(err){console.error('mail_sync_error',account.id,err.code||err.name);}
    }
  }catch(err){console.error('mail_worker_error',err.code||err.name);}
  finally{running=false;}
}
const server=app.listen(Number(process.env.MAIL_GATEWAY_PORT||8877),process.env.MAIL_GATEWAY_HOST||'127.0.0.1',()=>console.log('Alazab mail gateway started'));
const timer=setInterval(tick,interval);
timer.unref();
setImmediate(tick);
async function stop(){clearInterval(timer);server.close();await pool.end();}
process.once('SIGTERM',stop);
process.once('SIGINT',stop);
