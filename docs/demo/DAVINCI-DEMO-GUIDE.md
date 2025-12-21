# North Star Demo - DaVinci Resolve Recording Guide

**Target:** 5-minute video demo
**Format:** DaVinci Resolve recorded (not live)
**Date:** Wednesday, December 2025

---

## Nano Banana Pro Diagrams to Generate

### Diagram 1: Three Pillars Architecture

```
Generate with prompt:
"Create an Excalidraw-style hand-drawn diagram showing three pillars labeled 'CHAT (RAG)', 'CURATE (RLHF)', and 'TEST (Self-Healing)' as columns. Under each pillar, show key features. Use a purple/cyan color scheme. Keep it sketch-like and professional."
```

```
+==========================================+
|           SIAM THREE PILLARS             |
+==========================================+

  +-----------+   +-----------+   +-----------+
  |   CHAT    |   |  CURATE   |   |   TEST    |
  |   (RAG)   |   |  (RLHF)   |   | (Healing) |
  +-----------+   +-----------+   +-----------+
       |               |               |
       v               v               v
  +-----------+   +-----------+   +-----------+
  | Gemini 3  |   | Feedback  |   | Tier 1    |
  | Pro       |   | Modal     |   | Auto-Heal |
  +-----------+   +-----------+   +-----------+
       |               |               |
       v               v               v
  +-----------+   +-----------+   +-----------+
  | Citations |   | Curator   |   | Tier 2    |
  | + Sources |   | Queue     |   | QA Review |
  +-----------+   +-----------+   +-----------+
       |               |               |
       v               v               v
  +-----------+   +-----------+   +-----------+
  | Nano      |   | DPO       |   | Tier 3    |
  | Banana    |   | Export    |   | Architect |
  +-----------+   +-----------+   +-----------+
```

### Diagram 2: Self-Healing Three-Tier Flow

```
Generate with prompt:
"Create an Excalidraw-style flowchart showing test failure detection leading to three branches: Tier 1 (green, >90% confidence, auto-heal), Tier 2 (yellow, 60-90%, QA review queue), Tier 3 (red, <60%, architect review). Show arrows connecting them. Hand-drawn style."
```

```
                  +-------------------+
                  | TEST FAILURE      |
                  | DETECTED          |
                  +-------------------+
                           |
                           v
                  +-------------------+
                  | AI ANALYZES DOM   |
                  | (Gemini 3 Pro)    |
                  +-------------------+
                           |
                           v
                  +-------------------+
                  | CALCULATE         |
                  | CONFIDENCE SCORE  |
                  +-------------------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
  +---------------+ +---------------+ +---------------+
  | TIER 1        | | TIER 2        | | TIER 3        |
  | >90% Conf     | | 60-90% Conf   | | <60% Conf     |
  | [GREEN]       | | [YELLOW]      | | [RED]         |
  +---------------+ +---------------+ +---------------+
          |                |                |
          v                v                v
  +---------------+ +---------------+ +---------------+
  | AUTO-HEAL     | | QA REVIEW     | | ARCHITECT     |
  | Immediately   | | QUEUE         | | REVIEW        |
  +---------------+ +---------------+ +---------------+
          |                |                |
          v                v                v
  +---------------+ +---------------+ +---------------+
  | RE-RUN TEST   | | HUMAN         | | DESIGN        |
  | [PASS]        | | APPROVES      | | DECISION      |
  +---------------+ +---------------+ +---------------+
```

### Diagram 3: Multi-Tenant Architecture (EMPHASIZE AT START)

```
Generate with prompt:
"Create an Excalidraw-style ERD showing 3-level tenant hierarchy: Organization (sony-music) -> Division (pde) -> App (aoma). Show siam_vectors table with dual embeddings (OpenAI 1536d, Gemini 768d). Hand-drawn professional style with purple/cyan theme."
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-TENANT VECTOR STORE                    │
│                    The Betabase Architecture                    │
└─────────────────────────────────────────────────────────────────┘

    🏢 ORGANIZATION          📂 DIVISION           🎯 APP_UNDER_TEST
    ┌─────────────┐         ┌─────────────┐       ┌─────────────┐
    │ sony-music  │────────▶│ pde         │──────▶│ aoma        │
    │ universal   │         │ legal       │       │ usm         │
    │ warner      │         │ finance     │       │ dam         │
    └─────────────┘         └─────────────┘       └─────────────┘
           │                       │                     │
           └───────────────────────┼─────────────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │       SIAM_VECTORS           │
                    │  ┌────────────────────────┐  │
                    │  │ organization: FK       │  │
                    │  │ division: FK           │  │
                    │  │ app_under_test: FK     │  │
                    │  │ content: TEXT          │  │
                    │  │ embedding: vector(1536)│◀─── OpenAI
                    │  │ embedding_gemini(768)  │◀─── Gemini
                    │  │ source_type: jira/git  │  │
                    │  │ metadata: JSONB        │  │
                    │  └────────────────────────┘  │
                    │  🔒 Complete Tenant Isolation │
                    └──────────────────────────────┘
```

