#!/usr/bin/env tsx
/**
 * AOMA RAG Response Time Test - Full Pipeline
 * Tests 10 AOMA-related queries with NATURAL LLM responses
 *
 * This script tests the complete RAG pipeline:
 * 1. Generate embedding for query
 * 2. Search vector store for relevant documents
 * 3. Generate natural conversational response using Gemini LLM
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);

const TEST_QUERIES = [
  "What is AOMA?",
  "How does royalty calculation work in AOMA?",
  "What are the metadata requirements for digital releases?",
  "Explain the rights management workflow",
  "How do I handle territorial restrictions?",
  "What is the process for content ingestion?",
  "How do I track album sales in AOMA?",
  "What formats does AOMA support?",
  "How do I create a new release in AOMA?",
  "What are the main AOMA ticket types?",
];

interface TestResult {
  query: string;
  embedTimeMs: number;
  searchTimeMs: number;
  llmTimeMs: number;
  totalTimeMs: number;
  resultsCount: number;
  topSimilarity: number;
  isValid: boolean;
  naturalAnswer: string;
  rawContext: string;
  sourceTypes: string[];
}

async function generateGeminiEmbedding(text: string): Promise<{ embedding: number[], timeMs: number }> {
  const start = performance.now();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return { embedding: result.embedding.values, timeMs: performance.now() - start };
}

async function searchVectors(embedding: number[]): Promise<{ results: any[], timeMs: number }> {
  const start = performance.now();
  const { data, error } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: embedding,
    match_threshold: 0.45,
    match_count: 5,
    filter_source_types: null,
  });

  if (error) {
    console.error('Search error:', error.message);
    return { results: [], timeMs: performance.now() - start };
  }

  return { results: data || [], timeMs: performance.now() - start };
}

/**
 * Generate a natural conversational response using Gemini LLM
 * This combines retrieved documents into a helpful answer
 */
async function generateNaturalResponse(
  query: string,
  documents: any[]
): Promise<{ response: string; timeMs: number }> {
  const start = performance.now();

  if (documents.length === 0) {
    return {
      response: "I don't have enough information in my knowledge base to answer that question.",
      timeMs: performance.now() - start,
    };
  }

  // Format documents as context
  const context = documents
    .map((doc, i) => {
      const sourceLabel = doc.source_type === 'jira_ticket'
        ? `[Jira: ${doc.source_id}]`
        : `[${doc.source_type}: ${doc.source_id}]`;
      return `Document ${i + 1} ${sourceLabel}:\n${doc.content}`;
    })
    .join('\n\n---\n\n');

  const systemPrompt = `You are SIAM, an AI assistant for Sony Music with deep knowledge of AOMA (Asset and Offering Management Application).

**AOMA KNOWLEDGE BASE:**
${context}

**INSTRUCTIONS:**
1. Answer the user's question using ONLY the information provided above
2. Be concise but thorough - aim for 2-4 sentences
3. Use natural, conversational language
4. If the documents contain relevant Jira ticket IDs, mention them naturally
5. If the information is incomplete, say so honestly
6. Never make up information not in the documents`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `User question: ${query}` },
    ]);
    const response = result.response.text();
    return { response, timeMs: performance.now() - start };
  } catch (error) {
    console.error('LLM error:', error);
    return {
      response: 'Error generating response.',
      timeMs: performance.now() - start,
    };
  }
}

