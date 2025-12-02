-- RLHF Comparisons and Queue Management Schema Extension
-- Migration: 20251202_rlhf_comparisons_and_queue.sql
-- Purpose: Add rlhf_comparisons table and queue management for CuratorWorkspace
-- Multi-tenant columns: organization, division, app_under_test

-- =============================================================================
-- Table 1: RLHF Comparisons (for DPO training)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rlhf_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The original query/prompt
  query TEXT NOT NULL,

  -- Response pair for comparison
  response_a TEXT NOT NULL,
  response_b TEXT NOT NULL,

  -- Model information
  model_a TEXT,
  model_b TEXT,

  -- Human preference: 'A', 'B', or 'tie'
  preferred_response TEXT CHECK (preferred_response IN ('A', 'B', 'tie')),

  -- Preference strength (how confident the annotator is)
  preference_strength DECIMAL(3,2) DEFAULT 1.0 CHECK (preference_strength >= 0 AND preference_strength <= 1),

  -- Annotator reasoning
  reason TEXT,

  -- Context from RAG
  context_documents JSONB DEFAULT '[]'::jsonb,

  -- Session tracking
  session_id TEXT,
  conversation_id TEXT,

  -- Annotator information
  annotator_email TEXT,

  -- Quality flags
  quality_flags JSONB DEFAULT '{}'::jsonb,

  -- Multi-tenant columns
  organization TEXT NOT NULL DEFAULT 'sony-music',
  division TEXT,
  app_under_test TEXT DEFAULT 'aoma',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for rlhf_comparisons
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_org ON rlhf_comparisons(organization, division, app_under_test);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_annotator ON rlhf_comparisons(annotator_email);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_preference ON rlhf_comparisons(preferred_response);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_created ON rlhf_comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rlhf_comparisons_session ON rlhf_comparisons(session_id);

-- =============================================================================
-- Alter rlhf_feedback: Add queue management columns
-- =============================================================================

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'status'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN status TEXT DEFAULT 'pending'
      CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'revision_requested'));
  END IF;
END $$;

