#!/usr/bin/env tsx

/**
 * Comprehensive check of ALL databases, schemas, and tables
 * This will find where the actual vector data is stored
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: '.env.local' });

async function checkAllDatabasesAndSchemas() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("🔍 COMPREHENSIVE DATABASE DISCOVERY\n");
  console.log("=" .repeat(70));
  console.log(`Connected to: ${supabaseUrl}\n`);
  
  try {
    // First, check what schemas exist
    console.log("📂 CHECKING ALL SCHEMAS:\n");
    
    const { data: schemas, error: schemaError } = await supabase.rpc('get_all_schemas', {});
    
    if (schemaError) {
      // Try alternative query
      const schemasToCheck = ['public', 'storage', 'auth', 'pgvector', 'vector', 'embeddings', 'ml', 'ai'];
      
      console.log("Checking known schemas:\n");
      for (const schema of schemasToCheck) {
        try {
          // Try to query a table from each schema
          const { error } = await supabase
            .from(`${schema}.test`)
            .select('*', { count: 'exact', head: true });
          
          if (!error || error.message.includes('does not exist')) {
            console.log(`✅ Schema exists: ${schema}`);
          }
        } catch (e) {
          // Schema doesn't exist or no access
        }
      }
    } else if (schemas) {
      schemas.forEach((s: any) => {
        console.log(`  • ${s.schema_name}`);
      });
    }
    
    // Check all tables across all schemas
    console.log("\n" + "=" .repeat(70));
    console.log("📊 CHECKING ALL TABLES WITH ROW COUNTS:\n");
    
    // Query information_schema for all tables
    const { data: allTables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('schemaname, tablename')
      .not('schemaname', 'in', '(pg_catalog,information_schema)')
      .order('schemaname', { ascending: true })
      .order('tablename', { ascending: true });
    
    if (allTables) {
      console.log(`Found ${allTables.length} tables total\n`);
      
      let currentSchema = '';
      for (const table of allTables) {
        if (table.schemaname !== currentSchema) {
          currentSchema = table.schemaname;
          console.log(`\n📁 Schema: ${currentSchema}`);
          console.log("-" .repeat(50));
        }
        
        // Try to get row count
        try {
          const tableName = table.schemaname === 'public' 
            ? table.tablename 
            : `${table.schemaname}.${table.tablename}`;
          
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (count && count > 0) {
            console.log(`  ✅ ${table.tablename}: ${count.toLocaleString()} rows`);
            
            // Check if this might be a vector table
            if (table.tablename.toLowerCase().includes('vector') ||
                table.tablename.toLowerCase().includes('embed') ||
                table.tablename.toLowerCase().includes('aoma') ||
                table.tablename.toLowerCase().includes('cache')) {
              console.log(`     🎯 POTENTIAL VECTOR TABLE!`);
            }
          } else if (count === 0) {
            console.log(`  ○ ${table.tablename}: empty`);
          }
        } catch (e) {
          console.log(`  ❌ ${table.tablename}: access denied or error`);
        }
      }
    }
    
    // Specifically check for vector-related tables
    console.log("\n" + "=" .repeat(70));
    console.log("🎯 SEARCHING FOR VECTOR TABLES:\n");
    
    const vectorPatterns = [
      'vector', 'embedding', 'embed', 'aoma', 'knowledge', 
      'cache', 'similarity', 'semantic', 'ai', 'ml'
    ];
    
    for (const pattern of vectorPatterns) {
      const { data: matchingTables } = await supabase
        .from('pg_tables')
        .select('schemaname, tablename')
        .ilike('tablename', `%${pattern}%`);
      
      if (matchingTables && matchingTables.length > 0) {
        console.log(`\n📌 Tables matching "${pattern}":`);
        for (const table of matchingTables) {
          const fullName = table.schemaname === 'public' 
            ? table.tablename 
            : `${table.schemaname}.${table.tablename}`;
          
          try {
            const { count } = await supabase
              .from(fullName)
              .select('*', { count: 'exact', head: true });
            
            console.log(`   ${fullName}: ${count?.toLocaleString() || 0} rows`);
          } catch (e) {
            console.log(`   ${fullName}: unable to count`);
          }
        }
      }
    }
    
    // Check for pgvector extension
    console.log("\n" + "=" .repeat(70));
    console.log("🔧 CHECKING PGVECTOR INSTALLATION:\n");
    
    const { data: extensions } = await supabase
      .from('pg_extension')
      .select('extname, extversion')
      .eq('extname', 'vector');
    
    if (extensions && extensions.length > 0) {
      console.log(`✅ pgvector is installed (version ${extensions[0].extversion})`);
    } else {
      console.log("❌ pgvector extension NOT found");
    }
    
    // Check for vector columns in any table
    console.log("\n" + "=" .repeat(70));
    console.log("🔍 SEARCHING FOR VECTOR COLUMNS:\n");
    
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('table_schema, table_name, column_name, data_type')
      .or('data_type.eq.vector,column_name.ilike.%embedding%,column_name.ilike.%vector%')
      .not('table_schema', 'in', '(pg_catalog,information_schema)');
    
    if (columns && columns.length > 0) {
      console.log("Found columns that might contain vectors:\n");
      columns.forEach((col: any) => {
        console.log(`  ${col.table_schema}.${col.table_name}.${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log("No vector-type columns found in information_schema");
    }
    
    // Final summary
    console.log("\n" + "=" .repeat(70));
    console.log("📊 SUMMARY:\n");
    console.log(`Database URL: ${supabaseUrl}`);
    console.log(`Total tables found: ${allTables?.length || 0}`);
    
  } catch (error) {
    console.error("❌ Error during discovery:", error);
  }
}

// Run the comprehensive check
checkAllDatabasesAndSchemas()
  .then(() => {
    console.log("\n✨ Discovery complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });