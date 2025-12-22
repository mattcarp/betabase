#!/usr/bin/env npx tsx
/**
 * Test Hybrid Search Pipeline
 * 
 * Verifies the complete RAG overhaul:
 * 1. Vector search with task-typed embeddings
 * 2. Keyword/BM25 search 
 * 3. RRF fusion
 * 4. Gemini structured reranking
 * 
 * Run: npx tsx scripts/test-hybrid-search.ts
 */

import { config } from "dotenv";
// Load env BEFORE any other imports
config({ path: ".env.local" });

// Verify env vars are loaded
console.log("🔧 Environment check:");
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅" : "❌"}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅" : "❌"}`);
console.log(`   GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? "✅" : "❌"}`);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables. Check .env.local");
  process.exit(1);
}

// Force re-initialization of Supabase clients by clearing the global cache
(globalThis as any).__supabaseClient = undefined;
(globalThis as any).__supabaseAdminClient = undefined;

// Now import the services (they'll create fresh clients)
import { createClient } from "@supabase/supabase-js";

// Create admin client directly for testing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// Manually set the global to use in services
(globalThis as any).__supabaseAdminClient = supabaseAdmin;

// Now import the hybrid retrieval (it will use the admin client we set)
import { getHybridRetrievalV2 } from "../src/services/hybridRetrievalV2";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";

const TEST_QUERIES = [
  // Exact match test - should hit keyword search hard
  "What is AOMA?",
  "What is the application name?",
  
  // Semantic search test - should hit vector search
  "How do I upload files to the system?",
  "Explain the metadata registration process",
  
  // Complex query - should benefit from both
  "What are the steps to configure OAuth authentication in AOMA?",
];

async function runTests() {
  console.log("\n🧪 Testing Hybrid Search Pipeline");
  console.log("=".repeat(60));
  
  // Quick connectivity test
  console.log("\n📡 Testing Supabase connection...");
  try {
    const { count, error } = await supabaseAdmin
      .from("siam_vectors")
      .select("*", { count: "exact", head: true });
    
    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
      process.exit(1);
    }
    console.log(`✅ Connected! siam_vectors has ${count} documents`);
  } catch (err) {
    console.error("❌ Connection error:", err);
    process.exit(1);
  }
  
  const hybridSearch = getHybridRetrievalV2();
  
  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log("-".repeat(60));
    
    try {
      const startTime = performance.now();
      
      const result = await hybridSearch.search(query, {
        ...DEFAULT_APP_CONTEXT,
        initialCandidates: 30,
        vectorThreshold: 0.40,
        topK: 5,
        useRLHFSignals: false, // Disable for testing
      });
      
      const duration = performance.now() - startTime;
      
      console.log(`\n📊 Results:`);
      console.log(`   Vector hits: ${result.metrics.vectorResults}`);
      console.log(`   Keyword hits: ${result.metrics.keywordResults}`);
      console.log(`   Merged: ${result.metrics.mergedCandidates}`);
      console.log(`   Final: ${result.documents.length}`);
      console.log(`   Total time: ${duration.toFixed(0)}ms`);
      
      if (result.documents.length > 0) {
        console.log(`\n🏆 Top 3 Results:`);
        result.documents.slice(0, 3).forEach((doc, idx) => {
          console.log(`   ${idx + 1}. [${doc.source_type}] Score: ${(doc.rerankScore * 100).toFixed(1)}%`);
          console.log(`      ${doc.content.substring(0, 100)}...`);
        });
      } else {
        console.log(`   ⚠️ No results found!`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error:`, error);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Test complete!");
}

runTests().catch(console.error);
