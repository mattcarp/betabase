-- RLHF Fine-Tuning Schema Extension
-- Adds tables for training datasets, fine-tuning jobs, model registry, and A/B testing
-- Date: 2025-11-25

-- =============================================================================
-- Table 1: Training Datasets
-- Manages curated training datasets from human feedback
-- =============================================================================
CREATE TABLE IF NOT EXISTS training_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  dataset_type TEXT NOT NULL CHECK (dataset_type IN ('preference_pairs', 'instruction_tuning', 'dpo', 'sft')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'curating', 'ready', 'exported', 'archived')),
  feedback_ids uuid[] DEFAULT '{}', -- References to rlhf_feedback
  sample_count INTEGER DEFAULT 0,
  quality_score REAL CHECK (quality_score >= 0.0 AND quality_score <= 1.0),
  export_format TEXT CHECK (export_format IN ('jsonl', 'parquet', 'openai', 'anthropic', 'huggingface')),
  export_url TEXT, -- S3/GCS URL for exported dataset
  validation_results JSONB DEFAULT '{}', -- Quality checks, format validation
  tags TEXT[] DEFAULT '{}',
  organization TEXT NOT NULL,
  division TEXT,
  curator_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE training_datasets IS 'Curated training datasets built from human feedback for model fine-tuning';

-- =============================================================================
-- Table 2: Preference Pairs
-- Human preference comparisons for DPO/RLHF training
-- =============================================================================
CREATE TABLE IF NOT EXISTS preference_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES training_datasets(id) ON DELETE CASCADE,
  feedback_id uuid REFERENCES rlhf_feedback(id) ON DELETE SET NULL, -- Original feedback source
  query TEXT NOT NULL, -- The user question/prompt
  chosen_response TEXT NOT NULL, -- Human-preferred response
  rejected_response TEXT NOT NULL, -- Human-rejected response
  preference_strength REAL DEFAULT 1.0 CHECK (preference_strength >= 0.0 AND preference_strength <= 1.0),
  context_documents JSONB DEFAULT '[]', -- RAG context used
  system_prompt TEXT, -- System prompt if applicable
  annotator_email TEXT NOT NULL,
  annotation_notes TEXT,
  quality_flags JSONB DEFAULT '{}', -- Flags for filtering (e.g., low_confidence, needs_review)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE preference_pairs IS 'Human preference comparisons between response pairs for DPO training';

-- =============================================================================
-- Table 3: Fine-Tuning Jobs
-- Tracks fine-tuning job execution across providers
-- =============================================================================
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES training_datasets(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'huggingface', 'bedrock', 'vertex', 'custom')),
  base_model TEXT NOT NULL, -- e.g., "gpt-4o-mini-2024-07-18", "claude-3-haiku"
  provider_job_id TEXT, -- Provider's job ID (e.g., OpenAI's ftjob-abc123)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'validating', 'queued', 'training', 'completed', 'failed', 'cancelled'
  )),
  hyperparameters JSONB DEFAULT '{}', -- n_epochs, learning_rate, batch_size, etc.
  training_config JSONB DEFAULT '{}', -- Provider-specific config
  training_metrics JSONB DEFAULT '{}', -- Loss curves, epochs, steps, etc.
  validation_metrics JSONB DEFAULT '{}', -- Eval set performance
  resulting_model_id TEXT, -- Provider's model ID after completion
  samples_used INTEGER,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  training_tokens INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  error_details JSONB,
  organization TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE fine_tuning_jobs IS 'Fine-tuning job orchestration and tracking across AI providers';

-- =============================================================================
-- Table 4: Model Registry
-- Version control for fine-tuned models
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Human-readable name (e.g., "aoma-support")
  display_name TEXT, -- Display name for UI
  description TEXT,
  model_id TEXT NOT NULL, -- Provider's model ID
  provider TEXT NOT NULL,
  base_model TEXT NOT NULL,
  fine_tuning_job_id uuid REFERENCES fine_tuning_jobs(id) ON DELETE SET NULL,
  version TEXT NOT NULL DEFAULT '1.0.0', -- Semver
  status TEXT NOT NULL DEFAULT 'testing' CHECK (status IN (
    'testing', 'staged', 'deployed', 'deprecated', 'archived'
  )),
  performance_metrics JSONB DEFAULT '{}', -- Accuracy, latency, quality scores
  deployment_config JSONB DEFAULT '{}', -- Temperature, max_tokens, etc.
  capabilities TEXT[] DEFAULT '{}', -- Tags for model capabilities
  training_summary JSONB DEFAULT '{}', -- Summary of training data and process
  organization TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,

  UNIQUE(organization, name, version)
);

