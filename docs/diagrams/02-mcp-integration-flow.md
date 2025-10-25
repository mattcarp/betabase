```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js Frontend
    participant API as Chat API
    participant MCP as MCP Proxy
    participant JIRA as JIRA MCP Server
    participant GitHub as GitHub MCP Server
    participant Vector as Vector Search
    participant GPT5 as GPT-5 API
    
    User->>Frontend: "Show me JIRA tickets for AOMA"
    Frontend->>API: POST /api/chat
    
    Note over API: Parse query intent
    
    par Parallel Data Retrieval
        API->>Vector: Semantic search: "AOMA"
        Vector-->>API: Relevant doc chunks
    and
        API->>MCP: Request JIRA data
        MCP->>JIRA: Query tickets (project=AOMA)
        JIRA-->>MCP: Live ticket data
        MCP-->>API: Formatted ticket info
    and
        API->>MCP: Request GitHub data
        MCP->>GitHub: Search code mentions
        GitHub-->>MCP: Code references
        MCP-->>API: Code snippets
    end
    
    Note over API: Aggregate all context
    
    API->>GPT5: Prompt + Docs + Live Data
    
    loop Streaming Response
        GPT5-->>API: Response tokens
        API-->>Frontend: Server-Sent Events
        Frontend-->>User: Real-time display
    end
    
    Note over Frontend: Show citations from<br/>both docs and live data
    
    style User fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff
    style Frontend fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff
    style API fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style MCP fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff
    style JIRA fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    style GitHub fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    style Vector fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style GPT5 fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
```

## Diagram 2: MCP Integration Flow

**Purpose:** Shows how MCP servers work in the request/response cycle

**Key Points to Highlight:**
- Parallel data retrieval (docs + live data simultaneously)
- MCP Proxy orchestrates multiple MCP servers
- All context aggregated before GPT-5 call
- Streaming response for real-time UX
- Citations include both static docs and live data sources

**Use in presentation:** "When you ask about JIRA tickets, we're not just searching docs - we're hitting the actual JIRA API through MCP servers while simultaneously searching our knowledge base"

**Technical Detail:** "Notice the parallel execution - vector search and MCP calls happen concurrently, reducing total latency"
