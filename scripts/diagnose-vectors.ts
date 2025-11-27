#!/usr/bin/env npx tsx
/**
 * SIAM Vector Store Diagnostic Script
 * 
 * Run with: npx tsx scripts/diagnose-vectors.ts
 * 
 * This will tell us:
 * 1. How many rows are in each vector table
 * 2. How many have OpenAI embeddings vs Gemini embeddings
 * 3. Sample content to verify data exists
 * 4. Test a simple vector search with both providers
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 SIAM Vector Store Diagnostic\n');
  console.log('='.repeat(60));
  
  // 1. Check siam_vectors table (old OpenAI-only table)
  console.log('\n📊 Table: siam_vectors (legacy OpenAI table)');
  console.log('-'.repeat(40));
  
  try {
    const { count: siamVectorsCount, error: err1 } = await supabase
      .from('siam_vectors')
      .select('*', { count: 'exact', head: true });
    
    if (err1) {
      console.log('   ⚠️  Table may not exist or error:', err1.message);
    } else {
      console.log(`   Total rows: ${siamVectorsCount}`);
      
      // Get sample
      const { data: sample1 } = await supabase
        .from('siam_vectors')
        .select('source_type, content')
        .limit(3);
      
      if (sample1?.length) {
        console.log('   Sample content:');
        sample1.forEach((r, i) => {
          console.log(`     ${i + 1}. [${r.source_type}] ${r.content?.substring(0, 80)}...`);
        });
      }
    }
  } catch (e) {
    console.log('   ❌ Error querying siam_vectors:', e);
  }
  
  // 2. Check siam_unified_vectors table (new dual-embedding table)
  console.log('\n📊 Table: siam_unified_vectors (dual embedding table)');
  console.log('-'.repeat(40));
  
  try {
    const { count: unifiedCount, error: err2 } = await supabase
      .from('siam_unified_vectors')
      .select('*', { count: 'exact', head: true });
    
    if (err2) {
      console.log('   ⚠️  Table may not exist or error:', err2.message);
    } else {
      console.log(`   Total rows: ${unifiedCount}`);
      
      // Check embedding coverage
      const { count: openaiCount } = await supabase
        .from('siam_unified_vectors')
        .select('*', { count: 'exact', head: true })
        .not('embedding', 'is', null);
      
      const { count: geminiCount } = await supabase
        .from('siam_unified_vectors')
        .select('*', { count: 'exact', head: true })
        .not('embedding_gemini', 'is', null);
      
      console.log(`   Rows with OpenAI embedding: ${openaiCount}`);
      console.log(`   Rows with Gemini embedding: ${geminiCount}`);
      
      if (geminiCount === 0 || geminiCount === null) {
        console.log('\n   🚨 PROBLEM FOUND: No Gemini embeddings exist!');
        console.log('   The service is searching for Gemini embeddings but none exist.');
        console.log('   FIX: Either migrate embeddings OR change useGemini to false.');
      }
      
      // Get sample
      const { data: sample2 } = await supabase
        .from('siam_unified_vectors')
        .select('source_type, content, embedding_source')
        .limit(3);
      
      if (sample2?.length) {
        console.log('\n   Sample content:');
        sample2.forEach((r, i) => {
          console.log(`     ${i + 1}. [${r.source_type}] (${r.embedding_source || 'unknown'}) ${r.content?.substring(0, 60)}...`);
        });
      }
    }
  } catch (e) {
    console.log('   ❌ Error querying siam_unified_vectors:', e);
  }
  
  // 3. Check by organization/division/app_under_test
  console.log('\n📊 Data by tenant (sony-music/digital-operations/aoma)');
  console.log('-'.repeat(40));
  
  try {
    const { count: tenantCount } = await supabase
      .from('siam_unified_vectors')
      .select('*', { count: 'exact', head: true })
      .eq('organization', 'sony-music')
      .eq('division', 'digital-operations')
      .eq('app_under_test', 'aoma');
    
    console.log(`   Rows matching default tenant: ${tenantCount}`);
    
    // Also check siam_vectors
    const { count: legacyTenantCount } = await supabase
      .from('siam_vectors')
      .select('*', { count: 'exact', head: true })
      .eq('organization', 'sony-music')
      .eq('division', 'digital-operations')
      .eq('app_under_test', 'aoma');
    
    console.log(`   Legacy table matching tenant: ${legacyTenantCount}`);
  } catch (e) {
    console.log('   ❌ Error:', e);
  }
  
  // 4. Check source types distribution
  console.log('\n📊 Source types distribution (siam_unified_vectors)');
  console.log('-'.repeat(40));
  
  try {
    const { data: sourceTypes } = await supabase
      .from('siam_unified_vectors')
      .select('source_type')
      .limit(1000);
    
    if (sourceTypes) {
      const counts: Record<string, number> = {};
      sourceTypes.forEach(r => {
        counts[r.source_type] = (counts[r.source_type] || 0) + 1;
      });
      
      Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
  } catch (e) {
    console.log('   ❌ Error:', e);
  }
  
  // 5. Test vector search with a simple query
  console.log('\n🔍 Testing vector search for "what is AOMA"');
  console.log('-'.repeat(40));
  
  try {
    // Try OpenAI search
    const { data: openaiResults, error: openaiErr } = await supabase.rpc('match_siam_vectors', {
      p_organization: 'sony-music',
      p_division: 'digital-operations', 
      p_app_under_test: 'aoma',
      query_embedding: new Array(1536).fill(0.01), // Dummy embedding - won't match well but tests function
      match_threshold: 0.0,
      match_count: 5
    });
    
    if (openaiErr) {
      console.log('   OpenAI function error:', openaiErr.message);
    } else {
      console.log(`   OpenAI search (match_siam_vectors): ${openaiResults?.length || 0} results`);
    }
    
    // Try Gemini search  
    const { data: geminiResults, error: geminiErr } = await supabase.rpc('match_siam_vectors_gemini', {
      p_organization: 'sony-music',
      p_division: 'digital-operations',
      p_app_under_test: 'aoma', 
      query_embedding: new Array(768).fill(0.01), // Dummy embedding
      match_threshold: 0.0,
      match_count: 5
    });
    
    if (geminiErr) {
      console.log('   Gemini function error:', geminiErr.message);
    } else {
      console.log(`   Gemini search (match_siam_vectors_gemini): ${geminiResults?.length || 0} results`);
    }
  } catch (e) {
    console.log('   ❌ Search test error:', e);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Diagnostic complete!');
  console.log('\nIf Gemini embeddings are 0, the quick fix is to edit:');
  console.log('  src/services/supabaseVectorService.ts');
  console.log('  Change: useGemini = true  →  useGemini = false');
  console.log('\nOr run a migration to generate Gemini embeddings for existing data.');
}

diagnose().catch(console.error);
