const express = require('express');
const { z } = require('zod');
const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const { loadAppSecrets, getSupabaseStatus, storeWebhookEvent } = require('../supabase');

const router = express.Router();
const chatbotEvents = [];
const MAX_EVENTS = 200;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function maskConfigured(value) {
  return value ? '***configured***' : 'NOT SET';
}

function storeEvent(event) {
  chatbotEvents.unshift(event);
  if (chatbotEvents.length > MAX_EVENTS) {
    chatbotEvents.pop();
  }
}

async function getChatbotConfig() {
  const envConfig = {
    apiKey: normalizeString(process.env.ELEVENLABS_API_KEY),
    defaultAgentId: normalizeString(process.env.ELEVENLABS_AGENT_ID),
    webhookSecret: normalizeString(process.env.ELEVENLABS_WEBHOOK_SECRET),
    branchId: normalizeString(process.env.ELEVENLABS_BRANCH_ID),
    environment: normalizeString(process.env.ELEVENLABS_ENVIRONMENT),
    allowedAgentIds: normalizeString(process.env.ELEVENLABS_ALLOWED_AGENT_IDS),
    chatbotApiKey: normalizeString(process.env.ELEVENLABS_CHATBOT_API_KEY),
    adminApiKey: normalizeString(process.env.ELEVENLABS_ADMIN_API_KEY),
  };

  const missingKeys = [];
  if (!envConfig.apiKey) missingKeys.push('ELEVENLABS_API_KEY');
  if (!envConfig.defaultAgentId) missingKeys.push('ELEVENLABS_AGENT_ID');
  if (!envConfig.webhookSecret) missingKeys.push('ELEVENLABS_WEBHOOK_SECRET');
  if (!envConfig.branchId) missingKeys.push('ELEVENLABS_BRANCH_ID');
  if (!envConfig.environment) missingKeys.push('ELEVENLABS_ENVIRONMENT');
  if (!envConfig.allowedAgentIds) missingKeys.push('ELEVENLABS_ALLOWED_AGENT_IDS');
  if (!envConfig.chatbotApiKey) missingKeys.push('ELEVENLABS_CHATBOT_API_KEY');
  if (!envConfig.adminApiKey) missingKeys.push('ELEVENLABS_ADMIN_API_KEY');

  let secretMap = {};
  if (missingKeys.length > 0) {
    try {
      secretMap = await loadAppSecrets(missingKeys);
    } catch (error) {
      console.warn('[ELEVENLABS_V1][SUPABASE]', error.message);
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
  const chatbotApiKey =
    envConfig.chatbotApiKey || normalizeString(secretMap.ELEVENLABS_CHATBOT_API_KEY);
  const adminApiKey =
    envConfig.adminApiKey || normalizeString(secretMap.ELEVENLABS_ADMIN_API_KEY) || chatbotApiKey;
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
    chatbotApiKey,
    adminApiKey,
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
      source: 'elevenlabs_v1',
      payload,
      rawBody,
      signature,
    });

    if (result.stored) {
      console.log(
        `[ELEVENLABS_V1][SUPABASE][${requestId}] Stored webhook event ${result.eventHash}`
      );
    }
  } catch (error) {
    console.warn(`[ELEVENLABS_V1][SUPABASE][${requestId}] ${error.message}`);
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
    const error = new Error('ELEVENLABS_WEBHOOK_SECRET is not configured');
    error.statusCode = 503;
    throw error;
  }

  const signatureHeader = req.get('ElevenLabs-Signature');
  if (!signatureHeader) {
    const error = new Error('Missing ElevenLabs webhook signature');
    error.statusCode = 401;
    throw error;
  }

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

function extractRequestApiKey(req) {
  const authorization = normalizeString(req.get('authorization'));
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return authorization.slice(7).trim();
  }

  return normalizeString(req.get('x-api-key'));
}

