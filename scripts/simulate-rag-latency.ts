
import { performance } from 'perf_hooks';

// Simulate service latencies
const LATENCY = {
  GEMINI_TRANSFORM: 800,
  SUPABASE_VECTOR: 300,
  GEMINI_RERANK: 800,
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function mockGeminiTransform(query: string) {
  await sleep(LATENCY.GEMINI_TRANSFORM);
  return `transformed_${query}`;
}

async function mockSupabaseVector(query: string) {
  await sleep(LATENCY.SUPABASE_VECTOR);
  return Array(10).fill(0).map((_, i) => ({ id: i, content: `doc_${query}_${i}`, similarity: 0.8 }));
}

async function mockGeminiRerank(docs: any[]) {
  await sleep(LATENCY.GEMINI_RERANK);
  return docs.slice(0, 5).map(d => ({ ...d, rerankScore: 0.9 }));
}

async function serialExecution() {
  console.log('--- Serial Execution (Current Architecture) ---');
  const start = performance.now();

  // 1. Context Aware Transformation
  const transformedQuery = await mockGeminiTransform("test_query");
  console.log(`[${(performance.now() - start).toFixed(0)}ms] Transformed query`);

  // 2. Vector Search
  const candidates = await mockSupabaseVector(transformedQuery);
  console.log(`[${(performance.now() - start).toFixed(0)}ms] Vector search complete`);

  // 3. Reranking
  const finalDocs = await mockGeminiRerank(candidates);
  console.log(`[${(performance.now() - start).toFixed(0)}ms] Reranking complete`);

  console.log(`Total Time: ${(performance.now() - start).toFixed(0)}ms`);
}

async function optimizedExecution() {
  console.log('\n--- Optimized Execution (Parallel/Speculative) ---');
  const start = performance.now();

  // Start Transformation AND Vector Search (Original) in parallel
  const transformPromise = mockGeminiTransform("test_query");
  const originalVectorPromise = mockSupabaseVector("test_query");

  // Wait for whichever finishes? 
  // We want the transformed query if possible, but we don't want to wait idle.
  
  // Strategy:
  // 1. Fire Original Vector Search immediately.
  // 2. Fire Transform immediately.
  // 3. When Original Vector returns (300ms), if Transform is still running, we have a choice:
  //    a) Return Original results (FASTEST)
  //    b) Wait for Transform (800ms) then run New Vector (300ms) = 1100ms total
  //    c) Rerank Original results while waiting? 
  
  // Let's implement "Speculative Reranking":
  // We get Original Vector results at 300ms.
  // We start Reranking them immediately. (Takes 800ms -> finishes at 1100ms).
  // Meanwhile, Transform finishes at 800ms.
  // We run New Vector (300ms) -> finishes at 1100ms.
  // We have Reranked Original Docs AND New Vector Docs at 1100ms.
  // We merge them.
  // Total time: 1100ms (vs 1900ms serial).

  const [transformedQuery, originalCandidates] = await Promise.all([
    transformPromise,
    originalVectorPromise
  ]);
  
  console.log(`[${(performance.now() - start).toFixed(0)}ms] Transform & Original Vector done`);
  
  // Now run New Vector Search
  const newVectorPromise = mockSupabaseVector(transformedQuery);
  
  // And Rerank Original Candidates (simulate parallel work)
  // Note: In real JS single-thread event loop, these are async I/O so they overlap.
  const rerankOriginalPromise = mockGeminiRerank(originalCandidates);
  
  const [newCandidates, rerankedOriginal] = await Promise.all([
      newVectorPromise,
      rerankOriginalPromise
  ]);

  console.log(`[${(performance.now() - start).toFixed(0)}ms] New Vector & Original Rerank done`);

  // We could also rerank the new candidates, but that would add time.
  // If we merge reranked_original + raw_new, we might have scoring mismatch.
  // ideally we rerank everything together.
  
  // Alternative Optimization:
  // Skip Reranking if we trust the vector search enough?
  // Or Skip Transformation if Original Vector has high confidence?
}

serialExecution().then(optimizedExecution);
