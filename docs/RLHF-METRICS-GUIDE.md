# RLHF Metrics & KPIs Guide

## Overview

This document defines all metrics tracked by the RLHF system, their calculation methods, targets, and interpretation guidelines.

---

## Core Metrics

### 1. Average Rating

**Definition:** Mean of all star ratings (1-5) provided by curators

**Calculation:**
```typescript
avgRating = sum(all ratings) / count(all ratings)
```

**Data Source:** `rlhf_feedback.rating`

**Target Ranges:**
- 🟢 Excellent: 4.0 - 5.0
- 🟡 Good: 3.5 - 3.9
- 🟠 Fair: 3.0 - 3.4
- 🔴 Poor: < 3.0

**Interpretation:**
- **Trending Up**: System is learning and improving
- **Stable High**: Sustained quality, maintain practices
- **Stable Low**: Systemic issues, needs investigation
- **Trending Down**: Regression, immediate review required

**Action Thresholds:**
- < 3.0: Emergency review
- < 3.5: Weekly improvement plan
- > 4.0: Document best practices
- > 4.5: Celebrate success!

### 2. Rating Trend

**Definition:** Percentage change in average rating compared to previous period

**Calculation:**
```typescript
ratingTrend = ((current_avg - previous_avg) / previous_avg) * 100
```

**Period:** Rolling 30 days vs previous 30 days

**Target Ranges:**
- 🟢 Excellent: > +10%
- 🟡 Good: +5% to +10%
- 🟠 Neutral: -5% to +5%
- 🔴 Concerning: < -5%

**Interpretation:**
- **> +10%**: RLHF feedback loop working effectively
- **+5% to +10%**: Steady improvement
- **-5% to +5%**: Stable, no significant change
- **< -5%**: Quality degradation, investigate causes

### 3. Total Feedback Count

**Definition:** Number of feedback items received in period

**Calculation:**
```typescript
totalFeedback = count(rlhf_feedback WHERE created_at > period_start)
```

**Period:** Rolling 30 days

**Target Ranges:**
- 🟢 Excellent: > 100/month
- 🟡 Good: 50-100/month
- 🟠 Fair: 20-50/month
- 🔴 Poor: < 20/month

**Interpretation:**
- **High Volume**: More data = better learning
- **Low Volume**: Insufficient feedback, encourage curators
- **Sudden Drop**: User engagement issue or system problem
- **Sudden Spike**: Possible data quality issue or new feature adoption

### 4. Feedback Trend

**Definition:** Percentage change in feedback volume compared to previous period

**Calculation:**
```typescript
feedbackTrend = ((current_count - previous_count) / previous_count) * 100
```

**Target Ranges:**
- 🟢 Growth: > +20%
- 🟡 Stable: -20% to +20%
- 🔴 Decline: < -20%

**Interpretation:**
- **Growing**: Increased curator engagement
- **Stable**: Consistent usage
- **Declining**: User engagement issue, needs attention

### 5. Curator Approval Rate

**Definition:** Percentage of responses rated 4-5 stars or thumbs up

**Calculation:**
```typescript
approvalRate = (count(rating >= 4 OR thumbs_up = true) / total_count) * 100
```

**Data Source:** `rlhf_feedback.rating`, `rlhf_feedback.thumbs_up`

**Target Ranges:**
- 🟢 Excellent: > 80%
- 🟡 Good: 60-80%
- 🟠 Fair: 40-60%
- 🔴 Poor: < 40%

**Interpretation:**
- **> 80%**: System producing high-quality responses consistently
- **60-80%**: Good quality with room for improvement
- **40-60%**: Mixed quality, needs systematic review
- **< 40%**: Major quality issues, immediate action required

### 6. Average Confidence

**Definition:** Mean confidence score from document relevance marks

**Calculation:**
```typescript
avgConfidence = sum(relevant_docs / total_docs_per_query) / count(queries)
// Where relevant_docs = documents marked as relevant by curators
```

**Data Source:** `rlhf_feedback.documents_marked`

**Range:** 0-100%

**Target Ranges:**
- 🟢 Excellent: 75-100%
- 🟡 Good: 60-75%
- 🟠 Fair: 40-60%
- 🔴 Poor: < 40%

**Interpretation:**
- **High Confidence**: Retrieval precision is good
- **Low Confidence**: Many irrelevant documents retrieved
- **Increasing**: RLHF boosts working
- **Decreasing**: Knowledge base quality issue or retrieval problem

### 7. Confidence Trend

**Definition:** Percentage change in average confidence compared to previous period

**Calculation:**
```typescript
confidenceTrend = ((current_conf - previous_conf) / previous_conf) * 100
```

