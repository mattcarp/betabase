-- Migration: Extended RLHF Schema for Curator Workspace
-- Adds tables for A/B comparison queue and extended feedback
-- Date: 2025-11-28

-- =============================================================================
-- Table: rlhf_comparisons
-- A/B comparison queue for DPO preference data collection
-- =============================================================================
CREATE TABLE IF NOT EXISTS rlhf_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The comparison data
  query TEXT NOT NULL,
  response_a TEXT NOT NULL,
  response_b TEXT NOT NULL,
  model_a TEXT,
  model_b TEXT,

  -- Annotator preference
  preferred_response TEXT CHECK (preferred_response IN ('A', 'B', 'tie')),
  reason TEXT,
  annotator_id UUID,

  -- Metadata
  context_metadata JSONB DEFAULT '{}',  -- RAG sources, latency, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE rlhf_comparisons IS 'A/B comparison queue for DPO preference data collection';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_preference ON rlhf_comparisons(preferred_response);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_created ON rlhf_comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_annotator ON rlhf_comparisons(annotator_id);

-- =============================================================================
-- Extended columns for rlhf_feedback (if they don't exist)
-- =============================================================================

-- Add conversation/message ID tracking
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS conversation_id TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS message_id TEXT;

-- Add detailed feedback fields
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS thumbs_up BOOLEAN;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS severity TEXT CHECK (severity IN ('critical', 'major', 'minor', 'suggestion'));

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS feedback_text TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS documents_marked JSONB;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS suggested_correction TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS preferred_response TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS model_used TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS rag_metadata JSONB;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS langsmith_run_id TEXT;

-- Curator workflow fields
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'needs_revision', 'exported'));

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS curator_id TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS curator_notes TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Rename existing columns to match new API (if needed)
DO $$
BEGIN
  -- Check if user_query doesn't exist but query does
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rlhf_feedback' AND column_name = 'user_query')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rlhf_feedback' AND column_name = 'query') THEN
    ALTER TABLE rlhf_feedback RENAME COLUMN query TO user_query;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rlhf_feedback' AND column_name = 'ai_response')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rlhf_feedback' AND column_name = 'response') THEN
    ALTER TABLE rlhf_feedback RENAME COLUMN response TO ai_response;
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Columns already have correct names or don't exist, that's fine
  NULL;
END $$;

-- Add user_query and ai_response if they still don't exist
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS user_query TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS ai_response TEXT;

-- =============================================================================
-- Additional indexes for new columns
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_conversation ON rlhf_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_message ON rlhf_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_status ON rlhf_feedback(status);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_thumbs ON rlhf_feedback(thumbs_up);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_curator ON rlhf_feedback(curator_id);

-- =============================================================================
-- RLS Policies for rlhf_comparisons
-- =============================================================================
ALTER TABLE rlhf_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all comparisons
CREATE POLICY "Allow read rlhf_comparisons" ON rlhf_comparisons
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert comparisons
CREATE POLICY "Allow insert rlhf_comparisons" ON rlhf_comparisons
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update their own annotations
CREATE POLICY "Allow update own rlhf_comparisons" ON rlhf_comparisons
  FOR UPDATE TO authenticated
  USING (annotator_id = auth.uid() OR annotator_id IS NULL);

-- Service role full access
CREATE POLICY "Service role full access rlhf_comparisons" ON rlhf_comparisons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- Function to get pending comparisons for annotation
-- =============================================================================
CREATE OR REPLACE FUNCTION get_pending_comparisons(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  response_a TEXT,
  response_b TEXT,
  model_a TEXT,
  model_b TEXT,
  context_metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.query,
    c.response_a,
    c.response_b,
    c.model_a,
    c.model_b,
    c.context_metadata,
    c.created_at
  FROM rlhf_comparisons c
  WHERE c.preferred_response IS NULL
  ORDER BY c.created_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_comparisons TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_comparisons TO service_role;

-- =============================================================================
-- Function to get feedback queue for curators
-- =============================================================================
CREATE OR REPLACE FUNCTION get_curator_queue(
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  conversation_id TEXT,
  message_id TEXT,
  user_query TEXT,
  ai_response TEXT,
  thumbs_up BOOLEAN,
  rating INTEGER,
  categories TEXT[],
  severity TEXT,
  feedback_text TEXT,
  suggested_correction TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.conversation_id,
    f.message_id,
    f.user_query,
    f.ai_response,
    f.thumbs_up,
    f.rating,
    f.categories,
    f.severity,
    f.feedback_text,
    f.suggested_correction,
    f.status,
    f.created_at
  FROM rlhf_feedback f
  WHERE f.status = p_status
    OR (p_status = 'all')
  ORDER BY
    CASE
      WHEN f.severity = 'critical' THEN 1
      WHEN f.severity = 'major' THEN 2
      WHEN f.severity = 'minor' THEN 3
      ELSE 4
    END,
    f.created_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_curator_queue TO authenticated;
GRANT EXECUTE ON FUNCTION get_curator_queue TO service_role;

-- =============================================================================
-- Function to get RLHF analytics metrics
-- =============================================================================
CREATE OR REPLACE FUNCTION get_rlhf_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_feedback BIGINT,
  positive_rate NUMERIC,
  average_rating NUMERIC,
  approval_rate NUMERIC,
  dpo_pairs_ready BIGINT,
  feedback_by_status JSONB,
  feedback_by_category JSONB,
  daily_counts JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*)::BIGINT as total,
      ROUND(AVG(CASE WHEN thumbs_up = true THEN 1.0 ELSE 0.0 END)::NUMERIC, 3) as pos_rate,
      ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
      ROUND(AVG(CASE WHEN status = 'approved' THEN 1.0 ELSE 0.0 END)::NUMERIC, 3) as appr_rate
    FROM rlhf_feedback
    WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  status_counts AS (
    SELECT jsonb_object_agg(status, cnt) as by_status
    FROM (
      SELECT status, COUNT(*) as cnt
      FROM rlhf_feedback
      WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY status
    ) s
  ),
  category_counts AS (
    SELECT jsonb_object_agg(cat, cnt) as by_category
    FROM (
      SELECT unnest(categories) as cat, COUNT(*) as cnt
      FROM rlhf_feedback
      WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND categories IS NOT NULL
      GROUP BY cat
    ) c
  ),
  dpo_ready AS (
    SELECT COUNT(*)::BIGINT as ready
    FROM preference_pairs
    WHERE curator_verified = true
      AND exported_at IS NULL
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('date', d, 'count', cnt)) as daily_data
    FROM (
      SELECT DATE(created_at) as d, COUNT(*) as cnt
      FROM rlhf_feedback
      WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY DATE(created_at)
      ORDER BY d
    ) dd
  )
  SELECT
    s.total,
    s.pos_rate,
    s.avg_rating,
    s.appr_rate,
    dr.ready,
    COALESCE(sc.by_status, '{}'::jsonb),
    COALESCE(cc.by_category, '{}'::jsonb),
    COALESCE(d.daily_data, '[]'::jsonb)
  FROM stats s, status_counts sc, category_counts cc, dpo_ready dr, daily d;
END;
$$;

GRANT EXECUTE ON FUNCTION get_rlhf_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_rlhf_analytics TO service_role;

-- =============================================================================
-- Complete
-- =============================================================================
SELECT 'Extended RLHF schema created successfully!' as status;
