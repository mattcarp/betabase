# SIAM Requirements (Demo-Ready View)

## Purpose
Translate the PRD + demo commitments into durable, testable requirements tied to the three showcase pillars: Chat Experience, Curate/RLHF, and Automated Testing with HITL. Each requirement below states its measurable target, current status, and related assets/tasks so we can track gaps quickly when reopening the project.

---

## 1. Chat Experience Requirements
| Requirement | Target | Status | Notes / References |
|-------------|--------|--------|--------------------|
| **Latency & Coverage** | 95 % of demo queries respond <1 s while touching Jira, Git, knowledge base, and email sources. | ⚠️ ~1.8s (Needs Optimization) | Measured 1797ms on local dev. Needs caching/optimization to hit <1s. |
| **Complex Query Support** | Must execute scripted demo queries (`DEMO-MASTER-PLAN.md`) including diagram generation and multi-source synthesis. | ⚠️ In progress | Requires Mermaid/Nano-to-Banana/GPT image integration. |
| **Code & Diagram Rendering** | Responses display syntax-highlighted code blocks and inline diagrams with download/share options. | ⚠️ Planned | UI handled in `ai-sdk-chat-panel.tsx`; diagram assets in `docs/SIAM-MERMAID-DIAGRAMS.md`. |
| **Trust & Anti-Hallucination** | System returns truthful “I don’t know” for unknowns (e.g., blockchain integration question) with citation trail. | ⚠️ Planned | Logging must feed Curate + Testing dashboards. |
| **Authentication Path** | Magic-link flow (`/emergency-login.html`) works in demo and maps to Task `77.6` discovery outputs. | ✅ Verified (Code) | Uses Cognito `ForgotPassword` flow for magic codes. `AuthGuard` protects routes. |

---

## 2. Curate / RLHF Requirements
| Requirement | Target | Status | Notes / References |
|-------------|--------|--------|--------------------|
| **Admin Editing & Feedback** | Curate tab exposes thumbs, star ratings, doc relevance toggles, and detailed notes for curator role. | ✅ Shipped | `docs/RLHF-ACHIEVEMENT-SUMMARY.md`, `RLHFFeedbackTab.tsx`. |
| **Document Ingestion** | Uploads immediately route to Supabase, embedding index refreshed, dedupe at 85 % similarity. | ⚠️ Verify pipeline | Need proof that new uploads affect chat answers before demo. |
| **Visual Analytics** | Stats dashboard shows pending/submitted counts, success rate, trend charts (“visual candy”). | ⚠️ Mock Data Only | `RLHFFeedbackTab.tsx` uses hardcoded mocks. Needs Supabase connection. |
| **Fine-Tuning Loop** | Admin corrections or uploads demonstrably improve subsequent chat answers (recorded scenario). | ⚠️ Planned | Requires scripted before/after example. |
| **Role-Based Access** | Admin/curator/viewer enforcement via Supabase RLS and `usePermissions` hook audited before demo. | ✅ Shipped | Supabase migrations 006‑008. |

---

## 3. Automated Testing & HITL Requirements
| Requirement | Target | Status | Notes / References |
|-------------|--------|--------|--------------------|
| **Seeded Test Corpus** | “Thousands” of tests stored in Supabase tables (`test_results`, `firecrawl_analysis`, etc.) with `app_name` tenants. | ⚠️ Connection Failed | Script failed to fetch counts. Need to verify API keys in `.env.local`. |
| **Human-in-the-Loop Review** | UI surfaces failing tests, allows humans to annotate cause, escalate, and convert to automated suites. | ⚠️ UX polish required | HITL flows described in SOTA doc + `demo-1/` scripts. |
| **Automation Loop** | Human feedback triggers TestSprite/Playwright regeneration; result stored back in Supabase. | ⚠️ In progress | Requires integration spec + demo script. |
| **Visualization & Reporting** | Manager dashboard shows pass/fail trends, reviewer load, ROI metrics (EvilCharts). | ⚠️ Planned | Chart components need wiring. |
| **HITL Compliance** | Fiona approvals + LangGraph breakpoints logged for demo scenario (Fix tab narrative). | ⚠️ Verify | `demo-1/scripts/CHAT-CURATE-FIX-DEMO-WALKTHROUGH.md`. |

---

## 4. Supporting Cross-Cutting Requirements
- **Security & Auth**: Cognito magic-link login, Supabase RLS, Infisical-managed secrets; no hard-coded credentials. (`README.md`, `INFISICAL_SETUP_REPORT.md`)
- **Infrastructure**: Render deployment, Railway aoma-mesh MCP, Supabase pgvector (1536-d embeddings), OpenAI/Gemini API access.
- **QA & Compliance**: Playwright suites (≥59 tests) must pass; Fiona HITL review, Semgrep scan, Browserbase smoke tests before demo.
- **Observability**: Logging for chat latency, Curate actions, and test/HITL events stored so dashboards can reference real data.

---

## Next Documentation Moves
1. Record actual metrics (latency, RLHF counts, Supabase test totals) and replace ⚠️ entries with ✅ once validated.
2. Link each pending requirement to Task Master IDs/subtasks so progress is traceable.
3. Keep this file synchronized with `specs/SIAM/implementation-plan.md`; any new milestone there should produce or update a requirement here.