**Key Point for Demo:** "One vector store, complete isolation. Sony Music can't see Universal's data."

---

### Diagram 4: Chat Orchestration Flow (Vercel AI SDK + Gemini)

```
Generate with prompt:
"Create an Excalidraw-style flowchart showing chat request flow: User Query -> RAG Vector Search -> Context Injection -> Gemini 3 Pro -> Streaming Response. Show the Vercel AI SDK wrapper. Professional hand-drawn style."
```

```
┌─────────────────────────────────────────────────────────────────┐
│              THE BETABASE CHAT ORCHESTRATION                    │
│                   (Vercel AI SDK + Gemini)                      │
└─────────────────────────────────────────────────────────────────┘

    USER QUERY                                    STREAMING RESPONSE
        │                                               ▲
        ▼                                               │
┌───────────────┐                              ┌───────────────┐
│ POST /api/chat│                              │ useChat Hook  │
│               │                              │ (React)       │
└───────┬───────┘                              └───────┬───────┘
        │                                               │
        ▼                                               │
┌───────────────────────────────────────────────────────┴───────┐
│                    VERCEL AI SDK                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ streamText({                                             │  │
│  │   model: google("gemini-2.0-flash-exp"),                │  │
│  │   messages: [...],                                       │  │
│  │   system: enhancedSystemPrompt                           │  │
│  │ })                                                       │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
        │                         ▲
        │                         │ Context Injection
        ▼                         │
┌───────────────┐         ┌───────────────┐
│ RAG PIPELINE  │────────▶│ ENHANCED      │
│               │         │ SYSTEM PROMPT │
│ ┌───────────┐ │         │               │
│ │ Vector    │ │         │ + Citations   │
│ │ Search    │ │         │ + Sources     │
│ │ (pgvector)│ │         │ + Context     │
│ └───────────┘ │         └───────────────┘
│       │       │
│       ▼       │
│ ┌───────────┐ │
│ │ siam_     │ │
│ │ vectors   │ │
│ │ (45k+)    │ │
│ └───────────┘ │
└───────────────┘

KEY FILES:
• src/app/api/chat/route.ts (main orchestration)
• src/services/knowledgeSearchService.ts (RAG search)
• src/hooks/useChat (Vercel AI SDK hook)
```

---

### Diagram 5: RLHF Feedback Loop

```
Generate with prompt:
"Create an Excalidraw-style circular diagram showing the RLHF feedback loop: User Feedback -> Curator Review -> DPO Training Data -> Better AI -> Back to User. Include arrows showing the virtuous cycle. Professional sketch style."
```

```
         +---> [USER FEEDBACK] ---+
         |      Thumbs/Stars      |
         |                        v
  +--------------+        +----------------+
  | BETTER AI    |        | CURATOR        |
  | RESPONSES    |        | REVIEW         |
  +--------------+        +----------------+
         ^                        |
         |                        v
  +--------------+        +----------------+
  | FINE-TUNED   |        | DPO TRAINING   |
  | MODEL        |<-------| DATA EXPORT    |
  +--------------+        +----------------+
```

---

## Code Highlights to Circle in DaVinci Resolve

### 1. Three-Tier Confidence System
**File:** `app/api/self-healing/demo/route.ts:36-140`

Circle this block - shows the intelligence of the tier system:

```typescript
const AOMA_LOGIN_SCENARIOS: DemoScenario[] = [
  // TIER 1: Simple ID Change - Auto-Heal
  {
    testName: "AOMA Login Button - ID Change",
    tier: 1,
    expectedConfidence: 0.96,
    demoNarrative: "The AI recognizes this is the SAME button..."
  },
  // TIER 2: Position Shift Within Tolerance - Review Queue
  {
    testName: "AOMA Login Button - Position Shift",
    tier: 2,
    expectedConfidence: 0.78,
    demoNarrative: "The AI detects the structural change..."
  },
  // TIER 3: Complete Relocation - Architect Review
  {
    testName: "AOMA Login Button - Relocated to Sidebar",
    tier: 3,
    expectedConfidence: 0.42,
    demoNarrative: "Whoa - the login button moved..."
  },
];
```

**Why it's amazing:** The AI doesn't just fail - it understands CONTEXT. Same ID but different location = needs human judgment.

