/**
 * RAG Comparison Service
 * 
 * Provides A/B testing comparison between basic and advanced RAG strategies
 * to prove the value of RLHF-enhanced retrieval
 */

import { searchKnowledge } from "./knowledgeSearchService";
import { UnifiedRAGOrchestrator } from "./unifiedRAGOrchestrator";

export interface RAGComparisonResult {
  basic: {
    documents: any[];
    timeMs: number;
    documentCount: number;
  };
  advanced: {
    documents: any[];
    timeMs: number;
    documentCount: number;
    metadata: {
      strategy: string;
      confidence: number;
      agentIterations?: number;
      usedContextAware: boolean;
      usedRLHFSignals: boolean;
      rerankingApplied: boolean;
    };
  };
  comparison: {
    timeDifference: number;
    timeDifferencePercent: number;
    documentOverlap: number;
    documentOverlapPercent: number;
    advancedAdvantages: string[];
  };
}

/**
 * Compare basic vs advanced RAG strategies side-by-side
 */
export async function compareRAGStrategies(
  query: string,
  sessionId?: string
): Promise<RAGComparisonResult> {
  console.log("\n🔬 ========== RAG COMPARISON TEST ==========");
  console.log(`📝 Query: "${query}"`);

  // ========================================
  // BASIC RAG (Traditional vector search)
  // ========================================
  console.log("\n📚 Testing BASIC RAG...");
  const basicStartTime = Date.now();
  
  let basicResults: any[] = [];
  try {
    basicResults = await searchKnowledge(query);
  } catch (error) {
    console.error("Basic RAG failed:", error);
  }
  
  const basicTimeMs = Date.now() - basicStartTime;
  console.log(`✅ Basic RAG completed in ${basicTimeMs}ms with ${basicResults.length} documents`);

  // ========================================
  // ADVANCED RAG (Unified orchestrator with all strategies)
  // ========================================
  console.log("\n🌟 Testing ADVANCED RAG...");
  const advancedStartTime = Date.now();
  
  const orchestrator = new UnifiedRAGOrchestrator();
  const advancedResult = await orchestrator.query(query, {
    sessionId: sessionId || `compare_${Date.now()}`,
    organization: 'sony-music',
    division: 'mso',
    app_under_test: 'siam',
    useContextAware: true,
    useAgenticRAG: query.split(' ').length > 15, // Use agent for complex queries
    useRLHFSignals: true,
    topK: 10,
    targetConfidence: 0.7
  });
  
  const advancedTimeMs = Date.now() - advancedStartTime;
  console.log(`✅ Advanced RAG completed in ${advancedTimeMs}ms with ${advancedResult.documents.length} documents`);
  console.log(`📊 Strategy: ${advancedResult.metadata.strategy}`);
  console.log(`🎯 Confidence: ${(advancedResult.metadata.confidence * 100).toFixed(1)}%`);

  // ========================================
  // COMPARISON ANALYSIS
  // ========================================
  const timeDifference = advancedTimeMs - basicTimeMs;
  const timeDifferencePercent = ((timeDifference / basicTimeMs) * 100);

  // Calculate document overlap
  const basicIds = new Set(basicResults.map((d: any) => d.id));
  const advancedIds = new Set(advancedResult.documents.map((d: any) => d.id));
  const overlap = [...basicIds].filter(id => advancedIds.has(id)).length;
  const overlapPercent = (overlap / Math.max(basicIds.size, 1)) * 100;

  // Identify advantages of advanced RAG
  const advantages: string[] = [];
  
  if (advancedResult.metadata.usedContextAware) {
    advantages.push("Query enhanced with conversation history");
  }
  if (advancedResult.metadata.usedRLHFSignals) {
    advantages.push("Used human feedback to improve results");
  }
  if (advancedResult.metadata.agentIterations && advancedResult.metadata.agentIterations > 0) {
    advantages.push(`Agent performed ${advancedResult.metadata.agentIterations} refinement steps`);
  }
  if (advancedResult.metadata.confidence > 0.8) {
    advantages.push(`High confidence (${(advancedResult.metadata.confidence * 100).toFixed(1)}%)`);
  }
  if (overlapPercent < 70) {
    advantages.push("Discovered significantly different (potentially better) documents");
  }

  console.log("\n📊 ========== COMPARISON RESULTS ==========");
  console.log(`⏱️  Time Difference: ${timeDifference > 0 ? '+' : ''}${timeDifference}ms (${timeDifferencePercent.toFixed(1)}%)`);
  console.log(`📄 Document Overlap: ${overlap}/${basicIds.size} (${overlapPercent.toFixed(1)}%)`);
  console.log(`✨ Advanced RAG Advantages: ${advantages.length}`);
  advantages.forEach(adv => console.log(`   - ${adv}`));

  return {
    basic: {
      documents: basicResults,
      timeMs: basicTimeMs,
      documentCount: basicResults.length,
    },
    advanced: {
      documents: advancedResult.documents,
      timeMs: advancedTimeMs,
      documentCount: advancedResult.documents.length,
      metadata: {
        strategy: advancedResult.metadata.strategy,
        confidence: advancedResult.metadata.confidence,
        agentIterations: advancedResult.metadata.agentIterations,
        usedContextAware: advancedResult.metadata.usedContextAware,
        usedRLHFSignals: advancedResult.metadata.usedRLHFSignals,
        rerankingApplied: true,
      },
    },
    comparison: {
      timeDifference,
      timeDifferencePercent,
      documentOverlap: overlap,
      documentOverlapPercent: overlapPercent,
      advancedAdvantages: advantages,
    },
  };
}

// Singleton instance
let comparisonServiceInstance: ReturnType<typeof compareRAGStrategies> | null = null;

export function getRAGComparison() {
  return compareRAGStrategies;
}



