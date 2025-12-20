# Tasks: FEAT-012 Record Screencast

**CRITICAL: Test after EVERY task. Do not proceed to the next task until the current one is verified working.**

---

## Task 1: Add Checkbox to UI

**Goal:** Add "Record screencast" checkbox to AI Generate panel's Advanced Options.

**Steps:**
1. Locate `src/components/test-dashboard/AITestGenerator.tsx`
2. Add `Video` icon import from lucide-react
3. Add `recordScreencast` state: `const [recordScreencast, setRecordScreencast] = useState(false);`
4. Add checkbox below existing Advanced Options with a visual separator
5. Style consistently with existing checkboxes (MAC Design System)

**Code to add in Advanced Options section:**
```tsx
{/* Separator */}
<div className="border-t border-border my-3" />

{/* Record Screencast Option */}
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    className="rounded"
    checked={recordScreencast}
    onChange={(e) => setRecordScreencast(e.target.checked)}
  />
  <Video className="h-4 w-4 text-muted-foreground" />
  Record screencast
</label>
{recordScreencast && (
  <div className="ml-6 text-xs text-muted-foreground space-y-1">
    <div>Resolution: 1920x1080</div>
    <div>Output: ~/Desktop/playwright-screencasts/</div>
  </div>
)}
```

**TEST CHECKPOINT:**
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to http://localhost:3000/#test
# 3. Click "AI Generate" subtab
# 4. Scroll to Advanced Options
# 5. VERIFY: New checkbox "Record screencast" appears with Video icon
# 6. VERIFY: Checkbox toggles on/off
# 7. VERIFY: When checked, resolution/output info appears below
# 8. VERIFY: No console errors

# 9. Type check
npm run type-check

# 10. Lint check
npm run lint:quick
```

**Exit Criteria:** Checkbox visible, toggles correctly, no errors.

---

## Task 2: Conditional Button Behavior

**Goal:** Change button text and icon when recordScreencast is checked.

**Steps:**
1. Modify the Generate button to show different text based on `recordScreencast` state
2. Add Video icon when recording mode is enabled
3. Keep existing Wand2 icon when recording mode is disabled

**Code change for button:**
```tsx
<Button
  className="w-full mac-button mac-button-primary"
  size="lg"
  onClick={handleGenerate}
  disabled={!prompt || isGenerating}
>
  {isGenerating ? (
    <>
      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
      {recordScreencast ? "Recording..." : "Generating..."}
    </>
  ) : (
    <>
      {recordScreencast ? (
        <Video className="h-4 w-4 mr-2" />
      ) : (
        <Wand2 className="h-4 w-4 mr-2" />
      )}
      {recordScreencast ? "Generate & Record" : "Generate Automated Test"}
    </>
  )}
</Button>
```

**TEST CHECKPOINT:**
```bash
# 1. Refresh browser at http://localhost:3000/#test > AI Generate
# 2. VERIFY: Button says "Generate Automated Test" with wand icon
# 3. Check the "Record screencast" checkbox
# 4. VERIFY: Button changes to "Generate & Record" with video icon
# 5. Uncheck the checkbox
# 6. VERIFY: Button reverts to original text and icon
# 7. VERIFY: No console errors
# 8. VERIFY: No visual flickering during toggle

npm run type-check
npm run lint:quick
```

**Exit Criteria:** Button text and icon change correctly based on checkbox state.

---

## Task 3: Create Recording Script Transformer

**Goal:** Build the function that transforms generated test code into a recording script.

**Steps:**
1. Create new file: `src/lib/playwright/screencast-recorder.ts`
2. Implement `generateFeatureName(description: string): string`
3. Implement `transformToRecordingScript(steps: string[], featureName: string): string`
4. Export both functions

**File content:**
```typescript
// src/lib/playwright/screencast-recorder.ts

/**
 * Convert a description to a kebab-case filename
 */
export function generateFeatureName(description: string): string {
  return description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .slice(0, 50)                  // Limit length
    .replace(/^-|-$/g, '');        // Trim leading/trailing hyphens
}

/**
 * Transform Playwright test steps into a recording script
 */