async function runTest(): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('  AOMA RAG FULL PIPELINE TEST (10 QUERIES)');
  console.log('  Gemini Embeddings (768d) + Gemini LLM Response');
  console.log('='.repeat(80) + '\n');

  const results: TestResult[] = [];

  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`[${i + 1}/10] Testing: "${query}"`);

    const totalStart = performance.now();

    // Step 1: Generate embedding for query
    const { embedding, timeMs: embedTimeMs } = await generateGeminiEmbedding(query);
    console.log(`   [1/3] Embedding: ${Math.round(embedTimeMs)}ms`);

    // Step 2: Search vector store
    const { results: searchResults, timeMs: searchTimeMs } = await searchVectors(embedding);
    console.log(`   [2/3] Search: ${Math.round(searchTimeMs)}ms (${searchResults.length} docs)`);

    // Step 3: Generate natural LLM response
    const { response: naturalAnswer, timeMs: llmTimeMs } = await generateNaturalResponse(query, searchResults);
    console.log(`   [3/3] LLM: ${Math.round(llmTimeMs)}ms`);

    const totalTimeMs = performance.now() - totalStart;

    const topResult = searchResults[0];
    const isValid = searchResults.length > 0 && (topResult?.similarity || 0) > 0.45;
    const sourceTypes = [...new Set(searchResults.map(r => r.source_type))];
    const rawContext = searchResults.map(r => r.content).join('\n---\n');

    results.push({
      query,
      embedTimeMs: Math.round(embedTimeMs),
      searchTimeMs: Math.round(searchTimeMs),
      llmTimeMs: Math.round(llmTimeMs),
      totalTimeMs: Math.round(totalTimeMs),
      resultsCount: searchResults.length,
      topSimilarity: topResult?.similarity || 0,
      isValid,
      naturalAnswer,
      rawContext,
      sourceTypes,
    });

    console.log(`   TOTAL: ${Math.round(totalTimeMs)}ms | Similarity: ${((topResult?.similarity || 0) * 100).toFixed(1)}%\n`);
  }

  // Show each Q&A pair with NATURAL responses
  console.log('\n' + '='.repeat(100));
  console.log('  NATURAL LANGUAGE Q&A RESULTS');
  console.log('='.repeat(100));

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${i + 1}] ${r.totalTimeMs}ms total | ${(r.topSimilarity * 100).toFixed(1)}% similarity`);
    console.log(`    Sources: ${r.sourceTypes.join(', ')} | Docs: ${r.resultsCount}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`Q: ${r.query}`);
    console.log(`\nA: ${r.naturalAnswer}`);
  }

  // Timing breakdown table
  console.log('\n' + '='.repeat(100));
  console.log('  TIMING BREAKDOWN');
  console.log('='.repeat(100));
  console.log('| #  | Embed  | Search | LLM    | Total  | Sim   | Question                           |');
  console.log('|----|--------|--------|--------|--------|-------|-------------------------------------|');

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`| ${String(i + 1).padStart(2)} | ${String(r.embedTimeMs + 'ms').padEnd(6)} | ${String(r.searchTimeMs + 'ms').padEnd(6)} | ${String(r.llmTimeMs + 'ms').padEnd(6)} | ${String(r.totalTimeMs + 'ms').padEnd(6)} | ${(r.topSimilarity * 100).toFixed(0).padStart(3)}%  | ${r.query.substring(0, 35).padEnd(35)} |`);
  }

  // Averages
  const avgEmbed = Math.round(results.reduce((s, r) => s + r.embedTimeMs, 0) / results.length);
  const avgSearch = Math.round(results.reduce((s, r) => s + r.searchTimeMs, 0) / results.length);
  const avgLLM = Math.round(results.reduce((s, r) => s + r.llmTimeMs, 0) / results.length);
  const avgTotal = Math.round(results.reduce((s, r) => s + r.totalTimeMs, 0) / results.length);
  const avgResults = (results.reduce((s, r) => s + r.resultsCount, 0) / results.length).toFixed(1);
  const avgSim = (results.reduce((s, r) => s + r.topSimilarity, 0) / results.length * 100).toFixed(1);
  const validCount = results.filter(r => r.isValid).length;

  console.log('|----|--------|--------|--------|--------|-------|-------------------------------------|');
  console.log(`| AVG| ${String(avgEmbed + 'ms').padEnd(6)} | ${String(avgSearch + 'ms').padEnd(6)} | ${String(avgLLM + 'ms').padEnd(6)} | ${String(avgTotal + 'ms').padEnd(6)} | ${avgSim.padStart(3)}%  | ${validCount}/10 valid responses            |`);
  console.log('='.repeat(100) + '\n');

  // Summary
  console.log('PIPELINE SUMMARY:');
  console.log(`  Total queries: ${results.length}`);
  console.log(`  Valid responses: ${validCount}/${results.length} (${(validCount / results.length * 100).toFixed(0)}%)`);
  console.log(`  Avg docs per query: ${avgResults}`);
  console.log(`  Avg similarity: ${avgSim}%`);
  console.log('');
  console.log('  TIMING BREAKDOWN:');
  console.log(`    Embedding generation: ${avgEmbed}ms avg`);
  console.log(`    Vector search: ${avgSearch}ms avg`);
  console.log(`    LLM response: ${avgLLM}ms avg`);
  console.log(`    ----------------------------`);
  console.log(`    Total pipeline: ${avgTotal}ms avg`);

  // Performance assessment
  console.log('\nPERFORMANCE ASSESSMENT:');
  if (avgTotal < 2000) {
    console.log('  [EXCELLENT] Sub-2-second full pipeline!');
  } else if (avgTotal < 3000) {
    console.log('  [GOOD] Full pipeline under 3 seconds');
  } else if (avgTotal < 5000) {
    console.log('  [ACCEPTABLE] Full pipeline under 5 seconds');
  } else {
    console.log('  [NEEDS IMPROVEMENT] Full pipeline over 5 seconds');
  }

  if (validCount >= 8) {
    console.log('  [EXCELLENT] High retrieval rate (80%+)');
  } else if (validCount >= 6) {
    console.log('  [GOOD] Moderate retrieval rate (60%+)');
  } else {
    console.log('  [NEEDS IMPROVEMENT] Low retrieval rate (<60%)');
  }
}

runTest().catch(console.error);
