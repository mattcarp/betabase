-- RLHF Demo Data Seed Script
-- Purpose: Create realistic synthetic data for demonstrating the RLHF workflow
-- All synthetic data is clearly marked with [SYNTHETIC-DEMO] prefix
-- Date: 2025-12-16
-- Author: Claudette (Long-Running Agent Session)

-- =============================================================================
-- Clear any existing demo data (safety)
-- =============================================================================
DELETE FROM rlhf_feedback WHERE session_id LIKE 'SYNTHETIC-DEMO-%';
DELETE FROM retrieval_reinforcement WHERE context LIKE 'SYNTHETIC-DEMO-%';
DELETE FROM rlhf_comparisons WHERE session_id LIKE 'SYNTHETIC-DEMO-%';

-- =============================================================================
-- Demo Scenario 1: Bad response that needs correction
-- User asked about AOMA release process, got incorrect answer
-- =============================================================================
INSERT INTO rlhf_feedback (
  id,
  session_id,
  query,
  response,
  user_query,
  ai_response,
  feedback_type,
  feedback_value,
  feedback_metadata,
  thumbs_up,
  rating,
  status,
  priority,
  severity,
  categories,
  curator_email,
  organization,
  division,
  app_under_test,
  model_used,
  rag_metadata,
  retrieved_contexts,
  created_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'SYNTHETIC-DEMO-001',
  'What is the AOMA release process?',
  'The AOMA release process involves pushing directly to production after local testing. [SYNTHETIC-DEMO: This is intentionally incorrect for demo]',
  'What is the AOMA release process?',
  'The AOMA release process involves pushing directly to production after local testing. [SYNTHETIC-DEMO: This is intentionally incorrect for demo]',
  'thumbs_down',
  '{"score": 1, "comment": "Completely wrong - we have staging environments"}'::jsonb,
  '{"synthetic": true, "demo_scenario": "bad_response_correction", "model": "gemini-2.5-pro"}'::jsonb,
  false,
  1,
  'pending',
  10,
  'critical',
  ARRAY['factual_error', 'process_documentation'],
  'demo@thebetabase.com',
  'sony-music',
  'engineering',
  'aoma',
  'gemini-2.5-pro',
  '{"strategy": "context-aware", "confidence": 0.45, "sources_count": 2, "latency_ms": 1245}'::jsonb,
  '[{"doc_id": "doc-001", "content": "AOMA uses a multi-stage deployment pipeline...", "similarity": 0.72, "source": "internal-wiki"}, {"doc_id": "doc-002", "content": "All changes must pass QA before production...", "similarity": 0.68, "source": "confluence"}]'::jsonb,
  NOW() - INTERVAL '2 hours'
);

-- =============================================================================
-- Demo Scenario 2: Good response that should be approved
-- User asked about Sony Music catalog API, got accurate answer
-- =============================================================================
INSERT INTO rlhf_feedback (
  id,
  session_id,
  query,
  response,
  user_query,
  ai_response,
  feedback_type,
  feedback_value,
  feedback_metadata,
  thumbs_up,
  rating,
  status,
  priority,
  severity,
  categories,
  curator_email,
  organization,
  division,
  app_under_test,
  model_used,
  rag_metadata,
  retrieved_contexts,
  created_at
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'SYNTHETIC-DEMO-002',
  'How do I authenticate with the Catalog API?',
  'To authenticate with the Sony Music Catalog API, you need to: 1) Obtain OAuth2 credentials from the developer portal, 2) Request an access token using client credentials flow, 3) Include the Bearer token in all API requests. The token expires after 3600 seconds. [SYNTHETIC-DEMO: Accurate response for demo]',
  'How do I authenticate with the Catalog API?',
  'To authenticate with the Sony Music Catalog API, you need to: 1) Obtain OAuth2 credentials from the developer portal, 2) Request an access token using client credentials flow, 3) Include the Bearer token in all API requests. The token expires after 3600 seconds. [SYNTHETIC-DEMO: Accurate response for demo]',
  'thumbs_up',
  '{"score": 5, "comment": "Perfect explanation with correct steps"}'::jsonb,
  '{"synthetic": true, "demo_scenario": "good_response_approval", "model": "gemini-2.5-pro"}'::jsonb,
  true,
  5,
  'pending',
  5,
  'minor',
  ARRAY['api_documentation', 'authentication'],
  'demo@thebetabase.com',
  'sony-music',
  'platform',
  'aoma',
  'gemini-2.5-pro',
  '{"strategy": "agentic", "confidence": 0.92, "sources_count": 4, "latency_ms": 2341}'::jsonb,
  '[{"doc_id": "api-001", "content": "OAuth2 authentication for Catalog API...", "similarity": 0.95, "source": "api-docs"}, {"doc_id": "api-002", "content": "Token expiration and refresh handling...", "similarity": 0.89, "source": "api-docs"}]'::jsonb,
  NOW() - INTERVAL '1 hour'
);

