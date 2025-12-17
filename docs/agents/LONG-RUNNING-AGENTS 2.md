# Long-Running Agent Harness

Based on [Anthropic's "Effective Harnesses for Long-Running Agents"](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) research.

## Overview

Long-running tasks require multiple agent sessions (context windows). Each session has "amnesia" - the agent doesn't remember previous sessions. This harness provides continuity through structured handoff files.

## Architecture: Two Agent Types

### 1. Initializer Agent (First Session Only)
Sets up the environment for all future sessions.

**Responsibilities:**
- Create `init.sh` - environment startup script
- Create `claude-progress.txt` - session log
- Create `features.json` - comprehensive task list
- Initial git commit of setup files

### 2. Coding Agent (All Subsequent Sessions)
Executes work and maintains continuity.

**Session Startup Sequence (MANDATORY):**
1. `pwd` - verify working directory
2. Read `claude-progress.txt` and `git log --oneline -10`
3. Read `features.json` and select highest-priority `passes: false` feature
4. Run `./scripts/init.sh` to start dev server
5. Run basic E2E test to verify stability
6. Begin work on **ONE feature only**

**Session End Sequence (MANDATORY):**
1. Run E2E tests to verify feature works
2. Update feature in `features.json` to `passes: true` (only if verified!)
3. Update `claude-progress.txt` with session summary
4. Git commit with descriptive message

## File Reference

### `scripts/init.sh`
```bash
#!/bin/bash
# Starts dev environment - run at start of every session
./scripts/init.sh
```

### `claude-progress.txt`
Session log format:
```
---
Session: YYYY-MM-DD HH:MM
Agent: [Initializer|Coding]
Duration: ~Xm

## Summary
- What was accomplished

## Next Steps
- What the next agent should tackle

## Warnings/Blockers
- Any issues to know about
---
```

### `features.json`
```json
{
  "_meta": {
    "rules": [
      "DO NOT remove or edit features without user approval",
      "DO NOT mark passes:true without running verification tests",
      "Complete one feature at a time",
      "Update claude-progress.txt after each feature",
      "Git commit after each feature"
    ]
  },
  "features": [
    {
      "id": "F001",
      "category": "category",
      "priority": 1,
      "name": "Feature Name",
      "description": "What this feature does",
      "passes": false,
      "verification": [
        "Test 1 to verify",
        "Test 2 to verify"
      ],
      "completedAt": null,
      "notes": null
    }
  ]
}
```

## Critical Rules

| Problem | Solution |
|---------|----------|
| Agent declares "done" prematurely | Comprehensive feature list with granular items |
| Incomplete work undocumented | Git commits + progress file at session end |
| Feature marked complete incorrectly | Mandatory E2E testing before `passes: true` |
| Time wasted on environment setup | Pre-written `init.sh` script |

## Testing Requirements

- Use Playwright for E2E testing (not just unit tests)
- Test as users would, through the browser
- Screenshot verification improves reliability
- Never mark feature complete without running tests

## Integration with SIAM

The long-running harness integrates with existing SIAM workflows:

- **TodoWrite tool**: Use for within-session task tracking
- **features.json**: Use for cross-session feature tracking
- **Playwright tests**: Use for verification before marking features complete
- **Git workflow**: Use `git acm` alias for commits

## Quick Start for New Session

```bash
# 1. Check where we are
pwd

# 2. Read what happened last session
cat claude-progress.txt | tail -50
git log --oneline -10

# 3. Check what's next
cat features.json | jq '.features[] | select(.passes == false) | {id, name, priority}' | head -20

# 4. Start environment
./scripts/init.sh

# 5. Verify stability
npx playwright test tests/e2e/smoke/smoke.spec.ts

# 6. Work on ONE feature
# ... implement ...

# 7. Test feature
npx playwright test tests/e2e/[relevant-test].spec.ts

# 8. Update tracking
# - Update features.json
# - Update claude-progress.txt
# - git acm "feat: implemented F00X - feature name"
```
