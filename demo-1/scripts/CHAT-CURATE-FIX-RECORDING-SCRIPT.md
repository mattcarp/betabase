# 🎬 SIAM Chat→Curate→Fix Demo Script
## Human-in-the-Loop Knowledge Management

**Duration**: ~7 minutes | **Tone**: Technical, colleague-to-colleague | **Tools**: Manus + Adobe Premiere

---

## 🎯 Demo Philosophy

**What this IS**:
- Technical walkthrough for colleagues
- Real AOMA scenario with multi-tenant context
- Shows HITL (Human-in-the-Loop) with LangGraph 1.0
- Demonstrates feedback loop for RLHF

**What this IS NOT**:
- Marketing pitch
- Sales demo
- Feature showcase
- Hype or buzzwords

---

## 🎬 SEGMENT 1: Talking Head Intro (45 seconds)

### 📊 Manus Slide: Title Card
```
Slide Layout:
- Clean, dark background
- Title: "SIAM: Chat → Curate → Fix"
- Subtitle: "Multi-Tenant Knowledge Management with HITL"
- Your name, date
```

### 🎙️ Your Script:

**[Look at camera, friendly smile]**

"Hey everyone, thanks for taking the time to look at this."

"Today I want to walk you through SIAM's workflow for knowledge management."

"What makes this interesting is the **human-in-the-loop** approach."

**[Slight pause, confident]**

"We have three main interfaces:"

- **Chat** - where users ask questions
- **Curate** - where they give feedback on answers
- **Fix** - where we handle complex queries that need human oversight

**[Gesture to screen]**

"I'm going to use a real AOMA scenario to show you how this works."

"Let's say I'm a product manager at Sony Music, and I need to create an offering in AOMA."

**[Confident close]**

"Watch how the system handles this..."

---

### 🎬 Premiere Notes:
- **Camera**: Waist-up shot, good lighting
- **Background**: Soft blur or bookshelf
- **Lower third**: Add your name/title at 5s mark
- **B-roll option**: Show animated ERD pulsating (3 seconds) as transition out

---

## 🖥️ SEGMENT 2: Chat Tab - Initial Query (90 seconds)

### 📊 Manus Slide: Screen Recording + Context
```
Slide Layout:
- Minimal overlay at top-right
- Text: "CONTEXT: Sony Music / PDE / AOMA"
- Show multi-tenant hierarchy icon
```

### 🎙️ Your Narration (over screen recording):

**[Screen shows Chat tab, cursor hovers]**

"Okay, so I'm in the Chat interface."

"Notice at the top: I'm in the **Sony Music** organization, **PDE** division, working with **AOMA** knowledge."

**[Start typing query slowly]**

*Type:* `How do I create an offering in AOMA?`

**[Press Enter, pause as it processes]**

"This query hits our vector store..."

**[Response starts streaming]**

"...and it's pulling from about 50 pages of proprietary AOMA documentation."

**[Point to citations as they appear]**

"See these source citations? That's critical for trust."

"No hallucinations - every answer is grounded in actual documentation."

**[Let response finish, scroll through it]**

"Okay, so it's giving me steps: Create the offering, add territories, set distribution rights..."

**[Pause, look thoughtful]**

"But here's the interesting part..."

"What if this answer is **incomplete**?"

"What if I know something the documentation doesn't cover?"

**[Confident transition]**

"That's where Curate comes in."

---

### 🎬 Premiere Notes:
- **Screen recording**: Full screen, 1920x1080
- **Cursor highlight**: Add subtle circle around cursor for clarity
- **Zoom in**: When pointing to citations, zoom to 110% briefly
- **Pacing**: Don't rush the streaming response - let it feel real
- **Audio**: Remove any keyboard typing sounds in post

---

## 💬 SEGMENT 3: Curate Tab - Feedback Loop (90 seconds)

### 📊 Manus Slide: Workflow Diagram
```
Slide Layout:
- Show: Chat → Curate → Vector Store (loop)
- Arrows with icons
- Text: "RLHF: Reinforcement Learning from Human Feedback"
```

### 🎙️ Your Narration:

**[Click Curate tab]**

"Alright, switching to the Curate tab."

**[Show the conversation history/feedback interface]**

"This is where users can give feedback on the responses they received."

**[Hover over the previous AOMA query]**

"Here's that conversation we just had about creating offerings."

**[Click feedback button or thumbs up/down]**

"I can mark this as helpful, not helpful, or provide specific corrections."

**[Type feedback]**

*Example feedback text:*
```
The answer is mostly correct, but it doesn't mention that you need 
to get approval from Label Services before creating offerings for 
certain territories. This is a critical step that's missing.
```

