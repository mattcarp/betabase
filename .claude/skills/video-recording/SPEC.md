Video Recording Skill - One-Page Spec

## Purpose
Record video walkthroughs of the app for documentation, demos, and visual QA. Runs in **headed mode** (visible browser window) so you can watch it execute in real-time.

## Core Configuration

```typescript
// Browser: Chrome, Headed, with Video
const browser = await chromium.launch({
  channel: 'chrome',
  headless: false  // HEADED - visible browser window
});

// Default output directory (expandable)
const outputDir = '~/Desktop/playwright-screencasts';

const context = await browser.newContext({
  recordVideo: {
    dir: outputDir,
    size: { width: 1920, height: 1080 }  // Full HD
  }
});
```

## Key Behavior

| Setting | Value | Why |
|---------|-------|-----|
| Browser | Chrome | Playwright 1.57+ uses Chrome for Testing |
| Mode | Headed | User can watch execution live |
| Video Format | `.webm` | Native Playwright output (YouTube-compatible) |
| Resolution | 1920x1080 | Full HD |
| Output Directory | `~/Desktop/playwright-screencasts` | Default, user can override |

## Output Directory

- **Default:** `~/Desktop/playwright-screencasts`
- **Changeable:** User can specify custom path via skill invocation
- **Auto-create:** Skill should create directory if it doesn't exist

```bash
mkdir -p ~/Desktop/playwright-screencasts
```

## Video File Naming

Playwright generates random hashes (e.g., `a1b2c3d4e5f6.webm`). Rename after recording:

```typescript
await context.close();
const videoPath = await page.video()?.path();

// Rename to meaningful name with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const newPath = `${outputDir}/test-tab-walkthrough-${timestamp}.webm`;
fs.renameSync(videoPath, newPath);
```

**Naming convention:** `[feature-name]-[timestamp].webm`

## Workflow

1. **Create output directory** if it doesn't exist
2. **Launch headed Chrome** with video recording enabled
3. **Navigate to target URL** (localhost:3000)
4. **Execute navigation sequence** - click tabs, interact with UI
5. **Add deliberate pauses** (`page.waitForTimeout(1500)`) so video isn't too fast
6. **Close context** - triggers video file save
7. **Rename video file** to descriptive name
8. **Report video path** to user

## Example Skill Trigger Phrases

- "Record a video of the test tab"
- "Make a screencast of the curate workflow"  
- "Video walkthrough of the dashboard"
- "Record the test tab to ~/Videos/demo.webm" (custom path)

## Pacing Tips

Add pauses so the video is watchable:
```typescript
await page.click('button:has-text("Test")');
await page.waitForTimeout(1500);  // Let viewer see the result
await page.click('button:has-text("Self-Healing")');
await page.waitForTimeout(1500);
```

## Scope for V1

1. Single video per recording session
2. Fixed 1080p resolution
3. WebM output (YouTube-ready, convert for Premiere Pro)
4. Auto-rename with timestamp
5. Headed mode only (user watches live)
6. Default output: `~/Desktop/playwright-screencasts`
7. Custom output path supported

Future: Add narration timestamps, auto-convert to MP4, variable pacing, GIF export.
