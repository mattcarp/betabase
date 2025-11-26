import { test, expect } from '../fixtures/base-test';

interface DetailedMetrics {
  page: string;
  timestamp: string;
  webVitals: {
    LCP?: number;
    FCP?: number;
    TTFB?: number;
    CLS: number;
    INP?: number;
  };
  timing: {
    loadTime: number;
    domContentLoaded: number;
    domInteractive: number;
  };
  resources: {
    total: number;
    js: number;
    css: number;
    images: number;
    totalSize: number;
    breakdown: Array<{ type: string; count: number; size: number }>;
  };
  memory?: {
    usedMB: number;
    totalMB: number;
  };
  layoutShifts: Array<{ value: number; time: number }>;
  consoleErrors: string[];
  warnings: string[];
}

const results: DetailedMetrics[] = [];
const allConsoleErrors: string[] = [];

async function collectDetailedMetrics(page: any, pageName: string): Promise<DetailedMetrics> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Allow all layout shifts to settle

  const metrics = await page.evaluate(() => {
    const perf = performance;
    const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    // Web Vitals
    const lcpEntries = perf.getEntriesByType('largest-contentful-paint') as any[];
    const LCP = lcpEntries.length > 0
      ? (lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime)
      : undefined;

    const paintEntries = perf.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    const FCP = fcp ? fcp.startTime : undefined;

    const TTFB = nav.responseStart - nav.requestStart;

    // CLS with details
    const layoutShifts = perf.getEntriesByType('layout-shift');
    let cls = 0;
    const shifts = layoutShifts.map((entry: any) => {
      if (!entry.hadRecentInput) {
        cls += entry.value;
      }
      return {
        value: entry.value,
        time: entry.startTime,
      };
    });

    // Timing
    const timing = {
      loadTime: nav.loadEventEnd - nav.fetchStart,
      domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
      domInteractive: nav.domInteractive,
    };

    // Resources - detailed breakdown
    const resources = perf.getEntriesByType('resource');
    const resourcesByType = new Map<string, { count: number; size: number }>();

    resources.forEach((r: any) => {
      let type = 'other';
      if (r.name.endsWith('.js')) type = 'js';
      else if (r.name.endsWith('.css')) type = 'css';
      else if (r.name.endsWith('.woff') || r.name.endsWith('.woff2')) type = 'font';
      else if (r.name.match(/\.(png|jpg|jpeg|gif|webp|svg)/)) type = 'image';
      else if (r.initiatorType === 'fetch' || r.initiatorType === 'xmlhttprequest') type = 'api';

      const current = resourcesByType.get(type) || { count: 0, size: 0 };
      resourcesByType.set(type, {
        count: current.count + 1,
        size: current.size + (r.transferSize || 0),
      });
    });

    const resourceMetrics = {
      total: resources.length,
      js: resources.filter(r => r.name.endsWith('.js')).length,
      css: resources.filter(r => r.name.endsWith('.css')).length,
      images: resources.filter((r: any) => r.initiatorType === 'img' || r.name.match(/\.(png|jpg|jpeg|gif|webp|svg)/)).length,
      totalSize: resources.reduce((sum, r: any) => sum + (r.transferSize || 0), 0),
      breakdown: Array.from(resourcesByType.entries()).map(([type, data]) => ({
        type,
        count: data.count,
        size: data.size,
      })),
    };

    // Memory
    const memory = (performance as any).memory ? {
      usedMB: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
      totalMB: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
    } : undefined;

    return {
      webVitals: { LCP, FCP, TTFB, CLS: cls },
      timing,
      resources: resourceMetrics,
      memory,
      layoutShifts: shifts,
    };
  });

  // Get console errors
  const errors = await page.evaluate(() => (window as any).__consoleErrors || []);
  const warnings = await page.evaluate(() => (window as any).__consoleWarnings || []);

  return {
    page: pageName,
    timestamp: new Date().toISOString(),
    ...metrics,
    consoleErrors: errors,
    warnings,
  };
}

