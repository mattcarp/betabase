-- Firecrawl Analysis Table for AOMA UI Intelligence
-- This stores crawled UI data to enhance Computer Use training
-- Target: 38% → 70-80% success rate improvement
-- Date: 2025-08-25

-- Create the firecrawl_analysis table
CREATE TABLE IF NOT EXISTS firecrawl_analysis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  page_title TEXT NOT NULL,
  ui_elements JSONB DEFAULT '{}',
  selectors JSONB DEFAULT '{}',
  navigation_paths TEXT[] DEFAULT '{}',
  testable_features TEXT[] DEFAULT '{}',
  user_flows JSONB DEFAULT '{}',
  embedding vector(1536), -- For semantic search
  metadata JSONB DEFAULT '{}',
  crawled_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS firecrawl_analysis_url_idx 
  ON firecrawl_analysis(url);

CREATE INDEX IF NOT EXISTS firecrawl_analysis_embedding_idx 
  ON firecrawl_analysis 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS firecrawl_analysis_metadata_idx 
  ON firecrawl_analysis 
  USING gin(metadata);

CREATE INDEX IF NOT EXISTS firecrawl_analysis_crawled_at_idx 
  ON firecrawl_analysis(crawled_at DESC);

-- Full text search on page titles
CREATE INDEX IF NOT EXISTS firecrawl_analysis_title_search_idx 
  ON firecrawl_analysis 
  USING gin(to_tsvector('english', page_title));

-- Function to search firecrawl data by similarity
CREATE OR REPLACE FUNCTION search_firecrawl_by_similarity(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  url text,
  page_title text,
  ui_elements jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.url,
    f.page_title,
    f.ui_elements,
    1 - (f.embedding <=> query_embedding) as similarity
  FROM firecrawl_analysis f
  WHERE 
    f.embedding IS NOT NULL
    AND (1 - (f.embedding <=> query_embedding)) > match_threshold
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get UI elements for Computer Use
CREATE OR REPLACE FUNCTION get_ui_elements_for_training(
  p_url text
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'url', url,
    'title', page_title,
    'elements', ui_elements,
    'selectors', selectors,
    'navigation', navigation_paths,
    'features', testable_features,
    'flows', user_flows,
    'crawled_at', crawled_at
  ) INTO v_result
  FROM firecrawl_analysis
  WHERE url = p_url
  ORDER BY crawled_at DESC
  LIMIT 1;
  
  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT ALL ON firecrawl_analysis TO authenticated;
GRANT EXECUTE ON FUNCTION search_firecrawl_by_similarity TO authenticated;
GRANT EXECUTE ON FUNCTION get_ui_elements_for_training TO authenticated;

-- Add comment
COMMENT ON TABLE firecrawl_analysis IS 'Stores crawled AOMA UI data for Computer Use training enhancement';
