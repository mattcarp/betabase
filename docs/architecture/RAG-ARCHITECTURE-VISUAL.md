# RAG Architecture Visual Explainer

## The Big Picture

```mermaid
flowchart TB
    subgraph USER["User Layer"]
        Q[/"User Query"/]
        R[/"Response + Sources"/]
    end

    subgraph ORCHESTRATOR["UnifiedRAGOrchestrator<br/><i>The Strategy Brain</i>"]
        PICK{Which Strategy?}

        subgraph STRATEGIES["Three Strategies"]
            S1["Context-Aware<br/><i>default</i>"]
            S2["Agentic RAG<br/><i>self-correcting</i>"]
            S3["Standard<br/><i>fallback</i>"]
        end
    end

    subgraph SEARCH["knowledgeSearchService<br/><i>The Search Engine</i>"]
        EMB["Generate Embedding"]
        VEC["Vector Search"]
        KEY["Keyword Fallback"]
        CACHE["5-min Cache"]
    end

    subgraph DB["Supabase"]
        PG[("pgvector<br/>45,399 vectors")]
    end

    Q --> PICK
    PICK --> S1
    PICK --> S2
    PICK --> S3

    S1 --> SEARCH
    S2 --> SEARCH
    S3 --> SEARCH

    CACHE -.-> VEC
    EMB --> VEC
    EMB -.->|"if fails"| KEY
    VEC --> PG
    KEY --> PG

    PG --> R

    style ORCHESTRATOR fill:#1a1a2e,stroke:#3b82f6,color:#fafafa
    style SEARCH fill:#1a1a2e,stroke:#22c55e,color:#fafafa
    style DB fill:#1a1a2e,stroke:#f59e0b,color:#fafafa
    style USER fill:#0a0a0a,stroke:#71717a,color:#fafafa
```

---

## The Three Strategies

```mermaid
flowchart LR
    subgraph STANDARD["Standard (Fallback)"]
        direction TB
        ST1["1. Get 50 candidates"]
        ST2["2. Gemini re-ranks"]
        ST3["3. Return top 10"]
        ST1 --> ST2 --> ST3
    end

    subgraph CONTEXT["Context-Aware (Default)"]
        direction TB
        CA1["1. Check session history"]
        CA2["2. Apply RLHF boosts"]
        CA3["3. Transform query"]
        CA4["4. Search + re-rank"]
        CA1 --> CA2 --> CA3 --> CA4
    end

    subgraph AGENTIC["Agentic (Advanced)"]
        direction TB
        AG1["1. Initial search"]
        AG2["2. Evaluate confidence"]
        AG3{"Good enough?"}
        AG4["3. Refine & retry"]
        AG5["4. Return best"]
        AG1 --> AG2 --> AG3
        AG3 -->|"no"| AG4
        AG4 --> AG2
        AG3 -->|"yes"| AG5
    end

    style STANDARD fill:#27272a,stroke:#71717a,color:#a1a1aa
    style CONTEXT fill:#1e3a5f,stroke:#3b82f6,color:#fafafa
    style AGENTIC fill:#1a2e1a,stroke:#22c55e,color:#fafafa
```

---

## knowledgeSearchService Flow

```mermaid
flowchart TB
    Q["Query: 'AOMA auth flow'"]

    subgraph CACHE_CHECK["Cache Check"]
        CC{{"In cache?"}}
        HIT["Return cached<br/><i>instant</i>"]
    end

    subgraph EMBED["Embedding"]
        GEN["OpenAI text-embedding-3-small"]
        VEC["1536-dim vector"]
    end

    subgraph SEARCH["Search"]
        VS["Vector Similarity<br/><i>pgvector</i>"]
        KW["Keyword ILIKE<br/><i>fallback</i>"]
    end

    subgraph RESULTS["Results"]
        DOCS["Documents + Scores"]
        META["Source types, URLs"]
        STATS["Timing, count"]
    end

    Q --> CC
    CC -->|"yes"| HIT
    CC -->|"no"| GEN
    GEN --> VEC
    VEC --> VS
    GEN -.->|"fails"| KW
    VS --> DOCS
    KW --> DOCS
    DOCS --> META --> STATS

    STATS -->|"cache for 5 min"| CACHE_CHECK

    style CACHE_CHECK fill:#1a1a2e,stroke:#f59e0b,color:#fafafa
    style EMBED fill:#1a1a2e,stroke:#3b82f6,color:#fafafa
    style SEARCH fill:#1a1a2e,stroke:#22c55e,color:#fafafa
    style RESULTS fill:#1a1a2e,stroke:#71717a,color:#fafafa
```

---

## UnifiedRAGOrchestrator Flow