COMMENT ON TABLE model_registry IS 'Version-controlled registry of fine-tuned models';

-- =============================================================================
-- Table 5: A/B Test Experiments
-- A/B testing framework for comparing model versions
-- =============================================================================
CREATE TABLE IF NOT EXISTS ab_test_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT, -- What we're testing
  control_model_id uuid REFERENCES model_registry(id) ON DELETE RESTRICT,
  treatment_model_id uuid REFERENCES model_registry(id) ON DELETE RESTRICT,
  traffic_split REAL DEFAULT 0.5 CHECK (traffic_split >= 0.0 AND traffic_split <= 1.0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'running', 'paused', 'completed', 'cancelled'
  )),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  min_samples INTEGER DEFAULT 100, -- Minimum samples before analysis
  success_metrics JSONB DEFAULT '{}', -- What to measure
  segment_filters JSONB DEFAULT '{}', -- User/query segments to include
  results JSONB DEFAULT '{}', -- Statistical analysis results
  winner TEXT CHECK (winner IN ('control', 'treatment', 'inconclusive', NULL)),
  confidence_level REAL, -- Statistical confidence
  organization TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ab_test_experiments IS 'A/B testing experiments comparing fine-tuned model versions';

-- =============================================================================
-- Table 6: A/B Test Observations
-- Individual observations during A/B tests
-- =============================================================================
CREATE TABLE IF NOT EXISTS ab_test_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid REFERENCES ab_test_experiments(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('control', 'treatment')),
  session_id TEXT,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  model_id uuid REFERENCES model_registry(id),
  latency_ms INTEGER,
  feedback_type TEXT,
  feedback_score REAL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ab_test_observations IS 'Individual observations during A/B test experiments';

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Training Datasets indexes
CREATE INDEX IF NOT EXISTS idx_training_datasets_status ON training_datasets(status);
CREATE INDEX IF NOT EXISTS idx_training_datasets_org ON training_datasets(organization);
CREATE INDEX IF NOT EXISTS idx_training_datasets_curator ON training_datasets(curator_email);
CREATE INDEX IF NOT EXISTS idx_training_datasets_created ON training_datasets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_datasets_type ON training_datasets(dataset_type);

-- Preference Pairs indexes
CREATE INDEX IF NOT EXISTS idx_preference_pairs_dataset ON preference_pairs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_annotator ON preference_pairs(annotator_email);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_created ON preference_pairs(created_at DESC);

-- Fine-Tuning Jobs indexes
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_dataset ON fine_tuning_jobs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_provider ON fine_tuning_jobs(provider);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_org ON fine_tuning_jobs(organization);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_jobs_created ON fine_tuning_jobs(created_at DESC);

-- Model Registry indexes
CREATE INDEX IF NOT EXISTS idx_model_registry_status ON model_registry(status);
CREATE INDEX IF NOT EXISTS idx_model_registry_org ON model_registry(organization);
CREATE INDEX IF NOT EXISTS idx_model_registry_name ON model_registry(name);
CREATE INDEX IF NOT EXISTS idx_model_registry_provider ON model_registry(provider);

