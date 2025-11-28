# North Star Three-Pillar Demo Plan

(Yes, "North Star" is a dramatically pretentious name. We're keeping it because it's funny.)

## What This Is

A 5-minute recorded video for colleagues showing how we've built an integrated AI platform. Technical but casual - this is for friends who've been doing this work as long as I have. Edited in CapCut with a vignette of me talking and text overlays for key points. No music, no fancy effects.

**LOCAL DEV ONLY.** No production. No production testing. Just localhost demo.

**The Three Pillars:**
- **Chat**: Domain-aware AI that actually knows our systems
- **Curate**: Human feedback that makes the AI smarter over time
- **Test**: Self-healing tests that reduce the "blast radius" of UI changes (thanks IBM for that term)

---

## Current State (What Actually Works)

### What We Have

| Area | What It Does | Actual Status |
|------|--------------|---------------|
| Chat | RAG against Supabase vectors | Working |
| Chat | Gemini embeddings + search | Primary retrieval method |
| Chat | Internal metrics/introspection | Replaced LangSmith with custom |
| Curate | RLHF feedback collection | Functional |
| Curate | Document relevance marking | Implemented |
| Curate | Permission-gated access | Working |
| Test | 28+ dashboard components | Built |
| Test | Self-healing test proposals | Working (94.2% success on heals) |
| Test | Real-time SSE updates | Working |
| Infrastructure | 45,399 bb_* test records | Imported from Beta Base |

### What's Still In Progress

| Gap | Impact | Effort |
|-----|--------|--------|
| Components not wired into main tabs | Features are hidden | 2h |
| No "Home" tab in Test Dashboard | No at-a-glance view | 1h |
| Self-Healing UI buried | Key differentiator hidden | 1h |
| Curator Queue not in Curate tab | Workflow invisible | 1h |
| No feedback impact visualization | Can't show the virtuous cycle | 3h |
| Chat confidence display | Useful for showing uncertainty | 2h |

---

## The Demo Structure

### Format: ~5 Minute Recorded Video

A quick screen recording for colleagues. Technical but casual - this is for friends who've been doing this work as long as I have. Shot with a vignette of myself talking, text overlays when things become important, edited in CapCut. No music, no fancy effects. Recording localhost only.

**Recording setup:**
- Screen capture of the app
- Small picture-in-picture of me talking (optional)
- Text overlays for key points
- Keep it tight - under 5 minutes

```
0:00-0:30 - Quick intro
  "Here's what we built - three things that solve each other"

0:30-2:00 - Chat pillar
  Ask a domain question, show it knows our systems
  Show where the answer came from

2:00-3:30 - Curate pillar
  Show feedback collection
  "When it's wrong, we fix it - and it learns"

3:30-4:30 - Test pillar
  Show a selector mismatch
  Show the self-healing proposal

4:30-5:00 - Wrap up
  "The interesting part is how they connect"
```

### The Story Arc (for video)

**Opening (30 seconds):**
"We built three things that solve each other - AI chat that knows our systems, feedback that makes it smarter, and tests that fix themselves. Let me show you."

**Each pillar (1-1.5 min each):**
- Chat: Ask a real question, show domain knowledge, show sources
- Curate: Show feedback UI, explain how corrections propagate
- Test: Show a broken selector, show the healing proposal

**Closing (30 seconds):**
"The interesting part is how they connect - feedback improves retrieval, better retrieval means fewer wrong answers, test failures trigger human review. It's a loop."

---

## PILLAR 1: CHAT - Domain Intelligence

### What It Actually Does

- Single-source RAG against Supabase pgvector
- Gemini embeddings (moved away from OpenAI embeddings)
- `UnifiedRAGOrchestrator` handles retrieval
- `knowledgeSearchService` for semantic search
- Custom introspection (we built our own, not using LangSmith anymore)

### Demo Points

1. **Show domain knowledge**: Ask "What's the AOMA 2 API authentication flow?"
   - Generic AI would hallucinate or give generic OAuth info
   - Ours pulls from actual AOMA documentation

2. **Show source attribution**: Where did that answer come from?
   - InlineCitation component shows sources
   - Click to see the actual retrieved chunks

3. **Show the retrieval**: (optional, technical audience)
   - Can show the introspection dropdown
   - See what vectors were retrieved, similarity scores

### What We're NOT Claiming

- It's not multi-model or multi-source anymore (simplified to Supabase)
- It's not perfect - confidence varies
- The "three RAG strategies" mentioned in old docs are legacy

---

## PILLAR 2: CURATE - Human-AI Collaboration

### What It Actually Does

- `RLHFFeedbackTab` collects thumbs up/down, star ratings, text corrections
- Document relevance toggles (green check/red X on retrieved docs)
- Feedback stored in Supabase for analysis
- Eventually feeds back into embedding quality

### Demo Points

1. **Show the feedback mechanism**:
   - Submit a correction: "Actually, AOMA 2 uses Cognito, not generic OAuth"
   - Show it being captured

