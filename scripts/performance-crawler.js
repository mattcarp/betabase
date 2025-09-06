/**
 * 🚀 SIAM Multi-Tenant Performance Crawler
 * Enhanced for AOMA, Jira, and Enterprise Application Testing
 * Collects Web Vitals, Lighthouse scores, and comprehensive performance data
 */

const { chromium } = require("playwright");
const lighthouse = require("lighthouse");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs").promises;

// 🌐 Supabase Configuration
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 🎯 Application Configuration Registry
 * Add new applications here for testing
 */
const APP_CONFIGS = {
  AOMA: {
    name: "Asset Offering And Management Application",
    baseUrl: "https://aoma-stage.smcdp-de.net",
    loginSelector: 'input[type="email"]',
    loginUrl: "/aoma-ui/login",
    maxPages: 50,
    crawlDelay: 2000,
  },
  JIRA_UAT: {
    name: "Atlassian Jira UAT",
    baseUrl: "https://jira.smedigitalapps.com/jira",
    loginSelector: "#username",
    loginUrl: "/login",
    maxPages: 100,
    crawlDelay: 3000,
  },
  CONFLUENCE: {
    name: "Atlassian Confluence",
    baseUrl: "https://your-confluence-instance.atlassian.net",
    loginSelector: "#username",
    loginUrl: "/login",
    maxPages: 75,
    crawlDelay: 2500,
  },
};

class PerformanceCrawler {
  constructor(appId, options = {}) {
    this.appId = appId;
    this.config = APP_CONFIGS[appId];
    this.testRunId = `${appId}-${Date.now()}`;
    this.options = {
      headless: true,
      screenshots: true,
      lighthouse: true,
      ...options,
    };

    if (!this.config) {
      throw new Error(
        `Application ${appId} not configured. Available: ${Object.keys(APP_CONFIGS).join(", ")}`,
      );
    }

    console.log(`🚀 Performance Crawler initialized for ${this.config.name}`);
  }

