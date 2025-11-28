# 🎯 SIAM Demo: Chat → Curate → Fix Walkthrough
**Focus:** Technical demo for knowledgeable colleagues
**Duration:** ~10 minutes
**Features:** Chat UI, RLHF Curation, Human-in-the-Loop Review, Multi-Tenant AOMA Knowledge

---

## 🎬 Demo Story Arc

**The Scenario:**  
A Sony Music engineer needs to understand how to create a new offering in AOMA. Instead of hunting through Confluence, JIRA, and asking colleagues, they use SIAM's AI-powered knowledge retrieval.

**What We Show:**
1. **Chat Tab** - Natural language Q&A with vector search
2. **Curate Tab** - RLHF feedback to improve responses
3. **Fix Tab** - HITL workflow when AI needs human guidance

---

## 📋 Pre-Demo Setup Checklist

### Database State
- [ ] Supabase has AOMA knowledge vectors loaded
- [ ] Multi-tenant isolation verified (sony-music → pde → aoma)
- [ ] At least 50+ AOMA docs embedded (JIRA + Confluence)

### Application State
- [ ] Clean browser session (no cached auth)
- [ ] All three tabs working (Chat, Curate, Fix)
- [ ] HITL breakpoints configured (low confidence threshold)
- [ ] Sample "fix" task in pending state

### Demo Data
- [ ] Pre-tested query: "How do I create a new offering in AOMA?"
- [ ] Pre-tested query: "What's the difference between assets and offerings?"
- [ ] Known good response sources ready
- [ ] Sample feedback already in curate queue

---

## 🎤 Demo Script

### **Part 1: The Chat Tab (3 minutes)**

#### Opening (30 seconds)
> "Let me show you SIAM in action. This is our multi-tenant AI-powered knowledge base. Right now, I'm querying AOMA documentation, but the same system works for USM, DAM, or any other Sony Music app—completely isolated, no cross-contamination."

#### Live Query (1 minute)
**Type into chat:**
```
How do I create a new offering in AOMA?
```

**While it's thinking, narrate:**
> "Behind the scenes, this query is:
> 1. Converted to a vector embedding (OpenAI or Gemini)
> 2. Searching our postgres vector store with HNSW indexing
> 3. Filtering by tenant: organization='sony-music', division='pde', app='aoma'
> 4. Returning top-10 most semantically relevant docs
> 5. LLM synthesizes the answer with citations"

**When response appears:**
> "Notice the response includes:
> - Direct answer to the question
> - Source citations (Confluence page IDs, JIRA tickets)
> - Confidence indicators
> - Related follow-up questions"

**Click on a source citation:**
> "These sources are real—pulled from our AOMA knowledge base. Click through and you'd see the actual Confluence page or JIRA ticket."

#### Show Multi-Tenant Isolation (1 minute)
**Type second query:**
```
What's the USM session timeout default?
```

**When it returns "no results" or "not found":**
> "See that? Even though we have USM documentation in the system, it doesn't leak into AOMA queries. Complete tenant isolation. This is the multi-tenant architecture we saw in the ERD—working in production."

**Switch tenant dropdown to "usm" and retry:**
> "Now if I switch to USM context and ask the same question..."

**Show it returns USM-specific results:**
> "There we go—now we get USM results. Same database, same code, but logically isolated."

---

### **Part 2: The Curate Tab (3 minutes)**

#### Transition (20 seconds)
> "Great answers are one thing, but how do we make them *better*? That's where RLHF comes in—Reinforcement Learning from Human Feedback. Let's look at the Curate tab."

**Click Curate tab**

#### Show Conversation Queue (1 minute)
**Point to list of conversations:**
> "This is our feedback queue. Every conversation gets logged here. Engineers can:
> - Thumbs up/down responses
> - Mark sources as helpful or not helpful
> - Flag hallucinations
> - Suggest better answers
> 
> This feedback trains the system to get better over time."