2. **Show the curator queue** (if wired up):
   - Items needing review
   - Approve/reject workflow

3. **Explain the impact** (even if we can't visualize it yet):
   - "One expert correction can improve answers for thousands of similar queries"
   - This is the RLHF principle - human feedback at scale

### The Honest Pitch

> "This is where we're early. The feedback loop isn't fully closed yet - corrections are captured but not automatically retraining. That's the vision: every correction makes the system smarter."

---

## PILLAR 3: TEST - Reducing the Blast Radius

### What It Actually Does

- `SelfHealingTestViewer` shows proposed fixes
- When a selector breaks, AI proposes alternatives
- 94.2% success rate on healing attempts (1,175/1,247)
- Tiered approach: auto-heal obvious fixes, escalate uncertain ones

### Demo Points

1. **Show the dashboard**: Key metrics at a glance
   - Pass rate, failing tests, healed tests, tests needing human review

2. **Show a self-heal in action** (if possible live):
   - Change a button ID in the app
   - Show the test detecting the break
   - Show the proposed fix: "Use `[data-testid='login']` instead of `#login-btn`"

3. **Explain the tiers**:
   - **Tier 1 (Auto)**: High confidence, auto-apply
   - **Tier 2 (Review)**: Medium confidence, human approves
   - **Tier 3 (Architect)**: Low confidence or structural change, needs expert

### The "Blast Radius" Concept

From IBM's testing research: when something changes in the UI, how many tests break? That's your blast radius.

- Traditional: Change one button, 47 tests fail
- Self-healing: Change one button, AI fixes 44, flags 3 for review

> "We're not eliminating test maintenance. We're reducing the blast radius of UI changes."

---

## Technical Architecture (For the Curious)

```
┌─────────────────────────────────────────────────────────────┐
│                         SIAM                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Chat      │    │   Curate    │    │    Test     │     │
│  │             │    │             │    │             │     │
│  │ Gemini LLM  │←──→│ RLHF Store  │←──→│ Self-Heal   │     │
│  │ RAG Search  │    │ Feedback UI │    │ Proposals   │     │
│  │ Citations   │    │ Curator Q   │    │ Tier System │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    ┌───────┴───────┐                        │
│                    │   Supabase    │                        │
│                    │   pgvector    │                        │
│                    │   + tables    │                        │
│                    └───────────────┘                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

```
src/services/
├─ knowledgeSearchService.ts    # Vector search
├─ unifiedRAGOrchestrator.ts    # RAG coordination
├─ aomaOrchestrator.ts          # AOMA-specific logic
└─ modelConfig.ts               # LLM configuration

src/components/
├─ ai-elements/                 # Chat UI components
├─ test-dashboard/              # Test pillar UI
└─ ui/rlhf-tabs/                # Curate pillar UI
```

---

## Metrics Worth Mentioning

### Self-Healing Stats
- Success rate: 94.2% (1,175 successful heals out of 1,247 attempts)
- Average time to propose fix: ~2 seconds
- Human review queue: typically 5-10% of changes

### RAG Performance
- Retrieval latency: ~200-400ms
- Context window: Using Gemini's 1M token context
- Vector count: 45,399 embeddings from Beta Base import

### What We Don't Have Yet
- Full RLHF loop closure (feedback captured, not yet retraining)
- Automated confidence calibration
- Cross-pillar analytics dashboard

---

## Follow-Up Questions (for after the video)

If people want to dig deeper after watching:

1. **On AI Testing**: "How do you handle the 6% of heals that fail?"
2. **On Domain RAG**: "What's the embedding refresh cadence?"
3. **On RLHF**: "When do you actually retrain vs. just adjusting retrieval weights?"
4. **On Integration**: "Could this work with our existing test framework?"

---

## Pre-Recording Checklist

### Environment Setup (localhost only)
- [ ] Dev server running: `npx kill-port 3000 && npm run dev`
- [ ] Test data seeded
- [ ] No console errors visible
- [ ] Screen recording software ready

### Components to Capture
- [ ] Chat responds to AOMA queries (record this interaction)
- [ ] Curate tab - show feedback UI
- [ ] Test Dashboard - show self-healing viewer

### Recording Notes
- Keep each pillar to ~1-1.5 minutes
- Add text overlays in CapCut for key points
- If something fails during recording, just re-record that segment
- Total video: under 5 minutes

### NOT Doing
- NO production deployment
- NO production testing
- NO Render monitoring
- NO Mailinator magic link testing
- Localhost dev demo ONLY

---

## What This ISN'T

- **Not a product pitch**: We're not selling anything
- **Not production**: Localhost dev demo only
- **Not a polished marketing video**: Technical, casual, for friends
- **Not long**: 5 minutes max

---

*Last Updated: November 2025*
*Format: 5-minute recorded video, CapCut, localhost dev demo for technical colleagues*
