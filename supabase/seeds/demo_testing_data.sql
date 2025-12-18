-- Demo Testing Data for Testing Tab
-- Seeds realistic RLHF-generated tests and self-healing attempts based on actual Betabase tests
-- Created: 2025-12-18

-- ============================================================================
-- PART 1: RLHF-Generated Tests (from curator feedback)
-- ============================================================================

-- Insert RLHF-generated tests based on real Partner Previewer test scenarios
INSERT INTO rlhf_generated_tests (
  id,
  source_feedback_id,
  source_query,
  source_correction,
  test_name,
  test_description,
  test_code,
  test_language,
  test_framework,
  status,
  confidence,
  generation_model,
  generation_prompt,
  generation_tokens,
  approved_by,
  approved_at,
  last_run_at,
  last_run_result,
  run_count,
  pass_count,
  fail_count,
  avg_duration_ms,
  generated_at,
  updated_at
) VALUES
-- Test 1: Upload workflow from curator correction
(
  gen_random_uuid(),
  NULL, -- Will link to actual feedback if it exists
  'How do I upload an image in Partner Previewer?',
  'Users should click the Upload button in the top toolbar, select "Local File", then browse for images. The app supports JPG, PNG, and SVG formats.',
  'Partner Previewer - Upload Local Image Flow',
  'Verifies the complete upload workflow for local images in Partner Previewer',
  E'import { test, expect } from ''@playwright/test'';

test.describe(''Partner Previewer - Upload Local Image'', () => {
  test(''should successfully upload a local image file'', async ({ page }) => {
    // Navigate to Partner Previewer
    await page.goto(''/partner-previewer/dashboard'');
    
    // Wait for dashboard to load
    await expect(page.locator(''[data-testid="dashboard-header"]'')).toBeVisible();
    
    // Click Upload button in toolbar
    await page.click(''[data-testid="upload-btn"]'');
    
    // Select "Local File" option
    await page.click(''[data-testid="upload-local-option"]'');
    
    // Upload a test image
    const fileInput = await page.locator(''input[type="file"]'');
    await fileInput.setInputFiles(''./test-assets/sample-image.jpg'');
    
    // Verify upload success message
    await expect(page.locator(''[data-testid="upload-success"]'')).toBeVisible({ timeout: 5000 });
    
    // Verify image appears in gallery
    await expect(page.locator(''[data-testid="gallery-item"]'').first()).toBeVisible();
  });
  
  test(''should validate file format restrictions'', async ({ page }) => {
    await page.goto(''/partner-previewer/dashboard'');
    await page.click(''[data-testid="upload-btn"]'');
    await page.click(''[data-testid="upload-local-option"]'');
    
    // Try uploading invalid file type
    const fileInput = await page.locator(''input[type="file"]'');
    await fileInput.setInputFiles(''./test-assets/sample.pdf'');
    
    // Expect error message
    await expect(page.locator(''[data-testid="upload-error"]'')).toContainText(''Unsupported file format'');
  });
});',
  'typescript',
  'playwright',
  'passing',
  0.94,
  'gemini-2.0-flash',
  'Generate a comprehensive Playwright test for the Partner Previewer upload workflow based on curator feedback',
  2847,
  'demo-curator',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 day',
  'All assertions passed',
  12,
  11,
  1,
  3420,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 day'
),

-- Test 2: Dashboard navigation
(
  gen_random_uuid(),
  NULL,
  'Where can I see all my projects in Partner Previewer?',
  'The Dashboard shows all projects. Click "Dashboard" in the left sidebar to see your project list with thumbnails and metadata.',
  'Partner Previewer - Dashboard Projects View',
  'Validates dashboard navigation and project list display',
  E'import { test, expect } from ''@playwright/test'';

test.describe(''Partner Previewer - Dashboard Navigation'', () => {
  test(''should display all projects in dashboard'', async ({ page }) => {
    await page.goto(''/partner-previewer'');
    
    // Click Dashboard in sidebar
    await page.click(''[data-testid="sidebar-dashboard"]'');
    
    // Verify dashboard header
    await expect(page.locator(''h1'')).toContainText(''Projects'');
    
    // Verify at least one project card is visible
    const projectCards = page.locator(''[data-testid="project-card"]'');
    await expect(projectCards.first()).toBeVisible();
    
    // Verify project metadata displays
    await expect(projectCards.first().locator(''[data-testid="project-name"]'')).toBeVisible();
    await expect(projectCards.first().locator(''[data-testid="project-thumbnail"]'')).toBeVisible();
  });
});',
  'typescript',
  'playwright',
  'passing',
  0.91,
  'gemini-2.0-flash',
  'Generate Playwright test for Partner Previewer dashboard navigation',
  1923,
  'demo-curator',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '6 hours',
  'Passed',
  8,
  8,
  0,
  1850,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '6 hours'
),

