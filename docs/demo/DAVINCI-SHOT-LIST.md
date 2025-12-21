# DaVinci Resolve Shot List & Timing Guide

Practical guide for recording and editing the 5-minute demo.

---

## Recording Setup

**Screen**: 1920x1080 or 2560x1440
**Browser**: Chrome, DevTools closed
**URL**: http://localhost:3000
**Font size**: Default or slightly larger (Cmd+Plus if needed)

---

## Shot List

### Shot 1: Opening (0:00-0:30)

**What to record:**
- App landing on Chat tab
- Brief pause showing the interface

**DaVinci Resolve overlay text:**
```
Three things that solve each other
```

**Talking points:**
- AI that knows our domain
- Feedback that makes it smarter
- Tests that fix themselves

---

### Shot 2: Chat Query (0:30-1:15)

**What to record:**
- Type: "What's the AOMA 2 authentication flow?"
- Wait for response to stream
- Hover over inline citation (shows source)

**DaVinci Resolve overlay text:**
```
45,399 domain-specific vectors
```

Then:
```
Sources shown inline
```

**Talking points:**
- Generic AI would hallucinate this
- We have actual documentation indexed
- Click citation to see the source

---

### Shot 3: Diagram Offer (1:15-2:00)

**What to record:**
- Response includes "Would you like to see a diagram?"
- Click to show Mermaid diagram
- Zoom and pan the diagram

**DaVinci Resolve overlay text:**
```
Diagram generated on demand
```

**Talking points:**
- Visual workflow from text
- Interactive, not a static image
- (Pre-rendered in background)

---

### Shot 4: Navigate to Curate (2:00-2:15)

**What to record:**
- Click Curate tab
- Tab loads with content

**No overlay needed** - transition shot

---

### Shot 5: Feedback Mechanism (2:15-2:45)

**What to record:**
- Show thumbs up/down on a response
- Show star rating
- Type a correction: "Actually, it uses Cognito, not generic OAuth"

**DaVinci Resolve overlay text:**
```
Corrections improve future answers
```

**Talking points:**
- When AI is wrong, humans correct it
- Those corrections improve retrieval

---

### Shot 6: Curator Queue (2:45-3:30)

**What to record:**
- Show queue of items awaiting review
- Click one item to expand
- Show approve/reject buttons

**DaVinci Resolve overlay text:**
```
Curator queue for review
```

Then:
```
One expert correction helps thousands of queries
```

**Talking points:**
- Items awaiting curator review
- Approve or reject workflow
- Multiplier effect of expert knowledge

---

### Shot 7: Navigate to Test (3:30-3:45)

**What to record:**
- Click Test tab
- Home dashboard loads with metrics

**No overlay needed** - transition shot

---

### Shot 8: Test Dashboard (3:45-4:15)

**What to record:**
- Show key metrics (pass rate, test count)
- Click Self-Healing tab
- Show healing queue

**DaVinci Resolve overlay text:**
```
94.2% auto-heal success rate
```

**Talking points:**
- Change one button ID, 47 tests break
- That's your "blast radius"
- AI proposes selector fixes

---

### Shot 9: Self-Healing Detail (4:15-4:45)

**What to record:**
- Click a healing item
- Show before/after selector comparison
- Show tier badge (Tier 1/2/3)
- Click approve or reject

**DaVinci Resolve overlay text:**
```
Tier 1: Auto-apply
Tier 2: Human review
Tier 3: Architect decision
```

**Talking points:**
- Tiered based on confidence
- High confidence = auto-fix
- Uncertain = flag for human

---

### Shot 10: Closing (4:45-5:00)

**What to record:**
- Return to Chat tab (or stay on Test)
- Brief pause

**DaVinci Resolve overlay text:**
```
The loop: Better chat → Fewer corrections → Better retrieval → Fewer test failures
```

**Talking points:**
- How they connect
- It's a virtuous cycle

---

## DaVinci Resolve Edit Checklist

```
[ ] Import screen recording
[ ] Trim dead time (typing pauses, loading)
[ ] Add text overlays at marked timestamps
[ ] Add transitions between major sections (simple cuts or fades)
[ ] Review audio levels if voiceover added
[ ] Export at 1080p or 4K
[ ] Total runtime: 4:30-5:30
```

---

## Text Overlay Style

**Font**: Clean sans-serif (SF Pro, Inter, or similar)
**Position**: Bottom-left or top-left
**Background**: Semi-transparent dark (#0a0a0a at 80%)
**Text color**: White (#fafafa)
**Duration**: 3-5 seconds per overlay

---

## Backup Shots (if time)

If something goes wrong or you want variety:

**Backup Query:**
```
How does the Offering lifecycle work in AOMA?
```

**Anti-hallucination test:**
```
Does AOMA have a blockchain integration?
```
(Shows honest "I don't know")

---

## Recording Tips

1. **Pre-cache everything** - Run DEMO-QUERIES.md warm-up first
2. **Record in segments** - Easier to re-do one section than the whole thing
3. **Leave padding** - Extra 2-3 seconds at start/end of each shot
4. **Check console** - No red errors visible in DevTools
5. **Hide bookmarks bar** - Cleaner look
6. **Fullscreen browser** - Cmd+Shift+F in Chrome

---

## Segment Timing Summary

| Segment | Duration | Cumulative |
|---------|----------|------------|
| Opening | 0:30 | 0:30 |
| Chat Query | 0:45 | 1:15 |
| Diagram | 0:45 | 2:00 |
| Curate Transition | 0:15 | 2:15 |
| Feedback | 0:30 | 2:45 |
| Curator Queue | 0:45 | 3:30 |
| Test Transition | 0:15 | 3:45 |
| Dashboard | 0:30 | 4:15 |
| Self-Healing | 0:30 | 4:45 |
| Closing | 0:15 | 5:00 |

**Total: ~5:00**

---

*Last updated: November 28, 2025*
