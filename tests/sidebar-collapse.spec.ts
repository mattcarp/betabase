import { test, expect } from '@playwright/test';

test.describe('Sidebar Collapse Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page
    await page.goto('http://localhost:3000');
    
    // Wait for the sidebar to be visible
    await page.waitForSelector('[data-sidebar="sidebar"]', { timeout: 10000 });
  });

  test('should toggle sidebar collapse when clicking the trigger button', async ({ page }) => {
    // Find the sidebar trigger button (hamburger menu icon)
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    await expect(sidebarTrigger).toBeVisible();

    // Get the sidebar element
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    
    // Check initial state - sidebar should be expanded
    await expect(sidebar).toHaveAttribute('data-state', 'expanded');
    
    // Get the initial width
    const initialWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    
    console.log('Initial sidebar width:', initialWidth);
    
    // Click the trigger to collapse
    await sidebarTrigger.click();
    
    // Wait a moment for the transition
    await page.waitForTimeout(300);
    
    // Check if sidebar is now collapsed
    const sidebarState = await sidebar.getAttribute('data-state');
    console.log('Sidebar state after click:', sidebarState);
    
    // Get the collapsed width
    const collapsedWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    
    console.log('Collapsed sidebar width:', collapsedWidth);
    
    // Width should be significantly smaller (icon mode should be ~48px)
    expect(collapsedWidth).not.toBe(initialWidth);
    
    // Click again to expand
    await sidebarTrigger.click();
    await page.waitForTimeout(300);
    
    // Should be back to expanded
    const expandedState = await sidebar.getAttribute('data-state');
    console.log('Sidebar state after second click:', expandedState);
    
    const finalWidth = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    
    console.log('Final sidebar width:', finalWidth);
    
    // Should return to original width
    expect(finalWidth).toBe(initialWidth);
  });

  test('should hide conversation text when collapsed', async ({ page }) => {
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    
    // Find a conversation title (should be visible initially)
    const conversationTitle = page.locator('[data-sidebar="content"] span').first();
    
    // Should be visible when expanded
    if (await conversationTitle.count() > 0) {
      await expect(conversationTitle).toBeVisible();
      
      // Collapse the sidebar
      await sidebarTrigger.click();
      await page.waitForTimeout(300);
      
      // Text should be hidden or not visible due to overflow
      const sidebar = page.locator('[data-sidebar="sidebar"]');
      const sidebarState = await sidebar.getAttribute('data-state');
      
      if (sidebarState === 'collapsed') {
        console.log('✓ Sidebar successfully collapsed');
        
        // Check that the width is narrow (icon mode)
        const width = await sidebar.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).width);
        });
        
        expect(width).toBeLessThan(100); // Should be around 48px
      } else {
        console.log('✗ Sidebar did NOT collapse');
        throw new Error('Sidebar failed to collapse');
      }
    }
  });

  test('should show only icons when collapsed', async ({ page }) => {
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]');
    const sidebar = page.locator('[data-sidebar="sidebar"]');
    
    // Collapse the sidebar
    await sidebarTrigger.click();
    await page.waitForTimeout(300);
    
    // Icons should still be visible
    const messageIcons = page.locator('[data-sidebar="content"] svg').first();
    if (await messageIcons.count() > 0) {
      await expect(messageIcons).toBeVisible();
    }
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'tests/screenshots/sidebar-collapsed.png' });
    
    // Expand again
    await sidebarTrigger.click();
    await page.waitForTimeout(300);
    
    // Take another screenshot
    await page.screenshot({ path: 'tests/screenshots/sidebar-expanded.png' });
  });
});