-- Add curator review columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'curator_id'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN curator_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'curator_notes'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN curator_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'priority'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'severity'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN severity TEXT CHECK (severity IN ('minor', 'major', 'critical'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'categories'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN categories TEXT[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'suggested_correction'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN suggested_correction TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'user_query'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN user_query TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'ai_response'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN ai_response TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'thumbs_up'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN thumbs_up BOOLEAN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'rating'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'model_used'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN model_used TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rlhf_feedback' AND column_name = 'rag_metadata'
  ) THEN
    ALTER TABLE rlhf_feedback ADD COLUMN rag_metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add indexes for queue management
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_status ON rlhf_feedback(status);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_priority ON rlhf_feedback(priority DESC);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_curator ON rlhf_feedback(curator_id);
CREATE INDEX IF NOT EXISTS idx_rlhf_feedback_queue ON rlhf_feedback(status, priority DESC, created_at ASC);

-- =============================================================================
-- Function: Get annotation queue for CuratorWorkspace
-- =============================================================================
CREATE OR REPLACE FUNCTION get_annotation_queue(
  p_organization TEXT DEFAULT NULL,
  p_division TEXT DEFAULT NULL,
  p_app_under_test TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'pending',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  session_id TEXT,
  user_query TEXT,
  ai_response TEXT,
  thumbs_up BOOLEAN,
  rating INTEGER,
  categories TEXT[],
  severity TEXT,
  feedback_text TEXT,
  suggested_correction TEXT,
  model_used TEXT,
  rag_metadata JSONB,
  status TEXT,
  priority INTEGER,
  curator_id TEXT,
  curator_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  organization TEXT,
  division TEXT,
  app_under_test TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rf.id,
    rf.session_id,
    rf.user_query,
    rf.ai_response,
    rf.thumbs_up,
    rf.rating,
    rf.categories,
    rf.severity,
    rf.feedback_text,
    rf.suggested_correction,
    rf.model_used,
    rf.rag_metadata,
    rf.status,
    rf.priority,
    rf.curator_id,
    rf.curator_notes,
    rf.reviewed_at,
    rf.created_at,
    rf.organization,
    rf.division,
    rf.app_under_test
  FROM rlhf_feedback rf
  WHERE
    (p_organization IS NULL OR rf.organization = p_organization)
    AND (p_division IS NULL OR rf.division = p_division)
    AND (p_app_under_test IS NULL OR rf.app_under_test = p_app_under_test)
    AND (p_status IS NULL OR rf.status = p_status)
  ORDER BY
    rf.priority DESC,
    rf.created_at ASC
  LIMIT p_limit;
END;
$$;

-- =============================================================================
-- Function: Update feedback status (for curator actions)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_feedback_status(
  p_feedback_id UUID,
  p_status TEXT,
  p_curator_id TEXT,
  p_curator_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE rlhf_feedback
  SET
    status = p_status,
    curator_id = p_curator_id,
    curator_notes = COALESCE(p_curator_notes, curator_notes),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_feedback_id;

  RETURN FOUND;
END;
$$;

-- =============================================================================
-- Function: Get curator stats
-- =============================================================================
CREATE OR REPLACE FUNCTION get_curator_stats(
  p_organization TEXT DEFAULT NULL,
  p_curator_id TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_pending BIGINT,
  total_approved BIGINT,
  total_rejected BIGINT,
  total_revision_requested BIGINT,
  avg_review_time_hours NUMERIC,
  by_severity JSONB,
  by_category JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COUNT(*) FILTER (WHERE status = 'revision_requested') as revision_requested,
      AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 3600)
        FILTER (WHERE reviewed_at IS NOT NULL) as avg_review_hours
    FROM rlhf_feedback
    WHERE
      created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND (p_organization IS NULL OR organization = p_organization)
      AND (p_curator_id IS NULL OR curator_id = p_curator_id)
  ),
  severity_stats AS (
    SELECT jsonb_object_agg(
      COALESCE(severity, 'unspecified'),
      cnt
    ) as by_sev
    FROM (
      SELECT severity, COUNT(*) as cnt
      FROM rlhf_feedback
      WHERE
        created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND (p_organization IS NULL OR organization = p_organization)
      GROUP BY severity
    ) s
  ),
  category_stats AS (
    SELECT jsonb_object_agg(cat, cnt) as by_cat
    FROM (
      SELECT unnest(categories) as cat, COUNT(*) as cnt
      FROM rlhf_feedback
      WHERE
        created_at >= NOW() - (p_days || ' days')::INTERVAL
        AND (p_organization IS NULL OR organization = p_organization)
        AND categories IS NOT NULL
      GROUP BY cat
    ) c
  )
  SELECT
    s.pending,
    s.approved,
    s.rejected,
    s.revision_requested,
    ROUND(s.avg_review_hours::NUMERIC, 2),
    COALESCE(sv.by_sev, '{}'::jsonb),
    COALESCE(cs.by_cat, '{}'::jsonb)
  FROM stats s, severity_stats sv, category_stats cs;
END;
$$;

-- =============================================================================
-- RLS for rlhf_comparisons
-- =============================================================================
ALTER TABLE rlhf_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow authenticated read
CREATE POLICY "Authenticated users can read comparisons" ON rlhf_comparisons
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert their own comparisons
CREATE POLICY "Authenticated users can insert comparisons" ON rlhf_comparisons
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access on rlhf_comparisons" ON rlhf_comparisons
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Allow anon read for demo
CREATE POLICY "Anon can read comparisons for demo" ON rlhf_comparisons
  FOR SELECT TO anon
  USING (true);

-- =============================================================================
-- Triggers
-- =============================================================================
CREATE OR REPLACE FUNCTION update_rlhf_comparisons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rlhf_comparisons_updated_at ON rlhf_comparisons;
CREATE TRIGGER rlhf_comparisons_updated_at
  BEFORE UPDATE ON rlhf_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION update_rlhf_comparisons_updated_at();

-- =============================================================================
-- Grant permissions
-- =============================================================================
GRANT SELECT ON rlhf_comparisons TO anon;
GRANT SELECT, INSERT, UPDATE ON rlhf_comparisons TO authenticated;
GRANT ALL ON rlhf_comparisons TO service_role;

GRANT EXECUTE ON FUNCTION get_annotation_queue TO authenticated;
GRANT EXECUTE ON FUNCTION get_annotation_queue TO service_role;
GRANT EXECUTE ON FUNCTION update_feedback_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_feedback_status TO service_role;
GRANT EXECUTE ON FUNCTION get_curator_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_curator_stats TO service_role;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE rlhf_comparisons IS 'Stores human preference comparisons between response pairs for DPO/RLHF training';
COMMENT ON FUNCTION get_annotation_queue IS 'Returns pending feedback items for curator review queue';
COMMENT ON FUNCTION update_feedback_status IS 'Updates feedback status after curator action';
COMMENT ON FUNCTION get_curator_stats IS 'Returns aggregated statistics for curator dashboard';

-- =============================================================================
-- Complete
-- =============================================================================
SELECT 'RLHF Comparisons and Queue Management schema created successfully!' as status;