```mermaid
flowchart TB
    Q["Query + Session Context"]

    subgraph FLAGS["Feature Flags"]
        F1["useAgenticRAG?"]
        F2["useContextAware?"]
        F3["useRLHFSignals?"]
    end

    subgraph DECISION["Strategy Selection"]
        D1{{"Agentic enabled?"}}
        D2{{"Context enabled?"}}

        D1 -->|"yes"| AGENTIC["Agentic RAG<br/><i>multi-step reasoning</i>"]
        D1 -->|"no"| D2
        D2 -->|"yes"| CONTEXT["Context-Aware<br/><i>session history + RLHF</i>"]
        D2 -->|"no"| STANDARD["Standard<br/><i>two-stage retrieval</i>"]
    end

    subgraph SESSION["Session Tracking"]
        HIST["Add to history"]
        FEED["Track feedback"]
        REINF["Update reinforcement"]
    end

    subgraph OUTPUT["Output"]
        DOCS["Documents"]
        CONF["Confidence %"]
        STRAT["Strategy used"]
        TIME["Total time ms"]
    end

    Q --> FLAGS --> D1
    AGENTIC --> SESSION
    CONTEXT --> SESSION
    STANDARD --> SESSION
    SESSION --> OUTPUT

    style FLAGS fill:#27272a,stroke:#71717a,color:#a1a1aa
    style DECISION fill:#1a1a2e,stroke:#3b82f6,color:#fafafa
    style SESSION fill:#1a1a2e,stroke:#22c55e,color:#fafafa
    style OUTPUT fill:#1a1a2e,stroke:#f59e0b,color:#fafafa
```

---

## RLHF Feedback Loop

```mermaid
flowchart LR
    subgraph QUERY["Query"]
        Q1["User asks question"]
    end

    subgraph RETRIEVE["Retrieve"]
        R1["Get documents"]
        R2["Show sources"]
    end

    subgraph RESPOND["Respond"]
        A1["Generate answer"]
        A2["Show citations"]
    end

    subgraph FEEDBACK["Feedback"]
        F1["Thumbs up/down"]
        F2["Star rating"]
        F3["Text correction"]
    end

    subgraph LEARN["Learn"]
        L1["Boost good docs"]
        L2["Demote bad docs"]
        L3["Adjust topic weights"]
    end

    Q1 --> R1 --> R2 --> A1 --> A2 --> F1
    F1 --> F2 --> F3
    F3 --> L1 --> L2 --> L3
    L3 -.->|"next query"| R1

    style QUERY fill:#1a1a2e,stroke:#71717a,color:#fafafa
    style RETRIEVE fill:#1a1a2e,stroke:#3b82f6,color:#fafafa
    style RESPOND fill:#1a1a2e,stroke:#22c55e,color:#fafafa
    style FEEDBACK fill:#1a1a2e,stroke:#f59e0b,color:#fafafa
    style LEARN fill:#1a1a2e,stroke:#ef4444,color:#fafafa
```

---

## Data Flow Summary

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant C as ContextAware
    participant K as KnowledgeSearch
    participant S as Supabase

    U->>O: "What's the AOMA auth flow?"

    Note over O: Check feature flags
    O->>O: useContextAware = true

    O->>C: query + session
    C->>C: Check history
    C->>C: Apply RLHF boosts

    C->>K: transformed query

    K->>K: Check cache
    alt Cache hit
        K-->>C: Cached results
    else Cache miss
        K->>K: Generate embedding
        K->>S: Vector search
        S-->>K: Matching docs
        K->>K: Cache for 5 min
        K-->>C: Fresh results
    end

    C->>C: Re-rank with context
    C-->>O: Documents + confidence

    O->>O: Update session history
    O-->>U: Response + sources

    Note over U: User gives feedback
    U->>O: Thumbs up + correction
    O->>O: Update reinforcement context
```

---

## Key Numbers

| Metric | Value |
|--------|-------|
| Total vectors | 45,399 |
| Embedding dims (OpenAI) | 1,536 |
| Embedding dims (Gemini) | 768 |
| Cache TTL | 5 minutes |
| Default top-K | 10 |
| Initial candidates | 50 |
| Match threshold | 0.50 |
| Query timeout | 3 seconds |

---

## TL;DR

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   USER QUERY                                            │
│        │                                                │
│        ▼                                                │
│   ┌─────────────────────────────────────┐               │
│   │  UnifiedRAGOrchestrator             │               │
│   │  "Which strategy should I use?"     │               │
│   │                                     │               │
│   │  • Context-Aware (default)          │               │
│   │  • Agentic (self-correcting)        │               │
│   │  • Standard (fallback)              │               │
│   └─────────────────────────────────────┘               │
│        │                                                │
│        ▼                                                │
│   ┌─────────────────────────────────────┐               │
│   │  knowledgeSearchService             │               │
│   │  "Let me search the vectors"        │               │
│   │                                     │               │
│   │  • Generate embedding               │               │
│   │  • Vector similarity search         │               │
│   │  • Cache results                    │               │
│   └─────────────────────────────────────┘               │
│        │                                                │
│        ▼                                                │
│   ┌─────────────────────────────────────┐               │
│   │  Supabase pgvector                  │               │
│   │  45,399 domain-specific vectors     │               │
│   └─────────────────────────────────────┘               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

*These diagrams render in any Mermaid-compatible viewer (GitHub, VS Code, Obsidian, the SIAM app itself)*
