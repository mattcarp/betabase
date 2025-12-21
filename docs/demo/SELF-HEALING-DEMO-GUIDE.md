# Self-Healing Test Dashboard - Demo Guide

## Overview

The Self-Healing Test Dashboard is the **Test pillar** of SIAM's three-pillar architecture. It demonstrates AI-powered test maintenance that automatically repairs broken UI tests when selectors change.

## Key Stats (Hero Metrics Strip)

When the dashboard loads, you'll see six key metrics at the top:

| Metric | Description |
|--------|-------------|
| **Total Tests** | Number of tests in the monitoring system |
| **Auto-Healed** | Tests automatically fixed by the AI (Tier 1) |
| **Pending Review** | Tests waiting for human review (Tier 2) |
| **Success Rate** | Overall healing success rate (target: >90%) |
| **Avg Heal Time** | Average time to automatically repair a test |
| **Last 24h** | Recent healing activity volume |

## Three-Tier Healing System

The system classifies each broken test into one of three tiers based on AI confidence:

### Tier 1: Automatic Healing (Green)
- **Confidence:** >90%
- **Action:** Heals automatically, no human intervention
- **Example:** Button text changed from "Submit" to "Send" - obvious match

### Tier 2: Review Required (Yellow)
- **Confidence:** 60-90%
- **Action:** Queued for QA review with AI recommendation
- **Example:** Multiple possible matches, needs human judgment

### Tier 3: Architect Review (Red)
- **Confidence:** <60%
- **Action:** Escalated to test architect
- **Example:** Component completely restructured, may need test rewrite

## Interactive Demo (Updated December 21, 2025)

The Self-Healing tab includes an **Interactive Demo** that visually demonstrates the healing flow in real-time. Perfect for executive presentations.

### The Scenario

A developer refactors a checkout button during a code cleanup sprint:
- **Before:** Button has `id="submit-btn"`
- **After:** Button renamed to `id="order-submit-button"`

This is a VERY common real-world scenario that breaks automated tests.

### The Problem (Traditional Approach)

When the test fails, a QA engineer would need to:
1. Notice the failure in CI
2. Investigate the cause
3. Find the new selector
4. Update the test code
5. Commit and push

**Time cost: 15-30 minutes per broken test** - and there could be dozens affected.

### The Solution (Self-Healing)

1. AI detects the test failure
2. AI loads DOM snapshot from last passing run
3. AI compares with current DOM to find what changed
4. AI identifies button by: text content, role, position, siblings
5. AI finds match: same text "Complete Purchase", same position
6. AI calculates confidence: 94% (above 90% = Tier 1 = auto-heal)
7. AI updates test selector automatically
8. AI re-runs test to verify fix works
9. **Test passes - NO HUMAN INTERVENTION REQUIRED**

**Time saved: Hours per sprint**

### How to Access

1. Navigate to **Test tab** > **Self-Healing** subtab
2. Click the **"Interactive Demo"** tab (first tab)
3. Click **"Run Demo"** button

### Demo Flow (~55 seconds)

| Time | Step | What Happens |
|------|------|--------------|
| 0:00-0:06 | Original Test | Test runs against TechStore checkout - PASSES |
| 0:06-0:14 | UI Changed | Developer renamed button ID (shown in Element Inspector) |
| 0:14-0:22 | Test Failed | Selector `#submit-btn` not found - timeout error |
| 0:22-0:38 | AI Analyzing | Loading DOM snapshot, comparing states, finding candidates |
| 0:38-0:46 | Match Found | 94% confidence, Tier 1 auto-heal threshold |
| 0:46-0:55 | Verified | Healed test runs and PASSES |

### Key Executive Takeaway

**"Tests fix themselves when developers change the UI."**

## Demo Target App: TechStore Pro

The demo uses a realistic SaaS checkout page (`/demo/self-healing`):

### Features
- **TechStore Pro** branding with checkout flow
- Progress bar: Cart → Shipping → Payment
- Order summary with products, prices, totals
- **Element Inspector overlay** showing button's selector in real-time
- Visual indicators: "Test uses this!" and "Changed!" badges

