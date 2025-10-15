#!/usr/bin/env node

/**
 * Apply JIRA database migrations directly to Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying JIRA tables migration...');

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251013_create_jira_tables.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');

    console.log('📝 Reading migration file...');

    // Split SQL into individual statements (rough split on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`✅ Found ${statements.length} SQL statements`);

    // Execute each statement via Supabase
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n📊 Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\n📊 Verifying tables...');

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('jira_tickets')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Could not verify jira_tickets table:', tablesError);
    } else {
      console.log('✅ jira_tickets table exists and is accessible');
    }

    const { data: embeddings, error: embeddingsError } = await supabase
      .from('jira_ticket_embeddings')
      .select('id')
      .limit(1);

    if (embeddingsError) {
      console.error('❌ Could not verify jira_ticket_embeddings table:', embeddingsError);
    } else {
      console.log('✅ jira_ticket_embeddings table exists and is accessible');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

applyMigration()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });
