# Video Naming Convention

Standard naming convention for all demo videos across SIAM pillars.

## Directory Structure

```
~/Desktop/playwright-screencasts/
├── test/                     # Test pillar videos
│   ├── test-self-healing-v1-2025-12-21.webm
│   ├── test-self-healing-v2-2025-12-21.webm
│   ├── test-self-healing-v3-2025-12-21.webm
│   └── test-self-healing-v4-2025-12-21_BEST.webm
├── fix/                      # Fix pillar videos
├── curate/                   # Curate pillar videos
├── chat/                     # Chat pillar videos
└── hud/                      # HUD pillar videos
```

## Naming Format

```
{pillar}-{feature}-v{version}-{YYYY-MM-DD}.webm
```

### Components

| Component | Description | Examples |
|-----------|-------------|----------|
| `pillar` | The SIAM pillar | `test`, `fix`, `curate`, `chat`, `hud` |
| `feature` | Specific feature being demoed | `self-healing`, `ai-diagnosis`, `rlhf-workflow` |
| `version` | Iteration number (v1, v2, v3...) | `v1`, `v2`, `v12` |
| `date` | Recording date | `2025-12-21` |

### Examples

```
test-self-healing-v1-2025-12-21.webm
test-self-healing-v2-2025-12-21.webm
fix-ai-diagnosis-v1-2025-12-22.webm
curate-rlhf-workflow-v3-2025-12-23.webm
chat-rag-context-v1-2025-12-24.webm
```

## Marking the Best Version

When a video is approved as the best version, append `_BEST` to the filename (before the extension):

```
test-self-healing-v4-2025-12-21_BEST.webm
```

### Why `_BEST` Suffix?

1. **Sorts together** - All versions of the same feature sort together alphabetically
2. **Easy to spot** - The best one is clearly marked at the end of the group
3. **Safe characters** - Works on all operating systems (no special Unicode)
4. **Searchable** - Easy to find all best versions: `ls *_BEST.webm`

### Rules for Best Marking

- Only ONE video per feature should be marked `_BEST` at a time
- When a new best is chosen, remove `_BEST` from the old one
- Find all best versions quickly with: `ls ~/Desktop/playwright-screencasts/*/*_BEST.webm`

## Version Progression

```
test-self-healing-v1-2025-12-21.webm        # First attempt
test-self-healing-v2-2025-12-21.webm        # Fixed scrolling
test-self-healing-v3-2025-12-21.webm        # Slowed timing
test-self-healing-v4-2025-12-21_BEST.webm   # Approved!
```

## Archiving Old Versions

After a video is marked `_BEST`, previous versions can optionally be moved to an `archive/` subfolder:

```
test/
├── test-self-healing-v4-2025-12-21_BEST.webm
└── archive/
    ├── test-self-healing-v1-2025-12-21.webm
    ├── test-self-healing-v2-2025-12-21.webm
    └── test-self-healing-v3-2025-12-21.webm
```

## Quick Reference Commands

```bash
# List all best videos
ls ~/Desktop/playwright-screencasts/*/*_BEST.webm

# Find best video for a feature
ls ~/Desktop/playwright-screencasts/test/*self-healing*_BEST.webm

# Mark a video as best (rename)
mv test-self-healing-v4-2025-12-21.webm test-self-healing-v4-2025-12-21_BEST.webm

# Remove best marking
mv test-self-healing-v4-2025-12-21_BEST.webm test-self-healing-v4-2025-12-21.webm
```

## Feature Names by Pillar

### Test Pillar
- `self-healing` - AI-powered test repair demo
- `trace-viewer` - Playwright trace analysis
- `coverage` - Test coverage visualization
- `flaky-detection` - Flaky test identification

### Fix Pillar
- `ai-diagnosis` - AI bug diagnosis workflow
- `root-cause` - Root cause analysis
- `auto-fix` - Automated fix suggestions

### Curate Pillar
- `rlhf-workflow` - RLHF curation process
- `feedback-loop` - Human feedback integration
- `quality-review` - Quality assessment demo

### Chat Pillar
- `rag-context` - RAG context building
- `skill-execution` - Skill system demo
- `introspection` - LangSmith introspection

### HUD Pillar
- `dashboard-overview` - HUD dashboard tour
- `metrics-display` - Real-time metrics
- `alerts` - Alert system demo

---

*Last updated: December 21, 2025*
