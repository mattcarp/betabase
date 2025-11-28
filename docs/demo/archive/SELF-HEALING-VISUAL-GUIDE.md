# Self-Healing Test Viewer - Visual Guide

**Quick reference for demo recording and CapCut editing**

---

## Component Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Self-Healing Test Monitor                          [Configure] │
│  AI-powered test maintenance and automatic failure recovery      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │  Total   │ │Auto-Healed│ │ Pending  │ │ Success  │ │  Avg   ││
│  │  Tests   │ │          │ │  Review  │ │   Rate   │ │  Heal  ││
│  │  1,247   │ │  1,175   │ │    18    │ │  94.2%   │ │  4.2s  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                                   │
├─────────────────────────────┬─────────────────────────────────────┤
│  ACTIVE HEALING QUEUE       │  HEALING DETAILS                   │
│                             │                                     │
│  ┌─────────────────────┐   │  Visual Workflow:                  │
│  │ ✅ Login Flow       │   │                                     │
│  │    Submit Button    │   │  🐛 Test Failure Detected          │
│  │    95% confidence   │   │  ↓  Selector not found             │
│  │    15 min ago       │◄──┼─ ✨ AI Analysis                    │
│  └─────────────────────┘   │  ↓  1 DOM change detected          │
│                             │  🔧 Auto-Healing Applied           │
│  ┌─────────────────────┐   │  ↓  Selector update strategy       │
│  │ ⚠️  Dashboard       │   │  ✅ Healing Successful             │
│  │    User Profile     │   │     95% confidence                 │
│  │    78% confidence   │   │                                     │
│  │    5 min ago        │   │  Code Changes:                     │
│  └─────────────────────┘   │  ❌ Before:                        │
│                             │     button[data-testid="submit"]   │
│  ┌─────────────────────┐   │  ↓                                 │
│  │ 🔄 Search Input     │   │  ✅ After:                         │
│  │    Field Focus      │   │     button[data-testid="login"]    │
│  │    92% confidence   │   │                                     │
│  │    Just now         │   │  DOM Changes:                      │
│  └─────────────────────┘   │  • Type: selector                  │
│                             │  • Confidence: 95%                 │
│                             │  • Before: submit-btn              │
│                             │  • After: login-submit             │
│                             │                                     │
│                             │  Metadata:                         │
│                             │  • Execution Time: 3.8s            │
│                             │  • Retry Count: 0                  │
│                             │  • AI Model: Claude Sonnet 4.5     │
│                             │                                     │
│                             │  [Approve] [Reject]                │
└─────────────────────────────┴─────────────────────────────────────┘
```

---

## Color Coding Reference

### Status Colors
```
✅ Success (Green)
- Badge: bg-green-500/10, text-green-500, border-green-500/20
- Icon: CheckCircle (green)
- Use for: Automatically healed tests

⚠️  Review (Yellow)
- Badge: bg-yellow-500/10, text-yellow-500, border-yellow-500/20
- Icon: AlertTriangle (yellow)
- Use for: Low confidence, needs human approval

🔄 Analyzing (Blue)
- Badge: bg-blue-500/10, text-blue-500, border-blue-500/20
- Icon: RefreshCw (blue, animated spin)
- Use for: Currently processing

