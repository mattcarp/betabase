
import { getUnifiedRAGOrchestrator } from "../src/services/unifiedRAGOrchestrator";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";

async function testLatency() {
  const orchestrator = getUnifiedRAGOrchestrator();
  const query = "What is AOMA?";
  const sessionId = `test-session-${Date.now()}`;

  console.log("🚀 Starting Latency Test...");
  const start = performance.now();

  try {
    const result = await orchestrator.query(query, {
      sessionId,
      ...DEFAULT_APP_CONTEXT,
      useContextAware: true,
      useAgenticRAG: false,
      useRLHFSignals: true,
      topK: 5,
      targetConfidence: 0.7,
    });

    const end = performance.now();
    console.log(`\n✅ Test Complete!`);
    console.log(`Total Time: ${(end - start).toFixed(2)}ms`);
    console.log(`Metadata Time: ${result.metadata.totalTimeMs.toFixed(2)}ms`);
    console.log(`Strategy: ${result.metadata.strategy}`);
    console.log(`Documents: ${result.documents.length}`);

  } catch (error) {
    console.error("❌ Test Failed:", error);
  }
}

testLatency();
