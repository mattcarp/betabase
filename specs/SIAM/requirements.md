# SIAM Requirements (Spec-Driven Format)

> **Purpose**: Testable, traceable requirements tied to the three showcase pillars. Each requirement has explicit acceptance criteria, feature links, and ByteRover tags for knowledge retrieval.
>
> **Related**: [PRD](./prd.md) | [Constitution](./constitution.md) | [Implementation Plan](./implementation-plan.md)  
> **Last Updated**: 2025-12-16

---

## Requirement Format Guide

Each requirement follows this structure:
```
### REQ-XXX: [Name]
- **Acceptance Criteria**: Measurable, testable conditions
- **Feature Link**: F00X in features.json
- **Status**: ✅ Shipped | ⚠️ In Progress | 🚧 Planned | 🚨 Blocked
- **Test Method**: How to verify (Playwright, manual, etc.)
- **ByteRover Tags**: For knowledge retrieval
- **Notes**: Context, edge cases, references
```

---

## 1. Chat Experience Requirements

### REQ-001: Query Response Latency
- **Acceptance Criteria**:
  - 95th percentile response time < 1000ms
  - Measured from: Chat panel submission to first streaming token
  - Must touch at least 2 sources (Jira + KB or Git + KB)
- **Feature Link**: F006 (Performance Optimization)
- **Status**: ⚠️ In Progress (~1797ms currently)
- **Test Method**: Playwright timing assertions in `tests/e2e/chat-latency.spec.ts`
- **ByteRover Tags**: `#latency #chat #performance #rag`
- **Edge Cases**:
  - Cold start: Acceptable up to 3s
  - Complex queries (4+ sources): Acceptable up to 2s
  - Cache miss: Track separately
- **Notes**: Measured 1797ms on local dev. Needs caching/optimization.

---

### REQ-002: Multi-Source Query Synthesis
- **Acceptance Criteria**:
  - Demo queries from `DEMO-MASTER-PLAN.md` execute successfully
  - Response includes citations from multiple sources
  - Source attribution visible in UI
- **Feature Link**: F007 (Multi-Source RAG)
- **Status**: ⚠️ In Progress
- **Test Method**: Manual demo walkthrough + Playwright snapshot tests
- **ByteRover Tags**: `#rag #multi-source #citations #chat`
- **Notes**: Requires Mermaid/diagram integration for some queries.

---

### REQ-003: Code & Diagram Rendering
- **Acceptance Criteria**:
  - Syntax-highlighted code blocks render correctly
  - Mermaid diagrams display inline
  - Download/share options available for diagrams
- **Feature Link**: F008 (Rich Response Rendering)
- **Status**: 🚧 Planned
- **Test Method**: Visual regression tests
- **ByteRover Tags**: `#rendering #mermaid #code-blocks #chat`
- **Key Files**: `src/components/ai/ai-sdk-chat-panel.tsx`, `docs/SIAM-MERMAID-DIAGRAMS.md`

---

### REQ-004: Anti-Hallucination Behavior
- **Acceptance Criteria**:
  - System returns "I don't know" for questions outside knowledge base
  - No fabricated information (test with blockchain question)
  - Citation trail provided for all factual claims
- **Feature Link**: F009 (Trust & Safety)
- **Status**: 🚧 Planned
- **Test Method**: Playwright test with known-unknown queries
- **ByteRover Tags**: `#hallucination #trust #safety #rag`
- **Notes**: Logging must feed Curate + Testing dashboards.

---

### REQ-005: Authentication Flow
- **Acceptance Criteria**:
  - Magic-link login via Cognito `ForgotPassword` flow works
  - Auth bypass works in dev with `NEXT_PUBLIC_BYPASS_AUTH=true`
  - `AuthGuard` protects routes correctly
  - Demo can run without authentication
- **Feature Link**: F001 (Infrastructure)
- **Status**: ✅ Shipped
- **Test Method**: Manual verification + Playwright auth tests
- **ByteRover Tags**: `#auth #cognito #magic-link #bypass`
- **Key Files**: `src/services/auth/CognitoAuthService.ts`, `src/components/auth/AuthGuard.tsx`

---

## 2. Curate / RLHF Requirements

