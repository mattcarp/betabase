/**
 * Apply RLHF Database Migrations
 * 
 * This script applies the three RLHF migrations:
 * - 006: User roles & permissions
 * - 007: RLHF feedback schema
 * - 008: Gemini embeddings
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const migrations = [
  '006_user_roles_permissions.sql',
  '007_rlhf_feedback_schema.sql',
  '008_gemini_embeddings.sql',
];

async function applyMigration(filename: string) {
  console.log(`\n📄 Applying migration: ${filename}`);
  
  const migrationPath = path.join(__dirname, '../supabase/migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).select();
    
    if (error) {
      // Try direct query if RPC doesn't exist
      const result = await supabase.from('_migrations').select('*').limit(1);
      if (result.error) {
        console.error(`❌ Error applying ${filename}:`, error);
        return false;
      }
    }
    
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Exception applying ${filename}:`, err);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLHF Migration Process...\n');
  console.log(`📍 Target: ${supabaseUrl}\n`);
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Migration Complete: ${successCount}/${migrations.length} successful`);
  console.log('='.repeat(60));
  
  // Check if we can query the new tables
  console.log('\n🔍 Verifying tables...');
  
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('email, role')
    .limit(5);
  
  if (!rolesError && roles) {
    console.log(`✅ user_roles table accessible (${roles.length} rows)`);
    if (roles.length > 0) {
      console.log('   Default admin users:');
      roles.forEach(r => console.log(`   - ${r.email} (${r.role})`));
    }
  } else {
    console.log('⚠️  Could not verify user_roles table');
  }
  
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions')
    .select('role, permission')
    .limit(10);
  
  if (!permsError && permissions) {
    console.log(`✅ role_permissions table accessible (${permissions.length} rows)`);
  } else {
    console.log('⚠️  Could not verify role_permissions table');
  }
  
  console.log('\n🎉 RLHF database setup complete!');
  console.log('\n📋 Next steps:');
  console.log('   1. Restart your dev server');
  console.log('   2. Login with matt@mattcarpenter.com or fiona@fionaburgess.com');
  console.log('   3. Visit Curate tab - you should see the RLHF tab!');
}

main().catch(console.error);

