---
name: screenshot-gallery
description: Generate interactive HTML screenshot galleries with click-to-expand lightbox, metadata headers, and error checking. Use this skill when the user asks to create a gallery, document UI work with screenshots, make a visual review page, or capture and display screenshots of features. Understands semantic navigation like "test tab", "curate tab and its subtabs", "the dashboard", etc. Triggers on phrases like "make a gallery", "create a gallery", "screenshot gallery", "visual review", "document the UI", or "gallery of [feature/tab name]".
allowed-tools: Bash(find:*), Bash(ls:*), Bash(mkdir:*), Bash(open:*), Bash(cp:*), Bash(rm:*), Bash(date:*), Bash(git:*), Bash(sleep:*), Bash(curl:*), Read, Write, Glob, mcp__playwright-mcp__*, mcp__browser-tools__*
---

# Screenshot Gallery Skill

Generate an interactive HTML gallery from screenshots with click-to-expand lightbox functionality.

## Browser Configuration

**IMPORTANT: All screenshots use these settings:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| **Browser** | Chrome (not Chromium) | Playwright 1.57+ uses Chrome for Testing builds |
| **Mode** | Headless | Consistent rendering, no window chrome interference |
| **Viewport** | 2880 x 1800 | Full screen resolution, no content cut off |
| **Screenshot Type** | Full Page | Captures entire scrollable content, not just viewport |

When launching the browser or taking screenshots, always use:

```javascript
// Browser launch (if using Playwright directly)
browser = await chromium.launch({
  channel: 'chrome',  // Use Chrome, not Chromium
  headless: true
});

// CRITICAL: Set full screen viewport before any screenshots
const context = await browser.newContext({
  viewport: { width: 2880, height: 1800 }
});

// Screenshot options - ALWAYS use fullPage: true
await page.screenshot({
  path: 'screenshot.png',
  fullPage: true  // Captures entire scrollable page
});
```

For MCP Playwright tools:
- Use `mcp__playwright-mcp__playwright_navigate` with `headless: true`
- **CRITICAL: Always resize to full screen first** using `mcp__playwright-mcp__playwright_resize` with `width: 2880, height: 1800`
- Use `mcp__playwright-mcp__playwright_screenshot` with `fullPage: true`

## When to Use This Skill

- User asks to "make a gallery" or "create a gallery"
- User wants to document UI work with screenshots
- User asks for a "visual review" of features
- User wants to capture and display screenshots of the application
- User specifies a UI area like "the test tab", "curate section", etc.

## App Navigation Map

Use this map to understand what the user wants when they mention tabs or features:

### Main Tabs (Right Sidebar)

| User Says | Tab ID | Selector |
|-----------|--------|----------|
| "chat tab", "chat" | chat | `button[data-tab="chat"]` or click "Chat" in sidebar |
| "hud tab", "hud", "heads up display" | hud | `button[data-tab="hud"]` |
| "test tab", "testing", "tests" | test | `button[data-tab="test"]` |
| "fix tab", "fixes", "bug fixes" | fix | `button[data-tab="fix"]` |
| "curate tab", "curation", "curator" | curate | `button[data-tab="curate"]` |

### Test Tab Subtabs

When user says "test tab and its subtabs" or "all test subtabs", capture ALL of these:

| User Says | Value | Description |
|-----------|-------|-------------|
| "test home", "test dashboard" | home | Main test dashboard overview |
| "self healing", "self-healing tests" | self-healing | Self-healing test viewer |
| "historical tests", "test history" | historical | Historical test explorer |
| "unified results", "results dashboard" | unified | Unified results dashboard |
| "test execution", "run tests" | execution | Test execution panel |
| "test results", "results viewer" | results | Test results viewer |
| "manual testing", "manual tests" | manual | Manual testing panel |
| "ai test generator", "generate tests" | ai-generate | AI test generation |
| "trace viewer", "traces" | trace | Trace viewer |
| "session playback", "playback" | session-playback | Session playback viewer |
| "coverage", "test coverage" | coverage | Coverage report |
| "flaky tests", "flaky" | flaky | Flaky test explorer |
| "test analytics", "analytics" | analytics | Test analytics |

### Navigation Selectors

