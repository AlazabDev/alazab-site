CREATE SCHEMA IF NOT EXISTS mail_gateway;
CREATE TABLE IF NOT EXISTS mail_gateway.accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE,
 imap_host text NOT NULL, imap_port int NOT NULL DEFAULT 993,
 smtp_host text NOT NULL, smtp_port int NOT NULL DEFAULT 465,
 credentials_enc text NOT NULL,
 enabled boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mail_gateway.messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES mail_gateway.accounts(id) ON DELETE CASCADE,
 folder text NOT NULL, uid bigint NOT NULL,
 message_id text, from_address text, to_addresses text[],
 subject text, received_at timestamptz,
 body_text text, body_html text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(account_id, folder, uid)
);
CREATE INDEX IF NOT EXISTS idx_mail_messages_account_date ON mail_gateway.messages(account_id, received_at DESC);
CREATE TABLE IF NOT EXISTS mail_gateway.attachments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 message_id uuid NOT NULL REFERENCES mail_gateway.messages(id) ON DELETE CASCADE,
 filename text, content_type text, content bytea NOT NULL
);
CREATE TABLE IF NOT EXISTS mail_gateway.sync_state (
 account_id uuid NOT NULL REFERENCES mail_gateway.accounts(id) ON DELETE CASCADE,
 folder text NOT NULL, uid_validity text, last_uid bigint NOT NULL DEFAULT 0,
 last_sync_at timestamptz, last_error text,
 PRIMARY KEY(account_id,folder)
);
CREATE TABLE IF NOT EXISTS mail_gateway.outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 account_id uuid NOT NULL REFERENCES mail_gateway.accounts(id),
 recipient text NOT NULL, subject text NOT NULL,
 state text NOT NULL DEFAULT 'queued',
 error text, smtp_message_id text, sent_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
