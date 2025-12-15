import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function countRecords() {
  console.log(`\n📊 Counting records for Supabase instance: ${supabaseUrl}\n`);
  console.log('-'.repeat(60));
  console.log(`${'TABLE NAME'.padEnd(40)} | ${'COUNT'.padStart(10)}`);
  console.log('-'.repeat(60));

  // Get all tables in the public schema
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (error) {
    console.error('❌ Error fetching tables:', error.message);
    // Fallback list if information_schema is restricted
    const fallbackTables = [
      'siam_vectors',
      'test_results',
      'test_runs',
      'test_specs',
      'generated_tests',
      'test_feedback',
      'rlhf_feedback',
      'firecrawl_cache',
      'migration_status'
    ];
    console.log('⚠️  Could not list tables automatically. Checking known tables...\n');
    
    for (const table of fallbackTables) {
      await countTable(table);
    }
    return;
  }

  // Count records for each table
  for (const table of tables) {
    await countTable(table.table_name);
  }
  console.log('-'.repeat(60));
}

async function countTable(tableName: string) {
  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`${tableName.padEnd(40)} | ${'ERROR'.padStart(10)} (${error.message})`);
  } else {
    console.log(`${tableName.padEnd(40)} | ${count?.toLocaleString().padStart(10)}`);
  }
}

countRecords().catch(console.error);