### REQ-006: Feedback Collection UI
- **Acceptance Criteria**:
  - Thumbs up/down buttons visible on chat responses
  - Star rating (1-5) available
  - Document relevance toggle functional
  - Curator notes field saves to Supabase
- **Feature Link**: F010 (RLHF Feedback)
- **Status**: ✅ Shipped
- **Test Method**: `tests/e2e/rlhf-curate-integration.spec.ts`
- **ByteRover Tags**: `#rlhf #feedback #curate #ui`
- **Key Files**: `src/components/ui/rlhf-tabs/RLHFFeedbackTab.tsx`

---

### REQ-007: Document Upload & Ingestion
- **Acceptance Criteria**:
  - File upload accepts PDF, TXT, MD formats
  - Upload routes to Supabase storage
  - Embeddings generated automatically
  - Semantic deduplication at 85% similarity threshold
  - New uploads affect subsequent chat answers
- **Feature Link**: F011 (Document Ingestion)
- **Status**: ⚠️ In Progress
- **Test Method**: Upload test file, query for its content
- **ByteRover Tags**: `#upload #ingestion #embeddings #dedupe #curate`
- **Notes**: Need proof that uploads affect chat answers before demo.

---

### REQ-008: Curator Analytics Dashboard
- **Acceptance Criteria**:
  - Pending/submitted feedback counts displayed
  - Success rate percentage visible
  - Trend charts for feedback over time
  - Data comes from Supabase (not mocks)
- **Feature Link**: F012 (RLHF Analytics)
- **Status**: ⚠️ In Progress (Mock Data Only)
- **Test Method**: Visual inspection + data verification query
- **ByteRover Tags**: `#analytics #dashboard #charts #curate`
- **Notes**: Currently uses hardcoded mocks. Needs Supabase connection.

---

### REQ-009: RLHF Improvement Loop
- **Acceptance Criteria**:
  - Admin correction of response → embeddings updated
  - Subsequent query returns improved answer
  - Before/after demo scenario documented
- **Feature Link**: F013 (Fine-Tuning Loop)
- **Status**: 🚧 Planned
- **Test Method**: Scripted before/after example
- **ByteRover Tags**: `#rlhf #fine-tuning #improvement #curate`

---

### REQ-010: Role-Based Access Control
- **Acceptance Criteria**:
  - Admin role can edit all feedback
  - Curator role can edit own feedback only
  - Viewer role is read-only
  - Enforced via Supabase RLS
  - `usePermissions` hook returns correct permissions
- **Feature Link**: F001 (Infrastructure)
- **Status**: ✅ Shipped
- **Test Method**: Playwright tests with different user roles
- **ByteRover Tags**: `#rbac #permissions #rls #security`
- **Key Files**: `src/hooks/usePermissions.ts`, Supabase migrations 006-008

---

## 3. Automated Testing & HITL Requirements

### REQ-011: Seeded Test Corpus
- **Acceptance Criteria**:
  - At least 1000 tests in Supabase (`test_results` table)
  - Data segmented by `app_name` for multi-tenant
  - Query returns counts without timeout
- **Feature Link**: F014 (Test Data)
- **Status**: 🚨 Blocked (Connection Failed)
- **Test Method**: `SELECT COUNT(*) FROM test_results` via Supabase MCP
- **ByteRover Tags**: `#testing #corpus #supabase #multi-tenant`
- **Blockers**: Script failed to fetch counts. Verify API keys in `.env.local`.

---

### REQ-012: HITL Review Interface
- **Acceptance Criteria**:
  - Failing tests surface in UI
  - Human can annotate failure cause
  - Escalation path available
  - Convert annotation to automated test
- **Feature Link**: F015 (HITL UI)
- **Status**: ⚠️ In Progress (UX Polish)
- **Test Method**: Manual walkthrough + Playwright
- **ByteRover Tags**: `#hitl #testing #review #annotation`
- **Key Files**: `demo-1/` scripts, SOTA testing doc

---

### REQ-013: Self-Healing Test Generation
- **Acceptance Criteria**:
  - Human feedback triggers TestSprite regeneration
  - New Playwright test generated and stored
  - Result recorded in Supabase
- **Feature Link**: F016 (Automation Loop)
- **Status**: ⚠️ In Progress
- **Test Method**: Integration spec + demo script
- **ByteRover Tags**: `#self-healing #testsprite #playwright #automation`

---

### REQ-014: Testing Dashboard & Reporting
- **Acceptance Criteria**:
  - Pass/fail trends over time (chart)
  - Reviewer workload distribution
  - ROI metrics visible
  - Uses recharts/shadcn components
- **Feature Link**: F017 (Test Analytics)
- **Status**: 🚧 Planned
- **Test Method**: Visual inspection + data verification
- **ByteRover Tags**: `#dashboard #charts #testing #analytics`

---

### REQ-015: HITL Compliance Logging
- **Acceptance Criteria**:
  - Fiona approvals logged with timestamp
  - LangGraph breakpoints recorded
  - Audit trail queryable
- **Feature Link**: F018 (Compliance)
- **Status**: ⚠️ Needs Verification
- **Test Method**: Query audit logs after demo scenario
- **ByteRover Tags**: `#compliance #audit #fiona #langgraph`
- **Key Files**: `demo-1/scripts/CHAT-CURATE-FIX-DEMO-WALKTHROUGH.md`

---

## 4. Cross-Cutting Requirements

### REQ-016: Security & Secrets
- **Acceptance Criteria**:
  - No hardcoded credentials in codebase
  - Secrets managed via Infisical
  - Supabase RLS enforces data isolation
- **Feature Link**: F001 (Infrastructure)
- **Status**: ✅ Shipped
- **Test Method**: Semgrep scan, code review
- **ByteRover Tags**: `#security #secrets #infisical #rls`

---

### REQ-017: Infrastructure Stability
- **Acceptance Criteria**:
  - Render deployment auto-triggers on main merge
  - Railway aoma-mesh-mcp accessible
  - Supabase pgvector queries < 500ms
- **Feature Link**: F001 (Infrastructure)
- **Status**: ✅ Shipped
- **Test Method**: Health checks, deployment logs
- **ByteRover Tags**: `#infrastructure #render #railway #supabase`

---

### REQ-018: Test Suite Health
- **Acceptance Criteria**:
  - Minimum 59 Playwright tests pass
  - No console errors in production build
  - Pre-PR check passes
- **Feature Link**: F019 (QA)
- **Status**: ⚠️ Needs Verification
- **Test Method**: `npm run test:e2e`, `npm run pre-pr-check`
- **ByteRover Tags**: `#qa #playwright #testing #ci`

---

## Requirement Status Summary

| Status | Count | Meaning |
|--------|-------|---------|
| ✅ Shipped | 4 | Verified complete |
| ⚠️ In Progress | 9 | Work underway |
| 🚧 Planned | 4 | Not yet started |
| 🚨 Blocked | 1 | Has dependency/blocker |

---

## Traceability Matrix

| Requirement | Feature(s) | Implementation Plan Milestone |
|-------------|-----------|-------------------------------|
| REQ-001 | F006 | A1 - Experience Polish |
| REQ-002 | F007 | A1 - Experience Polish |
| REQ-003 | F008 | A1 - Experience Polish |
| REQ-004 | F009 | A2 - Trust & Observability |
| REQ-005 | F001 | A0 - Discovery ✅ |
| REQ-006 | F010 | B0 - Inventory ✅ |
| REQ-007 | F011 | B2 - Fine-Tuning Loop |
| REQ-008 | F012 | B1 - Visual Storytelling |
| REQ-009 | F013 | B2 - Fine-Tuning Loop |
| REQ-010 | F001 | B0 - Inventory ✅ |
| REQ-011 | F014 | C0 - Data Audit |
| REQ-012 | F015 | C1 - HITL Surfaces |
| REQ-013 | F016 | C2 - Automation Loop |
| REQ-014 | F017 | C1 - HITL Surfaces |
| REQ-015 | F018 | C2 - Automation Loop |
| REQ-016 | F001 | Infrastructure ✅ |
| REQ-017 | F001 | Infrastructure ✅ |
| REQ-018 | F019 | QA |

---

## Next Steps

1. ~~Link each requirement to features.json entries~~ (Traceability matrix added)
2. Run verification for all ⚠️ items and update status
3. Create F006-F019 entries in `features.json` to match requirement IDs
4. Store requirement patterns in ByteRover for future sessions

---

*This document is synchronized with [implementation-plan.md](./implementation-plan.md). Any new milestone there should update requirements here.*