❌ Failed (Red)
- Badge: bg-red-500/10, text-red-500, border-red-500/20
- Icon: XCircle (red)
- Use for: Healing rejected or failed
```

### Workflow Step Icons
```
🐛 Step 1: Bug icon (red) - Test Failure Detected
✨ Step 2: Sparkles icon (blue) - AI Analysis
🔧 Step 3: Wrench icon (purple) - Auto-Healing Applied
✅ Step 4: CheckCircle (green) or ⚠️ AlertTriangle (yellow) - Result
```

---

## Key Visual Elements

### Stats Grid (Top)
- **Layout**: 6 cards in responsive grid (2 cols mobile, 3 cols tablet, 6 cols desktop)
- **Height**: Auto, compact
- **Icons**: Top-right corner of each card
- **Numbers**: Large, bold (text-2xl)
- **Labels**: Small, muted (text-xs)

### Healing Queue (Left Panel)
- **Width**: 50% of container
- **Scroll**: ScrollArea with 600px height
- **Items**: Rounded cards with hover effect
- **Selected**: Ring-2 ring-purple-500
- **Spacing**: 3-unit gap between items

### Healing Details (Right Panel)
- **Width**: 50% of container
- **Scroll**: ScrollArea with 600px height
- **Sections**: Spaced by 6 units
- **Workflow**: Vertical timeline with dashed connector lines

---

## Demo Camera Angles (CapCut)

### Shot 1: Stats Grid (3:52-4:05)
```
┌─────────────────────────────────────────┐
│  [Zoom 1.5x on entire stats grid]      │
│  Pan slowly left to right               │
│  Highlight each metric card briefly     │
└─────────────────────────────────────────┘
Duration: 13 seconds
```

### Shot 2: Healing Queue (4:05-4:10)
```
┌─────────────────────────────────────────┐
│  [Focus on left panel]                  │
│  Highlight "Login Flow" item            │
│  Show cursor hovering over item         │
│  Click to select                        │
└─────────────────────────────────────────┘
Duration: 5 seconds
```

### Shot 3: Visual Workflow (4:10-4:25)
```
┌─────────────────────────────────────────┐
│  [Zoom 2x on workflow section]         │
│  Highlight each step sequentially:      │
│  - Bug icon (2s)                        │
│  - Sparkles icon (3s)                   │
│  - Wrench icon (3s)                     │
│  - CheckCircle (2s)                     │
│  Show dashed connectors between steps   │
└─────────────────────────────────────────┘
Duration: 15 seconds
```

### Shot 4: Code Diff (4:25-4:35)
```
┌─────────────────────────────────────────┐
│  [Zoom 1.5x on code diff section]      │
│  Highlight "Before" code in red (3s)    │
│  Show arrow transition (1s)             │
│  Highlight "After" code in green (3s)   │
│  Pan to DOM changes detail (3s)         │
└─────────────────────────────────────────┘
Duration: 10 seconds
```

### Shot 5: HITL Approval (4:40-4:55)
```
┌─────────────────────────────────────────┐
│  Click "Dashboard Profile" in queue     │
│  [Zoom on approval buttons]             │
│  Add glow effect to buttons             │
│  Overlay text: "Human-in-the-Loop"      │
│  Show confidence score (78%)            │
└─────────────────────────────────────────┘
Duration: 15 seconds
```

---

## Text Overlays for CapCut

### Overlay 1 (3:55)
```
┌──────────────────────────┐
│  94% Auto-Healed         │
│  Just 4.2s Average       │
└──────────────────────────┘
Position: Top-right
Duration: 3 seconds
Font: Inter Bold, 24px
Color: White with purple glow
```

### Overlay 2 (4:15)
```
┌──────────────────────────┐
│  AI-Powered              │
│  Self-Healing Workflow   │
└──────────────────────────┘
Position: Top-center
Duration: 5 seconds
Font: Inter Bold, 28px
Color: White with blue glow
```

### Overlay 3 (4:30)
```
┌──────────────────────────┐
│  Selector Update         │
│  95% Confidence          │
└──────────────────────────┘
Position: Bottom-right
Duration: 3 seconds
Font: Inter Medium, 20px
Color: White with green glow
```

### Overlay 4 (4:50)
```
┌──────────────────────────┐
│  Human-in-the-Loop       │
│  Quality Control         │
└──────────────────────────┘
Position: Center
Duration: 5 seconds
Font: Inter Bold, 32px
Color: White with yellow glow
```

---

## Cursor Highlights

Use cursor ring effect (if available in CapCut) for:

1. **Stats Grid** - Hover over "Auto-Healed" card (green)
2. **Healing Queue** - Click "Login Flow" item
3. **Workflow** - Point to each step icon
4. **Code Diff** - Underline selector changes
5. **Approval Buttons** - Hover over "Approve Healing"

---

## Transition Effects

### Between Sections
- **Chat → Testing Tab**: Slide left (0.5s)
- **Stats → Queue**: Pan camera right (1s)
- **Queue → Workflow**: Smooth zoom in (0.3s)
- **Workflow → Code**: Dissolve (0.2s)
- **Code → HITL**: Fade (0.3s)

### Within Workflow
- **Step to Step**: None (let dashed line show connection)
- **Before → After Code**: Arrow wipe (0.5s)

---

## Audio Cues

### Background Music
- Volume: -20dB
- Style: Subtle tech/corporate
- Fade in: 0s
- Fade out: 5:00

### Voiceover Sync Points
- **3:52** - "94% of test failures..."
- **4:10** - "The workflow is completely visual..."
- **4:30** - "AI detected the selector change..."
- **4:45** - "Low confidence changes require review..."

---

## Common Pitfalls to Avoid

### Visual
- ❌ Don't zoom too fast (causes motion sickness)
- ❌ Don't skip showing the full workflow
- ❌ Don't hide the confidence percentages
- ❌ Don't rush through code diff

### Timing
- ❌ Don't spend more than 15s on stats
- ❌ Don't linger on analyzing status (it's not the hero)
- ❌ Don't skip HITL approval demo
- ❌ Don't go over 90 seconds total

### Content
- ❌ Don't mention "mock data"
- ❌ Don't explain TypeScript types
- ❌ Don't dive into AI model details
- ❌ Don't promise features not built

---

## Final Check Before Recording

- [ ] Component renders without errors
- [ ] All 3 mock healing attempts visible
- [ ] Stats show correct numbers (1,247 total, 94.2% success)
- [ ] Clicking items switches detail panel
- [ ] Code diff displays correctly
- [ ] Approval buttons are visible
- [ ] Scrolling works smoothly
- [ ] Colors match design system

---

## Quick Demo Script

```
[3:50] "Let's see our self-healing test monitor in action."

[3:52] "Over 1,200 tests monitored, 94% automatically healed."

[4:05] "Here's a recent healing - login button selector changed."

[4:10] "Watch the workflow: failure detected..."

[4:15] "...AI analyzes the DOM change..."

[4:20] "...healing applied automatically..."

[4:23] "...and test passes with 95% confidence."

[4:30] "The code diff shows exactly what changed."

[4:40] "Complex changes get human review."

[4:45] "QA experts approve or reject with full context."

[4:55] "This is how we maintain quality at scale."
```

---

_Visual guide for SOTA Northstar Demo recording_
_Last updated: 2025-11-23_
