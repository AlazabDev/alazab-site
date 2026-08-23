CREATE SCHEMA IF NOT EXISTS ops;

CREATE TABLE IF NOT EXISTS ops.central_events (
  id text PRIMARY KEY,
  source text NOT NULL,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  external_id text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT NOW(),
  notified_at timestamptz,
  notification_status text,
  notification_response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS central_events_received_at_idx
  ON ops.central_events (received_at DESC);

CREATE INDEX IF NOT EXISTS central_events_source_type_idx
  ON ops.central_events (source, event_type);

CREATE INDEX IF NOT EXISTS central_events_severity_idx
  ON ops.central_events (severity, received_at DESC);

CREATE TABLE IF NOT EXISTS ops.command_runs (
  id text PRIMARY KEY,
  sender text NOT NULL,
  action text NOT NULL,
  target text NOT NULL DEFAULT '',
  status text NOT NULL,
  request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_message_id text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS command_runs_created_at_idx
  ON ops.command_runs (created_at DESC);

CREATE INDEX IF NOT EXISTS command_runs_sender_idx
  ON ops.command_runs (sender, created_at DESC);

CREATE INDEX IF NOT EXISTS command_runs_action_idx
  ON ops.command_runs (action, status, created_at DESC);
