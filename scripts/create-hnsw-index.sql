-- Create HNSW index on aoma_unified_vectors.embedding for improved vector search performance
-- HNSW (Hierarchical Navigable Small World) is optimized for approximate nearest neighbor search

-- First, check if the index already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'aoma_unified_vectors'
        AND indexname = 'aoma_unified_vectors_embedding_hnsw_idx'
    ) THEN
        -- Create the HNSW index
        CREATE INDEX aoma_unified_vectors_embedding_hnsw_idx
        ON aoma_unified_vectors
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);

        RAISE NOTICE 'HNSW index created successfully';
    ELSE
        RAISE NOTICE 'HNSW index already exists';
    END IF;
END $$;

-- Verify the index was created
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'aoma_unified_vectors'
AND indexname = 'aoma_unified_vectors_embedding_hnsw_idx';
