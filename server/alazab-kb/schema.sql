CREATE SCHEMA IF NOT EXISTS az_kb;
CREATE TABLE IF NOT EXISTS az_kb.documents (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 project TEXT NOT NULL DEFAULT 'general',
 category TEXT NOT NULL DEFAULT 'reference',
 status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','superseded')),
 content TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT '',
 revision INT NOT NULL DEFAULT 1,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple',coalesce(title,'') || ' ' || coalesce(content,'') || ' ' || coalesce(project,'') || ' ' || coalesce(category,''))) STORED
);
CREATE INDEX IF NOT EXISTS az_kb_fts ON az_kb.documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS az_kb_project ON az_kb.documents(project,category,status);
CREATE TABLE IF NOT EXISTS az_kb.revisions (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 document_id BIGINT NOT NULL REFERENCES az_kb.documents(id) ON DELETE CASCADE,
 revision INT NOT NULL,
 title TEXT NOT NULL,
 content TEXT NOT NULL,
 status TEXT NOT NULL,
 source TEXT NOT NULL,
 changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(document_id,revision)
);
