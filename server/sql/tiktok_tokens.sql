-- sql/tiktok_tokens.sql
CREATE TABLE IF NOT EXISTS tiktok_tokens (
    id SERIAL PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    advertiser_ids TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- إضافة فهرس للبحث السريع
CREATE INDEX idx_tiktok_tokens_expires_at ON tiktok_tokens(expires_at);

-- إضافة جدول لتسجيل الأحداث
CREATE TABLE IF NOT EXISTS tiktok_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100),
    payload JSONB,
    received_at TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE
);

-- إضافة جدول للحملات الإعلانية
CREATE TABLE IF NOT EXISTS tiktok_campaigns (
    id VARCHAR(100) PRIMARY KEY,
    advertiser_id VARCHAR(100),
    campaign_name VARCHAR(255),
    status VARCHAR(50),
    budget DECIMAL(10, 2),
    objective VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_synced TIMESTAMP DEFAULT NOW()
);
