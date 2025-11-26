# SIAM Implementation Plan (Demo Focus)

## Demo North Star
The upcoming demo must prove three differentiators end‑to‑end:
1. **Show‑stopping chat experience** – complex AOMA questions answered quickly with multi-source recall, inline code/diagram rendering, and truthful fallbacks. (Ref: `README.md`, `DEMO-MASTER-PLAN.md`)
2. **State-of-the-art Curate (fine-tuning) tab** – admins correct responses, upload docs that feed Supabase embeddings, view RLHF metrics, and see visual “candy.” (Ref: `docs/RLHF-ACHIEVEMENT-SUMMARY.md`)
3. **Automated testing with HITL** – thousands of Supabase-seeded tests surfaced through dashboards where humans review, promote, and annotate failures. (Ref: `docs/test-dashboard/SOTA-2025-Testing-Architecture.md`)

Everything below maps those demo requirements to concrete modules plus Task Master work (current next item: `1.8` – Fiona MAC design audit & Playwright verification).

---

## Workstream A – Demo Chat Experience

### Goals
- <1 s response targets for 95 % of queries while aggregating Jira, Git, knowledge base, and email sources.
- Inline code blocks, citations, and diagram generation (Mermaid now, Nano Banana / Gemini image tooling as soon as it launches) during live demo queries.
- Honest “I don’t know” behavior for gaps (anti-hallucination differentiator #4).

### Current Assets
- `src/components/ai/ai-sdk-chat-panel.tsx` (chat UX, HITL buttons).
- `src/services/unifiedRAGOrchestrator.ts`, `agenticRAG/`, `reranking.ts`, `contextAwareRetrieval.ts` (multi-strategy RAG stack).
- Prompt/script guidance in `DEMO-MASTER-PLAN.md` and diagram catalog `docs/SIAM-MERMAID-DIAGRAMS.md`.

### Linked Task Master Items
- `1` – MAC-styled chat landing experience with Fiona audit + Playwright suite.
- `67`/`69`/`70`/`71` – Knowledge, commit, email, and telemetry vector ingestion.
- `72`/`73`/`74` – Orchestrator vector queries, source selection, progressive streaming.
- `76` – A/B testing + full deployment readiness.
- `78` – Performance optimization + Web Vitals tracking (supports latency goal).

### Milestones (Checklists)
- [x] **A0 – Discovery**  
  - Ready: Auth flows catalogued (Task `77.6`), latency baselines captured, diagram tooling chosen.  
  - Done: Findings logged inside Task Master + this plan.
    - **Auth Flow**: `CognitoAuthService` uses `ForgotPasswordCommand` to trigger magic link (code) via email.
    - **Client**: `useAuthenticationFlow` manages state (Email -> Code -> Token).
    - **Guard**: `AuthGuard.tsx` protects routes and checks `cognitoAuth.isAuthenticated()`.
- [ ] **A1 – Experience Polish**  
  - Ready: Chat UI comps approved (Motiff references), code/diagram renderers wired to orchestrator output.  
  - Done: Demo queries 1‑4 succeed consistently; screenshots + Playwright evidence captured.
- [ ] **A2 – Trust & Observability**  
  - Ready: Anti-hallucination logic + logging spec written.  
  - Done: Honest fallback demo recorded; metrics piped to Curate + Testing dashboards.

### Open Questions
- Preferred diagram engine for live demo (Mermaid CLI now vs. Nano Banana / Gemini image gen once available).
- Whether to preload “diagram templates” into Supabase for reliability.

---

## Workstream B – Curate / RLHF Tab

### Goals
- Allow admins to view/edit feedback, upload documents (auto-ingested into Supabase pgvector), and monitor success rates via charts.
- Showcase RLHF differentiators: thumbs, star ratings, doc relevance, semantic dedupe at 85 % threshold, and “59 automated Playwright tests” story.
- Demonstrate end-to-end loop: bad chat answer → curator fix → improved future response.

### Current Assets
- UI: `src/components/ui/rlhf-tabs/RLHFFeedbackTab.tsx`, `CurateTab.tsx`.
- Permissions: `src/hooks/usePermissions.ts`, Supabase tables (`user_roles`, `role_permissions`, `rlhf_feedback`, `gemini_embeddings`).
- Tests: `tests/e2e/rlhf-curate-integration.spec.ts`, `rlhf-visual-test.spec.ts`, `quick-rlhf-check.spec.ts`.
- Documentation: `docs/RLHF-ACHIEVEMENT-SUMMARY.md`, `DEMO-MASTER-PLAN.md` segment C.

### Linked Task Master Items
- `1` – Chat tab polish also references Curate tab parity in MAC shell.
- `45` – UX enhancements for the broader glassmorphism/JARVIS interface (portions reusable for Curate polish).
- `69`/`70`/`71` – Source ingestion tasks feeding Supabase (documents/emails/metrics).
- `91` – Beta Base historical test integration (hooks into RLHF tab for scenario exploration).

### Milestones (Checklists)
- [ ] **B0 – Inventory**  
  - Ready: Confirm RLHF metrics, dedupe flow, upload pipeline behavior.  
  - Done: Requirements doc updated with real counts/thresholds.
- [ ] **B1 – Visual Storytelling**  
  - Ready: Charting library (EvilCharts/shadcn) chosen; APIs expose needed stats.  
  - Done: Live dashboard + queue view screenshots captured for demo.
- [ ] **B2 – Fine-Tuning Loop**  
  - Ready: Spec for “admin correction → embeddings” drafted.  
  - Done: Before/after demo recorded and covered by Playwright.

### Open Questions
- Do we integrate Nano Banana / Gemini diagram uploads through Curate once the API lands?
- How do we surface RLHF status in the chat tab (badges, tooltips)?

---

## Workstream C – Automated Testing & HITL

### Goals
- Present thousands of preloaded tests (Supabase `test_results`, `firecrawl_analysis`, etc.) with per-app segmentation (`app_name` tenant model).
- Let humans review failures, add context, and convert them into automated suites (agentic + HITL workflow).
- Visualize pass/fail trends, reviewer queues, and ROI metrics (EvilCharts/shadcn components).

### Current Assets
- Architecture & roadmap: `docs/test-dashboard/SOTA-2025-Testing-Architecture.md`.
- HITL integrations across LangGraph flows (`demo-1/` scripts, `tests/e2e/test-dashboard-complete.spec.ts`).
- Tooling already wired: Firecrawl, TestSprite, Playwright, Browserbase, Supabase pgvector.

### Linked Task Master Items
- `79` – Comprehensive testing framework + CI/CD integration (unit/E2E/API).
- `80` – Codebase cleanup + documentation consolidation (shared with dashboards).
- `87` – Automated AOMA screenshot capture (useful artifact for testing dashboard).
- `88`/`89` – Research + schema inventory supporting Supabase test corpus.
- `91` – Beta Base scenario import with explorer UI (feeds HITL/test analytics).

### Milestones (Checklists)
- [ ] **C0 – Data Audit**  
  - Ready: Validate Supabase tables contain latest imported tests; confirm `app_name` coverage.  
  - Done: Counts + sample queries documented; dashboards pull live data.
- [ ] **C1 – HITL Surfaces**  
  - Ready: UX mocks for reviewer queue + failure annotation ready.  
  - Done: Humans can tag failures, escalate, and see impact in charts.
- [ ] **C2 – Automation Loop**  
  - Ready: Spec for “human feedback → automated test generation” aligned with TestSprite API.  
  - Done: Demo scenario recorded; regenerated Playwright test verified.

### Open Questions
- Exact location of “thousands of seeded tests” (need query + counts for demo script).
- Where automated diagnostics surface (Curate vs. dedicated Testing tab vs. new page).

---

## Cross-Cutting Dependencies
- **Infrastructure:** Render deployment, Supabase pgvector (1536-d embeddings), Cognito magic-link login, Railway aoma-mesh MCP server.
- **Security & QA:** Fiona HITL approvals, Playwright suites (`pnpm test:e2e`), Semgrep scans, Browserbase smoke tests.
- **Design:** Motiff node `docId=55NwiLkMni65Cs3eeqims7p`, node `2402:64287` for chat landing polish.
- **Tooling:** pnpm workflow, EvilCharts/shadcn for dashboards, Mermaid (today) with future Nano Banana / Gemini image upgrades, plus readiness for Gemini 3.0 model swap.

---

## Phase 0 Action Items (Week 0) – Checkboxes
- [x] **Backlog sync** – tie Task Master tasks (starting with `77.6`) to Workstreams A–C; create new tasks for uncovered milestones.
- [x] **Evidence capture** – record current screenshots/metrics (chat latency, Curate dashboards, Supabase test counts).
- [x] **Decision logs** – document chosen diagram + charting libraries in Task Master subtasks.
  - **Diagrams**: Mermaid (primary) with flexibility for future AI generators.
  - **Charts**: shadcn/recharts (for ease of use).
- [x] **Doc alignment** – update `specs/SIAM/requirements.md` so requirements mirror this plan.