**Target Ranges:**
- 🟢 Excellent: > +15%
- 🟡 Good: +5% to +15%
- 🟠 Neutral: -5% to +5%
- 🔴 Concerning: < -5%

**Interpretation:**
- **> +15%**: RLHF document boosts significantly improving retrieval
- **+5% to +15%**: Steady improvement in precision
- **-5% to +5%**: Stable retrieval quality
- **< -5%**: Retrieval degrading, needs investigation

---

## RAG Pipeline Metrics

### 8. Strategy Distribution

**Definition:** Breakdown of which RAG strategy was used

**Calculation:**
```typescript
strategyDistribution = {
  basic: count(strategy = 'basic'),
  'context-aware': count(strategy = 'context-aware'),
  agentic: count(strategy = 'agentic')
}
```

**Data Source:** RAG metadata from chat API

**Target Distribution:**
- Basic: 30-40% (simple queries)
- Context-Aware: 40-50% (most queries)
- Agentic: 10-20% (complex queries)

**Interpretation:**
- **Too Much Basic**: Queries not triggering enhancements
  - Action: Lower complexity threshold
- **Too Much Agentic**: Over-using expensive strategy
  - Action: Raise complexity threshold or optimize agent
- **Balanced**: Good strategy selection

### 9. Average Pipeline Duration

**Definition:** Mean time to execute RAG pipeline

**Calculation:**
```typescript
avgDuration = sum(all pipeline times) / count(all pipelines)
```

**Data Source:** RAG metadata `totalTimeMs`

**Target Ranges (by strategy):**
- Basic: 200-500ms
- Context-Aware: 500-1000ms
- Agentic: 1500-3000ms

**Interpretation:**
- **Within Range**: Normal performance
- **Above Range**: Performance issue
  - Check: API latency
  - Check: Database query speed
  - Check: Re-ranking prompt complexity
- **Below Range**: Possibly skipping steps
  - Verify: All strategies executing correctly

### 10. Re-ranking Effectiveness

**Definition:** Change in document set from initial retrieval to final

**Calculation:**
```typescript
reranking_effectiveness = {
  docs_before: initial_doc_count,
  docs_after: final_doc_count,
  precision_gain: (relevant_docs_after / total_after) - (relevant_docs_before / total_before)
}
```

**Data Source:** RAG metadata `documentsRetrieved`, `documentsReranked`

**Targets:**
- Precision Gain: > +10%
- Document Reduction: 30-50% (e.g., 20→10 docs)

**Interpretation:**
- **High Precision Gain**: Re-ranking working well
- **Low/Negative Gain**: Re-ranking not helping
  - Action: Review re-ranking prompts
  - Action: Check RLHF boost values
- **Too Much Reduction**: May be filtering out relevant docs
  - Action: Lower topK threshold

### 11. Agent Iteration Count

**Definition:** Number of steps agentic RAG took

**Calculation:**
```typescript
avgAgentSteps = sum(agent_iterations) / count(agentic_queries)
```

**Data Source:** RAG metadata `agentSteps`

**Target Range:** 2-4 steps average

**Interpretation:**
- **1 step**: Agent not iterating, possibly single-tool solutions
- **2-4 steps**: Optimal multi-step reasoning
- **> 5 steps**: Agent struggling to meet confidence threshold
  - Action: Review agent prompts
  - Action: Check tool definitions
  - Action: Lower confidence threshold

### 12. Retrieval Confidence

**Definition:** System's confidence in retrieved context

**Calculation:**
```typescript
retrieval_confidence = agent_confidence_score || reranking_top_score
```

**Data Source:** RAG metadata `confidence`

**Range:** 0-1 (0-100%)

**Target Ranges:**
- 🟢 High Confidence: > 0.7
- 🟡 Medium Confidence: 0.5-0.7
- 🔴 Low Confidence: < 0.5

**Interpretation:**
- **High Confidence**: Strong match between query and documents
- **Low Confidence**: Weak matches, may need query refinement
- **Trending Up**: System learning from feedback
- **Trending Down**: Knowledge base gaps or drift

---

## Test Metrics

### 13. Historical Test Count

**Definition:** Total number of historical hand-written tests

**Data Source:** `historical_tests` table

**Target:** 10,000+ (baseline)

**Metrics:**
- Total tests
- Tests per category
- Pass rate
- Coverage percentage

**Interpretation:**
- **High Count**: Good baseline coverage
- **Low Pass Rate**: Regressions detected
- **Missing Categories**: Gap in coverage

### 14. RLHF-Generated Test Count

**Definition:** Number of tests auto-generated from curator feedback

**Data Source:** `rlhf_generated_tests` table

**Target Growth:** +10-20 tests/week

**Metrics:**
- Total generated
- Pass/fail ratio
- Generation rate (tests/week)
- Coverage overlap with historical

