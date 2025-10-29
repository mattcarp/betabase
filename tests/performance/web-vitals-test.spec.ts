import { test, expect } from '@playwright/test';
import type { CDPSession } from '@playwright/test';

interface WebVitalsMetrics {
  page: string;
  timestamp: string;
  LCP?: number;
  FCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  INP?: number;
  navigationTiming: {
    domContentLoaded: number;
    loadComplete: number;
    domInteractive: number;
    totalLoadTime: number;
  };
  resources: {
    total: number;
    js: number;
    css: number;
    images: number;
    totalSize: number;
  };
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  layoutShifts?: Array<{
    value: number;
    time: number;
  }>;
}

test.describe('Performance Testing - Chat and Curation', () => {
  let cdpSession: CDPSession;
  const results: WebVitalsMetrics[] = [];

  test.beforeEach(async ({ page }) => {
    // Enable CDP session for performance metrics
    cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Performance.enable');
  });

  async function collectMetrics(page: any, pageName: string): Promise<WebVitalsMetrics> {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      const perf = performance;
      const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      // Navigation Timing
      const navigationTiming = {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        domInteractive: nav.domInteractive,
        totalLoadTime: nav.loadEventEnd - nav.fetchStart,
      };

      // Web Vitals - LCP
      const lcpEntries = perf.getEntriesByType('largest-contentful-paint') as any[];
      const LCP = lcpEntries.length > 0
        ? (lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime)
        : undefined;

      // FCP
      const paintEntries = perf.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      const FCP = fcp ? fcp.startTime : undefined;

      // TTFB
      const TTFB = nav.responseStart - nav.requestStart;

      // Resources
      const resources = perf.getEntriesByType('resource');
      const resourceMetrics = {
        total: resources.length,
        js: resources.filter(r => r.name.endsWith('.js')).length,
        css: resources.filter(r => r.name.endsWith('.css')).length,
        images: resources.filter(r => (r as any).initiatorType === 'img').length,
        totalSize: resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0),
      };

      // Memory
      const memory = (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      } : undefined;

      return {
        navigationTiming,
        LCP,
        FCP,
        TTFB,
        resources: resourceMetrics,
        memory,
      };
    });

    // Get CLS from CDP
    let CLS = 0;
    const layoutShifts: Array<{ value: number; time: number }> = [];

    try {
      const cdpMetrics = await cdpSession.send('Performance.getMetrics');
      const clsMetric = cdpMetrics.metrics.find((m: any) => m.name === 'LayoutShift');
      if (clsMetric) {
        CLS = clsMetric.value;
      }
    } catch (e) {
      console.log('Could not fetch CDP metrics:', e);
    }

    return {
      page: pageName,
      timestamp: new Date().toISOString(),
      ...metrics,
      CLS,
      layoutShifts: layoutShifts.length > 0 ? layoutShifts : undefined,
    };
  }

  test('Chat Performance Test', async ({ page }) => {
    console.log('\n🧪 Testing Chat Performance...\n');

    // Navigate to home
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const homeMetrics = await collectMetrics(page, 'home-page');
    results.push(homeMetrics);
    console.log('Home Page Metrics:', JSON.stringify(homeMetrics, null, 2));

    // Click Chat tab
    const chatStartTime = Date.now();
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const chatLoadTime = Date.now() - chatStartTime;

    const chatMetrics = await collectMetrics(page, 'chat-initial');
    chatMetrics.navigationTiming.totalLoadTime = chatLoadTime;
    results.push(chatMetrics);
    console.log('Chat Initial Load Metrics:', JSON.stringify(chatMetrics, null, 2));

    // Test chat interaction
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('How do I submit assets to AOMA?');

    const interactionStartTime = Date.now();
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('[data-role="assistant"], .assistant-message, [role="article"]', { timeout: 30000 });
    const responseTime = Date.now() - interactionStartTime;

    console.log(`Chat Response Time: ${responseTime}ms`);

    // Collect metrics after interaction
    await page.waitForTimeout(2000);
    const chatInteractionMetrics = await collectMetrics(page, 'chat-after-interaction');
    results.push(chatInteractionMetrics);
    console.log('Chat After Interaction Metrics:', JSON.stringify(chatInteractionMetrics, null, 2));

    // Check for layout shifts
    expect(chatInteractionMetrics.CLS).toBeLessThan(0.1); // Good CLS < 0.1
  });

  test('Curation Performance Test', async ({ page }) => {
    console.log('\n🧪 Testing Curation Performance...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Curate tab
    const curateStartTime = Date.now();
    await page.click('text=Curate');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const curateLoadTime = Date.now() - curateStartTime;

    const curateMetrics = await collectMetrics(page, 'curation-initial');
    curateMetrics.navigationTiming.totalLoadTime = curateLoadTime;
    results.push(curateMetrics);
    console.log('Curation Initial Load Metrics:', JSON.stringify(curateMetrics, null, 2));

    // Test curation interaction (if there's a search or filter)
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      const curateInteractionMetrics = await collectMetrics(page, 'curation-after-interaction');
      results.push(curateInteractionMetrics);
      console.log('Curation After Interaction Metrics:', JSON.stringify(curateInteractionMetrics, null, 2));
    }

    // Check for layout shifts
    expect(curateMetrics.CLS).toBeLessThan(0.1);
  });

  test.afterAll(async () => {
    // Generate summary report
    console.log('\n📊 Performance Test Summary\n');
    console.log('='.repeat(80));

    for (const metric of results) {
      console.log(`\n📄 Page: ${metric.page}`);
      console.log(`   FCP: ${metric.FCP?.toFixed(2)}ms`);
      console.log(`   LCP: ${metric.LCP?.toFixed(2)}ms`);
      console.log(`   CLS: ${metric.CLS?.toFixed(4)}`);
      console.log(`   TTFB: ${metric.TTFB?.toFixed(2)}ms`);
      console.log(`   Total Load: ${metric.navigationTiming.totalLoadTime.toFixed(2)}ms`);
      console.log(`   Resources: ${metric.resources.total} (${(metric.resources.totalSize / 1024).toFixed(2)} KB)`);
      if (metric.memory) {
        console.log(`   Memory Used: ${(metric.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Performance testing complete!\n');

    // Save results to file
    const fs = require('fs');
    const reportPath = './tests/performance/results.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📁 Full results saved to: ${reportPath}\n`);
  });
});
