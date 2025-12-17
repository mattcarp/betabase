import { classifyIntent } from '../src/services/intentClassifier';

const testQueries = [
  "What's the status of the metadata project?",
  "How does the AOMA authentication system work?",
  "Show me recent commits related to the dashboard",
  "What did Sarah say about the deadline?",
  "Why is the API returning 500 errors?",
  "What are the system requirements for AOMA?",
];

async function runTests() {
  console.log('🧪 Testing Intent Classifier\n');
  
  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    const start = Date.now();
    const result = await classifyIntent(query);
    const duration = Date.now() - start;
    
    console.log(`   ⏱️  Duration: ${duration}ms`);
    console.log(`   🎯 Type: ${result.queryType}`);
    console.log(`   📚 Sources: [${result.relevantSources.join(', ')}]`);
    console.log(`   💪 Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`   💭 Reasoning: ${result.reasoning}`);
  }
}

runTests().catch(console.error);