-- A/B Test indexes
CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON ab_test_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_org ON ab_test_experiments(organization);
CREATE INDEX IF NOT EXISTS idx_ab_observations_experiment ON ab_test_observations(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_observations_variant ON ab_test_observations(variant);
CREATE INDEX IF NOT EXISTS idx_ab_observations_created ON ab_test_observations(created_at DESC);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE training_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE preference_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_observations ENABLE ROW LEVEL SECURITY;

-- Training Datasets RLS
CREATE POLICY "Users can read org training datasets" ON training_datasets
  FOR SELECT TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Curators can manage training datasets" ON training_datasets
  FOR ALL TO authenticated
  USING (curator_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (curator_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role full access training_datasets" ON training_datasets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Preference Pairs RLS
CREATE POLICY "Users can read preference pairs" ON preference_pairs
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM training_datasets td
    WHERE td.id = preference_pairs.dataset_id
    AND td.organization = current_setting('request.jwt.claims', true)::json->>'organization'
  ));

CREATE POLICY "Annotators can manage preference pairs" ON preference_pairs
  FOR ALL TO authenticated
  USING (annotator_email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (annotator_email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role full access preference_pairs" ON preference_pairs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Fine-Tuning Jobs RLS
CREATE POLICY "Users can read org fine-tuning jobs" ON fine_tuning_jobs
  FOR SELECT TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Users can create fine-tuning jobs" ON fine_tuning_jobs
  FOR INSERT TO authenticated
  WITH CHECK (created_by = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Service role full access fine_tuning_jobs" ON fine_tuning_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Model Registry RLS
CREATE POLICY "Users can read org models" ON model_registry
  FOR SELECT TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Users can manage org models" ON model_registry
  FOR ALL TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization')
  WITH CHECK (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Service role full access model_registry" ON model_registry
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- A/B Tests RLS
CREATE POLICY "Users can read org experiments" ON ab_test_experiments
  FOR SELECT TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Users can manage org experiments" ON ab_test_experiments
  FOR ALL TO authenticated
  USING (organization = current_setting('request.jwt.claims', true)::json->>'organization')
  WITH CHECK (organization = current_setting('request.jwt.claims', true)::json->>'organization');

CREATE POLICY "Service role full access ab_experiments" ON ab_test_experiments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- A/B Observations RLS
CREATE POLICY "Users can read org observations" ON ab_test_observations
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ab_test_experiments exp
    WHERE exp.id = ab_test_observations.experiment_id
    AND exp.organization = current_setting('request.jwt.claims', true)::json->>'organization'
  ));

CREATE POLICY "Service role full access ab_observations" ON ab_test_observations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

CREATE TRIGGER update_training_datasets_updated_at
  BEFORE UPDATE ON training_datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_tuning_jobs_updated_at
  BEFORE UPDATE ON fine_tuning_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at
  BEFORE UPDATE ON ab_test_experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to get training dataset stats
CREATE OR REPLACE FUNCTION get_training_dataset_stats(p_dataset_id uuid)
RETURNS TABLE (
  total_pairs BIGINT,
  avg_preference_strength NUMERIC,
  annotators BIGINT,
  quality_distribution JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_pairs,
    ROUND(AVG(preference_strength)::numeric, 3) as avg_preference_strength,
    COUNT(DISTINCT annotator_email)::BIGINT as annotators,
    jsonb_build_object(
      'high', COUNT(*) FILTER (WHERE preference_strength >= 0.8),
      'medium', COUNT(*) FILTER (WHERE preference_strength >= 0.5 AND preference_strength < 0.8),
      'low', COUNT(*) FILTER (WHERE preference_strength < 0.5)
    ) as quality_distribution
  FROM preference_pairs
  WHERE dataset_id = p_dataset_id;
END;
$$;

-- Function to get A/B test results
CREATE OR REPLACE FUNCTION get_ab_test_results(p_experiment_id uuid)
RETURNS TABLE (
  variant TEXT,
  sample_count BIGINT,
  avg_feedback_score NUMERIC,
  avg_latency_ms NUMERIC,
  positive_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    obs.variant,
    COUNT(*)::BIGINT as sample_count,
    ROUND(AVG(feedback_score)::numeric, 3) as avg_feedback_score,
    ROUND(AVG(latency_ms)::numeric, 1) as avg_latency_ms,
    ROUND(
      (COUNT(*) FILTER (WHERE feedback_score > 0.5)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100,
      1
    ) as positive_rate
  FROM ab_test_observations obs
  WHERE obs.experiment_id = p_experiment_id
  GROUP BY obs.variant;
END;
$$;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_training_dataset_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_training_dataset_stats TO service_role;
GRANT EXECUTE ON FUNCTION get_ab_test_results TO authenticated;
GRANT EXECUTE ON FUNCTION get_ab_test_results TO service_role;

-- =============================================================================
-- Complete
-- =============================================================================
SELECT 'RLHF Fine-Tuning schema created successfully!' as status;
