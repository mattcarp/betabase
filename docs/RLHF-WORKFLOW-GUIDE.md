# RLHF Workflow Guide

## Overview

This guide walks through the complete workflow for using the RLHF (Reinforcement Learning from Human Feedback) system in SIAM, from initial setup through continuous improvement.

---

## User Roles & Permissions

### Role Hierarchy

1. **Admin**
   - Full access to all features
   - Can manage user roles
   - Can access all RLHF features
   - Can modify system configuration

2. **Curator**
   - Access to RLHF Feedback tab
   - Can provide ratings and corrections
   - Can mark document relevance
   - Can generate tests from feedback

3. **Viewer**
   - Read-only access
   - Can use chat interface
   - Can provide thumbs up/down feedback
   - Cannot access curator features

### Permission Gates

- **RLHF Feedback Tab**: Requires `rlhf_feedback` permission
- **Knowledge Curation**: Requires `curate_knowledge` permission
- **Document Upload**: Requires `upload_documents` permission
- **Test Generation**: Requires `generate_tests` permission

### Security

- **Production**: Strict authentication always enforced
- **Localhost**: Bypass allowed for development only
- **AuthGuard**: Wraps all protected routes

---

## Workflow Phases

### Phase 1: Initial Setup (Admin)

#### 1.1 Apply Database Migrations

**Location:** Supabase Dashboard → SQL Editor

**Script:** `PASTE-INTO-SUPABASE.sql`

**Migrations Included:**
- `006_user_roles_permissions.sql` - User roles and permissions
- `007_rlhf_feedback_schema.sql` - Feedback storage
- `008_gemini_embeddings.sql` - Gemini embedding support

**Verification:**
```sql
-- Check tables exist
SELECT * FROM user_roles LIMIT 1;
SELECT * FROM rlhf_feedback LIMIT 1;
SELECT * FROM siam_vectors LIMIT 1;
```

#### 1.2 Assign User Roles

**Via Supabase SQL Editor:**
```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Assign curator role
INSERT INTO user_roles (user_id, role_name, assigned_by)
VALUES ('your-user-id', 'curator', 'system')
ON CONFLICT (user_id) DO UPDATE SET role_name = 'curator';
```

**Via Taskmaster (future):**
```bash
task-master admin assign-role --email="user@example.com" --role="curator"
```

#### 1.3 Configure AI Models

**Via Taskmaster:**
```bash
task-master models --setup
```

**Interactive prompts:**
- Select main model (e.g., Gemini 1.5 Pro)
- Select research model (e.g., Perplexity Sonar)
- Select fallback model (e.g., Claude 3.5 Sonnet)

**Via MCP:**
```typescript
await mcp_models({
  setMain: 'gemini-1.5-pro',
  setResearch: 'perplexity-sonar-pro',
  setFallback: 'claude-3-5-sonnet'
});
```

#### 1.4 Verify Environment Variables

**Check `.env` file:**
```bash
GOOGLE_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
PERPLEXITY_API_KEY=your-perplexity-key
```

**Check `.cursor/mcp.json`:**
```json
{
  "env": {
    "GOOGLE_API_KEY": "your-gemini-key",
    "ANTHROPIC_API_KEY": "your-anthropic-key",
    "PERPLEXITY_API_KEY": "your-perplexity-key"
  }
}
```

---

### Phase 2: Daily Operations (All Users)

#### 2.1 Using Chat Interface

**For All Users:**

1. **Ask Questions**: Use natural language queries
2. **Check RAG Badges**: See which strategy was used
   - 📊 Strategy: Basic, Context-Aware, or Agentic
   - 🔄 Re-ranked: Document filtering applied
   - 🔧 Agent Steps: Multi-step reasoning used
   - ✓ Confidence: System's confidence in answer
   - ⚡ Time: Processing duration
3. **Provide Feedback**: Click thumbs up/down
   - Thumbs up: Response was helpful
   - Thumbs down: Response needs improvement
4. **Review Conversations**: Check history in sidebar

**Best Practices:**
- Be specific in queries for better results
- Check confidence level - low confidence may need refinement
- Provide feedback to improve future responses
- Use follow-up questions to refine answers

#### 2.2 Curator Feedback Workflow

**For Curators Only:**

