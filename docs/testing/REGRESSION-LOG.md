# Regression Test Log

**Purpose**: Track every regression, its root cause, and the test added to prevent recurrence.

**Rule**: Before fixing any regression, add it to this log FIRST. Then write the failing test. Then fix.

---

## How to Use This Log

1. **When a regression is reported**:
   - Add entry to "Active Regressions" below
   - Write a failing test that reproduces the regression
   - Fix the code
   - Move entry to "Resolved Regressions" with test file reference

2. **Entry Format**:
   ```markdown
   ### [YYYY-MM-DD] Brief Description
   - **Reported by**: Who found it
   - **Severity**: Critical / High / Medium / Low
   - **Symptom**: What the user sees
   - **Root cause**: Why it happened
   - **Test added**: `path/to/test.spec.ts` - test name
   - **PR/Commit**: Link to fix
   ```

---

## Active Regressions

### [2025-12-23] Conversation titles showing "New conversation" instead of user query

- **Reported by**: User (recurring issue)
- **Severity**: High
- **Symptom**: Conversations in the sidebar display "New conversation" instead of being named after the user's first query. Most or all conversations show generic titles.
- **Root cause**: Under investigation - title derivation from first message not working
- **Test added**: `tests/e2e/visual/chat-visual-regression.spec.ts` - "CRITICAL: No conversation should be titled 'New conversation'"
- **PR/Commit**: Pending fix

---

## Resolved Regressions

### [2025-12-22] Welcome screen suggestion buttons not matching

- **Reported by**: Automated smoke test
- **Severity**: Medium
- **Symptom**: Smoke test expected 4-6 suggestion buttons, found only 1
- **Root cause**: Suggestion button text patterns changed but test regex wasn't updated
- **Test added**: `tests/e2e/smoke/verify-welcome-screen.spec.ts` - "should display logo, welcome text, and suggestions on initial load"
- **PR/Commit**: Session cleanup 2025-12-22

### [2025-12-22] Console monitor import path broken

- **Reported by**: Automated smoke test
- **Severity**: High
- **Symptom**: 6 smoke tests failing with import error
- **Root cause**: Relative path `../../helpers/console-monitor` incorrect after folder restructure
- **Test added**: `tests/e2e/smoke/smoke.spec.ts` - multiple tests
- **PR/Commit**: Session cleanup 2025-12-22

### [2025-12-22] Hydration mismatch on file input

- **Reported by**: Automated smoke test
- **Severity**: Low
- **Symptom**: React hydration warning about `caret-color:transparent` style
- **Root cause**: Browser applies different styles to hidden file inputs on server vs client
- **Test added**: `tests/e2e/smoke/smoke.spec.ts` - "No console errors on page load"
- **PR/Commit**: Session cleanup 2025-12-22

---

## Regression Categories

Track patterns to identify systemic issues:

| Category | Count | Notes |
|----------|-------|-------|
| Chat Flow | 1 | Message send/receive, streaming, conversation titles |
| UI/Visual | 3 | CSS, layout, hydration |
| Auth | 0 | Login, session, tokens |
| API | 0 | Endpoints, responses |
| State Management | 0 | Zustand, React state |
| Build/Deploy | 0 | CI/CD, bundling |

---

## Testing Coverage Gaps

Areas that lack sufficient test coverage and are prone to regressions:

1. **Chat message streaming** - No integration test for full message lifecycle
2. **Conversation state persistence** - localStorage/session handling
3. **Conversation title derivation** - Title should always come from user's first query, never "New conversation"
4. **Error recovery** - Network failures, API errors
5. **Model switching** - GPT-4, Gemini, etc.
6. **File upload in chat** - Upload + process + display in conversation

---

_Last updated: 2025-12-23_
