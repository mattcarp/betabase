#!/usr/bin/env npx tsx
/**
 * Debug AOMA query to understand why knowledge docs aren't being retrieved
 */

import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabaseVectorService } from '../src/services/supabaseVectorService';
import { DEFAULT_APP_CONTEXT } from '../src/lib/supabase';

async function debugAOMAQuery() {
  const vectorService = getSupabaseVectorService();

  console.log('\n🔍 Debugging "What is AOMA?" query');
  console.log('='.repeat(60));

  const query = "What is AOMA?";

  // Test with very low threshold to see all matches
  console.log('\n📊 Testing with LOW threshold (0.3) to see all matches...');

  const results = await vectorService.searchVectors(query, {
    ...DEFAULT_APP_CONTEXT,
    matchThreshold: 0.3, // Very low to catch knowledge docs
    matchCount: 20,
    useGemini: true,
  });

  console.log(`\n📊 Found ${results.length} results:`);
  console.log('-'.repeat(60));

  for (const r of results) {
    const sim = (r.similarity * 100).toFixed(1);
    const contentPreview = r.content.substring(0, 80).replace(/\n/g, ' ');
    console.log(`[${r.source_type.padEnd(10)}] ${sim}% - ${contentPreview}...`);
  }

  // Check for knowledge source type specifically
  const knowledgeDocs = results.filter(r => r.source_type === 'knowledge');
  const jiraDocs = results.filter(r => r.source_type === 'jira');
  const gitDocs = results.filter(r => r.source_type === 'git');

  console.log('\n📊 Source Type Breakdown:');
  console.log(`   Knowledge: ${knowledgeDocs.length}`);
  console.log(`   Jira: ${jiraDocs.length}`);
  console.log(`   Git: ${gitDocs.length}`);

  if (knowledgeDocs.length > 0) {
    console.log('\n✅ Knowledge docs found:');
    for (const doc of knowledgeDocs) {
      console.log(`   ${(doc.similarity * 100).toFixed(1)}% - ${doc.source_id}`);
    }
  } else {
    console.log('\n❌ NO knowledge docs returned in top 20!');
    console.log('   This is the root cause of the hallucination.');
  }

  // Also test what's in the DB for knowledge type
  console.log('\n🔍 Checking all knowledge vectors in DB...');
  const { supabaseAdmin } = await import('../src/lib/supabase');

  if (supabaseAdmin) {
    // Check if knowledge docs have embedding_gemini populated
    const { data, error } = await supabaseAdmin
      .from('siam_vectors')
      .select('id, source_id, source_type, content, organization, division, app_under_test, embedding_gemini')
      .eq('source_type', 'knowledge')
      .limit(10);

    if (error) {
      console.log('   Error:', error.message);
    } else if (data && data.length > 0) {
      console.log(`   Found ${data.length} knowledge vectors:`);
      for (const v of data) {
        const hasGemini = v.embedding_gemini && v.embedding_gemini.length > 0;
        console.log(`   - ${v.source_id} (${v.organization}/${v.division}/${v.app_under_test})`);
        console.log(`     embedding_gemini: ${hasGemini ? 'HAS (' + v.embedding_gemini.length + 'd)' : 'NULL'}`);
        console.log(`     Content: ${v.content?.substring(0, 100)}...`);
      }

      // Count how many have embedding_gemini
      const withGemini = data.filter(v => v.embedding_gemini && v.embedding_gemini.length > 0).length;
      console.log(`\n📊 Knowledge vectors with embedding_gemini: ${withGemini} / ${data.length}`);

      if (withGemini === 0) {
        console.log('   ❌ CRITICAL: Knowledge docs have NO Gemini embeddings!');
        console.log('   The match_siam_vectors_gemini function requires embedding_gemini IS NOT NULL');
        console.log('   Solution: Re-index knowledge docs or manually populate embedding_gemini');
      }
    } else {
      console.log('   No knowledge vectors found!');
    }
  }
}

debugAOMAQuery().catch(console.error);