1. **Navigate to Curate Tab**
   - Click "Curate" in main navigation
   - Select "RLHF Feedback" sub-tab

2. **Review Pending Feedback**
   - Queue shows items needing curator review
   - Stats displayed: Pending, Reviewed, Avg Rating
   - Items sorted by most recent first

3. **Provide Detailed Feedback**
   - **Read Query & Response**: Understand the interaction
   - **Rate Quality**: 1-5 star rating
     - 5: Excellent, exactly what was needed
     - 4: Good, minor improvements possible
     - 3: Acceptable, but could be better
     - 2: Poor, significant issues
     - 1: Very poor, completely wrong
   - **Mark Document Relevance**: 
     - Toggle each retrieved document
     - Green = Relevant
     - Red = Not Relevant
   - **Add Correction Text**: 
     - Explain what was wrong
     - Provide expected answer
     - Note missing information
   - **Submit Feedback**

4. **Monitor Impact**
   - Check RLHF Impact Dashboard
   - Review rating trends
   - Track confidence improvements

**Curator Best Practices:**
- Provide feedback promptly (within 24 hours)
- Be consistent in rating criteria
- Mark document relevance carefully - this directly impacts future retrievals
- Add detailed correction text - helps with test generation
- Focus on high-impact queries first

---

### Phase 3: Testing & Quality Assurance

#### 3.1 Historical Test Review

**Location:** Test Tab → Historical Tests

**Actions:**
1. **Search Tests**: Use search bar to find relevant tests
2. **Filter by Category**: Click category badges
3. **Convert to Playwright**: Modernize old tests
4. **Link to RLHF**: Connect tests to feedback
5. **Run Tests**: Validate current behavior

**Use Cases:**
- Regression testing after changes
- Baseline validation
- Edge case discovery
- Domain knowledge reference

#### 3.2 RLHF-Generated Tests

**Location:** Test Tab → RLHF Tests

**Workflow:**
1. **Review Auto-Generated Tests**
   - Tests created from curator corrections
   - Based on high-confidence feedback
2. **Run Tests**: Validate test cases
3. **Monitor Pass/Fail**: Track test health
4. **Generate More**: Create tests from new feedback

**Generation Criteria:**
- Rating >= 4 or thumbs_up = true
- Curator provided correction text
- Documents marked as relevant/irrelevant
- Query-response pair is clear

#### 3.3 Test Case Generation (Fix Tab)

**Location:** Fix Tab → Test Generator

**Manual Test Creation:**
1. **Select Conversation**: Pick chat interaction
2. **Review Context**: Check query and response
3. **Configure Test**:
   - Test type: Unit, Integration, E2E
   - Assertions: Expected behavior
   - Setup: Required state/data
4. **Generate Code**: Create Playwright test
5. **Review & Save**: Edit if needed
6. **Run Test**: Validate immediately

**Generated Test Structure:**
```typescript
test('User query: [query text]', async ({ page }) => {
  // Setup
  await page.goto('/');
  await login(page);
  
  // Action
  await sendChatMessage(page, '[query text]');
  
  // Assertions
  await expect(page.locator('[ai-response]')).toContainText('[expected text]');
  await expect(page.locator('[rag-badge]')).toContainText('[expected strategy]');
  
  // Verify documents
  const docs = await page.locator('[retrieved-docs]').count();
  expect(docs).toBeGreaterThan(0);
});
```

---

### Phase 4: Monitoring & Improvement

#### 4.1 Live RAG Monitor

**Location:** Test Tab → Live Monitor

**Real-Time Metrics:**
- Recent pipeline events (last 20)
- Average duration
- Average confidence
- Strategy distribution

**Event Details:**
- Query text
- Strategy used
- Pipeline stages (with timing)
- Confidence score
- Document count (before/after re-ranking)
- Agent steps (if applicable)

**Monitoring Tips:**
- Check during peak usage
- Look for slow queries (>2s)
- Identify low confidence patterns
- Monitor strategy distribution

#### 4.2 RLHF Impact Dashboard

**Location:** Test Tab → Impact Metrics

**Key Metrics:**
- **Average Rating**: Trending up = system improving
- **Total Feedback**: Higher = more data to learn from
- **Approval Rate**: % of responses rated 4-5
- **Average Confidence**: System's self-assessment

