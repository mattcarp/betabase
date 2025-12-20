---
name: video-recording
description: Record video walkthroughs of the app for documentation, demos, and visual QA. Runs in headed mode (visible browser window) so you can watch execution in real-time. Use this skill when the user asks to "record a video", "make a screencast", "video walkthrough", "capture video of", or similar phrases. Outputs YouTube-ready WebM files.
allowed-tools: Bash(mkdir:*), Bash(mv:*), Bash(ls:*), Bash(date:*), Bash(sleep:*), Bash(curl:*), Bash(open:*), Bash(npx:*), Bash(node:*), Bash(git:*), Bash(kill:*), Bash(lsof:*), Bash(npx kill-port:*), Read, Write, Glob
---

# Video Recording Skill

Record video walkthroughs of the SIAM application for demos, documentation, and visual QA.

## Browser Configuration

**CRITICAL: Video recording requires these EXACT settings:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Browser** | Chrome | Playwright 1.57+ uses Chrome for Testing builds |
| **Mode** | Headed (`headless: false`) | User watches execution live |
| **Video Format** | WebM | Native Playwright output, YouTube-compatible |
| **Resolution** | 1920x1080 | Full HD, standard for demos |
| **Output Dir** | `~/Desktop/playwright-screencasts` | Default, user can override |

## When to Use This Skill

- User asks to "record a video" of the app
- User wants a "screencast" or "video walkthrough"
- User asks to "capture video of" a feature
- User wants to demo functionality for documentation
- User needs a visual QA recording

## Workflow

### 1. Setup Output Directory

```bash
mkdir -p ~/Desktop/playwright-screencasts
```

### 2. Create Recording Script

Write a Node.js script to `./scripts/record-video.mjs`:

```javascript
import { chromium } from 'playwright';
import { rename } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const outputDir = process.env.OUTPUT_DIR || join(homedir(), 'Desktop/playwright-screencasts');
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
const featureName = process.env.FEATURE_NAME || 'recording';

async function record() {
  // Create output directory
  await import('fs').then(fs => fs.promises.mkdir(outputDir, { recursive: true }));

  // Launch Chrome in HEADED mode with video recording
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,  // HEADED - visible browser window
    slowMo: 50,       // Slight slowdown for watchable pacing
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
    // Navigate to app
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    // === YOUR NAVIGATION SEQUENCE HERE ===
    // Example: Click tabs, interact with UI
    // Add deliberate pauses for watchability

    await page.waitForTimeout(2000); // Initial pause

    // ... navigation actions ...

    await page.waitForTimeout(2000); // Final pause

  } finally {
    // Get video path BEFORE closing
    const videoPath = await page.video()?.path();

    // Close context to finalize video
    await context.close();
    await browser.close();

    // Rename to meaningful filename
    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(outputDir, `${featureName}-${timestamp}.webm`);
      await rename(videoPath, newPath);
      console.log(`Video saved: ${newPath}`);
      return newPath;
    }
  }
}

record().catch(console.error);
```

### 3. Run Recording

```bash
# Ensure dev server is running
npx kill-port 3000 && npm run dev &
sleep 8

# Run recording script
FEATURE_NAME="test-tab-walkthrough" node ./scripts/record-video.mjs

# Or with custom output directory
OUTPUT_DIR="/path/to/custom" FEATURE_NAME="demo" node ./scripts/record-video.mjs
```

### 4. Report Result

After recording completes, report the video path to the user:

```
Video saved: ~/Desktop/playwright-screencasts/test-tab-walkthrough-2025-01-15T10-30-00.webm
```

## Navigation Patterns

When recording app features, use these navigation patterns with appropriate pauses:

### Main Tab Recording

```javascript
// Click a main tab and wait for content
await page.click('button[data-tab="test"]');
await page.waitForTimeout(1500);  // Let viewer see the result
```

### Subtab Recording

```javascript
// Navigate through subtabs
const subtabs = ['home', 'self-healing', 'historical', 'unified'];
for (const tab of subtabs) {
  await page.click(`[role="tablist"] button[value="${tab}"]`);
  await page.waitForTimeout(1500);
}
```

### Interactive Elements

```javascript
// Hover to reveal tooltips
await page.hover('button[aria-label="Settings"]');
await page.waitForTimeout(1000);

// Open modals/dialogs
await page.click('button:has-text("Open")');
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
```

## Pacing Guidelines

| Action Type | Wait Time | Why |
|-------------|-----------|-----|
| Page load | 2000ms | Let full content render |
| Tab click | 1500ms | Show result clearly |
| Hover/tooltip | 1000ms | Reveal hover state |
| Modal open | 2000ms | Read content |
| Form input | 500ms per field | Show typing |
| Final frame | 2000ms | Clean ending |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:3000` | App URL to record |
| `OUTPUT_DIR` | `~/Desktop/playwright-screencasts` | Where to save videos |
| `FEATURE_NAME` | `recording` | Prefix for filename |

## Example Usage

**Basic recording:**
- "Record a video of the test tab"
- "Make a screencast of the curate workflow"

**With custom output:**
- "Record the test tab to ~/Videos/demo.webm"
- "Video walkthrough of the dashboard, save to /tmp/recordings"

**Specific features:**
- "Record the self-healing test flow"
- "Make a video of the introspection feature"

## Output

- **Format**: WebM (VP8/VP9 codec)
- **Resolution**: 1920x1080 (Full HD)
- **Compatible with**: YouTube, Google Drive, Vimeo
- **Convert for Premiere Pro**: `ffmpeg -i input.webm -c:v prores_ks output.mov`

## Troubleshooting

### Video file is empty or corrupt
- Ensure `context.close()` is called (not just `browser.close()`)
- Check that the recording directory exists and is writable

### Browser window doesn't appear
- Verify `headless: false` is set
- Check that Chrome is installed (`channel: 'chrome'`)

### Video is too fast
- Increase `slowMo` value in launch options
- Add more `waitForTimeout` calls between actions

### Video path is undefined
- Call `page.video()?.path()` BEFORE closing context
- The video object is only available if `recordVideo` was configured
