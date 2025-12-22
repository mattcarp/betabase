#!/usr/bin/env npx ts-node
/**
 * Test the new multi-source search
 * Tests both wiki_documents (OpenAI 1536d) and siam_vectors (Gemini 768d)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getSupabaseVectorService } from "../src/services/supabaseVectorService";

const DEFAULT_APP_CONTEXT = {
  organization: "Sony Music",
  division: "Digital Operations", 
  app_under_test: "AOMA",
};

async function testMultiSourceSearch() {
  console.log("🧪 Testing Multi-Source Search\n");
  console.log("=" .repeat(60));
  
  const vectorService = getSupabaseVectorService();
  
  const testQueries = [
    "What is AOMA?",
    "How do I register a master?",
    "media conversion types",
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    console.log("-".repeat(60));
    
    try {
      const results = await vectorService.searchMultiSource(query, {
        ...DEFAULT_APP_CONTEXT,
        matchThreshold: 0.3, // Lower threshold to catch more results
        matchCount: 5,
        includeWikiDocs: true,
        includeSiamVectors: true,
        appNameFilter: 'AOMA', // Was 'AOMA_WIKI' - most docs are under 'AOMA'
      });

      console.log(`\n📊 Results: ${results.length}`);
      
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const sourceTable = (r as any).source_table || 'unknown';
        const similarity = ((r.similarity || 0) * 100).toFixed(1);
        const preview = r.content?.substring(0, 150).replace(/\n/g, ' ') || 'no content';
        const title = r.metadata?.title || r.source_id || 'untitled';
        
        console.log(`\n   ${i + 1}. [${sourceTable}] ${similarity}% - ${title}`);
        console.log(`      "${preview}..."`);
      }
      
    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ Test complete");
}

testMultiSourceSearch().catch(console.error);
