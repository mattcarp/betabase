#!/usr/bin/env npx tsx
/**
 * Deploy Hybrid Search SQL Functions
 * 
 * Run: npx tsx scripts/deploy-hybrid-sql.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const SQL_FUNCTIONS = `
-- Hybrid Search SQL Functions for SIAM RAG System

-- 1. BM25/Full-Text Search Function
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
`;

const INDEX_SQL = `
-- GIN Index for Fast Text Search
CREATE INDEX IF NOT EXISTS idx_siam_vectors_content_gin 
ON siam_vectors USING gin(to_tsvector('english', content));
`;

async function deploy() {
  console.log("🚀 Deploying Hybrid Search SQL Functions...\n");

  // Deploy main function
  console.log("📝 Creating search_siam_hybrid function...");
  const { error: funcError } = await supabase.rpc('exec_sql', { 
    sql: SQL_FUNCTIONS 
  }).maybeSingle();

  // If exec_sql doesn't exist, try raw SQL via REST
  if (funcError) {
    console.log("   Using direct SQL execution...");
    
    // Use the Supabase SQL endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/search_siam_hybrid`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_organization: 'test',
          p_division: 'test', 
          p_app_under_test: 'test',
          p_query: 'test',
          p_match_count: 1
        })
      }
    );
    
    if (response.ok) {
      console.log("   ✅ Function already exists!");
    } else {
      const errorText = await response.text();
      if (errorText.includes("function") && errorText.includes("does not exist")) {
        console.log("   ⚠️ Function does not exist. Please run the SQL manually in Supabase Dashboard:");
        console.log("   https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql/new");
        console.log("\n   SQL to run:");
        console.log("   " + "-".repeat(60));
        console.log(SQL_FUNCTIONS);
        console.log("   " + "-".repeat(60));
        console.log("\n   Also create the index:");
        console.log(INDEX_SQL);
      } else {
        console.log("   Response:", errorText);
      }
    }
  } else {
    console.log("   ✅ Function created!");
  }

  // Test if function exists
  console.log("\n📊 Testing function...");
  const { data, error } = await supabase.rpc('search_siam_hybrid', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    p_query: 'AOMA',
    p_match_count: 5
  });

  if (error) {
    console.log("   ❌ Function test failed:", error.message);
    if (error.message.includes("does not exist")) {
      console.log("\n   👉 Please run this SQL in Supabase Dashboard SQL Editor:");
      console.log("   https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql/new\n");
    }
  } else {
    console.log(`   ✅ Function works! Found ${data?.length || 0} results for 'AOMA'`);
  }
}

deploy().catch(console.error);