**[Submit feedback]**

"This feedback goes directly into our system."

"Over time, this creates a **reinforcement learning loop**."

**[Confident, technical tone]**

"We're not just throwing documents at an LLM and hoping for the best."

"We're building a feedback mechanism where **humans improve the system**."

**[Gesture to screen]**

"The vector store gets updated, the knowledge improves..."

"...and future users get better answers."

**[Pause]**

"But what about queries that are **too complex** for automation?"

"Queries that need a human to step in **right now**?"

**[Transition]**

"That's the Fix tab - human-in-the-loop at query time."

---

### 🎬 Premiere Notes:
- **Split screen option**: Show your talking head in corner while screen records
- **Highlight feedback text**: Add subtle border or glow when typing feedback
- **B-roll insert**: 2-second animation of feedback loop (arrows cycling)
- **Text overlay**: When you say "RLHF", show expanded term briefly

---

## 🎬 SEGMENT 4: Talking Head Transition (30 seconds)

### 📊 Manus Slide: LangGraph HITL Concept
```
Slide Layout:
- Simple diagram: Query → Agent → [BREAKPOINT] → Human → Resume
- Text: "LangGraph 1.0: Human-in-the-Loop at Runtime"
- No jargon, clean visual
```

### 🎙️ Your Script:

**[Back to camera, energetic]**

"Okay, so Chat is for questions, Curate is for feedback."

"But Fix is where it gets really interesting."

**[Lean in slightly]**

"This is powered by LangGraph 1.0's **human-in-the-loop** capabilities."

"When a query is too complex, too ambiguous, or potentially risky..."

**[Gesture]**

"...the system **pauses** and asks a human to step in."

"It's like a breakpoint in code, but for AI agents."

**[Confident]**

"Let me show you what that looks like..."

---

### 🎬 Premiere Notes:
- **Camera**: Same setup as intro
- **Energy**: Slightly more energetic than intro (building excitement)
- **Graphics**: Overlay the LangGraph diagram from Manus as you explain
- **Pacing**: Fast but clear - this is the hook for the next segment

---

## 🛠️ SEGMENT 5: Fix Tab - HITL in Action (120 seconds)

### 📊 Manus Slide: Screen Recording + HITL Indicator
```
Slide Layout:
- Top overlay: "HITL: Human-in-the-Loop Mode"
- Icon: Pause symbol or hand icon
```

### 🎙️ Your Narration:

**[Click Fix tab]**

"Alright, here's the Fix interface."

**[Show list of queries awaiting human review]**

"These are queries that the system flagged for human oversight."

**[Point to one]**

"Let's look at this one..."

*Example query shown:*
```
"Update all offering territories for artists signed after 2023 
to include streaming rights for China and exclude physical distribution."
```

**[Read it slowly]**

"Okay, so this query is asking to update **all** offerings..."

"...for a specific cohort of artists..."

"...with complex territory and rights changes."

**[Serious tone]**

"This is **high-risk**."

"If the system got this wrong, we could have licensing issues, legal problems..."

**[Click into the query details]**

"So the system paused at a **breakpoint**."

**[Show the LangGraph state/reasoning]**

"It analyzed the query, recognized the complexity and risk..."

"...and said: 'I need a human to verify this.'"

