/**
 * Setup RLHF Database Tables
 * 
 * This script creates the necessary tables for RLHF directly using Supabase client.
 * Run with: node scripts/setup-rlhf-db.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

console.log('🚀 Setting up RLHF Database Tables');
console.log(`📍 Target: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function setupDatabase() {
  try {
    // First, check if tables already exist by trying to query them
    console.log('🔍 Checking existing tables...\n');
    
    const { data: existingRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
    
    if (!rolesError && existingRoles !== null) {
      console.log('✅ Tables already exist!');
      console.log('   Checking existing data...\n');
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('email, role');
      
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('role, permission');
      
      console.log(`📊 Current Status:`);
      console.log(`   - user_roles: ${roles?.length || 0} rows`);
      console.log(`   - role_permissions: ${perms?.length || 0} rows\n`);
      
      if (roles && roles.length > 0) {
        console.log('👥 Existing users with roles:');
        roles.forEach(r => console.log(`   - ${r.email} → ${r.role}`));
      }
      
      console.log('\n✅ Database already configured!');
      console.log('\n📋 You can now:');
      console.log('   1. Login with matt@mattcarpenter.com or fiona@fionaburgess.com');
      console.log('   2. Visit the Curate tab');
      console.log('   3. See the RLHF tab (purple accent)!');
      
      return;
    }
    
    // Tables don't exist - need to create them via SQL
    console.log('⚠️  Tables not found - they need to be created via SQL migrations');
    console.log('\n📝 Please run these migrations in your Supabase SQL Editor:');
    console.log('   https://' + supabaseUrl.replace('https://', '').split('.')[0] + '.supabase.co/project/_/sql');
    console.log('\n   Migrations to run:');
    console.log('   1. supabase/migrations/006_user_roles_permissions.sql');
    console.log('   2. supabase/migrations/007_rlhf_feedback_schema.sql');
    console.log('   3. supabase/migrations/008_gemini_embeddings.sql');
    console.log('\n   Or run: supabase db push (if using local Supabase CLI)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupDatabase();

