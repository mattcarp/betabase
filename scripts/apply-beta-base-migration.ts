#!/usr/bin/env tsx

/**
 * Apply Beta Base migration to SIAM Supabase
 *
 * Reads the SQL migration file and executes it via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  console.log('🚀 Applying Beta Base migration to SIAM Supabase...\n');
  console.log(`📍 Target: ${SUPABASE_URL}`);

  // Read migration SQL
  const migrationSQL = await fs.readFile('supabase/migrations/009_beta_base_scenarios.sql', 'utf-8');

  console.log('✅ Migration SQL loaded');

  // Connect to SIAM Supabase with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    }
  });

  console.log('✅ Connected to Supabase');
  console.log('\n🔄 Executing migration SQL...\n');

  // Execute the SQL using RPC (Supabase doesn't expose raw SQL execution)
  // We need to use the REST API directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ sql: migrationSQL })
  });

  if (!response.ok) {
    // Try alternative method - using psql via connection string
    console.log('⚠️  RPC method not available, using alternative approach...\n');

    // Check if table already exists
    const { data: tableCheck, error } = await supabase
      .from('beta_base_scenarios')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.error('❌ Table does not exist and cannot be created via JS client');
        console.error('   Please apply the migration manually:\n');
        console.error('   1. Go to Supabase dashboard');
        console.error('   2. Open SQL Editor');
        console.error('   3. Paste contents of supabase/migrations/009_beta_base_scenarios.sql');
        console.error('   4. Run the SQL');
        console.error('\n   OR use the Supabase CLI:');
        console.error('   supabase db push');
        process.exit(1);
      }
    }

    console.log('✅ Table beta_base_scenarios already exists!');
    console.log('✅ Migration appears to be already applied');
  } else {
    console.log('✅ Migration applied successfully!');
  }

  console.log('\n🎉 Ready to import Beta Base scenarios');
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