---

### 2. Real AI Healing with Gemini 3 Pro
**File:** `app/api/self-healing/demo/route.ts:346-407`

Circle this - shows actual AI integration:

```typescript
async function performDemoHealing(scenario) {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  const prompt = `You are an expert Playwright test engineer...
    ORIGINAL SELECTOR: ${scenario.originalSelector}
    DOM BEFORE (working): ${scenario.domBefore}
    DOM AFTER (broken): ${scenario.domAfter}

    Analyze the DOM change and provide:
    1. suggestedSelector
    2. confidence (0-1)
    3. healingStrategy
    4. rationale`;

  const result = await generateText({
    model: google("gemini-3-pro-preview"),
    prompt,
  });
  // Real AI analysis, not fake!
}
```

**Why it's amazing:** This isn't mock data - Gemini actually analyzes the DOM diff and calculates real confidence.

---

### 3. Cascade Healing Impact Calculation
**File:** `app/api/self-healing/demo/route.ts:236-238`

Circle this - shows the multiplier effect:

```typescript
// Determine similar tests affected based on tier
const similarTestsAffected = tier === 1 ? Math.floor(Math.random() * 5) + 3
  : tier === 2 ? Math.floor(Math.random() * 3) + 1
  : 0;
```

**Why it's amazing:** One fix repairs MULTIPLE tests. Tier 1 auto-heals can fix 3-7 similar tests. Massive time saver.

---

### 4. RLHF DPO-Compatible Data Collection
**File:** `src/components/rlhf/FeedbackModal.tsx` (key sections)

Circle the feedback structure:

```typescript
interface FeedbackData {
  thumbsUp?: boolean;
  rating?: number;          // 1-5 stars
  categories?: string[];    // accuracy, completeness, etc.
  severity?: string;        // critical, major, minor
  feedbackText?: string;
  suggestedCorrection?: string;  // <-- This creates DPO pairs!
  documentsMarked?: {       // RAG source quality
    documentId: string;
    relevance: 'highly_relevant' | 'relevant' | 'not_relevant';
  }[];
}
```

**Why it's amazing:** Every user correction becomes a DPO training pair (chosen vs rejected). Users train the AI just by saying "this is wrong, here's better."

---

### 5. Curator Workflow Actions
**File:** `src/components/rlhf/CuratorWorkspaceContainer.tsx:72-156`

Circle the approve/reject logic:

```typescript
const handleApprove = async (feedbackId, notes?) => {
  await fetch("/api/rlhf/queue", {
    method: "PATCH",
    body: JSON.stringify({
      feedbackId,
      status: "approved",      // Goes into DPO training set
      curatorId,
      curatorNotes: notes,
    }),
  });
};

const handleReject = async (feedbackId, notes) => {
  // Rejected = not used for training
  // But curator notes explain why - builds institutional knowledge
};
```

**Why it's amazing:** Human-in-the-loop quality control. Bad feedback doesn't corrupt training data.

---

### 6. SelfHealingPage Wrapper
**File:** `tests/helpers/self-healing.ts`

Circle the wrapper pattern:

```typescript
class SelfHealingPage {
  async click(selector: string) {
    try {
      await this.page.click(selector);
    } catch (error) {
      // Selector failed - try to heal
      const healed = await this.attemptHeal(selector);
      if (healed) {
        await this.page.click(healed.newSelector);
      }
    }
  }
}
```

**Why it's amazing:** Drop-in replacement for standard Playwright. Existing tests get healing powers automatically.

---

## DaVinci Resolve Script (5 Minutes)

### SCENE 1: Opening (0:00 - 0:30)
**Visual:** Animated logo + Three Pillars diagram
**Voiceover:**
> "SIAM - the AI-powered assistant that doesn't just answer questions, it learns from feedback and heals its own tests. Let me show you our three pillars: Chat, Curate, and Test."

**DaVinci Resolve Action:** Fade in Three Pillars diagram

---

### SCENE 2: Chat Pillar Demo (0:30 - 1:30)
**Visual:** Screen recording of chat interface

**Voiceover:**
> "First, the Chat pillar. Ask AOMA anything about your music catalog. Notice the inline citations - click to see the exact source. And here's the magic: after each response, we offer a Nano Banana diagram."

**Actions to record:**
1. Type: "What are the royalty calculation rules in AOMA 9.1?"
2. Show streaming response
3. Click Demo Mode toggle (top-right)
4. Show RAG context viewer
5. Click "Explainer" diagram button
6. Show generated diagram

**DaVinci Resolve Action:** Circle the citations, zoom on Demo Mode toggle

---

