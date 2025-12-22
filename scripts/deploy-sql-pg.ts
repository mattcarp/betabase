#!/usr/bin/env npx tsx
/**
 * Deploy Hybrid Search SQL via pg client
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import pg from "pg";

// Supabase project ref from URL
const projectRef = "kfxetwuuzljhybfgmpuc";

// Connection via Supabase Transaction Pooler (uses service role key as password)
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

const SQL = `
-- BM25/Full-Text Search Function
CREATE OR REPLACE FUNCTION search_siam_hybrid(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  p_query TEXT,
  p_match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  bm25_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    ts_rank_cd(
      to_tsvector('english', v.content),
      plainto_tsquery('english', p_query),
      32
    ) as bm25_rank
  FROM siam_vectors v
  WHERE v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND to_tsvector('english', v.content) @@ plainto_tsquery('english', p_query)
  ORDER BY bm25_rank DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;

-- GIN Index for Fast Text Search  
CREATE INDEX IF NOT EXISTS idx_siam_vectors_content_gin 
ON siam_vectors USING gin(to_tsvector('english', content));

-- Phrase Search Function
CREATE OR REPLACE FUNCTION search_siam_phrase(
  p_organization TEXT,
  p_division TEXT,
  p_app_under_test TEXT,
  p_phrase TEXT,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_type TEXT,
  source_id TEXT,
  metadata JSONB,
  phrase_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id,
    v.content,
    v.source_type,
    v.source_id,
    v.metadata,
    ts_rank_cd(
      to_tsvector('english', v.content),
      phraseto_tsquery('english', p_phrase),
      32
    ) as phrase_rank
  FROM siam_vectors v
  WHERE v.organization = p_organization
    AND v.division = p_division
    AND v.app_under_test = p_app_under_test
    AND to_tsvector('english', v.content) @@ phraseto_tsquery('english', p_phrase)
  ORDER BY phrase_rank DESC
  LIMIT p_match_count;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
  console.log("🚀 Deploying Hybrid Search SQL Functions...\n");
  
  const client = new pg.Client({ connectionString });
  
  try {
    console.log("📡 Connecting to Supabase...");
    await client.connect();
    console.log("   ✅ Connected!\n");
    
    console.log("📝 Executing SQL...");
    await client.query(SQL);
    console.log("   ✅ Functions created!\n");
    
    // Test
    console.log("🧪 Testing search_siam_hybrid...");
    const result = await client.query(`
      SELECT * FROM search_siam_hybrid(
        'sony-music', 
        'digital-operations', 
        'aoma', 
        'AOMA',
        5
      )
    `);
    console.log(`   ✅ Found ${result.rows.length} results for 'AOMA'`);
    
    if (result.rows.length > 0) {
      console.log(`   Top result: ${result.rows[0].content?.substring(0, 50)}...`);
    }
    
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    
    if (err.message.includes("password authentication failed")) {
      console.log("\n💡 The service role key may not work for direct DB access.");
      console.log("   Please run the SQL manually in Supabase Dashboard:");
      console.log("   https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql/new");
    }
  } finally {
    await client.end();
  }
}

deploy();