**30-Day Trends:**
- **Rating Trend**: Visual chart of avg rating over time
- **Confidence Trend**: Document relevance confidence
- **Feedback Volume**: Daily feedback count

**Insights:**
- Positive trends highlighted in green
- High approval rates celebrated
- Confidence increases noted
- No data prompts action

**Review Schedule:**
- Daily: Quick stats check
- Weekly: Full trend analysis
- Monthly: Comprehensive review with team

#### 4.3 RAG Strategy Comparison

**Location:** Fix Tab → Response Debugger (Advanced Mode)

**A/B Testing:**
1. **Select Query**: Choose test query
2. **Run Comparison**:
   - Basic RAG (no enhancements)
   - Advanced RAG (all strategies)
3. **Review Results**:
   - Side-by-side responses
   - Document comparisons
   - Confidence scores
   - Timing differences
4. **Analyze Impact**:
   - Precision improvement
   - Recall changes
   - Latency trade-offs

**Comparison Metrics:**
```typescript
{
  basic: {
    response: string;
    documents: Doc[];
    confidence: number;
    timeMs: number;
  },
  advanced: {
    response: string;
    documents: Doc[];
    confidence: number;
    timeMs: number;
    strategy: 'context-aware' | 'agentic';
    agentSteps?: number;
  },
  improvement: {
    confidenceDelta: number;
    timeDelta: number;
    documentOverlap: number;
    betterResponse: boolean;
  }
}
```

---

### Phase 5: Debugging & Fixes

#### 5.1 Response Debugger

**Location:** Fix Tab → Response Debugger

**Use When:**
- Response is incorrect
- Low confidence score
- Unexpected documents retrieved
- System behaving oddly

**Debug Steps:**
1. **Select Conversation**: Pick problematic interaction
2. **View Pipeline Trace**:
   - Original query
   - Query transformation (if context-aware)
   - Vector search results
   - Re-ranking scores
   - Agent decisions (if agentic)
   - Final context
   - LLM generation
3. **Identify Issue**:
   - Wrong documents retrieved?
   - Query transformation incorrect?
   - Re-ranking failed?
   - Agent made wrong decisions?
4. **Document Findings**: Add to feedback

**Common Issues:**
- **Poor Retrieval**: Vector search not finding relevant docs
  - Fix: Add more examples to knowledge base
  - Fix: Improve document metadata
- **Bad Re-ranking**: Relevant docs scored low
  - Fix: Add curator feedback marking correct docs
- **Wrong Strategy**: Basic RAG used when should be agentic
  - Fix: Adjust complexity threshold
- **Low Confidence**: System unsure of results
  - Fix: Provide more feedback on similar queries

#### 5.2 Quick Fix Panel

**Location:** Fix Tab → Quick Fix

**Use When:**
- Response has minor errors
- Need immediate correction
- Want to test better answer

**Workflow:**
1. **Select Response**: Pick message to fix
2. **Edit Content**: 
   - Fix factual errors
   - Improve wording
   - Add missing information
   - Remove incorrect statements
3. **Mark Changes**: Highlight what changed
4. **Save Correction**: 
   - Stores in RLHF feedback
   - Links to original query
   - Used for future training
5. **Regenerate (Optional)**: Test if correction works

**Correction Format:**
```typescript
{
  originalResponse: string;
  correctedResponse: string;
  changesExplanation: string;
  documentIssues?: string[]; // IDs of problematic docs
  queryIssues?: string; // Problems with query understanding
}
```

---

## Continuous Improvement Loop

### Week 1-2: Baseline Collection

**Goals:**
- Collect initial feedback
- Establish baseline metrics
- Identify common query patterns

**Actions:**
- Use chat normally
- Provide thumbs up/down
- Curators review all feedback
- Document initial challenges

**Metrics to Track:**
- Average rating: Target > 3.5
- Feedback volume: Target > 20/week
- Confidence: Baseline measurement

### Week 3-4: Strategy Refinement

**Goals:**
- Apply learnings from feedback
- Tune strategy selection
- Improve query transformation

**Actions:**
- Review RLHF Impact Dashboard
- Adjust confidence thresholds
- Refine query transformation prompts
- Add more curator-approved docs

**Expected Improvements:**
- Rating increase: +0.2-0.5
- Confidence increase: +5-10%
- Response quality: Noticeable

