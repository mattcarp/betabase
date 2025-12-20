# FEAT-012: Record Screencast Checkbox

## Problem

Creating demo videos or visual documentation currently requires:
1. Manually writing Playwright scripts with video configuration
2. Running scripts from command line
3. Managing output files manually

The AI Generate feature already produces Playwright navigation code from natural language descriptions. This capability is underutilized for video production.

## Solution

Add a "Record screencast" checkbox to the AI Generate panel's Advanced Options. When enabled, the generated Playwright code executes in a visible browser window with video recording, producing a `.webm` screencast of the automated workflow.

**Location:** Test Tab > Dashboard > AI Generate Panel > Advanced Options

## User Flow

1. User navigates to Test > Dashboard > AI Generate
2. User types description OR clicks a Quick Suggestion pill
3. User checks "Record screencast" in Advanced Options
4. User clicks "Generate & Record" button
5. Chrome opens (visible window), executes the steps
6. Video saves to ~/Desktop/playwright-screencasts/
7. Toast notification shows file path with "Show in Finder" action

## Acceptance Criteria

- [ ] Checkbox "Record screencast" appears in Advanced Options panel
- [ ] When checked, button text changes to "Generate & Record"
- [ ] Clicking button launches Chrome in headed mode (visible window)
- [ ] Video records at 1920x1080 resolution
- [ ] Video saves to ~/Desktop/playwright-screencasts/[name]-[timestamp].webm
- [ ] Toast notification appears with file path after recording
- [ ] "Show in Finder" action in toast opens the output directory
- [ ] Recording can be cancelled mid-execution
- [ ] Error handling for: server not running, Chrome not found, recording failure
- [ ] Generated code includes appropriate pacing (waitForTimeout) between steps

## Out of Scope (V1)

- Audio/voiceover recording
- Video editing/trimming in UI
- Direct YouTube upload
- Multiple browser support (Chrome only)
- Mobile device emulation
- Custom resolution options (fixed 1080p)
- Custom output directory picker