**Interpretation:**
- **Growing Count**: Good feedback → test pipeline
- **High Pass Rate**: Quality test generation
- **Low Overlap**: Discovering new cases

### 15. Test Pass Rate

**Definition:** Percentage of tests passing

**Calculation:**
```typescript
passRate = (passing_tests / total_tests) * 100
```

**Target Ranges:**
- 🟢 Excellent: > 95%
- 🟡 Good: 85-95%
- 🟠 Fair: 75-85%
- 🔴 Poor: < 75%

**Interpretation:**
- **> 95%**: System stable
- **85-95%**: Normal, some known issues
- **< 85%**: Quality concerns, investigate failures

---

## User Engagement Metrics

### 16. Active Curator Count

**Definition:** Number of curators providing feedback in period

**Calculation:**
```typescript
activeCurators = count(DISTINCT user_id WHERE role = 'curator' AND feedback_in_period)
```

**Target:** 3-5 active curators minimum

**Interpretation:**
- **High Count**: Good distributed feedback
- **Low Count**: Risk of bias, recruit more curators
- **One Curator**: Single point of failure

### 17. Feedback Response Time

**Definition:** Time from conversation to curator feedback

**Calculation:**
```typescript
responseTime = avg(feedback.created_at - conversation.created_at)
```

**Target:** < 24 hours

**Interpretation:**
- **< 24hr**: Timely feedback, good loop velocity
- **> 24hr**: Delayed learning, encourage faster reviews
- **> 1 week**: Stale feedback, limited value

### 18. Thumbs Up/Down Ratio

**Definition:** Ratio of positive to negative quick feedback

**Calculation:**
```typescript
thumbsRatio = count(thumbs_up = true) / count(thumbs_up = false)
```

**Target Range:** 2:1 to 4:1 (2-4x more thumbs up)

**Interpretation:**
- **> 4:1**: Excellent quality
- **2:1 - 4:1**: Good quality
- **< 2:1**: Quality issues
- **< 1:1**: Major problems

---

## Business Impact Metrics

### 19. User Satisfaction Score

**Definition:** Combined metric of user happiness

**Calculation:**
```typescript
satisfaction = (
  avgRating * 0.4 +
  approvalRate * 0.3 +
  avgConfidence * 0.2 +
  thumbsRatio * 0.1
) / 100
```

**Range:** 0-1

**Target:** > 0.75

**Interpretation:**
- **> 0.85**: Exceptional user experience
- **0.75-0.85**: Good user experience
- **0.60-0.75**: Acceptable, needs improvement
- **< 0.60**: Poor experience, urgent action needed

### 20. Knowledge Base ROI

**Definition:** Value gained from RLHF system

**Qualitative Indicators:**
- Reduction in repeated questions
- Increase in complex query handling
- Curator time saved
- User productivity gains

**Measurement Approaches:**
- Survey users quarterly
- Track time to answer
- Monitor escalation rate
- Measure self-service success

### 21. Query Success Rate

**Definition:** Percentage of queries resulting in useful response

**Proxies:**
- Thumbs up rate
- High confidence rate
- No follow-up needed
- Task completion

**Target:** > 80%

**Interpretation:**
- **> 80%**: System meeting user needs
- **< 80%**: Gap analysis needed

---

## Monitoring Dashboard Metrics

### 22. Real-Time Event Count

**Definition:** Number of RAG pipeline events in monitoring buffer

**Data Source:** localStorage `rag-pipeline-events`

**Target:** 20 events (last hour)

**Purpose:** Live monitoring of system activity

### 23. Error Rate

**Definition:** Percentage of RAG queries that fail

**Calculation:**
```typescript
errorRate = (failed_queries / total_queries) * 100
```

**Target:** < 1%

**Alert Threshold:** > 5%

**Common Errors:**
- API timeout
- API quota exceeded
- Database connection failure
- Invalid query format

---

## Metric Collection & Reporting

### Data Collection Points

1. **Chat API** (`app/api/chat/route.ts`)
   - RAG pipeline execution
   - Strategy selection
   - Timing data
   - Confidence scores

2. **RLHF Feedback Tab** (`src/components/ui/RLHFFeedbackTab.tsx`)
   - Curator ratings
   - Document relevance marks
   - Correction text

3. **Chat UI** (`src/components/ai/ai-sdk-chat-panel.tsx`)
   - Thumbs up/down
   - User engagement

4. **Supabase** (`rlhf_feedback` table)
   - Persistent storage
   - Historical analysis

### Reporting Schedule

**Daily (Automated)**
- Active user count
- Query volume
- Error rate
- Average response time

**Weekly (Dashboard)**
- RLHF Impact Dashboard review
- Trend analysis
- Anomaly detection