-- =============================================================================
-- Demo Scenario 3: Partial response needing enhancement
-- User asked about error handling, got incomplete answer
-- =============================================================================
INSERT INTO rlhf_feedback (
  id,
  session_id,
  query,
  response,
  user_query,
  ai_response,
  feedback_type,
  feedback_value,
  feedback_metadata,
  thumbs_up,
  rating,
  status,
  priority,
  severity,
  categories,
  curator_email,
  organization,
  division,
  app_under_test,
  model_used,
  rag_metadata,
  retrieved_contexts,
  created_at
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
  'SYNTHETIC-DEMO-003',
  'What error codes does AOMA return and how should I handle them?',
  'AOMA returns standard HTTP error codes like 400, 401, 404, and 500. [SYNTHETIC-DEMO: Incomplete - missing specific AOMA codes and handling guidance]',
  'What error codes does AOMA return and how should I handle them?',
  'AOMA returns standard HTTP error codes like 400, 401, 404, and 500. [SYNTHETIC-DEMO: Incomplete - missing specific AOMA codes and handling guidance]',
  'rating',
  '{"score": 3, "comment": "Partially correct but missing AOMA-specific error codes like AOE-001 through AOE-050"}'::jsonb,
  '{"synthetic": true, "demo_scenario": "partial_response_enhancement", "model": "gemini-2.5-pro"}'::jsonb,
  null,
  3,
  'pending',
  7,
  'major',
  ARRAY['error_handling', 'api_documentation', 'incomplete_response'],
  'demo@thebetabase.com',
  'sony-music',
  'engineering',
  'aoma',
  'gemini-2.5-pro',
  '{"strategy": "basic", "confidence": 0.65, "sources_count": 1, "latency_ms": 890}'::jsonb,
  '[{"doc_id": "err-001", "content": "Standard HTTP status codes...", "similarity": 0.75, "source": "general-docs"}]'::jsonb,
  NOW() - INTERVAL '30 minutes'
);

-- =============================================================================
-- Demo Scenario 4: Already corrected response (shows the loop)
-- This was bad, got corrected, now shows improved answer
-- =============================================================================
INSERT INTO rlhf_feedback (
  id,
  session_id,
  query,
  response,
  user_query,
  ai_response,
  feedback_type,
  feedback_value,
  feedback_metadata,
  thumbs_up,
  rating,
  status,
  priority,
  severity,
  categories,
  suggested_correction,
  curator_id,
  curator_notes,
  reviewed_at,
  curator_email,
  organization,
  division,
  app_under_test,
  model_used,
  rag_metadata,
  retrieved_contexts,
  created_at
) VALUES (
  'd4e5f6a7-b8c9-0123-defa-456789012345'::uuid,
  'SYNTHETIC-DEMO-004',
  'What is the maximum file size for asset uploads?',
  'The maximum file size is 10MB. [SYNTHETIC-DEMO: Original incorrect response]',
  'What is the maximum file size for asset uploads?',
  'The maximum file size is 10MB. [SYNTHETIC-DEMO: Original incorrect response]',
  'correction',
  '{"score": 2, "original_response": "The maximum file size is 10MB.", "corrected_response": "The maximum file size for asset uploads depends on the asset type: Audio files up to 500MB, Video files up to 2GB, Images up to 50MB, Documents up to 100MB. Premium tier users have 2x limits."}'::jsonb,
  '{"synthetic": true, "demo_scenario": "corrected_response_loop", "model": "gemini-2.5-pro"}'::jsonb,
  false,
  2,
  'approved',
  8,
  'major',
  ARRAY['factual_error', 'asset_management'],
  'The maximum file size for asset uploads depends on the asset type: Audio files up to 500MB, Video files up to 2GB, Images up to 50MB, Documents up to 100MB. Premium tier users have 2x limits.',
  'curator@thebetabase.com',
  'Corrected with accurate file size limits from internal documentation. This correction should improve future responses about asset limits.',
  NOW() - INTERVAL '15 minutes',
  'demo@thebetabase.com',
  'sony-music',
  'content',
  'aoma',
  'gemini-2.5-pro',
  '{"strategy": "context-aware", "confidence": 0.55, "sources_count": 1, "latency_ms": 1123}'::jsonb,
  '[{"doc_id": "asset-001", "content": "File upload limits vary by type...", "similarity": 0.82, "source": "asset-docs"}]'::jsonb,
  NOW() - INTERVAL '3 hours'
);

