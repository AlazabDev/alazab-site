const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const { Pool } = require('pg');

require('dotenv').config();

const router = express.Router();

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: Number(process.env.PG_PORT || 5433),
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing`);
  return value;
}

function safeName(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|#%{}$!'@+`=]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 140);
}

function extByMime(mime) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'audio/ogg': '.ogg',
  };

  return map[mime] || '.bin';
}


function verifyMetaPostSignature(req, res, next) {
  const appSecret = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '';

  if (!appSecret) {
    return res.status(503).json({ ok: false, error: 'Meta app secret is not configured' });
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ ok: false, error: 'Missing Meta signature header' });
  }

  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody
    : Buffer.from(JSON.stringify(req.body || {}), 'utf8');

  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const receivedBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ ok: false, error: 'Invalid Meta signature' });
  }

  return next();
}

function headersToJson(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    out[key] = Array.isArray(value) ? value.join(',') : String(value);
  }
  return out;
}

async function insertWebhookRecords(body, headers) {
  const client = await pool.connect();
  const inserted = [];

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      `
      INSERT INTO wa_ingest.webhook_events (
        object_type,
        event_payload,
        headers_payload,
        processing_status
      )
      VALUES ($1, $2::jsonb, $3::jsonb, 'received')
      RETURNING id
      `,
      [
        body.object || 'whatsapp',
        JSON.stringify(body),
        JSON.stringify(headersToJson(headers)),
      ]
    );

    const eventId = eventResult.rows[0].id;

    for (const entry of body.entry || []) {
      const wabaId = entry.id || process.env.WABA_ID || null;

      for (const change of entry.changes || []) {
        const value = change.value || {};
        const metadata = value.metadata || {};

        const contacts = {};
        for (const c of value.contacts || []) {
          contacts[c.wa_id] = c.profile?.name || '';
        }

        for (const msg of value.messages || []) {
          const msgType = msg.type || 'unknown';
          const ts = Number(msg.timestamp || Math.floor(Date.now() / 1000));
          const dt = new Date(ts * 1000);
          const date = dt.toISOString().slice(0, 10);

          const messageResult = await client.query(
            `
            INSERT INTO wa_ingest.messages (
              event_id,
              waba_id,
              phone_number_id,
              display_phone_number,
              message_id,
              sender_wa_id,
              sender_name,
              message_type,
              message_text,
              message_timestamp,
              raw_message
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::timestamptz,$11::jsonb
            )
            ON CONFLICT (message_id)
            DO UPDATE SET
              raw_message = EXCLUDED.raw_message,
              message_text = EXCLUDED.message_text
            RETURNING id, event_id
            `,
            [
              eventId,
              wabaId,
              metadata.phone_number_id || process.env.META_PHONE_ID || null,
              metadata.display_phone_number || null,
              msg.id,
              msg.from,
              contacts[msg.from] || null,
              msgType,
              msg.text?.body || null,
              dt.toISOString(),
              JSON.stringify(msg),
            ]
          );

          const messageDbId = messageResult.rows[0].id;
          const mediaTypes = ['image', 'document', 'video', 'audio', 'sticker'];

          if (!mediaTypes.includes(msgType)) {
            inserted.push({
              event_id: eventId,
              message_db_id: messageDbId,
              wa_message_id: msg.id,
              has_media: false,
            });
            continue;
          }

          const media = msg[msgType] || {};
          if (!media.id) continue;

          const sender = safeName(msg.from || 'unknown');

          const originalFilename = safeName(
            media.filename || `${msgType}${extByMime(media.mime_type)}`
          );

          const generatedFilename = `${date}_${sender}_${safeName(msg.id)}_${originalFilename}`;
          const relativePath = `WhatsApp/${date}/${sender}/`;

          const mediaResult = await client.query(
            `
            INSERT INTO wa_ingest.media_files (
              event_id,
              message_id,
              wa_message_id,
              wa_media_id,
              media_type,
              mime_type,
              sha256,
              caption,
              original_filename,
              generated_filename,
              sender_wa_id,
              message_timestamp,
              seafile_repo_id,
              seafile_parent_dir,
              seafile_relative_path
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::timestamptz,$13,'/',$14
            )
            ON CONFLICT (wa_media_id)
            DO UPDATE SET
              generated_filename = EXCLUDED.generated_filename,
              seafile_relative_path = EXCLUDED.seafile_relative_path,
              retry_count = wa_ingest.media_files.retry_count + 1
            RETURNING id
            `,
            [
              eventId,
              messageDbId,
              msg.id,
              media.id,
              msgType,
              media.mime_type || null,
              media.sha256 || null,
              media.caption || null,
              originalFilename,
              generatedFilename,
              msg.from,
              dt.toISOString(),
              process.env.SEAFILE_ID,
              relativePath,
            ]
          );

          inserted.push({
            event_id: eventId,
            message_db_id: messageDbId,
            media_db_id: mediaResult.rows[0].id,
            wa_message_id: msg.id,
            wa_media_id: media.id,
            media_type: msgType,
            mime_type: media.mime_type || null,
            generated_filename: generatedFilename,
            seafile_relative_path: relativePath,
            sender_wa_id: msg.from,
            has_media: true,
          });
        }
      }
    }

    await client.query(
      `
      UPDATE wa_ingest.webhook_events
      SET processing_status='queued', processed_at=now()
      WHERE id=$1
      `,
      [eventId]
    );

    await client.query('COMMIT');
    return inserted;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function uploadMediaToSeafile(mediaItem) {
  const graphVersion = process.env.GRAPH_VERSION || 'v25.0';
  const waToken = required('WA_CLOUD_TOKEN');

  const seafileBase = required('SEAFILE_BASE_URL').replace(/\/+$/, '');
  const seafileRepoId = required('SEAFILE_ID');
  const seafileToken = required('SEAFILE_TOKEN');

  try {
    await pool.query(
      `
      UPDATE wa_ingest.media_files
      SET download_status='downloading', upload_status='processing', last_error=NULL
      WHERE wa_media_id=$1
      `,
      [mediaItem.wa_media_id]
    );

    const mediaMeta = await axios.get(
      `https://graph.facebook.com/${graphVersion}/${mediaItem.wa_media_id}`,
      {
        headers: {
          Authorization: `Bearer ${waToken}`,
        },
        timeout: 30000,
      }
    );

    const downloadUrl = mediaMeta.data.url;

    const downloadResp = await axios.get(downloadUrl, {
      headers: {
        Authorization: `Bearer ${waToken}`,
      },
      responseType: 'arraybuffer',
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const buffer = Buffer.from(downloadResp.data);

    const uploadLinkResp = await axios.get(
      `${seafileBase}/api2/repos/${seafileRepoId}/upload-link/?p=/`,
      {
        headers: {
          Authorization: `Token ${seafileToken}`,
          Accept: 'application/json',
        },
        timeout: 30000,
      }
    );

    const uploadLink = String(uploadLinkResp.data).replace(/^"|"$/g, '');

    const form = new FormData();
    form.append('parent_dir', '/');
    form.append('relative_path', mediaItem.seafile_relative_path);
    form.append('replace', '1');
    form.append('file', buffer, {
      filename: mediaItem.generated_filename,
      contentType: mediaItem.mime_type || 'application/octet-stream',
    });

    const separator = uploadLink.includes('?') ? '&' : '?';

    const uploadResp = await axios.post(
      `${uploadLink}${separator}ret-json=1`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Token ${seafileToken}`,
        },
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const seafilePath = `/${mediaItem.seafile_relative_path}${mediaItem.generated_filename}`;

    await pool.query(
      `
      UPDATE wa_ingest.media_files
      SET
        download_status='downloaded',
        upload_status='uploaded',
        seafile_file_path=$1,
        seafile_upload_result=$2::jsonb,
        downloaded_at=COALESCE(downloaded_at, now()),
        uploaded_at=now(),
        last_error=NULL
      WHERE wa_media_id=$3
      `,
      [
        seafilePath,
        JSON.stringify(uploadResp.data || {}),
        mediaItem.wa_media_id,
      ]
    );

    await pool.query(
      `
      INSERT INTO wa_ingest.notification_events (
        source_table,
        source_id,
        notification_type,
        title,
        body,
        severity,
        payload
      )
      SELECT
        'wa_ingest.media_files',
        id,
        'whatsapp_media_uploaded',
        'WhatsApp media uploaded to Seafile',
        'File uploaded successfully to Seafile',
        'success',
        jsonb_build_object(
          'wa_media_id', wa_media_id,
          'seafile_file_path', seafile_file_path,
          'sender_wa_id', sender_wa_id,
          'media_type', media_type
        )
      FROM wa_ingest.media_files
      WHERE wa_media_id=$1
      `,
      [mediaItem.wa_media_id]
    );
  } catch (err) {
    const message = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;

    await pool.query(
      `
      UPDATE wa_ingest.media_files
      SET
        upload_status='failed',
        download_status=CASE
          WHEN download_status='downloading' THEN 'failed'
          ELSE download_status
        END,
        retry_count=retry_count + 1,
        last_error=$1
      WHERE wa_media_id=$2
      `,
      [message, mediaItem.wa_media_id]
    );

    await pool.query(
      `
      INSERT INTO wa_ingest.notification_events (
        source_table,
        source_id,
        notification_type,
        title,
        body,
        severity,
        payload
      )
      SELECT
        'wa_ingest.media_files',
        id,
        'whatsapp_media_upload_failed',
        'WhatsApp media upload failed',
        $1,
        'error',
        jsonb_build_object(
          'wa_media_id', wa_media_id,
          'sender_wa_id', sender_wa_id,
          'media_type', media_type,
          'error', $1
        )
      FROM wa_ingest.media_files
      WHERE wa_media_id=$2
      `,
      [message, mediaItem.wa_media_id]
    );

    console.error('WhatsApp-Seafile media upload failed:', message);
  }
}

router.get('/api/whatsapp-seafile/health', async (req, res) => {
  try {
    const db = await pool.query('SELECT now() AS now');
    res.json({
      ok: true,
      service: 'whatsapp-seafile',
      mode: 'integrated-router',
      db_time: db.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      service: 'whatsapp-seafile',
      error: err.message,
    });
  }
});

router.get('/webhook/wauf/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WA_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.status(403).json({
    ok: false,
    error: 'Invalid verify token',
  });
});

router.post(
  '/webhook/wauf/whatsapp',
  verifyMetaPostSignature,
  express.json({ limit: '50mb' }),
  async (req, res) => {
    /* eslint-disable no-useless-assignment -- value is returned after successful persistence */
    let inserted = [];

    try {
      inserted = await insertWebhookRecords(req.body, req.headers);

      res.status(200).json({
        ok: true,
        queued: inserted.length,
      });
      /* eslint-enable no-useless-assignment */

      for (const item of inserted) {
        if (item.has_media) {
          setImmediate(() => {
            uploadMediaToSeafile(item).catch((err) => {
              console.error('Background media job failed:', err.message);
            });
          });
        }
      }
    } catch (err) {
      console.error('WhatsApp-Seafile webhook failed:', err);
      return res.status(500).json({
        ok: false,
        error: err.message,
      });
    }
  }
);

module.exports = router;
