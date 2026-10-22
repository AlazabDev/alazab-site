CREATE TABLE IF NOT EXISTS whatsapp_embedded_connections (
  phone_number_id TEXT PRIMARY KEY,
  waba_id TEXT NOT NULL,
  display_phone_number TEXT,
  encrypted_access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
