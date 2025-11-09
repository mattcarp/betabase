/**
 * Web Vitals Performance Monitoring for Chat
 * Comprehensive performance metrics using Chrome DevTools Protocol
 * 
 * Run with: npx playwright test tests/performance/web-vitals-chat.spec.ts
 */

import { test, expect } from '@playwright/test';
import type { CDPSession } from '@playwright/test';
import fs from 'fs';
import path from 'path';

interface WebVitalsMetrics {
  timestamp: string;
  page: string;
  
  // Core Web Vitals
  LCP?: number;  // Largest Contentful Paint
  FID?: number;  // First Input Delay (deprecated, replaced by INP)
  CLS?: number;  // Cumulative Layout Shift
  INP?: number;  // Interaction to Next Paint
  
  // Loading Performance
  TTFB?: number; // Time to First Byte
  FCP?: number;  // First Contentful Paint
  
  // Navigation Timing
  navigationTiming: {
    domContentLoaded: number;
    loadComplete: number;
    domInteractive: number;
    totalLoadTime: number;
  };
  
  // Resource Performance
  resources: {
    total: number;
    js: number;
    css: number;
    images: number;
    totalSize: number;
    largestResource?: {
      name: string;
      size: number;
      duration: number;
    };
  };
  
  // Memory
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    usedMB: number;
    totalMB: number;
  };
  
  // Long Tasks (blocking main thread)
  longTasks?: Array<{
    name: string;
    duration: number;
    startTime: number;
  }>;
  
  // Chat-specific metrics
  chatMetrics?: {
    inputInteractionDelay: number;
    responseStartDelay: number;
    responseComplete: number;
  };
}

