# Advanced RAG System Architecture

## Overview

The SIAM project implements a state-of-the-art RAG (Retrieval-Augmented Generation) system with three integrated strategies:
1. **Re-ranking** - Two-stage retrieval with precision filtering
2. **Context-Aware Retrieval** - Query transformation using conversational context
3. **Agentic RAG** - Multi-step reasoning with tool utilization

This system is enhanced with **Reinforcement Learning from Human Feedback (RLHF)** to continuously improve based on curator input.

---

## System Architecture

### High-Level Data Flow

```
User Query → Context-Aware Query Transformation 
           → Vector Search (Initial Retrieval) 
           → Re-ranking with Gemini + RLHF Boosts 
           → Agentic RAG (if complex) 
           → LLM Generation 
           → User Response + RAG Metadata Badges
           → HITL Feedback Collection
           → RLHF Storage & Learning Loop
```

### Core Components

#### 1. **UnifiedRAGOrchestrator** (`src/services/unifiedRAGOrchestrator.ts`)

The central orchestrator that coordinates all RAG strategies.

**Key Methods:**
- `query(query, options)` - Main entry point for RAG queries
- Automatically selects strategy based on query complexity and session state
- Returns results with metadata (strategy, confidence, timing, documents)

**Options:**
```typescript
{
  sessionId: string;              // For context tracking
  organization: string;           // For scoped retrieval
  division: string;
  app_under_test: string;
  useContextAware?: boolean;      // Enable context-aware query transform
  useAgenticRAG?: boolean;        // Enable multi-step agentic reasoning
  useRLHFSignals?: boolean;       // Apply RLHF boosts
  topK?: number;                  // Number of docs to return
  targetConfidence?: number;      // Min confidence threshold
}
```

#### 2. **GeminiReranker** (`src/services/geminiReranker.ts`)

Implements precision filtering using Gemini API for relevance scoring.

**Key Features:**
- Cross-encoder style scoring between query and documents
- RLHF boost integration - applies curator-approved document boosts
- Returns top K documents based on relevance scores

**RLHF Integration:**
- Loads curator-marked documents from `rlhf_feedback` table
- Calculates boost based on:
  - Base 10% for any curator approval
  - +2% per additional approval
  - +5% for highly rated (avg rating >= 4.5)
  - Capped at 30% total boost

#### 3. **ContextAwareRetrieval** (`src/services/contextAwareRetrieval.ts`)

Transforms queries using conversational history and RLHF signals.

**Key Features:**
- Loads recent conversation history from session state
- Loads positive RLHF feedback (rating >= 4 or thumbs_up = true)
- Uses Gemini to rewrite queries with:
  - Previous conversation context
  - Topic preferences
  - Successful query patterns from feedback
  - Curator-approved documents

**Example Transformation:**
```
Original: "What about permissions?"
Enhanced: "How do I implement role-based access control (RBAC) 
           and user permissions in the IOMA data management system, 
           considering we discussed authentication in the previous query?"
```

#### 4. **Agentic RAG Framework** (`src/services/agenticRAG/`)

Multi-step reasoning framework with tool utilization.

**Components:**
- `agent.ts` - Main orchestration logic
- `tools.ts` - Domain-aware tool definitions

**Available Tools:**
- `vector_search` - Perform vector similarity search
- `confidence_check` - Evaluate confidence of current context
- `query_rewriter` - Rewrite query for better retrieval
- `feedback_logger` - Log decisions for human review

**Agent Loop:**
1. Evaluate current context confidence
2. If confidence < target, select and execute tool
3. Incorporate tool results
4. Repeat up to max iterations or until confidence met
5. Return final context with metadata

#### 5. **Session State Manager** (`src/lib/sessionStateManager.ts`)

Persists conversational context for context-aware retrieval.

**Stored Data:**
- Full conversation history (queries + responses)
- Successful retrieval results
- Explicit reinforcement signals (thumbs up/down, ratings)
- Topic preferences (weighted by frequency and feedback)

#### 6. **RLHF Feedback System**

**Database Schema** (`rlhf_feedback` table):
```sql
- id: uuid (primary key)
- conversation_id: text
- user_query: text
- ai_response: text
- rating: integer (1-5)
- thumbs_up: boolean
- feedback_text: text
- documents_marked: jsonb (array of {id, relevant})
- created_at: timestamp
- updated_at: timestamp
```

**UI Components:**
- **RLHFFeedbackTab** - Curator feedback interface
- **Chat Thumbs Up/Down** - Inline HITL buttons
- **Document Relevance Markers** - Mark which docs were helpful

**Learning Loop:**
1. Collect feedback from curators and users
2. Store in `rlhf_feedback` table
3. ContextAwareRetrieval loads positive feedback for query transformation
4. GeminiReranker applies boosts to curator-approved documents
5. System improves over time as more feedback is collected

---

