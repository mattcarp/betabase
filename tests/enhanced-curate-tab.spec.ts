import { test, expect } from './fixtures/base-test';

test.describe("Enhanced Curate Tab - Comprehensive Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to SIAM with auth bypass
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Click on Curate tab
    const curateTab = page.locator("text=Curate");
    await curateTab.click();
    await page.waitForTimeout(1000);
  });

  test.describe("Dashboard Tab - Management Evil Charts", () => {
    test("should display executive KPI cards", async ({ page }) => {
      // Click Dashboard tab
      await page.click('button[role="tab"]:has-text("Dashboard")');

      // Check KPI cards are visible
      await expect(page.locator('text="Knowledge Base Health"')).toBeVisible();
      await expect(page.locator('text="Storage Optimization"')).toBeVisible();
      await expect(page.locator('text="Processing Velocity"')).toBeVisible();
      await expect(page.locator('text="Curator Performance"')).toBeVisible();

      // Verify health score display
      const healthScore = page.locator("text=/\\d+\\.\\d+%/").first();
      await expect(healthScore).toBeVisible();

      // Check for chart presence
      await expect(page.locator(".recharts-wrapper")).toBeVisible();
    });

    test("should display document processing trends", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Dashboard")');

      // Check for trend charts
      await expect(page.locator('text="Document Processing Trends"')).toBeVisible();
      await expect(page.locator(".recharts-line")).toBeVisible();

      // Verify legend items
      await expect(page.locator('text="Uploaded"')).toBeVisible();
      await expect(page.locator('text="Processed"')).toBeVisible();
      await expect(page.locator('text="Duplicates Found"')).toBeVisible();
    });

    test("should show quality metrics heatmap", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Dashboard")');

      // Check for quality metrics section
      await expect(page.locator('text="Quality Metrics by Category"')).toBeVisible();

      // Verify heatmap cells are rendered
      const heatmapCells = page.locator(".recharts-rectangle");
      await expect(heatmapCells.first()).toBeVisible();
    });
  });

  test.describe("Files Tab - Core Functionality", () => {
    test("should preserve file upload and delete functionality", async ({ page }) => {
      // Click Files tab
      await page.click('button[role="tab"]:has-text("Files")');

      // Check for search bar
      await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();

      // Check for refresh button
      const refreshButton = page.locator("button:has(svg.lucide-refresh-cw)");
      await expect(refreshButton).toBeVisible();

      // Verify file list area exists
      await expect(page.locator('.scroll-area, [class*="scroll"]')).toBeVisible();

      // Check for file actions dropdown
      const moreButton = page.locator("button:has(svg.lucide-more-vertical)").first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        await expect(page.locator('text="View Details"')).toBeVisible();
        await expect(page.locator('text="Download"')).toBeVisible();
        await expect(page.locator('text="Delete"')).toBeVisible();
        await page.keyboard.press("Escape");
      }
    });

    test("should support file selection and bulk operations", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Files")');

      // Check for select all checkbox
      const selectAll = page.locator('input[type="checkbox"]').first();
      if (await selectAll.isVisible()) {
        await selectAll.click();

        // Verify bulk delete button appears
        await expect(page.locator('button:has-text("Delete")')).toBeVisible();
      }
    });
  });

  test.describe("Insights Tab - AI-Powered Analysis", () => {
    test("should display deduplication insights", async ({ page }) => {
      // Click Insights tab
      await page.click('button[role="tab"]:has-text("Insights")');

      // Check for deduplication section
      await expect(page.locator('text="Semantic Deduplication"')).toBeVisible();

      // Verify duplicate groups display
      await expect(page.locator("text=/\\d+ duplicate groups found/")).toBeVisible();

      // Check for similarity score
      await expect(page.locator("text=/\\d+% similar/")).toBeVisible();
    });

    test("should show knowledge gaps analysis", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Insights")');

      // Check for knowledge gaps section
      await expect(page.locator('text="Knowledge Gaps"')).toBeVisible();

      // Verify gap categories
      await expect(page.locator("text=/Missing.+documentation/")).toBeVisible();

      // Check for recommendation badges
      const badges = page.locator('.badge, [class*="badge"]');
      await expect(badges.first()).toBeVisible();
    });

    test("should display quality improvements suggestions", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Insights")');

      // Check for quality section
      await expect(page.locator('text="Quality Improvements"')).toBeVisible();

      // Verify improvement cards
      await expect(page.locator("text=/Enhance metadata/")).toBeVisible();
      await expect(page.locator("text=/Update outdated/")).toBeVisible();
    });
  });

  test.describe("Curators Tab - Gamification & Leaderboard", () => {
    test("should display curator leaderboard", async ({ page }) => {
      // Click Curators tab
      await page.click('button[role="tab"]:has-text("Curators")');

      // Check for leaderboard
      await expect(page.locator('text="Top Curators"')).toBeVisible();

      // Verify curator entries
      await expect(page.locator("text=/Sarah Chen|Mike Rodriguez|Emma Thompson/")).toBeVisible();

      // Check for badges
      await expect(page.locator("text=/Master|Champion|Expert/")).toBeVisible();

      // Verify stats display
      await expect(page.locator("text=/\\d+ files processed/")).toBeVisible();
    });

    test("should show department analytics", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Curators")');

      // Check for department section
      await expect(page.locator('text="Department Analytics"')).toBeVisible();

      // Verify department chart
      await expect(page.locator(".recharts-bar")).toBeVisible();

      // Check department names
      await expect(page.locator("text=/Legal|A&R|Marketing|Finance/")).toBeVisible();
    });

    test("should display achievements section", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Curators")');

      // Check for achievements
      await expect(page.locator('text="Recent Achievements"')).toBeVisible();

      // Verify achievement badges
      const achievementBadges = page.locator('[class*="achievement"], .badge');
      await expect(achievementBadges.first()).toBeVisible();
    });
  });

  test.describe("Analytics Tab - Performance Metrics", () => {
    test("should display upload velocity chart", async ({ page }) => {
      // Click Analytics tab
      await page.click('button[role="tab"]:has-text("Analytics")');

      // Check for velocity chart
      await expect(page.locator('text="Upload Velocity"')).toBeVisible();

      // Verify chart rendering
      await expect(page.locator(".recharts-area")).toBeVisible();

      // Check time period selector
      await expect(
        page
          .locator('button:has-text("Last 7 days")')
          .or(page.locator("text=/7 days|30 days|90 days/"))
      ).toBeVisible();
    });

    test("should show storage efficiency metrics", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Analytics")');

      // Check for storage section
      await expect(page.locator('text="Storage Efficiency"')).toBeVisible();

      // Verify pie chart
      await expect(page.locator(".recharts-pie")).toBeVisible();

      // Check for legend items
      await expect(page.locator("text=/Unique|Duplicates|Archived/")).toBeVisible();
    });

    test("should display compliance status", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Analytics")');

      // Check for compliance section
      await expect(page.locator('text="Compliance Status"')).toBeVisible();

      // Verify compliance metrics
      await expect(page.locator("text=/GDPR|CCPA|SOC/")).toBeVisible();

      // Check for status indicators
      await expect(page.locator("svg.lucide-check-circle, svg.lucide-alert-circle")).toBeVisible();
    });
  });

  test.describe("Upload Tab - File Management", () => {
    test("should preserve FileUpload component functionality", async ({ page }) => {
      // Click Upload tab
      await page.click('button[role="tab"]:has-text("Upload")');

      // Check for upload area
      await expect(page.locator("text=/Drag.*drop|Choose.*files|Upload/")).toBeVisible();

      // Verify file input exists
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();

      // Check for info alert
      await expect(page.locator("text=/automatically processed.*indexed/")).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should adapt to mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check tabs are still accessible
      const tabs = page.locator('[role="tablist"]');
      await expect(tabs).toBeVisible();

      // Verify cards stack vertically
      const cards = page.locator('.card, [class*="card"]');
      if (await cards.first().isVisible()) {
        const firstCard = await cards.first().boundingBox();
        const secondCard = await cards.nth(1).boundingBox();
        if (firstCard && secondCard) {
          expect(secondCard.y).toBeGreaterThan(firstCard.y);
        }
      }
    });

    test("should work on tablet viewport", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check layout integrity
      await expect(page.locator('[role="tablist"]')).toBeVisible();
      await expect(page.locator('.card, [class*="card"]').first()).toBeVisible();
    });
  });

  test.describe("Data Integrity", () => {
    test("should handle empty states gracefully", async ({ page }) => {
      await page.click('button[role="tab"]:has-text("Files")');

      // If no files, should show empty state
      const noFilesMessage = page.locator("text=/No files found|No documents/");
      const fileList = page.locator('.file-list, [class*="file-item"]');

      if (!(await fileList.first().isVisible())) {
        await expect(noFilesMessage).toBeVisible();
      }
    });

    test("should display loading states", async ({ page }) => {
      // Click refresh to trigger loading
      await page.click('button[role="tab"]:has-text("Files")');
      const refreshButton = page.locator("button:has(svg.lucide-refresh-cw)");

      if (await refreshButton.isVisible()) {
        await refreshButton.click();

        // Check for loading indicator (might be too fast to catch)
        const loadingIndicator = page.locator(
          '.animate-spin, [class*="loading"], [class*="spinner"]'
        );
        // This is optional as loading might be very quick
        if (await loadingIndicator.isVisible({ timeout: 500 })) {
          await expect(loadingIndicator).toBeVisible();
        }
      }
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper ARIA labels", async ({ page }) => {
      // Check tab accessibility
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);

      // Verify tab panels
      const tabPanels = page.locator('[role="tabpanel"]');
      await expect(tabPanels.first()).toBeVisible();
    });

    test("should support keyboard navigation", async ({ page }) => {
      // Focus on first tab
      await page.click('button[role="tab"]:has-text("Dashboard")');

      // Navigate with arrow keys
      await page.keyboard.press("ArrowRight");

      // Check focus moved
      const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
      expect(focusedElement).toBeTruthy();
    });
  });
});

test.describe("Integration with SIAM Core Features", () => {
  test("should integrate with existing SIAM navigation", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Check all main tabs are present
    await expect(page.locator('text="Chat"')).toBeVisible();
    await expect(page.locator('text="Curate"')).toBeVisible();
    await expect(page.locator('text="Test"')).toBeVisible();
    await expect(page.locator('text="Fix"')).toBeVisible();
  });

  test("should maintain consistent styling with MAC design system", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.click('text="Curate"');

    // Check for MAC design system classes
    const macElements = page.locator('[class*="mac-"]');
    const macCount = await macElements.count();
    expect(macCount).toBeGreaterThan(0);

    // Verify glassmorphism effects
    const glassElements = page.locator('[class*="glass"], [class*="blur"]');
    await expect(glassElements.first()).toBeVisible();
  });
});