test.describe('Web Vitals - Chat Performance', () => {
  let cdpSession: CDPSession;
  const results: WebVitalsMetrics[] = [];

  test.beforeEach(async ({ page, context }) => {
    // Enable CDP session for advanced metrics
    cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Performance.enable');
    await cdpSession.send('Network.enable');
    
    // Enable long task monitoring
    await page.evaluate(() => {
      (window as any).__longTasks = [];
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              (window as any).__longTasks.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch (e) {
          console.log('Long task observer not supported');
        }
      }
    });
  });

  test('Web Vitals - Home Page', async ({ page }) => {
    console.log('\n📊 Measuring Home Page Web Vitals...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let everything settle

    const metrics = await collectMetrics(page, cdpSession, 'home-page');
    results.push(metrics);

    console.log('✅ Home Page Metrics:');
    printMetrics(metrics);

    // Assert Web Vitals thresholds
    expect(metrics.LCP).toBeLessThan(2500); // Good LCP < 2.5s
    expect(metrics.FCP).toBeLessThan(1800); // Good FCP < 1.8s
    expect(metrics.CLS).toBeLessThan(0.1);  // Good CLS < 0.1
    expect(metrics.TTFB).toBeLessThan(800); // Good TTFB < 0.8s
  });

  test('Web Vitals - Chat Tab Switch', async ({ page }) => {
    console.log('\n📊 Measuring Chat Tab Switch Performance...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const startTime = performance.now();
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const switchTime = performance.now() - startTime;

    const metrics = await collectMetrics(page, cdpSession, 'chat-tab-switch');
    metrics.navigationTiming.totalLoadTime = switchTime;
    results.push(metrics);

    console.log('✅ Chat Tab Switch Metrics:');
    console.log(`   Tab Switch Time: ${Math.round(switchTime)}ms`);
    printMetrics(metrics);

    // Chat tab should load quickly (it's client-side)
    expect(switchTime).toBeLessThan(1000); // Should be < 1s
    expect(metrics.CLS).toBeLessThan(0.1); // No layout shifts
  });

  test('Web Vitals - Chat Interaction (with AOMA)', async ({ page }) => {
    console.log('\n📊 Measuring Chat Interaction Performance (Real Query)...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Measure input interaction delay
    const input = page.locator('textarea, input[type="text"]').first();
    
    const inputInteractionStart = performance.now();
    await input.click();
    const inputInteractionDelay = performance.now() - inputInteractionStart;

    await input.fill('What is AOMA?');

    // Measure response timing
    const responseStart = performance.now();
    await input.press('Enter');

    // Wait for API response
    const responseDelayPromise = page.waitForResponse(
      (response) => response.url().includes('/api/chat'),
      { timeout: 30000 }
    ).then(() => performance.now() - responseStart);

    // Wait for visible response
    await page.waitForSelector('[data-role="assistant"], .assistant-message, [role="article"]', {
      timeout: 30000
    });
    const responseVisible = performance.now() - responseStart;

    // Wait for complete response
    await page.waitForTimeout(3000);
    const responseComplete = performance.now() - responseStart;

    const responseDelay = await responseDelayPromise;

    const metrics = await collectMetrics(page, cdpSession, 'chat-with-aoma');
    metrics.chatMetrics = {
      inputInteractionDelay,
      responseStartDelay: responseDelay,
      responseComplete
    };
    results.push(metrics);

    console.log('✅ Chat Interaction Metrics:');
    console.log(`   Input Interaction Delay: ${Math.round(inputInteractionDelay)}ms`);
    console.log(`   Response Start (AOMA):   ${Math.round(responseDelay)}ms ⚠️  BOTTLENECK`);
    console.log(`   Response Visible:        ${Math.round(responseVisible)}ms`);
    console.log(`   Response Complete:       ${Math.round(responseComplete)}ms`);
    printMetrics(metrics);

    // Check for performance issues
    if (responseDelay > 1500) {
      console.log('\n⚠️  PERFORMANCE WARNING: AOMA orchestration is slow');
      console.log('   Expected: <1000ms');
      console.log(`   Actual: ${Math.round(responseDelay)}ms`);
      console.log('\n   Recommendations:');
      console.log('   1. Enable embedding cache');
      console.log('   2. Optimize Supabase index');
      console.log('   3. Consider background processing');
    }

    // Input should be instant (<100ms for "Good" INP)
    expect(inputInteractionDelay).toBeLessThan(200);
    
    // AOMA orchestration should be reasonable
    // Note: This might fail if cache is cold, which is intentional to catch issues
    expect(responseDelay).toBeLessThan(3000);
  });

  test('Web Vitals - Long Task Detection', async ({ page }) => {
    console.log('\n📊 Detecting Long Tasks (Main Thread Blocking)...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');

    // Interact with chat
    const input = page.locator('textarea, input[type="text"]').first();
    await input.fill('What is AOMA?');
    await input.press('Enter');
    await page.waitForTimeout(5000);

    // Get long tasks
    const longTasks = await page.evaluate(() => (window as any).__longTasks || []);
    
    console.log(`\n🔍 Found ${longTasks.length} long tasks (>50ms)`);
    
    if (longTasks.length > 0) {
      console.log('\n⚠️  Long Tasks Detected (blocking main thread):');
      longTasks.forEach((task: any, index: number) => {
        console.log(`   ${index + 1}. ${task.name}: ${Math.round(task.duration)}ms at ${Math.round(task.startTime)}ms`);
      });

      // Find the longest task
      const longestTask = longTasks.reduce((max: any, task: any) => 
        task.duration > max.duration ? task : max, longTasks[0]
      );

      console.log(`\n❌ LONGEST TASK: ${Math.round(longestTask.duration)}ms`);
      
      if (longestTask.duration > 200) {
        console.log('   ⚠️  This is significantly blocking user interaction!');
        console.log('   Target: <50ms for smooth 60fps');
      }
    } else {
      console.log('   ✅ No significant long tasks detected');
    }

    const metrics = await collectMetrics(page, cdpSession, 'long-task-analysis');
    metrics.longTasks = longTasks;
    results.push(metrics);

    // Should not have tasks blocking main thread for >500ms
    const maxTaskDuration = Math.max(...longTasks.map((t: any) => t.duration), 0);
    expect(maxTaskDuration).toBeLessThan(500);
  });

  test('Web Vitals - Memory Leak Detection', async ({ page }) => {
    console.log('\n📊 Checking for Memory Leaks...\n');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.click('text=Chat');
    await page.waitForLoadState('networkidle');

    // Get initial memory
    const initialMemory = await getMemoryMetrics(page);
    console.log(`Initial Memory: ${initialMemory.usedMB}MB`);

    // Perform multiple chat interactions
    for (let i = 0; i < 5; i++) {
      const input = page.locator('textarea, input[type="text"]').first();
      await input.fill(`Test query ${i + 1}`);
      await input.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Get final memory
    const finalMemory = await getMemoryMetrics(page);
    console.log(`Final Memory: ${finalMemory.usedMB}MB`);
    
    const memoryGrowth = finalMemory.usedMB - initialMemory.usedMB;
    console.log(`Memory Growth: ${Math.round(memoryGrowth)}MB`);

    if (memoryGrowth > 50) {
      console.log('⚠️  WARNING: Significant memory growth detected!');
      console.log('   This could indicate a memory leak.');
    } else {
      console.log('✅ Memory usage is stable.');
    }

    // Memory shouldn't grow more than 50MB for 5 simple interactions
    expect(memoryGrowth).toBeLessThan(50);
  });

  test.afterAll(async () => {
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📊 WEB VITALS PERFORMANCE REPORT');
    console.log('='.repeat(80));

    // Calculate averages
    const avgMetrics = calculateAverageMetrics(results);
    
    console.log('\n📈 AVERAGE METRICS ACROSS ALL TESTS:');
    printMetrics(avgMetrics);

    console.log('\n🎯 WEB VITALS THRESHOLDS:');
    console.log('   LCP (Largest Contentful Paint):');
    console.log(`      Current: ${Math.round(avgMetrics.LCP || 0)}ms`);
    console.log('      Good: <2500ms | Needs Improvement: 2500-4000ms | Poor: >4000ms');
    console.log('   FCP (First Contentful Paint):');
    console.log(`      Current: ${Math.round(avgMetrics.FCP || 0)}ms`);
    console.log('      Good: <1800ms | Needs Improvement: 1800-3000ms | Poor: >3000ms');
    console.log('   CLS (Cumulative Layout Shift):');
    console.log(`      Current: ${(avgMetrics.CLS || 0).toFixed(4)}`);
    console.log('      Good: <0.1 | Needs Improvement: 0.1-0.25 | Poor: >0.25');
    console.log('   TTFB (Time to First Byte):');
    console.log(`      Current: ${Math.round(avgMetrics.TTFB || 0)}ms`);
    console.log('      Good: <800ms | Needs Improvement: 800-1800ms | Poor: >1800ms');

    // Save report
    const reportDir = path.join(process.cwd(), 'tests', 'performance', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `web-vitals-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: avgMetrics,
      results
    }, null, 2));

    console.log(`\n💾 Report saved to: ${reportPath}\n`);
    console.log('='.repeat(80) + '\n');
  });
});

async function collectMetrics(
  page: any,
  cdpSession: CDPSession,
  pageName: string
): Promise<WebVitalsMetrics> {
  // Collect browser metrics
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
    const resourceSizes = resources.map((r: any) => ({
      name: r.name,
      size: r.transferSize || 0,
      duration: r.duration
    }));
    const largestResource = resourceSizes.reduce((max: any, r: any) => 
      r.size > max.size ? r : max, { name: '', size: 0, duration: 0 }
    );

    const resourceMetrics = {
      total: resources.length,
      js: resources.filter(r => r.name.endsWith('.js')).length,
      css: resources.filter(r => r.name.endsWith('.css')).length,
      images: resources.filter(r => (r as any).initiatorType === 'img').length,
      totalSize: resources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0),
      largestResource: largestResource.size > 0 ? {
        name: largestResource.name.split('/').pop() || largestResource.name,
        size: largestResource.size,
        duration: largestResource.duration
      } : undefined
    };

    // Memory
    const memory = (performance as any).memory ? {
      usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
      totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
      jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
      usedMB: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
      totalMB: (performance as any).memory.totalJSHeapSize / 1024 / 1024,
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
  try {
    const cdpMetrics = await cdpSession.send('Performance.getMetrics');
    const clsMetric = cdpMetrics.metrics.find((m: any) => m.name === 'LayoutShift');
    if (clsMetric) {
      CLS = clsMetric.value;
    }
  } catch (e) {
    console.log('Could not fetch CDP metrics');
  }

  return {
    timestamp: new Date().toISOString(),
    page: pageName,
    ...metrics,
    CLS,
  };
}

async function getMemoryMetrics(page: any) {
  return await page.evaluate(() => {
    const memory = (performance as any).memory;
    if (!memory) {
      return { usedMB: 0, totalMB: 0 };
    }
    return {
      usedMB: memory.usedJSHeapSize / 1024 / 1024,
      totalMB: memory.totalJSHeapSize / 1024 / 1024,
    };
  });
}

function printMetrics(metrics: Partial<WebVitalsMetrics>) {
  console.log(`   LCP: ${metrics.LCP ? Math.round(metrics.LCP) : 'N/A'}ms`);
  console.log(`   FCP: ${metrics.FCP ? Math.round(metrics.FCP) : 'N/A'}ms`);
  console.log(`   CLS: ${metrics.CLS ? metrics.CLS.toFixed(4) : 'N/A'}`);
  console.log(`   TTFB: ${metrics.TTFB ? Math.round(metrics.TTFB) : 'N/A'}ms`);
  
  if (metrics.resources) {
    console.log(`   Resources: ${metrics.resources.total} (${(metrics.resources.totalSize / 1024).toFixed(2)} KB)`);
    if (metrics.resources.largestResource) {
      console.log(`   Largest Resource: ${metrics.resources.largestResource.name} (${(metrics.resources.largestResource.size / 1024).toFixed(2)} KB)`);
    }
  }
  
  if (metrics.memory) {
    console.log(`   Memory: ${metrics.memory.usedMB.toFixed(2)} MB / ${metrics.memory.totalMB.toFixed(2)} MB`);
  }
}

function calculateAverageMetrics(results: WebVitalsMetrics[]): Partial<WebVitalsMetrics> {
  if (results.length === 0) return {};

  const sum = (arr: (number | undefined)[]) => {
    const validValues = arr.filter((v): v is number => v !== undefined);
    return validValues.length > 0 
      ? validValues.reduce((a, b) => a + b, 0) / validValues.length 
      : undefined;
  };

  return {
    LCP: sum(results.map(r => r.LCP)),
    FCP: sum(results.map(r => r.FCP)),
    CLS: sum(results.map(r => r.CLS)),
    TTFB: sum(results.map(r => r.TTFB)),
    resources: {
      total: Math.round(sum(results.map(r => r.resources?.total)) || 0),
      js: Math.round(sum(results.map(r => r.resources?.js)) || 0),
      css: Math.round(sum(results.map(r => r.resources?.css)) || 0),
      images: Math.round(sum(results.map(r => r.resources?.images)) || 0),
      totalSize: Math.round(sum(results.map(r => r.resources?.totalSize)) || 0),
    },
    memory: {
      usedMB: sum(results.map(r => r.memory?.usedMB)) || 0,
      totalMB: sum(results.map(r => r.memory?.totalMB)) || 0,
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    },
  };
}









