# North Star Demo - Presenter Script

**Total Runtime:** 5 minutes
**Format:** Pre-recorded in DaVinci Resolve

---

## SCENE 1: Opening (0:00 - 0:30)

### What's on screen
Animated SIAM logo, then Three Pillars diagram fades in

### What to say
> "SIAM - the AI-powered assistant that doesn't just answer questions, it learns from feedback and heals its own tests. Let me show you our three pillars: Chat, Curate, and Test."

### DaVinci Resolve notes
- Fade in Three Pillars diagram
- Keep logo animation under 5 seconds

---

## SCENE 2: Chat Pillar (0:30 - 1:30)

### What's on screen
Chat interface at localhost:3000

### What to do
1. Type: "What are the royalty calculation rules in AOMA 9.1?"
2. Wait for streaming response
3. Click **Demo Mode toggle** (top-right corner)
4. Point out the **inline citations** in the response
5. Click one citation to show source
6. Click **"Explainer"** diagram button
7. Show the generated Nano Banana diagram

### What to say
> "First, the Chat pillar. Ask AOMA anything about your music catalog. Notice the inline citations - click to see the exact source. And here's the magic: after each response, we offer a Nano Banana diagram to visualize the answer."

### DaVinci Resolve notes
- Circle the citations when they appear
- Zoom on Demo Mode toggle when clicking

---

## SCENE 3: Curate Pillar (1:30 - 2:30)

### What's on screen
Chat interface, then Curator Workspace

### What to do
1. On a chat response, click **thumbs down**
2. When modal expands, click **"Give detailed feedback"**
3. Select category: **"Completeness"**
4. Select severity: **"Major"**
5. Type in **"Suggested correction"** field: "Should mention the 2024 rate changes"
6. Click **Submit**
7. Navigate to **Curate tab** (or /curate)
8. Show the feedback item in the queue
9. Click **Approve**

### What to say
> "Second, the Curate pillar. This is where humans train the AI. Every thumbs down becomes training data. Watch - I'll submit detailed feedback with a correction. This goes to our curator queue. The curator reviews it, and if approved, it becomes a DPO training pair - the AI learns what 'better' looks like."

### DaVinci Resolve notes
- Circle the "Suggested correction" field - this is the DPO gold
- Show the feedback appearing in curator queue

---

## SCENE 4: Test Pillar - Self-Healing (2:30 - 4:00)

### What's on screen
Terminal or Test Dashboard

### What to do

**Setup context:**
> "Here's the problem: when a developer changes one button ID, 47 tests break. That's your blast radius."

**Tier 1 Demo:**
1. Run: `curl -X POST localhost:3000/api/self-healing/demo -H "Content-Type: application/json" -d '{"tier": 1}'`
2. Show result: **96% confidence - Auto-healed**
3. Point out: **"5 similar tests also repaired"**

**Tier 2 Demo:**
1. Run: `curl -X POST localhost:3000/api/self-healing/demo -H "Content-Type: application/json" -d '{"tier": 2}'`
2. Show result: **78% confidence - Queued for QA review**

**Tier 3 Demo:**
1. Run: `curl -X POST localhost:3000/api/self-healing/demo -H "Content-Type: application/json" -d '{"tier": 3}'`
2. Show result: **42% confidence - Architect review required**
3. Explain the context change

### What to say
> "Third, the Test pillar. Our self-healing system uses AI to automatically repair broken selectors.
>
> Tier 1: A developer renamed the button ID. The AI scores 96% confidence - same position, same function, trivial change. It auto-heals immediately. And notice - 5 other tests using the same selector also get fixed. That's cascade healing.
>
> Tier 2: The button moved into a new container. 78% confidence - the AI suggests a fix but queues it for QA review. A human verifies this is intentional.
>
> Tier 3: The button relocated to the sidebar. 42% confidence - the AI finds it but says 'this needs architect review.' The context is completely different. Is this intentional? Should the test be rewritten? The human-in-the-loop queue captures this for expert judgment."

### DaVinci Resolve notes
- Add color overlays: GREEN (Tier 1), YELLOW (Tier 2), RED (Tier 3)
- Circle confidence percentages
- Zoom on "similar tests affected" number

---

## SCENE 5: Code Highlights (4:00 - 4:40)

### What's on screen
VS Code with `app/api/self-healing/demo/route.ts` open

### What to do
1. Scroll to line ~36 - show `AOMA_LOGIN_SCENARIOS` array
2. Point at the three tier definitions
3. Scroll to line ~346 - show `performDemoHealing` function
4. Point at the Gemini prompt

### What to say
> "Let me show you what makes this work. Here's the three-tier scenario definition - the AI understands that same ID in a different context means different confidence. And here's the real Gemini 3 Pro integration - this isn't mock data. The AI actually analyzes the DOM diff and calculates real confidence."

### DaVinci Resolve notes
- Use circle/highlight tool on tier definitions
- Circle the Gemini model name

---

## SCENE 6: Closing (4:40 - 5:00)

### What's on screen
Three Pillars diagram with stats overlay

### What to say
> "Three pillars working together. Chat answers questions with real sources. Curate lets humans train the AI. Test heals itself with 94% success rate. This is how we build AI that gets better every day."

### Stats to show
- 45,399 RAG vectors
- 94.2% self-healing success rate
- Real-time feedback to training pipeline

### DaVinci Resolve notes
- Animated stats appearing one by one
- End with SIAM logo

---

## Quick Reference

| Scene | Time | Pillar | Key Action |
|-------|------|--------|------------|
| 1 | 0:00-0:30 | Intro | Three Pillars diagram |
| 2 | 0:30-1:30 | Chat | Ask question, show citations, Nano Banana |
| 3 | 1:30-2:30 | Curate | Thumbs down, detailed feedback, curator approve |
| 4 | 2:30-4:00 | Test | Tier 1/2/3 demos with curl commands |
| 5 | 4:00-4:40 | Code | VS Code highlights |
| 6 | 4:40-5:00 | Close | Stats and logo |

---

## Curl Commands Cheat Sheet

```bash
# Tier 1 - Auto-heal (green)
curl -X POST localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 1, "useRealAI": false}'

# Tier 2 - Review queue (yellow)
curl -X POST localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 2, "useRealAI": false}'

# Tier 3 - Architect review (red)
curl -X POST localhost:3000/api/self-healing/demo \
  -H "Content-Type: application/json" \
  -d '{"tier": 3, "useRealAI": false}'
```

---

*Last updated: December 2, 2025*
