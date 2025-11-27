#!/usr/bin/env tsx
/**
 * Run SQL Migration via Supabase pg-meta REST API
 */

import { config } from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';

config({ path: join(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runSQL(sql: string): Promise<any> {
  // Try the pg-meta query endpoint
  const response = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  console.log('🔧 Running Gemini 768 Migration via REST API...\n');
  
  // Read migration file
  const migrationSQL = readFileSync(
    join(process.cwd(), 'migrations', 'migrate-to-gemini-768.sql'),
    'utf-8'
  );
  
  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 60).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${preview}...`);
    
    try {
      await runSQL(stmt);
      console.log('   ✅ Success');
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
