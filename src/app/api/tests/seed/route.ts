/**
 * Test Data Seeding API
 * 
 * Populates rlhf_generated_tests, self_healing_attempts, and test_results
 * with meaningful, project-contextual data for the demo.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase Admin not configured" }, { status: 500 });
    }

    // 1. Fetch some real RLHF feedback to link to
    const { data: feedbackItems } = await supabaseAdmin
      .from("rlhf_feedback")
      .select("id, query, response, feedback_value")
      .not("feedback_value->>suggestedCorrection", "is", null)
      .limit(5);

    // 2. Seed RLHF Generated Tests
    const rlhfTests = [
      {
        id: uuidv4(),
        source_feedback_id: feedbackItems?.[0]?.id || null,
        source_query: "Show me the Dolby Atmos delivery specs",
        source_correction: "The AI missed the bit-depth requirement (24-bit).",
        test_name: "Dolby Atmos Bit-Depth Validation",
        test_description: "Verify the system correctly identifies 24-bit requirements for Atmos delivery.",
        test_code: `import { test, expect } from '@playwright/test';\n\ntest('Atmos Bit-Depth Check', async ({ page }) => {\n  await page.goto('/aoma/delivery-specs');\n  const bitDepth = await page.locator('[data-test-id=\"atmos-bit-depth\"]').innerText();\n  expect(bitDepth).toContain('24-bit');\n});`,
        status: "approved",
        confidence: 0.95,
        generation_model: "gemini-2.0-flash",
        run_count: 12,
        pass_count: 11,
        fail_count: 1,
        generated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      },
      {
        id: uuidv4(),
        source_feedback_id: feedbackItems?.[1]?.id || null,
        source_query: "How do I upload a batch of master assets?",
        source_correction: "The 'Global Upload' button was moved to the sidebar.",
        test_name: "Batch Master Upload Navigation",
        test_description: "Test navigation to the new global upload location in the sidebar.",
        test_code: `import { test, expect } from '@playwright/test';\n\ntest('Sidebar Upload Navigation', async ({ page }) => {\n  await page.goto('/aoma/dashboard');\n  await page.click('[data-test-id=\"sidebar-upload-trigger\"]');\n  await expect(page).toHaveURL(/.*upload/);\n});`,
        status: "passing",
        confidence: 0.88,
        generation_model: "gemini-2.0-flash",
        run_count: 45,
        pass_count: 45,
        fail_count: 0,
        generated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      }
    ];

    const { error: rlhfError } = await supabaseAdmin
      .from("rlhf_generated_tests")
      .upsert(rlhfTests);

    if (rlhfError) console.error("RLHF Seed Error:", rlhfError);

    // 3. Seed Self-Healing Attempts
    const healingAttempts = [
      {
        id: uuidv4(),
        test_name: "Partner_Previewer_Asset_Sync.spec.ts",
        test_file: "tests/partner/asset-sync.spec.ts",
        status: "success",
        tier: 1,
        confidence: 0.98,
        original_selector: "[data-testid='sync-assets-btn']",
        suggested_selector: "[data-testid='partner-sync-global']",
        healing_strategy: "selector-update",
        healing_rationale: "The button was renamed during the v2.4 UI migration but maintains identical parent hierarchy and semantic labels.",
        similar_tests_affected: 4,
        ai_model: "gemini-3-flash-preview",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
      },
      {
        id: uuidv4(),
        test_name: "AOMA_User_Permissions_Check.spec.ts",
        test_file: "tests/aoma/auth/permissions.spec.ts",
        status: "review",
        tier: 2,
        confidence: 0.72,
        original_selector: ".admin-role-toggle",
        suggested_selector: "#rbac-v2-admin-toggle",
        healing_strategy: "structure-adaptation",
        healing_rationale: "The roles management page underwent a major structural change. The old class-based selector no longer exists, but the new ID-based selector appears to serve the same function in the new RBAC module.",
        similar_tests_affected: 1,
        ai_model: "gemini-3-flash-preview",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ];

    const { error: healingError } = await supabaseAdmin
      .from("self_healing_attempts")
      .upsert(healingAttempts);

    if (healingError) console.error("Healing Seed Error:", healingError);

    // 4. Seed Daily Analytics Snapshots
    const analytics = [];
    for (let i = 14; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      analytics.push({
        date: dateStr,
        total_tests: 8719,
        total_executions: 12000 + (14-i) * 50,
        pass_rate: 78 + (14-i) * 0.5,
        self_healed_count: Math.floor(Math.random() * 5) + 2,
        failed_count: 10 + i,
        created_at: new Date().toISOString()
      });
    }

    // Since test_analytics_daily is a view or table, let's try to insert if it's a table
    // For the demo, we might just return this data from the analytics API if the table insert fails
    // But let's try a bulk insert into test_results to populate real data
    const testResults = [];
    const statuses = ["passed", "passed", "passed", "failed", "passed"];
    for (let i = 0; i < 50; i++) {
      testResults.push({
        id: uuidv4(),
        test_name: `Demo_Test_${i}`,
        suite_name: i % 2 === 0 ? "AOMA Functional" : "Partner Integration",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        duration_ms: Math.floor(Math.random() * 5000) + 1000,
        created_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7).toISOString()
      });
    }

    const { error: resultsError } = await supabaseAdmin
      .from("test_results")
      .insert(testResults);

    if (resultsError) console.error("Results Seed Error:", resultsError);

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      rlhfCount: rlhfTests.length,
      healingCount: healingAttempts.length,
      resultsCount: testResults.length
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

