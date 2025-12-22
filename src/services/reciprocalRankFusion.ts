/**
 * Reciprocal Rank Fusion (RRF) Algorithm
 * 
 * Combines multiple ranking signals (vector similarity, keyword/BM25, etc.)
 * into a single unified ranking. This is the standard approach used by
 * Elasticsearch, Pinecone, and most production RAG systems.
 * 
 * Formula: RRF(d) = Σ 1/(k + rank(d)) for each ranking signal
 * 
 * Benefits:
 * - No API calls needed (pure math)
 * - Handles different score scales gracefully
 * - Documents high in multiple signals get boosted
 * - Battle-tested algorithm (2009 paper, widely adopted)
 * 
 * Part of RAG Overhaul - Option C (Google-only, no Cohere)
 */

export interface RankedDocument {
  id: string;
  content: string;
  source_type: string;
  source_id: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RankingSignal {
  docId: string;
  rank: number; // 1-based rank in this signal
  score?: number; // Original score (for logging/debugging)
}

export interface RRFResult<T extends RankedDocument> {
  document: T;
  rrfScore: number;
  signalBreakdown: Record<string, number>;
  signalRanks: Record<string, number>;
}

/**
 * Reciprocal Rank Fusion
 * 
 * Combines multiple ranking signals using the RRF formula.
 * Documents that appear high in multiple signals get the highest scores.
 * 
 * @param documents - All unique documents from all signals
 * @param signals - Map of signal names to their rankings
 * @param k - RRF constant (default 60, from original paper)
 * @returns Documents sorted by RRF score with breakdown
 * 
 * @example
 * ```typescript
 * const signals = new Map([
 *   ['vector', [{ docId: 'a', rank: 1 }, { docId: 'b', rank: 2 }]],
 *   ['keyword', [{ docId: 'b', rank: 1 }, { docId: 'a', rank: 3 }]],
 * ]);
 * const results = reciprocalRankFusion(docs, signals);
 * // Doc 'b' scores higher: 1/(60+2) + 1/(60+1) = 0.0161 + 0.0164 = 0.0325
 * // Doc 'a' scores lower: 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
 * ```
 */
export function reciprocalRankFusion<T extends RankedDocument>(
  documents: T[],
  signals: Map<string, RankingSignal[]>,
  k: number = 60
): RRFResult<T>[] {
  // Build score map for each document
  const scoreMap = new Map<string, {
    total: number;
    breakdown: Record<string, number>;
    ranks: Record<string, number>;
  }>();

  // Initialize all documents with zero scores
  for (const doc of documents) {
    scoreMap.set(doc.id, { total: 0, breakdown: {}, ranks: {} });
  }

  // Apply RRF formula for each signal
  for (const [signalName, rankings] of signals) {
    for (const { docId, rank } of rankings) {
      const existing = scoreMap.get(docId);
      if (existing) {
        const contribution = 1 / (k + rank);
        existing.total += contribution;
        existing.breakdown[signalName] = contribution;
        existing.ranks[signalName] = rank;
      }
    }
  }

  // Build results array
  const results: RRFResult<T>[] = documents.map(doc => {
    const scoreData = scoreMap.get(doc.id)!;
    return {
      document: doc,
      rrfScore: scoreData.total,
      signalBreakdown: scoreData.breakdown,
      signalRanks: scoreData.ranks,
    };
  });

  // Sort by RRF score (highest first)
  results.sort((a, b) => b.rrfScore - a.rrfScore);

  return results;
}

/**
 * Merge and deduplicate documents from multiple sources
 * 
 * @param documentArrays - Arrays of documents from different sources
 * @returns Deduplicated array with best similarity score preserved
 */
export function mergeAndDeduplicate<T extends RankedDocument>(
  ...documentArrays: T[][]
): T[] {
  const docMap = new Map<string, T>();

  for (const docs of documentArrays) {
    for (const doc of docs) {
      const existing = docMap.get(doc.id);
      if (!existing) {
        docMap.set(doc.id, doc);
      } else if ((doc.similarity || 0) > (existing.similarity || 0)) {
        // Keep the one with higher similarity
        docMap.set(doc.id, doc);
      }
    }
  }

  return Array.from(docMap.values());
}

/**
 * Create ranking signals from search results
 * 
 * @param vectorResults - Results from vector search (sorted by similarity)
 * @param keywordResults - Results from keyword/BM25 search (sorted by rank)
 * @returns Map of signal names to rankings
 */
export function createRankingSignals(
  vectorResults: RankedDocument[],
  keywordResults: RankedDocument[]
): Map<string, RankingSignal[]> {
  const signals = new Map<string, RankingSignal[]>();

  // Vector signal
  signals.set(
    "vector",
    vectorResults.map((doc, idx) => ({
      docId: doc.id,
      rank: idx + 1,
      score: doc.similarity,
    }))
  );

  // Keyword signal
  signals.set(
    "keyword",
    keywordResults.map((doc, idx) => ({
      docId: doc.id,
      rank: idx + 1,
      score: doc.similarity, // BM25 score stored in similarity field
    }))
  );

  return signals;
}

/**
 * Weighted Reciprocal Rank Fusion
 * 
 * Variant that allows weighting different signals differently.
 * Useful when you trust one signal more than another.
 * 
 * @param documents - All unique documents
 * @param signals - Map of signal names to rankings
 * @param weights - Map of signal names to weights (default 1.0)
 * @param k - RRF constant
 */
export function weightedRRF<T extends RankedDocument>(
  documents: T[],
  signals: Map<string, RankingSignal[]>,
  weights: Map<string, number>,
  k: number = 60
): RRFResult<T>[] {
  const scoreMap = new Map<string, {
    total: number;
    breakdown: Record<string, number>;
    ranks: Record<string, number>;
  }>();

  // Initialize
  for (const doc of documents) {
    scoreMap.set(doc.id, { total: 0, breakdown: {}, ranks: {} });
  }

  // Apply weighted RRF
  for (const [signalName, rankings] of signals) {
    const weight = weights.get(signalName) ?? 1.0;

    for (const { docId, rank } of rankings) {
      const existing = scoreMap.get(docId);
      if (existing) {
        const contribution = weight * (1 / (k + rank));
        existing.total += contribution;
        existing.breakdown[signalName] = contribution;
        existing.ranks[signalName] = rank;
      }
    }
  }

  // Build and sort results
  const results: RRFResult<T>[] = documents.map(doc => {
    const scoreData = scoreMap.get(doc.id)!;
    return {
      document: doc,
      rrfScore: scoreData.total,
      signalBreakdown: scoreData.breakdown,
      signalRanks: scoreData.ranks,
    };
  });

  results.sort((a, b) => b.rrfScore - a.rrfScore);

  return results;
}

/**
 * Log RRF results for debugging
 */
export function logRRFResults<T extends RankedDocument>(
  results: RRFResult<T>[],
  topN: number = 5
): void {
  console.log(`\n📊 RRF Results (top ${topN}):`);
  console.log("─".repeat(80));

  for (let i = 0; i < Math.min(topN, results.length); i++) {
    const r = results[i];
    const signalInfo = Object.entries(r.signalRanks)
      .map(([signal, rank]) => `${signal}:#${rank}`)
      .join(", ");

    console.log(
      `${i + 1}. [${r.document.source_type}] RRF: ${r.rrfScore.toFixed(4)} (${signalInfo})`
    );
    console.log(`   ${r.document.content.substring(0, 80)}...`);
  }

  console.log("─".repeat(80));
}