**Click on a conversation:**
> "Let me open one. Here's a conversation from yesterday where someone asked about AOMA asset metadata fields."

**Show the feedback UI:**
- Conversation history
- Response quality rating (1-5 stars)
- Source relevance checkboxes
- Free-form feedback text
- "Was this helpful?" toggle

#### Live Feedback (1 minute)
**Provide feedback on the conversation:**
> "Let's say this response was mostly good, but missed a key detail about required fields."

**Actions:**
- Rate 4/5 stars
- Check relevant sources
- Add comment: "Should mention that 'title' and 'asset_type' are required fields"
- Submit feedback

**After submission:**
> "This feedback goes into our RLHF training pipeline. The next time someone asks about AOMA assets, the system will know to emphasize required fields."

#### Show Analytics (30 seconds)
**Scroll to curate analytics section:**
> "We track:
> - Response accuracy over time
> - Most frequently corrected topics
> - Source quality by type (Confluence vs JIRA)
> - User satisfaction scores
> 
> This data drives our improvement roadmap."

---

### **Part 3: The Fix Tab (4 minutes)**

#### Transition (20 seconds)
> "Sometimes the AI gets stuck. Maybe it needs clarification, maybe it found conflicting sources, maybe the question is ambiguous. That's where Human-in-the-Loop comes in—the AI pauses and asks for human guidance."

**Click Fix tab**

#### Show Pending Tasks (1 minute)
**Point to task queue:**
> "This is our HITL queue. These are conversations where the AI hit a breakpoint and needs human guidance."

**Show task list UI:**
- Task ID
- Original query
- Reason for HITL (ambiguous, conflicting sources, low confidence)
- Status (pending, in-progress, resolved)
- Assigned to (optional)

**Click on a task:**
> "Let me open one. This user asked: 'How do I update an offering status?'"

#### Show Workflow State (1.5 minutes)
**Open the task detail view:**
> "Here's where it gets interesting. We can see the entire workflow state:"

**Point to state visualization:**
```json
{
  "query": "How do I update an offering status?",
  "step": "retrieval_complete",
  "retrieved_docs": [
    { "source": "AOMA-1234", "content": "...", "score": 0.82 },
    { "source": "CONF-456", "content": "...", "score": 0.79 }
  ],
  "issue": "conflicting_information",
  "details": "JIRA says use API endpoint, Confluence says use UI workflow",
  "awaiting": "human_decision"
}
```

**Narrate:**
> "The agent found two sources with conflicting info:
> - JIRA ticket says use the API endpoint
> - Confluence page describes the UI workflow
>
> The workflow paused at a breakpoint and asked: 'Which one should I prioritize?'"

#### Resolve the Task (1 minute)
**Show resolution UI:**
- Option 1: Pick one source (with reason)
- Option 2: Merge both (explain when to use each)
- Option 3: Escalate (mark as needs clarification)
- Option 4: Create new documentation task

**Make a decision:**
> "In this case, both are valid—API for automation, UI for manual updates. I'll choose 'Merge both'."

**Type resolution:**
```
Both methods are valid:
- Use API endpoint (/api/offerings/{id}/status) for automated workflows
- Use UI (Offerings → Edit → Status dropdown) for manual updates
Recommend showing both in the response.
```

**Click "Resolve & Continue"**

#### Show Workflow Resumes (30 seconds)
**Watch the workflow resume:**
> "Now watch - the system takes our feedback and continues from the breakpoint."

**Show updated state:**
```json
{
  "step": "synthesis",
  "decision": "merge_sources",
  "human_feedback": "Both methods valid, show both",
  "generating_response": true
}
```

**Final response appears:**
> "And here's the updated response - now it includes both methods with clear use cases. This response will be saved and used for future similar queries."

#### Show HITL Analytics (30 seconds)
**Scroll to Fix analytics:**
> "We track:
> - Average time to resolution
> - Types of conflicts (most common)
> - Breakpoint trigger reasons
> - Response improvement after HITL
> 
> This helps us tune when to interrupt vs. let the agent decide."

