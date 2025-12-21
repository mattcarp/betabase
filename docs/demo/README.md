# SODA Demo Documentation

**State of Data Architecture (SODA) Three-Pillar Demo**

---

## Canonical Documents

| Document | Purpose |
|----------|---------|
| [NORTHSTAR-THREE-PILLAR-DEMO-PLAN.md](NORTHSTAR-THREE-PILLAR-DEMO-PLAN.md) | Demo flow, bullet points, pre-caching strategy |
| [THREE-DAY-NORTHSTAR-SPRINT.md](THREE-DAY-NORTHSTAR-SPRINT.md) | Implementation sprint plan (Day 1-3 tasks) |
| [DEMO-QUERIES.md](DEMO-QUERIES.md) | Pre-cache queries and expected responses |
| [NORTHSTAR-STATUS.md](NORTHSTAR-STATUS.md) | Current implementation status |
| [CAPCUT-SHOT-LIST.md](CAPCUT-SHOT-LIST.md) | Shot-by-shot recording guide with timing |

## HTML Versions (with styling)

- [NORTHSTAR-THREE-PILLAR-DEMO-PLAN.html](NORTHSTAR-THREE-PILLAR-DEMO-PLAN.html)
- [THREE-DAY-NORTHSTAR-SPRINT.html](THREE-DAY-NORTHSTAR-SPRINT.html)

## Architecture Reference

- [RAG-ARCHITECTURE-VISUAL.md](../architecture/RAG-ARCHITECTURE-VISUAL.md) - Visual explainer with Mermaid diagrams

---

## The Three Pillars

### 1. Chat (RAG)
- 45,399 domain-specific vectors
- Inline citations with source attribution
- Mermaid diagram generation on demand

### 2. Curate (RLHF)
- Thumbs up/down feedback
- Curator queue for expert review
- Corrections improve future answers

### 3. Test (Self-Healing)
- AI-proposed selector fixes
- Tiered approval (auto/review/architect)
- 94.2% success rate

---

## Demo Format

- ~5 minute recorded video
- Real app, real data (pre-cached for speed)
- DaVinci Resolve for text overlays
- No talking head - demonstrating, not presenting

---

## Archived Docs

Old/superseded documentation moved to `archive/` folder.

---

*Last updated: November 28, 2025*