export function transformToRecordingScript(
  steps: string[],
  featureName: string,
  baseUrl: string = 'http://localhost:3000'
): string {
  const stepsWithPacing = steps
    .map(step => {
      // Add waitForTimeout after each action step
      const indentedStep = `    ${step}`;
      if (step.includes('click') || step.includes('fill') || step.includes('goto')) {
        return `${indentedStep}\n    await page.waitForTimeout(1500);`;
      }
      return indentedStep;
    })
    .join('\n\n');

  return `// Auto-generated screencast recording script
// Feature: ${featureName}
// Generated: ${new Date().toISOString()}

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
```

**TEST CHECKPOINT:**
```bash
# 1. Create a simple test file to verify the functions work
cat > /tmp/test-transformer.mjs << 'EOF'
import { generateFeatureName, transformToRecordingScript } from './src/lib/playwright/screencast-recorder.ts';

// Test generateFeatureName
console.log('Testing generateFeatureName:');
console.log(generateFeatureName('Test the login flow!!')); // Expected: test-the-login-flow
console.log(generateFeatureName('Navigate to   dashboard')); // Expected: navigate-to-dashboard

// Test transformToRecordingScript
console.log('\nTesting transformToRecordingScript:');
const steps = [
  "await page.click('button[data-tab=\"test\"]');",
  "await page.fill('input', 'hello');"
];
const script = transformToRecordingScript(steps, 'test-demo');
console.log(script.substring(0, 500) + '...');
EOF

# 2. Run with tsx
npx tsx /tmp/test-transformer.mjs

# 3. Type check
npm run type-check

# 4. Verify file exists
ls -la src/lib/playwright/screencast-recorder.ts
```

**Exit Criteria:** Both functions work correctly, type-check passes.

---

## Task 4: Create Recording Executor

**Goal:** Build the function that executes the recording script and returns the video path.

**Steps:**
1. Add `executeRecording` function to `src/lib/playwright/screencast-recorder.ts`
2. Write script to temp file
3. Execute with Node.js child_process
4. Parse JSON output for result
5. Clean up temp file

**Add to screencast-recorder.ts:**
```typescript
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RecordingResult {
  success: boolean;
  videoPath?: string;
  error?: string;
}

/**
 * Execute a recording script and return the video path
 */
export async function executeRecording(script: string): Promise<RecordingResult> {
  const tempPath = `/tmp/screencast-${Date.now()}.mjs`;

  try {
    // Write script to temp file
    await writeFile(tempPath, script, 'utf-8');

    // Execute script
    const { stdout, stderr } = await execAsync(`node ${tempPath}`, {
      timeout: 120000, // 2 minute timeout
      cwd: process.cwd(),
    });

    // Parse result from stdout (last line should be JSON)
    const lines = stdout.trim().split('\n');
    const lastLine = lines[lines.length - 1];

    try {
      const result = JSON.parse(lastLine);
      return result;
    } catch {
      return {
        success: false,
        error: `Failed to parse output: ${lastLine}`
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error during recording'
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
```

**TEST CHECKPOINT:**
```bash
# 1. Type check first
npm run type-check

# 2. Create a minimal test recording (without full UI)
cat > /tmp/test-executor.mjs << 'EOF'
import { transformToRecordingScript, executeRecording, generateFeatureName } from './src/lib/playwright/screencast-recorder.ts';

async function test() {
  console.log('Testing executor...');

  // Generate a simple script that just loads the page
  const steps = [];
  const script = transformToRecordingScript(steps, 'executor-test');

  console.log('Executing recording (Chrome will open)...');
  const result = await executeRecording(script);

  console.log('Result:', result);

  if (result.success && result.videoPath) {
    console.log('SUCCESS! Video at:', result.videoPath);
  } else {
    console.log('FAILED:', result.error);
  }
}

test();
EOF

# 3. Make sure dev server is running
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 4. Run the test (Chrome should open briefly)
npx tsx /tmp/test-executor.mjs

# 5. Check that video file was created
ls -la ~/Desktop/playwright-screencasts/executor-test-*.webm
```

**Exit Criteria:** Executor creates video file, returns correct path.

---

## Task 5: Wire Up Recording Flow in UI

**Goal:** Connect the UI to the recording execution logic.

**Steps:**
1. Import the recording functions in AITestGenerator.tsx
2. Add `isRecording` state
3. Modify `handleGenerate` to branch based on `recordScreencast`
4. Extract navigation steps from the generated code
5. Call transformer and executor when recording

**Add imports:**
```typescript
import {
  generateFeatureName,
  transformToRecordingScript,
  executeRecording
} from '../../lib/playwright/screencast-recorder';
```

**Add state:**
```typescript
const [isRecording, setIsRecording] = useState(false);
const [lastVideoPath, setLastVideoPath] = useState<string | null>(null);
```

**Modify handleGenerate:**
```typescript
const handleGenerate = async () => {
  if (recordScreencast) {
    // Recording mode
    setIsRecording(true);

    try {
      // Generate navigation steps from prompt
      const steps = [
        `await page.goto('http://localhost:3000');`,
        // In real implementation, these would be AI-generated from prompt
      ];

      const featureName = generateFeatureName(prompt);
      const script = transformToRecordingScript(steps, featureName);
      const result = await executeRecording(script);

      if (result.success && result.videoPath) {
        setLastVideoPath(result.videoPath);
        // Toast will be added in Task 7
        console.log('Recording saved:', result.videoPath);
      } else {
        console.error('Recording failed:', result.error);
      }
    } catch (error) {
      console.error('Recording error:', error);
    } finally {
      setIsRecording(false);
    }
  } else {
    // Original test generation mode
    setIsGenerating(true);
    // ... existing code ...
  }
};
```

**TEST CHECKPOINT:**
```bash
# 1. Refresh browser
# 2. Type a prompt: "Test the dashboard"
# 3. Check "Record screencast" checkbox
# 4. Click "Generate & Record"
# 5. VERIFY: Chrome opens in visible window
# 6. VERIFY: Button shows "Recording..." state
# 7. VERIFY: Video file created in ~/Desktop/playwright-screencasts/
# 8. VERIFY: Console shows "Recording saved: [path]"
# 9. VERIFY: Button returns to normal after completion
# 10. VERIFY: No console errors

ls -la ~/Desktop/playwright-screencasts/

npm run type-check
```

**Exit Criteria:** Full flow works end-to-end, video file created.

---

## Task 6: Add Cancel and Error Handling

**Goal:** Allow cancellation and handle all error cases.

**Steps:**
1. Add abort controller for cancellation
2. Add pre-flight check for dev server
3. Show appropriate error messages
4. Add cancel button during recording

**Add to screencast-recorder.ts:**
```typescript
export async function checkDevServer(url: string = 'http://localhost:3000'): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
```

**Update UI for cancel button:**
```tsx
{isRecording && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => {
      // Cancel logic
      setIsRecording(false);
    }}
    className="mt-2"
  >
    Cancel Recording
  </Button>
)}
```

**Add server check before recording:**
```typescript
// In handleGenerate, before starting recording
const serverRunning = await checkDevServer();
if (!serverRunning) {
  alert('Dev server not running. Start with: npm run dev');
  return;
}
```

**TEST CHECKPOINT:**
```bash
# Test 1: Server not running
# 1. Stop dev server (Ctrl+C or npx kill-port 3000)
# 2. Try to record
# 3. VERIFY: Error message appears about server not running

# Test 2: Server running
# 1. Start dev server: npm run dev
# 2. Try to record
# 3. VERIFY: Recording starts successfully

# Test 3: Cancel (if implemented)
# 1. Start a recording
# 2. Click cancel
# 3. VERIFY: Recording stops, UI resets

npm run type-check
```

**Exit Criteria:** Error handling works, cancel works (if implemented).

---

## Task 7: Add Toast with "Show in Finder" Action

**Goal:** Show success notification with action to reveal file.

**Steps:**
1. Import toast from existing UI components
2. Show toast after successful recording
3. Add "Show in Finder" action that opens the directory

**Add toast import and usage:**
```typescript
import { useToast } from '../ui/use-toast';

// In component
const { toast } = useToast();

// After successful recording
if (result.success && result.videoPath) {
  setLastVideoPath(result.videoPath);
  toast({
    title: "Screencast recorded",
    description: result.videoPath.split('/').pop(),
    action: (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          // Open in Finder (macOS)
          window.open(`file://${result.videoPath.replace(/\/[^/]+$/, '')}`);
        }}
      >
        Show in Finder
      </Button>
    ),
  });
}
```

**TEST CHECKPOINT:**
```bash
# 1. Start dev server
# 2. Type prompt, check "Record screencast", click "Generate & Record"
# 3. Wait for recording to complete
# 4. VERIFY: Toast appears with "Screencast recorded" title
# 5. VERIFY: Toast shows filename
# 6. VERIFY: "Show in Finder" button appears in toast
# 7. Click "Show in Finder"
# 8. VERIFY: Finder opens to ~/Desktop/playwright-screencasts/
# 9. VERIFY: Video file is visible in Finder

