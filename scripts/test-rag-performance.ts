import { getSupabaseVectorService } from '../src/services/supabaseVectorService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testRAG() {
  console.log('🧪 Testing RAG System Performance\n');
  
  const vectorService = getSupabaseVectorService();
  
  const testQueries = [
    "What is AOMA?",
    "How does AOMA authentication work?",
    "What are the AOMA error codes?",
    "How do I deploy AOMA?",
    "What is the AOMA database schema?"
  ];
  
  for (const query of testQueries) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Query: "${query}"`);
    console.log('='.repeat(60));
    
    const start = performance.now();
    
    try {
      const results = await vectorService.searchVectors(query, {
        organization: 'sony-music',
        division: 'digital-operations',
        app_under_test: 'aoma',
        matchThreshold: 0.3,
        matchCount: 3,
        useGemini: true
      });
      
      const duration = performance.now() - start;
      
      console.log(`\n⏱️  Query time: ${duration.toFixed(0)}ms`);
      console.log(`📊 Results: ${results.length}`);
      
      results.forEach((result, i) => {
        console.log(`\n${i + 1}. [${(result.similarity * 100).toFixed(1)}%] ${result.metadata?.title || 'Untitled'}`);
        console.log(`   ${result.content.substring(0, 150)}...`);
      });
      
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ RAG Performance Test Complete');
  console.log('='.repeat(60));
}

testRAG().catch(console.error);
