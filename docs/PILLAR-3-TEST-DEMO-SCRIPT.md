# Pillar 3: Test - Demo Script

**Duration**: 60-90 seconds
**Focus**: Self-Healing Tests - AI-powered test maintenance

## Key Message

"Tests that fix themselves when the UI changes - eliminating the #1 pain point in test automation."

---

## Demo Flow (Recommended Order)

### 1. Dashboard Overview (10 sec)

**Screenshot**: `production-test-tab-2025-12-21T11-40-11-425Z.png`

**Narration**:
> "The Test Dashboard gives you a real-time view of your entire test suite. We're tracking 8,719 tests across 12,177 executions with an 80% pass rate."

**Highlight**:
- Radar chart showing test health across dimensions
- Velocity trends showing test activity over time

---

### 2. Self-Healing - The Star Feature (25-30 sec)

**Screenshot**: `production-self-healing-2025-12-21T11-41-28-435Z.png`

**Narration**:
> "Here's where the magic happens. Self-healing tests automatically adapt when your UI changes. We're monitoring 1,247 tests, and 1,089 have been auto-healed - that's a 94% success rate with an average heal time of just 3.1 seconds."

**Key Stats to Emphasize**:
- **1,247** tests monitored
- **1,089** auto-healed (87.3% of monitored)
- **94.2%** healing success rate
- **3.1s** average heal time

**Talking Points**:
- "When a button moves or a class name changes, the AI recognizes the intent and updates the selector automatically"
- "No more brittle tests breaking every sprint"
- "The confidence scores show how certain the AI is about each fix"

---

### 3. Historical Tests (15-20 sec)

**Screenshots**:
- `production-historical-2025-12-21T11-42-28-941Z.png`
- `production-historical-detail-2025-12-21T11-43-18-068Z.png`

**Narration**:
> "The Historical Tests tab lets you explore your entire test library. Filter by status, search by name, and drill into any test to see its execution history and healing events."

**Demo Action**:
- Show the filter/search capability
- Click into a specific test to show detail view
- Point out the pass/fail history timeline

---

### 4. RLHF Tests - Learning from Curators (15 sec)

**Screenshot**: `production-rlhf-tests-2025-12-21T11-43-56-698Z.png`

**Narration**:
> "RLHF Tests are automatically generated from curator corrections. When a human corrects an AI response, we create a test to prevent that mistake from happening again. 14 tests generated, with 7 currently passing."

**Key Insight**:
- "13 tests generated per week from real user feedback"
- Tests ensure AI improvements stick

---

### 5. Impact Metrics (10 sec)

**Screenshot**: `production-impact-metrics-2025-12-21T11-44-35-489Z.png`

**Narration**:
> "Impact Metrics show how testing affects real outcomes. A 3.43 average rating from 240 feedback submissions, with approval rates trending upward."

---

### 6. Live Monitor (Optional - 10 sec)

**Screenshot**: `production-live-monitor-v2-2025-12-21T11-46-10-120Z.png`

**Narration**:
> "The Live Monitor shows real-time RAG pipeline activity - what strategies are being used, what contexts are being retrieved, and where improvements are needed."

---

## Key Differentiators to Emphasize

1. **Self-Healing = Time Saved**: "Traditional test maintenance consumes 40% of QA time. Self-healing cuts that to near zero."

2. **Confidence-Based Decisions**: "The AI doesn't just fix tests blindly - it provides confidence scores so you know when human review is needed."

3. **RLHF Feedback Loop**: "Every curator correction becomes a regression test - continuous improvement baked in."

4. **Real-Time Monitoring**: "Not just running tests - understanding how your AI system behaves in production."

---

## Technical Notes for Recording

- **URL**: https://thebetabase.com (production)
- **Auth**: Mailinator magic link for testing
- **Navigation**: Click "Test" in top nav, then sub-tabs
- **Note**: localhost may show stale UI - use production for demo

---

## Transition to Next Pillar

> "From self-healing tests to self-improving AI - let's look at how the Curate tab enables human-in-the-loop refinement..."

---

## Screenshots Reference

| Screenshot | Tab | Key Content |
|------------|-----|-------------|
| production-test-tab-*.png | Dashboard | Stats overview, radar chart |
| production-self-healing-*.png | Self-Healing | 94.2% success rate, heal times |
| production-historical-*.png | Historical | 8,719 tests, filter/search |
| production-historical-detail-*.png | Historical | Single test detail view |
| production-rlhf-tests-*.png | RLHF Tests | 14 tests, 13/week generated |
| production-impact-metrics-*.png | Impact | 3.43 rating, 240 feedback |
| production-live-monitor-*.png | Live Monitor | RAG pipeline activity |

---

*Last updated: 2025-12-21*