npm run type-check
```

**Exit Criteria:** Toast appears, Show in Finder works.

---

## Task 8: Final Testing and Cleanup

**Goal:** Comprehensive testing and documentation.

**Steps:**
1. Run full test suite
2. Test all edge cases
3. Update features.json to mark complete
4. Commit changes

**TEST CHECKLIST:**

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint:quick

# 3. Full manual test flow
echo "Manual Test Checklist:"
echo "[ ] Checkbox appears in Advanced Options"
echo "[ ] Checkbox toggles correctly"
echo "[ ] Button text changes with checkbox"
echo "[ ] Recording works end-to-end"
echo "[ ] Video file is created"
echo "[ ] Toast notification appears"
echo "[ ] Show in Finder works"
echo "[ ] Error shown when server is down"
echo "[ ] No console errors throughout"

# 4. Verify video plays correctly
open ~/Desktop/playwright-screencasts/*.webm

# 5. Check for any regressions in AI Generate
echo "[ ] Original 'Generate Automated Test' still works"
echo "[ ] Generated tests still display correctly"
echo "[ ] No visual regressions"
```

**Update features.json:**
```json
{
  "id": "F013",
  "passes": true,
  "completedAt": "[current ISO timestamp]"
}
```

**Commit:**
```bash
git acm "feat(test): add Record Screencast checkbox to AI Generate panel (F013)"
npm version patch
git push origin main
```

**Exit Criteria:** All tests pass, feature marked complete, committed and pushed.

---

## Summary

| Task | Description | Key Test |
|------|-------------|----------|
| 1 | Add checkbox to UI | Checkbox visible and toggles |
| 2 | Conditional button behavior | Button text/icon changes |
| 3 | Create recording script transformer | Functions return correct output |
| 4 | Create recording executor | Video file created |
| 5 | Wire up recording flow | Full flow works E2E |
| 6 | Cancel and error handling | Errors shown, cancel works |
| 7 | Toast with "Show in Finder" | Toast appears, Finder opens |
| 8 | Final testing and cleanup | All checks pass |

**REMEMBER: Do not proceed to the next task until the current task's tests pass!**