function createApiKeyMiddleware(mode) {
  return async function requireApiKey(req, res, next) {
    try {
      const config = await getChatbotConfig();
      const expectedApiKey =
        mode === 'admin' ? config.adminApiKey || config.chatbotApiKey : config.chatbotApiKey;

      if (!expectedApiKey) {
        return res.status(503).json({
          error: `Missing ElevenLabs ${mode} API key configuration`,
          requestId: req.requestId,
        });
      }

      const providedApiKey = extractRequestApiKey(req);
      if (!providedApiKey || providedApiKey !== expectedApiKey) {
        return res.status(401).json({
          error: 'Unauthorized',
          requestId: req.requestId,
        });
      }

      req.chatbotConfig = config;
      return next();
    } catch (error) {
      return res.status(500).json({
        error: error.message || 'Authorization failed',
        requestId: req.requestId,
      });
    }
  };
}

const requireChatbotApiKey = createApiKeyMiddleware('chatbot');
const requireAdminApiKey = createApiKeyMiddleware('admin');

const sessionSchema = z.object({
  agentId: z.string().trim().min(1).max(128).optional(),
  branchId: z.string().trim().min(1).max(128).optional(),
  environment: z.string().trim().min(1).max(128).optional(),
  participantName: z.string().trim().min(1).max(120).optional(),
  connectionType: z.enum(['signed_url', 'webrtc']).default('signed_url'),
  includeConversationId: z.boolean().default(true),
});

async function buildSession(payload, config, requestId) {
  ensureApiKey(config);

  const agentId = resolveAgentId(payload.agentId, config);
  const branchId = normalizeString(payload.branchId) || config.branchId;
  const environment = normalizeString(payload.environment) || config.environment;
  const participantName = normalizeString(payload.participantName);
  const connectionType = payload.connectionType || 'signed_url';

  const client = createClient(config.apiKey);

  if (connectionType === 'webrtc') {
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

    storeEvent({
      type: 'session_created',
      requestId,
      timestamp: new Date().toISOString(),
      agentId,
      connectionType: 'webrtc',
      status: 'issued',
    });

    return {
      agentId,
      connectionType: 'webrtc',
      token,
    };
  }

  const response = await client.conversationalAi.conversations.getSignedUrl({
    agentId,
    includeConversationId: payload.includeConversationId !== false,
    ...(branchId ? { branchId } : {}),
    ...(environment ? { environment } : {}),
  });

  const signedUrl = response?.signedUrl || response?.signed_url;
  const conversationId = response?.conversationId || response?.conversation_id || null;

  if (!signedUrl) {
    throw new Error('ElevenLabs did not return a signed URL');
  }

  storeEvent({
    type: 'session_created',
    requestId,
    timestamp: new Date().toISOString(),
    agentId,
    conversationId,
    connectionType: 'signed_url',
    status: 'issued',
  });

  return {
    agentId,
    connectionType: 'signed_url',
    signedUrl,
    conversationId,
  };
}

