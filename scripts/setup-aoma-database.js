#!/usr/bin/env node

/**
 * Setup AOMA Firecrawl Database Schema
 * Run with: node scripts/setup-aoma-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up AOMA Firecrawl database schema...\n');
  
  try {
    // Read SQL schema file
    const sqlPath = path.join(process.cwd(), 'sql/aoma-firecrawl-schema.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Skip comments and empty statements
        if (!statement || statement.startsWith('--')) continue;
        
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(async (err) => {
          // If RPC doesn't exist, try direct execution (for simpler statements)
          // Note: This is a fallback - complex statements need to be run in Supabase dashboard
          console.log('   ⚠️ Direct SQL execution not available via client');
          return { error: err };
        });
        
        if (error) {
          console.log(`   ⚠️ Statement skipped (may already exist): ${statement.substring(0, 50)}...`);
          errorCount++;
        } else {
          console.log(`   ✅ Executed: ${statement.substring(0, 50)}...`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ⚠️ Error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary: ${successCount} successful, ${errorCount} skipped/failed\n`);
    
    // Test the tables exist
    console.log('🧪 Testing database setup...');
    
    const { data: vectors, error: vectorError } = await supabase
      .from('aoma_unified_vectors')
      .select('count')
      .limit(1);
    
    if (!vectorError) {
      console.log('   ✅ aoma_unified_vectors table exists');
    } else {
      console.log('   ❌ aoma_unified_vectors table not found:', vectorError.message);
    }
    
    const { data: sync, error: syncError } = await supabase
      .from('aoma_source_sync')
      .select('*')
      .eq('source_type', 'aoma_docs')
      .single();
    
    if (!syncError && sync) {
      console.log('   ✅ aoma_source_sync table exists and has initial data');
      console.log(`      Status: ${sync.sync_status}, Records: ${sync.records_count}`);
    } else {
      console.log('   ⚠️ aoma_source_sync table needs setup');
    }
    
    console.log('\n✅ Database setup check complete!');
    console.log('\n📝 Note: Some complex SQL statements may need to be run directly in the Supabase SQL Editor:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql');
    console.log('   2. Copy the content from: sql/aoma-firecrawl-schema.sql');
    console.log('   3. Run it in the SQL editor\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase();