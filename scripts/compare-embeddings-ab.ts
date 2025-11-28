#!/usr/bin/env tsx
/**
 * A/B Comparison: OpenAI vs Gemini Embeddings
 *
 * Compares performance between:
 * - OpenAI text-embedding-3-small (1536 dimensions)
 * - Gemini text-embedding-004 (768 dimensions)
 *
 * Uses the remaining ~7,000 OpenAI-only docs vs ~8,000 Gemini docs
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

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
  topSimilarity: number;
  avgSimilarity: number;
}

async function generateOpenAIEmbedding(text: string): Promise<{ embedding: number[], timeMs: number }> {
  const start = performance.now();
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return { embedding, timeMs: performance.now() - start };
}

async function generateGeminiEmbedding(text: string): Promise<{ embedding: number[], timeMs: number }> {
  const start = performance.now();
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return { embedding: result.embedding.values, timeMs: performance.now() - start };
}

async function searchOpenAI(embedding: number[]): Promise<{ results: any[], timeMs: number }> {
  const start = performance.now();

  // Search documents that have OpenAI embeddings but NOT Gemini
  const { data, error } = await supabase.rpc('match_siam_vectors', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
    filter_source_types: null,
  });

  if (error) {
    console.error('OpenAI search error:', error.message);
    return { results: [], timeMs: performance.now() - start };
  }

  return { results: data || [], timeMs: performance.now() - start };
}

async function searchGemini(embedding: number[]): Promise<{ results: any[], timeMs: number }> {
  const start = performance.now();

  const { data, error } = await supabase.rpc('match_siam_vectors_gemini', {
    p_organization: 'sony-music',
    p_division: 'digital-operations',
    p_app_under_test: 'aoma',
    query_embedding: embedding,
    match_threshold: 0.5,
    match_count: 10,
    filter_source_types: null,
  });

  if (error) {
    console.error('Gemini search error:', error.message);
    return { results: [], timeMs: performance.now() - start };
  }

  return { results: data || [], timeMs: performance.now() - start };
}

async function runComparison() {
  console.log('\n' + '='.repeat(70));
  console.log('  A/B EMBEDDING COMPARISON');
  console.log('  OpenAI (1536d) vs Gemini (768d)');
  console.log('='.repeat(70) + '\n');

  // First, check document counts
  const { count: openaiCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null)
    .is('embedding_gemini', null)
    .eq('organization', 'sony-music')
    .eq('division', 'digital-operations')
    .eq('app_under_test', 'aoma');

  const { count: geminiCount } = await supabase
    .from('siam_vectors')
    .select('*', { count: 'exact', head: true })
    .not('embedding_gemini', 'is', null)
    .eq('organization', 'sony-music')
    .eq('division', 'digital-operations')
    .eq('app_under_test', 'aoma');

  console.log('Document Counts (AOMA):');
  console.log(`  OpenAI-only docs: ${openaiCount || 0}`);
  console.log(`  Gemini docs: ${geminiCount || 0}`);
  console.log();

  const openaiResults: BenchmarkResult[] = [];
  const geminiResults: BenchmarkResult[] = [];

  for (const query of TEST_QUERIES) {
    console.log(`\nQuery: "${query.substring(0, 50)}..."`);
    console.log('-'.repeat(60));

    // OpenAI test
    const { embedding: openaiEmbed, timeMs: openaiEmbedTime } = await generateOpenAIEmbedding(query);
    const { results: openaiSearchResults, timeMs: openaiSearchTime } = await searchOpenAI(openaiEmbed);

    const openaiResult: BenchmarkResult = {
      query,
      embeddingTimeMs: Math.round(openaiEmbedTime),
      searchTimeMs: Math.round(openaiSearchTime),
      totalTimeMs: Math.round(openaiEmbedTime + openaiSearchTime),
      resultsCount: openaiSearchResults.length,
      topSimilarity: openaiSearchResults[0]?.similarity || 0,
      avgSimilarity: openaiSearchResults.length > 0
        ? openaiSearchResults.reduce((sum: number, r: any) => sum + r.similarity, 0) / openaiSearchResults.length
        : 0,
    };
    openaiResults.push(openaiResult);

    // Gemini test
    const { embedding: geminiEmbed, timeMs: geminiEmbedTime } = await generateGeminiEmbedding(query);
    const { results: geminiSearchResults, timeMs: geminiSearchTime } = await searchGemini(geminiEmbed);

    const geminiResult: BenchmarkResult = {
      query,
      embeddingTimeMs: Math.round(geminiEmbedTime),
      searchTimeMs: Math.round(geminiSearchTime),
      totalTimeMs: Math.round(geminiEmbedTime + geminiSearchTime),
      resultsCount: geminiSearchResults.length,
      topSimilarity: geminiSearchResults[0]?.similarity || 0,
      avgSimilarity: geminiSearchResults.length > 0
        ? geminiSearchResults.reduce((sum: number, r: any) => sum + r.similarity, 0) / geminiSearchResults.length
        : 0,
    };
    geminiResults.push(geminiResult);

    // Side-by-side comparison
    console.log('  OpenAI (1536d):');
    console.log(`    Embed: ${openaiResult.embeddingTimeMs}ms | Search: ${openaiResult.searchTimeMs}ms | Total: ${openaiResult.totalTimeMs}ms`);
    console.log(`    Results: ${openaiResult.resultsCount} | Top: ${(openaiResult.topSimilarity * 100).toFixed(1)}% | Avg: ${(openaiResult.avgSimilarity * 100).toFixed(1)}%`);

    console.log('  Gemini (768d):');
    console.log(`    Embed: ${geminiResult.embeddingTimeMs}ms | Search: ${geminiResult.searchTimeMs}ms | Total: ${geminiResult.totalTimeMs}ms`);
    console.log(`    Results: ${geminiResult.resultsCount} | Top: ${(geminiResult.topSimilarity * 100).toFixed(1)}% | Avg: ${(geminiResult.avgSimilarity * 100).toFixed(1)}%`);

    // Delta
    const timeDelta = openaiResult.totalTimeMs - geminiResult.totalTimeMs;
    const simDelta = geminiResult.topSimilarity - openaiResult.topSimilarity;
    console.log(`  Delta: ${timeDelta > 0 ? '+' : ''}${timeDelta}ms faster | ${simDelta > 0 ? '+' : ''}${(simDelta * 100).toFixed(1)}% similarity`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));

  const avgOpenAI = {
    embedTime: Math.round(openaiResults.reduce((s, r) => s + r.embeddingTimeMs, 0) / openaiResults.length),
    searchTime: Math.round(openaiResults.reduce((s, r) => s + r.searchTimeMs, 0) / openaiResults.length),
    totalTime: Math.round(openaiResults.reduce((s, r) => s + r.totalTimeMs, 0) / openaiResults.length),
    results: openaiResults.reduce((s, r) => s + r.resultsCount, 0) / openaiResults.length,
    topSim: openaiResults.reduce((s, r) => s + r.topSimilarity, 0) / openaiResults.length,
    avgSim: openaiResults.reduce((s, r) => s + r.avgSimilarity, 0) / openaiResults.length,
  };

  const avgGemini = {
    embedTime: Math.round(geminiResults.reduce((s, r) => s + r.embeddingTimeMs, 0) / geminiResults.length),
    searchTime: Math.round(geminiResults.reduce((s, r) => s + r.searchTimeMs, 0) / geminiResults.length),
    totalTime: Math.round(geminiResults.reduce((s, r) => s + r.totalTimeMs, 0) / geminiResults.length),
    results: geminiResults.reduce((s, r) => s + r.resultsCount, 0) / geminiResults.length,
    topSim: geminiResults.reduce((s, r) => s + r.topSimilarity, 0) / geminiResults.length,
    avgSim: geminiResults.reduce((s, r) => s + r.avgSimilarity, 0) / geminiResults.length,
  };

  console.log('\nOpenAI text-embedding-3-small (1536 dimensions):');
  console.log(`  Avg Embed Time: ${avgOpenAI.embedTime}ms`);
  console.log(`  Avg Search Time: ${avgOpenAI.searchTime}ms`);
  console.log(`  Avg Total Time: ${avgOpenAI.totalTime}ms`);
  console.log(`  Avg Results: ${avgOpenAI.results.toFixed(1)}`);
  console.log(`  Avg Top Similarity: ${(avgOpenAI.topSim * 100).toFixed(1)}%`);
  console.log(`  Avg Mean Similarity: ${(avgOpenAI.avgSim * 100).toFixed(1)}%`);

  console.log('\nGemini text-embedding-004 (768 dimensions):');
  console.log(`  Avg Embed Time: ${avgGemini.embedTime}ms`);
  console.log(`  Avg Search Time: ${avgGemini.searchTime}ms`);
  console.log(`  Avg Total Time: ${avgGemini.totalTime}ms`);
  console.log(`  Avg Results: ${avgGemini.results.toFixed(1)}`);
  console.log(`  Avg Top Similarity: ${(avgGemini.topSim * 100).toFixed(1)}%`);
  console.log(`  Avg Mean Similarity: ${(avgGemini.avgSim * 100).toFixed(1)}%`);

  console.log('\n' + '-'.repeat(70));
  console.log('COMPARISON:');

  const speedup = ((avgOpenAI.totalTime - avgGemini.totalTime) / avgOpenAI.totalTime * 100).toFixed(1);
  const embedSpeedup = ((avgOpenAI.embedTime - avgGemini.embedTime) / avgOpenAI.embedTime * 100).toFixed(1);
  const searchSpeedup = ((avgOpenAI.searchTime - avgGemini.searchTime) / avgOpenAI.searchTime * 100).toFixed(1);
  const simChange = ((avgGemini.topSim - avgOpenAI.topSim) / avgOpenAI.topSim * 100).toFixed(1);

  console.log(`  Total Time: ${speedup}% ${Number(speedup) > 0 ? 'FASTER' : 'slower'} with Gemini`);
  console.log(`  Embed Time: ${embedSpeedup}% ${Number(embedSpeedup) > 0 ? 'faster' : 'slower'}`);
  console.log(`  Search Time: ${searchSpeedup}% ${Number(searchSpeedup) > 0 ? 'faster' : 'slower'}`);
  console.log(`  Similarity: ${simChange}% ${Number(simChange) > 0 ? 'better' : 'worse'}`);
  console.log('-'.repeat(70));

  // Verdict
  console.log('\nVERDICT:');
  if (Number(speedup) > 10 && Number(simChange) > -5) {
    console.log('  Gemini provides significant speed improvement with comparable quality.');
  } else if (Number(speedup) > 0 && Number(simChange) >= 0) {
    console.log('  Gemini is faster AND has better similarity scores. Clear win.');
  } else if (Number(speedup) < 0 && Number(simChange) > 0) {
    console.log('  Gemini is slower but provides better similarity. Trade-off.');
  } else {
    console.log('  Results inconclusive or OpenAI performs better.');
  }
  console.log('='.repeat(70) + '\n');
}

runComparison().catch(console.error);
