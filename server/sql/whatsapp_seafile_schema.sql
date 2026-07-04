CREATE SCHEMA IF NOT EXISTS wa_ingest;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS wa_ingest.webhook_events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider            text NOT NULL DEFAULT 'whatsapp_cloud',
    object_type         text,
    event_payload       jsonb NOT NULL,
    headers_payload     jsonb DEFAULT '{}'::jsonb,
    received_at         timestamptz NOT NULL DEFAULT now(),
    processing_status   text NOT NULL DEFAULT 'received',
    processing_error    text,
    processed_at        timestamptz
);

CREATE TABLE IF NOT EXISTS wa_ingest.messages (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id              uuid REFERENCES wa_ingest.webhook_events(id) ON DELETE CASCADE,

    waba_id               text,
    phone_number_id       text,
    display_phone_number  text,

    message_id            text NOT NULL,
    sender_wa_id          text NOT NULL,
    sender_name           text,

    message_type          text NOT NULL,
    message_text          text,
    message_timestamp     timestamptz,

    raw_message           jsonb NOT NULL,
    created_at            timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_wa_message_id UNIQUE (message_id)
);

CREATE TABLE IF NOT EXISTS wa_ingest.media_files (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id              uuid REFERENCES wa_ingest.webhook_events(id) ON DELETE CASCADE,
    message_id            uuid REFERENCES wa_ingest.messages(id) ON DELETE CASCADE,

    wa_message_id         text NOT NULL,
    wa_media_id           text NOT NULL,

    media_type            text NOT NULL,
    mime_type             text,
    sha256                text,
    caption               text,

    original_filename     text,
    generated_filename    text,
    sender_wa_id          text,
    message_timestamp     timestamptz,

    seafile_repo_id       text,
    seafile_parent_dir    text DEFAULT '/',
    seafile_relative_path text,
    seafile_file_path     text,
    seafile_upload_result jsonb,

    download_status       text NOT NULL DEFAULT 'queued',
    upload_status         text NOT NULL DEFAULT 'queued',

    retry_count           int NOT NULL DEFAULT 0,
    last_error            text,

    created_at            timestamptz NOT NULL DEFAULT now(),
    downloaded_at         timestamptz,
    uploaded_at           timestamptz,

    CONSTRAINT uq_wa_media_id UNIQUE (wa_media_id)
);

CREATE TABLE IF NOT EXISTS wa_ingest.notification_events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table         text NOT NULL,
    source_id            uuid NOT NULL,

    notification_type    text NOT NULL,
    title                text NOT NULL,
    body                 text,
    severity             text NOT NULL DEFAULT 'info',

    payload              jsonb NOT NULL DEFAULT '{}'::jsonb,

    delivery_status      text NOT NULL DEFAULT 'pending',
    delivery_error       text,
    created_at           timestamptz NOT NULL DEFAULT now(),
    delivered_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
ON wa_ingest.webhook_events(received_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_created
ON wa_ingest.messages(sender_wa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_files_upload_status
ON wa_ingest.media_files(upload_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_files_sender
ON wa_ingest.media_files(sender_wa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_events_status
ON wa_ingest.notification_events(delivery_status, created_at DESC);

CREATE OR REPLACE FUNCTION wa_ingest.notify_notification_event()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM pg_notify(
        'azab_notifications',
        json_build_object(
            'id', NEW.id,
            'type', NEW.notification_type,
            'title', NEW.title,
            'severity', NEW.severity,
            'source_table', NEW.source_table,
            'source_id', NEW.source_id,
            'created_at', NEW.created_at
        )::text
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_notification_event
ON wa_ingest.notification_events;

CREATE TRIGGER trg_notify_notification_event
AFTER INSERT ON wa_ingest.notification_events
FOR EACH ROW
EXECUTE FUNCTION wa_ingest.notify_notification_event();

CREATE OR REPLACE FUNCTION wa_ingest.create_media_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO wa_ingest.notification_events (
        source_table,
        source_id,
        notification_type,
        title,
        body,
        severity,
        payload
    )
    VALUES (
        'wa_ingest.media_files',
        NEW.id,
        'whatsapp_media_received',
        'WhatsApp media received',
        'New WhatsApp media file queued for Seafile upload',
        'info',
        jsonb_build_object(
            'wa_media_id', NEW.wa_media_id,
            'wa_message_id', NEW.wa_message_id,
            'sender_wa_id', NEW.sender_wa_id,
            'media_type', NEW.media_type,
            'mime_type', NEW.mime_type,
            'generated_filename', NEW.generated_filename,
            'seafile_relative_path', NEW.seafile_relative_path
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_media_notification
ON wa_ingest.media_files;

CREATE TRIGGER trg_create_media_notification
AFTER INSERT ON wa_ingest.media_files
FOR EACH ROW
EXECUTE FUNCTION wa_ingest.create_media_notification();
