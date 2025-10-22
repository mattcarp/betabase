#!/usr/bin/env node

/**
 * Deploy Supabase Migration Script
 * Executes the optimized vector store migration SQL directly
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployMigration() {
  console.log("🚀 DEPLOYING SUPABASE MIGRATION\n");
  console.log("═".repeat(80));

  // Read the migration SQL file
  const migrationPath = path.join(
    __dirname,
    "../supabase/migrations/001_aoma_vector_store_optimized.sql"
  );

  console.log(`\n📄 Reading migration file: ${migrationPath}\n`);

  if (!fs.existsSync(migrationPath)) {
    console.error("❌ Migration file not found!");
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, "utf8");

  console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);
  console.log("═".repeat(80));
  console.log("\n🔧 Executing migration SQL...\n");

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc("exec", {
      sql: migrationSQL,
    });

    if (error) {
      // If exec RPC doesn't exist, we need to use a different approach
      // Let's try executing it via the REST API directly
      console.log("⚠️  RPC exec not available, trying direct execution...\n");

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ";";

        // Skip comments
        if (statement.startsWith("--") || statement.startsWith("COMMENT")) {
          continue;
        }

        console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);
        console.log(`Preview: ${statement.substring(0, 80)}...`);

        try {
          // For CREATE statements, we can use the REST API
          // But Supabase JS client doesn't support raw SQL execution
          // We'll need to indicate manual execution is required
          console.log("⚠️  Statement requires manual execution via Supabase Dashboard");
          successCount++;
        } catch (err) {
          console.error(`❌ Error: ${err.message}`);
          errorCount++;
        }
      }

      console.log("\n" + "═".repeat(80));
      console.log("\n📋 MIGRATION SUMMARY:\n");
      console.log(`   Total statements: ${statements.length}`);
      console.log(`   Ready for execution: ${successCount}`);
      console.log(`   Errors: ${errorCount}`);
      console.log("\n" + "═".repeat(80));
      console.log("\n⚠️  MANUAL EXECUTION REQUIRED:\n");
      console.log("The Supabase JS client cannot execute raw SQL migrations.");
      console.log("Please execute the migration manually via Supabase Dashboard:\n");
      console.log("1. Go to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/editor");
      console.log('2. Click "SQL Editor"');
      console.log('3. Click "New Query"');
      console.log(
        "4. Copy the contents of: supabase/migrations/001_aoma_vector_store_optimized.sql"
      );
      console.log("5. Paste into the SQL editor");
      console.log('6. Click "Run" to execute\n');
      console.log("═".repeat(80));
      console.log("\n💡 ALTERNATIVE: Use psql command:\n");
      console.log("   Get your database password from Supabase Dashboard");
      console.log("   Then run:");
      console.log(
        '   psql "postgresql://postgres:<PASSWORD>@db.kfxetwuuzljhybfgmpuc.supabase.co:5432/postgres" -f supabase/migrations/001_aoma_vector_store_optimized.sql\n'
      );

      process.exit(0);
    }

    console.log("✅ Migration executed successfully!\n");
    console.log("═".repeat(80));
    console.log("\n🎉 NEXT STEPS:\n");
    console.log("1. Verify RPC functions: node scripts/inspect-supabase-schema.js");
    console.log("2. Run first crawl (VPN required): npx ts-node scripts/master-crawler.ts");
    console.log("3. Check vector stats: SELECT * FROM aoma_vector_stats;\n");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
    console.error("\nStack trace:", err.stack);
    process.exit(1);
  }
}

deployMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Fatal error:", err.message);
    process.exit(1);
  });