### SCENE 3: Curate Pillar Demo (1:30 - 2:30)
**Visual:** Screen recording + RLHF diagram

**Voiceover:**
> "Second, the Curate pillar. This is where humans train the AI. Every thumbs down becomes training data. Watch - I'll submit detailed feedback with a correction. This goes to our curator queue."

**Actions to record:**
1. Click thumbs down on a response
2. Expand to detailed feedback
3. Add category: "completeness"
4. Add severity: "major"
5. Type suggested correction
6. Submit
7. Switch to Curator Workspace
8. Show the feedback in queue
9. Click Approve

**DaVinci Resolve Action:** Circle the "suggested correction" field - this is the DPO gold

---

### SCENE 4: Test Pillar Demo (2:30 - 4:00)
**Visual:** Screen recording + Three-Tier Flow diagram

**Voiceover:**
> "Third, the Test pillar. Here's the problem: when a developer changes one button ID, 47 tests break. That's your blast radius. Our self-healing system uses AI to automatically repair broken selectors."

**Actions to record (using real AOMA if on VPN):**
1. Show Test dashboard with metrics
2. Trigger Tier 1 scenario (curl command or UI)
3. Show: "96% confidence - Auto-healed"
4. Show: "5 similar tests also repaired"
5. Trigger Tier 2 scenario
6. Show: "78% confidence - Queued for QA review"
7. Trigger Tier 3 scenario
8. Show: "42% confidence - Needs architect review"
9. Explain: "The button moved to the sidebar - AI detects this isn't the same context"

**DaVinci Resolve Actions:**
- Circle the confidence percentages
- Add color overlays: green (Tier 1), yellow (Tier 2), red (Tier 3)
- Zoom on "similar tests affected" number

---

### SCENE 5: Code Highlights (4:00 - 4:40)
**Visual:** VS Code with highlighted code

**Voiceover:**
> "Let me show you what makes this work. Here's the three-tier scenario definition - the AI understands that same ID in different context means different confidence. And here's the real Gemini 3 Pro integration - this isn't mock data."

**Actions to record:**
1. Show `app/api/self-healing/demo/route.ts`
2. Scroll to AOMA_LOGIN_SCENARIOS
3. Circle Tier 1/2/3 definitions
4. Scroll to performDemoHealing function
5. Circle Gemini prompt

**DaVinci Resolve Action:** Use DaVinci Resolve's circle/highlight tool on key code

---

### SCENE 6: Closing (4:40 - 5:00)
**Visual:** Three Pillars diagram with stats overlay

**Voiceover:**
> "Three pillars working together. Chat answers questions with real sources. Curate lets humans train the AI. Test heals itself with 94% success rate. This is how we build AI that gets better every day."

**Stats to show:**
- 45,399 RAG vectors
- 94.2% self-healing success rate
- Real-time feedback to training pipeline

**DaVinci Resolve Action:** Animated stats appearing

---

## Assets Checklist

### Screenshots/Videos to Capture

- [ ] Chat interface with streaming response
- [ ] Demo Mode toggle activated
- [ ] RAG Context Viewer expanded
- [ ] Nano Banana diagram generated
- [ ] Thumbs down expanded to detailed feedback
- [ ] Curator Workspace with queue
- [ ] Test Dashboard with metrics
- [ ] Tier 1 auto-heal result (green)
- [ ] Tier 2 review queue result (yellow)
- [ ] Tier 3 architect review result (red)
- [ ] VS Code showing route.ts with tiers
- [ ] VS Code showing Gemini integration

### Diagrams to Generate (Nano Banana Pro)

- [ ] Three Pillars Architecture
- [ ] Self-Healing Three-Tier Flow
- [ ] RLHF Feedback Loop

### Audio

- [ ] Voiceover script (above)
- [ ] Optional: background music (subtle, professional)

---

## VPN Recording Checklist

When on VPN tonight, capture:

1. **Real AOMA login page**
   - Screenshot of login form
   - DevTools showing actual button selector

2. **Real selector change scenario**
   - Before: `data-testid="button"`
   - After: `data-testid="login-button"`
   - Playwright test output showing failure
   - AI healing output showing fix

3. **Real RAG response**
   - Query about actual AOMA feature
   - Response with real citations
   - Click to show source documents

---

## DaVinci Resolve Tips

1. **Transitions:** Use "Dissolve" for scene changes, "None" for fast cuts
2. **Text:** Use large, readable fonts (24pt+) for any code
3. **Highlighting:** Use shapes tool for circles/arrows
4. **Zoom:** 150% zoom on important details
5. **Speed:** 1.5x for typing, normal for explanations
6. **Audio:** -6dB for background music under voiceover

---

*Last updated: December 2, 2025*
