'use strict';

const axios = require('axios');

function config() {
  return {
    token: process.env.CENTRAL_WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.CENTRAL_WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID,
    to: process.env.CENTRAL_WHATSAPP_ADMIN_TO,
    graphVersion: process.env.CENTRAL_WHATSAPP_GRAPH_VERSION || 'v23.0',
    flowId: process.env.CENTRAL_WHATSAPP_FLOW_ID,
    flowCta: process.env.CENTRAL_WHATSAPP_FLOW_CTA || 'أوامر التشغيل',
    flowScreen: process.env.CENTRAL_WHATSAPP_FLOW_SCREEN || 'MAIN',
    templateName: process.env.CENTRAL_WHATSAPP_TEMPLATE_NAME,
    templateLanguage: process.env.CENTRAL_WHATSAPP_TEMPLATE_LANGUAGE || 'ar',
  };
}

function endpoint(cfg) {
  return `https://graph.facebook.com/${cfg.graphVersion}/${cfg.phoneNumberId}/messages`;
}

async function send(payload) {
  const cfg = config();
  if (!cfg.token || !cfg.phoneNumberId) throw new Error('Central WhatsApp sender is not configured');
  const response = await axios.post(endpoint(cfg), payload, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    timeout: Number(process.env.CENTRAL_WHATSAPP_TIMEOUT_MS || 15000),
    validateStatus: () => true,
  });
  if (response.status < 200 || response.status >= 300) {
    const error = new Error(`WhatsApp send failed HTTP ${response.status}`);
    error.response_data = response.data;
    throw error;
  }
  return response.data;
}

async function sendText(body, to) {
  const cfg = config();
  const recipient = to || cfg.to;
  if (!recipient) throw new Error('CENTRAL_WHATSAPP_ADMIN_TO is missing');
  return send({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: { preview_url: false, body: String(body).slice(0, 3900) },
  });
}

async function sendTemplate(body, to) {
  const cfg = config();
  const recipient = to || cfg.to;
  if (!recipient) throw new Error('CENTRAL_WHATSAPP_ADMIN_TO is missing');
  if (!cfg.templateName) throw new Error('CENTRAL_WHATSAPP_TEMPLATE_NAME is missing');
  return send({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: cfg.templateName,
      language: { code: cfg.templateLanguage },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: String(body).slice(0, 3000) }],
        },
      ],
    },
  });
}

async function sendFlow(text, to) {
  const cfg = config();
  const recipient = to || cfg.to;
  if (!recipient) throw new Error('CENTRAL_WHATSAPP_ADMIN_TO is missing');
  if (!cfg.flowId) throw new Error('CENTRAL_WHATSAPP_FLOW_ID is missing');
  return send({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'interactive',
    interactive: {
      type: 'flow',
      body: { text: text || 'مركز تشغيل العزب' },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: `ops-${Date.now()}`,
          flow_id: cfg.flowId,
          flow_cta: cfg.flowCta,
          flow_action: 'navigate',
          flow_action_payload: { screen: cfg.flowScreen, data: {} },
        },
      },
    },
  });
}

function severityIcon(severity) {
  return ({ debug: '⚪', info: '🔵', notice: '🟢', warning: '🟠', error: '🔴', critical: '🚨' })[severity] || '🔵';
}

function formatEvent(event) {
  const lines = [
    `${severityIcon(event.severity)} ${event.title || event.event_type || 'حدث جديد'}`,
    `المصدر: ${event.source}`,
    `النوع: ${event.event_type}`,
  ];
  if (event.summary) lines.push(`التفاصيل: ${event.summary}`);
  if (event.external_id) lines.push(`المرجع: ${event.external_id}`);
  lines.push(`الوقت: ${event.received_at || new Date().toISOString()}`);
  return lines.join('\n').slice(0, 3900);
}

async function notifyEvent(event) {
  const body = formatEvent(event);
  const cfg = config();
  return cfg.templateName ? sendTemplate(body) : sendText(body);
}

module.exports = { sendText, sendTemplate, sendFlow, notifyEvent, formatEvent, config };