-- Test 3: Project variations workflow (medium confidence - needs review)
(
  gen_random_uuid(),
  NULL,
  'How do I copy a saved project in Partner Previewer?',
  'To copy a project: 1) Open the project, 2) Click the "..." menu in top-right, 3) Select "Duplicate Project", 4) Enter a new name and click Save.',
  'Partner Previewer - Duplicate Project Workflow',
  'Tests the complete project duplication flow with name input validation',
  E'import { test, expect } from ''@playwright/test'';

test.describe(''Partner Previewer - Duplicate Project'', () => {
  test(''should duplicate an existing project'', async ({ page }) => {
    await page.goto(''/partner-previewer/dashboard'');
    
    // Open first project
    await page.click(''[data-testid="project-card"]:first-child'');
    
    // Wait for project to load
    await expect(page.locator(''[data-testid="project-canvas"]'')).toBeVisible();
    
    // Open project menu
    await page.click(''[data-testid="project-menu-btn"]'');
    
    // Click duplicate option
    await page.click(''[data-testid="menu-duplicate"]'');
    
    // Enter new project name
    await page.fill(''[data-testid="project-name-input"]'', ''My Duplicated Project'');
    
    // Save
    await page.click(''[data-testid="save-duplicate-btn"]'');
    
    // Verify navigation to new project
    await expect(page).toHaveURL(/\\/partner-previewer\\/project\\/[a-z0-9-]+/);
    
    // Verify new project name in header
    await expect(page.locator(''[data-testid="project-title"]'')).toContainText(''My Duplicated Project'');
  });
});',
  'typescript',
  'playwright',
  'pending',
  0.78,
  'gemini-2.0-flash',
  'Generate test for project duplication in Partner Previewer',
  2134,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  0,
  0,
  NULL,
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '12 hours'
),

-- Test 4: Search functionality (flaky - needs attention)
(
  gen_random_uuid(),
  NULL,
  'How do I search for projects in Partner Previewer?',
  'Use the search bar at the top of the Dashboard. It searches by project name, tags, and metadata. Results update in real-time as you type.',
  'Partner Previewer - Dashboard Search',
  'Validates real-time search functionality across project metadata',
  E'import { test, expect } from ''@playwright/test'';

test.describe(''Partner Previewer - Search Projects'', () => {
  test(''should filter projects by search query'', async ({ page }) => {
    await page.goto(''/partner-previewer/dashboard'');
    
    // Get initial project count
    const allProjects = page.locator(''[data-testid="project-card"]'');
    const initialCount = await allProjects.count();
    
    // Type in search
    await page.fill(''[data-testid="search-input"]'', ''test'');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Verify results are filtered
    const filteredCount = await allProjects.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    // Verify all visible cards contain search term
    const visibleCards = await allProjects.all();
    for (const card of visibleCards) {
      const text = await card.textContent();
      expect(text?.toLowerCase()).toContain(''test'');
    }
  });
});',
  'typescript',
  'playwright',
  'flaky',
  0.85,
  'gemini-2.0-flash',
  'Generate search test for Partner Previewer with debounce handling',
  1876,
  'demo-curator',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hour',
  'Flaky - passes 60% of the time, timing issues with debounce',
  10,
  6,
  4,
  2340,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 hour'
),

