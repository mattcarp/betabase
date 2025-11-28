/**
 * RAG Performance Benchmark
 *
 * Tests semantic search speed and result quality after Gemini embedding migration
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const googleApiKey = process.env.GOOGLE_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);

const TEST_QUERIES = [
  "How does royalty calculation work in AOMA?",
  "What are the metadata requirements for digital releases?",
  "Explain the rights management workflow",
  "How do I handle territorial restrictions?",
  "What is the process for content ingestion?",
];

interface BenchmarkResult {
  query: string;
  embeddingTimeMs: number;
  searchTimeMs: number;
  totalTimeMs: number;
  resultsCount: number;
  topResultRelevance: number;
  topResults: Array<{
    title: string;
    similarity: number;
    sourceType: string;
  }>;
}

async function generateEmbedding(text: string): Promise<{ embedding: number[], timeMs: number }> {
  const start = performance.now();

  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const embedding = result.embedding.values;

  const timeMs = performance.now() - start;
  return { embedding, timeMs };
}

async function searchVectors(embedding: number[], limit: number = 5): Promise<{ results: any[], timeMs: number }> {
  const start = performance.now();

  // Use the Gemini-specific function with all required multi-tenant params
  const { data, error } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: limit,
    filter_source_types: null,
  });

  if (error) {
    console.error('Search error:', error);
    return { results: [], timeMs: performance.now() - start };
  }

  const timeMs = performance.now() - start;
  return { results: data || [], timeMs };
}

async function runBenchmark(query: string): Promise<BenchmarkResult> {
  const totalStart = performance.now();

  // Generate embedding
  const { embedding, timeMs: embeddingTimeMs } = await generateEmbedding(query);

  // Search vectors
  const { results, timeMs: searchTimeMs } = await searchVectors(embedding, 5);

  const totalTimeMs = performance.now() - totalStart;

  return {
    query,
    embeddingTimeMs: Math.round(embeddingTimeMs),
    searchTimeMs: Math.round(searchTimeMs),
    totalTimeMs: Math.round(totalTimeMs),
    resultsCount: results.length,
    topResultRelevance: results[0]?.similarity || 0,
    topResults: results.slice(0, 3).map(r => ({
      title: r.title || r.content?.substring(0, 50) || 'Unknown',
      similarity: Math.round(r.similarity * 100) / 100,
      sourceType: r.source_type || 'unknown',
    })),
  };
}

async function main() {
  console.log('\n========================================');
  console.log('  RAG PERFORMANCE BENCHMARK');
  console.log('  Gemini text-embedding-004 (768 dims)');
  console.log('========================================\n');

  const results: BenchmarkResult[] = [];

  for (const query of TEST_QUERIES) {
    console.log(`Testing: "${query.substring(0, 40)}..."`);
    const result = await runBenchmark(query);
    results.push(result);

    console.log(`  Embedding: ${result.embeddingTimeMs}ms | Search: ${result.searchTimeMs}ms | Total: ${result.totalTimeMs}ms`);
    console.log(`  Results: ${result.resultsCount} | Top similarity: ${result.topResultRelevance}`);
    if (result.topResults.length > 0) {
      console.log(`  Top match: ${result.topResults[0].title} (${result.topResults[0].sourceType})`);
    }
    console.log();
  }

  // Summary stats
  const avgEmbedding = Math.round(results.reduce((sum, r) => sum + r.embeddingTimeMs, 0) / results.length);
  const avgSearch = Math.round(results.reduce((sum, r) => sum + r.searchTimeMs, 0) / results.length);
  const avgTotal = Math.round(results.reduce((sum, r) => sum + r.totalTimeMs, 0) / results.length);
  const avgRelevance = Math.round(results.reduce((sum, r) => sum + r.topResultRelevance, 0) / results.length * 100) / 100;
  const totalResults = results.reduce((sum, r) => sum + r.resultsCount, 0);

  console.log('========================================');
  console.log('  SUMMARY');
  console.log('========================================');
  console.log(`  Queries tested: ${results.length}`);
  console.log(`  Avg embedding time: ${avgEmbedding}ms`);
  console.log(`  Avg search time: ${avgSearch}ms`);
  console.log(`  Avg total time: ${avgTotal}ms`);
  console.log(`  Avg top relevance: ${avgRelevance}`);
  console.log(`  Total results found: ${totalResults}`);
  console.log('========================================\n');

  // Detailed results
  console.log('\nDETAILED RESULTS:');
  console.log('----------------');
  for (const r of results) {
    console.log(`\nQuery: "${r.query}"`);
    console.log(`Performance: ${r.totalTimeMs}ms (embed: ${r.embeddingTimeMs}ms, search: ${r.searchTimeMs}ms)`);
    console.log('Top 3 results:');
    r.topResults.forEach((tr, i) => {
      console.log(`  ${i + 1}. [${tr.similarity}] ${tr.title} (${tr.sourceType})`);
    });
  }
}

main().catch(console.error);
