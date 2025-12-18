#!/usr/bin/env npx tsx
/**
 * Benchmark: Gemini 3 Pro Preview vs Gemini 3 Flash Preview
 * 
 * REAL-WORLD TEST: Uses the 6 primary AOMA questions with RAG context.
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/benchmark-gemini-3-flash.ts
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configuration
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!GOOGLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables. Run with: infisical run --env=dev -- npx tsx scripts/benchmark-gemini-3-flash.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
const googleProvider = createGoogleGenerativeAI({ apiKey: GOOGLE_API_KEY });

// Models to test
const MODELS = {
  pro: "gemini-3-pro-preview",
  flash: "gemini-3-flash-preview",
} as const;

// The 6 primary AOMA questions from ChatPage.tsx
const AOMA_QUESTIONS = [
  "What are the different asset types in AOMA and how do they relate to each other?",
  "How does AOMA use AWS S3 storage tiers for long-term archiving?",
  "What's the difference between asset registration and master linking in AOMA?",
  "What are the permission levels in AOMA and what can each role do?",
  "What new UST features are being planned for the 2026 releases?",
  "How do I upload and archive digital assets in AOMA from preparation to storage?",
];

const SYSTEM_PROMPT = `You are SIAM (Sentient Intelligence and Augmented Memory), an advanced AI assistant for Sony Music's AOMA platform.
You have access to a knowledge base and can help with various tasks including analysis, problem-solving, and creative work.
Be helpful, concise, and professional in your responses. Use the provided context to answer accurately.`;

interface BenchmarkResult {
  model: string;
  question: string;
  responseTimeMs: number;
  response: string;
  tokens: number;
}

async function getContext(query: string): Promise<string> {
  try {
    // 1. Generate embedding
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedResult = await embedModel.embedContent(query);
    const embedding = embedResult.embedding.values;

    // 2. Search Supabase
    const { data, error } = await supabase.rpc('match_siam_vectors_gemini', {
      p_organization: 'sony-music',
      p_division: 'digital-operations',
      p_app_under_test: 'aoma',
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 5,
    });

    if (error || !data) {
      console.warn(`   ⚠️ Context search error for "${query.substring(0, 20)}...":`, error?.message);
      return "No context found.";
    }

    return data.map((r: any) => `Source: ${r.title || 'Unknown'}\nContent: ${r.content}`).join("\n\n");
  } catch (err: any) {
    console.warn(`   ⚠️ Failed to get context:`, err.message);
    return "No context found.";
  }
}

async function runTest(model: string, question: string, context: string): Promise<BenchmarkResult> {
  const startTime = performance.now();
  
  const { text, usage } = await generateText({
    model: googleProvider(model),
    system: SYSTEM_PROMPT,
    prompt: `Context:\n${context}\n\nQuestion: ${question}`,
    temperature: 0.2, // Lower temp for factual consistency
  });
  
  const endTime = performance.now();
  
  return {
    model,
    question,
    responseTimeMs: Math.round(endTime - startTime),
    response: text,
    tokens: usage?.totalTokens || 0,
  };
}

async function main() {
  console.log("🔥 AOMA PREMIUM BENCHMARK: Gemini 3 Pro vs Flash");
  console.log("=================================================");
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`📡 Fetching context from Supabase vector store...\n`);

  const results: { pro: BenchmarkResult[], flash: BenchmarkResult[] } = { pro: [], flash: [] };

  for (let i = 0; i < AOMA_QUESTIONS.length; i++) {
    const question = AOMA_QUESTIONS[i];
    console.log(`💎 [${i + 1}/6] Question: "${question}"`);
    
    const context = await getContext(question);
    console.log(`   Fetched ${context.length} chars of RAG context.`);

    // Test Pro
    console.log(`   Running ${MODELS.pro}...`);
    const proRes = await runTest(MODELS.pro, question, context);
    results.pro.push(proRes);
    console.log(`   ✅ Pro: ${proRes.responseTimeMs}ms`);

    // Test Flash
    console.log(`   Running ${MODELS.flash}...`);
    const flashRes = await runTest(MODELS.flash, question, context);
    results.flash.push(flashRes);
    console.log(`   ✅ Flash: ${flashRes.responseTimeMs}ms`);

    const speedup = ((proRes.responseTimeMs - flashRes.responseTimeMs) / proRes.responseTimeMs * 100).toFixed(1);
    console.log(`   📊 Speedup: ${speedup}%\n`);
    
    // Tiny cooling period
    await new Promise(r => setTimeout(r, 1000));
  }

  // --- FINAL TABLE ---
  console.log("\n" + "=".repeat(100));
  console.log("📊 FINAL BENCHMARK SUMMARY TABLE");
  console.log("=".repeat(100));
  console.log(String("Question").padEnd(40) | String("Pro Time").padStart(10) | String("Flash Time").padStart(12) | String("Speedup").padStart(10));
  console.log("-".repeat(100));

  let totalPro = 0;
  let totalFlash = 0;

  for (let i = 0; i < AOMA_QUESTIONS.length; i++) {
    const q = AOMA_QUESTIONS[i].substring(0, 37) + "...";
    const pt = results.pro[i].responseTimeMs;
    const ft = results.flash[i].responseTimeMs;
    const s = ((pt - ft) / pt * 100).toFixed(0) + "%";
    
    totalPro += pt;
    totalFlash += ft;
    
    console.log(`${q.padEnd(40)} | ${String(pt + "ms").padStart(10)} | ${String(ft + "ms").padStart(12)} | ${s.padStart(10)}`);
  }

  const avgPro = Math.round(totalPro / AOMA_QUESTIONS.length);
  const avgFlash = Math.round(totalFlash / AOMA_QUESTIONS.length);
  const overallSpeedup = ((avgPro - avgFlash) / avgPro * 100).toFixed(1);

  console.log("-".repeat(100));
  console.log(`${"AVERAGE".padEnd(40)} | ${String(avgPro + "ms").padStart(10)} | ${String(avgFlash + "ms").padStart(12)} | ${String(overallSpeedup + "%").padStart(10)}`);
  console.log("=".repeat(100));

  // --- DETAILED RESPONSES ---
  console.log("\n\n📜 DETAILED RESPONSE COMPARISON");
  console.log("=".repeat(100));

  for (let i = 0; i < AOMA_QUESTIONS.length; i++) {
    console.log(`\n❓ QUESTION ${i+1}: ${AOMA_QUESTIONS[i]}`);
    console.log(`\n--- [GEMINI 3 PRO PREVIEW] ---`);
    console.log(results.pro[i].response);
    console.log(`\n--- [GEMINI 3 FLASH PREVIEW] ---`);
    console.log(results.flash[i].response);
    console.log("\n" + "-".repeat(50));
  }

  console.log("\n✅ Benchmark complete! Hooray for Gemini 3 Flash! ⚡");
}

main().catch(console.error);