-- Test 5: Image format validation (recently generated, not yet run)
(
  gen_random_uuid(),
  NULL,
  'What image formats does Partner Previewer support?',
  'Partner Previewer supports JPG, PNG, SVG, and WebP formats. Maximum file size is 10MB. GIF and TIFF are not supported.',
  'Partner Previewer - Image Format Validation',
  'Comprehensive test for all supported and unsupported image formats',
  E'import { test, expect } from ''@playwright/test'';

test.describe(''Partner Previewer - Image Format Support'', () => {
  const supportedFormats = [
    { ext: ''jpg'', file: ''sample.jpg'' },
    { ext: ''png'', file: ''sample.png'' },
    { ext: ''svg'', file: ''sample.svg'' },
    { ext: ''webp'', file: ''sample.webp'' }
  ];
  
  const unsupportedFormats = [
    { ext: ''gif'', file: ''sample.gif'' },
    { ext: ''tiff'', file: ''sample.tiff'' },
    { ext: ''bmp'', file: ''sample.bmp'' }
  ];
  
  for (const format of supportedFormats) {
    test(`should accept ${format.ext.toUpperCase()} files`, async ({ page }) => {
      await page.goto(''/partner-previewer/dashboard'');
      await page.click(''[data-testid="upload-btn"]'');
      
      const fileInput = page.locator(''input[type="file"]'');
      await fileInput.setInputFiles(`./test-assets/${format.file}`);
      
      await expect(page.locator(''[data-testid="upload-success"]'')).toBeVisible();
    });
  }
  
  for (const format of unsupportedFormats) {
    test(`should reject ${format.ext.toUpperCase()} files`, async ({ page }) => {
      await page.goto(''/partner-previewer/dashboard'');
      await page.click(''[data-testid="upload-btn"]'');
      
      const fileInput = page.locator(''input[type="file"]'');
      await fileInput.setInputFiles(`./test-assets/${format.file}`);
      
      await expect(page.locator(''[data-testid="upload-error"]'')).toBeVisible();
    });
  }
});',
  'typescript',
  'playwright',
  'pending',
  0.96,
  'gemini-2.0-flash',
  'Generate comprehensive format validation test suite',
  3124,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  0,
  0,
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
);

-- ============================================================================
-- PART 2: Self-Healing Attempts (realistic selector changes)
-- ============================================================================

INSERT INTO self_healing_attempts (
  id,
  test_name,
  test_file,
  original_selector,
  suggested_selector,
  selector_type,
  status,
  tier,
  confidence,
  healing_strategy,
  healing_rationale,
  dom_changes,
  dom_snapshot_before,
  dom_snapshot_after,
  similar_tests_affected,
  affected_test_files,
  code_before,
  code_after,
  execution_time_ms,
  retry_count,
  ai_model,
  ai_tokens_used,
  error_message,
  error_stack,
  created_at,
  updated_at,
  healed_at,
  reviewed_by,
  review_notes
) VALUES
-- Healing 1: Upload button selector changed (Tier 1 - auto-approved)
(
  gen_random_uuid(),
  'partner-previewer-upload.spec.ts',
  'tests/e2e/partner-previewer/upload.spec.ts',
  '[data-testid="upload-btn"]',
  '[data-testid="toolbar-upload"]',
  'data-testid',
  'approved',
  1,
  0.97,
  'selector-update',
  'The upload button was moved from standalone component to the main toolbar. The new selector is more semantic and matches the component hierarchy. High confidence due to exact text match and unique positioning.',
  '[{"type": "selector", "before": "[data-testid=\"upload-btn\"]", "after": "[data-testid=\"toolbar-upload\"]", "confidence": 0.97, "reason": "Button relocated to toolbar component"}]'::jsonb,
  '<div class="upload-container"><button data-testid="upload-btn">Upload</button></div>',
  '<div class="toolbar"><button data-testid="toolbar-upload">Upload</button></div>',
  3,
  ARRAY['tests/e2e/partner-previewer/dashboard.spec.ts', 'tests/e2e/partner-previewer/gallery.spec.ts'],
  E'// Wait for upload button\nawait page.click(''[data-testid="upload-btn"]'');',
  E'// Wait for upload button (moved to toolbar)\nawait page.click(''[data-testid="toolbar-upload"]'');',
  1240,
  1,
  'gemini-2.0-flash',
  1847,
  'Locator [data-testid="upload-btn"] not found',
  NULL,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours',
  'auto-heal-tier1',
  'Automatically approved - Tier 1 confidence threshold met'
),