### Month 2-3: Optimization

**Goals:**
- Fine-tune all components
- Reduce latency
- Increase coverage

**Actions:**
- A/B test strategy configurations
- Optimize re-ranking prompts
- Expand knowledge base
- Generate more RLHF tests

**Expected Improvements:**
- Rating: Approaching 4.0
- Confidence: 70-80%
- Approval rate: >70%

### Month 4+: Maintenance

**Goals:**
- Sustain quality
- Catch regressions
- Handle edge cases

**Actions:**
- Weekly metric reviews
- Monthly curator meetings
- Quarterly strategy evaluations
- Continuous feedback collection

**Expected State:**
- Rating: Stable at 4.0+
- Confidence: Stable at 75-85%
- Approval rate: >80%
- Test coverage: Comprehensive

---

## Escalation & Support

### Issue Severity Levels

**P0 - Critical (Immediate)**
- System down
- Data loss
- Security breach
- All responses failing

**Actions:**
- Contact admin immediately
- Check Supabase status
- Review API quotas
- Check error logs

**P1 - High (Same Day)**
- Significant quality degradation
- RLHF feedback not saving
- RAG strategies not working
- Major performance issues

**Actions:**
- File bug report
- Provide reproduction steps
- Check recent changes
- Review debug logs

**P2 - Medium (This Week)**
- Minor quality issues
- Occasional errors
- UI bugs
- Feature requests

**Actions:**
- Document issue
- Add to backlog
- Discuss in weekly meeting
- Plan fix timeline

**P3 - Low (When Possible)**
- Cosmetic issues
- Enhancement ideas
- Documentation updates
- Nice-to-have features

**Actions:**
- Add to roadmap
- Discuss in planning
- Community contribution?

### Support Channels

1. **Internal Slack**: #siam-support
2. **GitHub Issues**: For bugs and features
3. **Email**: siam-support@company.com
4. **Weekly Office Hours**: Tuesdays 2-3pm

---

## Best Practices Summary

### For All Users
✅ Use specific, detailed queries
✅ Check RAG badges to understand responses
✅ Provide thumbs up/down feedback
✅ Report issues via Fix tab
❌ Don't ignore low confidence warnings
❌ Don't skip feedback - it helps everyone

### For Curators
✅ Review feedback within 24 hours
✅ Be consistent in rating criteria
✅ Mark document relevance carefully
✅ Add detailed correction text
✅ Monitor impact metrics weekly
❌ Don't rush through reviews
❌ Don't ignore document relevance
❌ Don't skip correction explanations

### For Developers
✅ Monitor live RAG metrics daily
✅ Review impact dashboard weekly
✅ Run A/B comparisons before changes
✅ Generate tests from feedback
✅ Document architecture changes
❌ Don't change thresholds without testing
❌ Don't skip regression tests
❌ Don't ignore curator feedback

### For Admins
✅ Maintain API key security
✅ Monitor usage and costs
✅ Regular database backups
✅ User role audits quarterly
✅ System health checks weekly
❌ Don't expose keys in code
❌ Don't skip security updates
❌ Don't ignore error logs

---

## Quick Reference Commands

### Taskmaster
```bash
# View tasks
task-master list

# Next task
task-master next

# Show task details
task-master show 5.2

# Set task status
task-master set-status --id=5.2 --status=done

# Generate documentation
task-master generate

# Configure models
task-master models --setup
```

### Supabase SQL
```sql
-- Get user role
SELECT role_name FROM user_roles WHERE user_id = 'your-id';

-- Get recent feedback
SELECT * FROM rlhf_feedback ORDER BY created_at DESC LIMIT 10;

-- Get curator-approved docs
SELECT documents_marked FROM rlhf_feedback 
WHERE rating >= 4 OR thumbs_up = true;

-- Get feedback stats
SELECT 
  COUNT(*) as total,
  AVG(rating) as avg_rating,
  COUNT(CASE WHEN thumbs_up THEN 1 END) as thumbs_up_count
FROM rlhf_feedback;
```

### NPM Scripts
```bash
# Start dev server
npm run dev

# Run type checking
npm run type-check

# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test tests/e2e/rlhf-curate-integration.spec.ts
```

---

*Document Version: 1.0*
*Last Updated: {{ current_date }}*
*Maintained by: SIAM Development Team*

