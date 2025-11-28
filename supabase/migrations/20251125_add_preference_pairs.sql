-- Migration: Add preference_pairs table for DPO training data
-- This is the KEY table that enables real RLHF

-- First, add the correction column to rlhf_feedback if it doesn't exist
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS correction TEXT;

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS curator_approved BOOLEAN DEFAULT FALSE;

-- Create the preference_pairs table for DPO training export
CREATE TABLE IF NOT EXISTS preference_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The preference pair (the core training data)
  prompt TEXT NOT NULL,          -- Original query
  chosen TEXT NOT NULL,          -- Preferred response (the correction)
  rejected TEXT NOT NULL,        -- Original response (what it said wrong)

  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN ('user_correction', 'curator_edit', 'a_b_test', 'synthetic')),
  source_feedback_id UUID REFERENCES rlhf_feedback(id) ON DELETE SET NULL,

  -- Quality signals
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  curator_verified BOOLEAN DEFAULT FALSE,
  curator_email TEXT,
  verification_notes TEXT,

  -- Metadata for training
  domain TEXT DEFAULT 'aoma',           -- Knowledge domain
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  response_length_chosen INTEGER,       -- Token count approximation
  response_length_rejected INTEGER,

  -- Export tracking
  exported_at TIMESTAMPTZ,              -- When exported for training
  export_batch TEXT,                    -- Which training batch

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_preference_pairs_verified ON preference_pairs(curator_verified);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_exported ON preference_pairs(exported_at);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_source ON preference_pairs(source_type);

-- Create a view for export-ready pairs
CREATE OR REPLACE VIEW dpo_training_data AS
SELECT
  prompt,
  chosen,
  rejected,
  confidence,
  domain
FROM preference_pairs
WHERE curator_verified = TRUE
  AND exported_at IS NULL
ORDER BY created_at DESC;

-- Function to automatically create preference pair when correction is added
CREATE OR REPLACE FUNCTION create_preference_pair_from_correction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create pair if correction is provided and it's different from response
  IF NEW.correction IS NOT NULL
     AND NEW.correction != ''
     AND NEW.correction != NEW.response
     AND (OLD.correction IS NULL OR OLD.correction = '') THEN

    INSERT INTO preference_pairs (
      prompt,
      chosen,
      rejected,
      source_type,
      source_feedback_id,
      confidence,
      response_length_chosen,
      response_length_rejected
    ) VALUES (
      NEW.query,
      NEW.correction,
      NEW.response,
      'user_correction',
      NEW.id,
      CASE
        WHEN NEW.rating <= 2 THEN 0.9  -- Low rating = high confidence this was wrong
        WHEN NEW.rating = 3 THEN 0.7
        ELSE 0.5
      END,
      LENGTH(NEW.correction),
      LENGTH(NEW.response)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create preference pairs
DROP TRIGGER IF EXISTS trigger_create_preference_pair ON rlhf_feedback;
CREATE TRIGGER trigger_create_preference_pair
  AFTER UPDATE OF correction ON rlhf_feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_preference_pair_from_correction();

-- RLS Policies
ALTER TABLE preference_pairs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read preference pairs
CREATE POLICY "Allow read preference_pairs" ON preference_pairs
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow curators to insert/update preference pairs
CREATE POLICY "Allow curator insert preference_pairs" ON preference_pairs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow curator update preference_pairs" ON preference_pairs
  FOR UPDATE
  TO authenticated
  USING (true);

-- Comment for documentation
COMMENT ON TABLE preference_pairs IS 'DPO training data: preference pairs of (prompt, chosen, rejected) for fine-tuning';
COMMENT ON COLUMN preference_pairs.chosen IS 'The preferred/correct response - used as positive example in DPO';
COMMENT ON COLUMN preference_pairs.rejected IS 'The original/incorrect response - used as negative example in DPO';
