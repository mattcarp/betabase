#!/usr/bin/env npx tsx
/**
 * Comprehensive RAG System Test
 * Captures: Questions, Full Responses, Timing
 * 
 * Run: npx tsx scripts/test-rag-comprehensive.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase directly
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
(globalThis as any).__supabaseAdminClient = supabaseAdmin;

import { getHybridRetrievalV2 } from "../src/services/hybridRetrievalV2";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";

interface TestResult {
  query: string;
  timing: {
    total: number;
  };
  metrics: {
    vectorHits: number;
    keywordHits: number;
    mergedCandidates: number;
    finalResults: number;
  };
  topResults: Array<{
    rank: number;
    sourceType: string;
    score: number;
    content: string;
    title?: string;
  }>;
  error?: string;
}

const TEST_QUERIES = [
  "What is AOMA?",
  "What is the application name?",
  "How do I upload files to the system?",
  "Explain the metadata registration process",
  "What are the steps to configure OAuth authentication in AOMA?",
  "What databases does the system support?",
  "How do I handle errors in the API?",
];

async function runComprehensiveTest(): Promise<TestResult[]> {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║       RAG SYSTEM COMPREHENSIVE TEST - BASELINE CAPTURE       ║");
  console.log("║               " + new Date().toISOString() + "               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  
  // Connectivity check
  const { count, error } = await supabaseAdmin
    .from("siam_vectors")
    .select("*", { count: "exact", head: true });
  
  if (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
  console.log(`Database: ${count?.toLocaleString()} documents indexed\n`);
  
  const hybridSearch = getHybridRetrievalV2();
  const results: TestResult[] = [];
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
    console.log(`│ TEST ${i + 1}/${TEST_QUERIES.length}: ${query.padEnd(47)}│`);
    console.log(`└─────────────────────────────────────────────────────────────┘`);
    
    try {
      const startTime = performance.now();
      
      const searchResult = await hybridSearch.search(query, {
        ...DEFAULT_APP_CONTEXT,
        initialCandidates: 30,
        vectorThreshold: 0.40,
        topK: 5,
        useRLHFSignals: false,
      });
      
      const totalTime = performance.now() - startTime;
      
      const testResult: TestResult = {
        query,
        timing: { total: Math.round(totalTime) },
        metrics: {
          vectorHits: searchResult.metrics.vectorResults,
          keywordHits: searchResult.metrics.keywordResults,
          mergedCandidates: searchResult.metrics.mergedCandidates,
          finalResults: searchResult.documents.length,
        },
        topResults: searchResult.documents.slice(0, 3).map((doc, idx) => ({
          rank: idx + 1,
          sourceType: doc.source_type,
          score: Math.round(doc.rerankScore * 100),
          content: doc.content.substring(0, 500),
          title: doc.metadata?.title || doc.metadata?.file_name || undefined,
        })),
      };
      
      results.push(testResult);
      
      // Print results
      console.log(`\n  TIMING: ${testResult.timing.total}ms`);
      console.log(`  METRICS: Vector=${testResult.metrics.vectorHits} | Keyword=${testResult.metrics.keywordHits} | Merged=${testResult.metrics.mergedCandidates} | Final=${testResult.metrics.finalResults}`);
      
      if (testResult.topResults.length > 0) {
        console.log(`\n  TOP RESULTS:`);
        testResult.topResults.forEach((r, idx) => {
          console.log(`\n  ─── Result ${r.rank} ───`);
          console.log(`  Source: ${r.sourceType} | Score: ${r.score}%${r.title ? ` | Title: ${r.title}` : ""}`);
          console.log(`  Content:`);
          // Word-wrap content for readability
          const wrapped = r.content.replace(/(.{1,80})/g, "  $1\n").trim();
          console.log(wrapped);
        });
      } else {
        console.log(`\n  ⚠ NO RESULTS FOUND`);
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      results.push({
        query,
        timing: { total: 0 },
        metrics: { vectorHits: 0, keywordHits: 0, mergedCandidates: 0, finalResults: 0 },
        topResults: [],
        error: errorMsg,
      });
      console.log(`\n  ✗ ERROR: ${errorMsg}`);
    }
  }
  
  // Summary Table
  console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║                      SUMMARY TABLE                           ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
  
  console.log("┌────┬────────────────────────────────────────┬────────┬────────┬─────────┐");
  console.log("│ #  │ Query                                  │ Time   │ Vector │ Results │");
  console.log("├────┼────────────────────────────────────────┼────────┼────────┼─────────┤");
  
  results.forEach((r, i) => {
    const queryTrunc = r.query.length > 38 ? r.query.substring(0, 35) + "..." : r.query.padEnd(38);
    const time = `${r.timing.total}ms`.padStart(6);
    const vector = `${r.metrics.vectorHits}`.padStart(6);
    const final = `${r.metrics.finalResults}`.padStart(7);
    console.log(`│ ${(i+1).toString().padStart(2)} │ ${queryTrunc} │ ${time} │ ${vector} │ ${final} │`);
  });
  
  console.log("└────┴────────────────────────────────────────┴────────┴────────┴─────────┘");
  
  // Averages
  const avgTime = Math.round(results.reduce((s, r) => s + r.timing.total, 0) / results.length);
  const avgResults = (results.reduce((s, r) => s + r.metrics.finalResults, 0) / results.length).toFixed(1);
  console.log(`\nAverages: ${avgTime}ms response time | ${avgResults} results per query`);
  
  // Save results to JSON for future comparison
  const outputPath = `./test-results/baseline-${Date.now()}.json`;
  await Bun.write(outputPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    documentCount: count,
    results 
  }, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
  
  return results;
}

runComprehensiveTest().catch(console.error);