**Monthly (Report)**
- Comprehensive metrics summary
- Month-over-month comparison
- Action items identified
- Improvement recommendations

**Quarterly (Review)**
- Strategic assessment
- ROI analysis
- Roadmap adjustment
- Stakeholder presentation

### Alerting Thresholds

**Critical Alerts (Immediate)**
- Error rate > 10%
- Average rating < 2.5
- System downtime
- Data loss

**Warning Alerts (Same Day)**
- Error rate > 5%
- Average rating < 3.0
- Confidence drop > 20%
- Test pass rate < 80%

**Info Alerts (Weekly Review)**
- Feedback volume < 15/week
- Single active curator
- Strategy distribution skewed
- Response time > 48hr

---

## Metric Improvement Strategies

### Improving Average Rating

**Strategies:**
1. Focus on low-rated query patterns
2. Improve re-ranking prompts
3. Expand knowledge base coverage
4. Tune query transformation
5. Train curators on rating consistency

**Timeline:** 2-4 weeks for +0.5 rating improvement

### Improving Confidence

**Strategies:**
1. Add more curator document marks
2. Apply RLHF boosts consistently
3. Clean up duplicate documents
4. Improve metadata quality
5. Tune re-ranking thresholds

**Timeline:** 1-2 weeks for +10% confidence gain

### Improving Feedback Volume

**Strategies:**
1. Gamify curator participation
2. Send reminders for pending feedback
3. Make feedback process easier
4. Show impact of previous feedback
5. Recognize top curators

**Timeline:** Immediate with process changes

### Improving Test Coverage

**Strategies:**
1. Generate tests from all feedback
2. Convert historical tests to Playwright
3. Add edge case tests manually
4. Use Fix tab test generator
5. Review test gaps quarterly

**Timeline:** Continuous, +100 tests/month target

---

## Metric Definitions Reference

### Quick Reference Table

| Metric | Formula | Target | Alert Threshold |
|--------|---------|--------|-----------------|
| Avg Rating | sum(rating) / count | > 4.0 | < 3.0 |
| Rating Trend | % change vs prev period | > +5% | < -5% |
| Feedback Count | count(feedback) | > 100/mo | < 20/mo |
| Approval Rate | (rating>=4) / total * 100 | > 80% | < 40% |
| Avg Confidence | sum(relevant/total) / count * 100 | > 75% | < 40% |
| Confidence Trend | % change vs prev period | > +10% | < -5% |
| Error Rate | (failures / total) * 100 | < 1% | > 5% |
| Response Time | avg(feedback_time - query_time) | < 24hr | > 1 week |
| Test Pass Rate | (passing / total) * 100 | > 95% | < 75% |
| User Satisfaction | weighted avg of metrics | > 0.75 | < 0.60 |

---

## Appendix: SQL Queries for Metrics

### Average Rating (30 days)
```sql
SELECT AVG(rating) as avg_rating
FROM rlhf_feedback
WHERE created_at > NOW() - INTERVAL '30 days'
  AND rating IS NOT NULL;
```

### Rating Trend
```sql
WITH current_period AS (
  SELECT AVG(rating) as avg_rating
  FROM rlhf_feedback
  WHERE created_at > NOW() - INTERVAL '30 days'
    AND rating IS NOT NULL
),
previous_period AS (
  SELECT AVG(rating) as avg_rating
  FROM rlhf_feedback
  WHERE created_at BETWEEN NOW() - INTERVAL '60 days' AND NOW() - INTERVAL '30 days'
    AND rating IS NOT NULL
)
SELECT 
  ((c.avg_rating - p.avg_rating) / p.avg_rating) * 100 as rating_trend_pct
FROM current_period c, previous_period p;
```

### Approval Rate
```sql
SELECT 
  COUNT(CASE WHEN rating >= 4 OR thumbs_up = true THEN 1 END)::float / 
  COUNT(*)::float * 100 as approval_rate
FROM rlhf_feedback
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Average Confidence
```sql
SELECT AVG(
  (SELECT COUNT(*) FROM jsonb_array_elements(documents_marked) 
   WHERE value->>'relevant' = 'true')::float / 
  jsonb_array_length(documents_marked)::float
) * 100 as avg_confidence
FROM rlhf_feedback
WHERE created_at > NOW() - INTERVAL '30 days'
  AND documents_marked IS NOT NULL
  AND jsonb_array_length(documents_marked) > 0;
```

### Curator Activity
```sql
SELECT 
  COUNT(DISTINCT user_id) as active_curators,
  COUNT(*) as total_feedback
FROM rlhf_feedback
WHERE created_at > NOW() - INTERVAL '7 days';
```

---

*Document Version: 1.0*
*Last Updated: {{ current_date }}*
*Maintained by: SIAM Development Team*

