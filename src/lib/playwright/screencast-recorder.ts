// src/lib/playwright/screencast-recorder.ts
// Screencast recording utilities for AI Test Generator
//
// WARNING: This file is imported by client components (AITestGenerator.tsx).
// DO NOT use top-level imports of Node.js modules (child_process, fs, etc.)
// All server-only modules must be conditionally required inside `if (typeof window === "undefined")`

// Server-only imports - dynamically imported to avoid client-side bundling errors
let execAsync: (command: string, options?: { timeout?: number; cwd?: string }) => Promise<{ stdout: string; stderr: string }>;
let writeFile: (path: string, data: string, encoding: string) => Promise<void>;
let unlink: (path: string) => Promise<void>;

// Initialize server-only modules (only runs on server)
if (typeof window === "undefined") {
  const { exec } = require("child_process");
  const { promisify } = require("util");
  const fs = require("fs/promises");
  execAsync = promisify(exec);
  writeFile = fs.writeFile;
  unlink = fs.unlink;
}

/**
 * Convert a description to a kebab-case filename
 */
export function generateFeatureName(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Collapse multiple hyphens
    .slice(0, 50) // Limit length
    .replace(/^-|-$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Transform Playwright test steps into a recording script with console error capture
 */
export function transformToRecordingScript(
  steps: string[],
  featureName: string,
  baseUrl: string = "http://localhost:3000"
): string {
  const stepsWithPacing = steps
    .map((step) => {
      // Add waitForTimeout after each action step
      const indentedStep = `    ${step}`;
      if (
        step.includes("click") ||
        step.includes("fill") ||
        step.includes("goto")
      ) {
        return `${indentedStep}\n    await page.waitForTimeout(1500);`;
      }
      return indentedStep;
    })
    .join("\n\n");

  const timestamp = new Date().toISOString();

  return `// Auto-generated screencast recording script
// Feature: ${featureName}
// Generated: ${timestamp}

const { chromium } = require('playwright');
const { rename, mkdir } = require('fs/promises');
const { homedir } = require('os');
const { join } = require('path');

const outputDir = join(homedir(), 'Desktop/playwright-screencasts');
const featureName = '${featureName}';
const baseUrl = '${baseUrl}';

// Collect console errors
const consoleErrors = [];

(async () => {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location(),
        type: 'error'
      });
    }
  });

  // Listen for page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    consoleErrors.push({
      text: error.message,
      stack: error.stack,
      type: 'pageerror'
    });
  });

  try {
    // Initial navigation
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Generated navigation steps
${stepsWithPacing}

    // Final frame pause
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message, consoleErrors }));
  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(outputDir, \`\${featureName}-\${timestamp}.webm\`);
      await rename(videoPath, newPath);
      console.log(JSON.stringify({ success: true, videoPath: newPath, consoleErrors }));
    } else {
      console.log(JSON.stringify({ success: false, error: 'No video path', consoleErrors }));
    }
  }
})();
`;
}

export interface ConsoleError {
  text: string;
  location?: { url: string; lineNumber: number; columnNumber: number };
  stack?: string;
  type: "error" | "pageerror";
}

export interface RecordingResult {
  success: boolean;
  videoPath?: string;
  error?: string;
  consoleErrors?: ConsoleError[];
}

/**
 * Check if a URL is reachable
 */
export async function checkDevServer(
  url: string = "http://localhost:3000"
): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Execute a recording script and return the video path and console errors
 */
export async function executeRecording(
  script: string
): Promise<RecordingResult> {
  const tempPath = `/tmp/screencast-${Date.now()}.mjs`;

  try {
    // Write script to temp file
    await writeFile(tempPath, script, "utf-8");

    // Execute script
    const { stdout } = await execAsync(`node ${tempPath}`, {
      timeout: 120000, // 2 minute timeout
      cwd: process.cwd(),
    });

    // Parse result from stdout (last line should be JSON)
    const lines = stdout.trim().split("\n");
    const lastLine = lines[lines.length - 1];

    try {
      const result = JSON.parse(lastLine);
      return result;
    } catch {
      return {
        success: false,
        error: `Failed to parse output: ${lastLine}`,
        consoleErrors: [],
      };
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during recording";
    return {
      success: false,
      error: errorMessage,
      consoleErrors: [],
    };
  } finally {
    // Cleanup temp file
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
