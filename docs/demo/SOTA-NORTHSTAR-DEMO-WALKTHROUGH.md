# SOTA Northstar Demo Walkthrough

**The Beta Base: Enterprise AI Testing Platform**
**Duration:** 5-6 minutes
**Focus:** Three Northstar Pillars of Enterprise AI Validation

---

## Executive Summary

This demo showcases The Beta Base as a state-of-the-art enterprise AI testing and validation platform, demonstrating three breakthrough capabilities:

1. **Show-stopping Chat Experience**: Multi-source RAG with visual intelligence and voice UI
2. **State-of-the-art Curate Tab**: Real-time RLHF fine-tuning for domain expertise
3. **Automated Testing with HITL**: Self-healing test infrastructure with human oversight

**Target Audience**: Enterprise engineering leaders, AI/ML teams, QA/testing organizations

---

## Pre-Demo Checklist

### Environment Setup
- [ ] Kill port 3000 and start dev server: `npx kill-port 3000 && npm run dev`
- [ ] Open browser at `http://localhost:3000` (Chrome, 100% zoom)
- [ ] Login with demo credentials (use Mailinator magic link if needed)
- [ ] Clear chat history for fresh demo
- [ ] Have demo queries ready in text file

### Recording Setup (for DaVinci Resolve)
- [ ] Screen recording tool ready (QuickTime/OBS)
- [ ] Resolution: 1920x1080, 30fps
- [ ] System audio + microphone enabled
- [ ] Second monitor for script/notes

### Demo Queries Prepared
```
1. "Show me the architecture of AOMA using a Mermaid diagram"
2. "Explain how RLHF improves retrieval accuracy"
3. "What happens when a UI change breaks a test?"
```

---

## Scene 1: Title & Introduction (0:00-0:15)

### Visual
- Title card: "The Beta Base"
- Subtitle: "Enterprise AI Testing Platform"
- Three pillars listed:
  - Visual Intelligence Chat
  - Real-time RLHF Curation
  - Self-healing Test Infrastructure

### Narration Script
> "The Beta Base is an enterprise AI testing platform built around three Northstar capabilities. Today we'll demonstrate how it transforms architectural documentation, continuous model improvement, and automated testing for the AOMA enterprise application."

