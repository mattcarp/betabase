# THE BETABASE DEMO - Recording Script
**Clean version - Only what you'll actually say and do**

---

## 🎬 OPENING (0:00-0:45)

### Say:
> "Most QA platforms keep humans and AI in separate lanes. We asked a different question: **What if they learned from each other?**
>

> Let's dive in."

### Do:
1. Type: "What are the different asset types in AOMA?"
2. AI explains (shows it has knowledge)
3. **Say:** "Okay, I'm running a demo now. For my friends, can you make an infographic of how the ERD works for the multi-tenant architecture of this system itself? Thanks!"
4. Nano Banana generates (30-50 sec → edit to 5 sec)  
5. Beautiful ERD appears (Sony Music, SMEJ, Other Music)

### Say (while generating):
> "This isn't built for just us. **Multi-tenant from the ground up**—any organization can use it, totally isolated data.
>
> Watch this... the system is creating its own demo slide right now. Meta, right?"

**Insight:** *"Most platforms bolt on multi-tenancy later. We designed isolation into the foundation."*

---

## 🎬 PILLAR 1: CHAT (0:45-2:30)

### Do:
1. Type: "What are the steps to link a product to a master in AOMA?"
2. Point to progress indicator: "intent classification" and "re-ranking"
3. When response streams, mention: "Gemini 3 Flash—three times faster"

### Say:
> "**Two-stage retrieval:** Vector search pulls 200 candidates. Gemini re-ranks by actual relevance.
>
> **Insight:** Semantic similarity doesn't always mean useful. Re-ranking optimizes for the right answer, not just similar words."

**Catchphrase:** *"Most RAG stops at similarity. We optimize for usefulness."*

### Optional: Diagram Demo
- Ask: "How do I upload and archive digital assets?"
- Click diagram offer → Nano Banana generates 5-phase workflow

---

## 🎬 PILLAR 2: CURATE (2:30-3:45)

### Do:
1. Click thumbs down on a response
2. Type feedback: "Should mention 2024 spec updates"
3. Click "Go to Curation Queue"
4. Show your feedback in the list
5. Point to accuracy chart

### Say:
> "Every thumbs down becomes training data. Domain experts curate the AI's knowledge—they **teach it what better looks like**.
>
> That feedback updates embeddings, changes search results, makes the next answer more accurate."

**Insight:** *"AI without human feedback is just expensive autocomplete."*

**Catchphrase:** *"We're building a knowledge base that gets smarter every day."*

---

## 🎬 PILLAR 3: TEST (3:45-5:15)

### Do:
1. Click "Test" tab.
2. Show dashboard: **12,177 executions, 80.4% pass rate, 12 auto-healed today**.
3. Click **"Historical"** sub-tab.
4. Search for ID **49524** (Wav Duration Mismatch).
5. Click **"Run AI Analysis"** → Point to **AI Analysis** and **AI Suggestions**.
6. Search for ID **83168** (Digital Barcode Search).
7. Click **"Generate Script"** → Show automated test.

### Say:
> "The problem: **change one button ID, 50 tests break.** Traditional QA spends 3 hours fixing selectors. We use AI to handle the obvious ones.
>
> But we go deeper. Look at this AOMA test (ID 49524). The system performs **AI Analysis**—it understands technical edge cases like wav duration mismatches. 
> 
> It provides **Success Patterns**, teaching us how to make the test more stable. And with one click? We generate the logic into a full Playwright script. 
> 
> **AI handles the certainty. Humans handle the nuance.**"

**Insight:** *"The goal isn't replacing QA engineers. It's letting them focus on judgment calls instead of mechanical updates."*

**Catchphrase:** *"Confidence-based automation. AI handles certainty. Humans handle nuance."*

---

## 🎬 CLOSING (5:15-5:45)

### Do:
- Return to Chat tab
- Gesture at interface

### Say:
> "Three pillars, one system:
>
> **Chat** surfaces knowledge. **Curate** improves it with human expertise. **Test** applies those same learning principles to infrastructure.
>
> They feed each other. Better curation → better retrieval. Better tests → fewer interruptions. Fewer interruptions → more time to curate.
>
> It's not about replacing humans. It's about **letting each do what they're best at**, and learning from each other."

**Final line:** *"That's The Betabase. Questions?"*

---

## ⚡ PRE-RECORDING CHECKLIST

### Environment:
- [ ] Dev server running: `infisical run --env=dev -- pnpm dev`
- [ ] Browser at: `http://localhost:3000`
- [ ] No console errors

### Recording Setup:
- [ ] Sony M3 headphones connected (mic)
- [ ] Cmd+Shift+5 ready
- [ ] Monitor 2 selected
- [ ] Browser fullscreen, bookmarks hidden

### Warm-up (Run These First):
```
Show me The Betabase multi-tenant database architecture
What are the steps to link a product to a master in AOMA?
How do I upload and archive digital assets in AOMA from preparation to storage?

# Test Pillar IDs:
49524 (AI Analysis)
58054 (Success Patterns)
83168 (Script Generation)
```

---

## 🎯 RECORDING STRATEGY

**Tiny chunks (5-15 sec each):**
1. Record one segment
2. Nail it (1-3 takes max)
3. NEVER look back
4. Move to next segment

**Refresh browser between segments** if needed (second message bug workaround)

**CapCut assembly:** Import all clips, trim dead space, add overlays, export!

---

**Total Script: 5:45**  
**After editing: ~4:30**  
**Perfect for demo!**

