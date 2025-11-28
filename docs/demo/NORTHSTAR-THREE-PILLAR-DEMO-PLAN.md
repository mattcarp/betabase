# North Star Three-Pillar Demo Plan

(Yes, "North Star" is a dramatically pretentious name. We're keeping it because it's funny.)

## What This Is

A walkthrough for colleagues showing how we've built an integrated AI platform. This isn't a sales pitch - it's a technical deep-dive for people who've been doing this work as long as I have. The goal is to show how these three capabilities reinforce each other in ways that off-the-shelf tools can't match.

**Dev testing only.** We're not touching production for this demo - that's a whole separate nightmare.

**The Three Pillars:**
- **Chat**: Domain-aware AI that actually knows our systems
- **Curate**: Human feedback that makes the AI smarter over time
- **Test**: Self-healing tests that reduce the "blast radius" of UI changes (thanks IBM for that term)

---

## Current State (What Actually Works)

### What We Have

| Area | What It Does | Actual Status |
|------|--------------|---------------|
| Chat | RAG against Supabase vectors | Working in production |
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

### Format: ~30 Minutes (Conversational)

This isn't a formal presentation. It's more like: "Here's what we built, here's why it matters, let me show you."

```
Part 1: The Problem We're Solving (5 mins)
  "You know how tests break every time someone changes a button?"
  "You know how chatbots give garbage answers about internal systems?"

Part 2: The Three Pillars (20 mins)
  Chat: Show it actually knowing our domain
  Curate: Show how one correction improves many queries
  Test: Show a test healing itself

Part 3: Discussion (open-ended)
  "What would this look like for your team?"
```

### The Story Arc

**Opening (relatable problem):**
> "We've all dealt with this: tests that break when CSS changes, AI tools that don't know our systems, and knowledge that's stuck in people's heads. What if these three problems could solve each other?"

**The Pillars:**
1. **Chat**: "Ask it about AOMA" - it knows because we've fed it our docs
2. **Curate**: "When it's wrong, we correct it" - and that correction propagates
3. **Test**: "Watch what happens when I change this selector" - it proposes a fix

**Closing:**
> "The interesting part isn't any one of these - it's how they connect. Feedback from chat improves retrieval. Better retrieval means fewer wrong answers. Test failures can trigger human review. It's a loop."

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

## Discussion Topics

These are the interesting conversations, not sales questions:

1. **On AI Testing**: "How do you handle the 6% of heals that fail? Is human review scalable?"

2. **On Domain RAG**: "What's the embedding refresh cadence? How do you handle stale knowledge?"

3. **On RLHF**: "When do you actually retrain vs. just adjusting retrieval weights?"

4. **On Integration**: "Could this work with our existing test framework, or does it require buy-in?"

5. **On Trust**: "How do you convince QA to trust an AI-proposed fix?"

---

## Pre-Demo Checklist

### Environment Setup (localhost only)
- [ ] Dev server running: `npx kill-port 3000 && npm run dev`
- [ ] Test data seeded
- [ ] No console errors visible
- [ ] Playwright tests pass on localhost

### Components Ready
- [ ] Chat responds to AOMA queries
- [ ] Curate tab accessible
- [ ] Test Dashboard loads
- [ ] Self-Healing viewer has data

### Backup Plans
- **If live demo fails**: Walk through screenshots
- **If self-healing doesn't trigger**: Use pre-recorded example
- **If RAG is slow**: Explain while waiting, have cached response ready

### NOT Doing
- Production deployment
- Render monitoring
- Mailinator magic link testing
- Any of the usual prod verification stuff

This is a dev demo for colleagues, not a customer presentation.

---

## What This ISN'T

Let's be clear about scope:

- **Not a product pitch**: We're not selling anything
- **Not production-hardened**: This is an internal tool, R&D quality
- **Not replacing humans**: It's augmentation, not automation
- **Not magic**: 94% isn't 100%, confidence scores matter

The interesting question isn't "should you buy this" - it's "how would you approach this problem differently?"

---

*Last Updated: November 2025*
*For: Technical colleagues, internal demo*