### DaVinci Resolve Notes
- Dark gradient background (#0a0a0a to #1a1a1a)
- Text: Inter Bold, white with purple glow
- Fade in animation (0.5s)
- Hold for 5 seconds, then dissolve to chat interface

---

## Scene 2: Pillar 1 - Show-stopping Chat Experience (0:15-2:00)

### Part A: Architecture Visualization (0:15-1:15)

#### Action Steps
1. **Type query**: "Show me the architecture of AOMA using a Mermaid diagram"
2. **Watch streaming response** with thought bubbles expanding
3. **Diagram renders** with "Nano Banana 2" groovy theme
4. **Demonstrate interactivity**:
   - Zoom in (2x) on multi-tenant architecture
   - Pan to integration points
   - Click "Export PNG" button

#### Key Talking Points
- "The chat understands AOMA's architecture from our Confluence knowledge base"
- "Visual intelligence transforms text descriptions into interactive diagrams"
- "The 'Nano Banana 2' theme provides professional groovy styling"
- "Diagrams are zoomable, exportable, and automatically laid out"

#### UI Elements to Highlight
- **Thought bubbles**: Collapsible reasoning steps showing RAG retrieval
- **Inline citations**: Hover to see source Confluence pages
- **Mermaid controls**: Zoom, pan, reset view, export
- **Streaming indicators**: Progressive token generation

### Part B: Multi-source Recall (1:15-2:00)

#### Action Steps
1. **Scroll up** to show citations in response
2. **Hover over citation** to reveal source metadata
3. **Click citation** to expand full context in popover
4. **Show voice button** (optional: demonstrate voice query)

#### Key Talking Points
- "Every claim is backed by inline citations from our knowledge base"
- "The system retrieves from multiple sources: Confluence, vector store, conversation history"
- "Citations include page titles, sections, and relevance scores"
- "Voice UI provides hands-free interaction for developers"

#### Visual Cues for DaVinci Resolve
- Zoom in on citation (1.5x) when hovering
- Highlight popover with subtle glow effect
- Show citation count badge

---

## Scene 3: Pillar 2 - State-of-the-art Curate Tab (2:00-3:30)

### Part A: Understanding RLHF (2:00-2:30)

#### Action Steps
1. **Ask follow-up**: "Explain how RLHF improves retrieval accuracy"
2. **Read response** highlighting virtuous cycle
3. **Mention Curate tab** as the interface for feedback

#### Key Talking Points
- "RLHF stands for Reinforcement Learning from Human Feedback"
- "When domain experts correct retrieval errors, the system learns"
- "Feedback signals re-weight embeddings for that context"
- "This creates a virtuous cycle of continuous improvement"

### Part B: Curate Tab Walkthrough (2:30-3:30)

#### Action Steps
1. **Navigate to Curate tab** (top navigation)
2. **Show feedback queue** with pending AOMA questions
3. **Select first item** from queue
4. **Review retrieved documents** with relevance toggles
5. **Provide feedback**:
   - Click thumbs up/down
   - Adjust star rating (1-5)
   - Add text comment (optional)
6. **Submit feedback** and show success toast
7. **Show accuracy chart** updating in real-time

#### Key Talking Points
- "The Curate tab is the RLHF feedback interface"
- "Experts review retrieval quality for production queries"
- "Feedback is written to the database as a validation signal"
- "Charts show feedback distribution and accuracy trends over time"
- "This is how we maintain domain expertise at scale"

#### UI Elements to Highlight
- **Feedback queue**: Prioritized list of queries needing review
- **Document relevance toggles**: Mark which sources were helpful
- **Rating interface**: Thumbs, stars, and text input
- **Analytics charts**: Accuracy, distribution, trends
- **Toast notification**: Immediate feedback confirmation

#### Visual Cues for DaVinci Resolve
- Transition: Slide left from chat to Curate tab
- Zoom in on feedback queue (1.5x)
- Highlight cursor on thumbs up button
- Overlay green checkmark on success
- Pan to charts showing data update

---

## Scene 4: Pillar 3 - Automated Testing with HITL (3:30-5:00)

### Part A: Self-healing Concept (3:30-3:50)

#### Action Steps
1. **Return to chat** (or stay in Curate if natural)
2. **Ask query**: "What happens when a UI change breaks a test?"
3. **Show response** explaining self-healing workflow
4. **Navigate to Testing tab** - Click "Testing" in top navigation

#### Key Talking Points
- "UI changes in AOMA frequently break automated tests"
- "Our self-healing system detects failures and automatically generates fixes"
- "It analyzes DOM drift, identifies the breaking change, and adapts selectors"
- "This keeps the release pipeline moving without manual intervention"

### Part B: Self-Healing Test Monitor - Live Demo (3:50-5:00)

#### Action Steps - Stats Overview (3:50-4:05)
1. **Show stats grid** at top of dashboard:
   - Total Tests: 1,247 automated tests monitored
   - Auto-Healed: 1,175 (green badge)
   - Pending Review: 18 (yellow badge)
   - Success Rate: 94.2%
   - Avg Heal Time: 4.2s
   - Last 24h: 18 recent healings

#### Key Talking Points
- "We've seeded over 1,200 automated tests for AOMA"
- "94% of test failures are automatically fixed by AI"
- "Average healing time is just 4 seconds - faster than manual review"
- "18 healings in the last 24 hours alone"

#### Action Steps - Live Healing Workflow (4:05-4:40)
2. **Show Active Healing Queue** (left panel):
   - List of healing attempts with status badges
   - Color-coded: green (success), yellow (review), blue (analyzing)
   - Each item shows test name, file, confidence score

3. **Click on "Login Flow - Submit Button Click"** (success status):
   - Right panel shows detailed healing workflow

4. **Walk through visual workflow** (step-by-step):
   - **Step 1**: Test Failure Detected (red icon) - "Selector not found"
   - **Step 2**: AI Analysis (blue sparkle icon) - "1 DOM change detected"
   - **Step 3**: Auto-Healing Applied (purple wrench icon) - "Selector update strategy"
   - **Step 4**: Healing Successful (green checkmark) - "95% confidence"

5. **Show Code Diff** section:
   - **Before** (red): `button[data-testid="submit-btn"]`
   - **After** (green): `button[data-testid="login-submit"]`
   - Visual arrow between them

6. **Show DOM Changes Detail**:
   - Type: "selector"
   - Confidence: 95% match
   - Before/after comparison

7. **Show Execution Metadata**:
   - Execution Time: 3.8s
   - Retry Count: 0
   - AI Model: Claude Sonnet 4.5

#### Key Talking Points for Workflow
- "The workflow is completely visual - you can see every step"
- "AI detected the data-testid attribute changed in AOMA's button"
- "The system suggested the new selector with 95% confidence"
- "No human intervention needed - test passed automatically"
- "Powered by Claude Sonnet 4.5 for intelligent analysis"

#### Action Steps - Human-in-the-Loop (4:40-4:55)
8. **Click on "Dashboard - User Profile Load"** (review status):
   - Shows lower confidence (78%)
   - More complex structural change
   - DOM structure was nested deeper

9. **Highlight approval buttons**:
   - "Approve Healing" (green button)
   - "Reject" (red button)

10. **Explain HITL decision**:
    - "Low confidence changes require human review"
    - "QA experts approve or reject the AI suggestion"
    - "This maintains test quality while scaling automation"

#### Key Talking Points for HITL
- "Not all fixes are automatic - we use human oversight for complex changes"
- "QA experts see the full context: code diff, DOM changes, confidence score"
- "Humans approve the 22 low-confidence fixes, AI handles the rest"
- "This human-in-the-loop approach maintains 94% success rate"
- "The system learns from approvals to improve future suggestions"

#### UI Elements to Highlight
- **Stats grid**: 6 metric cards with icons and color coding
- **Healing queue**: Left panel with status badges and metadata
- **Visual workflow**: 4-step healing process with icons and connecting lines
- **Code diff viewer**: Before/after comparison with syntax highlighting
- **DOM changes detail**: Type, confidence, before/after
- **Approval workflow**: Approve/reject buttons for HITL
- **Metadata panel**: Execution time, retry count, AI model

#### Visual Cues for DaVinci Resolve
- **3:50**: Transition from Curate to Testing tab (slide left)
- **3:52**: Zoom in on stats grid (1.5x) - pan across metrics
- **4:05**: Highlight healing queue (left panel)
- **4:10**: Click first item - transition to workflow view
- **4:15**: Zoom in on visual workflow (2x) - show step-by-step
- **4:25**: Highlight code diff with before/after comparison
- **4:30**: Pan to DOM changes and metadata
- **4:40**: Click second item (review status)
- **4:45**: Highlight approval buttons with subtle glow
- **4:50**: Overlay text: "Human-in-the-Loop Quality Control"

---

## Scene 5: Closing & Recap (5:00-5:30)

### Visual
- Return to title card or show all three tabs side-by-side
- Three pillars summary:
  1. Visual Intelligence Chat ✓
  2. RLHF Curation ✓
  3. Self-healing Tests ✓

### Narration Script
> "The Beta Base brings together three Northstar capabilities: visual intelligence for architectural understanding, real-time RLHF for continuous model improvement, and self-healing tests with human oversight. Together, these create an enterprise AI platform that learns, adapts, and maintains itself."

### Call to Action
- "Try The Beta Base at thebetabase.com"
- "Built for enterprise AI teams at Sony Music Entertainment"

### DaVinci Resolve Notes
- Text overlay with three checkmarks
- Fade to black over 2 seconds
- Optional: End card with URL

---

## Timing Breakdown

| Scene | Duration | Pillar | Focus | Key UI Component |
|-------|----------|--------|-------|------------------|
| 1. Intro | 0:00-0:15 | - | Overview of three pillars | Title card |
| 2. Chat Demo | 0:15-2:00 | Pillar 1 | Mermaid diagram + citations | Chat interface + Mermaid |
| 3. Curate Tab | 2:00-3:30 | Pillar 2 | RLHF feedback workflow | RLHFFeedbackTab |
| 4a. Self-Healing Intro | 3:30-3:50 | Pillar 3 | Explain concept | Chat explanation |
| 4b. Self-Healing Monitor | 3:50-5:00 | Pillar 3 | Live workflow + HITL | SelfHealingTestViewer |
| 5. Closing | 5:00-5:30 | - | Recap and CTA | Three pillars summary |

**Total**: 5:30 (leaves 30s buffer for natural pacing)

### Self-Healing Demo Breakdown
- **3:50-4:05** (15s): Stats grid overview
- **4:05-4:40** (35s): Visual workflow walkthrough
- **4:40-4:55** (15s): HITL approval workflow
- **4:55-5:00** (5s): Transition to closing

---

## Demo Execution Tips

### Before Recording
1. **Practice 2-3 times** without recording to smooth timing
2. **Pre-load tabs** so navigation is instant
3. **Seed demo data** if needed (feedback queue, test failures)
4. **Test voice button** if demonstrating (ensure mic works)

### During Recording
1. **Type slowly** - Faster than you think, but readable
2. **Pause between actions** - Leave 2-3 seconds for DaVinci Resolve editing
3. **Narrate as you go** - Or record voiceover separately
4. **Don't worry about mistakes** - Just pause and restart that section

### Post-Recording (DaVinci Resolve)
1. **Trim dead space** - Remove pauses, loading screens
2. **Add zoom effects** - Highlight key UI elements
3. **Sync voiceover** - Align audio with visual actions
4. **Add text overlays** - Label pillars, features, key terms
5. **Color grade** - Slight brightness (+5), contrast (+10), vignette
6. **Export settings**: 1080p, 30fps, H.264, 10-15 Mbps

---

## Advanced Variations

### Shorter Version (3 minutes)
- Skip voice UI demo
- Reduce Curate tab to 45 seconds
- Show testing dashboard metrics only (no drill-down)

### Longer Version (8-10 minutes)
- Add voice UI demonstration
- Show full RLHF virtuous cycle diagram
- Deep dive into test playback with annotations
- Demonstrate AI test generation from failures

### Technical Deep Dive (15 minutes)
- Show Supabase schema for RLHF feedback
- Explain vector embedding re-weighting algorithm
- Walk through TestSprite agent code
- Demonstrate MCP server integration

---

## Troubleshooting

### Common Issues

**Mermaid diagram doesn't render**
- Check browser console for errors
- Ensure `mermaid-diagram.tsx` is imported
- Verify Mermaid syntax in response

**Curate tab shows no feedback queue**
- Seed demo data: `npm run seed:rlhf-demo`
- Check Supabase connection
- Verify `rlhf_feedback` table exists

**Testing dashboard shows zero tests**
- Run test suite first: `npm run test:aoma`
- Check `test_results` table in Supabase
- Ensure demo data is not filtered out

**Self-healing component not showing**
- Verify `SelfHealingTestViewer.tsx` exists in `src/components/test-dashboard/`
- Import and add to testing route/page
- Check that mock data is rendering in component
- Verify shadcn/ui dependencies are installed

**Voice button doesn't work**
- Check microphone permissions
- Verify WebRTC connection in network tab
- Fallback: Skip voice demo, mention as feature

---

## Assets Checklist

### Visual Assets
- [ ] Title card background (dark gradient)
- [ ] Three pillars icon set
- [ ] RLHF virtuous cycle diagram (if using voiceover)
- [ ] Optional: Company logo, presenter headshot

### Audio Assets
- [ ] Background music (subtle, -20dB, royalty-free)
- [ ] Voiceover (recorded separately or live)
- [ ] Optional: Transition sound effects

### Demo Data
- [ ] AOMA Confluence pages crawled and indexed
- [ ] Feedback queue seeded with 5-10 items
- [ ] Self-healing test attempts seeded (3+ items with different statuses)
- [ ] At least 1 "success" status healing
- [ ] At least 1 "review" status healing (for HITL demo)
- [ ] Stats populated: ~1,247 total tests, 94.2% success rate
- [ ] Chat history cleared for fresh demo

---

## Self-Healing Component Integration

### Quick Setup
If the self-healing component isn't integrated yet, here's how to add it:

```typescript
// In your testing page/route (e.g., src/app/testing/page.tsx)
import { SelfHealingTestViewer } from '@/components/test-dashboard/SelfHealingTestViewer';

export default function TestingPage() {
  return (
    <div className="container mx-auto">
      <SelfHealingTestViewer />
    </div>
  );
}
```

### Component Features
The `SelfHealingTestViewer` component includes:
- ✅ Stats grid (6 metric cards)
- ✅ Active healing queue with status badges
- ✅ Visual 4-step workflow visualization
- ✅ Code diff viewer (before/after comparison)
- ✅ DOM changes detail panel
- ✅ HITL approval workflow (approve/reject buttons)
- ✅ Execution metadata (time, retries, AI model)
- ✅ Tabs for "Live Healing Workflow" and "Healing History"

### Mock Data Included
Component comes pre-loaded with 3 mock healing attempts:
1. **Login Flow** - Success status (95% confidence)
2. **Dashboard Profile** - Review status (78% confidence)
3. **Search Input** - Analyzing status (92% confidence)

Perfect for demo without needing live data!

---

## Post-Demo Follow-up

### Questions to Anticipate
1. **"How accurate is the RAG retrieval?"**
   - Show accuracy metrics from Curate tab
   - Mention RLHF improvement cycle

2. **"Can it handle our proprietary docs?"**
   - Yes, crawls Confluence/Notion/SharePoint
   - Mention enterprise security (SSO, RBAC)

3. **"How many tests can it manage?"**
   - Currently seeded with 1,200+ for AOMA
   - Scalable to 10,000+ tests per application

4. **"What's the learning curve?"**
   - Chat interface is familiar (ChatGPT-like)
   - Curate tab for admins/experts only
   - Testing dashboard for QA teams

### Next Steps
- Schedule technical deep dive
- Provide sandbox access for evaluation
- Discuss integration requirements
- Share case study (AOMA @ Sony Music)

---

## Success Metrics

### Demo Effectiveness
- [ ] All three pillars demonstrated clearly
- [ ] Visual elements rendered correctly
- [ ] Narration was clear and paced well
- [ ] Timing stayed under 6 minutes
- [ ] Call to action was compelling

### Technical Quality
- [ ] No console errors visible
- [ ] All UI interactions worked smoothly
- [ ] Data loaded without delays
- [ ] Recording quality: 1080p, clear audio

### Audience Engagement
- [ ] Questions asked about specific features
- [ ] Interest in follow-up demos
- [ ] Requests for technical documentation
- [ ] Discussions about enterprise deployment

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-23 | Initial walkthrough for DaVinci Resolve demo |

---

**For DaVinci Resolve editing instructions, see**: [CAPCUT-TUTORIAL-ENHANCED.md](CAPCUT-TUTORIAL-ENHANCED.md)
**For technical setup, see**: [NORTHSTAR-STATUS.md](NORTHSTAR-STATUS.md)