router.get(['', '/'], async (req, res) => {
  const config = await getChatbotConfig();

  res.json({
    ok: true,
    service: 'elevenlabs-chatbot',
    version: 'v1',
    mode: 'secured',
    auth: {
      requiredHeader: 'x-api-key or Authorization: Bearer <key>',
      sessionEndpoint: '/api/v1/elevenlabs/session',
    },
    endpoints: {
      root: '/api/v1/elevenlabs',
      health: '/api/v1/elevenlabs/health',
      session: '/api/v1/elevenlabs/session',
      webhook: '/api/v1/elevenlabs/webhook',
    },
    capabilities: {
      signedUrl: true,
      webrtcToken: true,
      secureSessionApiKeyConfigured: Boolean(config.chatbotApiKey),
      adminApiKeyConfigured: Boolean(config.adminApiKey),
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/health', async (req, res) => {
  const config = await getChatbotConfig();

  res.json({
    ok: true,
    service: 'elevenlabs-chatbot',
    version: 'v1',
    defaultAgentConfigured: Boolean(config.defaultAgentId),
    webhookSecretConfigured: Boolean(config.webhookSecret),
    chatbotApiKeyConfigured: Boolean(config.chatbotApiKey),
    adminApiKeyConfigured: Boolean(config.adminApiKey),
    supabaseConnected: config.supabaseConnected,
    supabaseError: config.supabaseError,
    eventsBuffered: chatbotEvents.length,
    timestamp: new Date().toISOString(),
  });
});

router.post('/session', requireChatbotApiKey, async (req, res) => {
  try {
    const payload = sessionSchema.parse(req.body || {});
    const session = await buildSession(payload, req.chatbotConfig, req.requestId);

    return res.json({
      ok: true,
      session,
      requestId: req.requestId,
    });
  } catch (error) {
    console.error(`[ELEVENLABS_V1][SESSION][${req.requestId}]`, error.message);
    return res.status(error.statusCode || 400).json({
      error: error.message || 'Failed to create chatbot session',
      requestId: req.requestId,
    });
  }
});

router.post('/conversation-token', requireChatbotApiKey, async (req, res) => {
  try {
    const payload = sessionSchema.parse({
      ...req.body,
      connectionType: 'webrtc',
    });
    const session = await buildSession(payload, req.chatbotConfig, req.requestId);

    return res.json({
      token: session.token,
      agent_id: session.agentId,
      agentId: session.agentId,
      connectionType: session.connectionType,
      requestId: req.requestId,
    });
  } catch (error) {
    console.error(`[ELEVENLABS_V1][TOKEN][${req.requestId}]`, error.message);
    return res.status(error.statusCode || 400).json({
      error: error.message || 'Failed to create conversation token',
      requestId: req.requestId,
    });
  }
});

router.post('/signed-url', requireChatbotApiKey, async (req, res) => {
  try {
    const payload = sessionSchema.parse({
      ...req.body,
      connectionType: 'signed_url',
    });
    const session = await buildSession(payload, req.chatbotConfig, req.requestId);

    return res.json({
      signed_url: session.signedUrl,
      signedUrl: session.signedUrl,
      conversation_id: session.conversationId,
      conversationId: session.conversationId,
      agent_id: session.agentId,
      agentId: session.agentId,
      requestId: req.requestId,
    });
  } catch (error) {
    console.error(`[ELEVENLABS_V1][SIGNED_URL][${req.requestId}]`, error.message);
    return res.status(error.statusCode || 400).json({
      error: error.message || 'Failed to create signed URL',
      requestId: req.requestId,
    });
  }
});

router.get('/config', requireAdminApiKey, async (req, res) => {
  const config = req.chatbotConfig;

  res.json({
    elevenlabs: {
      apiKey: maskConfigured(config.apiKey),
      defaultAgentId: config.defaultAgentId || null,
      allowedAgentIds: config.allowedAgentIds,
      branchId: config.branchId || null,
      environment: config.environment || null,
      webhookSecret: maskConfigured(config.webhookSecret),
      chatbotApiKey: maskConfigured(config.chatbotApiKey),
      adminApiKey: maskConfigured(config.adminApiKey),
      webhookUrl: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/v1/elevenlabs/webhook`,
      sessionEndpoint: `${process.env.FRONTEND_URL || 'https://alazab.com'}/api/v1/elevenlabs/session`,
      supabaseConnected: config.supabaseConnected,
      supabaseError: config.supabaseError,
      secretsSource: 'env+app_secrets',
    },
  });
});

router.get('/events', requireAdminApiKey, (req, res) => {
  const { limit = 50, type, agentId } = req.query;
  let events = chatbotEvents;

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

router.delete('/events', requireAdminApiKey, (req, res) => {
  chatbotEvents.length = 0;
  res.json({ success: true });
});

router.post('/webhook', async (req, res) => {
  try {
    const config = await getChatbotConfig();
    const { verified, payload, rawBody } = await parseWebhookPayload(req, config);
    const signatureHeader = req.get('ElevenLabs-Signature');
    const event = sanitizeWebhookPayload(payload, verified, req.requestId);

    storeEvent(event);
    await persistWebhookToSupabase(payload, rawBody, signatureHeader, req.requestId);
    console.log(
      `[ELEVENLABS_V1][WEBHOOK][${req.requestId}] type=${event.type} agent=${event.agentId || 'n/a'} conversation=${event.conversationId || 'n/a'} verified=${verified}`
    );

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(`[ELEVENLABS_V1][WEBHOOK][${req.requestId}]`, error.message);
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
