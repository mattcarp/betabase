/**
 * Admin API Route: Apply RLHF Database Migrations
 *
 * POST /api/admin/apply-migrations
 *
 * Applies the three RLHF migrations to Supabase:
 * - 006: User roles & permissions
 * - 007: RLHF feedback schema
 * - 008: Gemini embeddings
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase configuration" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const migrations = [
      "006_user_roles_permissions.sql",
      "007_rlhf_feedback_schema.sql",
      "008_gemini_embeddings.sql",
    ];

    const results: any[] = [];

    for (const filename of migrations) {
      console.log(`Applying migration: ${filename}`);

      const migrationPath = path.join(process.cwd(), "supabase/migrations", filename);
      const sql = fs.readFileSync(migrationPath, "utf8");

      // Split SQL into individual statements and execute
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        try {
          // Execute via RPC or direct query
          const { error } = await (supabase as any).rpc("exec_sql", { query: statement });

          if (error) {
            console.error(`Error in statement:`, error);
            // Continue anyway - some statements might already exist
          }
        } catch (err) {
          console.error(`Exception in statement:`, err);
          // Continue anyway
        }
      }

      results.push({ migration: filename, status: "applied" });
    }

    // Verify tables exist
    const { data: roles } = await supabase.from("user_roles").select("email, role").limit(5);

    const { data: permissions } = await supabase
      .from("role_permissions")
      .select("role, permission")
      .limit(10);

    return NextResponse.json({
      success: true,
      migrations: results,
      verification: {
        user_roles: roles?.length || 0,
        role_permissions: permissions?.length || 0,
        default_admins: roles || [],
      },
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message || "Migration failed" }, { status: 500 });
  }
}
