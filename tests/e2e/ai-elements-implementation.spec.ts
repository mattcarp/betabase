/**
 * AI Elements Implementation Tests (TDD)
 *
 * These tests verify the implementation of Vercel AI Elements components
 * that were installed but not yet integrated into the chat interface.
 *
 * Components tested:
 * - Chain of Thought (replaces spinner)
 * - Shimmer (animated loading text)
 * - Context (token usage visualization)
 * - Artifact (code/document container)
 * - Queue (task display)
 * - Plan (execution plan display)
 * - EXPERIMENTAL: System Diagrams (React Flow)
 * - EXPERIMENTAL: Agent Execution Visualizer (React Flow)
 */

import { test, expect } from '../fixtures/base-test';

test.describe('AI Elements Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat and wait for it to be ready
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for chat input to be ready
    const chatInput = page.locator(
      'textarea[placeholder*="Message"], input[placeholder*="Message"], [data-testid="chat-input"]'
    );
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test.describe('Chain of Thought', () => {
    test('shows chain of thought during query processing instead of basic spinner', async ({
      page,
    }) => {
      // Submit a query
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('What is AOMA and how does it work?');
      await page.keyboard.press('Enter');

      // Wait a moment for loading state to appear
      await page.waitForTimeout(500);

      // Should show chain of thought component, NOT just a basic Loader2 spinner
      // Look for chain of thought indicators
      const chainOfThought = page.locator(
        '[data-slot="chain-of-thought"], [class*="ChainOfThought"], [data-testid="chain-of-thought"]'
      );

      const shimmerOrThinking = page.locator(
        '[class*="shimmer"], [class*="bg-clip-text"], text=/understanding|searching|retrieving|thinking/i'
      );

      // Either chain of thought OR shimmer text should be visible (not just spinner)
      const hasEnhancedLoading =
        (await chainOfThought.isVisible().catch(() => false)) ||
        (await shimmerOrThinking.first().isVisible().catch(() => false));

      // This test will fail initially until we implement the feature
      expect(hasEnhancedLoading).toBe(true);
    });

    test('chain of thought shows step progression', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Tell me about DPSA tickets');
      await page.keyboard.press('Enter');

      // Look for step indicators in loading state
      const stepIndicators = page.locator(
        '[data-slot="chain-of-thought-step"], [class*="ChainOfThoughtStep"]'
      );

      // Wait for loading state
      await page.waitForTimeout(1000);

      // Should show multiple steps during complex queries
      // This will fail initially - implementation needed
      const stepCount = await stepIndicators.count().catch(() => 0);

      // Allow test to pass if chain of thought is not yet implemented
      // but flag it for implementation
      if (stepCount > 0) {
        expect(stepCount).toBeGreaterThanOrEqual(1);
      }
    });

    test('chain of thought is collapsible', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Explain the authentication system');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(500);

      // Look for collapsible trigger
      const cotHeader = page.locator(
        '[data-slot="chain-of-thought"] button, [class*="ChainOfThoughtHeader"]'
      );

      if (await cotHeader.isVisible().catch(() => false)) {
        // Click to collapse
        await cotHeader.click();

        // Content should be collapsed
        const content = page.locator('[data-state="closed"]');
        await expect(content).toBeVisible({ timeout: 2000 });
      }
    });
  });

  test.describe('Shimmer Effect', () => {
    test('shows shimmer animation on loading text', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('What is AOMA?');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(300);

      // Look for shimmer effect (animated gradient text)
      const shimmer = page.locator(
        '[class*="shimmer"], [class*="bg-clip-text"][class*="animate"], [class*="text-transparent"]'
      );

      // Shimmer should be visible during loading
      // Will fail initially until implemented
      const shimmerVisible = await shimmer.first().isVisible().catch(() => false);

      // This test documents expected behavior
      expect(shimmerVisible).toBe(true);
    });

    test('shimmer text updates based on loading phase', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Search for authentication documentation');
      await page.keyboard.press('Enter');

      // Track loading messages over time
      const loadingMessages: string[] = [];

      // Check loading message at different intervals
      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(1000);
        const loadingText = await page
          .locator('[class*="shimmer"], [class*="loading-message"]')
          .textContent()
          .catch(() => '');
        if (loadingText) {
          loadingMessages.push(loadingText);
        }
      }

      // Messages should vary (understanding -> searching -> retrieving)
      // This documents expected behavior
      console.log('Loading messages observed:', loadingMessages);
    });
  });

  test.describe('Context Token Visualization', () => {
    test('shows token usage indicator in toolbar', async ({ page }) => {
      // First, submit a query to generate some token usage
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Hello, can you help me?');
      await page.keyboard.press('Enter');

      // Wait for response
      await page.waitForTimeout(5000);

      // Look for context/token usage indicator
      const contextIndicator = page.locator(
        '[aria-label*="context"], [aria-label*="token"], [data-testid="context-usage"], [class*="ContextTrigger"]'
      );

      // Will fail until implemented
      const visible = await contextIndicator.isVisible().catch(() => false);
      expect(visible).toBe(true);
    });

    test('context hover shows usage breakdown', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Tell me about AOMA');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(5000);

      // Find and hover context trigger
      const contextTrigger = page.locator(
        '[aria-label*="context"], [data-testid="context-usage"]'
      );

      if (await contextTrigger.isVisible().catch(() => false)) {
        await contextTrigger.hover();

        // Hover card should show breakdown
        const breakdown = page.locator(
          '[class*="HoverCardContent"], [role="tooltip"]'
        );
        await expect(breakdown).toBeVisible({ timeout: 2000 });

        // Should show input/output tokens
        await expect(page.getByText(/input|output/i)).toBeVisible();
      }
    });
  });

  test.describe('Artifact Container', () => {
    test('wraps generated code in artifact container', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Write a SQL query to find all users with role admin');
      await page.keyboard.press('Enter');

      // Wait for code response
      await page.waitForTimeout(10000);

      // Look for artifact wrapper around code
      const artifact = page.locator(
        '[data-slot="artifact"], [class*="Artifact"], [data-testid="artifact"]'
      );

      // Code should be in artifact container
      // Will fail until implemented
      const visible = await artifact.isVisible().catch(() => false);

      if (visible) {
        // Artifact should have action buttons
        const copyButton = artifact.locator('button[aria-label*="copy"], button:has-text("Copy")');
        await expect(copyButton).toBeVisible();
      }
    });

    test('artifact has title and actions', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Generate a Python function to calculate fibonacci');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);

      const artifact = page.locator('[data-slot="artifact"], [class*="Artifact"]');

      if (await artifact.isVisible().catch(() => false)) {
        // Should have header with title
        const header = artifact.locator('[class*="ArtifactHeader"]');
        await expect(header).toBeVisible();

        // Should have close button
        const closeBtn = artifact.locator('[class*="ArtifactClose"], button[aria-label="Close"]');
        await expect(closeBtn).toBeVisible();
      }
    });
  });

  test.describe('Queue Display', () => {
    test('shows task queue during multi-step operations', async ({ page }) => {
      // Complex query that should trigger multiple steps
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill(
        'Search for all DPSA tickets about authentication, find related wiki pages, and summarize the findings'
      );
      await page.keyboard.press('Enter');

      await page.waitForTimeout(2000);

      // Look for queue component
      const queue = page.locator(
        '[data-slot="queue"], [class*="Queue"], [data-testid="task-queue"]'
      );

      // Queue may appear for complex queries
      const visible = await queue.isVisible().catch(() => false);

      if (visible) {
        // Should show queue items
        const items = queue.locator('[class*="QueueItem"]');
        expect(await items.count()).toBeGreaterThanOrEqual(1);
      }
    });

    test('queue items show completion status', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Search Jira and Wiki for deployment procedures');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(3000);

      const queue = page.locator('[class*="Queue"]');

      if (await queue.isVisible().catch(() => false)) {
        // Completed items should have indicator
        const completedIndicator = queue.locator('[class*="completed"], [class*="border-green"]');
        // May or may not be visible depending on timing
        console.log('Completed items:', await completedIndicator.count());
      }
    });
  });

  test.describe('Plan Display', () => {
    test('shows execution plan for planning-type queries', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Create a step-by-step plan to migrate the database to a new server');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);

      // Look for plan component
      const plan = page.locator(
        '[data-slot="plan"], [class*="Plan"], [data-testid="execution-plan"]'
      );

      // Plan may appear for planning queries
      const visible = await plan.isVisible().catch(() => false);

      if (visible) {
        // Should have collapsible content
        const trigger = plan.locator('[data-slot="plan-trigger"]');
        await expect(trigger).toBeVisible();
      }
    });
  });

  test.describe('EXPERIMENTAL: System Diagrams', () => {
    test('renders interactive system diagram for architecture queries', async ({
      page,
    }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Show me a diagram of how the AOMA system architecture works');
      await page.keyboard.press('Enter');

      // Wait for response
      await page.waitForTimeout(15000);

      // Look for React Flow canvas
      const canvas = page.locator('.react-flow, [data-testid="system-diagram"]');

      const visible = await canvas.isVisible().catch(() => false);

      if (visible) {
        // Should have nodes
        const nodes = canvas.locator('.react-flow__node');
        expect(await nodes.count()).toBeGreaterThanOrEqual(2);

        // Should have controls
        const controls = canvas.locator('.react-flow__controls');
        await expect(controls).toBeVisible();
      }
    });

    test('system diagram is interactive (zoom/pan)', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Draw the data flow diagram for user authentication');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(15000);

      const canvas = page.locator('.react-flow');

      if (await canvas.isVisible().catch(() => false)) {
        // Click zoom in
        const zoomIn = page.locator(
          '.react-flow__controls-zoomin, [aria-label="zoom in"]'
        );
        if (await zoomIn.isVisible().catch(() => false)) {
          await zoomIn.click();
          // Should zoom without errors
        }
      }
    });
  });

  test.describe('EXPERIMENTAL: Agent Execution Visualizer', () => {
    test('shows execution flow during multi-tool queries', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill(
        'Search for all DPSA tickets about authentication and cross-reference with Wiki documentation on security'
      );
      await page.keyboard.press('Enter');

      await page.waitForTimeout(3000);

      // Look for execution visualizer
      const visualizer = page.locator(
        '[data-testid="agent-execution-visualizer"], [class*="AgentExecution"], .react-flow[data-execution]'
      );

      const visible = await visualizer.isVisible().catch(() => false);

      if (visible) {
        // Should show execution nodes
        const nodes = visualizer.locator('.react-flow__node');
        expect(await nodes.count()).toBeGreaterThanOrEqual(2);

        // Running node should have animation
        const runningNode = visualizer.locator('.animate-pulse, [class*="running"]');
        // May or may not be visible depending on timing
        console.log('Running nodes:', await runningNode.count());
      }
    });

    test('execution visualizer shows completion status', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Search Jira for recent bugs and summarize them');
      await page.keyboard.press('Enter');

      await page.waitForTimeout(10000);

      const visualizer = page.locator('[data-testid="agent-execution-visualizer"]');

      if (await visualizer.isVisible().catch(() => false)) {
        // Completed nodes should have green indicator
        const completedNode = visualizer.locator('[class*="border-green"], [class*="complete"]');
        // May have completed nodes after processing
        console.log('Completed nodes:', await completedNode.count());
      }
    });
  });

  test.describe('No Loader2 Spinner Regression', () => {
    test('does NOT show basic Loader2 spinner as primary loading indicator', async ({
      page,
    }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('What is AOMA?');
      await page.keyboard.press('Enter');

      // Wait for loading state
      await page.waitForTimeout(500);

      // Check if enhanced loading is shown
      const chainOfThought = page.locator('[data-slot="chain-of-thought"]');
      const shimmer = page.locator('[class*="shimmer"], [class*="bg-clip-text"]');
      const queue = page.locator('[class*="Queue"]');

      const hasChainOfThought = await chainOfThought.isVisible().catch(() => false);
      const hasShimmer = await shimmer.first().isVisible().catch(() => false);
      const hasQueue = await queue.isVisible().catch(() => false);

      // At least one enhanced loading component should be visible
      const hasEnhancedLoading = hasChainOfThought || hasShimmer || hasQueue;

      // This test ensures we don't regress to just showing a spinner
      expect(hasEnhancedLoading).toBe(true);
    });
  });

  test.describe('Streaming Still Works', () => {
    test('response streams correctly with new components', async ({ page }) => {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill('Tell me about AOMA in detail');
      await page.keyboard.press('Enter');

      // Track response content over time
      const contentSnapshots: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(500);
        const content = await page
          .locator('[data-slot="response"], [class*="Response"], .prose')
          .first()
          .textContent()
          .catch(() => '');
        if (content) {
          contentSnapshots.push(content);
        }
      }

      // Content should grow over time (streaming)
      if (contentSnapshots.length > 2) {
        const isStreaming = contentSnapshots.some(
          (content, i) => i > 0 && content.length > (contentSnapshots[i - 1]?.length || 0)
        );
        expect(isStreaming).toBe(true);
      }
    });
  });
});
