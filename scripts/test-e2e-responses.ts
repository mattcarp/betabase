#!/usr/bin/env npx tsx
/**
 * End-to-End RAG Test - Shows actual LLM responses
 * Tests the full pipeline: Retrieval -> Context -> LLM Generation
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Initialize Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
(globalThis as any).__supabaseAdminClient = supabaseAdmin;

// Initialize Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

import { UnifiedRAGOrchestrator } from "../src/services/unifiedRAGOrchestrator";
import { synthesizeContext, formatContextForPrompt } from "../src/services/contextSynthesizer";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";

interface TestResult {
  query: string;
  retrievalTimeMs: number;
  generationTimeMs: number;
  totalTimeMs: number;
  documentsRetrieved: number;
  ragConfidence: number;
  llmResponse: string;
  topSources: string[];
}

const TEST_QUERIES = [
  "What is AOMA?",
  "How do I upload files to the system?",
  "What are the steps to configure OAuth authentication in AOMA?",
];

const SYSTEM_PROMPT = `You are SIAM, a helpful AI assistant for Sony Music's AOMA platform.
Answer questions based on the provided context. Be concise and accurate.
If the context doesn't contain relevant information, say so clearly.`;

async function runEndToEndTest(): Promise<TestResult[]> {
  console.log("\n" + "═".repeat(80));
  console.log("  END-TO-END RAG TEST - FULL LLM RESPONSES");
  console.log("  " + new Date().toISOString());
  console.log("═".repeat(80));

  const unifiedRAG = new UnifiedRAGOrchestrator();
  const results: TestResult[] = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    
    console.log("\n\n");
    console.log("█".repeat(80));
    console.log(`  QUERY ${i + 1}/${TEST_QUERIES.length}: "${query}"`);
    console.log("█".repeat(80));

    const totalStart = performance.now();
    
    try {
      // ========================================
      // PHASE 1: RETRIEVAL
      // ========================================
      console.log("\n▸ Phase 1: Retrieving documents...");
      const retrievalStart = performance.now();
      
      const ragResult = await unifiedRAG.query(query, {
        sessionId: `test_${Date.now()}`,
        ...DEFAULT_APP_CONTEXT,
        useContextAware: true,
        useAgenticRAG: false,
        useRLHFSignals: false,
        useHybridSearch: true,
        topK: 5,
        targetConfidence: 0.7,
      });
      
      const retrievalTime = performance.now() - retrievalStart;
      console.log(`  Retrieved ${ragResult.documents.length} documents in ${Math.round(retrievalTime)}ms`);
      console.log(`  Confidence: ${(ragResult.metadata.confidence * 100).toFixed(1)}%`);
      
      // ========================================
      // PHASE 2: CONTEXT SYNTHESIS
      // ========================================
      console.log("\n▸ Phase 2: Synthesizing context...");
      
      let formattedContext = "";
      const topSources: string[] = [];
      
      if (ragResult.documents.length > 0) {
        const vectorResults = ragResult.documents.map((doc: any) => ({
          content: doc.content || doc.text || "",
          source_type: doc.source_type || "unknown",
          source_id: doc.id || doc.source_id,
          similarity: doc.similarity || doc.rerankScore || 0.75,
          metadata: doc.metadata || {},
        }));

        const synthesizedCtx = await synthesizeContext(query, vectorResults);
        formattedContext = formatContextForPrompt(synthesizedCtx);
        
        // Extract source info
        ragResult.documents.slice(0, 3).forEach((doc: any) => {
          const title = doc.metadata?.title || doc.metadata?.file_name || doc.metadata?.jira_key || "Unknown";
          topSources.push(`[${doc.source_type}] ${title}`);
        });
        
        console.log(`  Context: ${formattedContext.length} characters`);
      } else {
        formattedContext = "No relevant documents found in the knowledge base.";
        console.log("  ⚠ No documents retrieved");
      }
      
      // ========================================
      // PHASE 3: LLM GENERATION
      // ========================================
      console.log("\n▸ Phase 3: Generating LLM response...");
      const generationStart = performance.now();
      
      const userMessageWithContext = `${query}

[Knowledge Base Context:
${formattedContext}
]`;

      const llmResult = await generateText({
        model: google("gemini-2.0-flash"),
        system: SYSTEM_PROMPT,
        prompt: userMessageWithContext,
        temperature: 0.7,
        maxTokens: 1024,
      });
      
      const generationTime = performance.now() - generationStart;
      const totalTime = performance.now() - totalStart;
      
      console.log(`  Generated response in ${Math.round(generationTime)}ms`);
      
      // ========================================
      // DISPLAY RESPONSE
      // ========================================
      console.log("\n" + "─".repeat(80));
      console.log("  LLM RESPONSE:");
      console.log("─".repeat(80));
      console.log("\n" + llmResult.text);
      console.log("\n" + "─".repeat(80));
      
      // Timing summary
      console.log(`\n  TIMING: Retrieval=${Math.round(retrievalTime)}ms | Generation=${Math.round(generationTime)}ms | Total=${Math.round(totalTime)}ms`);
      
      if (topSources.length > 0) {
        console.log(`  SOURCES: ${topSources.join(" | ")}`);
      }
      
      results.push({
        query,
        retrievalTimeMs: Math.round(retrievalTime),
        generationTimeMs: Math.round(generationTime),
        totalTimeMs: Math.round(totalTime),
        documentsRetrieved: ragResult.documents.length,
        ragConfidence: ragResult.metadata.confidence,
        llmResponse: llmResult.text,
        topSources,
      });
      
    } catch (error) {
      console.error(`\n  ✗ ERROR: ${error instanceof Error ? error.message : String(error)}`);
      results.push({
        query,
        retrievalTimeMs: 0,
        generationTimeMs: 0,
        totalTimeMs: 0,
        documentsRetrieved: 0,
        ragConfidence: 0,
        llmResponse: `ERROR: ${error instanceof Error ? error.message : String(error)}`,
        topSources: [],
      });
    }
  }

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n\n");
  console.log("═".repeat(80));
  console.log("  SUMMARY");
  console.log("═".repeat(80));
  
  const avgTotal = Math.round(results.reduce((s, r) => s + r.totalTimeMs, 0) / results.length);
  const avgRetrieval = Math.round(results.reduce((s, r) => s + r.retrievalTimeMs, 0) / results.length);
  const avgGeneration = Math.round(results.reduce((s, r) => s + r.generationTimeMs, 0) / results.length);
  
  console.log(`\n  Average Retrieval Time: ${avgRetrieval}ms`);
  console.log(`  Average Generation Time: ${avgGeneration}ms`);
  console.log(`  Average Total Time: ${avgTotal}ms`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `./test-results/e2e-${timestamp}.json`;
  const fs = await import('fs/promises');
  await fs.writeFile(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { avgRetrieval, avgGeneration, avgTotal },
    results
  }, null, 2));
  console.log(`\n  Results saved to: ${outputPath}`);
  
  return results;
}

runEndToEndTest().catch(console.error);
