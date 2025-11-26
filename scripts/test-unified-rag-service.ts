import { searchKnowledge } from '@/services/knowledgeSearchService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testUnifiedRag() {
  console.log('🚀 Testing Unified RAG with Gemini 3 Pro and Multi-Table Search...\n');

  const queries = [
    "What is AOMA?",
    "Show me authentication code",
    "Jira tickets about login"
  ];

  for (const query of queries) {
    console.log(`\n🔍 Query: "${query}"`);
    console.log('-'.repeat(50));
    
    try {
      const response = await searchKnowledge(query, { matchCount: 5 });
      
      console.log(`⏱️  Duration: ${response.durationMs}ms`);
      console.log(`📚 Sources Covered: ${response.stats.sourcesCovered.join(', ')}`);
      console.log(`📄 Results Found: ${response.results.length}`);
      
      response.results.forEach((result, i) => {
        console.log(`\n[${i + 1}] Source: ${result.source_type} | ID: ${result.source_id} | Sim: ${result.similarity?.toFixed(4)}`);
        console.log(`    Content: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });
    } catch (error) {
      console.error(`❌ Search failed for "${query}":`, error);
    }
    console.log('='.repeat(50));
  }
}

testUnifiedRag().catch(console.error);
