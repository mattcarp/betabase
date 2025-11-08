-- RLHF Feedback Storage Schema
-- Comprehensive schema for storing human feedback and reinforcement signals
-- Date: 2025-01-05
-- Authors: Claude Sonnet 4.5 - Advanced RLHF RAG Implementation

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 1: Main RLHF feedback table
CREATE TABLE IF NOT EXISTS rlhf_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  query_embedding vector(768), -- Gemini embedding
  response TEXT NOT NULL,
  retrieved_contexts JSONB, -- Array of {doc_id, similarity, rank, content_preview}
  feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'correction', 'detailed')) NOT NULL,
  feedback_value JSONB, -- Flexible: {score: 1-5} or {correction: "..."} or {comment: "..."}
  feedback_metadata JSONB DEFAULT '{}', -- User info, timestamp, model used, etc
  curator_email TEXT NOT NULL,
  organization TEXT NOT NULL,
  division TEXT,
  app_under_test TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Reinforcement signals for retrieval optimization
CREATE TABLE IF NOT EXISTS retrieval_reinforcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_embedding vector(768), -- Gemini embedding of the query
  query_text TEXT NOT NULL, -- Original query for analysis
  relevant_doc_ids TEXT[], -- Document IDs marked as helpful
  irrelevant_doc_ids TEXT[], -- Document IDs marked as not helpful
  manual_boosts JSONB DEFAULT '{}', -- {"source_type": "jira", "boost": 1.5}
  context TEXT, -- Additional context about why these docs were marked
  strength REAL DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0), -- Signal strength
  curator_email TEXT NOT NULL,
  organization TEXT NOT NULL,
  division TEXT,
  app_under_test TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Agent execution logs (for agentic RAG)
CREATE TABLE IF NOT EXISTS agent_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  query TEXT NOT NULL,
  query_embedding vector(768),
  decisions JSONB NOT NULL, -- Array of decision objects
  final_context JSONB, -- Array of final context documents
  final_confidence REAL CHECK (final_confidence >= 0.0 AND final_confidence <= 1.0),
  total_iterations INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  model_used TEXT,
  organization TEXT NOT NULL,
  division TEXT,
  app_under_test TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for fast queries