  /**
   * 📊 Collect Web Vitals and Performance Metrics
   */
  async collectPerformanceMetrics(page, url) {
    const metrics = {
      app_id: this.appId,
      url: url,
      test_run_id: this.testRunId,
      visited_at: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };

    try {
      // 🎯 Web Vitals Collection
      const webVitals = await page.evaluate(() => {
        return new Promise((resolve) => {
          let vitals = {};

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            vitals.lcp = Math.round(lastEntry.startTime);
          }).observe({ type: "largest-contentful-paint", buffered: true });

          // First Input Delay
          new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            if (firstInput) {
              vitals.fid = Math.round(
                firstInput.processingStart - firstInput.startTime,
              );
            }
          }).observe({ type: "first-input", buffered: true });

          // Cumulative Layout Shift
          new PerformanceObserver((list) => {
            let cls = 0;
            list.getEntries().forEach((entry) => {
              if (!entry.hadRecentInput) {
                cls += entry.value;
              }
            });
            vitals.cls = cls;
          }).observe({ type: "layout-shift", buffered: true });

          // Performance Navigation Timing
          const navigation = performance.getEntriesByType("navigation")[0];
          if (navigation) {
            vitals.ttfb = Math.round(navigation.responseStart);
            vitals.fcp = Math.round(navigation.domContentLoadedEventEnd);
            vitals.tti = Math.round(navigation.loadEventEnd);
            vitals.resource_load_time = Math.round(
              navigation.loadEventEnd - navigation.fetchStart,
            );
          }

          // Resource Performance
          const resources = performance.getEntriesByType("resource");
          vitals.js_execution_time = Math.round(
            resources
              .filter((r) => r.name.includes(".js"))
              .reduce((sum, r) => sum + r.duration, 0),
          );
          vitals.css_load_time = Math.round(
            resources
              .filter((r) => r.name.includes(".css"))
              .reduce((sum, r) => sum + r.duration, 0),
          );
          vitals.image_load_time = Math.round(
            resources
              .filter((r) => /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name))
              .reduce((sum, r) => sum + r.duration, 0),
          );
          vitals.font_load_time = Math.round(
            resources
              .filter((r) => /\.(woff|woff2|ttf|otf)/.test(r.name))
              .reduce((sum, r) => sum + r.duration, 0),
          );
          vitals.network_requests = resources.length;

          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // 🚨 Error Collection
      const consoleErrors = await page.evaluate(() => {
        return window.performanceCrawlerErrors || [];
      });

      // 📊 Content Analysis
      const contentMetrics = await page.evaluate(() => {
        const text = document.body.innerText || "";
        const images = document.querySelectorAll("img").length;
        const links = document.querySelectorAll("a").length;
        const forms = document.querySelectorAll("form").length;

        return {
          content_length: text.length,
          word_count: text.split(/\s+/).filter((word) => word.length > 0)
            .length,
          image_count: images,
          link_count: links,
          form_count: forms,
        };
      });

      // 💾 Memory Usage
      const memoryInfo = await page.evaluate(() => {
        if (performance.memory) {
          return {
            memory_usage_mb: Math.round(
              performance.memory.usedJSHeapSize / 1024 / 1024,
            ),
          };
        }
        return { memory_usage_mb: null };
      });

      // 📏 Page Size
      const response = await page.goto(url, { waitUntil: "networkidle" });
      const pageSize = await response.body().then((body) => body.length);

      // 🎯 Merge all metrics
      Object.assign(metrics, {
        ...webVitals,
        ...contentMetrics,
        ...memoryInfo,
        console_errors: consoleErrors.filter((e) => e.type === "error").length,
        console_warnings: consoleErrors.filter((e) => e.type === "warning")
          .length,
        js_errors: consoleErrors.filter((e) => e.message.includes("Error"))
          .length,
        page_size_kb: Math.round(pageSize / 1024),
        status: response.status(),
      });

      // Convert decimal fields
      if (metrics.web_vitals_cls) {
        metrics.web_vitals_cls = parseFloat(metrics.cls.toFixed(3));
      }
    } catch (error) {
      console.error(`❌ Error collecting metrics for ${url}:`, error.message);
      metrics.console_errors = (metrics.console_errors || 0) + 1;
    }

