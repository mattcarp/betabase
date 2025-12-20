
import { getUnifiedRAGOrchestrator } from "../src/services/unifiedRAGOrchestrator";
import { getSessionStateManager } from "../src/lib/sessionStateManager";

// Mock dependencies to avoid actual API calls during quality test (since we lack keys)
// This tests the logic flow and orchestration logic
const mockDocs = [
  { id: 'doc1', content: 'AOMA is the Asset and Offering Management Application.', source_type: 'knowledge', similarity: 0.95 },
  { id: 'doc2', content: 'You can login to AOMA at https://aoma.sonymusic.com', source_type: 'knowledge', similarity: 0.85 },
  { id: 'doc3', content: 'Jira ticket AOMA-123: Login issues reported.', source_type: 'jira', similarity: 0.82 }
];

// Mock external services to return deterministic results
// Note: We use type assertions because we are mocking private/internal behaviors
const mockContextAware = {
  transformQuery: async (q: string) => ({
    enhancedQuery: q.includes('it') ? `enhanced ${q}` : q, // Simulate transform if needed
    reasoningText: 'Mock transformation'
  })
};

// We need to set the API key so the constructor doesn't throw, 
// even though we mock the internals later.
process.env.GOOGLE_API_KEY = 'test';

const mockVectorService = {
  searchVectors: async (q: string) => {
    // Return different docs based on query to verify flow
    if (q.includes('enhanced')) return [...mockDocs, { id: 'doc4', content: 'Enhanced doc', similarity: 0.9 }];
    return mockDocs;
  }
};

const mockReranker = {
  rerankDocuments: async (q: string, docs: any[]) => ({
    documents: docs.map(d => ({ ...d, rerankScore: d.similarity + 0.01 })), // Slight boost
    metrics: { rerankedCount: docs.length }
  })
};

// We need to intercept the singleton getters or the class instances
// Since we can't easily mock the imports in ts-node without jest, 
// we will construct the orchestrator and manually inject mocks if possible,
// OR we will subclass/monkey-patch the singleton for this test.

const orchestrator = getUnifiedRAGOrchestrator();

// Monkey-patch the private properties (accessible at runtime in JS)
(orchestrator as any).contextAware = mockContextAware;
(orchestrator as any).twoStageRetrieval = { vectorService: mockVectorService }; // Nested patch
(orchestrator as any).reranker = mockReranker;


async function testQuality() {
  const options = {
    sessionId: 'test-session',
    organization: 'sony',
    division: 'music',
    app_under_test: 'aoma',
    useContextAware: true,
    useAgenticRAG: false
  };

  console.log('--- Test 1: Simple Query (No Transformation Expected) ---');
  const result1 = await orchestrator.query('What is AOMA?', options);
  console.log(`Documents retrieved: ${result1.documents.length}`);
  console.log(`Top document: ${result1.documents[0].content}`);
  console.log(`Strategy: ${result1.metadata.strategy}`);
  
  if (result1.documents.length === 3 && result1.documents[0].id === 'doc1') {
      console.log('✅ Quality Check Passed: Retrieved correct core documents.');
  } else {
      console.log('❌ Quality Check Failed: Documents do not match expected output.');
  }


  console.log('\n--- Test 2: Complex Query (Transformation Expected) ---');
  // Logic inside orchestrator mocks checks for "it" to trigger enhancement
  const result2 = await orchestrator.query('How do I access it?', options);
  console.log(`Documents retrieved: ${result2.documents.length}`);
  // Should include 'doc4' from enhanced search
  const hasEnhancedDoc = result2.documents.some((d: any) => d.content === 'Enhanced doc');
  console.log(`Includes enhanced document: ${hasEnhancedDoc}`);
  
  if (hasEnhancedDoc) {
      console.log('✅ Quality Check Passed: Enhanced search executed and results merged.');
  } else {
      console.log('❌ Quality Check Failed: Enhanced search results missing.');
  }
}

testQuality().catch(console.error);
