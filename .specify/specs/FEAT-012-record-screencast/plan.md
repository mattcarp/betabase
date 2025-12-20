# Technical Plan: FEAT-012 Record Screencast

## Approach

Extend the existing AI Generate panel to support video recording mode. When the checkbox is enabled, transform the generated test code into a recording script and execute it instead of displaying it.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ AI Generate Panel                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ User Input / Quick Suggestion                       │ │
│ └─────────────────────────────────────────────────────┘ │
│                        │                                 │
│                        ▼                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ AI Code Generation (existing)                       │ │
│ │ - Generates Playwright navigation steps             │ │
│ └─────────────────────────────────────────────────────┘ │
│                        │                                 │
│          ┌─────────────┴─────────────┐                  │
│          ▼                           ▼                   │
│   [recordScreencast: false]   [recordScreencast: true]  │
│          │                           │                   │
│          ▼                           ▼                   │
│   Display code preview        Transform to recording     │
│   (current behavior)          script + execute           │
│                                      │                   │
│                                      ▼                   │
│                               Save .webm file            │
│                               Show toast notification    │
└─────────────────────────────────────────────────────────┘
```

## Files to Modify

### UI Components
- `src/components/test-dashboard/ai-generate-panel.tsx`
  - Add checkbox to Advanced Options
  - Add conditional button text/icon
  - Add recording state and progress indicator
  - Add cancel button during recording

### New Files
- `src/lib/playwright/screencast-recorder.ts`
  - `transformToRecordingScript(steps, featureName)` - Wraps steps in recording context
  - `executeRecording(script)` - Runs the script and returns video path
  - `generateFeatureName(description)` - Kebab-cases the description

### API Route (if needed for server-side execution)
- `src/app/api/screencast/record/route.ts`
  - POST endpoint to execute recording script
  - Returns video path on success

## Code Transformation Logic

**Input (Generated Test Code):**
```typescript
await page.goto('/test');
await page.click('button[data-tab="test"]');
await expect(page.locator('.dashboard')).toBeVisible();
await page.click('[value="self-healing"]');
```

**Output (Recording Script):**
```typescript
const { chromium } = require('playwright');
const { rename, mkdir } = require('fs/promises');
const { homedir } = require('os');
const { join } = require('path');

const outputDir = join(homedir(), 'Desktop/playwright-screencasts');
const featureName = 'test-self-healing-workflow';

(async () => {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: outputDir, size: { width: 1920, height: 1080 } }
  });

  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000/test');
    await page.waitForTimeout(1500);

    await page.click('button[data-tab="test"]');
    await page.waitForTimeout(1500);

    await page.click('[value="self-healing"]');
    await page.waitForTimeout(2000);

    await page.waitForTimeout(2000); // Final frame
  } finally {
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(outputDir, `${featureName}-${timestamp}.webm`);
      await rename(videoPath, newPath);
      console.log(JSON.stringify({ success: true, videoPath: newPath }));
    }
  }
})();
```

## State Management

```typescript
interface AIGeneratePanelState {
  // Existing
  description: string;
  generatedCode: string;
  isGenerating: boolean;
  options: {
    includeAssertions: boolean;
    addErrorHandling: boolean;
    generateTestData: boolean;
    includePerformanceMetrics: boolean;
  };

  // New
  recordScreencast: boolean;
  isRecording: boolean;
  recordingProgress: string; // "Launching browser...", "Recording...", etc.
  lastVideoPath: string | null;
}
```

## Dependencies

- Playwright 1.57+ (already installed)
- Chrome browser (standard dev machine)
- fs/promises, os, path (Node.js built-ins)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Dev server not running | Check localhost:3000 before starting, show error if down |
| Chrome not installed | Fallback to chromium channel with warning |
| Recording fails mid-execution | finally block ensures context.close(), partial video saved |
| Long-running recordings | Add timeout (60s default), show progress |
| User closes browser manually | Detect process exit, cleanup gracefully |

## Testing Strategy

1. Unit tests for `transformToRecordingScript()` - verify code transformation
2. Integration test - mock execution, verify file path returned
3. E2E test - actually record a simple flow, verify .webm exists and plays
