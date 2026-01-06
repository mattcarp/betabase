# Demo Files Reference Guide

## Quick Answer
**For recording your demo**: Use `DEMO-SCRIPT-OFFICIAL-MC-EDIT.md`

## File Breakdown

### 📝 DEMO-SCRIPT-OFFICIAL-MC-EDIT.md
**Location**: Root directory
**Purpose**: Human-readable talking points for recording the demo
**Size**: 146 lines
**Use**: Keep this open on your screen while recording

**Contains**:
- Preamble talking points
- Main content sections (Knowledge Base, Curation, Testing)
- Wrap-up notes
- Optional AI Slop section to splice in
- Speaking notes and transitions

**Example Section**:
```markdown
## Main Content

1. Knowledge base with tool calls:
   Start with hard, but answerable question

2. also what's in the upcoming release and how to prepare for it
```

### 🧪 tests/e2e/demo/demo-mc-edit-official.spec.ts
**Location**: Test directory (formerly `.spec.md`, now renamed to `.spec.ts`)
**Purpose**: Automated Playwright E2E test suite that validates demo features
**Size**: 687 lines of TypeScript
**Use**: Run before recording to verify all features work

**Contains**:
- DEMO-001 through DEMO-061 automated tests
- Helper functions (`submitChatQuery`, `waitForAIResponse`, `setupPage`)
- Screenshot capture for each step
- Navigation and verification logic

**Run with**:
```bash
npx playwright test tests/e2e/demo/demo-mc-edit-official.spec.ts
```

## Relationship Between Files

| Script File | Test File |
|------------|-----------|
| "Start with hard, but answerable question" | `DEMO-010: Hard but answerable question` |
| "what's in the upcoming release" | `DEMO-011: Upcoming release info (JIRAs)` |
| "Diagramming - mermaid to nano banana pro" | `DEMO-020: Mermaid diagram generation` |
| "ask to read a DDP" | `DEMO-022: DDP parsing tool call` |
| "Does AOMA have a blockchain integration?" | `DEMO-030: Blockchain trick question` |
| "Upload proprietary documents" | `DEMO-041: Upload area visible` |
| "Three-tier system" | `DEMO-057: Three-Tier Ranking System` |

## Recording Workflow

### Before Recording
1. ✅ Run the test suite to verify everything works:
   ```bash
   npx playwright test tests/e2e/demo/demo-mc-edit-official.spec.ts
   ```
2. ✅ Check that all tests pass (or note which features are missing)
3. ✅ Review the script file for any last-minute edits

### During Recording
1. 📺 Keep `DEMO-SCRIPT-OFFICIAL-MC-EDIT.md` open on a second monitor
2. 🎬 Follow the talking points section by section
3. 🎯 Navigate through the app manually while reading from the script

### After Recording
1. 📸 Screenshots from test run are saved to `test-results/demo-mc-edit-*.png`
2. 🔍 Compare your recording to the automated test flow
3. ✅ Verify you covered all sections

## No Merge Needed

These files are **complementary, not duplicates**:
- **Script** = What you SAY
- **Test** = What you DO (automated validation)

Both reference the same demo flow but serve different purposes.

## Test Sections Coverage

| Section | Script Lines | Test Names |
|---------|-------------|-----------|
| Preamble | Lines 5-14 | DEMO-001, DEMO-002 |
| Knowledge Base | Lines 24-32 | DEMO-010, DEMO-011 |
| Visual Intelligence | Lines 29-30 | DEMO-020, DEMO-022, DEMO-023 |
| Anti-Hallucination | Lines 32-33 | DEMO-030, DEMO-031 |
| Curation | Lines 36-46 | DEMO-040 to DEMO-043 |
| Testing | Lines 48-85 | DEMO-050 to DEMO-058 |
| Full Flow | - | DEMO-060, DEMO-061 |

## File Status
- ✅ Script file: Ready to use for recording
- ✅ Test file: Renamed to `.spec.ts` (correct extension)
- ✅ Both files in sync with demo flow
- ✅ No conflicts or overlaps

---

**TL;DR**: Use the `.md` file as your teleprompter. Run the `.spec.ts` file to make sure everything works before you hit record.
