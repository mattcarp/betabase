# SIAM Demo Master Script

**Format**: DO (left) | SAY (right)
**Runtime**: 6-8 minutes
**Flow**: Intro → Chat → Curate → Test

---

## Pre-Demo Checklist

```bash
npx kill-port 3000 && npm run dev
# Open: http://localhost:3000
# Logged in, no console errors
```

---

## INTRO

| DO | SAY |
|:---|:---|
| Navigate to Chat tab | *intro* |
| Type: `Create an infographic of the ERD for the database` | *intro* |
| Press Enter, wait for infographic to generate | *intro* |
| Point to the generated ERD diagram | *intro* |

---

## PILLAR 1: CHAT

### Chat 1: Basic Query with Citations

| DO | SAY |
|:---|:---|
| Type: `What are the royalty calculation rules in AOMA 9.1?` | "Ask AOMA anything about your music catalog." |
| Press Enter, wait for response | *watch streaming* |
| Point to inline citations | "Notice the inline citations - real sources, not hallucinations." |
| Click one citation | "Click to see the exact source document." |

### Chat 2: Multi-Source Intelligence

| DO | SAY |
|:---|:---|
| Type: `Show me JIRA tickets related to asset ingestion and the related code commits` | "Now watch - querying multiple sources at once." |
| Wait for response | "JIRA, Git, documentation - cross-referenced automatically." |
| Point to ticket references | "Real ticket keys from our backlog." |
| Point to code references | "Linked to actual code commits." |
| | "Most chatbots: one data source. Ours: unified enterprise intelligence." |

### THE SEGUE: Thumbs Down → Curate

| DO | SAY |
|:---|:---|
| On the response, click **thumbs down** | "But what if the AI gets it wrong?" |
| Modal/expansion appears | "This is where humans train the AI." |
| Click **"Give detailed feedback"** | "Every thumbs down becomes training data." |
| Type correction: `Should mention the 2024 rate changes per KB-2847` | "I'm adding institutional knowledge the AI doesn't have." |
| Click **Submit** | *silent* |
| Toast confirmation | "That feedback goes straight to our curator queue. Let me show you..." |

---

## PILLAR 2: CURATE

### Curate 1: The Curator Queue

| DO | SAY |
|:---|:---|
| Click **Curate** tab | *silent* |
| Wait for Curate panel to load | "This is where human expertise meets AI learning." |
| Click **RLHF** sub-tab | "RLHF - Reinforcement Learning from Human Feedback." |
| Point to the feedback queue | "Every piece of feedback waiting for review." |

### Curate 2: Review and Approve

| DO | SAY |
|:---|:---|
| Click on a feedback card to expand | "Each card is an AI response that needs human judgment." |
| Point to the original query/response | "Here's what was asked, here's what the AI said." |
| Click **thumbs up** on a good one | "This one was helpful - one click." |
| Click **Relevant** on a retrieved document | "Mark which sources were actually useful." |
| Click **Submit** | *silent* |
| Toast confirmation | "10 seconds of expertise captured forever." |

### Curate 3: Making Corrections

| DO | SAY |
|:---|:---|
| Click another feedback card | "Here's one where the AI got it wrong." |
| Click **thumbs down** | "Thumbs down - needs work." |
| Correction textarea appears | "Now I can type the correct answer." |
| Type: `Per Q3 policy update: Use the new asset classification system.` | "Adding institutional knowledge..." |
| Click **Submit** | *silent* |
| Toast: "Correction saved" | "That correction becomes training data. Next time, the AI will know." |

---

## PILLAR 3: TEST

### Test 1: Dashboard Overview

| DO | SAY |
|:---|:---|
| Click **Test** tab | *silent* |
| Dashboard loads with stats | "Real-time visibility into your entire test suite." |
| Point to stats: 8,719 tests | "8,719 tests." |
| Point to: 80% pass rate | "80% pass rate." |

### Test 2: Self-Healing

| DO | SAY |
|:---|:---|
| Click **Self-Healing** sub-tab | "Here's where the magic happens." |
| Point to 1,089 auto-healed | "1,089 tests automatically healed." |
| Point to 94.2% success | "94% success rate." |
| Point to 3.1s avg time | "Average heal time: 3 seconds." |
| | "When a button moves or a class name changes, the AI updates selectors automatically." |
| | "No more brittle tests breaking every sprint." |

### Test 3: RLHF Test Generation

| DO | SAY |
|:---|:---|
| Click **RLHF Tests** sub-tab | *silent* |
| Point to generated tests | "RLHF Tests - auto-generated from curator corrections." |
| | "When a human corrects an AI response, we create a regression test." |
| | "Human feedback becomes automated quality assurance." |

---

## CLOSING

| DO | SAY |
|:---|:---|
| Return to landing view | "Three pillars working together." |
| | "Chat answers questions with real sources." |
| | "Curate lets humans train the AI." |
| | "Test heals itself with 94% success." |

---

## Quick Stats Reference

| Metric | Value |
|--------|-------|
| Total tests | 8,719 |
| Self-healed | 1,089 |
| Heal success | 94.2% |
| Avg heal time | 3.1s |

---

## Emergency Lines

- "While this processes..."
- "The key point is..."
- "Let me move on to show you..."

---

*Last updated: 2025-12-22*
