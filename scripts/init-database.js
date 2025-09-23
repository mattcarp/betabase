#!/usr/bin/env node

/**
 * Initialize all knowledge base tables for AOMA Mesh MCP
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🚀 Creating AOMA Mesh MCP tables...\n');
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, '../sql/create-all-knowledge-tables.sql');
  const sql = await fs.readFile(sqlPath, 'utf8');
  
  // Split into individual statements and execute
  const statements = sql
    .split(';')
    .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
    .map(stmt => stmt.trim() + ';');
  
  console.log(`Executing ${statements.length} SQL statements...\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const statement of statements) {
    if (statement.length < 10) continue;
    
    const firstLine = statement.split('\n')[0].substring(0, 50);
    console.log(`Running: ${firstLine}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      }).catch(() => {
        // If RPC doesn't exist, try direct approach
        // This won't work but we'll handle it
        return { error: 'Need to run SQL manually' };
      });
      
      if (error) {
        console.log(`  ⚠️ ${error}`);
        errorCount++;
      } else {
        console.log(`  ✅ Success`);
        successCount++;
      }
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`Completed: ${successCount} successful, ${errorCount} errors`);
  
  if (errorCount > 0) {
    console.log('\n⚠️ Some statements failed. This is normal if tables already exist.');
    console.log('You may need to run the SQL manually in Supabase dashboard.');
  }
  
  // Now verify what tables we have
  console.log('\n🔍 Verifying tables...\n');
  
  const tables = ['aoma_knowledge', 'confluence_knowledge', 'alexandria_knowledge', 'jira_issues'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✅ ${table}: ${count || 0} records`);
    } else {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

createTables().catch(console.error);