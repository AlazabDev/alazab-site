WITH inserted_event AS (
    INSERT INTO wa_ingest.webhook_events (
        object_type,
        event_payload,
        headers_payload,
        processing_status
    )
    VALUES (
        COALESCE($1, 'whatsapp_message'),
        $2::jsonb,
        COALESCE($3::jsonb, '{}'::jsonb),
        'received'
    )
    RETURNING id
),
inserted_message AS (
    INSERT INTO wa_ingest.messages (
        event_id,
        waba_id,
        phone_number_id,
        display_phone_number,
        message_id,
        sender_wa_id,
        sender_name,
        message_type,
        message_text,
        message_timestamp,
        raw_message
    )
    SELECT
        inserted_event.id,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12::timestamptz,
        $13::jsonb
    FROM inserted_event
    ON CONFLICT (message_id)
    DO UPDATE SET
        raw_message = EXCLUDED.raw_message,
        message_text = EXCLUDED.message_text
    RETURNING id, event_id
),
inserted_media AS (
    INSERT INTO wa_ingest.media_files (
        event_id,
        message_id,
        wa_message_id,
        wa_media_id,
        media_type,
        mime_type,
        sha256,
        caption,
        original_filename,
        generated_filename,
        sender_wa_id,
        message_timestamp,
        seafile_repo_id,
        seafile_parent_dir,
        seafile_relative_path
    )
    SELECT
        inserted_message.event_id,
        inserted_message.id,
        $7,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $8,
        $12::timestamptz,
        $21,
        '/',
        $22
    FROM inserted_message
    WHERE COALESCE($23::boolean, false) = true
    ON CONFLICT (wa_media_id)
    DO UPDATE SET
        generated_filename = EXCLUDED.generated_filename,
        seafile_relative_path = EXCLUDED.seafile_relative_path,
        retry_count = wa_ingest.media_files.retry_count + 1
    RETURNING id
)
SELECT
    (SELECT id FROM inserted_event) AS event_id,
    (SELECT id FROM inserted_message) AS message_db_id,
    (SELECT id FROM inserted_media) AS media_db_id;
