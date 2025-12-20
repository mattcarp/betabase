// src/lib/playwright/screencast-recorder.ts
// Screencast recording utilities for AI Test Generator

import { exec } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { promisify } from "util";

const execAsync = promisify(exec);

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
 * Transform Playwright test steps into a recording script
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

  try {
    // Initial navigation
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Generated navigation steps
${stepsWithPacing}

    // Final frame pause
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error(JSON.stringify({ success: false, error: error.message }));
  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(outputDir, \`\${featureName}-\${timestamp}.webm\`);
      await rename(videoPath, newPath);
      console.log(JSON.stringify({ success: true, videoPath: newPath }));
    } else {
      console.log(JSON.stringify({ success: false, error: 'No video path' }));
    }
  }
})();
`;
}

export interface RecordingResult {
  success: boolean;
  videoPath?: string;
  error?: string;
}

/**
 * Check if the dev server is running
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
 * Execute a recording script and return the video path
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
      };
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during recording";
    return {
      success: false,
      error: errorMessage,
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