```javascript
// Main tab buttons (right sidebar)
button:has-text("Chat")
button:has-text("HUD")
button:has-text("Test")
button:has-text("Fix")
button:has-text("Curate")

// Test subtabs (inside Test tab)
[role="tablist"] button[value="home"]
[role="tablist"] button[value="self-healing"]
[role="tablist"] button[value="historical"]
// ... etc
```

## Workflow

### 1. Parse User Request

Identify what the user wants to capture:
- Specific tab? (e.g., "test tab")
- Tab with subtabs? (e.g., "test tab and its subtabs")
- Specific subtab? (e.g., "self-healing tests")
- Specific feature? (e.g., "introspection dropdown")

### 2. Gather Context

```bash
# Get current info
pwd
git branch --show-current
date -u +'%Y-%m-%d %H:%M:%S UTC'
```

### 3. Start Dev Server & Launch Browser

1. Start dev server if not running (`npx kill-port 3000 && npm run dev`)
2. Wait for server to be ready (`sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`)
3. Navigate using `mcp__playwright-mcp__playwright_navigate` with:
   - `url`: `http://localhost:3000`
   - `headless`: `true` (Chrome runs in headless mode)
4. **CRITICAL: Resize to full screen** using `mcp__playwright-mcp__playwright_resize` with `width: 2880, height: 1800`
5. Wait for full page load (`sleep 2`)

### 4. Navigate to Target & Take Screenshots

**Screenshot settings (ALWAYS use these):**
```javascript
{
  fullPage: true,    // Capture entire scrollable content
  name: 'screenshot-name'  // Descriptive name
}
```

**For a main tab:**
1. Click the tab button in the right sidebar
2. Wait for content to load
3. Take full-page screenshot

**For a tab with subtabs (e.g., "test tab and its subtabs"):**
1. Click the main tab
2. For EACH subtab:
   - Click the subtab trigger
   - Wait for content (`sleep 1`)
   - Take full-page screenshot with descriptive name (e.g., `03-test-self-healing`)
3. Continue until all subtabs captured

**Screenshot naming convention:**
- `01-[tab]-overview.png`
- `02-[tab]-[subtab].png`
- `03-[tab]-[subtab].png`
- etc.

### 5. Check for Errors

Before including screenshots:
- Check console for errors: `mcp__playwright-mcp__playwright_console_logs` with `type: "error"`
- Note any failed network requests
- Document any visual issues

### 6. Generate HTML Gallery

Create the gallery at `/tmp/gallery-[sanitized-task-name]/gallery.html`

Use the template from [gallery-template.html](gallery-template.html).

**Required substitutions**:
- `[TASK_NAME]` - The task or feature name
- `[BRANCH]` - Current git branch
- `[TIMESTAMP]` - Generation timestamp
- `[COUNT]` - Number of screenshots
- For each screenshot: `[IMG_SRC]`, `[IMG_TITLE]`, `[IMG_DESCRIPTION]`

**Error handling**:
- If errors found, show the `.errors` div with error content
- If no errors, show the `.no-errors` div

### 7. Open Gallery

```bash
open /tmp/gallery-[name]/gallery.html
```

## Key Features

- **Chrome browser** - Uses Chrome for Testing (Playwright 1.57+), not Chromium
- **Headless mode** - Consistent rendering across environments
- **Full-page screenshots** - Captures entire scrollable content
- **Dark theme** following MAC Design System colors
- **Click-to-expand lightbox** - Pure CSS/JS, no dependencies
- **Metadata header** - Task name, branch, timestamp, screenshot count
- **Responsive grid layout**
- **Error summary section** if any errors found
- **Keyboard support** - Press Escape to close lightbox
- **Smart navigation** - Understands tab names and subtabs

## Example Usage

**Tab-based galleries:**
- "Make a gallery of the test tab" - Screenshots the Test tab overview
- "Gallery of the test tab and its subtabs" - Screenshots ALL 13 test subtabs
- "Create a gallery of the curate tab" - Screenshots the Curate section
- "Visual review of the HUD" - Screenshots the HUD tab

**Feature-based galleries:**
- "Make a gallery of the introspection feature" - Screenshots introspection dropdown/modal
- "Create a visual review of the new dashboard" - Screenshots dashboard components
- "Gallery of the login flow" - Screenshots auth-related screens

**Specific subtabs:**
- "Gallery of the self-healing tests" - Screenshots just the self-healing subtab
- "Make a gallery of test analytics" - Screenshots the analytics subtab
