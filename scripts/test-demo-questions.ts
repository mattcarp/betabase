#!/usr/bin/env npx tsx
/**
 * Test Demo Questions Against Vector Search
 *
 * Tests candidate questions against the knowledge base to find
 * which ones give the best, most relevant responses.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { getGeminiEmbeddingService } from "../src/services/geminiEmbeddingService";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const gemini = getGeminiEmbeddingService();

// Candidate demo questions
const DEMO_QUESTIONS = [
  "What are the steps to link a product to a master in AOMA?",
  "What video quality issues cause rejection from Select Partners like iTunes and VEVO?",
  "What new features are in AOMA 2.116.0?",
  "How do I get access to the Unified Submission Tool (UST)?",
  "What's the difference between Full Master Linking, Side Linking, and Track Linking?",
  "What are the different asset types in AOMA and when do I use each?",
  "How do I register a short-form video in AOMA?",
  "What is the quality check process for videos submitted to AOMA?",
  "How does the Asset Swap feature work in AOMA?",
  "What are the AOMA permissions needed for GMP engineers?",
];

interface SearchResult {
  question: string;
  topMatches: {
    source_id: string;
    similarity: number;
    contentPreview: string;
  }[];
  avgSimilarity: number;
  verdict: string;
}

async function testQuestion(question: string): Promise<SearchResult> {
  // Generate embedding for the question
  const embedding = await gemini.generateEmbedding(question);

  // Query vector search
  const { data, error } = await supabase.rpc("match_siam_vectors_gemini", {
    query_embedding: embedding,
    match_threshold: 0.3,
    match_count: 5,
    p_organization: "sony-music",
    p_division: "digital-operations",
    p_app_under_test: "aoma",
  });

  if (error) {
    return {
      question,
      topMatches: [],
      avgSimilarity: 0,
      verdict: `ERROR: ${error.message}`,
    };
  }

  const matches = (data || []).map((d: { source_id: string; similarity: number; content: string }) => ({
    source_id: d.source_id,
    similarity: d.similarity,
    contentPreview: d.content.substring(0, 100) + "...",
  }));

  const avgSimilarity = matches.length > 0
    ? matches.reduce((sum: number, m: { similarity: number }) => sum + m.similarity, 0) / matches.length
    : 0;

  let verdict = "POOR";
  if (avgSimilarity >= 0.5 && matches.length >= 3) verdict = "EXCELLENT";
  else if (avgSimilarity >= 0.4 && matches.length >= 2) verdict = "GOOD";
  else if (avgSimilarity >= 0.35) verdict = "FAIR";

  return {
    question,
    topMatches: matches,
    avgSimilarity,
    verdict,
  };
}

async function main() {
  console.log("=== Testing Demo Questions Against Vector Search ===\n");
  console.log(`Testing ${DEMO_QUESTIONS.length} candidate questions...\n`);

  const results: SearchResult[] = [];

  for (let i = 0; i < DEMO_QUESTIONS.length; i++) {
    const question = DEMO_QUESTIONS[i];
    console.log(`[${i + 1}/${DEMO_QUESTIONS.length}] Testing: "${question.substring(0, 50)}..."`);

    const result = await testQuestion(question);
    results.push(result);

    console.log(`  Verdict: ${result.verdict} | Avg Similarity: ${(result.avgSimilarity * 100).toFixed(1)}%`);
    if (result.topMatches.length > 0) {
      console.log(`  Top match: ${result.topMatches[0].source_id} (${(result.topMatches[0].similarity * 100).toFixed(1)}%)`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  // Sort by average similarity
  const sorted = [...results].sort((a, b) => b.avgSimilarity - a.avgSimilarity);

  console.log("\n### TOP 6 RECOMMENDED DEMO QUESTIONS ###\n");

  for (let i = 0; i < Math.min(6, sorted.length); i++) {
    const r = sorted[i];
    console.log(`${i + 1}. [${r.verdict}] "${r.question}"`);
    console.log(`   Avg Similarity: ${(r.avgSimilarity * 100).toFixed(1)}%`);
    if (r.topMatches.length > 0) {
      console.log(`   Top Sources:`);
      for (const m of r.topMatches.slice(0, 3)) {
        console.log(`     - ${m.source_id} (${(m.similarity * 100).toFixed(1)}%)`);
      }
    }
    console.log();
  }

  // Show poor performers for reference
  const poor = sorted.filter(r => r.verdict === "POOR" || r.verdict === "FAIR");
  if (poor.length > 0) {
    console.log("\n### Questions that need better content ###");
    for (const r of poor) {
      console.log(`- "${r.question}" (${(r.avgSimilarity * 100).toFixed(1)}%)`);
    }
  }
}

main().catch(console.error);
