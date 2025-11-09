# SIAM Feature Roadmap 2025

**Last Updated**: November 9, 2025
**Status**: Proposed Features - Prioritized by Impact
**Context**: Post-RLHF Implementation, 15k+ Vectors, 10k+ Historical Tests

---

## 📋 **Executive Summary**

This roadmap outlines 6 strategic features to enhance SIAM's AI-powered meeting intelligence capabilities. Each feature is prioritized by business impact, technical feasibility, and alignment with product vision.

**Current State**:
- ✅ RLHF learning loop complete (3 RAG strategies)
- ✅ Multi-tenant vector store (15,197 vectors)
- ✅ 10,000+ historical tests documented
- ✅ Security hardened, performance baseline established
- ✅ Production deployed (https://thebetabase.com)

**Strategic Priorities**:
1. Leverage existing investments (10k+ historical tests)
2. Dramatic UX improvements (performance, voice)
3. AI optimization (auto-routing, query suggestions)
4. Team collaboration (multi-curator RLHF)

---

## 🎯 **Feature Proposals**

### **Option 1: Beta Base Historical Test Integration Engine** ⭐ HIGHEST PRIORITY

#### **Strategic Value**
Unlock 10,000+ Beta Base scenarios (test cases) + execution history representing years of accumulated domain knowledge and regression prevention.

**Source**: Beta Base (legacy test management system) - See `docs/BETA-BASE-ERD.md`

**Key Distinction**:
- **Scenarios**: 10,000+ test case templates with query patterns and expected behaviors
- **Test Executions**: Historical runs showing pass/fail trends over time
- **Both** provide valuable data for RLHF integration

#### **Business Impact**
- **ROI**: Massive - Leverages existing $100k+ investment in test creation
- **Risk Reduction**: Prevents known regressions automatically (historical execution data)
- **Quality**: 10x better RLHF with historical context from actual user queries
- **Speed**: Faster test creation via proven query patterns
- **Knowledge Transfer**: Years of Beta Base domain expertise

#### **What It Enables**
1. **Automatic Historical Linking**
   - When new RLHF feedback arrives, find similar Beta Base scenarios
   - Surface past execution history for same query patterns
   - Warn "This query pattern failed 15 times in Beta Base due to X"
   - Show trend: "Used to pass, started failing in 2023"

2. **Beta Base Explorer**
   - Search 10k+ scenarios by keyword, category, query pattern
   - View test execution history over time
   - Filter by pass rate, age, category
   - See execution frequency (how often was this scenario run?)
   - Identify regression-prone areas

3. **Test Conversion Pipeline**
   - Convert high-value historical tests → Modern Playwright format
   - Auto-generate test cases from historical patterns
   - Mark obsolete tests (no longer relevant)
   - Tag with RLHF categories for integration

4. **Pattern Analysis Dashboard**
   - Identify common query patterns across 10k tests
   - Find coverage gaps (what's not tested)
   - Suggest new test cases based on gaps
   - Track which patterns cause most failures

5. **Knowledge Transfer System**
   - Extract learnings from old test failures
   - Document "known issues" from historical data
   - Build institutional memory into AI system
   - Prevent repeating past mistakes

#### **Handling Outdated Beta Base Data**

**Challenge**: Many Beta Base scenarios were created "several years ago" and may reference:
- ❌ Old AOMA features that no longer exist
- ❌ Deprecated terminology (IOMA vs AOMA)
- ❌ Outdated UI workflows
- ❌ Changed API endpoints

**Solution**: Smart Relevance Scoring & Multi-Tier Classification

**Three-Tier Strategy**:
1. **GOLD (Keep As-Is)**: Recent scenarios (< 2 years), timeless patterns, high pass rates
2. **SILVER (Needs Updating)**: Good query patterns, outdated specifics, worth modernizing
3. **BRONZE (Archive)**: Historical reference only, pattern extraction value
4. **TRASH (Discard)**: Completely obsolete, no salvageable value

**Relevance Scoring Algorithm**:
```typescript
interface RelevanceScore {
  overallScore: number;  // 0-100
  breakdown: {
    temporal: number;    // Age-based score (0-25)
    semantic: number;    // Still relevant to current AOMA? (0-35)
    technical: number;   // References valid features/APIs? (0-20)
    pattern: number;     // Query pattern still useful? (0-20)
  };
  recommendation: 'KEEP' | 'UPDATE' | 'ARCHIVE' | 'DISCARD';
}

// Score >= 75: GOLD (keep as-is)
// Score 50-74: SILVER (update)
// Score 25-49: BRONZE (archive but extract patterns)
// Score < 25: TRASH (discard)
```

**Expected Distribution** (estimated):
- GOLD: ~2,000 scenarios (20%) - Recent or timeless
- SILVER: ~4,000 scenarios (40%) - Good patterns, needs modernization
- BRONZE: ~3,000 scenarios (30%) - Pattern extraction only
- TRASH: ~1,000 scenarios (10%) - Discard

**Net Value**: 6,000 usable scenarios (with 4,000 requiring AI-assisted modernization)

See `docs/BETA-BASE-ERD.md` for detailed migration strategy.

---

#### **Technical Architecture**

**Database Schema** (Beta Base - actual structure):
```sql
-- SCENARIOS table (test case templates)
-- ~10,000+ scenarios in Beta Base
CREATE TABLE scenarios (
  id TEXT PRIMARY KEY,
  test_script TEXT,          -- The test code/steps
  test_description TEXT,     -- Human-readable description
  input_query TEXT,          -- Query to test
  expected_output TEXT,      -- Expected result
  category TEXT,             -- e.g., "aoma-search", "jira-integration"
  priority TEXT,             -- 'high', 'medium', 'low'
  created_date TIMESTAMP,    -- When created (many years ago)
  created_by TEXT,
  tags TEXT[],
  metadata JSONB
);

-- TESTS table (test execution history)
-- Many executions per scenario showing trends over time
CREATE TABLE tests (
  id TEXT PRIMARY KEY,
  scenario_id TEXT REFERENCES scenarios(id),  -- FK to scenario
  actual_output TEXT,        -- What system actually returned
  pass_fail BOOLEAN,         -- Did it match expected?
  execution_date TIMESTAMP,  -- When this run happened
  execution_time_ms INT,     -- Performance tracking
  error_message TEXT,        -- If failed, why?
  environment TEXT,          -- 'production', 'staging', 'dev'
  executed_by TEXT,
  system_version TEXT,       -- AOMA version at test time
  metadata JSONB
);

-- New linking table (SIAM database, not Beta Base)
-- Links Beta Base scenarios to RLHF feedback
CREATE TABLE beta_base_scenario_links (
  id UUID PRIMARY KEY,
  beta_base_scenario_id TEXT,      -- From Beta Base scenarios table
  rlhf_feedback_id UUID REFERENCES rlhf_feedback(id),
  similarity_score FLOAT,          -- How similar is the query?
  link_reason TEXT,                -- Why linked (similar pattern, etc.)
  created_at TIMESTAMP
);

-- Track relevance scores for Beta Base scenarios
CREATE TABLE beta_base_scenario_tiers (
  scenario_id TEXT PRIMARY KEY,
  tier TEXT,                       -- 'GOLD', 'SILVER', 'BRONZE', 'TRASH'
  relevance_score INT,             -- 0-100
  reasoning TEXT,                  -- Why this tier?
  analyzed_at TIMESTAMP
);

-- Track scenario conversion to modern Playwright tests
CREATE TABLE beta_base_conversions (
  id UUID PRIMARY KEY,
  scenario_id TEXT,                -- From Beta Base scenarios table
  playwright_test_path TEXT,       -- Path to converted test
  conversion_date TIMESTAMP,
  conversion_status TEXT,          -- 'converted', 'needs_review', 'failed'
  modernized_query TEXT,           -- Updated version of input_query
  confidence_score FLOAT,          -- AI confidence in conversion
  notes TEXT
);
```

**Core Components**:
1. `src/services/betaBaseScenarioService.ts` - Query/search Beta Base scenarios
2. `src/components/ui/BetaBaseExplorer.tsx` - UI for browsing scenarios & execution history
3. `src/services/scenarioRelevanceScorer.ts` - Smart relevance scoring (GOLD/SILVER/BRONZE/TRASH)
4. `src/services/scenarioSimilarity.ts` - Find similar scenarios for RLHF linking
5. `src/components/ui/ScenarioConversionTool.tsx` - Modernize & convert scenarios
6. `scripts/beta-base-analysis.ts` - Pattern extraction & tier classification

**API Endpoints**:
- `GET /api/beta-base/scenarios` - List/search scenarios with filters
- `GET /api/beta-base/scenarios/:id` - Get specific scenario + execution history
- `GET /api/beta-base/scenarios/:id/executions` - Get test execution history
- `POST /api/beta-base/scenarios/similar` - Find similar scenarios for RLHF query
- `POST /api/beta-base/scenarios/:id/modernize` - AI-assisted modernization
- `POST /api/beta-base/scenarios/:id/convert` - Convert to Playwright format
- `GET /api/beta-base/analytics` - Tier distribution, age analysis, patterns

#### **Implementation Phases**

**Phase 1: Discovery & Foundation** (2 hours)
- [ ] Identify exact table name in Supabase for historical tests
- [ ] Document complete schema structure
- [ ] Create sample query scripts
- [ ] Analyze test distribution by category
- [ ] Build basic `historicalTestService.ts`

**Phase 2: UI Integration** (2 hours)
- [ ] Build HistoricalTestExplorer component
- [ ] Add to Test tab as new sub-tab
- [ ] Implement search and filter capabilities
- [ ] Display test metadata and history
- [ ] Link to RLHF feedback items

**Phase 3: Similarity Matching** (2 hours)
- [ ] Implement vector similarity search for queries
- [ ] Build query pattern matching algorithm
- [ ] Auto-link similar historical tests to RLHF feedback
- [ ] Display "Similar Historical Tests" in RLHF UI

**Phase 4: Test Conversion** (2 hours)
- [ ] Build TestConversionTool component
- [ ] Create Playwright test templates
- [ ] Implement conversion logic (historical → Playwright)
- [ ] Track conversion status in database
- [ ] Generate converted test files

**Phase 5: Pattern Analysis** (2 hours)
- [ ] Build pattern extraction script
- [ ] Identify common query patterns
- [ ] Find coverage gaps
- [ ] Create Pattern Analysis Dashboard
- [ ] Generate recommendations

#### **Success Metrics**
- 80%+ of historical tests linked to RLHF categories
- 50+ high-value tests converted to Playwright
- 10+ coverage gaps identified and filled
- 5+ "known issues" documented from historical failures
- Regression detection rate: 90%+

#### **Effort Estimate**: 10-12 hours (1-2 days)

#### **Dependencies**
- Supabase access (✅ already available)
- RLHF system (✅ complete)
- Test tab infrastructure (✅ exists)

#### **Risks & Mitigations**
- **Risk**: Historical test schema unknown
  - **Mitigation**: Start with discovery phase, document thoroughly
- **Risk**: 10k tests may be outdated
  - **Mitigation**: Relevance scoring, mark obsolete tests
- **Risk**: Conversion may not be fully automated
  - **Mitigation**: Semi-automated tool with manual review

---

### **Option 2: Performance Optimization Implementation** ⚡ QUICK WIN

#### **Strategic Value**
Make SIAM feel 10x faster with targeted optimizations to AOMA orchestration bottleneck.

#### **Business Impact**
- **User Experience**: Dramatic improvement in perceived performance
- **Adoption**: Faster responses = higher engagement
- **Cost**: Reduced API calls via better caching
- **Competitive**: Best-in-class response times

#### **Current Performance Baseline**
| Scenario | TTFB | Status |
|----------|------|--------|
| Cold Start | 2698ms | ❌ SLOW |
| Typical | 1250ms | ⚠️ SLOW |
| Warm Cache | 545ms | ✅ ACCEPTABLE |

**Primary Bottleneck**: AOMA Orchestration (app/api/chat/route.ts:385-525)
- Embedding Generation: 858ms (68% of delay)
- Vector Search: 392ms (32% of delay)

#### **Optimization Roadmap**

**Phase 1: Aggressive Embedding Cache** (30 minutes) → **2.3x Faster**

**Problem**: Embedding cache hit rate is inconsistent (cold: 1959ms, warm: 325ms)

**Solution**:
```typescript
// src/services/embeddingCache.ts
interface EmbeddingCacheConfig {
  ttl: number;           // 24 hours (aggressive)
  maxSize: number;       // 10,000 entries
  persistToDisk: boolean; // Survive restarts
}

class AggressiveEmbeddingCache {
  private cache = new Map<string, CachedEmbedding>();
  private readonly config: EmbeddingCacheConfig;

  constructor() {
    this.config = {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      maxSize: 10000,
      persistToDisk: true
    };
    this.loadFromDisk();
  }

  async getOrGenerate(query: string): Promise<number[]> {
    const key = this.normalizeQuery(query);
    const cached = this.cache.get(key);

    if (cached && !this.isExpired(cached)) {
      return cached.embedding; // ✅ Cache hit: ~325ms
    }

    // Cache miss: Generate and store
    const embedding = await this.generateEmbedding(query);
    this.cache.set(key, {
      embedding,
      timestamp: Date.now(),
      query: key
    });

    if (this.cache.size > this.config.maxSize) {
      this.evictOldest();
    }

    this.persistToDisk();
    return embedding;
  }

  private normalizeQuery(query: string): string {
    // Normalize to improve cache hit rate
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}
```

**Implementation**:
1. Create `src/services/embeddingCache.ts`
2. Update `app/api/chat/route.ts` to use cache
3. Add cache warming for common queries
4. Monitor cache hit rate

**Expected Impact**: 1250ms → 545ms (2.3x faster)

---

**Phase 2: Optimize Supabase HNSW Index** (1 hour) → **3.4x Faster Total**

**Problem**: Vector search slower than optimal (392ms vs 50-150ms industry benchmark)

**Solution**:
```sql
-- Optimize HNSW index parameters
ALTER INDEX siam_vectors_embedding_idx
SET (m = 24, ef_construction = 200);

-- Add index on frequently filtered columns
CREATE INDEX idx_siam_vectors_filters
ON siam_vectors (organization, division, app_under_test, source_type);

-- Pre-filter before vector search
CREATE OR REPLACE FUNCTION optimized_vector_search(
  query_embedding vector(1536),
  org TEXT,
  div TEXT,
  app TEXT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.content,
    1 - (v.embedding <=> query_embedding) as similarity
  FROM siam_vectors v
  WHERE
    v.organization = org
    AND v.division = div
    AND v.app_under_test = app
  ORDER BY v.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

**Implementation**:
1. Run index optimization SQL in Supabase
2. Update `src/services/vectorStore.ts` to use optimized function
3. Add connection pooling if not already enabled
4. Monitor search performance

**Expected Impact**: 545ms → 363ms (additional 1.5x faster, 3.4x total)

---

**Phase 3: Parallel Processing Architecture** (2-4 hours) → **10x Perceived Improvement**

**Problem**: AOMA orchestration blocks streaming (user sees nothing for 1250ms)

**Solution**: Start streaming immediately, inject AOMA context when ready

```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;

  // 1. Start streaming IMMEDIATELY (<100ms)
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial acknowledgment
      controller.enqueue(
        encoder.encode('data: {"thinking": true}\n\n')
      );

      // 2. Kick off AOMA orchestration in parallel (non-blocking)
      const aomaContextPromise = getAOMAContext(userMessage);

      // 3. Start AI response with "I'm searching AOMA knowledge..."
      const initialResponse = await streamText({
        model: gemini25Pro,
        messages: [
          {
            role: 'system',
            content: 'Tell user you are searching AOMA knowledge base for their query.'
          },
          { role: 'user', content: userMessage }
        ]
      });

      // Stream initial response
      for await (const chunk of initialResponse.textStream) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
      }

      // 4. Wait for AOMA context (runs in parallel)
      const aomaContext = await aomaContextPromise;

      // 5. Stream actual answer with AOMA context
      const finalResponse = await streamText({
        model: gemini25Pro,
        messages: [
          {
            role: 'system',
            content: `AOMA Context:\n${aomaContext}\n\nAnswer the user's question using this context.`
          },
          { role: 'user', content: userMessage }
        ]
      });

      for await (const chunk of finalResponse.textStream) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
      }

      controller.close();
    }
  });

  return new Response(stream);
}
```

**Implementation**:
1. Refactor AOMA orchestration to be async/non-blocking
2. Update chat API to start streaming immediately
3. Show "Searching knowledge base..." progress indicator
4. Inject AOMA context when ready
5. Update UI to handle streaming states

**Expected Impact**:
- TTFB: 1250ms → <100ms (12x faster)
- Perceived performance: 10x+ improvement (user sees response immediately)

---

#### **Combined Results**

| Phase | Time Investment | Performance Gain | User Experience |
|-------|----------------|------------------|-----------------|
| Phase 1 | 30 min | 2.3x faster | Noticeably faster |
| Phase 2 | 1 hour | 3.4x faster total | Much faster |
| Phase 3 | 2-4 hours | 10x+ perceived | Feels instant |
| **TOTAL** | **4-6 hours** | **12x+ faster** | **Transformative** |

#### **Success Metrics**
- TTFB (Phase 1): <600ms (from 1250ms)
- TTFB (Phase 2): <400ms
- TTFB (Phase 3): <100ms
- Cache hit rate: 90%+
- Vector search time: <150ms
- User satisfaction: 50%+ improvement

#### **Effort Estimate**: 4-6 hours

#### **Dependencies**
- Performance test suite (✅ complete)
- Supabase admin access (✅ available)
- AOMA orchestrator code (✅ accessible)

#### **Risks & Mitigations**
- **Risk**: Cache invalidation issues
  - **Mitigation**: Conservative 24h TTL, manual invalidation endpoint
- **Risk**: Index optimization may not help
  - **Mitigation**: Test in staging first, rollback ready
- **Risk**: Parallel processing increases complexity
  - **Mitigation**: Implement incrementally, feature flag

---

### **Option 3: Voice-to-Voice Meeting Assistant** 🎤 GAME CHANGER

#### **Strategic Value**
True "Smart In A Meeting" experience - align product with name and vision.

#### **Business Impact**
- **Differentiation**: Voice interface = unique selling point
- **Productivity**: Hands-free queries during meetings
- **Accessibility**: Voice input/output for all users
- **Market Fit**: Natural interface for meeting scenarios

#### **What It Enables**
1. **Real-Time Voice Input**
   - Press-to-talk or always-listening mode
   - Wake word activation ("Hey SIAM")
   - Background noise suppression
   - Multi-speaker detection

2. **ElevenLabs Voice Output**
   - Natural voice responses (already integrated)
   - Multiple voice options
   - Adjustable speed and tone
   - Text + audio response simultaneously

3. **Meeting Transcription**
   - Real-time meeting transcription
   - Speaker identification
   - Key moments tagging
   - AOMA context injection during meeting

4. **Voice-Activated RLHF**
   - Say "Good answer" or "Bad answer"
   - Voice feedback instead of clicking
   - Hands-free curation workflow

5. **Meeting Intelligence Features**
   - "What did we discuss about X?"
   - "Who said that about Y?"
   - "Summarize the last 5 minutes"
   - "What AOMA features were mentioned?"

#### **Technical Architecture**

**Voice Input Stack**:
```typescript
// src/services/voiceInput.ts
import { openai } from '@ai-sdk/openai';