-- =============================================================================
-- Demo Scenario 5: Recent chat that needs review (most recent)
-- Fresh question about integration that should be reviewed
-- =============================================================================
INSERT INTO rlhf_feedback (
  id,
  session_id,
  query,
  response,
  user_query,
  ai_response,
  feedback_type,
  feedback_value,
  feedback_metadata,
  thumbs_up,
  rating,
  status,
  priority,
  severity,
  categories,
  curator_email,
  organization,
  division,
  app_under_test,
  model_used,
  rag_metadata,
  retrieved_contexts,
  created_at
) VALUES (
  'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid,
  'SYNTHETIC-DEMO-005',
  'How do I integrate AOMA with Spotify for Artists?',
  'AOMA integrates with Spotify for Artists through the Partner API. First, register your application in the Sony Developer Portal, then configure the Spotify OAuth callback URL. The integration supports real-time streaming data sync, playlist management, and artist analytics. Use the /api/v2/integrations/spotify endpoint to initiate the connection. [SYNTHETIC-DEMO: Response to verify]',
  'How do I integrate AOMA with Spotify for Artists?',
  'AOMA integrates with Spotify for Artists through the Partner API. First, register your application in the Sony Developer Portal, then configure the Spotify OAuth callback URL. The integration supports real-time streaming data sync, playlist management, and artist analytics. Use the /api/v2/integrations/spotify endpoint to initiate the connection. [SYNTHETIC-DEMO: Response to verify]',
  'thumbs_up',
  '{"score": 4, "comment": "Good but could mention rate limits"}'::jsonb,
  '{"synthetic": true, "demo_scenario": "recent_needs_review", "model": "gemini-2.5-pro"}'::jsonb,
  true,
  4,
  'pending',
  6,
  'minor',
  ARRAY['integration', 'partner_api', 'spotify'],
  'demo@thebetabase.com',
  'sony-music',
  'platform',
  'aoma',
  'gemini-2.5-pro',
  '{"strategy": "agentic", "confidence": 0.85, "sources_count": 3, "latency_ms": 1567}'::jsonb,
  '[{"doc_id": "int-001", "content": "Partner API integration guide...", "similarity": 0.91, "source": "partner-docs"}, {"doc_id": "int-002", "content": "Spotify OAuth configuration...", "similarity": 0.87, "source": "integration-wiki"}, {"doc_id": "int-003", "content": "Streaming data sync endpoints...", "similarity": 0.84, "source": "api-docs"}]'::jsonb,
  NOW() - INTERVAL '5 minutes'
);

-- =============================================================================
-- Add retrieval reinforcement signals for demo
-- =============================================================================
INSERT INTO retrieval_reinforcement (
  id,
  query_text,
  relevant_doc_ids,
  irrelevant_doc_ids,
  manual_boosts,
  context,
  strength,
  curator_email,
  organization,
  division,
  app_under_test,
  created_at
) VALUES (
  'f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid,
  'AOMA release process',
  ARRAY['release-doc-001', 'deploy-guide-002', 'staging-doc-003'],
  ARRAY['old-release-doc-deprecated'],
  '{"source_type": "confluence", "boost": 1.5}'::jsonb,
  'SYNTHETIC-DEMO-001',
  0.9,
  'demo@thebetabase.com',
  'sony-music',
  'engineering',
  'aoma',
  NOW() - INTERVAL '1 hour'
);

-- =============================================================================
-- Add comparison data for DPO training demo
-- =============================================================================
INSERT INTO rlhf_comparisons (
  id,
  query,
  response_a,
  response_b,
  model_a,
  model_b,
  preferred_response,
  preference_strength,
  reason,
  context_documents,
  session_id,
  annotator_email,
  organization,
  division,
  app_under_test,
  created_at
) VALUES (
  'a7b8c9d0-e1f2-3456-abcd-789012345678'::uuid,
  'What is the recommended way to handle API rate limiting in AOMA?',
  'Use exponential backoff with a maximum of 5 retries. [SYNTHETIC-DEMO: Response A - Basic]',
  'Implement exponential backoff starting at 1 second, doubling each retry up to 32 seconds maximum, with a maximum of 5 retries. Add jitter (random 0-1 second delay) to prevent thundering herd. Log all rate limit events to your monitoring system and consider implementing a circuit breaker pattern for sustained rate limiting. [SYNTHETIC-DEMO: Response B - Comprehensive]',
  'gemini-1.5-flash',
  'gemini-2.5-pro',
  'B',
  0.95,
  'Response B provides comprehensive guidance including jitter, monitoring, and circuit breaker patterns which are essential for production systems.',
  '[{"doc_id": "rate-001", "content": "Rate limiting best practices..."}]'::jsonb,
  'SYNTHETIC-DEMO-COMPARE-001',
  'curator@thebetabase.com',
  'sony-music',
  'engineering',
  'aoma',
  NOW() - INTERVAL '45 minutes'
);

-- =============================================================================
-- Summary
-- =============================================================================
SELECT 
  'RLHF Demo Data Seeded Successfully!' as status,
  (SELECT COUNT(*) FROM rlhf_feedback WHERE session_id LIKE 'SYNTHETIC-DEMO-%') as feedback_count,
  (SELECT COUNT(*) FROM retrieval_reinforcement WHERE context LIKE 'SYNTHETIC-DEMO-%') as reinforcement_count,
  (SELECT COUNT(*) FROM rlhf_comparisons WHERE session_id LIKE 'SYNTHETIC-DEMO-%') as comparison_count;