## API Integration

### Chat API Route (`app/api/chat/route.ts`)

**RAG Integration Points:**

1. **Initialize Services:**
```typescript
const unifiedRAG = new UnifiedRAGOrchestrator();
const sessionManager = getSessionStateManager();
```

2. **Execute RAG Query:**
```typescript
const ragResult = await unifiedRAG.query(queryString, {
  sessionId,
  organization: 'sony-music',
  division: 'mso',
  app_under_test: 'siam',
  useContextAware: true,
  useAgenticRAG: queryComplexity > 7,
  useRLHFSignals: true,
  topK: 5,
  targetConfidence: 0.7
});
```

3. **Attach RAG Metadata:**
```typescript
ragMetadata = {
  strategy: ragResult.metadata.strategy,
  documentsReranked: ragResult.metadata.usedContextAware,
  agentSteps: ragResult.metadata.agentIterations || 0,
  confidence: ragResult.metadata.confidence,
  timeMs: ragResult.metadata.totalTimeMs,
  initialDocs: ragResult.documents.length,
  finalDocs: ragResult.documents.length
};

// Attach to response headers
response.headers.set('X-RAG-Metadata', JSON.stringify(ragMetadata));
```

4. **Record Session State:**
```typescript
await sessionManager.addToHistory(sessionId, {
  query: queryString,
  timestamp: new Date().toISOString(),
  userId: 'current-user'
});

if (ragResult.metadata.confidence > 0.7) {
  await sessionManager.recordSuccessfulRetrieval(sessionId, {
    query: queryString,
    documents: ragResult.documents,
    confidence: ragResult.metadata.confidence
  });
}
```

### Chat UI (`src/components/ai/ai-sdk-chat-panel.tsx`)

**RAG Proof Badges:**

After each AI response, metadata badges are displayed:
- 📊 Strategy (Basic, Context-Aware, Agentic)
- 🔄 Re-ranking (initial → final doc count)
- 🔧 Agent steps (if agentic)
- ✓ Confidence percentage
- ⚡ Time taken

**HITL Feedback Buttons:**

Thumbs up/down buttons on each AI message:
- Saves feedback to `rlhf_feedback` table
- Includes `conversation_id`, `user_query`, `ai_response`, `rating`, `thumbs_up`
- Disabled after feedback given to prevent duplicates

---

## Configuration

### Environment Variables

Required API keys (set in `.env` or `.cursor/mcp.json`):
- `ANTHROPIC_API_KEY` - For Sonnet 4.5 (future high-level decisions)
- `GOOGLE_API_KEY` - For Gemini API (embeddings, generation, reranking)
- `PERPLEXITY_API_KEY` - For research-backed operations (optional)

### Taskmaster Config (`.taskmaster/config.json`)

AI model settings managed via `task-master models` command:
- Main model: Used for primary RAG operations
- Research model: Used for research-backed query transformation
- Fallback model: Used if primary fails

### Feature Flags

- Query complexity threshold: `queryString.split(' ').length > 15 ? 8 : 5`
- Agentic RAG enabled if `queryComplexity > 7`
- Context-aware always enabled
- RLHF signals always enabled

---

## Performance Characteristics

### Typical Latencies

- **Basic RAG**: 200-500ms
- **Context-Aware + Re-ranking**: 500-1000ms
- **Agentic RAG (3 steps)**: 1500-3000ms

### Optimization Strategies

1. **Parallel Processing**: Re-ranking happens in parallel with confidence checks
2. **Caching**: Session state cached in memory
3. **Early Exit**: Agentic loop exits early if confidence threshold met
4. **Batch Scoring**: Re-ranking scores multiple documents in single API call

### Resource Usage

- Memory: ~50MB per session (conversation history)
- Database: ~1KB per feedback item
- Vector DB: 768 dimensions per embedding (Gemini)

---

## Monitoring & Observability

### Live RAG Monitor

Real-time dashboard showing:
- Recent pipeline events (last 20)
- Average duration and confidence
- Strategy distribution
- Pipeline stage visualization

### RLHF Impact Dashboard

Tracks improvement over time:
- Average rating trend (30 days)
- Feedback volume
- Approval rate
- Confidence trend

### Metrics

Key metrics logged for each query:
- `strategy`: Which RAG strategy was used
- `confidence`: Final confidence score (0-1)
- `totalTimeMs`: Total processing time
- `agentIterations`: Number of agentic steps
- `documentsRetrieved`: Initial doc count
- `documentsReranked`: Final doc count after re-ranking

---

## Testing Strategy

### Component Tests

- Unit tests for each service (reranker, context-aware, agent)
- Mock Gemini API responses
- Test RLHF boost calculation logic

### Integration Tests

- Full RAG pipeline tests
- Session state persistence
- Feedback loop closure

### E2E Tests (Playwright)

