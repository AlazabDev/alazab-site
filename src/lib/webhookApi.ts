// Webhook API client — connects to the standalone server
const WEBHOOK_API_BASE = import.meta.env.VITE_API_URL || 'https://alazab.com/api';

async function webhookFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${WEBHOOK_API_BASE}/webhook${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export interface WebhookEvent {
  type: 'message' | 'status' | 'error' | 'test';
  id?: string;
  from?: string;
  customerName?: string;
  direction?: string;
  messageType?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaMime?: string | null;
  phoneNumberId?: string;
  timestamp: string;
  status?: string;
  messageId?: string;
  recipientId?: string;
  error?: string | Record<string, unknown>;
  errors?: unknown[];
  payload?: unknown;
}

export interface WebhookStats {
  total: number;
  messages: number;
  statuses: number;
  errors: number;
}

export interface WebhookConfig {
  whatsapp: {
    verifyToken: string;
    appSecret: string;
    accessToken: string;
    webhookUrl: string;
  };
}

export const webhookApi = {
  // Get events
  getEvents: (params?: { type?: string; limit?: number; since?: string }): Promise<{ total: number; events: WebhookEvent[]; stats: WebhookStats }> => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.since) qs.set('since', params.since);
    return webhookFetch(`/events?${qs}`);
  },

  // Get config
  getConfig: (): Promise<WebhookConfig> => webhookFetch('/config'),

  // Send test event
  sendTest: (payload?: unknown) =>
    webhookFetch('/test', { method: 'POST', body: JSON.stringify(payload || { test: true }) }),

  // Clear events
  clearEvents: () =>
    webhookFetch('/events', { method: 'DELETE' }),
};
