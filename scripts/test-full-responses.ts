#!/usr/bin/env npx tsx
/**
 * RAG Full Response Test - Shows complete document content
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
(globalThis as any).__supabaseAdminClient = supabaseAdmin;

import { getHybridRetrievalV2 } from "../src/services/hybridRetrievalV2";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";

const TEST_QUERIES = [
  "What is AOMA?",
  "How do I upload files to the system?",
  "What are the steps to configure OAuth authentication in AOMA?",
];

async function runFullResponseTest() {
  console.log("\n" + "=".repeat(80));
  console.log("RAG FULL RESPONSE TEST - COMPLETE DOCUMENT CONTENT");
  console.log("=".repeat(80));
  
  const hybridSearch = getHybridRetrievalV2();
  
  for (const query of TEST_QUERIES) {
    console.log("\n\n");
    console.log("█".repeat(80));
    console.log(`QUERY: "${query}"`);
    console.log("█".repeat(80));
    
    const startTime = performance.now();
    
    const result = await hybridSearch.search(query, {
      ...DEFAULT_APP_CONTEXT,
      initialCandidates: 30,
      vectorThreshold: 0.40,
      topK: 5,
      useRLHFSignals: false,
    });
    
    const duration = performance.now() - startTime;
    console.log(`\nTime: ${Math.round(duration)}ms | Results: ${result.documents.length}`);
    
    // Show FULL content of top 3 results
    result.documents.slice(0, 3).forEach((doc, idx) => {
      console.log("\n" + "─".repeat(80));
      console.log(`RESULT ${idx + 1} of ${result.documents.length}`);
      console.log("─".repeat(80));
      console.log(`Source Type: ${doc.source_type}`);
      console.log(`Score: ${(doc.rerankScore * 100).toFixed(1)}%`);
      console.log(`Vector Similarity: ${(doc.similarity * 100).toFixed(1)}%`);
      
      if (doc.metadata) {
        console.log(`\nMETADATA:`);
        if (doc.metadata.title) console.log(`  Title: ${doc.metadata.title}`);
        if (doc.metadata.file_name) console.log(`  File: ${doc.metadata.file_name}`);
        if (doc.metadata.file_path) console.log(`  Path: ${doc.metadata.file_path}`);
        if (doc.metadata.jira_key) console.log(`  JIRA Key: ${doc.metadata.jira_key}`);
        if (doc.metadata.url) console.log(`  URL: ${doc.metadata.url}`);
      }
      
      console.log(`\nFULL CONTENT (${doc.content.length} chars):`);
      console.log("┌" + "─".repeat(78) + "┐");
      // Print full content with line wrapping
      const lines = doc.content.split('\n');
      lines.forEach(line => {
        // Wrap long lines
        while (line.length > 76) {
          console.log("│ " + line.substring(0, 76) + " │");
          line = line.substring(76);
        }
        console.log("│ " + line.padEnd(76) + " │");
      });
      console.log("└" + "─".repeat(78) + "┘");
    });
  }
  
  console.log("\n\n" + "=".repeat(80));
  console.log("TEST COMPLETE");
  console.log("=".repeat(80));
}

runFullResponseTest().catch(console.error);
