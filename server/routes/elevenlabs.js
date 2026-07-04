const express = require('express');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const { loadAppSecrets, getSupabaseStatus, storeWebhookEvent } = require('../supabase');

const router = express.Router();
const webhookEvents = [];

function getAdminAccessKey() {
  return process.env.ELEVENLABS_ADMIN_API_KEY || process.env.ADMIN_API_KEY || '';
}

function getChatbotAccessKey() {
  return process.env.ELEVENLABS_CHATBOT_API_KEY || process.env.ELEVENLABS_ADMIN_API_KEY || process.env.ADMIN_API_KEY || '';
}

function requireKey(expectedKeyGetter, label) {
  return function requireConfiguredKey(req, res, next) {
    const configuredKey = expectedKeyGetter();
    if (!configuredKey) {
      return res.status(503).json({ error: `${label} key is not configured`, requestId: req.requestId });
    }

    const provided =
      req.headers['x-api-key'] ||
      req.headers['x-admin-key'] ||
      req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
      '';

    if (!provided || provided !== configuredKey) {
      return res.status(401).json({ error: 'Unauthorized', requestId: req.requestId });
    }

    return next();
  };
}

const requireAdminAccess = requireKey(getAdminAccessKey, 'ElevenLabs admin');
const requireChatbotAccess = requireKey(getChatbotAccessKey, 'ElevenLabs chatbot');

const MAX_EVENTS = 200;
let warnedAboutMissingSecret = false;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function maskConfigured(value) {
  return value ? '***configured***' : 'NOT SET';
}

function storeEvent(event) {
  webhookEvents.unshift(event);
  if (webhookEvents.length > MAX_EVENTS) {
    webhookEvents.pop();
  }
}

async function getElevenLabsConfig() {
  const envConfig = {
    apiKey: normalizeString(process.env.ELEVENLABS_API_KEY),
    defaultAgentId: normalizeString(process.env.ELEVENLABS_AGENT_ID),
    webhookSecret: normalizeString(process.env.ELEVENLABS_WEBHOOK_SECRET),
    branchId: normalizeString(process.env.ELEVENLABS_BRANCH_ID),
    environment: normalizeString(process.env.ELEVENLABS_ENVIRONMENT),
    allowedAgentIds: normalizeString(process.env.ELEVENLABS_ALLOWED_AGENT_IDS),
  };

  const missingKeys = [];
  if (!envConfig.apiKey) missingKeys.push('ELEVENLABS_API_KEY');
  if (!envConfig.defaultAgentId) missingKeys.push('ELEVENLABS_AGENT_ID');
  if (!envConfig.webhookSecret) missingKeys.push('ELEVENLABS_WEBHOOK_SECRET');
  if (!envConfig.branchId) missingKeys.push('ELEVENLABS_BRANCH_ID');
  if (!envConfig.environment) missingKeys.push('ELEVENLABS_ENVIRONMENT');
  if (!envConfig.allowedAgentIds) missingKeys.push('ELEVENLABS_ALLOWED_AGENT_IDS');

  let secretMap = {};
  if (missingKeys.length > 0) {
    try {
      secretMap = await loadAppSecrets(missingKeys);
    } catch (error) {
      console.warn('[ELEVENLABS][SUPABASE]', error.message);
    }
  }

  const apiKey = envConfig.apiKey || normalizeString(secretMap.ELEVENLABS_API_KEY);
  const defaultAgentId = envConfig.defaultAgentId || normalizeString(secretMap.ELEVENLABS_AGENT_ID);
  const webhookSecret =
    envConfig.webhookSecret || normalizeString(secretMap.ELEVENLABS_WEBHOOK_SECRET);
  const branchId = envConfig.branchId || normalizeString(secretMap.ELEVENLABS_BRANCH_ID);
  const environment = envConfig.environment || normalizeString(secretMap.ELEVENLABS_ENVIRONMENT);
  const allowedAgentIdsRaw =
    envConfig.allowedAgentIds || normalizeString(secretMap.ELEVENLABS_ALLOWED_AGENT_IDS);
  const allowedAgentIds = Array.from(
    new Set(
      [
        defaultAgentId,
        ...allowedAgentIdsRaw
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      ].filter(Boolean)
    )
  );

  const supabaseStatus = await getSupabaseStatus();

  return {
    apiKey,
    defaultAgentId,
    webhookSecret,
    branchId,
    environment,
    allowedAgentIds,
    supabaseConnected: supabaseStatus.connected,
    supabaseError: supabaseStatus.error,
  };
}