- Visual verification with screenshots
- RLHF feedback tab interaction
- Thumbs up/down functionality
- RAG metadata badge display

See `tests/e2e/rlhf-curate-integration.spec.ts` for comprehensive test suite.

### Historical Test Suite

10k+ hand-written tests from previous years provide:
- Regression testing baseline
- Domain knowledge validation
- Edge case coverage

See `docs/EXISTING-TEST-SUITE.md` for details.

---

## Troubleshooting

### Common Issues

#### 1. No RAG metadata badges showing in chat

**Symptoms:** Chat works but no strategy badges appear

**Causes:**
- RAG query not executing
- Metadata not attached to response headers
- UI not reading headers

**Fix:**
1. Check console logs for "🌟 Executing Advanced RAG"
2. Verify `X-RAG-Metadata` header in network tab
3. Check browser console for header parsing errors

#### 2. RLHF feedback not saving

**Symptoms:** Thumbs up/down buttons don't work or feedback doesn't appear in Curate tab

**Causes:**
- Database migrations not applied
- Supabase connection issues
- Permissions error

**Fix:**
1. Apply migrations: See `PASTE-INTO-SUPABASE.sql`
2. Check Supabase connection in console
3. Verify RLS policies on `rlhf_feedback` table

#### 3. Context-aware retrieval not using feedback

**Symptoms:** Query transformation not considering previous feedback

**Causes:**
- No positive feedback in database (rating < 4)
- Session ID mismatch
- RLHF signals disabled

**Fix:**
1. Add test feedback via Curate tab
2. Check session ID consistency
3. Verify `useRLHFSignals: true` in orchestrator options

#### 4. Agentic RAG not triggering

**Symptoms:** Only basic RAG used even for complex queries

**Causes:**
- Query complexity threshold not met
- Agentic RAG disabled in options

**Fix:**
1. Check query complexity: `queryString.split(' ').length`
2. Verify `useAgenticRAG` option is true
3. Lower complexity threshold if needed

#### 5. Re-ranking not improving results

**Symptoms:** Document order same before/after re-ranking

**Causes:**
- Gemini API not responding
- All documents scored equally
- RLHF boosts not applying

**Fix:**
1. Check Gemini API key and quota
2. Review re-ranking prompt clarity
3. Verify curator-marked documents exist in feedback

### Debug Tools

#### Response Debugger (Fix Tab)

Shows full RAG pipeline trace:
- Query transformation steps
- Vector search results
- Re-ranking scores
- Agent decisions
- Final context

#### Quick Fix Panel (Fix Tab)

Edit AI responses and save corrections:
- Corrections feed back into RLHF system
- Helps identify systemic issues

#### Test Case Generator (Fix Tab)

Generate Playwright tests from feedback:
- Captures expected behavior
- Creates regression tests
- Augments historical test suite

---

## Best Practices

### For Curators

1. **Be Specific**: Provide detailed feedback on what was right/wrong
2. **Mark Documents**: Indicate which retrieved docs were/weren't helpful
3. **Use Ratings**: High ratings (4-5) for excellent responses, low (1-2) for poor
4. **Add Context**: Feedback text field is valuable for explaining corrections

### For Developers

1. **Monitor Metrics**: Check Impact Dashboard weekly to track improvement
2. **Review Feedback**: Read curator feedback to identify patterns
3. **Test Strategies**: Use RAG Comparison to A/B test configurations
4. **Tune Thresholds**: Adjust confidence and complexity thresholds based on usage

### For Users

1. **Use Thumbs**: Quick feedback helps the system learn
2. **Be Patient**: Complex queries may take longer with agentic RAG
3. **Check Badges**: RAG metadata shows what happened behind the scenes
4. **Report Issues**: Use Fix tab to report problems with responses

---

## Future Enhancements

### Planned Features

1. **Fine-tuning**: Use RLHF feedback to fine-tune Gemini models
2. **Multi-modal**: Support image and document retrieval
3. **Streaming RAG**: Stream intermediate retrieval results
4. **Hybrid Search**: Combine vector + keyword + metadata search
5. **Auto-correction**: Automatically apply curator corrections in real-time

### Research Directions

1. **Adaptive Thresholds**: ML-based threshold tuning
2. **Personalization**: Per-user RAG strategy preferences
3. **Collaborative Filtering**: Use feedback from similar users
4. **Explainability**: Better visibility into why documents were retrieved

---

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [RAG Best Practices](https://www.anthropic.com/research/contextual-retrieval)
- [RLHF Overview](https://huggingface.co/blog/rlhf)
- [Agentic RAG Patterns](https://www.llamaindex.ai/blog/agentic-rag)
- Taskmaster MCP Tools: `docs/.cursor/rules/taskmaster/taskmaster.mdc`

---

*Document Version: 1.0*
*Last Updated: {{ current_date }}*
*Maintained by: SIAM Development Team*

