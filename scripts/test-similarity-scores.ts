#!/usr/bin/env tsx
/**
 * Test actual similarity scores for "What is AOMA?" query
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = "https://kfxetwuuzljhybfgmpuc.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjI5NjMzMywiZXhwIjoyMDUxODcyMzMzfQ.LX04PQaQFJ7Tz_USQcbMPiuROMEEVaDFywoOLTjE4xk";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testSimilarityScores() {
  console.log("🧪 Testing similarity scores for 'What is AOMA?' query...\n");

  // Generate embedding
  const query = "What is AOMA?";
  console.log(`Generating embedding for: "${query}"`);

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const embedding = response.data[0].embedding;
  console.log(`✅ Generated ${embedding.length}-dimensional embedding\n`);

  // Test with very low threshold to see ALL scores
  console.log("📊 Test 1: Threshold 0.1 (show all results)...");
  const { data: lowThreshold, error: err1 } = await supabase.rpc("match_aoma_vectors", {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 10,
    filter_source_types: ["knowledge"],
  });

  if (err1) {
    console.error("❌ Error:", err1);
  } else if (lowThreshold && lowThreshold.length > 0) {
    console.log(`✅ Found ${lowThreshold.length} results:\n`);
    lowThreshold.forEach((row: any, i: number) => {
      console.log(`${i + 1}. Similarity: ${row.similarity.toFixed(4)} (${(row.similarity * 100).toFixed(1)}%)`);
      console.log(`   Content: ${row.content.substring(0, 80)}...`);
      console.log(`   Source: ${row.source_type}\n`);
    });
  } else {
    console.log("❌ No results found even at 0.1 threshold!\n");
  }

  // Test with threshold 0.5
  console.log("\n📊 Test 2: Threshold 0.5...");
  const { data: medThreshold, error: err2 } = await supabase.rpc("match_aoma_vectors", {
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
    filter_source_types: ["knowledge"],
  });

  if (err2) {
    console.error("❌ Error:", err2);
  } else {
    console.log(`${medThreshold && medThreshold.length > 0 ? "✅" : "❌"} Found ${medThreshold?.length || 0} results at 0.5 threshold\n`);
  }

  // Test with threshold 0.78 (current default)
  console.log("📊 Test 3: Threshold 0.78 (current default)...");
  const { data: highThreshold, error: err3 } = await supabase.rpc("match_aoma_vectors", {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 10,
    filter_source_types: ["knowledge"],
  });

  if (err3) {
    console.error("❌ Error:", err3);
  } else {
    console.log(`${highThreshold && highThreshold.length > 0 ? "✅" : "❌"} Found ${highThreshold?.length || 0} results at 0.78 threshold\n`);
  }

  // Summary
  console.log("\n📋 SUMMARY:");
  console.log(`Total vectors in DB: 28`);
  console.log(`Results at 0.1 threshold: ${lowThreshold?.length || 0}`);
  console.log(`Results at 0.5 threshold: ${medThreshold?.length || 0}`);
  console.log(`Results at 0.78 threshold: ${highThreshold?.length || 0}`);

  if (lowThreshold && lowThreshold.length > 0) {
    const bestScore = lowThreshold[0].similarity;
    console.log(`\nBest similarity score: ${bestScore.toFixed(4)} (${(bestScore * 100).toFixed(1)}%)`);

    if (bestScore < 0.78) {
      console.log(`\n💡 RECOMMENDATION: Lower threshold from 0.78 to ${Math.max(0.5, bestScore - 0.1).toFixed(2)}`);
    }
  }
}

testSimilarityScores().catch(console.error);
