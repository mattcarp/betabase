const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

console.log(`
🔐 AOMA Manual Login & Crawl Assistant
======================================

This script will:
1. Open a browser for you to login manually
2. Save your authentication once complete
3. Crawl AOMA pages with the saved session

Please have your Azure AD credentials ready!
`);

const STORAGE_FILE = path.join(process.cwd(), "tmp/aoma-stage-storage.json");
const AOMA_BASE = "https://aoma-stage.smcdp-de.net";

async function manualLoginAndCrawl() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  try {
    // Start fresh or with existing auth
    let context;
    try {
      await fs.access(STORAGE_FILE);
      console.log("📂 Found existing auth, loading...\n");
      context = await browser.newContext({ storageState: STORAGE_FILE });
    } catch {
      console.log("🆕 Starting fresh authentication\n");
      context = await browser.newContext();
    }

    const page = await context.newPage();

    // Navigate to AOMA
    console.log("🌐 Opening AOMA Stage...");
    await page.goto(AOMA_BASE, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    let isAuthenticated = false;
    const currentUrl = page.url();

    // Check if we need to login
    if (currentUrl.includes("Login") || currentUrl.includes("microsoftonline")) {
      console.log("\n⚠️  LOGIN REQUIRED");
      console.log("=" * 50);
      console.log("Please login in the browser window:");
      console.log('1. Click "Employee Login" if you see it');
      console.log("2. Enter your Azure AD credentials");
      console.log("3. Approve MFA on your phone");
      console.log("4. Wait to be redirected back to AOMA");
      console.log("=" * 50 + "\n");

      // Wait for successful authentication (up to 5 minutes)
      console.log("⏳ Waiting for you to complete login...\n");

      for (let i = 0; i < 100; i++) {
        await page.waitForTimeout(3000);
        const url = page.url();

        if (url.includes("aoma-stage") && !url.includes("Login")) {
          isAuthenticated = true;
          console.log("\n✅ LOGIN SUCCESSFUL!\n");
          break;
        }

        if (i % 5 === 0) {
          process.stdout.write(".");
        }
      }
    } else {
      console.log("✅ Already authenticated!\n");
      isAuthenticated = true;
    }

    if (!isAuthenticated) {
      console.log("\n❌ Login timeout. Please run the script again and complete login.");
      return;
    }

    // Save authentication
    await context.storageState({ path: STORAGE_FILE });
    console.log("💾 Saved authentication for future use\n");

    // Now crawl!
    console.log("🕷️ STARTING CRAWL");
    console.log("=" * 50 + "\n");

    const pages = [
      { path: "/aoma-ui/my-aoma-files", name: "My AOMA Files" },
      { path: "/aoma-ui/simple-upload", name: "Simple Upload" },
      { path: "/aoma-ui/direct-upload", name: "Direct Upload" },
      { path: "/aoma-ui/product-metadata-viewer", name: "Product Metadata Viewer" },
      { path: "/aoma-ui/unified-submission-tool", name: "Unified Submission Tool" },
      { path: "/aoma-ui/registration-job-status", name: "Registration Job Status" },
      { path: "/aoma-ui/video-metadata", name: "Video Metadata" },
    ];

    const results = [];
    await fs.mkdir("tmp/aoma-crawled", { recursive: true });

    for (const pageInfo of pages) {
      const url = `${AOMA_BASE}${pageInfo.path}`;
      console.log(`📄 Crawling: ${pageInfo.name}`);
      console.log(`   URL: ${url}`);

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(2000);

        const finalUrl = page.url();
        const title = await page.title();

        // Check if we got redirected to login
        if (finalUrl.includes("Login")) {
          console.log(`   ❌ Got login page - auth may have expired\n`);
          results.push({ ...pageInfo, error: "Login redirect" });
          continue;
        }

        // Get the HTML content
        const html = await page.content();

        // Extract useful information
        const extracted = await page.evaluate(() => {
          const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.innerText.trim() : null;
          };

          const getAll = (selector) => {
            return Array.from(document.querySelectorAll(selector))
              .map((el) => el.innerText.trim())
              .filter(Boolean);
          };

          return {
            headings: getAll("h1, h2, h3"),
            labels: getAll("label"),
            buttons: getAll("button"),
            links: Array.from(document.querySelectorAll("a[href]"))
              .map((a) => ({
                text: a.innerText.trim(),
                href: a.href,
              }))
              .filter((l) => l.text),
            forms: document.querySelectorAll("form").length,
            tables: document.querySelectorAll("table").length,
          };
        });

        // Save files
        const timestamp = Date.now();
        const safeName = pageInfo.path.replace(/\//g, "_").substring(1);

        await fs.writeFile(path.join("tmp/aoma-crawled", `${safeName}_${timestamp}.html`), html);

        await page.screenshot({
          path: path.join("tmp/aoma-crawled", `${safeName}_${timestamp}.png`),
          fullPage: true,
        });

        results.push({
          ...pageInfo,
          success: true,
          title,
          url: finalUrl,
          extracted,
        });

        console.log(`   ✅ Success!`);
        console.log(
          `   📊 Found: ${extracted.headings.length} headings, ${extracted.buttons.length} buttons, ${extracted.links.length} links\n`
        );
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}\n`);
        results.push({ ...pageInfo, error: error.message });
      }
    }

    // Summary
    console.log("\n" + "=" * 50);
    console.log("📊 CRAWL COMPLETE");
    console.log("=" * 50 + "\n");

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => r.error);

    console.log(`✅ Success: ${successful.length}/${pages.length} pages`);
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.length} pages`);
      failed.forEach((f) => console.log(`   - ${f.name}: ${f.error}`));
    }

    // Save summary
    await fs.writeFile(
      path.join("tmp/aoma-crawled", `summary_${Date.now()}.json`),
      JSON.stringify(results, null, 2)
    );

    console.log("\n📁 Files saved to: tmp/aoma-crawled/");
    console.log("✨ Done!\n");

    console.log("Browser will remain open for 30 seconds for inspection...");
    await page.waitForTimeout(30000);
  } catch (error) {
    console.error("\n❌ Fatal error:", error.message);
  } finally {
    await browser.close();
    console.log("\n👋 Browser closed");
  }
}

manualLoginAndCrawl().catch(console.error);