test.describe('Comprehensive Performance Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    await page.addInitScript(() => {
      (window as any).__consoleErrors = [];
      (window as any).__consoleWarnings = [];

      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args: any[]) => {
        const msg = args.map(a => String(a)).join(' ');
        (window as any).__consoleErrors.push(msg);
        originalError.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        const msg = args.map(a => String(a)).join(' ');
        (window as any).__consoleWarnings.push(msg);
        originalWarn.apply(console, args);
      };
    });
  });

  test('Chat Tab - Full Performance Analysis', async ({ page }) => {
    console.log('\n🔍 CHAT TAB - COMPREHENSIVE ANALYSIS\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    const homeMetrics = await collectDetailedMetrics(page, 'home-initial');
    results.push(homeMetrics);

    // Navigate to Chat
    const startTime = Date.now();
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');
    const navigationTime = Date.now() - startTime;

    const chatMetrics = await collectDetailedMetrics(page, 'chat-loaded');
    chatMetrics.timing.loadTime = navigationTime;
    results.push(chatMetrics);

    console.log(`\n✅ Chat Navigation: ${navigationTime}ms`);
    console.log(`📊 Web Vitals:`);
    console.log(`   FCP: ${chatMetrics.webVitals.FCP?.toFixed(0)}ms`);
    console.log(`   LCP: ${chatMetrics.webVitals.LCP?.toFixed(0)}ms`);
    console.log(`   CLS: ${chatMetrics.webVitals.CLS.toFixed(4)} ⭐ ${chatMetrics.webVitals.CLS < 0.1 ? 'GOOD' : chatMetrics.webVitals.CLS < 0.25 ? 'NEEDS WORK' : 'POOR'}`);
    console.log(`   TTFB: ${chatMetrics.webVitals.TTFB?.toFixed(0)}ms`);

    // Test interaction - type message
    const textarea = page.locator('textarea, input[type="text"]').first();
    await textarea.fill('What is AOMA?');
    await page.waitForTimeout(500);

    // Submit and measure time to first byte of response
    const submitTime = Date.now();
    await textarea.press('Enter');

    // Wait for thinking indicator or response
    try {
      await page.waitForSelector('[data-testid="thinking-indicator"], .thinking, .loading', { timeout: 5000 });
      const thinkingTime = Date.now() - submitTime;
      console.log(`\n⚡ Time to Thinking Indicator: ${thinkingTime}ms`);
    } catch (e) {
      console.log(`\n⚠️  No thinking indicator found`);
    }

    // Wait for response to complete (with generous timeout)
    await page.waitForTimeout(15000); // Give AI time to respond

    const interactionMetrics = await collectDetailedMetrics(page, 'chat-after-response');
    results.push(interactionMetrics);

    const totalResponseTime = Date.now() - submitTime;
    console.log(`⏱️  Total Response Time: ${totalResponseTime}ms`);
    console.log(`📐 CLS During Interaction: ${interactionMetrics.webVitals.CLS.toFixed(4)}`);

    if (interactionMetrics.layoutShifts.length > 0) {
      console.log(`\n⚠️  Layout Shifts Detected: ${interactionMetrics.layoutShifts.length}`);
      interactionMetrics.layoutShifts.forEach((shift, i) => {
        console.log(`   ${i + 1}. Value: ${shift.value.toFixed(4)} at ${shift.time.toFixed(0)}ms`);
      });
    }

    // Check for errors
    if (interactionMetrics.consoleErrors.length > 0) {
      console.log(`\n❌ Console Errors (${interactionMetrics.consoleErrors.length}):`);
      interactionMetrics.consoleErrors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.substring(0, 100)}`);
      });
    }

    // CLS assertion
    expect(interactionMetrics.webVitals.CLS).toBeLessThan(0.25);
  });

  test('Curation Tab - Full Performance Analysis', async ({ page }) => {
    console.log('\n🔍 CURATION TAB - COMPREHENSIVE ANALYSIS\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Navigate to Curate
    const startTime = Date.now();
    await page.click('text=Curate');
    await page.waitForLoadState('networkidle');
    const navigationTime = Date.now() - startTime;

    const curateMetrics = await collectDetailedMetrics(page, 'curation-loaded');
    curateMetrics.timing.loadTime = navigationTime;
    results.push(curateMetrics);

    console.log(`\n✅ Curation Navigation: ${navigationTime}ms`);
    console.log(`📊 Web Vitals:`);
    console.log(`   FCP: ${curateMetrics.webVitals.FCP?.toFixed(0)}ms`);
    console.log(`   LCP: ${curateMetrics.webVitals.LCP?.toFixed(0)}ms`);
    console.log(`   CLS: ${curateMetrics.webVitals.CLS.toFixed(4)} ⭐ ${curateMetrics.webVitals.CLS < 0.1 ? 'GOOD' : curateMetrics.webVitals.CLS < 0.25 ? 'NEEDS WORK' : 'POOR'}`);
    console.log(`   TTFB: ${curateMetrics.webVitals.TTFB?.toFixed(0)}ms`);

    if (curateMetrics.layoutShifts.length > 0) {
      console.log(`\n⚠️  Layout Shifts Detected: ${curateMetrics.layoutShifts.length}`);
      curateMetrics.layoutShifts.forEach((shift, i) => {
        console.log(`   ${i + 1}. Value: ${shift.value.toFixed(4)} at ${shift.time.toFixed(0)}ms`);
      });
    }

    if (curateMetrics.consoleErrors.length > 0) {
      console.log(`\n❌ Console Errors (${curateMetrics.consoleErrors.length}):`);
      curateMetrics.consoleErrors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.substring(0, 100)}`);
      });
    }

    expect(curateMetrics.webVitals.CLS).toBeLessThan(0.25);
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(100));
    console.log('📊 COMPREHENSIVE PERFORMANCE REPORT');
    console.log('='.repeat(100));

    for (const metric of results) {
      console.log(`\n${'─'.repeat(100)}`);
      console.log(`📄 PAGE: ${metric.page.toUpperCase()}`);
      console.log(`${'─'.repeat(100)}`);

      console.log(`\n🎯 WEB VITALS:`);
      console.log(`   First Contentful Paint (FCP): ${metric.webVitals.FCP?.toFixed(0)}ms ${metric.webVitals.FCP && metric.webVitals.FCP < 1800 ? '✅' : '⚠️'}`);
      console.log(`   Largest Contentful Paint (LCP): ${metric.webVitals.LCP?.toFixed(0)}ms ${metric.webVitals.LCP && metric.webVitals.LCP < 2500 ? '✅' : '⚠️'}`);
      console.log(`   Cumulative Layout Shift (CLS): ${metric.webVitals.CLS.toFixed(4)} ${metric.webVitals.CLS < 0.1 ? '✅ GOOD' : metric.webVitals.CLS < 0.25 ? '⚠️ NEEDS WORK' : '❌ POOR'}`);
      console.log(`   Time to First Byte (TTFB): ${metric.webVitals.TTFB?.toFixed(0)}ms ${metric.webVitals.TTFB && metric.webVitals.TTFB < 800 ? '✅' : '⚠️'}`);

      console.log(`\n⏱️  TIMING:`);
      console.log(`   Total Load Time: ${metric.timing.loadTime.toFixed(0)}ms`);
      console.log(`   DOM Interactive: ${metric.timing.domInteractive.toFixed(0)}ms`);
      console.log(`   DOM Content Loaded: ${metric.timing.domContentLoaded.toFixed(0)}ms`);

      console.log(`\n📦 RESOURCES:`);
      console.log(`   Total: ${metric.resources.total}`);
      console.log(`   JavaScript: ${metric.resources.js} files`);
      console.log(`   CSS: ${metric.resources.css} files`);
      console.log(`   Images: ${metric.resources.images} files`);
      console.log(`   Total Size: ${(metric.resources.totalSize / 1024 / 1024).toFixed(2)} MB`);

      if (metric.resources.breakdown.length > 0) {
        console.log(`\n   Breakdown by Type:`);
        metric.resources.breakdown
          .sort((a, b) => b.size - a.size)
          .forEach(item => {
            console.log(`     ${item.type.padEnd(10)} ${item.count.toString().padStart(3)} files   ${(item.size / 1024 / 1024).toFixed(2).padStart(8)} MB`);
          });
      }

      if (metric.memory) {
        console.log(`\n🧠 MEMORY:`);
        console.log(`   Used: ${metric.memory.usedMB.toFixed(2)} MB`);
        console.log(`   Total: ${metric.memory.totalMB.toFixed(2)} MB`);
      }

      if (metric.layoutShifts.length > 0) {
        console.log(`\n📐 LAYOUT SHIFTS (${metric.layoutShifts.length} total):`);
        metric.layoutShifts.slice(0, 5).forEach((shift, i) => {
          console.log(`   ${i + 1}. Score: ${shift.value.toFixed(4)} @ ${shift.time.toFixed(0)}ms`);
        });
        if (metric.layoutShifts.length > 5) {
          console.log(`   ... and ${metric.layoutShifts.length - 5} more`);
        }
      }

      if (metric.consoleErrors.length > 0) {
        console.log(`\n❌ CONSOLE ERRORS (${metric.consoleErrors.length} total):`);
        metric.consoleErrors.slice(0, 3).forEach(err => {
          console.log(`   - ${err.substring(0, 120)}`);
        });
        if (metric.consoleErrors.length > 3) {
          console.log(`   ... and ${metric.consoleErrors.length - 3} more`);
        }
      }

      if (metric.warnings.length > 0) {
        console.log(`\n⚠️  CONSOLE WARNINGS (${metric.warnings.length} total):`);
        metric.warnings.slice(0, 3).forEach(warn => {
          console.log(`   - ${warn.substring(0, 120)}`);
        });
      }
    }

    console.log(`\n${'='.repeat(100)}`);
    console.log('\n✨ WEB VITALS SCORING GUIDE:');
    console.log('   FCP:  Good < 1.8s  |  Needs Improvement < 3.0s  |  Poor > 3.0s');
    console.log('   LCP:  Good < 2.5s  |  Needs Improvement < 4.0s  |  Poor > 4.0s');
    console.log('   CLS:  Good < 0.1   |  Needs Improvement < 0.25  |  Poor > 0.25');
    console.log('   TTFB: Good < 0.8s  |  Needs Improvement < 1.8s  |  Poor > 1.8s');
    console.log('');

    // Save comprehensive results
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `./tests/performance/comprehensive-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`💾 Full results saved to: ${filename}\n`);
  });
});
