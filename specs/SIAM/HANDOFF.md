# SIAM Demo Handoff Cheat Sheet

## Quick Start Checklist
1. **Open** `specs/SIAM/implementation-plan.md` – this is the live Phase roadmap (Workstreams A–C for Chat, Curate/RLHF, Automated Testing + HITL).
2. **Cross-check** `specs/SIAM/requirements.md` – measurable targets per workstream with ✅/⚠️ status.
3. **Review references** before coding:
   - `README.md` (stack + auth path)
   - `DEMO-MASTER-PLAN.md` (scripted demo queries & differentiators)
   - `docs/RLHF-ACHIEVEMENT-SUMMARY.md` (Curate/RLHF feature baseline)
   - `docs/test-dashboard/SOTA-2025-Testing-Architecture.md` (HITL + testing expectations)

## Current Phase (Phase 0)
- **P0-2** – Capture metrics/screenshots:
  - Chat latency + multi-source proof for demo queries 1–4
  - Curate stats dashboard (pending/submitted, dedupe 85%, Playwright evidence)
  - Supabase test corpus counts + HITL dashboard snapshot
- **P0-3** – Log tooling decisions:
  - Diagram generator choice (Mermaid CLI vs GPT image/Nano-to-Banana)
  - Charting library for Curate/testing dashboards (EvilCharts/shadcn vs existing components)

## Task Master Context
- `task-master next` currently returns **Task 77.6** (Discovery – Authentication Flows) which feeds Workstream A.
- Workstream ↔ Task map lives inside `specs/SIAM/implementation-plan.md` under each section.

## Handoff Expectations
- Any new agent should start by reading this file, the implementation plan, and the requirements doc before making edits.
- Record discoveries/decisions back into:
  - Task Master via `update_subtask`
  - `specs/SIAM/implementation-plan.md` (Workstream notes)
  - `specs/SIAM/requirements.md` (flip ⚠️ → ✅ with evidence)
- Visual assets (screenshots, diagrams) should be stored under `docs/demo-assets/` (create if missing) and referenced from the plan.
