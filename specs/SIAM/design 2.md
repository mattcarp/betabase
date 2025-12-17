# SIAM Design Document

## Overview

SIAM (Smart In A Meeting) is a professional meeting intelligence platform that provides AI-powered assistance through three core capabilities:

1. **Advanced Chat Experience** - Multi-source RAG orchestration with sub-second response times
2. **RLHF Curate System** - Human-in-the-loop feedback collection and document curation
3. **Automated Testing with HITL** - Test management dashboard with human review workflows

The system integrates Google Gemini 3.0 Pro as the primary AI model with OpenAI as fallback, retrieves context from diverse sources (Jira, Git, knowledge base, email), and provides a Mac-inspired glassmorphism UI for professional demo presentations. Built on Next.js 16 with the App Router architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Panel   │  │ Curate Tab   │  │ Testing Tab  │      │
│  │ (AI SDK v5)  │  │ (RLHF)       │  │ (HITL)       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (/api/*)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/chat    │  │ /api/rlhf/*  │  │ /api/aoma/*  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│   Gemini     │  │ Unified RAG      │  │  Supabase    │
│   3.0 Pro    │  │ Orchestrator     │  │  (pgvector)  │
└──────────────┘  └──────────────────┘  └──────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Context-Aware│  │ Agentic RAG  │  │ Two-Stage    │
│ Retrieval    │  │ (Self-Corr.) │  │ Retrieval    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                ┌──────────────────────┐
                │  AOMA-MESH-MCP       │
                │  (Railway Backend)   │
                └──────────────────────┘
```

### Technology Stack

**Frontend:**
- Next.js 16 (App Router)
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui components
- AI SDK v5 (Vercel)
- Framer Motion for animations
- ElevenLabs (Voice STT/TTS)

**Backend:**
- Next.js API Routes
- Railway (AOMA-MESH-MCP server)
- AWS Cognito (Magic Link Auth)

**AI/ML:**
- Google Gemini 3.0 Pro (primary, 1M+ context)
- OpenAI GPT-4o/GPT-5 (fallback)
- OpenAI text-embedding-3-small (embeddings)

**Data:**
- Supabase (PostgreSQL + pgvector)
- 1536-dimensional embeddings
- Row-Level Security (RLS)

**Deployment:**
- Render.com (main app)
- Railway (AOMA backend)
- Vercel (optional)

## Components and Interfaces

### 1. Chat Experience Components

#### AiSdkChatPanel

**Primary Component**: `src/components/ai/ai-sdk-chat-panel.tsx`

**Responsibilities:**
- Render chat interface with message history
- Handle user input (text and voice via ElevenLabs STT)
- Stream AI responses using AI SDK v5
- Display code blocks, diagrams, and citations
- Provide RLHF feedback buttons (thumbs up/down)
- Manage conversation state and branching

**Key Features:**
- Voice input with push-to-talk (ElevenLabs STT)
- Voice output with TTS toggle (ElevenLabs TTS)
- Model selection (Gemini 3.0 Pro, GPT-4o, Claude)
- Progress indicators during RAG retrieval
- Demo mode enhancements for presentations
- File upload support

**Interfaces:**
```typescript
interface AiSdkChatPanelProps {
  api?: string;
  initialMessages?: Message[];
  conversationId?: string;
  onMessagesChange?: (messages: Message[]) => void;
  systemPrompt?: string;
  enableAnimations?: boolean;
  showHeader?: boolean;
  theme?: "light" | "dark" | "auto";
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  metadata?: {
    sources?: Source[];
    ragMetadata?: RAGMetadata;
  };
}
```

#### UnifiedRAGOrchestrator

**Primary Component**: `src/services/unifiedRAGOrchestrator.ts`

**Responsibilities:**
- Orchestrate three RAG strategies (Context-Aware, Agentic, Standard)
- Manage session state and conversation history
- Apply RLHF signals to boost/penalize documents
- Track retrieval confidence and performance metrics

**RAG Strategies:**

1. **Context-Aware Retrieval** (Default)
   - Uses conversation history for query expansion
   - Applies RLHF reinforcement signals
   - Session-based document boosting

2. **Agentic RAG** (Advanced)
   - Multi-step reasoning with self-correction
   - Tool utilization for complex queries
   - Iterative refinement until confidence threshold met

3. **Standard Two-Stage** (Fallback)
   - Initial vector similarity search
   - Gemini-based re-ranking
   - No session context

**Interfaces:**
```typescript
interface UnifiedRAGOptions {
  sessionId: string;
  organization: string;
  division: string;
  app_under_test: string;
  userEmail?: string;
  useContextAware?: boolean;
  useAgenticRAG?: boolean;
  useRLHFSignals?: boolean;
  initialCandidates?: number;
  topK?: number;
  targetConfidence?: number;
}

interface UnifiedRAGResult {
  documents: RetrievedDocument[];
  response?: string;
  metadata: {
    strategy: "context-aware" | "agentic" | "standard";
    confidence: number;
    totalTimeMs: number;
    usedRLHFSignals: boolean;
    agentIterations?: number;
  };
}
```

### 2. RLHF Curate Components

#### RLHFFeedbackTab

**Primary Component**: `src/components/ui/rlhf-tabs/RLHFFeedbackTab.tsx`

**Responsibilities:**
- Display feedback queue from Supabase
- Collect thumbs up/down, star ratings, and detailed corrections
- Mark document relevance for retrieved contexts
- Show feedback statistics dashboard
- Submit feedback to API for storage

**Key Features:**
- Expandable feedback cards
- Document relevance marking (relevant/not relevant)
- Star rating system (1-5 stars)
- Detailed correction text area
- Real-time stats (pending, submitted, avg rating)

**Interfaces:**
```typescript
interface FeedbackItem {
  id: string;
  sessionId: string;
  query: string;
  response: string;
  retrievedDocs: RetrievedDoc[];
  timestamp: string;
  feedbackSubmitted?: boolean;
}

interface RetrievedDoc {
  id: string;
  content: string;
  source_type: string;
  similarity: number;
  rerankScore?: number;
  userMarkedRelevant?: boolean | null;
}
```

### 3. Authentication Components

#### CognitoAuthService

**Primary Service**: `src/services/auth/CognitoAuthService.ts`

**Responsibilities:**
- Handle magic link authentication flow
- Manage Cognito user sessions
- Provide token refresh logic
- Store auth state in localStorage

**Magic Link Flow:**
1. User enters email at `/emergency-login.html`
2. System calls `ForgotPasswordCommand` to send 6-digit code
3. User enters code from email
4. System exchanges code for JWT tokens
5. Tokens stored in localStorage as `siam_user`

**Interfaces:**
```typescript
interface AuthService {
  sendMagicLink(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<AuthTokens>;
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  signOut(): Promise<void>;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

## Data Models

### Supabase Schema

#### rlhf_feedback Table
```sql
CREATE TABLE rlhf_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  retrieved_contexts JSONB,
  feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'correction')),
  thumbs_up BOOLEAN,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  suggested_correction TEXT,
  feedback_text TEXT,
  documents_marked JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### gemini_embeddings Table
```sql
CREATE TABLE gemini_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  source_type TEXT NOT NULL,
  organization TEXT,
  division TEXT,
  app_under_test TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON gemini_embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### user_roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'curator', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Session State Model

```typescript
interface SessionState {
  sessionId: string;
  organization: string;
  division: string;
  app_under_test: string;
  userEmail?: string;
  startedAt: string;
  lastActivityAt: string;
  history: ConversationTurn[];
  reinforcementContext: ReinforcementContext;
}

interface ConversationTurn {
  query: string;
  retrievedDocs: string[];
  response: string;
  timestamp: string;
  feedback?: RLHFFeedback;
}

interface ReinforcementContext {
  successfulDocIds: string[];
  failedDocIds: string[];
  topicWeights: Record<string, number>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Code and diagram rendering completeness
*For any* AI response containing code blocks or diagram syntax, the rendered HTML output should include syntax highlighting elements and action buttons (download/share).
**Validates: Requirements 1.3**

### Property 2: Curator UI element presence
*For any* user authenticated with curator or admin role, the Curate tab UI should expose thumbs up/down buttons, star rating controls, document relevance toggles, and detailed notes textarea.
**Validates: Requirements 2.1**

### Property 3: Document upload round-trip
*For any* document uploaded through the Curate interface, querying Supabase should return that document with embeddings generated, and the document should be retrievable via similarity search.
**Validates: Requirements 2.2**

### Property 4: Document deduplication
*For any* document uploaded that has ≥85% similarity to an existing document, the system should not create a new embedding entry but should reference the existing document.
**Validates: Requirements 2.2**

### Property 5: Dashboard statistics accuracy
*For any* state of the RLHF feedback system, the stats dashboard should display counts that match the actual database records (pending count = records with status 'pending', submitted count = records with status 'approved' or 'rejected').
**Validates: Requirements 2.3**

### Property 6: Feedback improvement effect
*For any* admin correction or document upload on topic T, a subsequent query about topic T should retrieve the corrected information or newly uploaded document with higher relevance score than before the correction.
**Validates: Requirements 2.4**

### Property 7: Role-based access enforcement
*For any* user with role R, attempting to access a resource should succeed if and only if role R has permission for that resource type according to the role_permissions table.
**Validates: Requirements 2.5**

### Property 8: HITL UI capabilities
*For any* failing test displayed in the testing dashboard, the UI should provide annotation input fields, escalation buttons, and conversion-to-automated-suite actions.
**Validates: Requirements 3.2**

### Property 9: Automation loop persistence
*For any* human feedback submitted on a test case, the system should trigger test regeneration and store the regenerated test result back in Supabase with a reference to the original feedback.
**Validates: Requirements 3.3**

### Property 10: Dashboard visualization completeness
*For any* testing dashboard state, the UI should display pass/fail trend charts, reviewer queue counts, and ROI metric calculations based on current database state.
**Validates: Requirements 3.4**

### Property 11: HITL action logging
*For any* approval action or LangGraph breakpoint hit during HITL workflows, an audit log entry should be created in the database with timestamp, user, and action details.
**Validates: Requirements 3.5**

## Error Handling

### Chat Experience Error Handling

**API Quota Exceeded:**
- Detect `insufficient_quota` or `429` errors from AI providers
- Display user-friendly toast notification with provider name
- Suggest checking API key configuration
- Gracefully degrade to fallback model if available

**Network Failures:**
- Detect `Failed to fetch` and connection errors
- Show connection error toast with retry suggestion
- Maintain message history to prevent data loss
- Allow manual retry of failed messages

**Invalid Input:**
- Validate message content is non-null and non-empty before sending
- Prevent sending messages during active streaming
- Clear input field after successful send
- Show validation errors inline

**Voice Input Errors:**
- Check microphone permissions on mount
- Provide helpful instructions for permission denied errors
- Handle microphone not found gracefully
- Support push-to-talk mode to avoid continuous listening errors

### RLHF Error Handling

**Feedback Submission Failures:**
- Retry failed submissions with exponential backoff
- Show error toast with specific failure reason
- Maintain local state to allow re-submission
- Log errors for debugging

**Document Upload Failures:**
- Validate file size and type before upload
- Show progress indicator during upload
- Handle network interruptions with resume capability
- Provide clear error messages for invalid files

**Permission Errors:**
- Check user role before rendering curator-only UI
- Redirect unauthorized users to appropriate view
- Show permission denied message with contact info
- Log unauthorized access attempts

### Authentication Error Handling

**Magic Link Failures:**
- Validate email format before sending code
- Handle Cognito service errors gracefully
- Provide clear instructions for code entry
- Allow code resend after timeout

**Session Expiration:**
- Detect expired tokens on API calls
- Prompt user to re-authenticate
- Preserve current page state for post-auth redirect
- Clear stale tokens from localStorage

**Invalid Credentials:**
- Show specific error for invalid email
- Indicate when code is incorrect or expired
- Limit retry attempts to prevent abuse
- Provide support contact for locked accounts

## Testing Strategy

### Unit Testing

**Framework:** Vitest

**Coverage Areas:**
- Utility functions (text processing, formatting, validation)
- Data transformation logic (RAG result parsing, message formatting)
- Authentication state management
- Session state management
- RLHF feedback calculation logic

**Example Unit Tests:**
- `prepareTextForSpeech()` removes code blocks correctly
- `calculateSimilarity()` returns values between 0 and 1
- `formatTimestamp()` handles various date formats
- `validateEmail()` accepts valid emails and rejects invalid ones

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking enabled to find minimal failing examples

**Property Test Implementation:**
Each property test MUST be tagged with a comment referencing the design document property:

```typescript
// Feature: SIAM, Property 1: Code and diagram rendering completeness
test('code blocks always render with syntax highlighting', () => {
  fc.assert(
    fc.property(
      fc.string(), // arbitrary code content
      fc.constantFrom('javascript', 'python', 'typescript', 'sql'),
      (code, language) => {
        const response = { content: `\`\`\`${language}\n${code}\n\`\`\`` };
        const rendered = renderMessage(response);
        expect(rendered).toContain('syntax-highlight');
        expect(rendered).toContain('download-button');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Tests to Implement:**
- Property 1: Code rendering (Requirements 1.3)
- Property 2: Curator UI elements (Requirements 2.1)
- Property 3: Document upload round-trip (Requirements 2.2)
- Property 4: Document deduplication (Requirements 2.2)
- Property 5: Dashboard statistics (Requirements 2.3)
- Property 6: Feedback improvement (Requirements 2.4)
- Property 7: Role-based access (Requirements 2.5)
- Property 8: HITL UI capabilities (Requirements 3.2)
- Property 9: Automation loop (Requirements 3.3)
- Property 10: Dashboard visualization (Requirements 3.4)
- Property 11: HITL logging (Requirements 3.5)

### Integration Testing

**Framework:** Playwright

**Test Scenarios:**
- End-to-end chat flow with RAG retrieval
- Magic link authentication complete flow
- RLHF feedback submission and retrieval
- Document upload and embedding generation
- Role-based access control across pages
- Voice input/output integration
- Multi-model switching

**Example Integration Tests:**
- User sends message → receives AI response with sources
- User uploads document → document appears in search results
- Curator submits feedback → feedback appears in dashboard
- Admin marks document relevant → future queries boost that document

### Visual Regression Testing

**Framework:** Playwright with screenshot comparison

**Coverage:**
- Chat interface in various states (empty, loading, with messages)
- Curate tab with feedback cards
- Testing dashboard with charts
- Authentication pages
- Error states and toasts

### Performance Testing

**Metrics to Track:**
- Chat response latency (target: <1s for 95% of queries)
- RAG retrieval time breakdown (vector search, re-ranking, generation)
- Document upload and embedding generation time
- Page load times (First Contentful Paint, Time to Interactive)
- API endpoint response times

**Tools:**
- Lighthouse for web vitals
- Custom timing instrumentation in RAG orchestrator
- Supabase query performance monitoring

## Implementation Notes

### Next.js 16 Considerations

- Use App Router for all pages
- Leverage Server Components for initial data fetching
- Use Client Components for interactive UI (chat, feedback forms)
- Implement streaming responses with React Suspense
- Use Server Actions for form submissions where appropriate

### Gemini 3.0 Pro Integration

- Configure with 1M+ context window for long conversations
- Use streaming API for real-time response display
- Implement token counting to stay within limits
- Handle rate limiting with exponential backoff
- Cache embeddings to reduce API calls

### Supabase Best Practices

- Use Row-Level Security (RLS) for all tables
- Create indexes on frequently queried columns
- Use connection pooling for API routes
- Implement optimistic updates in UI
- Batch embedding operations where possible

### Voice Integration

- Use ElevenLabs WebSocket API for low-latency STT
- Implement push-to-talk to avoid continuous listening
- Filter code blocks from TTS output for better UX
- Provide visual feedback during recording
- Handle permission requests gracefully

### Demo Mode Features

- Hero metrics strip showing live RAG performance
- Confidence badges on AI responses
- RAG context viewer for transparency
- Diagram offer prompts for visual queries
- Toggle for demo mode enhancements

