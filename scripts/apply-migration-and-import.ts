#!/usr/bin/env tsx

/**
 * Apply Beta Base migration and import scenarios to SIAM Supabase
 *
 * This script:
 * 1. Reads the exported JSON from the dry-run
 * 2. Connects to SIAM Supabase
 * 3. Inserts scenarios and executions
 *
 * Usage:
 *   npx tsx scripts/apply-migration-and-import.ts data/beta-base-scenarios-2025-11-09.json
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

interface ProcessedScenario {
  beta_base_id: number;
  name: string;
  script_text: string;
  expected_result_text: string;
  preconditions_text: string;
  created_at: string;
  created_by: string;
  tags: string[];
  relevance_score: number;
  tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH';
  execution_count: number;
  pass_rate: number;
  last_execution_date: string | null;
  metadata: {
    original_html_script: string;
    original_html_expected: string;
    original_html_preconditions: string;
    is_security: boolean;
    review_flag: boolean;
    flag_reason: string | null;
    coverage: string | null;
    client_priority: number | null;
  };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Usage: npx tsx scripts/apply-migration-and-import.ts <json-file>');
    console.error('Example: npx tsx scripts/apply-migration-and-import.ts data/beta-base-scenarios-2025-11-09.json');
    process.exit(1);
  }

  const jsonFile = args[0];

  console.log('🚀 Beta Base Import to SIAM Starting...\n');
  console.log(`📄 Reading: ${jsonFile}`);

  // Read JSON file
  const jsonContent = await fs.readFile(jsonFile, 'utf-8');
  const data = JSON.parse(jsonContent);
  const scenarios: ProcessedScenario[] = data.scenarios;

  console.log(`✅ Loaded ${scenarios.length} scenarios from file`);

  // Connect to SIAM Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  console.log(`✅ Connected to SIAM Supabase: ${SUPABASE_URL}`);

  // Check if table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('beta_base_scenarios')
    .select('id')
    .limit(1);

  if (tableError && tableError.message.includes('does not exist')) {
    console.error('❌ Table beta_base_scenarios does not exist!');
    console.error('   You need to apply migration 009_beta_base_scenarios.sql first');
    console.error('   Run: supabase db push or apply the SQL manually');
    process.exit(1);
  }

  console.log('✅ Table beta_base_scenarios exists');

  // Insert scenarios in batches
  const BATCH_SIZE = 100;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < scenarios.length; i += BATCH_SIZE) {
    const batch = scenarios.slice(i, i + BATCH_SIZE);

    console.log(`\n🔄 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(scenarios.length / BATCH_SIZE)} (${batch.length} scenarios)...`);

    const { data: insertedData, error } = await supabase
      .from('beta_base_scenarios')
      .upsert(
        batch.map(s => ({
          beta_base_id: s.beta_base_id,
          name: s.name,
          script_text: s.script_text,
          expected_result_text: s.expected_result_text,
          preconditions_text: s.preconditions_text,
          created_at: s.created_at,
          created_by: s.created_by,
          tags: s.tags,
          relevance_score: s.relevance_score,
          tier: s.tier,
          execution_count: s.execution_count,
          pass_rate: s.pass_rate,
          last_execution_date: s.last_execution_date,
          metadata: s.metadata,
        })),
        {
          onConflict: 'beta_base_id',
          ignoreDuplicates: false
        }
      )
      .select('id');

    if (error) {
      console.error(`❌ Error inserting batch: ${error.message}`);
      console.error(error);
      skipped += batch.length;
    } else {
      inserted += insertedData?.length || batch.length;
      console.log(`✅ Inserted ${insertedData?.length || batch.length} scenarios`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📊 Import Complete:');
  console.log(`  ✅ Inserted: ${inserted}`);
  console.log(`  ⚠️  Skipped: ${skipped}`);
  console.log(`  📦 Total: ${scenarios.length}`);

  console.log('\n🎉 Beta Base scenarios imported to SIAM successfully!');
  console.log('\n📍 Next steps:');
  console.log('  1. Generate embeddings for vector search');
  console.log('  2. Test similarity search queries');
  console.log('  3. Build Beta Base Explorer UI');
}

main().catch(error => {
  console.error('❌ Import failed:', error);
  process.exit(1);
});
