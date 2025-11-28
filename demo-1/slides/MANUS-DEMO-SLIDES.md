# 🎨 SIAM Demo - Manus Slides Deck
## Chat→Curate→Fix: Multi-Tenant Knowledge Management

**Total Slides**: 7 | **Style**: Dark, technical, clean | **Purpose**: Support 7-minute demo

---

## 📐 Global Style Guide

### Color Palette:
- **Background**: #1a1a1a (dark charcoal)
- **Primary text**: #ffffff (white)
- **Secondary text**: #9ca3af (gray-400)
- **Accent 1**: #3b82f6 (blue)
- **Accent 2**: #8b5cf6 (purple)
- **Success**: #10b981 (green)

### Typography:
- **Headings**: Inter Bold, 72pt
- **Subheadings**: Inter SemiBold, 48pt
- **Body**: Inter Regular, 32pt
- **Captions**: Inter Regular, 24pt

### Layout:
- **Margins**: 80px all sides
- **Alignment**: Left-aligned for text, centered for diagrams
- **Spacing**: Generous white space

---

## SLIDE 1: Title Card

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│                                             │
│              [Pulsating icon]               │
│                                             │
│      SIAM: Chat → Curate → Fix             │
│                                             │
│   Multi-Tenant Knowledge Management         │
│        with Human-in-the-Loop               │
│                                             │
│                                             │
│    Matt Carpenter                           │
│    November 6, 2025                         │
│                                             │
└─────────────────────────────────────────────┘
```

### Elements:
- **Icon**: Animated brain or network (subtle pulse, 2s loop)
- **Title**: 72pt, white, centered
- **Subtitle**: 48pt, gray-400, centered
- **Your name**: 32pt, white, centered
- **Date**: 24pt, gray-400, centered

### Animation:
- Fade in from black (1s)
- Icon pulse continuous
- Text enters with slight fade up (0.5s delay between lines)

### Duration: 5 seconds (during intro voiceover)

---

## SLIDE 2: Multi-Tenant Context Overlay

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│  🏢 Sony Music                              │
│    └─ 📂 PDE                                │
│       └─ 🎯 AOMA                            │
│                                             │
│  3-Tier Hierarchy                           │
│  Complete Tenant Isolation                  │
│                                             │
│                                             │
│                                             │
│                 [Semi-transparent]          │
└─────────────────────────────────────────────┘
```

### Elements:
- **Hierarchy tree**: Visual representation with emojis
- **Organization**: "Sony Music" (blue)
- **Division**: "PDE" (purple)
- **App**: "AOMA" (green)
- **Callout box**: "3-Tier Hierarchy, Complete Tenant Isolation"

### Position on Screen:
- Top-right corner overlay
- 400x300px
- 70% opacity background
- Remains visible during Chat demo screen recording

### Purpose:
- Reminds viewer of multi-tenant context
- Shows where this demo fits in the architecture

### Duration: 90 seconds (entire Chat demo)

---

