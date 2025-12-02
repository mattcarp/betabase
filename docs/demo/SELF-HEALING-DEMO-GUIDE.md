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

## Live Healing Workflow

The dashboard shows real-time healing activity:

1. **Failing Test Detection** - System identifies selector failures
2. **AI Analysis** - Gemini 3 Pro analyzes the DOM change
3. **Confidence Scoring** - Assigns confidence and tier
4. **Action Taken** - Auto-heal, queue for review, or escalate

## Code Diff Visualization

When reviewing a healed test, the dashboard displays:

- **Original Selector** (red) - What the test was looking for
- **New Selector** (green) - What the AI suggests
- **Confidence Score** - How certain the AI is about the match
- **DOM Context** - Surrounding HTML for verification

Example:
```diff
- button[data-testid="submit-btn"]
+ button[data-testid="send-btn"]
```

## Cascade Healing

A powerful feature: **One fix can repair multiple tests.**

When the AI fixes a selector pattern, it automatically identifies and repairs all other tests using the same pattern. This dramatically reduces maintenance burden.

**Demo talking point:** "When we fix one test, the system automatically identifies 12 other tests with the same selector pattern and heals them all. That's cascade healing."

## Hidden Demo Trigger

For demo purposes, there's a hidden feature to simulate live healing activity:

**Click the "Configure" button 3 times quickly** to trigger a demo healing sequence with simulated failures and automatic repairs.

## Business Value Proposition

Key points for the demo:

1. **94.2% Success Rate** - Most tests heal automatically
2. **2.3s Average Heal Time** - Near-instant repairs
3. **Reduced Maintenance** - QA team focuses on new tests, not fixing old ones
4. **Cascade Effect** - One fix repairs many tests
5. **Human-in-the-Loop** - AI suggests, humans approve for uncertain cases

## Demo Script

### Opening (30 seconds)
"The Test pillar shows our AI-powered self-healing test system. When UI changes break our automated tests, the AI automatically repairs them."

### Stats Overview (30 seconds)
"We're monitoring 247 tests. 89 have been automatically healed, 12 are pending review. Our success rate is 94.2% with an average heal time of 2.3 seconds."

### Three-Tier Explanation (45 seconds)
"The system uses a three-tier confidence model. Tier 1 tests heal automatically - high confidence, no human needed. Tier 2 queues for QA review - the AI makes a recommendation but wants human verification. Tier 3 escalates to architects - these are complex changes that may need test rewrites."

### Live Workflow (30 seconds)
"Watch the live workflow here. A test just failed because a button's data-testid changed. The AI analyzed it, scored 96% confidence, and automatically healed it in 1.8 seconds."

### Cascade Demo (30 seconds)
"Notice it also healed 5 other tests that used the same selector pattern. That's cascade healing - fix one, fix many."

### Closing (15 seconds)
"This means our QA team spends less time maintaining tests and more time building new coverage. The AI handles the routine maintenance."

## Technical Details (For Technical Audience)

- **AI Model:** Gemini 3 Pro for selector analysis
- **Confidence Algorithm:** Combines semantic similarity, DOM structure, and historical patterns
- **API Endpoints:**
  - `GET /api/self-healing` - Current healing status
  - `GET /api/self-healing/analytics` - Historical data
  - `POST /api/self-healing/approve` - Human approval for Tier 2/3
- **Integration:** Playwright test framework with custom healing middleware

## Screenshots

Screenshots are automatically saved during test runs to:
- `test-results/pillar-3-test-dashboard.png`
- `test-results/pillar-3-self-healing.png`
- `test-results/test-dashboard-self-healing-tab.png`

---

*Last updated: December 2, 2025*