    return metrics;
  }

  /**
   * 🔍 Run Lighthouse Audit
   */
  async runLighthouseAudit(url, port) {
    if (!this.options.lighthouse) return {};

    try {
      const result = await lighthouse(url, {
        port: port,
        output: "json",
        logLevel: "info",
        chromeFlags: ["--headless"],
      });

      const scores = result.report.categories;
      return {
        lighthouse_performance: Math.round(scores.performance.score * 100),
        lighthouse_accessibility: Math.round(scores.accessibility.score * 100),
        lighthouse_best_practices: Math.round(
          scores["best-practices"].score * 100,
        ),
        lighthouse_seo: Math.round(scores.seo.score * 100),
        lighthouse_pwa: scores.pwa ? Math.round(scores.pwa.score * 100) : null,
      };
    } catch (error) {
      console.error(`❌ Lighthouse audit failed for ${url}:`, error.message);
      return {};
    }
  }

  /**
   * 📸 Capture Screenshot
   */
  async captureScreenshot(page, url) {
    if (!this.options.screenshots) return null;

    try {
      const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${this.appId}-${sanitizedUrl}-${Date.now()}.png`;
      const path = `screenshots/${filename}`;

      await page.screenshot({
        path: `./public/${path}`,
        fullPage: true,
      });

      return path;
    } catch (error) {
      console.error(`❌ Screenshot failed for ${url}:`, error.message);
      return null;
    }
  }

  /**
   * 🕷️ Crawl Application
   */
  async crawl(credentials = {}) {
    const browser = await chromium.launch({
      headless: this.options.headless,
      args: ["--remote-debugging-port=9222"],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: "SIAM-Performance-Crawler/1.0",
    });

    const page = await context.newPage();

    // 🚨 Setup Error Tracking
    page.on("console", (msg) => {
      if (!page.performanceCrawlerErrors) page.performanceCrawlerErrors = [];
      page.performanceCrawlerErrors.push({
        type: msg.type(),
        message: msg.text(),
        timestamp: Date.now(),
      });
    });

    try {
      console.log(`🌐 Starting crawl of ${this.config.name}`);
      console.log(`📊 Test Run ID: ${this.testRunId}`);

      const crawledPages = [];
      const urlsToVisit = [`${this.config.baseUrl}${this.config.loginUrl}`];
      const visitedUrls = new Set();

      for (const url of urlsToVisit) {
        if (visitedUrls.has(url) || crawledPages.length >= this.config.maxPages)
          continue;

        console.log(`🔍 Crawling: ${url}`);
        visitedUrls.add(url);

        try {
          // 📊 Collect Performance Data
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
          const metrics = await this.collectPerformanceMetrics(page, url);

          // 🔍 Run Lighthouse Audit
          const lighthouseScores = await this.runLighthouseAudit(url, 9222);
          Object.assign(metrics, lighthouseScores);

          // 📸 Capture Screenshot
          const screenshotPath = await this.captureScreenshot(page, url);
          if (screenshotPath) metrics.screenshot_path = screenshotPath;

          // 📄 Extract Content
          const content = await page.evaluate(() => {
            return {
              title: document.title,
              html_content: document.documentElement.outerHTML.substring(
                0,
                50000,
              ), // Limit size
              main_content: document.body?.innerText?.substring(0, 5000) || "",
            };
          });
          Object.assign(metrics, content);

          crawledPages.push(metrics);

          // 🔗 Find More URLs (for future enhancement)
          const newUrls = await page.evaluate((baseUrl) => {
            const links = Array.from(document.querySelectorAll("a[href]"));
            return links
              .map((link) => {
                const href = link.getAttribute("href");
                if (href && href.startsWith("/")) return baseUrl + href;
                if (href && href.startsWith(baseUrl)) return href;
                return null;
              })
              .filter(Boolean)
              .slice(0, 10); // Limit new URLs
          }, this.config.baseUrl);

          urlsToVisit.push(...newUrls);
        } catch (error) {
          console.error(`❌ Error crawling ${url}:`, error.message);
        }

        // ⏱️ Rate limiting
        await page.waitForTimeout(this.config.crawlDelay);
      }

      // 💾 Save to Database
      console.log(`💾 Saving ${crawledPages.length} pages to database...`);

      for (const pageData of crawledPages) {
        try {
          const { error } = await supabase
            .from("crawled_pages")
            .insert(pageData);

          if (error) {
            console.error("❌ Database error:", error.message);
          }
        } catch (dbError) {
          console.error("❌ Database save failed:", dbError.message);
        }
      }

      console.log(
        `🎉 Crawl completed! ${crawledPages.length} pages processed.`,
      );
      console.log(`📊 Performance data saved to Supabase`);

      return {
        testRunId: this.testRunId,
        pagesProcessed: crawledPages.length,
        applicationId: this.appId,
      };
    } finally {
      await browser.close();
    }
  }
}

/**
 * 🚀 Main Execution
 */
async function main() {
  const appId = process.argv[2] || "AOMA";
  const headless = process.argv.includes("--headless");
  const withLighthouse = process.argv.includes("--lighthouse");

  console.log("🚀 SIAM Multi-Tenant Performance Crawler");
  console.log(`📱 Application: ${appId}`);
  console.log(`🖥️  Headless: ${headless}`);
  console.log(`🔍 Lighthouse: ${withLighthouse}`);
  console.log("");

  try {
    // Ensure screenshots directory exists
    await fs.mkdir("./public/screenshots", { recursive: true });

    const crawler = new PerformanceCrawler(appId, {
      headless,
      lighthouse: withLighthouse,
      screenshots: true,
    });

    const result = await crawler.crawl();

    console.log("🎉 Success:", result);
  } catch (error) {
    console.error("❌ Crawler failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { PerformanceCrawler, APP_CONFIGS };