-- Indexes for rlhf_feedback
CREATE INDEX IF NOT EXISTS idx_rlhf_query_embedding 
  ON rlhf_feedback 
  USING ivfflat (query_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_rlhf_curator 
  ON rlhf_feedback(curator_email);

CREATE INDEX IF NOT EXISTS idx_rlhf_app 
  ON rlhf_feedback(organization, division, app_under_test);

CREATE INDEX IF NOT EXISTS idx_rlhf_session 
  ON rlhf_feedback(session_id);

CREATE INDEX IF NOT EXISTS idx_rlhf_type 
  ON rlhf_feedback(feedback_type);

CREATE INDEX IF NOT EXISTS idx_rlhf_created 
  ON rlhf_feedback(created_at DESC);

-- Indexes for retrieval_reinforcement
CREATE INDEX IF NOT EXISTS idx_reinforcement_query_embedding 
  ON retrieval_reinforcement 
  USING ivfflat (query_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_reinforcement_curator 
  ON retrieval_reinforcement(curator_email);

CREATE INDEX IF NOT EXISTS idx_reinforcement_app 
  ON retrieval_reinforcement(organization, division, app_under_test);

CREATE INDEX IF NOT EXISTS idx_reinforcement_created 
  ON retrieval_reinforcement(created_at DESC);

-- Indexes for agent_execution_logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_query_embedding 
  ON agent_execution_logs 
  USING ivfflat (query_embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_agent_logs_session 
  ON agent_execution_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_app 
  ON agent_execution_logs(organization, division, app_under_test);

CREATE INDEX IF NOT EXISTS idx_agent_logs_created 
  ON agent_execution_logs(created_at DESC);

-- Step 5: Function to find similar feedback for a query
CREATE OR REPLACE FUNCTION find_similar_feedback(
  query_embedding vector(768),
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  match_threshold REAL DEFAULT 0.85,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  query TEXT,
  feedback_type TEXT,
  feedback_value JSONB,
  relevant_doc_ids TEXT[],
  irrelevant_doc_ids TEXT[],
  manual_boosts JSONB,
  similarity REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.query_text,
    fb.feedback_type,
    fb.feedback_value,
    rr.relevant_doc_ids,
    rr.irrelevant_doc_ids,
    rr.manual_boosts,
    1 - (rr.query_embedding <=> find_similar_feedback.query_embedding) AS similarity
  FROM retrieval_reinforcement rr
  LEFT JOIN rlhf_feedback fb ON fb.session_id = rr.context
  WHERE 
    rr.organization = p_organization
    AND (p_division IS NULL OR rr.division = p_division)
    AND (p_app_under_test IS NULL OR rr.app_under_test = p_app_under_test)
    AND 1 - (rr.query_embedding <=> find_similar_feedback.query_embedding) > match_threshold
  ORDER BY rr.query_embedding <=> find_similar_feedback.query_embedding
  LIMIT match_count;
END;
$$;

-- Step 6: Function to get RLHF stats
CREATE OR REPLACE FUNCTION get_rlhf_stats(
  p_organization TEXT DEFAULT NULL,
  p_division TEXT DEFAULT NULL,
  p_app_under_test TEXT DEFAULT NULL,
  p_curator_email TEXT DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_feedback BIGINT,
  positive_feedback BIGINT,
  negative_feedback BIGINT,
  avg_rating NUMERIC,
  total_reinforcements BIGINT,
  unique_sessions BIGINT,
  unique_curators BIGINT,
  feedback_by_type JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH feedback_stats AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE feedback_type IN ('thumbs_up', 'rating') AND (feedback_value->>'score')::numeric > 3) as positive,
      COUNT(*) FILTER (WHERE feedback_type IN ('thumbs_down', 'rating') AND (feedback_value->>'score')::numeric <= 3) as negative,
      AVG((feedback_value->>'score')::numeric) FILTER (WHERE feedback_type = 'rating') as avg_rating,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT curator_email) as curators,
      jsonb_object_agg(
        feedback_type,
        COUNT(*)
      ) as by_type
    FROM rlhf_feedback
    WHERE 
      created_at >= NOW() - (days_back || ' days')::interval
      AND (p_organization IS NULL OR organization = p_organization)
      AND (p_division IS NULL OR division = p_division)
      AND (p_app_under_test IS NULL OR app_under_test = p_app_under_test)
      AND (p_curator_email IS NULL OR curator_email = p_curator_email)
  ),
  reinforcement_stats AS (
    SELECT COUNT(*) as total
    FROM retrieval_reinforcement
    WHERE 
      created_at >= NOW() - (days_back || ' days')::interval
      AND (p_organization IS NULL OR organization = p_organization)
      AND (p_division IS NULL OR division = p_division)
      AND (p_app_under_test IS NULL OR app_under_test = p_app_under_test)
      AND (p_curator_email IS NULL OR curator_email = p_curator_email)
  )
  SELECT 
    fs.total,
    fs.positive,
    fs.negative,
    fs.avg_rating,
    rs.total,
    fs.sessions,
    fs.curators,
    fs.by_type
  FROM feedback_stats fs, reinforcement_stats rs;
END;
$$;

-- Step 7: Enable RLS
ALTER TABLE rlhf_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE retrieval_reinforcement ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS Policies for rlhf_feedback

-- Allow authenticated users to read their own feedback
CREATE POLICY "Users can read own feedback"
  ON rlhf_feedback
  FOR SELECT
  TO authenticated
  USING (curator_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow users with rlhf_feedback permission to insert
CREATE POLICY "Curators can insert feedback"
  ON rlhf_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    curator_email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Allow service role full access
CREATE POLICY "Service role full access on rlhf_feedback"
  ON rlhf_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 9: RLS Policies for retrieval_reinforcement (same pattern)

CREATE POLICY "Users can read own reinforcement signals"
  ON retrieval_reinforcement
  FOR SELECT
  TO authenticated
  USING (curator_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Curators can insert reinforcement signals"
  ON retrieval_reinforcement
  FOR INSERT
  TO authenticated
  WITH CHECK (
    curator_email = current_setting('request.jwt.claims', true)::json->>'email'
  );

CREATE POLICY "Service role full access on retrieval_reinforcement"
  ON retrieval_reinforcement
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 10: RLS Policies for agent_execution_logs

-- Allow all authenticated users to read agent logs (for learning)
CREATE POLICY "Authenticated users can read agent logs"
  ON agent_execution_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role full access
CREATE POLICY "Service role full access on agent_logs"
  ON agent_execution_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 11: Grant permissions on functions
GRANT EXECUTE ON FUNCTION find_similar_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_feedback TO service_role;
GRANT EXECUTE ON FUNCTION get_rlhf_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_rlhf_stats TO service_role;

-- Step 12: Add triggers for updated_at
CREATE TRIGGER update_rlhf_feedback_updated_at
  BEFORE UPDATE ON rlhf_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retrieval_reinforcement_updated_at
  BEFORE UPDATE ON retrieval_reinforcement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Add comments for documentation
COMMENT ON TABLE rlhf_feedback IS 'Stores human feedback on AI responses for reinforcement learning';
COMMENT ON TABLE retrieval_reinforcement IS 'Stores reinforcement signals for optimizing retrieval';
COMMENT ON TABLE agent_execution_logs IS 'Logs agent decision-making process for agentic RAG';
COMMENT ON FUNCTION find_similar_feedback IS 'Find similar past feedback for a query embedding';
COMMENT ON FUNCTION get_rlhf_stats IS 'Get aggregated RLHF statistics';

-- Done!
SELECT 'RLHF feedback schema created successfully! 🎯' as status;

