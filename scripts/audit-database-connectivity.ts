#!/usr/bin/env tsx
/**
 * SIAM Database Connectivity Audit
 * 
 * Purpose: Verify connections to all Supabase tables and count records
 * Author: Claude + Mattie
 * Date: November 23, 2025
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(__dirname, '..', '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TableAudit {
  name: string;
  count: number | null;
  error: string | null;
  sample?: any;
}

async function auditTable(tableName: string, getSample: boolean = false): Promise<TableAudit> {
  try {
    // Get count
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return {
        name: tableName,
        count: null,
        error: countError.message
      };
    }
    
    // Get sample if requested
    let sample = null;
    if (getSample && count && count > 0) {
      const { data: sampleData } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
        .single();
      sample = sampleData;
    }
    
    return {
      name: tableName,
      count,
      error: null,
      sample
    };
  } catch (error: any) {
    return {
      name: tableName,
      count: null,
      error: error.message || 'Unknown error'
    };
  }
}

async function auditAllDatabases() {
  console.log('\n🔍 ========================================');
  console.log('   SIAM DATABASE CONNECTIVITY AUDIT');
  console.log('========================================\n');
  
  console.log(`📡 Connecting to: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
  
  const tables = [
    // Core test data
    { name: 'test_results', getSample: true, description: 'Test execution results' },
    { name: 'beta_base_scenarios', getSample: false, description: 'Historical AOMA tests from Beta Base' },
    { name: 'beta_base_executions', getSample: false, description: 'Beta Base execution history' },
    
    // Knowledge base
    { name: 'jira_tickets', getSample: true, description: 'JIRA tickets with embeddings' },
    { name: 'siam_vectors', getSample: false, description: 'Multi-tenant vector store' },
    
    // RLHF & feedback
    { name: 'rlhf_feedback', getSample: false, description: 'RLHF feedback from Curate tab' },
    
    // Firecrawl
    { name: 'firecrawl_data', getSample: false, description: 'Crawled web content' },
    
    // User management
    { name: 'user_roles', getSample: false, description: 'User roles & permissions' },
  ];
  
  const results: TableAudit[] = [];
  let totalRecords = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const table of tables) {
    process.stdout.write(`Auditing ${table.name}... `);
    const result = await auditTable(table.name, table.getSample);
    results.push(result);
    
    if (result.error) {
      console.log(`❌ ERROR`);
      console.log(`   Error: ${result.error}`);
      errorCount++;
    } else {
      console.log(`✅ ${result.count?.toLocaleString() || 0} records`);
      totalRecords += result.count || 0;
      successCount++;
      
      if (table.description) {
        console.log(`   ${table.description}`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('\n📊 ========================================');
  console.log('   AUDIT SUMMARY');
  console.log('========================================\n');
  
  console.log(`Total Tables Audited: ${tables.length}`);
  console.log(`Successful Connections: ${successCount} ✅`);
  console.log(`Failed Connections: ${errorCount} ❌`);
  console.log(`Total Records Found: ${totalRecords.toLocaleString()}\n`);
  
  // Detailed breakdown
  console.log('📈 Breakdown by Category:\n');
  
  const betaBaseTotal = (results.find(r => r.name === 'beta_base_scenarios')?.count || 0) +
                       (results.find(r => r.name === 'beta_base_executions')?.count || 0);
  console.log(`   Beta Base Data: ${betaBaseTotal.toLocaleString()}`);
  
  const testCount = results.find(r => r.name === 'test_results')?.count || 0;
  console.log(`   Test Results: ${testCount.toLocaleString()}`);
  
  const jiraCount = results.find(r => r.name === 'jira_tickets')?.count || 0;
  console.log(`   JIRA Tickets: ${jiraCount.toLocaleString()}`);
  
  const vectorCount = results.find(r => r.name === 'siam_vectors')?.count || 0;
  console.log(`   Vector Embeddings: ${vectorCount.toLocaleString()}`);
  
  // Sample data
  console.log('\n🔬 Sample Data:\n');
  
  const testSample = results.find(r => r.name === 'test_results' && r.sample);
  if (testSample?.sample) {
    console.log('Test Result Example:');
    console.log(JSON.stringify(testSample.sample, null, 2).substring(0, 500) + '...\n');
  }
  
  const jiraSample = results.find(r => r.name === 'jira_tickets' && r.sample);
  if (jiraSample?.sample) {
    console.log('JIRA Ticket Example:');
    console.log(JSON.stringify(jiraSample.sample, null, 2).substring(0, 500) + '...\n');
  }
  
  // Recommendations
  console.log('💡 Recommendations:\n');
  
  if (testCount === 0) {
    console.log('   ⚠️  No test_results found - need to seed test data');
  } else if (testCount < 100) {
    console.log('   ⚠️  Low test_results count - consider running more tests');
  } else {
    console.log('   ✅ Good test_results volume for demo');
  }
  
  if (betaBaseTotal === 0) {
    console.log('   ⚠️  No Beta Base data - need to import historical tests');
  } else {
    console.log(`   ✅ Excellent Beta Base data: ${betaBaseTotal.toLocaleString()} records`);
  }
  
  if (errorCount > 0) {
    console.log(`   ⚠️  ${errorCount} tables had connection errors - check schema`);
  }
  
  console.log('\n========================================\n');
  
  // Exit code
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run it!
auditAllDatabases().catch((error) => {
  console.error('\n❌ Fatal error during audit:');
  console.error(error);
  process.exit(1);
});
