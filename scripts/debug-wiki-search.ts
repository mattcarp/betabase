#!/usr/bin/env npx tsx
/**
 * Debug: Test wiki_documents RPC directly
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugWikiSearch() {
  console.log("🔍 Debug: Testing wiki_documents search directly\n");

  // Step 1: Generate OpenAI embedding
  console.log("1. Generating OpenAI embedding for 'What is AOMA?'...");
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: "What is AOMA?",
  });
  console.log(`   ✅ Got ${embedding.length}d embedding`);

  // Step 2: Check what app_names exist
  console.log("\n2. Checking app_names in wiki_documents...");
  const { data: appNames } = await supabase
    .from("wiki_documents")
    .select("app_name")
    .limit(5);
  console.log("   Sample app_names:", appNames?.map(a => a.app_name));

  // Step 3: Call RPC with 'AOMA' filter
  console.log("\n3. Calling match_wiki_documents RPC with app_name='AOMA'...");
  const { data: aomaResults, error: aomaError } = await supabase.rpc("match_wiki_documents", {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
    app_name_filter: "AOMA",
  });
  
  if (aomaError) {
    console.log("   ❌ Error:", aomaError);
  } else {
    console.log(`   ✅ Results: ${aomaResults?.length || 0}`);
    if (aomaResults?.length > 0) {
      aomaResults.forEach((r: any, i: number) => {
        console.log(`   ${i+1}. ${(r.similarity * 100).toFixed(1)}% - ${r.title?.substring(0, 60)}`);
      });
    }
  }

  // Step 4: Try without filter (NULL)
  console.log("\n4. Calling match_wiki_documents RPC with NO app_name filter...");
  const { data: allResults, error: allError } = await supabase.rpc("match_wiki_documents", {
    query_embedding: embedding,
    match_threshold: 0.2,
    match_count: 5,
  });
  
  if (allError) {
    console.log("   ❌ Error:", allError);
  } else {
    console.log(`   ✅ Results: ${allResults?.length || 0}`);
    if (allResults?.length > 0) {
      allResults.forEach((r: any, i: number) => {
        console.log(`   ${i+1}. ${(r.similarity * 100).toFixed(1)}% - ${r.title?.substring(0, 60)}`);
      });
    }
  }

  // Step 5: Raw similarity check - just select top docs by cosine similarity
  console.log("\n5. Direct query: checking if embeddings exist and dimensions match...");
  const { data: sampleDoc } = await supabase
    .from("wiki_documents")
    .select("id, title, app_name")
    .eq("app_name", "AOMA")
    .not("embedding", "is", null)
    .limit(3);
  console.log("   Sample docs with embeddings:", sampleDoc);

  // Step 6: Check embedding dimensions in the table
  console.log("\n6. Checking embedding dimensions in wiki_documents...");
  const { data: dimCheck, error: dimError } = await supabase.rpc("check_wiki_embedding_dims");
  if (dimError) {
    // Function might not exist, try raw SQL via a simple query
    console.log("   (Skipping - need to check manually)");
  } else {
    console.log("   Dimensions:", dimCheck);
  }

  console.log("\n✅ Debug complete");
}

debugWikiSearch().catch(console.error);
