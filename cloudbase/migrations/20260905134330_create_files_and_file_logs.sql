-- Migration: create_files_and_file_logs
-- Replaces the original Supabase schema for the file-sharing tools project
-- after migrating to CloudBase PostgreSQL.
--
-- Tables:
--   files       — file metadata, expiration, status
--   file_logs   — upload / access audit log
--
-- Notes:
--   - CloudBase Node SDK uses app.rdb() (postgREST client) which is the same
--     protocol as Supabase JS, so column names mirror the original schema 1:1.
--   - RLS is enabled so browser-based access (publishable key / anon role)
--     cannot accidentally write; the Node SDK uses a server API Key that maps
--     to service_role and bypasses RLS for backend operations.
--   - The schedule_one_time_deletion / unschedule_cron_job pg_cron RPCs are
--     intentionally NOT created — CloudBase PG does not guarantee pg_cron /
--     pg_net extensions on managed PostgreSQL. Per-file one-shot scheduling
--     is replaced by the high-frequency cleanup cloud function
--     (cloudfunctions/cleanupExpiredFiles, runs every 10 minutes).

-- =========================================================
-- files
-- =========================================================
CREATE TABLE IF NOT EXISTS public.files (
    id          bigserial    PRIMARY KEY,
    key         varchar(512) NOT NULL,
    bucket      varchar(128),
    expires_at  timestamptz  NOT NULL,
    metadata    jsonb        NOT NULL DEFAULT '{}'::jsonb,
    status      varchar(32)  NOT NULL DEFAULT 'uploaded',
    created_at  timestamptz  NOT NULL DEFAULT now()
);

-- Query hot path: lookup by key, range scan by expires_at + status.
CREATE INDEX IF NOT EXISTS idx_files_expires_at_status ON public.files (expires_at, status);
CREATE INDEX IF NOT EXISTS idx_files_key             ON public.files (key);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- service_role (server API Key) is the backend caller and bypasses RLS by
-- virtue of BYPASSRLS. For anon / authenticated browser callers we want a
-- permissive read (so /api/files/[id] redirects work) but write must go
-- through the Next.js API routes (server-side), so we lock writes down.
CREATE POLICY files_select_all ON public.files
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY files_no_insert_to_anon ON public.files
    FOR INSERT TO anon, authenticated
    WITH CHECK (false);

CREATE POLICY files_no_update_to_anon ON public.files
    FOR UPDATE TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY files_no_delete_to_anon ON public.files
    FOR DELETE TO anon, authenticated
    USING (false);

-- =========================================================
-- file_logs
-- =========================================================
CREATE TABLE IF NOT EXISTS public.file_logs (
    id             bigserial    PRIMARY KEY,
    type           varchar(16)  NOT NULL,
    file_id        varchar(128),
    file_key       varchar(512),
    file_name      varchar(512),
    file_size      bigint,
    mime_type      varchar(128),
    status         varchar(16)  NOT NULL,
    ip             varchar(64),
    user_agent     text,
    referer        text,
    error_message  text,
    created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_file_logs_file_id   ON public.file_logs (file_id);
CREATE INDEX IF NOT EXISTS idx_file_logs_created_at ON public.file_logs (created_at);

ALTER TABLE public.file_logs ENABLE ROW LEVEL SECURITY;

-- Logs are append-only from the server (service_role bypasses RLS).
-- Browser callers have no direct access.
CREATE POLICY file_logs_no_select ON public.file_logs
    FOR SELECT TO anon, authenticated
    USING (false);

CREATE POLICY file_logs_no_insert ON public.file_logs
    FOR INSERT TO anon, authenticated
    WITH CHECK (false);

CREATE POLICY file_logs_no_update ON public.file_logs
    FOR UPDATE TO anon, authenticated
    USING (false)
    WITH CHECK (false);

CREATE POLICY file_logs_no_delete ON public.file_logs
    FOR DELETE TO anon, authenticated
    USING (false);

-- =========================================================
-- GRANT
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.files_id_seq     TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.file_logs_id_seq TO authenticated;