function createClient(apiKey) {
  return new ElevenLabsClient({
    apiKey: normalizeString(apiKey) || 'missing-api-key',
  });
}

function ensureApiKey(config) {
  if (!config.apiKey) {
    const error = new Error('ELEVENLABS_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }
}

function resolveAgentId(requestedAgentId, config) {
  const agentId = normalizeString(requestedAgentId) || config.defaultAgentId;

  if (!agentId) {
    const error = new Error('Missing ElevenLabs agent ID');
    error.statusCode = 400;
    throw error;
  }

  if (config.allowedAgentIds.length > 0 && !config.allowedAgentIds.includes(agentId)) {
    const error = new Error('Requested ElevenLabs agent is not allowed');
    error.statusCode = 403;
    throw error;
  }

  return agentId;
}

function toIsoTimestamp(unixSeconds) {
  if (!unixSeconds || Number.isNaN(Number(unixSeconds))) {
    return new Date().toISOString();
  }

  return new Date(Number(unixSeconds) * 1000).toISOString();
}

function sanitizeWebhookPayload(payload, verified, requestId) {
  const data = payload?.data || {};
  const audioBase64 = typeof data.full_audio === 'string' ? data.full_audio : '';
  const transcriptTurns = Array.isArray(data.transcript) ? data.transcript.length : 0;

  return {
    type: payload?.type || 'unknown',
    verified,
    requestId,
    timestamp: toIsoTimestamp(payload?.event_timestamp),
    agentId: data.agent_id || null,
    conversationId: data.conversation_id || null,
    status: data.status || null,
    userId: data.user_id || null,
    transcriptTurns,
    hasAudio: Boolean(data.has_audio || audioBase64),
    hasUserAudio: Boolean(data.has_user_audio),
    hasResponseAudio: Boolean(data.has_response_audio),
    audioBase64Bytes: audioBase64 ? Buffer.byteLength(audioBase64, 'utf8') : 0,
    failureReason: data.failure_reason || null,
    metadataType: data.metadata?.type || null,
    summary: data.analysis?.transcript_summary || null,
  };
}

async function persistWebhookToSupabase(payload, rawBody, signature, requestId) {
  try {
    const result = await storeWebhookEvent({
      source: 'elevenlabs',
      payload,
      rawBody,
      signature,
    });

    if (result.stored) {
      console.log(`[ELEVENLABS][SUPABASE][${requestId}] Stored webhook event ${result.eventHash}`);
    }
  } catch (error) {
    console.warn(`[ELEVENLABS][SUPABASE][${requestId}] ${error.message}`);
  }
}

async function parseWebhookPayload(req, config) {
  const rawBody = Buffer.isBuffer(req.rawBody)
    ? req.rawBody.toString('utf8')
    : JSON.stringify(req.body || {});

  if (!rawBody) {
    const error = new Error('Missing webhook body');
    error.statusCode = 400;
    throw error;
  }

  if (!config.webhookSecret) {
    if (!warnedAboutMissingSecret) {
      console.warn(
        '[ELEVENLABS][WARN] ELEVENLABS_WEBHOOK_SECRET missing, webhook signature validation is disabled.'
      );
      warnedAboutMissingSecret = true;
    }

    return {
      verified: false,
      rawBody,
      payload: JSON.parse(rawBody),
    };
  }

  const signatureHeader = req.get('ElevenLabs-Signature');
  const client = createClient(config.apiKey);
  const payload = await client.webhooks.constructEvent(
    rawBody,
    signatureHeader,
    config.webhookSecret
  );

  return {
    verified: true,
    rawBody,
    payload,
  };
}

router.get('/health', async (req, res) => {
  const config = await getElevenLabsConfig();

  res.json({
    ok: true,
    service: 'elevenlabs',
    apiKeyConfigured: Boolean(config.apiKey),
    defaultAgentConfigured: Boolean(config.defaultAgentId),
    webhookSecretConfigured: Boolean(config.webhookSecret),
    supabaseConnected: config.supabaseConnected,
    supabaseError: config.supabaseError,
    eventsBuffered: webhookEvents.length,
    timestamp: new Date().toISOString(),
  });
});

router.get('/config', requireAdminAccess, async (req, res) => {
  const config = await getElevenLabsConfig();

  res.json({
    elevenlabs: {
      apiKey: maskConfigured(config.apiKey),
      defaultAgentId: config.defaultAgentId || null,
      allowedAgentIds: config.allowedAgentIds,
      branchId: config.branchId || null,
      environment: config.environment || null,
      webhookSecret: maskConfigured(config.webhookSecret),
      webhookUrl: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/elevenlabs/webhook`,
      conversationTokenEndpoint: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/elevenlabs/conversation-token`,
      signedUrlEndpoint: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/elevenlabs/signed-url`,
      supabaseConnected: config.supabaseConnected,
      supabaseError: config.supabaseError,
      secretsSource: 'env+app_secrets',
    },
  });
});

router.get('/events', requireAdminAccess, (req, res) => {
  const { limit = 50, type, agentId } = req.query;
  let events = webhookEvents;

  if (type) {
    events = events.filter((event) => event.type === type);
  }

  if (agentId) {
    events = events.filter((event) => event.agentId === agentId);
  }

  res.json({
    total: events.length,
    events: events.slice(0, Number(limit)),
  });
});

router.delete('/events', requireAdminAccess, (req, res) => {
  webhookEvents.length = 0;
  res.json({ success: true });
});

router.post('/conversation-token', requireChatbotAccess, async (req, res) => {
  try {
    const config = await getElevenLabsConfig();
    ensureApiKey(config);

    const requestedAgentId = req.body?.agentId;
    const agentId = resolveAgentId(requestedAgentId, config);
    const branchId = normalizeString(req.body?.branchId) || config.branchId;
    const environment = normalizeString(req.body?.environment) || config.environment;
    const participantName = normalizeString(req.body?.participantName);

    const client = createClient(config.apiKey);
    const response = await client.conversationalAi.conversations.getWebrtcToken({
      agentId,
      ...(participantName ? { participantName } : {}),
      ...(branchId ? { branchId } : {}),
      ...(environment ? { environment } : {}),
    });

    const token = response?.token;
    if (!token) {
      throw new Error('ElevenLabs did not return a conversation token');
    }

    return res.json({
      token,
      agent_id: agentId,
      agentId,
      connectionType: 'webrtc',
    });
  } catch (error) {
    console.error(`[ELEVENLABS][TOKEN][${req.requestId}]`, error.message);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to create ElevenLabs conversation token',
      requestId: req.requestId,
    });
  }
});

router.post('/signed-url', requireChatbotAccess, async (req, res) => {
  try {
    const config = await getElevenLabsConfig();
    ensureApiKey(config);

    const requestedAgentId = req.body?.agentId;
    const includeConversationId = req.body?.includeConversationId !== false;
    const agentId = resolveAgentId(requestedAgentId, config);
    const branchId = normalizeString(req.body?.branchId) || config.branchId;
    const environment = normalizeString(req.body?.environment) || config.environment;

    const client = createClient(config.apiKey);
    const response = await client.conversationalAi.conversations.getSignedUrl({
      agentId,
      includeConversationId,
      ...(branchId ? { branchId } : {}),
      ...(environment ? { environment } : {}),
    });

    const signedUrl = response?.signedUrl || response?.signed_url;
    const conversationId = response?.conversationId || response?.conversation_id || null;

    if (!signedUrl) {
      throw new Error('ElevenLabs did not return a signed URL');
    }

    storeEvent({
      type: 'signed_url_issued',
      verified: true,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      agentId,
      conversationId,
      status: 'issued',
    });

    return res.json({
      signed_url: signedUrl,
      signedUrl,
      conversation_id: conversationId,
      conversationId,
      agent_id: agentId,
      agentId,
    });
  } catch (error) {
    console.error(`[ELEVENLABS][SIGNED_URL][${req.requestId}]`, error.message);
    return res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to create ElevenLabs signed URL',
      requestId: req.requestId,
    });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const config = await getElevenLabsConfig();
    const { verified, payload, rawBody } = await parseWebhookPayload(req, config);
    const signatureHeader = req.get('ElevenLabs-Signature');
    const event = sanitizeWebhookPayload(payload, verified, req.requestId);

    storeEvent(event);
    await persistWebhookToSupabase(payload, rawBody, signatureHeader, req.requestId);
    console.log(
      `[ELEVENLABS][WEBHOOK][${req.requestId}] type=${event.type} agent=${event.agentId || 'n/a'} conversation=${event.conversationId || 'n/a'} verified=${verified}`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(`[ELEVENLABS][WEBHOOK][${req.requestId}]`, error.message);
    storeEvent({
      type: 'error',
      verified: false,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    return res.status(error.statusCode || 401).json({
      error: error.message || 'Invalid ElevenLabs webhook',
      requestId: req.requestId,
    });
  }
});

module.exports = router;
