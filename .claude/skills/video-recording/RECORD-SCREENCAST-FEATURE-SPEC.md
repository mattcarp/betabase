# Record Screencast Feature - SPEC

**Location:** Test Tab > Dashboard > AI Generate Panel
**Status:** Spec
**Author:** Matt Carpenter
**Date:** 2025-12-20

---

## Overview

Add a "Record screencast" checkbox to the AI Generate panel's Advanced Options. When enabled, the generated Playwright code executes in a visible browser window with video recording, producing a `.webm` screencast of the automated workflow.

## Problem Statement

Currently, creating demo videos or visual documentation requires:
1. Manually writing Playwright scripts with video config
2. Running scripts from command line
3. Managing output files manually

The AI Generate feature already produces Playwright navigation code from natural language. Adding a recording option leverages this existing capability to produce video output with zero additional scripting.

## User Flow

```
1. User navigates to: Test > Dashboard > AI Generate
2. User types description OR clicks a Quick Suggestion pill
   Example: "Navigate through the self-healing test workflow"
3. User checks "Record screencast" in Advanced Options
4. User clicks "Generate & Record" button
5. Chrome opens (visible window), executes the steps
6. Video saves to ~/Desktop/playwright-screencasts/
7. Toast notification shows file path
```

## UI Changes

### Advanced Options Panel

**Current state:**
```
Advanced Options
[x] Include assertions
[x] Add error handling
[ ] Generate test data
[ ] Include performance metrics
```

**New state:**
```
Advanced Options
[x] Include assertions
[x] Add error handling
[ ] Generate test data
[ ] Include performance metrics
─────────────────────────────
[ ] Record screencast
    Resolution: 1920x1080
    Output: ~/Desktop/playwright-screencasts/
```

### Button State Change

| Screencast Unchecked | Screencast Checked |
|---------------------|-------------------|
| "Generate Automated Test" | "Generate & Record" |
| Shows code in preview | Executes + records video |
| Purple gradient | Purple gradient + video icon |

### Recording Indicator

When recording is in progress:
- Button becomes disabled with spinner
- Status text: "Recording... (Chrome window open)"
- Cancel button appears

## Technical Implementation

### 1. State Addition

```typescript
// In AI Generate panel state
interface AIGenerateOptions {
  includeAssertions: boolean;
  addErrorHandling: boolean;
  generateTestData: boolean;
  includePerformanceMetrics: boolean;
  recordScreencast: boolean;  // NEW
}
```

### 2. Code Transformation

When `recordScreencast` is enabled, transform generated code:

**Standard output (test):**
```typescript
test('self-healing workflow', async ({ page }) => {
  await page.goto('/test');
  await page.click('button[data-tab="test"]');
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.click('[value="self-healing"]');
  await expect(page.locator('.self-healing-panel')).toBeVisible();
});
```

**Recording output:**
```typescript
// Auto-generated screencast script
const { chromium } = require('playwright');
const { rename, mkdir } = require('fs/promises');
const { homedir } = require('os');
const { join } = require('path');

const outputDir = join(homedir(), 'Desktop/playwright-screencasts');
const featureName = 'self-healing-workflow';

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
    // Generated navigation steps with pacing
    await page.goto('http://localhost:3000/test');
    await page.waitForTimeout(1500);

    await page.click('button[data-tab="test"]');
    await page.waitForTimeout(1500);

    await page.click('[value="self-healing"]');
    await page.waitForTimeout(2000);

    // Final frame pause
    await page.waitForTimeout(2000);

  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(outputDir, `${featureName}-${timestamp}.webm`);
      await rename(videoPath, newPath);
      return newPath;
    }
  }
})();
```

### 3. Execution Handler

```typescript
// New function in AI Generate logic
async function executeScreencastRecording(
  generatedSteps: string[],
  featureName: string
): Promise<{ success: boolean; videoPath?: string; error?: string }> {

  // 1. Generate recording script from steps
  const script = transformToRecordingScript(generatedSteps, featureName);

  // 2. Write to temp file
  const tempScriptPath = `/tmp/screencast-${Date.now()}.mjs`;
  await writeFile(tempScriptPath, script);

  // 3. Execute script
  const result = await exec(`node ${tempScriptPath}`);

  // 4. Parse output for video path
  const videoPath = parseVideoPath(result.stdout);

  // 5. Cleanup temp script
  await unlink(tempScriptPath);

  return { success: true, videoPath };
}
```

### 4. Toast Notification

```typescript
// On successful recording
toast({
  title: "Screencast recorded",
  description: `Saved to ${videoPath}`,
  action: (
    <ToastAction onClick={() => openInFinder(videoPath)}>
      Show in Finder
    </ToastAction>
  ),
});
```

## Configuration Options (Future)

For V1, use sensible defaults. Future versions could expose:

| Option | V1 Default | Future Configurable |
|--------|------------|---------------------|
| Resolution | 1920x1080 | Dropdown: 720p, 1080p, 4K |
| Output directory | ~/Desktop/playwright-screencasts | File picker |
| Pacing (slowMo) | 50ms | Slider: 0-200ms |
| Step pause | 1500ms | Slider: 500-3000ms |
| Browser | Chrome | Dropdown: Chrome, Edge, Firefox |

## Edge Cases

### Dev Server Not Running
- Check `localhost:3000` before recording
- If down, show error: "Dev server not running. Start with `npm run dev`"

### Recording Fails Mid-Execution
- Ensure `context.close()` is called in finally block
- Partial video should still be saved
- Show warning toast with partial file path

### User Cancels Recording
- Kill browser process
- Delete partial video file
- Reset button state

### Chrome Not Installed
- Playwright's `channel: 'chrome'` requires Chrome
- Fallback to `channel: 'chromium'` with warning
- Or show error: "Chrome required for screencast recording"

## File Structure

```
~/Desktop/playwright-screencasts/
├── self-healing-workflow-2025-12-20T14-30-00.webm
├── chat-demo-2025-12-20T14-35-00.webm
├── curate-feedback-flow-2025-12-20T14-40-00.webm
└── ...
```

**Naming convention:** `[kebab-case-description]-[ISO-timestamp].webm`

## Success Metrics

- User can generate a screencast in under 30 seconds
- Video plays correctly in QuickTime, VLC, and YouTube upload
- No manual script editing required
- Works on first try for standard workflows

## Dependencies

- Playwright 1.57+ (already installed)
- Chrome browser (standard on most dev machines)
- Node.js for script execution

## Out of Scope (V1)

- Audio/voiceover recording
- Video editing/trimming in UI
- Direct YouTube upload
- Multiple browser recording
- Mobile device emulation recording
- Parallel recording of multiple flows

## Implementation Checklist

- [ ] Add `recordScreencast` to AIGenerateOptions state
- [ ] Add checkbox to Advanced Options UI
- [ ] Add conditional button text/icon
- [ ] Implement `transformToRecordingScript()` function
- [ ] Implement `executeScreencastRecording()` function
- [ ] Add recording progress indicator
- [ ] Add cancel recording functionality
- [ ] Add success toast with "Show in Finder" action
- [ ] Add error handling for common failures
- [ ] Test on macOS (primary target)
- [ ] Update AI Generate panel tests

## Related Files

```
src/components/test-dashboard/ai-generate-panel.tsx  # Main UI
src/lib/playwright/recording.ts                       # New: recording logic
scripts/record-video.mjs                              # Reference implementation
.claude/skills/video-recording/SKILL.md               # Skill documentation
```

---

## Approval

- [ ] UX Review
- [ ] Technical Review
- [ ] Ready for Implementation
