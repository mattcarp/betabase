# North Star Three-Pillar Demo Plan

(Yes, "North Star" is a dramatically pretentious name. We're keeping it because it's funny.)

---

## What This Is

5-minute screen recording. You using the actual app. Real data, pre-cached for speed.

- Localhost dev only
- No talking head - you're demonstrating, not presenting
- DaVinci Resolve for text overlays on key moments
- Technical audience who've done this work

---

## Pre-Caching Strategy

The trick: real data, but pre-warmed so it feels instant.

### Before You Hit Record

```bash
npx kill-port 3000 && npm run dev
```

**Chat pre-warming:**

- Send 2-3 AOMA queries before recording
- This warms the embedding cache and Gemini connection
- The exact queries you'll ask on camera should already be cached

**Mermaid pre-generation:**

- Ask a question that generates a diagram
- Let it render fully
- When you ask again on camera, it's instant

**Test dashboard:**

- Navigate to Test tab, let it load
- Click through Self-Healing, let data populate
- Everything's in memory now

---

## Background Mermaid Magic

The UX trick: offer the diagram while it's already rendering.

When chat responds:

1. Answer appears immediately (text first)
2. Below the answer: "Would you like to see a diagram of this flow?"
3. User clicks - diagram appears instantly (was rendering in background)

**Why this works:**

- User reads the answer (5-10 seconds)
- Mermaid renders in background (3-5 seconds)
- By the time they click, it's ready

**Implementation note:** We may need to add this "offer" UI - check if it exists.

---

## The Flow (Bullet Points for Talking)

### Opening (30 sec)

- Three things that solve each other
- AI that knows our domain
- Feedback that makes it smarter
- Tests that fix themselves
- Let me show you

### Chat Pillar (~90 sec)

**Ask the question:**

- "What's the AOMA 2 authentication flow?"
- Point: generic AI would hallucinate this
- We have 45,000 vectors from our actual docs

**Show the answer:**

- Real answer from our documentation
- Inline citations - click to see the source
- "Based on 3 verified sources"

**Optional - show introspection:**

- What vectors were retrieved
- Similarity scores
- Only if audience cares about the technical bits

**Offer the diagram:**

- "Would you like to see this as a workflow?"
- Click - instant Mermaid (pre-rendered)
- Zoom/pan to show it's interactive

### Curate Pillar (~90 sec)

**The feedback loop:**

- Point: when AI is wrong, humans correct it
- Those corrections improve future answers

**Show the mechanism:**

- Thumbs up/down on a response
- Star rating
- Text correction: "Actually, it uses Cognito, not generic OAuth"

**Show the queue (if wired):**

- Items awaiting curator review
- Approve/reject workflow
- "One expert correction helps thousands of queries"

**Honest moment:**

- We capture corrections, not yet retraining
- That's the vision - every fix makes it smarter

### Test Pillar (~60 sec)

**The problem:**

- Change one button ID, 47 tests break
- That's your "blast radius"

**Our approach:**

- AI proposes selector fixes
- 94.2% success rate
- Tiered: auto-fix obvious ones, flag uncertain ones

**Show it:**

- Test dashboard with metrics
- Self-healing queue
- Click a proposed fix - see before/after
- Approve or reject

**The tiers:**

- Tier 1: Auto-apply (high confidence)
- Tier 2: Human review (medium)
- Tier 3: Architect decision (low/structural)

### Closing (30 sec)

- The interesting part: how they connect
- Better chat means fewer corrections needed
- Corrections improve retrieval
- Test failures can trigger human review
- It's a loop

---

## Queries to Pre-Cache

Run these before recording to warm the cache:

```
What's the AOMA 2 API authentication flow?
```

```
How does the Offering lifecycle work in AOMA?
```

```
What are the main API endpoints for Asset management?
```

For diagrams, ask one that definitely generates Mermaid:

```
Show me the authentication flow as a diagram
```

---

## Text Overlays for DaVinci Resolve

Moments to highlight with text on screen:

**Chat section:**
- "45,399 domain-specific vectors"
- "Sources shown inline"
- "Diagram generated on demand"

**Curate section:**
- "Corrections improve future answers"
- "Curator queue for review"

**Test section:**
- "94.2% auto-heal success rate"
- "Blast radius: reduced"
- "Tier 1 / Tier 2 / Tier 3"

---

## If Something Goes Wrong

**Chat hangs:**
- Cut, re-record that segment
- Or: "Let me refresh that" - shows it's real

**Diagram slow:**
- Skip it - mention "diagrams available on demand"
- Or use pre-cached version

**Test data missing:**
- Use the mock data that's already there
- It's realistic anyway

**Console error:**
- If it doesn't affect the UI, ignore it
- If visible, cut and fix

---

## What We're NOT Claiming

Be honest about these:

- Not multi-model (simplified to Gemini + Supabase)
- Not fully closed loop (corrections captured, not retraining)
- Not perfect (confidence varies)
- Not instant (but pre-caching helps)

---

## Technical Details (If Asked)

**Stack:**
- Next.js + Supabase
- Gemini for embeddings + chat
- pgvector for semantic search
- Custom introspection (replaced LangSmith)

**Numbers:**
- 45,399 vectors imported from Beta Base
- RAG latency: 200-400ms
- Self-healing: 94.2% (1,175/1,247)

**Key files:**
- `knowledgeSearchService.ts` - vector search
- `aomaOrchestrator.ts` - domain logic
- `SelfHealingTestViewer.tsx` - test pillar UI

---

## Pre-Recording Checklist

```
[ ] Dev server running on 3000
[ ] Warmed cache with 3 queries
[ ] Test dashboard loaded once
[ ] Screen recording ready
[ ] No console errors (check DevTools)
[ ] DaVinci Resolve ready for edit
```

---

*Format: 5-minute screen recording, real app, pre-cached for speed*
*Localhost only - no production*
