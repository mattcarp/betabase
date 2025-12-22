# SIAM Demo Documentation

**Three-Pillar Demo: Chat | Curate | Test**

---

## Primary Script

| Document | Purpose |
|----------|---------|
| **[MASTER-DEMO-SCRIPT.md](MASTER-DEMO-SCRIPT.md)** | **THE SCRIPT** - Two-column format (DO | SAY), includes the thumbs-down segue from Chat to Curate |

---

## Supporting Documents

| Document | Purpose |
|----------|---------|
| [SCREENCAST-SCRIPT.md](SCREENCAST-SCRIPT.md) | Technical Playwright recording details, CD Text hex data |
| [DEMO-QUERIES.md](DEMO-QUERIES.md) | Pre-cache queries and expected responses |
| [PRESENTER-SCRIPT.md](PRESENTER-SCRIPT.md) | DaVinci Resolve scene breakdown |
| [NORTHSTAR-STATUS.md](NORTHSTAR-STATUS.md) | Current implementation status |

## Recording Scripts

| Script | Purpose |
|--------|---------|
| `scripts/record-curate-video-1.ts` | Curate: Document relevance marking |
| `scripts/record-curate-video-2.ts` | Curate: Correction flow |
| `scripts/record-curate-video-3.ts` | Curate: Quality review |

---

## The Three Pillars

### 1. Chat (RAG)
- 45,399 domain-specific vectors
- Inline citations with source attribution
- Multi-source: JIRA + Git + Docs + Email
- Diagram generation (Nano Banana Pro)

### 2. Curate (RLHF)
- Thumbs up/down feedback
- Curator queue for expert review
- Corrections become training data
- The segue: thumbs down in Chat -> opens Curate

### 3. Test (Self-Healing)
- AI-proposed selector fixes
- Tiered approval (auto/review/architect)
- 94.2% success rate
- RLHF tests auto-generated from corrections

---

## Demo Flow Summary

```
Chat Demo (2-3 min)
    |
    v
[Thumbs Down on Response]  <-- THE SEGUE
    |
    v
Curate Demo (1-2 min)
    |
    v
Test Demo (1-2 min)
```

---

## Quick Stats

| Metric | Value |
|--------|-------|
| Total tests | 8,719 |
| Self-healed | 1,089 |
| Heal success | 94.2% |
| RAG vectors | 45,399 |

---

## Archived Docs

Old/superseded documentation in `archive/` folder:
- CAPCUT-TUTORIAL.md (use DAVINCI-TUTORIAL.md)
- Various duplicate scripts consolidated into MASTER-DEMO-SCRIPT.md

---

## Consolidated From

The MASTER-DEMO-SCRIPT.md was created by consolidating:
- SCREENCAST-SCRIPT.md (technical details kept separate)
- DEMO-SCRIPT-BULLETS.md
- DEMO-4-MINUTE-BULLETS.md
- DEMO-CHEAT-SHEET.md
- PRESENTER-SCRIPT.md
- RLHF-LOOP-DEMO-SCRIPT.md

---

*Last updated: 2025-12-22*