class VoiceInputService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async startListening(mode: 'push-to-talk' | 'continuous') {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 16000
      }
    });

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const transcription = await this.transcribe(audioBlob);
      this.audioChunks = [];
      return transcription;
    };

    this.mediaRecorder.start();
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const { text } = await response.json();
    return text;
  }

  stopListening() {
    this.mediaRecorder?.stop();
  }
}
```

**Voice Output (ElevenLabs)**:
```typescript
// src/services/voiceOutput.ts
import { useConversation } from '@elevenlabs/react';

export function VoiceOutputService() {
  const conversation = useConversation({
    onConnect: () => console.log('Voice connected'),
    onDisconnect: () => console.log('Voice disconnected'),
    onMessage: (message) => console.log('Voice message:', message),
    onError: (error) => console.error('Voice error:', error)
  });

  async function speak(text: string, voiceId: string = 'default') {
    await conversation.sendMessage({
      type: 'text',
      text,
      voiceId
    });
  }

  return { speak, conversation };
}
```

**Meeting Transcription**:
```typescript
// src/services/meetingTranscription.ts
class MeetingTranscriptionService {
  private transcripts: TranscriptSegment[] = [];

  async startMeeting() {
    // Continuous transcription
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Send audio to Whisper API in 30-second chunks
    setInterval(async () => {
      const transcript = await this.transcribeChunk();
      this.transcripts.push(transcript);

      // Analyze transcript for AOMA mentions
      await this.analyzeForAOMAContext(transcript);
    }, 30000);
  }

