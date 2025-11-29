-- Add status column to rlhf_feedback table
-- This column tracks the review status of feedback items

ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected', 'reviewed'));

-- Add model_used column if missing (referenced in export API)
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS model_used TEXT;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_rlhf_status ON rlhf_feedback(status);

-- Add reviewed_at timestamp for tracking when feedback was reviewed
ALTER TABLE rlhf_feedback
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

COMMENT ON COLUMN rlhf_feedback.status IS 'Review status: pending, approved, rejected, reviewed';
