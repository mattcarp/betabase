```mermaid
graph TB
    subgraph "Client Layer"
        A[Next.js 15 Frontend<br/>React Server Components]
        A1[User Interface]
        A2[Streaming Response Handler]
    end

    subgraph "Application Layer"
        B[API Routes<br/>Next.js App Router]
        C[Chat API Endpoint<br/>/api/chat]
        D[MCP Proxy Layer]
    end

    subgraph "AI & Search Layer"
        E[GPT-5 API<br/>OpenAI]
        F[Vector Search<br/>Supabase pgvector]
        G[Semantic Retrieval<br/>Context Ranking]
    end

    subgraph "MCP Integration Layer"
        H1[JIRA MCP Server<br/>Live Ticket Data]
        H2[GitHub MCP Server<br/>Code Search]
        H3[Supabase MCP Server<br/>Database Queries]
        H4[Custom AOMA MCP<br/>Web Scraping]
    end

    subgraph "Data Layer"
        I[Supabase PostgreSQL<br/>with pgvector]
        J[Document Chunks<br/>Vectorized Knowledge]
        K[Conversation History]
    end

    A1 --> A
    A2 --> A
    A --> C
    C --> B
    B --> D
    B --> E
    B --> F

    D --> H1
    D --> H2
    D --> H3
    D --> H4

    F --> G
    G --> I
    I --> J
    I --> K

    E -.Streaming Response.-> A2
    F -.Retrieved Context.-> E
    D -.Live Data.-> E

    style A fill:#1e293b,stroke:#334155,stroke-width:2px,color:#fff
    style E fill:#0ea5e9,stroke:#0284c7,stroke-width:2px,color:#fff
    style F fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff
    style I fill:#10b981,stroke:#059669,stroke-width:2px,color:#fff
    style D fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff

    classDef mcpStyle fill:#ec4899,stroke:#db2777,stroke-width:2px,color:#fff
    class H1,H2,H3,H4 mcpStyle
```

## Diagram 1: System Architecture

**Purpose:** Shows the complete system from UI to data layer

**Key Points to Highlight:**

- Next.js 15 with React Server Components for efficient rendering
- MCP Proxy Layer orchestrates multiple data sources
- GPT-5 receives context from both vector search AND MCP servers
- Streaming responses for real-time UX
- Supabase for both vector search and data storage

**Use in presentation:** "Here's the full architecture - notice how MCP servers provide live data alongside our vectorized knowledge base"