## SLIDE 3: RLHF Workflow Diagram

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│                                             │
│    Chat → Curate → Vector Store             │
│     ↑                           ↓           │
│     └───────── Update ──────────┘           │
│                                             │
│                                             │
│  RLHF: Reinforcement Learning               │
│        from Human Feedback                  │
│                                             │
│  Users improve the system over time         │
│                                             │
└─────────────────────────────────────────────┘
```

### Elements:
- **Flow arrows**: Animated, blue glow
- **Chat box**: Icon + label
- **Curate box**: Icon + label (feedback symbol)
- **Vector Store**: Database icon + label
- **Loop arrow**: Purple, showing feedback cycle
- **RLHF definition**: 36pt, centered below diagram
- **Caption**: 24pt, gray-400

### Animation:
- Arrows pulse with data flow (2s loop)
- Boxes fade in sequentially (Chat → Curate → Store)
- Loop arrow animates last (clockwise trace)

### Duration: 10 seconds (transition to Curate demo)

---

## SLIDE 4: HITL Workflow Concept

### Visual Layout:
```
+---------------------------------------------+
|                                             |
|   Query -> Agent -> BREAKPOINT -> Human     |
|                          |                  |
|                    Human Reviews            |
|                          |                  |
|              Approve / Modify / Reject      |
|                          |                  |
|                   Workflow Resumes          |
|                                             |
|   Human-in-the-Loop: Runtime Oversight      |
|                                             |
+---------------------------------------------+
```

### Elements:
- **Flow diagram**: Vertical, top to bottom
- **Query icon**: Speech bubble
- **Agent icon**: Robot or brain
- **Breakpoint icon**: Pause symbol (red/orange)
- **Human icon**: Person silhouette
- **Decision diamond**: Approve/Modify/Reject paths
- **Resume arrow**: Green, bold
- **Title**: "Human-in-the-Loop: Runtime Oversight" (48pt)

### Animation:
- Flow animates like a progress bar
- Breakpoint icon pulses red (alert)
- Human icon highlights when active
- Decision paths light up sequentially

### Duration: 30 seconds (talking head transition)

---

## SLIDE 5: HITL Indicator Overlay

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│  ⚠️  HITL: Human-in-the-Loop Mode           │
│                                             │
│  Agent paused at breakpoint                 │
│  Human verification required                │
│                                             │
│                                             │
│                                             │
│                                             │
│                 [Semi-transparent]          │
└─────────────────────────────────────────────┘
```

### Elements:
- **Warning icon**: ⚠️ or 🛑 (orange/red)
- **Title**: "HITL: Human-in-the-Loop Mode" (36pt, orange)
- **Status text**: "Agent paused at breakpoint" (28pt)
- **Action text**: "Human verification required" (28pt, red)

### Position on Screen:
- Top-center banner overlay
- Full width, 150px height
- 80% opacity dark background
- Orange accent border (top edge)

### Purpose:
- Alert viewer that we're in HITL mode
- Sets context for Fix tab demo
- Creates visual distinction from Chat/Curate

### Duration: 120 seconds (entire Fix demo)

---

## SLIDE 6: Summary Card

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│                                             │
│       Chat → Curate → Fix                   │
│                                             │
│  💬 Chat                                    │
│     Ask questions, get cited answers        │
│     Grounded in proprietary knowledge       │
│                                             │
│  📝 Curate                                  │
│     Provide feedback, improve system        │
│     RLHF: Humans train the AI               │
│                                             │
│  🛠️ Fix                                     │
│     Human-in-the-loop for complex queries   │
│     Runtime oversight, not post-hoc         │
│                                             │
|  Multi-Tenant | HITL Review | RLHF          |
│                                             │
└─────────────────────────────────────────────┘
```

### Elements:
- **Header**: "Chat → Curate → Fix" (60pt, centered)
- **Three sections**: Each with icon, title, description
- **Icons**: Large (64px), colorful
- **Descriptions**: 28pt, gray-300
- **Footer badges**: 24pt, with icons, spaced evenly

### Animation:
- Sections fade in sequentially (0.5s delay)
- Icons scale in with bounce effect
- Footer badges fade in together at end

### Purpose:
- Quick visual recap
- Reinforces three-part workflow
- Shows key technologies

### Duration: 45 seconds (outro voiceover)

---

## SLIDE 7: End Card

### Visual Layout:
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│                                             │
│               Questions?                    │
│                                             │
│                                             │
│         matt@example.com                    │
│      github.com/yourusername/siam           │
│                                             │
│                                             │
│     [ Thank you for your time! ]            │
│                                             │
└─────────────────────────────────────────────┘
```

### Elements:
- **Main text**: "Questions?" (72pt, centered)
- **Contact info**: 32pt, centered, stacked
- **Thank you**: 24pt, gray-400, bottom-center
- **Optional**: QR code to repo (bottom-right)

### Animation:
- Fade in from summary slide
- Text appears with slight scale effect
- Cursor blinks at end (type effect)

### Purpose:
- Clear ending
- Provides contact for follow-up
- Professional close

### Duration: 5 seconds (end of outro)

---

## 🎬 Slide Timing Chart

