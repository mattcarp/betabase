import { test } from "@playwright/test";
import * as fs from "fs";

test("Find the actual HMR error", async ({ page }) => {
  const allLogs: Array<{ time: number; type: string; message: string }> = [];
  const startTime = Date.now();

  // Set up logging BEFORE navigation
  page.on("console", (msg) => {
    const elapsed = Date.now() - startTime;
    allLogs.push({
      time: elapsed,
      type: msg.type(),
      message: msg.text(),
    });

    if (msg.type() === "error" || msg.type() === "warning") {
      console.log(`[${elapsed}ms] [${msg.type().toUpperCase()}]:`, msg.text());
    }
  });

  page.on("pageerror", (error) => {
    const elapsed = Date.now() - startTime;
    allLogs.push({
      time: elapsed,
      type: "PAGE_ERROR",
      message: `${error.message}\n${error.stack || ""}`,
    });
    console.log(`[${elapsed}ms] [PAGE ERROR]:`, error.message);
    if (error.stack) {
      console.log("Stack:", error.stack);
    }
  });

  console.log("\n🔍 Starting page load with full console capture...\n");

  await page.goto("http://localhost:3000", {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });

  console.log("\n⏳ Waiting 10 seconds to capture all errors...\n");

  // Take screenshots every second for 10 seconds
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `test-results/hmr-scan-${i}sec.png`,
      fullPage: true,
    });
    console.log(`  ${i}s - screenshot taken`);
  }

  // Save all logs to a file
  const logContent = allLogs
    .map((log) => `[${log.time}ms] [${log.type}] ${log.message}`)
    .join("\n");

  fs.writeFileSync("test-results/browser-console-full.log", logContent);

  console.log("\n📊 Results:");
  console.log(`   Total log entries: ${allLogs.length}`);
  console.log(
    `   Errors: ${allLogs.filter((l) => l.type === "error" || l.type === "PAGE_ERROR").length}`
  );
  console.log(
    `   Warnings: ${allLogs.filter((l) => l.type === "warning").length}`
  );

  // Show all errors and warnings
  const problems = allLogs.filter(
    (l) =>
      l.type === "error" ||
      l.type === "PAGE_ERROR" ||
      l.type === "warning"
  );

  if (problems.length > 0) {
    console.log("\n❌ Problems found:");
    problems.forEach((log, i) => {
      console.log(`\n${i + 1}. [${log.time}ms] [${log.type}]:`);
      console.log(`   ${log.message.substring(0, 200)}`);
    });
  }

  console.log("\n📁 Full logs saved to: test-results/browser-console-full.log");
  console.log("📸 Screenshots saved to: test-results/hmr-scan-*.png\n");
});
