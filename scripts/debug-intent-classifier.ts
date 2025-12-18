/**
 * Debug: What sources is the Intent Classifier returning?
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/debug-intent-classifier.ts
 */

import { classifyIntent } from '../src/services/intentClassifier';

async function main() {
  const queries = [
    "I'm getting an 'Asset Upload Sorting Failed' error",
    "Search JIRA for Asset Upload Sorting Failed",
    "Do we have any JIRA tickets about upload errors?",
    "What's causing the Asset Upload Sorting Failed error in AOMA?",
  ];

  console.log('🧠 Testing Intent Classifier\n');
  console.log('═'.repeat(60));

  for (const query of queries) {
    console.log(`\n📝 Query: "${query}"\n`);
    
    try {
      const result = await classifyIntent(query);
      
      console.log(`   Query Type: ${result.queryType}`);
      console.log(`   Sources: [${result.relevantSources.join(', ')}]`);
      console.log(`   Confidence: ${result.confidence}`);
      console.log(`   Reasoning: ${result.reasoning}`);
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }

  console.log('\n✅ Intent Classifier debug complete!');
}

main().catch(console.error);