| Slide | Type | Duration | Segment | Purpose |
|-------|------|----------|---------|---------|
| 1 | Full screen | 5s | Intro | Title card during talking head |
| 2 | Overlay | 90s | Chat demo | Context reminder |
| 3 | Full screen | 10s | Transition | RLHF concept |
| 4 | Full screen | 30s | Transition | LangGraph HITL |
| 5 | Overlay | 120s | Fix demo | HITL indicator |
| 6 | Full screen | 45s | Outro | Summary |
| 7 | Full screen | 5s | End | Contact info |

---

## 🎨 Manus-Specific Implementation Notes

### Creating Slides in Manus:

1. **Start New Presentation**:
   - Template: "Blank (Dark)"
   - Aspect ratio: 16:9
   - Resolution: 1920x1080

2. **Import Assets**:
   - Animated ERD: Use as B-roll or background element
   - Icons: Use Manus icon library or upload custom SVGs
   - Fonts: Inter (install if needed)

3. **Overlay Slides** (Slides 2 & 5):
   - In Manus: Set as "Picture-in-Picture" or "Lower Third"
   - Export as separate video clips with alpha channel
   - Composite in Adobe Premiere over screen recordings

4. **Animations**:
   - Use Manus built-in animation presets
   - Keep subtle (fade, scale, slide in)
   - Avoid distracting motion

5. **Export Settings**:
   - Format: MP4 or MOV with alpha
   - Resolution: 1920x1080
   - Frame rate: 30fps
   - Quality: High

---

## 🔗 Integration with Adobe Premiere

### How to Use These Slides:

1. **Export each slide as separate video clip** from Manus
2. **Import into Premiere** timeline
3. **Layer structure**:
   ```
   V3: Overlay slides (2, 5) - with alpha channel
   V2: Screen recordings
   V1: Talking head footage
   ```
4. **Transitions**:
   - Slide 1 → Slide 2: Cross dissolve (1s)
   - Screen recordings: Cut (no transition needed)
   - Slide 6 → Slide 7: Fade (0.5s)

---

## 💡 Pro Tips for Manus Slides

1. **Keep it simple** - Less is more for technical demos
2. **Use high contrast** - Dark background, light text
3. **Test readability** - View at 50% size to simulate small screens
4. **Export early** - Create drafts, import to Premiere, test timing
5. **Iterate** - Slides should support narration, not compete with it

---

## ✅ Slide Checklist

Before recording:
- [ ] All 7 slides created in Manus
- [ ] Animations tested (not too distracting)
- [ ] Text readable at 1080p
- [ ] Colors match style guide
- [ ] Overlay slides have alpha channel
- [ ] Full-screen slides exported as MP4
- [ ] Test imports into Adobe Premiere
- [ ] Timing verified with script

---

## 📦 Export Deliverables

After creating slides in Manus, you should have:

```
/demo-1/slides/
  /manus-project/
    - siam-demo.manus (project file)
  /exports/
    - slide-01-title-card.mp4 (5s)
    - slide-02-context-overlay.mov (90s, alpha)
    - slide-03-rlhf-diagram.mp4 (10s)
    - slide-04-langgraph-hitl.mp4 (30s)
    - slide-05-hitl-indicator.mov (120s, alpha)
    - slide-06-summary-card.mp4 (45s)
    - slide-07-end-card.mp4 (5s)
```

---

## 🎯 Visual Consistency Rules

### Across All Slides:

1. **Typography**:
   - Same font family (Inter)
   - Consistent sizing hierarchy
   - Same line height (1.5)

2. **Colors**:
   - Use only palette colors
   - Blue for Chat
   - Purple for Curate
   - Orange/Red for Fix/HITL
   - Green for success/approval

3. **Spacing**:
   - 80px margins (all sides)
   - 40px between elements
   - 60px between sections

4. **Icons**:
   - Same style (line art or filled, not mixed)
   - Same stroke width (2-3px)
   - Same size (64px for main icons, 32px for inline)

5. **Animations**:
   - Same duration (0.3-0.5s)
   - Same easing (ease-out)
   - Never animate multiple elements simultaneously

---

**These slides will make your demo look PROFESSIONAL and POLISHED!** 🎨✨

**Next step**: Create the slides in Manus and export them, then integrate into your Adobe Premiere timeline!