### Button Variants

| Variant | Selector | Description |
|---------|----------|-------------|
| 1 | `#submit-btn` | Original (test uses this) |
| 2 | `#submit-btn` | Same ID, different position |
| 3 | `#order-submit-button` | Renamed (main demo scenario) |
| 4 | `.order-submit-btn` | No ID, class only |
| 5 | `aria-label` | Icon button, aria-label only |

### URL Parameters
- `?variant=N` - Set button variant (1-5)
- `?showControls=true` - Show variant switcher
- `?showDevTools=false` - Hide Element Inspector

### Direct Access
```
http://localhost:3000/demo/self-healing?variant=1&showControls=true
```

## Video Recording

### Recording Script

A Playwright script captures the full demo as video:

**Location:** `scripts/record-self-healing-demo.ts`

**Run with:**
```bash
npx tsx scripts/record-self-healing-demo.ts
```

**Output:** `~/Desktop/playwright-screencasts/self-healing-demo-{timestamp}.webm`

### What the Recording Shows

1. Navigate to Test tab → Self-Healing → Interactive Demo
2. Click "Run Demo"
3. Full ~55 second animation with all steps visible
4. Final "HEALED TEST PASSED" state

### Video Location

Latest recording: `~/Desktop/playwright-screencasts/self-healing-demo-v3-2025-12-21.webm`

## Components

### SelfHealingDemo.tsx
`src/components/test-dashboard/SelfHealingDemo.tsx`

- Orchestrates the demo animation
- Split view: App preview (iframe) + Test code
- Progress steps indicator with icons
- Activity log with color-coded messages
- Healing result card with confidence scores and alternatives

### Demo Target Page
`src/app/demo/self-healing/page.tsx`

- TechStore Pro checkout UI
- Element Inspector showing live selector info
- 5 button variants for different scenarios
- Success message on click

### SelfHealingTestViewer.tsx
`src/components/test-dashboard/SelfHealingTestViewer.tsx`

- Parent component containing Interactive Demo tab
- Also contains: Priority Review, Batch Review, Live Workflow, History

## Business Value Proposition

Key points for the demo:

1. **94% Success Rate** - Most tests heal automatically (Tier 1)
2. **2.3s Average Heal Time** - Near-instant repairs
3. **Reduced Maintenance** - QA focuses on new tests, not fixing old ones
4. **Cascade Effect** - One fix repairs many tests with same pattern
5. **Human-in-the-Loop** - AI defers to humans for uncertain cases (Tier 2/3)

## Demo Script

### Opening (30 seconds)
"The Test pillar shows our AI-powered self-healing test system. When UI changes break our automated tests, the AI automatically repairs them."

### Interactive Demo (60 seconds)
"Let me show you exactly how it works. I'll run our Interactive Demo."

*Click Run Demo*

"Here's a checkout page with a Submit button. The test uses `#submit-btn` as its selector."

*Wait for UI Change*

"Now a developer refactors the button - renames the ID to `order-submit-button`. Watch what happens to the test."

*Wait for Failure*

"The test fails - can't find the old selector. But now the AI kicks in."

*Wait for Analysis*

"It's comparing DOM snapshots, analyzing the button by text, role, and position..."

*Wait for Healing*

"94% confidence - same text, same position. The AI auto-heals the test."

*Wait for Verification*

"And the healed test passes. No human intervention required. This took 2.3 seconds instead of 30 minutes."

### Closing (15 seconds)
"This means our QA team spends less time maintaining tests and more time building new coverage. The AI handles the routine maintenance."

## Technical Details

- **AI Model:** Analysis via DOM comparison and semantic matching
- **Confidence Algorithm:** Combines text similarity, role matching, DOM structure, position
- **Healing Strategies:**
  - Text + Role Matching
  - data-testid fallback
  - CSS class matching
  - aria-label matching

## Hidden Demo Trigger (Legacy)

**Click the "Configure" button 3 times quickly** to trigger a demo healing sequence with simulated failures and automatic repairs.

---

*Last updated: December 21, 2025*
