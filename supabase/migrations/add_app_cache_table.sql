-- App Cache Table for Zeitgeist Questions and other ephemeral data
-- This table stores JSON blobs that expire, used for:
-- - Zeitgeist suggested questions (refreshed daily)
-- - Other cacheable application data

CREATE TABLE IF NOT EXISTS app_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for expiration queries
CREATE INDEX IF NOT EXISTS idx_app_cache_expires ON app_cache(expires_at) WHERE expires_at IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE app_cache IS 'Key-value cache for application data like zeitgeist questions';
COMMENT ON COLUMN app_cache.key IS 'Unique identifier (e.g., "zeitgeist_questions")';
COMMENT ON COLUMN app_cache.value IS 'JSON payload';
COMMENT ON COLUMN app_cache.expires_at IS 'Optional expiration timestamp';

-- Enable RLS (but allow public read for now)
ALTER TABLE app_cache ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read cache (for suggested questions)
CREATE POLICY IF NOT EXISTS "Public read access" ON app_cache
  FOR SELECT USING (true);

-- Policy: Only service role can write
CREATE POLICY IF NOT EXISTS "Service role write access" ON app_cache
  FOR ALL USING (auth.role() = 'service_role');