  async analyzeForAOMAContext(transcript: TranscriptSegment) {
    // Extract AOMA-related terms
    const aomaTerms = this.extractAOMATerms(transcript.text);

    if (aomaTerms.length > 0) {
      // Proactively fetch AOMA context
      const context = await getAOMAContext(aomaTerms.join(' '));

      // Show relevant AOMA info in sidebar
      this.displayAOMAContext(context);
    }
  }
}
```

#### **UI Components**

**Voice Control Panel**:
```typescript
// src/components/ui/VoiceControlPanel.tsx
export function VoiceControlPanel() {
  const [isListening, setIsListening] = useState(false);
  const [mode, setMode] = useState<'push-to-talk' | 'continuous'>('push-to-talk');
  const voiceInput = useVoiceInput();

  return (
    <div className="voice-control-panel">
      <Button
        onMouseDown={() => {
          if (mode === 'push-to-talk') {
            voiceInput.startListening();
            setIsListening(true);
          }
        }}
        onMouseUp={() => {
          if (mode === 'push-to-talk') {
            voiceInput.stopListening();
            setIsListening(false);
          }
        }}
        onClick={() => {
          if (mode === 'continuous') {
            if (isListening) {
              voiceInput.stopListening();
            } else {
              voiceInput.startListening();
            }
            setIsListening(!isListening);
          }
        }}
      >
        {isListening ? <MicOff /> : <Mic />}
        {isListening ? 'Listening...' : 'Push to Talk'}
      </Button>

      <Select value={mode} onValueChange={setMode}>
        <SelectItem value="push-to-talk">Push to Talk</SelectItem>
        <SelectItem value="continuous">Always Listening</SelectItem>
      </Select>
    </div>
  );
}
```

**Meeting Transcript View**:
```typescript
// src/components/ui/MeetingTranscriptView.tsx
export function MeetingTranscriptView() {
  const { transcripts } = useMeetingTranscription();

  return (
    <div className="meeting-transcript">
      {transcripts.map((segment) => (
        <div key={segment.id} className="transcript-segment">
          <div className="speaker">{segment.speaker}</div>
          <div className="timestamp">{segment.timestamp}</div>
          <div className="text">{segment.text}</div>

          {segment.aomaContext && (
            <div className="aoma-context">
              <AOMAKnowledgeCard context={segment.aomaContext} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### **Implementation Phases**

**Phase 1: Voice Input Foundation** (2 hours)
- [ ] Build VoiceInputService with Whisper API
- [ ] Create VoiceControlPanel component
- [ ] Add to Chat tab
- [ ] Test push-to-talk functionality
- [ ] Handle microphone permissions

**Phase 2: Voice Output Integration** (2 hours)
- [ ] Configure ElevenLabs voice settings
- [ ] Add voice output toggle in UI
- [ ] Stream text + audio simultaneously
- [ ] Add voice selection dropdown
- [ ] Test voice quality

**Phase 3: Meeting Transcription** (3 hours)
- [ ] Build MeetingTranscriptionService
- [ ] Create MeetingTranscriptView component
- [ ] Add speaker identification
- [ ] Implement continuous transcription
- [ ] Store transcripts in database

**Phase 4: AOMA Context Injection** (2 hours)
- [ ] Analyze transcripts for AOMA terms
- [ ] Proactive AOMA context fetching
- [ ] Display relevant AOMA info in transcript
- [ ] Link transcript segments to AOMA knowledge

**Phase 5: Voice-Activated RLHF** (1 hour)
- [ ] Voice commands for RLHF feedback
- [ ] "Good answer" / "Bad answer" recognition
- [ ] Hands-free curation workflow
- [ ] Voice-to-text for detailed feedback

#### **Success Metrics**
- Voice transcription accuracy: 95%+
- Voice response latency: <2s
- Meeting transcription accuracy: 90%+
- AOMA context relevance: 80%+
- User adoption: 30%+ use voice features

#### **Effort Estimate**: 10-12 hours (2-3 days)

#### **Dependencies**
- OpenAI Whisper API (✅ key available)
- ElevenLabs integration (✅ already in dependencies)
- Browser microphone access (✅ standard API)

#### **Risks & Mitigations**
- **Risk**: Browser compatibility issues
  - **Mitigation**: Feature detection, graceful fallback
- **Risk**: Background noise interference
  - **Mitigation**: Noise suppression, push-to-talk default
- **Risk**: Voice output latency
  - **Mitigation**: Pre-fetch audio, streaming output
- **Risk**: Privacy concerns (always listening)
  - **Mitigation**: Clear UI indicators, push-to-talk default

---

### **Option 4: Intelligent Query Suggestions** 🧠 SMART UX

#### **Strategic Value**
Help users ask better questions by learning from RLHF feedback and historical patterns.

#### **Business Impact**
- **User Success**: Higher quality queries = better answers
- **Engagement**: Suggested follow-ups keep conversation flowing
- **Learning**: Users learn AOMA domain terminology
- **Efficiency**: Reduce failed queries via suggestions

#### **What It Enables**

1. **RLHF-Powered Suggestions**
   - Analyze high-rated responses to identify quality query patterns
   - Suggest queries similar to those with 5-star ratings
   - Avoid query patterns that received thumbs-down
   - Learn from curator feedback

2. **Contextual Follow-Ups**
   - "Users who asked this also asked..."
   - Based on current conversation context
   - Related AOMA topics
   - Drill-down suggestions

3. **Auto-Complete**
   - AOMA-specific term completion
   - Feature name suggestions
   - Common query templates
   - Historical successful queries

4. **Query Reformulation**
   - When results are poor, suggest better phrasing
   - "Did you mean: [reformulated query]?"
   - Explain why reformulation might work better
   - Learn from RLHF which reformulations help

5. **Discovery Mode**
   - "What can I ask about AOMA?"
   - Category-based suggestions
   - Popular queries
   - Trending topics

#### **Technical Architecture**

**Query Analysis Service**:
```typescript
// src/services/queryAnalysisService.ts
interface QueryPattern {
  pattern: string;
  avgRating: number;
  successRate: number;
  category: string;
  examples: string[];
}

class QueryAnalysisService {
  async analyzeHighPerformingQueries(): Promise<QueryPattern[]> {
    // Get queries with 5-star ratings
    const { data } = await supabase
      .from('rlhf_feedback')
      .select('original_query, star_rating, category')
      .gte('star_rating', 4)
      .order('star_rating', { ascending: false })
      .limit(100);

    // Group by pattern
    const patterns = this.extractPatterns(data);
    return patterns;
  }

  async analyzeLowPerformingQueries(): Promise<string[]> {
    // Get queries with thumbs-down
    const { data } = await supabase
      .from('rlhf_feedback')
      .select('original_query, feedback_type')
      .eq('feedback_type', 'negative')
      .limit(100);

    return data.map(d => d.original_query);
  }

  extractPatterns(queries: any[]): QueryPattern[] {
    // Use NLP to identify common patterns
    // Example: "How do I [action] in AOMA?"
    //          "What is [feature] used for?"

    const patterns: QueryPattern[] = [];

    // Group similar queries
    const grouped = this.groupSimilarQueries(queries);

    for (const group of grouped) {
      const pattern = this.identifyPattern(group);
      patterns.push({
        pattern: pattern.template,
        avgRating: this.calculateAvgRating(group),
        successRate: this.calculateSuccessRate(group),
        category: group[0].category,
        examples: group.slice(0, 3).map(q => q.original_query)
      });
    }

    return patterns;
  }
}
```

**Suggestion Engine**:
```typescript
// src/services/suggestionEngine.ts
class SuggestionEngine {
  async getSuggestions(
    currentQuery: string,
    conversationHistory: Message[]
  ): Promise<QuerySuggestion[]> {
    const suggestions: QuerySuggestion[] = [];

    // 1. RLHF-based suggestions
    const rlhfSuggestions = await this.getRLHFSuggestions(currentQuery);
    suggestions.push(...rlhfSuggestions);

    // 2. Historical test patterns
    const historicalSuggestions = await this.getHistoricalSuggestions(currentQuery);
    suggestions.push(...historicalSuggestions);

    // 3. Contextual follow-ups
    const followUps = await this.getFollowUpSuggestions(conversationHistory);
    suggestions.push(...followUps);

    // 4. Category-based suggestions
    const categorySuggestions = await this.getCategorySuggestions(currentQuery);
    suggestions.push(...categorySuggestions);

    // Rank by relevance
    return this.rankSuggestions(suggestions, currentQuery);
  }

  async getRLHFSuggestions(query: string): Promise<QuerySuggestion[]> {
    // Find similar high-rated queries
    const { data } = await supabase.rpc('search_similar_queries', {
      search_query: query,
      min_rating: 4,
      match_count: 5
    });

    return data.map(d => ({
      text: d.query,
      reason: `Similar to high-rated queries (${d.avg_rating}⭐)`,
      confidence: d.similarity,
      category: 'rlhf'
    }));
  }

  async getFollowUpSuggestions(history: Message[]): Promise<QuerySuggestion[]> {
    // Analyze conversation context
    const lastTopic = this.extractTopic(history);

    // Get related topics
    const relatedQueries = await this.getRelatedQueries(lastTopic);

    return relatedQueries.map(q => ({
      text: q,
      reason: 'Related to current topic',
      confidence: 0.8,
      category: 'follow-up'
    }));
  }
}
```

**Auto-Complete Component**:
```typescript
// src/components/ui/IntelligentAutoComplete.tsx
export function IntelligentAutoComplete() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedGetSuggestions = useMemo(
    () => debounce(async (q: string) => {
      if (q.length < 3) return;

      setIsLoading(true);
      const sugg = await suggestionEngine.getSuggestions(q, conversationHistory);
      setSuggestions(sugg);
      setIsLoading(false);
    }, 300),
    [conversationHistory]
  );

  useEffect(() => {
    debouncedGetSuggestions(query);
  }, [query]);

  return (
    <div className="intelligent-autocomplete">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Ask about AOMA..."
      />

      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => setQuery(suggestion.text)}
            >
              <div className="suggestion-text">{suggestion.text}</div>
              <div className="suggestion-reason">
                <Badge>{suggestion.category}</Badge>
                {suggestion.reason}
              </div>
              <div className="confidence-bar">
                <div style={{ width: `${suggestion.confidence * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Query Reformulation Assistant**:
```typescript
// src/components/ui/QueryReformulationAssistant.tsx
export function QueryReformulationAssistant({
  query,
  wasSuccessful
}: {
  query: string;
  wasSuccessful: boolean;
}) {
  const [reformulations, setReformulations] = useState<string[]>([]);

  useEffect(() => {
    if (!wasSuccessful) {
      // Query failed - suggest reformulations
      suggestReformulations();
    }
  }, [wasSuccessful]);

  async function suggestReformulations() {
    // Find similar successful queries
    const similar = await findSimilarSuccessfulQueries(query);

    // Generate reformulations
    const reforms = await generateReformulations(query, similar);
    setReformulations(reforms);
  }

  if (reformulations.length === 0) return null;

  return (
    <Card className="reformulation-assistant">
      <CardHeader>
        <CardTitle>💡 Try asking differently</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          These similar questions got better results:
        </p>
        {reformulations.map((reform, idx) => (
          <Button
            key={idx}
            variant="outline"
            className="w-full justify-start mb-2"
            onClick={() => submitQuery(reform)}
          >
            {reform}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
```

#### **Implementation Phases**

**Phase 1: Query Analysis** (2 hours)
- [ ] Build QueryAnalysisService
- [ ] Analyze RLHF feedback for patterns
- [ ] Identify high/low performing queries
- [ ] Extract common query templates
- [ ] Store patterns in database

**Phase 2: Suggestion Engine** (2 hours)
- [ ] Build SuggestionEngine
- [ ] Implement RLHF-based suggestions
- [ ] Add historical pattern matching
- [ ] Create contextual follow-up logic
- [ ] Implement ranking algorithm

**Phase 3: Auto-Complete UI** (2 hours)
- [ ] Build IntelligentAutoComplete component
- [ ] Add to Chat input field
- [ ] Show suggestion categories and confidence
- [ ] Implement keyboard navigation
- [ ] Add analytics tracking

**Phase 4: Query Reformulation** (1 hour)
- [ ] Build QueryReformulationAssistant
- [ ] Detect failed queries
- [ ] Generate reformulations
- [ ] Show reformulation suggestions
- [ ] Track which reformulations help

**Phase 5: Discovery Mode** (1 hour)
- [ ] Create "What can I ask?" button
- [ ] Show popular queries by category
- [ ] Display trending topics
- [ ] Add example queries for new users
- [ ] Track discovery feature usage

#### **Success Metrics**
- Suggestion acceptance rate: 40%+
- Query success rate improvement: 20%+
- Average queries per session: +30%
- Reformulation success rate: 60%+
- User satisfaction: +25%

#### **Effort Estimate**: 8-10 hours (1-2 days)

#### **Dependencies**
- RLHF feedback data (✅ accumulating)
- Historical test data (✅ 10k+ tests)
- Vector similarity search (✅ available)

#### **Risks & Mitigations**
- **Risk**: Not enough RLHF data yet
  - **Mitigation**: Start with historical test patterns
- **Risk**: Suggestions may be repetitive
  - **Mitigation**: Diversity ranking, category filtering
- **Risk**: Auto-complete may be distracting
  - **Mitigation**: User preference toggle, debouncing

---

### **Option 5: Multi-Strategy Auto-Routing** 🎯 AI OPTIMIZATION

#### **Strategic Value**
Automatically select the best RAG strategy for each query based on characteristics and RLHF learnings.

#### **Business Impact**
- **Quality**: Best strategy for each query type
- **Cost**: Optimize for speed vs accuracy trade-offs
- **Intelligence**: System learns over time
- **Performance**: Fast queries use fast strategy

#### **What It Enables**

1. **Automatic Strategy Selection**
   - Simple queries → Re-ranking (fast, 90% accuracy)
   - Complex queries → Agentic RAG (thorough, 95% accuracy)
   - Context-heavy → Context-Aware (session-aware)
   - No user configuration needed

2. **Query Classification**
   - Complexity scoring (simple, moderate, complex)
   - Intent detection (informational, navigational, transactional)
   - Domain specificity (general AOMA, specific feature)
   - Context dependency (standalone, conversational)

3. **RLHF-Based Learning**
   - Track which strategies perform best per query type
   - Learn from feedback which routing decisions work
   - Continuous improvement over time
   - A/B test routing rules

4. **Fallback & Escalation**
   - Try fast strategy first
   - If confidence low, escalate to thorough strategy
   - Parallel execution for important queries
   - Graceful degradation

5. **Performance Optimization**
   - Cache routing decisions
   - Pre-route common query patterns
   - Optimize for cost vs quality
   - Monitor strategy performance

#### **Technical Architecture**

**Query Classifier**:
```typescript
// src/services/queryClassifier.ts
interface QueryCharacteristics {
  complexity: 'simple' | 'moderate' | 'complex';
  intent: 'informational' | 'navigational' | 'transactional';
  domain: 'general' | 'specific';
  contextDependency: 'standalone' | 'conversational';
  estimatedTokens: number;
}

class QueryClassifier {
  async classify(query: string, history: Message[]): Promise<QueryCharacteristics> {
    // 1. Complexity scoring
    const complexity = this.assessComplexity(query);

    // 2. Intent detection
    const intent = await this.detectIntent(query);

    // 3. Domain analysis
    const domain = this.analyzeDomain(query);

    // 4. Context dependency
    const contextDependency = this.checkContextDependency(query, history);

    // 5. Token estimation
    const estimatedTokens = this.estimateTokens(query);

    return {
      complexity,
      intent,
      domain,
      contextDependency,
      estimatedTokens
    };
  }

  private assessComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const indicators = {
      simple: [
        query.length < 50,
        /^(what|who|when|where) is/i.test(query),
        !query.includes('and'),
        !query.includes('or'),
      ],
      complex: [
        query.length > 200,
        /how (do|does|can|should)/i.test(query),
        query.includes('and') && query.includes('or'),
        query.split(/[?.!]/).length > 2,
        /compare|difference|versus/i.test(query),
      ]
    };

    const simpleScore = indicators.simple.filter(Boolean).length;
    const complexScore = indicators.complex.filter(Boolean).length;

    if (simpleScore >= 3) return 'simple';
    if (complexScore >= 2) return 'complex';
    return 'moderate';
  }

  private async detectIntent(query: string): Promise<string> {
    // Use lightweight NLP or pattern matching
    const patterns = {
      informational: /what|why|how|explain|tell me|describe/i,
      navigational: /where|find|locate|show me|navigate/i,
      transactional: /create|add|delete|update|change|configure/i,
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) return intent;
    }

    return 'informational';
  }
}
```

**Strategy Router**:
```typescript
// src/services/strategyRouter.ts
interface RoutingDecision {
  strategy: 'reranking' | 'agentic' | 'contextAware';
  confidence: number;
  reasoning: string;
  fallbackStrategy?: 'reranking' | 'agentic' | 'contextAware';
}

class StrategyRouter {
  private routingRules: RoutingRule[];
  private rlhfLearnings: Map<string, StrategyPerformance>;

  constructor() {
    this.loadRoutingRules();
    this.loadRLHFLearnings();
  }

  async route(
    query: string,
    characteristics: QueryCharacteristics,
    history: Message[]
  ): Promise<RoutingDecision> {
    // 1. Check RLHF learnings for similar queries
    const learnedStrategy = await this.getLearnedStrategy(query);
    if (learnedStrategy && learnedStrategy.confidence > 0.8) {
      return learnedStrategy;
    }

    // 2. Apply rule-based routing
    const ruleBasedStrategy = this.applyRules(characteristics);

    // 3. Combine with RLHF insights
    const finalStrategy = this.combineStrategies(
      ruleBasedStrategy,
      learnedStrategy
    );

    return finalStrategy;
  }

  private applyRules(chars: QueryCharacteristics): RoutingDecision {
    // Rule 1: Simple + Informational = Re-ranking
    if (chars.complexity === 'simple' && chars.intent === 'informational') {
      return {
        strategy: 'reranking',
        confidence: 0.9,
        reasoning: 'Simple informational query - re-ranking is fast and accurate',
        fallbackStrategy: 'contextAware'
      };
    }

    // Rule 2: Complex + Multi-step = Agentic RAG
    if (chars.complexity === 'complex' && chars.estimatedTokens > 100) {
      return {
        strategy: 'agentic',
        confidence: 0.85,
        reasoning: 'Complex multi-step query - agentic RAG provides thorough analysis',
        fallbackStrategy: 'reranking'
      };
    }

    // Rule 3: Conversational + Context-dependent = Context-Aware
    if (chars.contextDependency === 'conversational') {
      return {
        strategy: 'contextAware',
        confidence: 0.9,
        reasoning: 'Query depends on conversation history - context-aware retrieval',
        fallbackStrategy: 'agentic'
      };
    }

    // Rule 4: Specific domain queries = Re-ranking (fast lookups)
    if (chars.domain === 'specific') {
      return {
        strategy: 'reranking',
        confidence: 0.7,
        reasoning: 'Specific domain query - re-ranking for fast lookup',
        fallbackStrategy: 'agentic'
      };
    }

    // Default: Context-Aware (balanced)
    return {
      strategy: 'contextAware',
      confidence: 0.6,
      reasoning: 'Default balanced strategy',
      fallbackStrategy: 'reranking'
    };
  }

  private async getLearnedStrategy(query: string): Promise<RoutingDecision | null> {
    // Find similar queries with RLHF feedback
    const { data } = await supabase.rpc('find_similar_queries_with_strategy', {
      search_query: query,
      min_rating: 4,
      match_count: 10
    });

    if (!data || data.length === 0) return null;

    // Aggregate strategy performance
    const strategyScores = new Map<string, number[]>();

    for (const item of data) {
      const scores = strategyScores.get(item.strategy) || [];
      scores.push(item.star_rating);
      strategyScores.set(item.strategy, scores);
    }

    // Find best-performing strategy
    let bestStrategy: string | null = null;
    let bestAvgScore = 0;

    for (const [strategy, scores] of strategyScores.entries()) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvgScore) {
        bestAvgScore = avg;
        bestStrategy = strategy;
      }
    }

    if (!bestStrategy) return null;

    return {
      strategy: bestStrategy as any,
      confidence: bestAvgScore / 5, // Normalize to 0-1
      reasoning: `RLHF learning: ${bestStrategy} performed best for similar queries (${bestAvgScore.toFixed(1)}⭐)`,
      fallbackStrategy: 'reranking'
    };
  }
}
```

**Orchestrator Integration**:
```typescript
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages } = await req.json();
  const query = messages[messages.length - 1].content;

  // 1. Classify query
  const classifier = new QueryClassifier();
  const characteristics = await classifier.classify(query, messages);

  // 2. Route to best strategy
  const router = new StrategyRouter();
  const decision = await router.route(query, characteristics, messages);

  console.log(`🎯 Routing to ${decision.strategy}: ${decision.reasoning}`);

  // 3. Execute selected strategy
  let context: string;
  let metadata: any;

  switch (decision.strategy) {
    case 'reranking':
      ({ context, metadata } = await rerankingModule.execute(query));
      break;

    case 'agentic':
      ({ context, metadata } = await agenticRAG.execute(query));
      break;

    case 'contextAware':
      ({ context, metadata } = await contextAwareRetrieval.execute(query, messages));
      break;
  }

  // 4. If confidence low, try fallback
  if (decision.confidence < 0.7 && metadata.confidence < 0.6) {
    console.log(`⚠️ Low confidence, trying fallback: ${decision.fallbackStrategy}`);

    const fallbackResult = await executeStrategy(decision.fallbackStrategy, query);

    // Use better result
    if (fallbackResult.metadata.confidence > metadata.confidence) {
      context = fallbackResult.context;
      metadata = fallbackResult.metadata;
    }
  }

  // 5. Stream response with routing metadata
  return streamText({
    model: gemini25Pro,
    messages: [
      {
        role: 'system',
        content: `AOMA Context (via ${decision.strategy}):\n${context}`
      },
      { role: 'user', content: query }
    ],
    onFinish: async (result) => {
      // Store routing decision for RLHF learning
      await storeRoutingDecision({
        query,
        strategy: decision.strategy,
        characteristics,
        reasoning: decision.reasoning,
        confidence: metadata.confidence
      });
    }
  });
}
```

**RLHF Integration**:
```typescript
// Store routing decisions with RLHF feedback
async function updateStrategyPerformance(
  feedbackId: string,
  rating: number
) {
  // Get routing decision for this query
  const { data: routing } = await supabase
    .from('routing_decisions')
    .select('*')
    .eq('feedback_id', feedbackId)
    .single();

  if (!routing) return;

  // Update strategy performance metrics
  await supabase
    .from('strategy_performance')
    .upsert({
      strategy: routing.strategy,
      query_characteristics: routing.characteristics,
      avg_rating: await calculateAvgRating(routing.strategy, routing.characteristics),
      total_uses: await incrementUseCount(routing.strategy),
      last_updated: new Date().toISOString()
    });

  // Learn: If rating < 3, this strategy may not be good for this query type
  if (rating < 3) {
    await supabase
      .from('routing_learnings')
      .insert({
        characteristics: routing.characteristics,
        strategy_to_avoid: routing.strategy,
        reason: 'Low RLHF rating',
        severity: rating < 2 ? 'high' : 'medium'
      });
  }
}
```

#### **Implementation Phases**

**Phase 1: Query Classification** (2 hours)
- [ ] Build QueryClassifier
- [ ] Implement complexity scoring
- [ ] Add intent detection
- [ ] Test on sample queries
- [ ] Store classifications

**Phase 2: Routing Rules** (2 hours)
- [ ] Design rule-based routing logic
- [ ] Implement StrategyRouter
- [ ] Test routing decisions
- [ ] Add confidence scoring
- [ ] Implement fallback logic

**Phase 3: Orchestrator Integration** (2 hours)
- [ ] Update chat API to use router
- [ ] Add routing metadata to responses
- [ ] Implement strategy execution
- [ ] Test end-to-end flow
- [ ] Add logging/monitoring

**Phase 4: RLHF Learning** (1 hour)
- [ ] Store routing decisions in database
- [ ] Link to RLHF feedback
- [ ] Update strategy performance metrics
- [ ] Implement learning algorithm
- [ ] Add performance tracking

**Phase 5: Monitoring Dashboard** (1 hour)
- [ ] Build routing analytics dashboard
- [ ] Show strategy usage distribution
- [ ] Display performance by strategy
- [ ] Track routing accuracy
- [ ] Monitor confidence trends

#### **Success Metrics**
- Routing accuracy: 85%+
- Average confidence: 0.75+
- Strategy performance improvement: 15%+
- Response quality (RLHF): +10%
- Cost optimization: 20% reduction (using faster strategies when appropriate)

#### **Effort Estimate**: 8-10 hours (1-2 days)

#### **Dependencies**
- 3 RAG strategies (✅ implemented)
- RLHF feedback system (✅ complete)
- Vector similarity search (✅ available)

#### **Risks & Mitigations**
- **Risk**: Not enough RLHF data for learning
  - **Mitigation**: Start with rule-based, add ML later
- **Risk**: Wrong routing = poor results
  - **Mitigation**: Fallback strategies, confidence thresholds
- **Risk**: Complexity overhead
  - **Mitigation**: Cache routing decisions, optimize classifier

---

### **Option 6: Collaborative RLHF Curation** 👥 TEAM FEATURE

#### **Strategic Value**
Scale human feedback across multiple team members with consensus-based quality scoring.

#### **Business Impact**
- **Scale**: Multiple curators = faster feedback collection
- **Quality**: Consensus reduces individual bias
- **Team**: Collaboration features for Sony Music teams
- **Insights**: See which curators provide best feedback

#### **What It Enables**

1. **Multi-Curator Review**
   - Multiple curators can review same response
   - See who else reviewed this response
   - Track consensus vs disagreement
   - Weighted voting (experienced curators = higher weight)

2. **Review Queue System**
   - Assign responses to specific curators
   - Auto-distribute based on expertise
   - Priority queue (important queries first)
   - Skip/reassign functionality

3. **Curator Leaderboard**
   - Track feedback quality (how often curator agrees with consensus)
   - Response count and speed
   - Expertise areas
   - Helpful feedback badges

4. **Conflict Resolution**
   - When curators disagree (3⭐ vs 5⭐)
   - Flag for senior review
   - Discuss in comments
   - Final arbitration

5. **Collaboration Features**
   - Comments on responses
   - @ mention other curators
   - Share interesting examples
   - Team metrics dashboard

#### **Technical Architecture**

**Database Schema**:
```sql
-- Extend rlhf_feedback for multi-curator
CREATE TABLE rlhf_reviews (
  id UUID PRIMARY KEY,
  feedback_item_id UUID REFERENCES rlhf_feedback(id),
  curator_email TEXT NOT NULL,
  star_rating INT,
  feedback_type TEXT,
  detailed_feedback TEXT,
  review_time_seconds INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Curator profiles
CREATE TABLE curator_profiles (
  email TEXT PRIMARY KEY,
  display_name TEXT,
  expertise_areas TEXT[],
  total_reviews INT DEFAULT 0,
  avg_review_time_seconds INT,
  consensus_rate FLOAT, -- How often they agree with majority
  weight FLOAT DEFAULT 1.0, -- Voting weight (earned through quality)
  badges TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Review assignments
CREATE TABLE review_assignments (
  id UUID PRIMARY KEY,
  feedback_item_id UUID REFERENCES rlhf_feedback(id),
  assigned_to TEXT REFERENCES curator_profiles(email),
  assigned_by TEXT,
  priority TEXT, -- 'high', 'medium', 'low'
  status TEXT, -- 'pending', 'in_progress', 'completed', 'skipped'
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Comments and discussions
CREATE TABLE review_comments (
  id UUID PRIMARY KEY,
  feedback_item_id UUID REFERENCES rlhf_feedback(id),
  curator_email TEXT REFERENCES curator_profiles(email),
  comment TEXT NOT NULL,
  mentions TEXT[], -- Other curators mentioned
  parent_comment_id UUID REFERENCES review_comments(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conflict flags
CREATE TABLE review_conflicts (
  id UUID PRIMARY KEY,
  feedback_item_id UUID REFERENCES rlhf_feedback(id),
  conflict_type TEXT, -- 'rating_disagreement', 'quality_concern', etc.
  severity TEXT, -- 'low', 'medium', 'high'
  curator_emails TEXT[],
  rating_variance FLOAT,
  status TEXT, -- 'open', 'resolved', 'escalated'
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Multi-Curator Service**:
```typescript
// src/services/multiCuratorService.ts
class MultiCuratorService {
  async submitReview(
    feedbackItemId: string,
    curatorEmail: string,
    review: {
      starRating: number;
      feedbackType: 'positive' | 'negative';
      detailedFeedback: string;
    }
  ) {
    // 1. Store individual review
    const { data: reviewData } = await supabase
      .from('rlhf_reviews')
      .insert({
        feedback_item_id: feedbackItemId,
        curator_email: curatorEmail,
        star_rating: review.starRating,
        feedback_type: review.feedbackType,
        detailed_feedback: review.detailedFeedback,
      })
      .select()
      .single();

    // 2. Calculate consensus
    const consensus = await this.calculateConsensus(feedbackItemId);

    // 3. Update main feedback item with consensus
    await supabase
      .from('rlhf_feedback')
      .update({
        star_rating: consensus.avgRating,
        consensus_strength: consensus.strength,
        total_reviews: consensus.totalReviews,
      })
      .eq('id', feedbackItemId);

    // 4. Check for conflicts
    if (consensus.variance > 2.0) {
      await this.flagConflict(feedbackItemId, consensus);
    }

    // 5. Update curator profile
    await this.updateCuratorProfile(curatorEmail, reviewData);

    return { reviewData, consensus };
  }

  async calculateConsensus(feedbackItemId: string) {
    const { data: reviews } = await supabase
      .from('rlhf_reviews')
      .select('*, curator_profiles(weight)')
      .eq('feedback_item_id', feedbackItemId);

    if (!reviews || reviews.length === 0) {
      return {
        avgRating: 0,
        strength: 0,
        totalReviews: 0,
        variance: 0,
      };
    }

    // Weighted average based on curator expertise
    let totalWeight = 0;
    let weightedSum = 0;

    for (const review of reviews) {
      const weight = review.curator_profiles?.weight || 1.0;
      weightedSum += review.star_rating * weight;
      totalWeight += weight;
    }

    const avgRating = weightedSum / totalWeight;

    // Calculate variance (disagreement level)
    const variance =
      reviews.reduce((sum, r) => sum + Math.pow(r.star_rating - avgRating, 2), 0) /
      reviews.length;

    // Strength = how many curators + how much they agree
    const strength = reviews.length / (1 + variance);

    return {
      avgRating: Math.round(avgRating * 10) / 10,
      strength,
      totalReviews: reviews.length,
      variance,
    };
  }

  async flagConflict(feedbackItemId: string, consensus: any) {
    const { data: reviews } = await supabase
      .from('rlhf_reviews')
      .select('curator_email, star_rating')
      .eq('feedback_item_id', feedbackItemId);

    await supabase.from('review_conflicts').insert({
      feedback_item_id: feedbackItemId,
      conflict_type: 'rating_disagreement',
      severity: consensus.variance > 3.0 ? 'high' : 'medium',
      curator_emails: reviews.map((r) => r.curator_email),
      rating_variance: consensus.variance,
      status: 'open',
    });
  }

  async assignReview(
    feedbackItemId: string,
    assignTo: string,
    priority: 'high' | 'medium' | 'low'
  ) {
    await supabase.from('review_assignments').insert({
      feedback_item_id: feedbackItemId,
      assigned_to: assignTo,
      priority,
      status: 'pending',
    });

    // Notify curator
    await this.notifyCurator(assignTo, feedbackItemId);
  }
}
```

**Collaborative UI Components**:
```typescript
// src/components/ui/CuratorDashboard.tsx
export function CuratorDashboard() {
  const { email } = useUser();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [leaderboard, setLeaderboard] = useState<CuratorProfile[]>([]);

  useEffect(() => {
    loadMyAssignments();
    loadLeaderboard();
  }, []);

  return (
    <div className="curator-dashboard">
      {/* My Review Queue */}
      <Card>
        <CardHeader>
          <CardTitle>My Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({assignments.filter((a) => a.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {assignments
                .filter((a) => a.status === 'pending')
                .map((assignment) => (
                  <ReviewAssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onComplete={() => loadMyAssignments()}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Curator Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>🏆 Curator Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="leaderboard">
            {leaderboard.map((curator, idx) => (
              <div key={curator.email} className="curator-row">
                <div className="rank">#{idx + 1}</div>
                <div className="curator-info">
                  <div className="name">{curator.display_name}</div>
                  <div className="stats">
                    {curator.total_reviews} reviews • {(curator.consensus_rate * 100).toFixed(0)}%
                    consensus
                  </div>
                  <div className="badges">
                    {curator.badges?.map((badge) => (
                      <Badge key={badge}>{badge}</Badge>
                    ))}
                  </div>
                </div>
                <div className="weight">
                  Weight: {curator.weight.toFixed(1)}x
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Conflicts */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Review Conflicts</CardTitle>
        </CardHeader>
        <CardContent>
          <ConflictList />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Conflict Resolution Interface**:
```typescript
// src/components/ui/ConflictResolutionDialog.tsx
export function ConflictResolutionDialog({
  conflict
}: {
  conflict: ReviewConflict;
}) {
  const [resolution, setResolution] = useState('');

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve Review Conflict</DialogTitle>
        </DialogHeader>

        <div className="conflict-details">
          <p>
            <strong>Variance:</strong> {conflict.rating_variance.toFixed(2)} stars
          </p>
          <p>
            <strong>Reviewers:</strong> {conflict.curator_emails.join(', ')}
          </p>

          {/* Show all reviews side-by-side */}
          <div className="reviews-comparison">
            {conflict.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent>
                  <div className="reviewer">{review.curator_email}</div>
                  <div className="rating">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        fill={i < review.star_rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <div className="feedback">{review.detailed_feedback}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comments thread */}
          <div className="comments-thread">
            <h3>Discussion</h3>
            {conflict.comments?.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="author">{comment.curator_email}</div>
                <div className="text">{comment.comment}</div>
              </div>
            ))}
          </div>

          {/* Resolution form */}
          <div className="resolution-form">
            <Label>Resolution Notes</Label>
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Explain how this conflict was resolved..."
            />

            <Button onClick={() => resolveConflict(conflict.id, resolution)}>
              Mark as Resolved
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

#### **Implementation Phases**

**Phase 1: Database Schema** (1 hour)
- [ ] Create multi-curator tables
- [ ] Add indexes for performance
- [ ] Migrate existing RLHF data
- [ ] Test data integrity

**Phase 2: Multi-Curator Service** (2 hours)
- [ ] Build MultiCuratorService
- [ ] Implement consensus calculation
- [ ] Add conflict detection
- [ ] Build assignment system
- [ ] Test core logic

**Phase 3: Curator Dashboard** (2 hours)
- [ ] Build CuratorDashboard component
- [ ] Show review queue
- [ ] Display leaderboard
- [ ] Add my stats view
- [ ] Implement filtering/sorting

**Phase 4: Review Interface** (2 hours)
- [ ] Update RLHF review UI for multi-curator
- [ ] Show other curator reviews
- [ ] Add commenting system
- [ ] Show consensus vs my rating
- [ ] Add skip/reassign functionality

**Phase 5: Conflict Resolution** (1 hour)
- [ ] Build ConflictResolutionDialog
- [ ] Show conflicting reviews side-by-side
- [ ] Add discussion thread
- [ ] Implement resolution workflow
- [ ] Notify curators of resolution

#### **Success Metrics**
- Curator participation: 3+ active curators
- Reviews per response: 2+ on average
- Consensus rate: 70%+
- Conflict resolution time: <24 hours
- Curator satisfaction: 80%+

#### **Effort Estimate**: 8-10 hours (1-2 days)

#### **Dependencies**
- RLHF system (✅ complete)
- RBAC permissions (✅ curator role exists)
- User management (✅ Cognito integration)

#### **Risks & Mitigations**
- **Risk**: Not enough curators
  - **Mitigation**: Start with 2-3, invite Sony Music team
- **Risk**: Conflicts slow down process
  - **Mitigation**: Auto-escalation, senior curator override
- **Risk**: Gaming the leaderboard
  - **Mitigation**: Weight quality over quantity, consensus rate

---

## 📊 **Feature Comparison Matrix**

| Feature | Impact | Effort | ROI | Strategic Fit | Technical Risk |
|---------|--------|--------|-----|---------------|----------------|
| **Historical Test Integration** | 🔥🔥🔥🔥🔥 | 10-12h | ⭐⭐⭐⭐⭐ | Perfect | Low |
| **Performance Optimization** | 🔥🔥🔥🔥 | 4-6h | ⭐⭐⭐⭐⭐ | High | Low |
| **Voice-to-Voice Assistant** | 🔥🔥🔥🔥 | 10-12h | ⭐⭐⭐⭐ | Perfect | Medium |
| **Intelligent Query Suggestions** | 🔥🔥🔥 | 8-10h | ⭐⭐⭐⭐ | High | Low |
| **Multi-Strategy Auto-Routing** | 🔥🔥🔥 | 8-10h | ⭐⭐⭐ | Medium | Medium |
| **Collaborative RLHF Curation** | 🔥🔥 | 8-10h | ⭐⭐⭐ | Medium | Low |

---

## 🎯 **Recommended Implementation Order**

### **Phase 1: Quick Wins** (1 week)
1. **Performance Optimization** (Day 1-2)
   - Phase 1: Embedding cache (30 min) → 2.3x faster
   - Phase 2: Index optimization (1 hour) → 3.4x faster
   - Phase 3: Parallel processing (2-4 hours) → Feels instant
   - **Why first**: Immediate UX improvement, builds momentum

2. **Historical Test Integration** (Day 3-5)
   - Foundation + UI + Similarity matching
   - **Why second**: Unlocks existing investment, high ROI

### **Phase 2: Strategic Features** (2 weeks)
3. **Voice-to-Voice Assistant** (Week 2)
   - Aligns with product vision
   - Differentiation from competitors
   - Natural meeting interface

4. **Intelligent Query Suggestions** (Week 3)
   - Leverage RLHF + historical data
   - Improve user success rate
   - Natural UX enhancement

### **Phase 3: AI Optimization** (1 week)
5. **Multi-Strategy Auto-Routing** (Week 4)
   - Optimize cost vs quality
   - Continuous improvement
   - Builds on RLHF data

### **Phase 4: Team Features** (1 week)
6. **Collaborative RLHF Curation** (Week 5)
   - Scale feedback collection
   - Team collaboration
   - Enterprise feature

---

## 🚀 **Next Steps**

1. **Review this roadmap** with stakeholders
2. **Select top 2-3 features** to prioritize
3. **Create detailed implementation plans** for selected features
4. **Allocate resources** and set timeline
5. **Begin with Performance Optimization** (quick win, builds confidence)

---

## 📝 **Questions to Answer**

1. **Business Priority**: What's most important right now?
   - User adoption?
   - Performance/quality?
   - Team collaboration?
   - Product differentiation?

2. **User Feedback**: What are users asking for?
   - Faster responses?
   - Better suggestions?
   - Voice interface?
   - Something else?

3. **Timeline**: What's the deadline?
   - Demo/presentation coming up?
   - Sprint planning cycle?
   - Flexible timeline?

4. **Resources**: Who's available?
   - Solo development?
   - Team collaboration?
   - External help?

---

**Document Owner**: Claude AI (via Matt Carpenter)
**Last Updated**: November 9, 2025
**Status**: Proposed - Awaiting Selection
**Next Action**: Review and prioritize features