---

## 🎯 Closing (1 minute)

### Key Takeaways
> "So that's SIAM in action:
>
> **Chat:** Natural language Q&A with multi-tenant vector search. Sub-200ms responses with real citations.
>
> **Curate:** RLHF feedback loop. Every conversation makes the system smarter.
>
> **Fix:** Human-in-the-Loop review. AI knows when to ask for help, humans guide it, system learns.
>
> **Multi-Tenant:** AOMA knowledge stays in AOMA. USM knowledge stays in USM. Complete isolation, same codebase."

### The Architecture Behind It
**Show ERD briefly:**
> "This all runs on the architecture we discussed—3-tier multi-tenant isolation, dual embeddings, HNSW vector indexing. It's fast, scalable, and production-ready."

### Questions?
> "Questions? Want to try it yourself? Want to see the code?"

---

## 🛠️ Technical Deep Dive (If Asked)

### Multi-Tenant Query
```typescript
// Example: How we enforce tenant isolation
const results = await supabase
  .rpc('match_siam_vectors', {
    p_organization: 'sony-music',
    p_division: 'pde',
    p_app_under_test: 'aoma',
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 10
  });
```

### HITL Breakpoint Logic
```typescript
// Example: How we define HITL breakpoints
async function evaluateForHITL(state: WorkflowState): Promise<WorkflowState> {
  // Check for conditions that require human review
  const needsHumanReview =
    state.confidence < 0.6 ||           // Low confidence
    state.conflictDetected ||            // Conflicting sources
    state.retrievedDocs.length === 0;    // No relevant docs

  if (needsHumanReview) {
    return {
      ...state,
      step: 'awaiting_human',
      issue: state.conflictDetected ? 'conflicting_information' : 'low_confidence'
    };
  }

  return { ...state, step: 'synthesis' };
}
```

### RLHF Feedback Storage
```typescript
// Example: Storing feedback for training
await supabase
  .from('rlhf_feedback')
  .insert({
    conversation_id: conv.id,
    rating: 4,
    helpful_sources: ['AOMA-1234', 'CONF-456'],
    feedback_text: 'Should mention required fields',
    organization: 'sony-music',
    division: 'pde',
    app_under_test: 'aoma'
  });
```

---

## 📊 Demo Success Checklist

After the demo, you should have shown:
- Natural language query returning relevant AOMA results
- Multi-tenant isolation (AOMA != USM)
- Source citations working
- RLHF feedback workflow
- HITL breakpoint triggering on low confidence/conflicts
- Human resolution of ambiguous query
- Workflow resuming after human input
- Architecture overview (ERD)

---

## 🚨 Troubleshooting

### Chat Returns No Results
- Check tenant context (dropdown)
- Verify database has AOMA vectors
- Check embedding service is running
- Try simpler query first

### Curate Tab Empty
- Generate some conversations first
- Check supabase connection
- Verify auth permissions

### Fix Tab Has No Tasks
- This is normal if everything's working well!
- You can manually create a test task
- Or trigger a low-confidence query

### Workflow Won't Resume
- Check workflow state in debugger
- Verify breakpoint conditions
- Look for errors in console
- Restart the workflow if needed

---

## 🎥 Video B-Roll Ideas

- **Typing the query** in slow motion
- **Vector search visualization** (animated dots connecting)
- **Feedback stars** being clicked
- **Workflow state** transitioning
- **ERD pulsating** connection lines
- **Code snippets** with syntax highlighting
- **Terminal output** showing vector scores

---

## 📝 Follow-Up Materials

Share with attendees after:
- Link to GitHub repo (if open source)
- ERD diagram (static + animated)
- Sample queries they can try
- Architecture documentation
- HITL breakpoint configuration guide
- Multi-tenant setup instructions

---

**This is a technical story, not marketing. We're showing real engineers how real tech works. No fluff. Just facts.** 💪

Ready to practice this walkthrough? 🚀

