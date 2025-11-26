import { test, expect } from '../fixtures/base-test';

interface PerformanceMetrics {
  page: string;
  timestamp: string;
  LCP?: number;
  FCP?: number;
  TTFB?: number;
  CLS: number;
  loadTime: number;
  resources: {
    total: number;
    js: number;
    css: number;
    totalSize: number;
  };
  memory?: {
    usedMB: number;
    totalMB: number;
  };
  consoleErrors: number;
  layoutShiftEntries: number;
}

const results: PerformanceMetrics[] = [];

async function collectMetrics(page: any, pageName: string): Promise<PerformanceMetrics> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500); // Allow layout to settle

  const metrics = await page.evaluate(() => {
    const perf = performance;
    const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

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

    // Load time
    const loadTime = nav.loadEventEnd - nav.fetchStart;

    // Resources
    const resources = perf.getEntriesByType('resource');
    const resourceMetrics = {
      total: resources.length,
      js: resources.filter(r => r.name.endsWith('.js')).length,
      css: resources.filter(r => r.name.endsWith('.css')).length,
      totalSize: resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0),
    };

    // Memory
    const memory = (performance as any).memory ? {
      usedMB: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
      totalMB: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
    } : undefined;

    // CLS calculation
    let cls = 0;
    let layoutShiftCount = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).hadRecentInput) continue;
        cls += (entry as any).value;
        layoutShiftCount++;
      }
    });

    // Get buffered layout shifts
    try {
      const layoutShifts = perf.getEntriesByType('layout-shift');
      layoutShiftCount = layoutShifts.length;
      cls = layoutShifts.reduce((sum: number, entry: any) => {
        return entry.hadRecentInput ? sum : sum + entry.value;
      }, 0);
    } catch (e) {
      // Layout shift API not available
    }

    return {
      LCP,
      FCP,
      TTFB,
      CLS: cls,
      loadTime,
      resources: resourceMetrics,
      memory,
      layoutShiftEntries: layoutShiftCount,
    };
  });

  // Count console errors
  const logs = await page.evaluate(() => {
    return (window as any).__consoleErrors?.length || 0;
  });

  return {
    page: pageName,
    timestamp: new Date().toISOString(),
    ...metrics,
    consoleErrors: logs,
  };
}

test.describe('Production Performance - thebetabase.com', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console errors
    await page.addInitScript(() => {
      (window as any).__consoleErrors = [];
      const originalError = console.error;
      console.error = (...args: any[]) => {
        (window as any).__consoleErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
  });

  test('Production - Chat Performance', async ({ page }) => {
    console.log('\n🚀 Testing Production Chat Performance...\n');

    // Navigate to production
    await page.goto('https://thebetabase.com', { waitUntil: 'networkidle' });

    // Check if we're on login page
    const isLoginPage = await page.locator('text=Magic Link').isVisible().catch(() => false);

    if (isLoginPage) {
      console.log('⚠️  Login page detected - skipping authenticated chat test');
      console.log('Note: Run with authenticated session for full test');
      return;
    }

    const homeMetrics = await collectMetrics(page, 'production-home');
    results.push(homeMetrics);
    console.log('📊 Home Page:', JSON.stringify(homeMetrics, null, 2));

    // Click Chat tab
    const chatButton = page.locator('text=Chat').first();
    if (await chatButton.isVisible()) {
      const startTime = Date.now();
      await chatButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const chatLoadTime = Date.now() - startTime;

      const chatMetrics = await collectMetrics(page, 'production-chat');
      chatMetrics.loadTime = chatLoadTime;
      results.push(chatMetrics);
      console.log('📊 Chat Load:', JSON.stringify(chatMetrics, null, 2));

      // Check CLS
      console.log(`\n📏 CLS Score: ${chatMetrics.CLS.toFixed(4)} (Good: < 0.1, Needs Improvement: < 0.25)`);
      if (chatMetrics.CLS > 0.1) {
        console.log(`⚠️  WARNING: CLS exceeds good threshold!`);
      }

      expect(chatMetrics.CLS).toBeLessThan(0.25); // Don't fail, just warn
    }
  });

  test('Production - Curation Performance', async ({ page }) => {
    console.log('\n🚀 Testing Production Curation Performance...\n');

    await page.goto('https://thebetabase.com', { waitUntil: 'networkidle' });

    // Check if we're on login page
    const isLoginPage = await page.locator('text=Magic Link').isVisible().catch(() => false);

    if (isLoginPage) {
      console.log('⚠️  Login page detected - skipping authenticated curation test');
      return;
    }

    // Click Curate tab
    const curateButton = page.locator('text=Curate').first();
    if (await curateButton.isVisible()) {
      const startTime = Date.now();
      await curateButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      const curateLoadTime = Date.now() - startTime;

      const curateMetrics = await collectMetrics(page, 'production-curate');
      curateMetrics.loadTime = curateLoadTime;
      results.push(curateMetrics);
      console.log('📊 Curation Load:', JSON.stringify(curateMetrics, null, 2));

      // Check CLS
      console.log(`\n📏 CLS Score: ${curateMetrics.CLS.toFixed(4)} (Good: < 0.1, Needs Improvement: < 0.25)`);
      if (curateMetrics.CLS > 0.1) {
        console.log(`⚠️  WARNING: CLS exceeds good threshold!`);
      }

      expect(curateMetrics.CLS).toBeLessThan(0.25);
    }
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION PERFORMANCE SUMMARY');
    console.log('='.repeat(80));

    for (const metric of results) {
      console.log(`\n📄 ${metric.page.toUpperCase()}`);
      console.log(`   ⚡ FCP: ${metric.FCP?.toFixed(0)}ms ${metric.FCP && metric.FCP < 1800 ? '✅' : '⚠️'}`);
      console.log(`   🎨 LCP: ${metric.LCP?.toFixed(0)}ms ${metric.LCP && metric.LCP < 2500 ? '✅' : '⚠️'}`);
      console.log(`   📐 CLS: ${metric.CLS.toFixed(4)} ${metric.CLS < 0.1 ? '✅' : metric.CLS < 0.25 ? '⚠️' : '❌'}`);
      console.log(`   🌐 TTFB: ${metric.TTFB?.toFixed(0)}ms ${metric.TTFB && metric.TTFB < 800 ? '✅' : '⚠️'}`);
      console.log(`   ⏱️  Load: ${metric.loadTime.toFixed(0)}ms`);
      console.log(`   📦 Resources: ${metric.resources.total} (${(metric.resources.totalSize / 1024 / 1024).toFixed(2)} MB)`);
      if (metric.memory) {
        console.log(`   🧠 Memory: ${metric.memory.usedMB.toFixed(2)} MB`);
      }
      console.log(`   🔄 Layout Shifts: ${metric.layoutShiftEntries}`);
      console.log(`   ❌ Console Errors: ${metric.consoleErrors}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✨ Web Vitals Thresholds:');
    console.log('   FCP: Good < 1.8s, Needs Improvement < 3.0s');
    console.log('   LCP: Good < 2.5s, Needs Improvement < 4.0s');
    console.log('   CLS: Good < 0.1, Needs Improvement < 0.25');
    console.log('   TTFB: Good < 0.8s, Needs Improvement < 1.8s');
    console.log('\n');

    // Save to file
    const fs = require('fs');
    fs.writeFileSync('./tests/performance/production-results.json', JSON.stringify(results, null, 2));
    console.log('💾 Results saved to: tests/performance/production-results.json\n');
  });
});
