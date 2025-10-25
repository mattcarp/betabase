```mermaid
flowchart TD
    A[User Query] --> B{Query Analysis}
    B --> C[Semantic Embedding<br/>via OpenAI]
    
    C --> D[Vector Search<br/>Supabase pgvector]
    D --> E{Relevance<br/>Score > 0.7?}
    
    E -->|Yes| F[Top 5 Context Chunks]
    E -->|No| G[Insufficient Context]
    
    G --> H[Return: 'No information<br/>available in docs']
    
    F --> I[Construct Prompt]
    
    subgraph "Prompt Engineering"
        I --> J[System: Only use context]
        J --> K[Context: Retrieved chunks]
        K --> L[User Query]
        L --> M[Constraint: Admit gaps]
    end
    
    M --> N[GPT-5 API Call]
    
    N --> O{Response<br/>Validation}
    
    O --> P{Citations<br/>Present?}
    P -->|No| Q[Log Warning<br/>Possible Hallucination]
    P -->|Yes| R{Claims Match<br/>Context?}
    
    R -->|No| Q
    R -->|Yes| S[Streaming Response<br/>with Citations]
    
    S --> T[User receives answer]
    
    Q --> U[Block or flag response]
    
    subgraph "Anti-Hallucination Protection"
        E
        M
        O
        P
        R
    end
    
    style A fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff
    style N fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style D fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style S fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style H fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    style U fill:#ef4444,stroke:#dc2626,stroke-width:2px,color:#fff
    
    classDef protectionStyle fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#fff
    class E,M,O,P,R protectionStyle
```

## Diagram 3: RAG Pipeline with Anti-Hallucination

**Purpose:** Shows the complete request flow with protection mechanisms

**Key Points to Highlight:**

**Query Processing:**
- Semantic embedding converts natural language to vectors
- pgvector finds similar content in knowledge base
- Relevance threshold (0.7) filters weak matches

**Protection Layers:**
1. **Relevance Score Check:** If score too low, immediately return "no information"
2. **Prompt Engineering:** Explicit instructions to only use provided context
3. **Response Validation:** Check for citations
4. **Claim Verification:** Ensure claims match context

**Use in presentation:** "We don't just throw docs at GPT and hope for the best - there are multiple protection layers"

**Technical Detail:** "Notice the early exit if relevance score is low - we'd rather say 'I don't know' than make something up"

**Demo Connection:** "This is why when I ask about blockchain features, the system correctly says there's no information rather than inventing features"