-- Healing 2: Project card structure change (Tier 2 - pending review)
(
  gen_random_uuid(),
  'partner-previewer-dashboard.spec.ts',
  'tests/e2e/partner-previewer/dashboard.spec.ts',
  '[data-testid="project-card"] .project-title',
  '[data-testid="project-card"] [data-testid="project-name"]',
  'data-testid',
  'review',
  2,
  0.84,
  'structure-adaptation',
  'The project card component was refactored. The title is now wrapped in a semantic component with its own test ID. Medium confidence - the structure changed but the visual hierarchy is preserved.',
  '[{"type": "structure", "before": "direct child with class .project-title", "after": "nested child with data-testid=\"project-name\"", "confidence": 0.84, "reason": "Component refactor - semantic improvement"}]'::jsonb,
  '<div data-testid="project-card"><h3 class="project-title">My Project</h3></div>',
  '<div data-testid="project-card"><div data-testid="project-name"><h3>My Project</h3></div></div>',
  7,
  ARRAY['tests/e2e/partner-previewer/search.spec.ts', 'tests/e2e/partner-previewer/variations.spec.ts'],
  E'const projectName = await page.locator(''[data-testid="project-card"] .project-title'').textContent();',
  E'const projectName = await page.locator(''[data-testid="project-card"] [data-testid="project-name"]'').textContent();',
  1680,
  2,
  'gemini-2.0-flash',
  2341,
  'Locator [data-testid="project-card"] .project-title not found after 5000ms',
  NULL,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours',
  NULL,
  NULL,
  NULL
),

-- Healing 3: Navigation menu restructure (Tier 2 - human approved)
(
  gen_random_uuid(),
  'partner-previewer-navigation.spec.ts',
  'tests/e2e/partner-previewer/navigation.spec.ts',
  'nav a[href="/partner-previewer/dashboard"]',
  '[data-testid="sidebar-nav"] [data-testid="nav-dashboard"]',
  'data-testid',
  'approved',
  2,
  0.88,
  'selector-update',
  'Navigation was refactored from simple anchor links to a structured sidebar component with test IDs. This is a significant improvement for test stability.',
  '[{"type": "selector", "before": "nav a[href=\"/partner-previewer/dashboard\"]", "after": "[data-testid=\"sidebar-nav\"] [data-testid=\"nav-dashboard\"]", "confidence": 0.88}]'::jsonb,
  '<nav><a href="/partner-previewer/dashboard">Dashboard</a></nav>',
  '<nav data-testid="sidebar-nav"><a data-testid="nav-dashboard" href="/partner-previewer/dashboard">Dashboard</a></nav>',
  12,
  ARRAY['tests/e2e/partner-previewer/dashboard.spec.ts', 'tests/e2e/partner-previewer/projects.spec.ts', 'tests/e2e/partner-previewer/upload.spec.ts'],
  E'await page.click(''nav a[href="/partner-previewer/dashboard"]'');',
  E'await page.click(''[data-testid="sidebar-nav"] [data-testid="nav-dashboard"]'');',
  2140,
  1,
  'gemini-2.0-flash',
  2987,
  'Locator nav a[href="/partner-previewer/dashboard"] matched multiple elements',
  NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  'matt@betabase.io',
  'Approved - good refactor with proper test IDs'
),

-- Healing 4: Search debounce timing issue (Tier 3 - escalated)
(
  gen_random_uuid(),
  'partner-previewer-search.spec.ts',
  'tests/e2e/partner-previewer/search.spec.ts',
  'await page.waitForTimeout(500);',
  'await page.waitForFunction(() => !document.querySelector(''[data-testid="search-loading"]''));',
  'wait-strategy',
  'review',
  3,
  0.62,
  'wait-strategy',
  'The fixed timeout is causing flakiness. Suggested wait strategy checks for loading indicator instead. LOW confidence because this requires understanding the async search implementation and debounce behavior.',
  '[{"type": "wait-strategy", "before": "fixed 500ms timeout", "after": "dynamic wait for loading indicator", "confidence": 0.62}]'::jsonb,
  NULL,
  NULL,
  1,
  ARRAY['tests/e2e/partner-previewer/search.spec.ts'],
  E'await page.fill(''[data-testid="search-input"]'', ''test'');\nawait page.waitForTimeout(500); // Wait for debounce',
  E'await page.fill(''[data-testid="search-input"]'', ''test'');\n// Wait for search to complete (more reliable than fixed timeout)\nawait page.waitForFunction(() => !document.querySelector(''[data-testid="search-loading"]''));',
  3240,
  5,
  'gemini-2.0-flash',
  4123,
  'Test timeout exceeded - search results did not appear within expected time',
  'TimeoutError: page.waitForSelector: Timeout 5000ms exceeded',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours',
  NULL,
  NULL,
  NULL
),

