#!/usr/bin/env ts-node
/**
 * Seed Demo Data for Testing Tab
 * Populates rlhf_generated_tests and self_healing_attempts tables via Supabase API
 * Run: npx ts-node scripts/seed-demo-data.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedRLHFTests() {
  console.log("🧪 Seeding RLHF Generated Tests...");

  const tests = [
    {
      source_query: "How do I upload an image in Partner Previewer?",
      source_correction:
        "Users should click the Upload button in the top toolbar, select 'Local File', then browse for images. The app supports JPG, PNG, and SVG formats.",
      test_name: "Partner Previewer - Upload Local Image Flow",
      test_description: "Verifies the complete upload workflow for local images in Partner Previewer",
      test_code: `import { test, expect } from '@playwright/test';

test.describe('Partner Previewer - Upload Local Image', () => {
  test('should successfully upload a local image file', async ({ page }) => {
    await page.goto('/partner-previewer/dashboard');
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await page.click('[data-testid="upload-btn"]');
    await page.click('[data-testid="upload-local-option"]');
    
    const fileInput = await page.locator('input[type="file"]');
    await fileInput.setInputFiles('./test-assets/sample-image.jpg');
    
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="gallery-item"]').first()).toBeVisible();
  });
});`,
      test_language: "typescript",
      test_framework: "playwright",
      status: "passing",
      confidence: 0.94,
      generation_model: "gemini-2.0-flash",
      run_count: 12,
      pass_count: 11,
      fail_count: 1,
      avg_duration_ms: 3420,
      approved_by: "demo-curator",
      approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      generated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      source_query: "Where can I see all my projects in Partner Previewer?",
      source_correction:
        "The Dashboard shows all projects. Click 'Dashboard' in the left sidebar to see your project list with thumbnails and metadata.",
      test_name: "Partner Previewer - Dashboard Projects View",
      test_description: "Validates dashboard navigation and project list display",
      test_code: `import { test, expect } from '@playwright/test';

test.describe('Partner Previewer - Dashboard Navigation', () => {
  test('should display all projects in dashboard', async ({ page }) => {
    await page.goto('/partner-previewer');
    await page.click('[data-testid="sidebar-dashboard"]');
    await expect(page.locator('h1')).toContainText('Projects');
    
    const projectCards = page.locator('[data-testid="project-card"]');
    await expect(projectCards.first()).toBeVisible();
    await expect(projectCards.first().locator('[data-testid="project-name"]')).toBeVisible();
  });
});`,
      test_language: "typescript",
      test_framework: "playwright",
      status: "passing",
      confidence: 0.91,
      generation_model: "gemini-2.0-flash",
      run_count: 8,
      pass_count: 8,
      fail_count: 0,
      avg_duration_ms: 1850,
      approved_by: "demo-curator",
      approved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      last_run_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      generated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      source_query: "How do I copy a saved project in Partner Previewer?",
      source_correction:
        "To copy a project: 1) Open the project, 2) Click the '...' menu in top-right, 3) Select 'Duplicate Project', 4) Enter a new name and click Save.",
      test_name: "Partner Previewer - Duplicate Project Workflow",
      test_description: "Tests the complete project duplication flow with name input validation",
      test_code: `import { test, expect } from '@playwright/test';

test.describe('Partner Previewer - Duplicate Project', () => {
  test('should duplicate an existing project', async ({ page }) => {
    await page.goto('/partner-previewer/dashboard');
    await page.click('[data-testid="project-card"]:first-child');
    await expect(page.locator('[data-testid="project-canvas"]')).toBeVisible();
    await page.click('[data-testid="project-menu-btn"]');
    await page.click('[data-testid="menu-duplicate"]');
    await page.fill('[data-testid="project-name-input"]', 'My Duplicated Project');
    await page.click('[data-testid="save-duplicate-btn"]');
    await expect(page).toHaveURL(/\\/partner-previewer\\/project\\/[a-z0-9-]+/);
  });
});`,
      test_language: "typescript",
      test_framework: "playwright",
      status: "pending",
      confidence: 0.78,
      generation_model: "gemini-2.0-flash",
      run_count: 0,
      pass_count: 0,
      fail_count: 0,
      generated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const { data, error } = await supabase.from("rlhf_generated_tests").insert(tests).select();

  if (error) {
    console.error("❌ Failed to seed RLHF tests:", error.message);
    return 0;
  }

  console.log(`✅ Seeded ${data.length} RLHF generated tests`);
  return data.length;
}

async function seedSelfHealingAttempts() {
  console.log("🔧 Seeding Self-Healing Attempts...");

  const attempts = [
    {
      test_name: "Partner Previewer Upload Flow",
      test_file: "tests/e2e/partner-previewer/upload.spec.ts",
      original_selector: '[data-testid="upload-btn"]',
      suggested_selector: '[data-testid="toolbar-upload"]',
      status: "approved",
      tier: 1,
      confidence: 0.97,
      healing_strategy: "selector-update",
      similar_tests_affected: 3,
      ai_model: "gemini-2.0-flash",
      ai_reasoning:
        "The upload button was moved from standalone component to the main toolbar. High confidence due to exact text match and unique positioning.",
      execution_time_ms: 1240,
      error_message: 'Locator [data-testid="upload-btn"] not found',
      approved_by: "auto-heal-tier1",
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      organization: "sony-music",
      project: "partner-previewer",
    },
    {
      test_name: "Dashboard Project Card Display",
      test_file: "tests/e2e/partner-previewer/dashboard.spec.ts",
      original_selector: '[data-testid="project-card"] .project-title',
      suggested_selector: '[data-testid="project-card"] [data-testid="project-name"]',
      status: "review",
      tier: 2,
      confidence: 0.84,
      healing_strategy: "structure-adaptation",
      similar_tests_affected: 7,
      ai_model: "gemini-2.0-flash",
      ai_reasoning:
        "The project card component was refactored. The title is now wrapped in a semantic component with its own test ID. Medium confidence - the structure changed but the visual hierarchy is preserved.",
      execution_time_ms: 1680,
      error_message:
        'Locator [data-testid="project-card"] .project-title not found after 5000ms',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      organization: "sony-music",
      project: "partner-previewer",
    },
    {
      test_name: "Search Debounce Timing",
      test_file: "tests/e2e/partner-previewer/search.spec.ts",
      original_selector: "await page.waitForTimeout(500);",
      suggested_selector:
        'await page.waitForFunction(() => !document.querySelector(\'[data-testid="search-loading"]\'));',
      status: "review",
      tier: 3,
      confidence: 0.62,
      healing_strategy: "wait-strategy",
      similar_tests_affected: 1,
      ai_model: "gemini-2.0-flash",
      ai_reasoning:
        "The fixed timeout is causing flakiness. Suggested wait strategy checks for loading indicator instead. LOW confidence - requires understanding async search implementation and debounce behavior.",
      execution_time_ms: 3240,
      error_message: "Test timeout exceeded - search results did not appear within expected time",
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      organization: "sony-music",
      project: "partner-previewer",
    },
  ];

  const { data, error } = await supabase.from("self_healing_attempts").insert(attempts).select();

  if (error) {
    console.error("❌ Failed to seed self-healing attempts:", error.message);
    return 0;
  }

  console.log(`✅ Seeded ${data.length} self-healing attempts`);
  return data.length;
}

async function main() {
  console.log("🌱 Starting demo data seed...\n");

  const rlhfCount = await seedRLHFTests();
  const healingCount = await seedSelfHealingAttempts();

  console.log("\n✨ Seeding complete!");
  console.log(`   - ${rlhfCount} RLHF-generated tests`);
  console.log(`   - ${healingCount} self-healing attempts`);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});

