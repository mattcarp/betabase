-- Rollback script for Jira migration to unified vectors
-- Run this if migration causes issues

-- 1. Remove all Jira vectors from unified table
DELETE FROM siam_vectors
WHERE source_type = 'jira';

-- 2. Drop the upsert function if needed
DROP FUNCTION IF EXISTS upsert_aoma_vector(text, vector, text, text, jsonb);

-- Verify rollback
SELECT
  'Rollback complete!' as status,
  COUNT(*) as remaining_unified_vectors,
  COUNT(*) FILTER (WHERE source_type = 'jira') as remaining_jira_vectors
FROM siam_vectors;