-- Healing 5: File upload input selector (Tier 1 - auto-approved)
(
  gen_random_uuid(),
  'partner-previewer-upload-formats.spec.ts',
  'tests/e2e/partner-previewer/upload-formats.spec.ts',
  'input[type="file"]',
  '[data-testid="file-upload-input"]',
  'data-testid',
  'approved',
  1,
  0.93,
  'selector-update',
  'File input was given a test ID for better test stability. Simple selector update with high confidence.',
  '[{"type": "selector", "before": "input[type=\"file\"]", "after": "[data-testid=\"file-upload-input\"]", "confidence": 0.93}]'::jsonb,
  '<input type="file" accept="image/*">',
  '<input type="file" data-testid="file-upload-input" accept="image/*">',
  2,
  ARRAY['tests/e2e/partner-previewer/upload.spec.ts'],
  E'const fileInput = page.locator(''input[type="file"]'');',
  E'const fileInput = page.locator(''[data-testid="file-upload-input"]'');',
  980,
  1,
  'gemini-2.0-flash',
  1523,
  'Locator input[type="file"] matched 3 elements',
  NULL,
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours',
  NOW() - INTERVAL '4 hours',
  'auto-heal-tier1',
  'Auto-approved - unambiguous selector improvement'
),

-- Healing 6: Project menu dropdown timing (Tier 2 - pending)
(
  gen_random_uuid(),
  'partner-previewer-project-actions.spec.ts',
  'tests/e2e/partner-previewer/project-actions.spec.ts',
  '[data-testid="menu-duplicate"]',
  '[data-testid="project-menu"] [data-testid="action-duplicate"]',
  'data-testid',
  'review',
  2,
  0.76,
  'structure-adaptation',
  'Menu items were nested under a menu container and renamed for clarity. Confidence is moderate due to structural change.',
  '[{"type": "structure", "before": "direct menu item", "after": "nested under project-menu container", "confidence": 0.76}]'::jsonb,
  '<div data-testid="menu-duplicate">Duplicate</div>',
  '<div data-testid="project-menu"><button data-testid="action-duplicate">Duplicate Project</button></div>',
  5,
  ARRAY['tests/e2e/partner-previewer/variations.spec.ts'],
  E'await page.click(''[data-testid="menu-duplicate"]'');',
  E'// Menu restructured - items now nested under project-menu\nawait page.click(''[data-testid="project-menu"] [data-testid="action-duplicate"]'');',
  1870,
  2,
  'gemini-2.0-flash',
  2245,
  'Locator [data-testid="menu-duplicate"] not found',
  NULL,
  NOW() - INTERVAL '30 minutes',
  NOW() - INTERVAL '30 minutes',
  NULL,
  NULL,
  NULL
);

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON rlhf_generated_tests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON self_healing_attempts TO authenticated;
GRANT ALL ON rlhf_generated_tests TO service_role;
GRANT ALL ON self_healing_attempts TO service_role;

-- ============================================================================
-- Verification query
-- ============================================================================
SELECT 
  'RLHF Generated Tests' as table_name,
  COUNT(*) as seed_count,
  COUNT(*) FILTER (WHERE status = 'passing') as passing,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'flaky') as flaky
FROM rlhf_generated_tests

UNION ALL

SELECT 
  'Self-Healing Attempts' as table_name,
  COUNT(*) as seed_count,
  COUNT(*) FILTER (WHERE status = 'approved') as approved,
  COUNT(*) FILTER (WHERE status = 'review') as pending_review,
  COUNT(*) FILTER (WHERE tier = 1) as tier1_auto
FROM self_healing_attempts;

-- Done!
SELECT '✅ Demo testing data seeded successfully!' as status;

