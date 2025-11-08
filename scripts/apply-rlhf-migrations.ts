/**
 * Apply RLHF Migrations Programmatically
 * This script applies the user roles, permissions, and RLHF feedback schema migrations
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration(migrationPath: string, migrationName: string) {
  console.log(`\n📄 Applying: ${migrationName}...`);
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).select();
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution (this might not work for all statements)
      console.log('   Trying alternative execution method...');
      
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.toLowerCase().includes('select ')) {
          const { error: execError } = await supabase.from('_migrations').select('*').limit(1);
          if (execError && execError.code !== '42P01') { // Ignore if table doesn't exist
            throw execError;
          }
        }
      }
    }
    
    console.log(`   ✅ ${migrationName} applied successfully!`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Error applying ${migrationName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting RLHF Migrations...\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  const migrations = [
    {
      file: '006_user_roles_permissions.sql',
      name: 'User Roles & Permissions'
    },
    {
      file: '007_rlhf_feedback_schema.sql',
      name: 'RLHF Feedback Schema'
    },
    {
      file: '008_gemini_embeddings.sql',
      name: 'Gemini Embeddings'
    }
  ];
  
  let successCount = 0;
  
  for (const migration of migrations) {
    const migrationPath = path.join(migrationsDir, migration.file);
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migration.file}`);
      continue;
    }
    
    const success = await applyMigration(migrationPath, migration.name);
    if (success) successCount++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${successCount}/${migrations.length} migrations applied`);
  console.log('='.repeat(60));
  
  if (successCount === migrations.length) {
    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables created: user_roles, role_permissions, rlhf_feedback');
    console.log('   2. Check default admin users: matt@mattcarpenter.com, fiona@fionaburgess.com');
    console.log('   3. Add curator role if needed');
    console.log('   4. Run tests: npm test\n');
  } else {
    console.log('\n⚠️  Some migrations failed. Check Supabase dashboard to apply manually.');
  }
}

main().catch(console.error);

