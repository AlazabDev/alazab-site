// Meta API client — connects to the standalone Express server
const META_API_BASE = import.meta.env.VITE_META_API_URL || 'https://alazab.com/api/meta';

async function metaFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${META_API_BASE}${path}`, {
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

export interface MetaAccount {
  id: number;
  account_type: string;
  waba_id: string | null;
  phone_number_id: string | null;
  phone_number: string | null;
  display_name: string;
  business_name: string | null;
  status: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MetaAccountStats {
  messages: {
    total: string;
    inbound: string;
    outbound: string;
    last_24h: string;
    failed: string;
  };
  webhookEvents: number;
}

export interface MetaMessage {
  id: number;
  account_id: number;
  wa_message_id: string;
  phone_number: string;
  customer_name: string | null;
  direction: string;
  message_type: string;
  content: string;
  status: string;
  created_at: string;
}

export const metaApi = {
  // Accounts
  getAccounts: () => metaFetch('/accounts'),
  getAccount: (id: number) => metaFetch(`/accounts/${id}`),
  createAccount: (data: Partial<MetaAccount> & { display_name: string }) =>
    metaFetch('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: number, data: Partial<MetaAccount>) =>
    metaFetch(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAccount: (id: number) =>
    metaFetch(`/accounts/${id}`, { method: 'DELETE' }),
  getAccountStats: (id: number) => metaFetch(`/accounts/${id}/stats`),

  // Messages
  getMessages: (accountId: number, params?: { limit?: number; offset?: number; phone?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.phone) qs.set('phone', params.phone);
    return metaFetch(`/messages/${accountId}?${qs}`);
  },
  sendMessage: (accountId: number, data: { to: string; type?: string; text?: string; template?: Record<string, unknown> }) =>
    metaFetch(`/messages/${accountId}/send`, { method: 'POST', body: JSON.stringify(data) }),
  getConversations: (accountId: number) => metaFetch(`/messages/${accountId}/conversations`),

  // Health
  health: () => metaFetch('/health'),
};
