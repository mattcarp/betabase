#!/usr/bin/env node

/**
 * Quick script to set up RLHF database tables
 * Run with: node scripts/setup-rlhf-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('\n📋 Please add to .env.local:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your-service-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('🚀 Setting up RLHF tables...\n');
  
  // Read migration files
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrations = [
    '006_user_roles_permissions.sql',
    '007_rlhf_feedback_schema.sql',
    '008_gemini_embeddings.sql'
  ];
  
  console.log('📄 Migration files to apply:');
  migrations.forEach(m => console.log(`   - ${m}`));
  
  console.log('\n⚠️  Note: These migrations should be applied via Supabase Dashboard');
  console.log('📍 Go to: https://supabase.com/dashboard → SQL Editor\n');
  
  // Check if tables exist
  console.log('🔍 Checking existing tables...\n');
  
  const tables = ['user_roles', 'role_permissions', 'rlhf_feedback'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ ${table}: Not found (needs migration)`);
    } else {
      console.log(`   ✅ ${table}: EXISTS`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 SETUP INSTRUCTIONS:');
  console.log('='.repeat(60));
  console.log('\n1. Open Supabase Dashboard SQL Editor');
  console.log('2. Copy and paste each migration file content');
  console.log('3. Execute them in order (006, 007, 008)');
  console.log('\nOR:');
  console.log('1. Use Supabase CLI: supabase db push');
  console.log('2. Or copy migrations to dashboard manually');
  console.log('\n' + '='.repeat(60));
}

setupTables().catch(console.error);

