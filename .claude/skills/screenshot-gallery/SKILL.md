---
name: screenshot-gallery
description: Generate interactive HTML screenshot galleries with click-to-expand lightbox, metadata headers, and error checking. Use this skill when the user asks to create a gallery, document UI work with screenshots, make a visual review page, or capture and display screenshots of features. Triggers on phrases like "make a gallery", "create a gallery", "screenshot gallery", "visual review", or "document the UI".
allowed-tools: Bash(find:*), Bash(ls:*), Bash(mkdir:*), Bash(open:*), Bash(cp:*), Bash(rm:*), Bash(date:*), Bash(git:*), Bash(sleep:*), Bash(curl:*), Read, Write, Glob, mcp__playwright-mcp__*, mcp__browser-tools__*
---

# Screenshot Gallery Skill

Generate an interactive HTML gallery from screenshots with click-to-expand lightbox functionality.

## When to Use This Skill

- User asks to "make a gallery" or "create a gallery"
- User wants to document UI work with screenshots
- User asks for a "visual review" of features
- User wants to capture and display screenshots of the application

## Workflow

### 1. Gather Context

```bash
# Get current info
pwd
git branch --show-current
date -u +'%Y-%m-%d %H:%M:%S UTC'
```

### 2. Locate or Take Screenshots

**If screenshots exist**, search for them:
- `/tmp/` directories (Playwright saves here)
- `design-audit-screenshots/`
- Recent `.png` files

**If screenshots needed**:
1. Start dev server if not running (`npx kill-port 3000 && npm run dev`)
2. Wait for server to be ready (`sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`)
3. Navigate to the app using `mcp__playwright-mcp__playwright_navigate`
4. Wait for full page load
5. Take screenshots with `mcp__playwright-mcp__playwright_screenshot`
6. Use descriptive names like `01-homepage`, `02-feature-view`, etc.

### 3. Check for Errors

Before including screenshots:
- Check console for errors: `mcp__playwright-mcp__playwright_console_logs` with `type: "error"`
- Note any failed network requests
- Document any visual issues

### 4. Generate HTML Gallery

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

### 5. Open Gallery

```bash
open /tmp/gallery-[name]/gallery.html
```

## Key Features

- **Dark theme** following MAC Design System colors
- **Click-to-expand lightbox** - Pure CSS/JS, no dependencies
- **Metadata header** - Task name, branch, timestamp, screenshot count
- **Responsive grid layout**
- **Error summary section** if any errors found
- **Keyboard support** - Press Escape to close lightbox

## Example Usage

User says: "Make a gallery of the introspection feature"
User says: "Create a visual review of the new dashboard"
User says: "Take screenshots of the login flow and put them in a gallery"
