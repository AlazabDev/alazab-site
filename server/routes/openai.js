'use strict';

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_ADMIN_API_KEY = process.env.OPENAI_ADMIN_API_KEY || '';
const OPENAI_WEBHOOK = process.env.OPENAI_WEBHOOK || '';
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID || '';
const OPENAI_SERVICE_TIER = process.env.OPENAI_SERVICE_TIER || 'default';
const OPENAI_DEFAULT_MODEL =
  process.env.OPENAI_DEFAULT_MODEL ||
  process.env.DEFAULT_MODEL ||
  'gpt-5.5';

function jsonError(res, status, message, details = undefined) {
  return res.status(status).json({
    ok: false,
    error: message,
    ...(details ? { details } : {}),
  });
}

function getGatewayKey() {
  return (
    process.env.OPENAI_GATEWAY_KEY ||
    process.env.OPENAI_ADMIN_API_KEY ||
    process.env.ADMIN_API_KEY ||
    ''
  );
}

function requireGatewayAccess(req, res, next) {
  const configuredKey = getGatewayKey();

  if (!configuredKey) {
    return jsonError(res, 500, 'OpenAI gateway access key is not configured');
  }

  const incomingKey =
    req.headers['x-api-key'] ||
    req.headers['x-admin-key'] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    '';

  if (!incomingKey || incomingKey !== configuredKey) {
    return jsonError(res, 401, 'Unauthorized');
  }

  return next();
}

function getOpenAIHeaders() {
  if (!OPENAI_API_KEY) {
    const err = new Error('OPENAI_API_KEY is not configured');
    err.statusCode = 500;
    throw err;
  }

  const headers = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  };

  if (OPENAI_PROJECT_ID) {
    headers['OpenAI-Project'] = OPENAI_PROJECT_ID;
  }

  return headers;
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && content?.text) {
        chunks.push(content.text);
      }
      if (content?.type === 'text' && content?.text) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function getRequestRawBody(req) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody, 'utf8');
  return Buffer.from(JSON.stringify(req.body || {}), 'utf8');
}

function verifyOpenAIWebhook(req) {
  if (!OPENAI_WEBHOOK) {
    return {
      ok: false,
      reason: 'webhook_not_configured',
    };
  }

  const signatureHeader =
    req.headers['openai-signature'] ||
    req.headers['x-openai-signature'] ||
    req.headers['webhook-signature'] ||
    '';

  const timestampHeader =
    req.headers['openai-timestamp'] ||
    req.headers['x-openai-timestamp'] ||
    req.headers['webhook-timestamp'] ||
    '';

  if (!signatureHeader) {
    return {
      ok: false,
      reason: 'missing_signature_header',
    };
  }

  const rawBody = getRequestRawBody(req);

  const candidates = [];

  if (timestampHeader) {
    candidates.push(Buffer.concat([Buffer.from(`${timestampHeader}.`, 'utf8'), rawBody]));
  }

  candidates.push(rawBody);

  const signatures = String(signatureHeader)
    .split(',')
    .map((part) => part.trim())
    .map((part) => part.replace(/^v\d+=/, ''))
    .filter(Boolean);

  for (const payload of candidates) {
    const expectedHex = crypto
      .createHmac('sha256', OPENAI_WEBHOOK)
      .update(payload)
      .digest('hex');

    const expectedBase64 = crypto
      .createHmac('sha256', OPENAI_WEBHOOK)
      .update(payload)
      .digest('base64');

    for (const sig of signatures) {
      const a = Buffer.from(sig);
      const bHex = Buffer.from(expectedHex);
      const b64 = Buffer.from(expectedBase64);

      if (a.length === bHex.length && crypto.timingSafeEqual(a, bHex)) {
        return { ok: true, mode: 'hex' };
      }

      if (a.length === b64.length && crypto.timingSafeEqual(a, b64)) {
        return { ok: true, mode: 'base64' };
      }
    }
  }

  return {
    ok: false,
    reason: 'invalid_signature',
  };
}

