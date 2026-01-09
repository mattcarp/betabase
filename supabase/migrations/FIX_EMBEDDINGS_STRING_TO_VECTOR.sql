/**
 * CRITICAL FIX: Convert embedding columns from TEXT/JSON strings to proper vector types
 *
 * Problem discovered 2025-01-09:
 * - embedding_gemini contains JSON strings like "[-0.030803878,0.034695674,...]"
 * - Should be vector(768) type for cosine similarity operations
 * - RPC functions fail silently because <=> operator doesn't work on TEXT
 *
 * This migration:
 * 1. Adds temporary vector columns
 * 2. Converts JSON strings to proper vector arrays
 * 3. Drops old columns and renames new ones
 */

-- First, check the current column types
DO $$
DECLARE
    col_type TEXT;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'siam_vectors' AND column_name = 'embedding_gemini';

    RAISE NOTICE 'Current embedding_gemini column type: %', col_type;
END $$;

-- Step 1: Add new vector columns (if they don't exist as vector type)
DO $$
BEGIN
    -- Check if embedding_gemini is TEXT type and needs conversion
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'siam_vectors'
        AND column_name = 'embedding_gemini'
        AND data_type IN ('text', 'character varying', 'json', 'jsonb')
    ) THEN
        RAISE NOTICE 'embedding_gemini is TEXT type, needs conversion';

        -- Add temporary vector column
        ALTER TABLE siam_vectors ADD COLUMN IF NOT EXISTS embedding_gemini_vec vector(768);

        -- Convert JSON strings to vector arrays
        UPDATE siam_vectors
        SET embedding_gemini_vec = embedding_gemini::vector(768)
        WHERE embedding_gemini IS NOT NULL
        AND embedding_gemini_vec IS NULL;

        -- Drop old column and rename new one
        ALTER TABLE siam_vectors DROP COLUMN IF EXISTS embedding_gemini;
        ALTER TABLE siam_vectors RENAME COLUMN embedding_gemini_vec TO embedding_gemini;

        RAISE NOTICE 'Successfully converted embedding_gemini to vector(768)';
    ELSE
        RAISE NOTICE 'embedding_gemini is already vector type, no conversion needed';
    END IF;
END $$;

-- Step 2: Same for OpenAI embeddings (embedding column)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'siam_vectors'
        AND column_name = 'embedding'
        AND data_type IN ('text', 'character varying', 'json', 'jsonb')
    ) THEN
        RAISE NOTICE 'embedding is TEXT type, needs conversion';

        ALTER TABLE siam_vectors ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

        UPDATE siam_vectors
        SET embedding_vec = embedding::vector(1536)
        WHERE embedding IS NOT NULL
        AND embedding_vec IS NULL;

        ALTER TABLE siam_vectors DROP COLUMN IF EXISTS embedding;
        ALTER TABLE siam_vectors RENAME COLUMN embedding_vec TO embedding;

        RAISE NOTICE 'Successfully converted embedding to vector(1536)';
    ELSE
        RAISE NOTICE 'embedding is already vector type, no conversion needed';
    END IF;
END $$;

-- Step 3: Recreate HNSW indexes for optimized search
DROP INDEX IF EXISTS idx_siam_vectors_embedding_gemini;
CREATE INDEX IF NOT EXISTS idx_siam_vectors_embedding_gemini
ON siam_vectors USING hnsw (embedding_gemini vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

DROP INDEX IF EXISTS idx_siam_vectors_embedding;
CREATE INDEX IF NOT EXISTS idx_siam_vectors_embedding
ON siam_vectors USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Verify the fix
DO $$
DECLARE
    gemini_type TEXT;
    openai_type TEXT;
    record_count INT;
BEGIN
    SELECT data_type INTO gemini_type
    FROM information_schema.columns
    WHERE table_name = 'siam_vectors' AND column_name = 'embedding_gemini';

    SELECT data_type INTO openai_type
    FROM information_schema.columns
    WHERE table_name = 'siam_vectors' AND column_name = 'embedding';

    SELECT COUNT(*) INTO record_count
    FROM siam_vectors
    WHERE embedding_gemini IS NOT NULL;

    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'embedding_gemini type: %', gemini_type;
    RAISE NOTICE 'embedding type: %', openai_type;
    RAISE NOTICE 'Records with Gemini embeddings: %', record_count;
END $$;

SELECT 'Embedding columns converted from TEXT to vector type!' as status;
