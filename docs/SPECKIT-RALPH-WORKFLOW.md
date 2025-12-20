# SpecKit + Ralph Workflow

**The One Command You Need to Remember:**

```bash
/ralph-loop "Implement FEAT-006 task 1. See .specify/specs/FEAT-006-latency/" --max-iterations 20
```

That's it. Ralph reads the spec files, implements the task, and iterates until done.

---

## How It Works

### The Pattern

```
SpecKit defines WHAT to build
    |
    v
Ralph loops UNTIL it's built
    |
    v
Harness tracks PROGRESS across sessions
```

### File Structure

```
.specify/
├── memory/
│   └── constitution.md           # Project rules (agents must follow)
├── specs/
│   └── FEAT-006-latency/
│       ├── spec.md              # What + Why + Acceptance Criteria
│       ├── plan.md              # Technical approach
│       └── tasks.md             # Ordered steps (1, 2, 3...)
└── templates/

features.json                     # Tracks passes: true/false
claude-progress.txt               # Session handoff log
```

---

## Quick Reference

### Start a Ralph Loop for a Task

```bash
/ralph-loop "Implement FEAT-006 task 1. See .specify/specs/FEAT-006-latency/" --max-iterations 20
```

**Pattern:**
```bash
/ralph-loop "Implement [FEAT-ID] task [N]. See .specify/specs/[FEAT-ID]/" --max-iterations [N]
```

### Check What's Next

```bash
cat features.json | jq '.features[] | select(.passes == false) | {id, name}'
```

### View Current Task Progress

```bash
tail -50 claude-progress.txt
```

### After Completing a Task

1. Update `claude-progress.txt` with what you did
2. If all tasks done, set `passes: true` in `features.json`
3. Commit: `git acm "feat(FEAT-006): Complete task N - description"`

---

## Creating a New Spec

### 1. Create the directory

```bash
mkdir -p .specify/specs/FEAT-XXX-name
```

### 2. Create spec.md (What + Why)

```markdown
# FEAT-XXX: Feature Name

## Problem
What problem does this solve?

## Solution
What are we building?

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

### 3. Create plan.md (How)

```markdown
# Technical Plan: FEAT-XXX

## Approach
How will we implement this?

## Files to Modify
- `src/path/to/file.ts` - What changes

## Dependencies
- Any new packages needed

## Risks
- What could go wrong
```

### 4. Create tasks.md (Ordered Steps)

```markdown
# Tasks: FEAT-XXX

## Task 1: Setup
- Description of first step
- Expected outcome

## Task 2: Core Implementation
- Description of second step
- Expected outcome

## Task 3: Testing
- Write tests
- Verify acceptance criteria

## Task 4: Cleanup
- Documentation
- Final verification
```

### 5. Add to features.json

```json
{
  "id": "FXXX",
  "name": "Feature Name",
  "specPath": ".specify/specs/FEAT-XXX-name/",
  "passes": false,
  "currentTask": 1,
  "totalTasks": 4
}
```

---

## Porting to Another Project

Copy these files to your new project:

```bash
# From this project
cp docs/SPECKIT-RALPH-WORKFLOW.md ~/templates/
cp scripts/spec-ralph.sh ~/templates/

# In new project
specify init my-project --ai claude
cp ~/templates/SPECKIT-RALPH-WORKFLOW.md ./docs/
cp ~/templates/spec-ralph.sh ./scripts/
```

The pattern is project-agnostic. Only the specs themselves are project-specific.

---

## Example Session

```bash
# 1. Check what needs work
cat features.json | jq '.features[] | select(.passes == false)'

# 2. Read the spec
cat .specify/specs/FEAT-006-latency/spec.md

# 3. Start Ralph on task 1
/ralph-loop "Implement FEAT-006 task 1. See .specify/specs/FEAT-006-latency/" --max-iterations 20

# 4. After completion, update progress
# (Ralph should do this, but verify)
tail -20 claude-progress.txt

# 5. Move to next task
/ralph-loop "Implement FEAT-006 task 2. See .specify/specs/FEAT-006-latency/" --max-iterations 20
```

---

## The Golden Rule

**One task at a time. Commit after each. Update progress.**

```bash
/ralph-loop "Implement FEAT-006 task 1. See .specify/specs/FEAT-006-latency/" --max-iterations 20
```

---

*Based on Anthropic's "Effective Harnesses for Long-Running Agents" and GitHub SpecKit.*