router.get('/health', (_req, res) => {
  return res.json({
    ok: true,
    service: 'openai-gateway',
    projectConfigured: Boolean(OPENAI_PROJECT_ID),
    keyConfigured: Boolean(OPENAI_API_KEY),
    adminKeyConfigured: Boolean(getGatewayKey()),
    webhookConfigured: Boolean(OPENAI_WEBHOOK),
    baseUrl: OPENAI_BASE_URL,
    defaultModel: OPENAI_DEFAULT_MODEL,
    serviceTier: OPENAI_SERVICE_TIER,
    endpoints: {
      health: 'GET /api/openai/health',
      models: 'GET /api/openai/models',
      responses: 'POST /api/openai/responses',
      analyzeText: 'POST /api/openai/analyze-text',
      webhook: 'POST /api/openai/webhook',
    },
  });
});

router.get('/models', requireGatewayAccess, async (_req, res) => {
  try {
    const response = await axios.get(`${OPENAI_BASE_URL}/models`, {
      headers: getOpenAIHeaders(),
      timeout: 30000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return jsonError(
        res,
        response.status,
        response.data?.error?.message || 'OpenAI models request failed'
      );
    }

    const models = Array.isArray(response.data?.data)
      ? response.data.data.map((model) => model.id)
      : [];

    return res.json({
      ok: true,
      total: models.length,
      models,
    });
  } catch (error) {
    return jsonError(res, error.statusCode || 500, error.message);
  }
});

router.post('/responses', requireGatewayAccess, async (req, res) => {
  try {
    const body = req.body || {};
    const input = body.input || body.text || body.message;

    if (!input) {
      return jsonError(res, 400, 'input is required');
    }

    const payload = {
      model: body.model || OPENAI_DEFAULT_MODEL,
      input,
      max_output_tokens: Number(body.max_output_tokens || 1000),
      service_tier: body.service_tier || OPENAI_SERVICE_TIER,
    };

    if (body.instructions) payload.instructions = body.instructions;
    if (body.metadata && typeof body.metadata === 'object') payload.metadata = body.metadata;
    if (typeof body.temperature === 'number') payload.temperature = body.temperature;

    const response = await axios.post(`${OPENAI_BASE_URL}/responses`, payload, {
      headers: getOpenAIHeaders(),
      timeout: 90000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return jsonError(
        res,
        response.status,
        response.data?.error?.message || 'OpenAI response request failed',
        response.data?.error
      );
    }

    return res.json({
      ok: true,
      id: response.data?.id,
      model: response.data?.model,
      status: response.data?.status,
      output_text: extractOutputText(response.data),
      response: response.data,
    });
  } catch (error) {
    return jsonError(res, error.statusCode || 500, error.message);
  }
});

router.post('/analyze-text', requireGatewayAccess, async (req, res) => {
  try {
    const body = req.body || {};
    const text = body.text || body.message || '';

    if (!text) {
      return jsonError(res, 400, 'text is required');
    }

    const purpose = body.purpose || 'general';

    const payload = {
      model: body.model || OPENAI_DEFAULT_MODEL,
      service_tier: body.service_tier || OPENAI_SERVICE_TIER,
      max_output_tokens: Number(body.max_output_tokens || 900),
      instructions:
        'أنت بوابة الذكاء الاصطناعي الداخلية لشركة العزب. أخرج نتيجة عربية واضحة، تنفيذية، منظمة، ومناسبة لأنظمة التشغيل والصيانة.',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `الغرض: ${purpose}\n\nالنص:\n${text}`,
            },
          ],
        },
      ],
    };

    const response = await axios.post(`${OPENAI_BASE_URL}/responses`, payload, {
      headers: getOpenAIHeaders(),
      timeout: 90000,
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      return jsonError(
        res,
        response.status,
        response.data?.error?.message || 'OpenAI analyze-text request failed',
        response.data?.error
      );
    }

    return res.json({
      ok: true,
      id: response.data?.id,
      model: response.data?.model,
      status: response.data?.status,
      output_text: extractOutputText(response.data),
    });
  } catch (error) {
    return jsonError(res, error.statusCode || 500, error.message);
  }
});

router.post('/webhook', async (req, res) => {
  const verification = verifyOpenAIWebhook(req);

  if (!verification.ok) {
    return jsonError(res, 401, verification.reason);
  }

  const event = req.body || {};

  return res.json({
    ok: true,
    received: true,
    verified: true,
    event_id: event.id || null,
    event_type: event.type || null,
  });
});

module.exports = router;