**[Scroll through the system's reasoning]**

"Look at what it's showing me:"

- The query intent
- The proposed actions
- The data that would be affected
- The confidence level (low)

**[Thoughtful pause]**

"Now I can make a decision:"

**[Hover over options: Approve / Modify / Reject]**

- **Approve**: Let the agent proceed
- **Modify**: Change the query parameters
- **Reject**: Don't execute, send back to user

**[Click Modify]**

"In this case, I'm going to modify it."

*Type modification:*
```
Only update offerings for artists signed by Columbia Records 
after Jan 1, 2023. Exclude catalog artists.
```

**[Submit]**

"Now the agent will resume with my human guidance."

**[Confident close]**

"This is human-in-the-loop at runtime."

"Not just feedback after the fact - **active oversight** during execution."

---

### 🎬 Premiere Notes:
- **Screen recording**: Full screen, show all UI details
- **Cursor highlight**: Very important here - show clicking clearly
- **Zoom**: When showing LangGraph reasoning, zoom to 120%
- **Text overlays**: 
  - "HIGH RISK QUERY" when you read it
  - "BREAKPOINT TRIGGERED" when showing pause
  - "HUMAN VERIFICATION REQUIRED" 
- **Pacing**: Slow down here - this is the most technical part
- **Audio**: Your voice should be calm, confident, explaining clearly

---

## 🎬 SEGMENT 6: Talking Head Outro (45 seconds)

### 📊 Manus Slide: Summary Card
```
Slide Layout:
- Title: "Chat → Curate → Fix"
- Three icons with one-line descriptions:
  • Chat: Ask questions, get cited answers
  • Curate: Provide feedback, improve system
  • Fix: Human-in-the-loop for complex queries
- Bottom text: "Multi-Tenant | LangGraph | RLHF"
```

### 🎙️ Your Script:

**[Back to camera, relaxed smile]**

"So that's the workflow."

**[Count on fingers]**

"**Chat** - users ask questions, get answers grounded in proprietary knowledge."

"**Curate** - users give feedback, creating a reinforcement learning loop."

"**Fix** - for high-risk or complex queries, humans step in at runtime."

**[Pause, more serious]**

"What makes this work is the **multi-tenant** architecture."

"AOMA knowledge stays isolated from other Sony Music systems."

"PDE's data doesn't leak into Label Services."

**[Confident]**

"It's not just a chatbot."

"It's a **knowledge management system** with human oversight built in."

**[Look directly at camera]**

"Happy to answer any questions, or show you the code behind this."

**[Friendly smile]**

"Thanks for watching!"

---

### 🎬 Premiere Notes:
- **Camera**: Same as intro, consistent lighting
- **B-roll options**: 
  - Show animated ERD pulsating (5 seconds)
  - Show code snippets scrolling (3 seconds)
  - Show multi-tenant diagram (3 seconds)
- **End card**: Add contact info, GitHub link, or "Questions?" slide
- **Music**: Optional subtle background music (fade in during outro)

---

## 📋 Complete Query List (Copy/Paste Ready)

Keep these on your second monitor during recording:

```
=== CHAT TAB QUERY ===
How do I create an offering in AOMA?

=== CURATE TAB FEEDBACK ===
The answer is mostly correct, but it doesn't mention that you need 
to get approval from Label Services before creating offerings for 
certain territories. This is a critical step that's missing.

=== FIX TAB EXAMPLE QUERY (already in system) ===
Update all offering territories for artists signed after 2023 
to include streaming rights for China and exclude physical distribution.

=== FIX TAB MODIFICATION ===
Only update offerings for artists signed by Columbia Records 
after Jan 1, 2023. Exclude catalog artists.
```

---

## ⏱️ Timing Breakdown

| Segment | Duration | Type | Content |
|---------|----------|------|---------|
| Intro | 0:45 | Talking head | Set context, explain workflow |
| Chat demo | 1:30 | Screen recording | Show query, response, citations |
| Curate demo | 1:30 | Screen recording | Show feedback mechanism |
| Transition | 0:30 | Talking head | Explain HITL concept |
| Fix demo | 2:00 | Screen recording | Show breakpoint, human decision |
| Outro | 0:45 | Talking head | Recap, closing |
| **TOTAL** | **7:00** | Mixed | Technical walkthrough |

---

## 🎬 Adobe Premiere Timeline Structure

```
Timeline (7 minutes total):

[00:00-00:45] INTRO
- Talking head footage
- Lower third at 00:05
- Fade in from black

[00:45-02:15] CHAT DEMO
- Manus slide (5s) - Context overlay
- Screen recording (85s)
- B-roll transition (3s) - Animated ERD

[02:15-03:45] CURATE DEMO
- Manus slide (5s) - RLHF diagram
- Screen recording (85s)

[03:45-04:15] TRANSITION
- Talking head footage
- LangGraph diagram overlay

[04:15-06:15] FIX DEMO
- Manus slide (5s) - HITL indicator
- Screen recording (115s)
- Text overlays for emphasis

[06:15-07:00] OUTRO
- Talking head footage
- Summary slide overlay
- B-roll montage (10s)
- End card (5s)
- Fade to black
```

---

## 🎨 Visual Style Guide

### Color Palette:
- **Background**: Dark (#1a1a1a)
- **Primary**: Blue (#3b82f6)
- **Accent**: Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)

### Text Overlays:
- **Font**: Inter or SF Pro (clean, readable)
- **Size**: 36pt for main text, 24pt for subtitles
- **Position**: Lower third or top right (never center-cover)
- **Animation**: Fade in 0.3s, fade out 0.2s

### B-roll Inserts:
- **Duration**: 2-5 seconds max
- **Transition**: Cross dissolve (0.5s)
- **Purpose**: Visual break, not distraction

---

## 🎤 Audio Production Notes

### Voice Recording:
- **Mic**: Shure SM-B or similar
- **Environment**: Quiet room, minimal echo
- **Tone**: Conversational, confident, not rehearsed
- **Pacing**: Medium speed, clear articulation
- **Energy**: Engaged but not hyper

### Post-Production:
- **Normalize**: -3dB peak
- **Remove**: Mouth clicks, breaths (subtle)
- **EQ**: Slight boost at 2-5kHz (clarity)
- **Compression**: Gentle 2:1 ratio
- **Noise gate**: -40dB threshold

### Background Music (Optional):
- **Type**: Subtle ambient/electronic
- **Volume**: -24dB (barely noticeable)
- **Position**: Intro/outro only
- **Fade**: In 2s, out 3s

---

## 📦 Assets Needed

### Created:
- ✅ Animated ERD (in `/demo-1/assets/diagrams/`)
- ✅ Demo script (this file)
- ✅ Query list (above)

### To Create:
- [ ] **Manus slides** (7 slides):
  1. Title card
  2. Multi-tenant context overlay
  3. RLHF workflow diagram
  4. LangGraph HITL concept
  5. HITL indicator overlay
  6. Summary card
  7. End card
- [ ] **Screen recordings** (3 segments):
  1. Chat tab (90s)
  2. Curate tab (90s)
  3. Fix tab (120s)
- [ ] **Talking head footage** (3 segments):
  1. Intro (45s)
  2. Transition (30s)
  3. Outro (45s)

---

## ✅ Pre-Recording Checklist

### Technical Setup:
- [ ] Localhost running (if needed for Fix tab demo)
- [ ] Manus slides prepared and tested
- [ ] Camera positioned and focused
- [ ] Lighting: 3-point setup or natural window light
- [ ] Microphone tested (levels at -12dB to -6dB)
- [ ] Screen recording software configured (1920x1080, 30fps)
- [ ] Second monitor with queries visible

### Environment:
- [ ] Quiet space (no interruptions)
- [ ] Phone on Do Not Disturb
- [ ] Slack/email closed
- [ ] Water nearby
- [ ] Background clean and professional

### Content:
- [ ] Practiced talking head segments (natural, not memorized)
- [ ] Queries tested and working
- [ ] Timing rehearsed (7 min target)
- [ ] Demo data prepared (if needed)

---

## 🚨 Troubleshooting Guide

### If Screen Recording Lags:
- Close all other applications
- Record in shorter segments
- Lower resolution to 1080p (not 4K)

### If You Flub a Line:
- Pause, take a breath
- Start the sentence over
- Easy to cut in Premiere

### If Demo Breaks:
- Say: "Let me show you what this looks like..."
- Use pre-recorded screen capture as backup
- Edit out the error in post

### If Timing Runs Long:
- Prioritize: Fix tab is the most important
- Cut: Some narration can be trimmed
- Speed: Slightly faster in Curate section

---

## 💡 Pro Tips for Recording

1. **Record talking heads separately from screen recordings** - easier to edit
2. **Over-record** - do 2-3 takes of each segment, pick best in editing
3. **Pause between segments** - gives you clean cut points
4. **Slate each segment** - say "Intro, take 1" before recording
5. **Save often** - export Adobe Premiere project after each major edit
6. **Watch with sound off** - make sure visuals tell the story
7. **Get feedback** - show a colleague before final export

---

## 🎯 Success Metrics

**You'll know this demo works if**:
- Colleagues understand Chat→Curate→Fix workflow
- HITL concept is clear and compelling
- Multi-tenant architecture makes sense
- Technical credibility established (not marketing)
- Questions asked are about **implementation** details

---

## 📁 File Organization

After recording, you should have:

```
/demo-1/
  /assets/
    /video/
      - talking-head-intro-raw.mov
      - talking-head-transition-raw.mov
      - talking-head-outro-raw.mov
      - screen-chat-tab.mov
      - screen-curate-tab.mov
      - screen-fix-tab.mov
      - broll-animated-erd.mp4
    /audio/
      - voiceover-intro.wav
      - voiceover-transition.wav
      - voiceover-outro.wav
  /slides/
    - manus-demo-slides.pptx (or Manus format)
  /scripts/
    - CHAT-CURATE-FIX-RECORDING-SCRIPT.md (this file)
    - demo-queries.txt
  /premiere/
    - siam-demo-project.prproj
    - siam-demo-FINAL.mp4
```

---

## 🚀 Next Steps

1. **Create Manus slides** (30 minutes)
2. **Record talking head segments** (30 minutes)
3. **Record screen segments** (45 minutes)
4. **Import into Adobe Premiere** (15 minutes)
5. **Edit timeline** (2 hours)
6. **Add text overlays/B-roll** (1 hour)
7. **Audio polish** (30 minutes)
8. **Export and review** (30 minutes)

**Total production time: ~6 hours**

---

**You've got this! Let's make something your colleagues will actually want to use!** 🎬✨

