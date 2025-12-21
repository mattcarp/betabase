# CDTEXT Skill - Architecture Diagram

This document visualizes how the three-layer architecture works together.

---

## 🏗️ Three-Layer Architecture

```mermaid
flowchart TB
    User["👤 User: 'Parse this CDTEXT: [hex]'"]
    
    subgraph Layer1["📚 LAYER 1: Vector Store (Knowledge Foundation)"]
        VecDB[(Supabase siam_vectors)]
        Doc1[cdtext-parsing-guide.md<br/>Spec + Algorithm]
        Doc2[cdtext-examples.md<br/>Test Cases]
        VecDB --> Doc1
        VecDB --> Doc2
    end
    
    subgraph Layer2["🧠 LAYER 2: System Prompt (Skill Execution)"]
        SysPrompt[System Prompt Enhancement<br/>src/app/api/chat/route.ts]
        Algorithm["Parsing Algorithm:<br/>1. Validate hex input<br/>2. Split into 18-byte packs<br/>3. Decode ASCII (bytes 4-15)<br/>4. Group by track<br/>5. Output markdown table"]
        SysPrompt --> Algorithm
    end
    
    subgraph Layer3["🔄 LAYER 3: ByteRover (Iterative Learning)"]
        ByteRover[(ByteRover MCP)]
        Pattern1[Success Patterns:<br/>'Track 0 = Album']
        Pattern2[Error Patterns:<br/>'Avoid X, causes Y']
        ByteRover --> Pattern1
        ByteRover --> Pattern2
    end
    
    User --> RAG[RAG Orchestration]
    
    RAG --> VecDB
    RAG --> SysPrompt
    RAG --> ByteRover
    
    RAG --> LLM["🤖 Gemini Flash<br/>Response Generation"]
    
    LLM --> Output["📊 Markdown Table Output<br/>| Track | Type | Value |"]
    
    Output --> Feedback{"👍 Perfect?"}
    
    Feedback -->|"Yes! That's perfect"| Store[Store Success<br/>in ByteRover]
    Feedback -->|"No, fix X"| Iterate[User Feedback<br/>→ Store Error Pattern]
    
    Store --> ByteRover
    Iterate --> ByteRover
    Iterate --> User
    
    style User fill:#4CAF50,color:white
    style Output fill:#2196F3,color:white
    style ByteRover fill:#9C27B0,color:white
    style LLM fill:#FF9800,color:white
    style Store fill:#4CAF50,color:white
    style Iterate fill:#f44336,color:white
```

---

## 🔄 Iteration Cycle Detail

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant AI as 🤖 AI Agent
    participant Vec as 📚 Vector Store
    participant Prompt as 🧠 System Prompt
    participant BR as 🔄 ByteRover
    
    Note over U,BR: ITERATION 1 (First Attempt)
    U->>AI: Parse this CDTEXT: [hex]
    AI->>Vec: Retrieve: "CDTEXT parsing"
    Vec-->>AI: docs/cdtext-parsing-guide.md
    AI->>Prompt: Apply parsing algorithm
    Prompt-->>AI: Instructions loaded
    AI->>BR: Retrieve: "CDTEXT patterns"
    BR-->>AI: (empty - first time)
    AI->>U: ❌ Output: Wrong format
    
    Note over U,BR: USER FEEDBACK
    U->>AI: Pack type 0x80 is TITLE, not PERFORMER
    
    Note over U,BR: ITERATION 2
    AI->>Vec: Re-retrieve docs
    AI->>Prompt: Re-apply with correction
    AI->>U: ✅ Output: Better (still issues)
    U->>AI: Good! But Track 0 should say "Album"
    
    Note over U,BR: ITERATION 3
    AI->>Vec: Retrieve docs
    AI->>Prompt: Apply algorithm
    AI->>U: ✅✅ Output: Perfect table!
    U->>AI: That's perfect!
    
    Note over U,BR: STORE SUCCESS
    AI->>BR: Store success pattern
    BR-->>AI: Stored ✓
    
    Note over U,BR: NEXT SESSION (New User)
    U->>AI: Parse this CDTEXT: [different hex]
    AI->>Vec: Retrieve docs
    AI->>BR: Retrieve patterns
    BR-->>AI: Success pattern retrieved!
    AI->>Prompt: Apply algorithm + learned pattern
    AI->>U: ✅✅✅ Perfect on first try!
```

---

## 📦 Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input
        Hex[Hexadecimal String<br/>8000001C416D617A696E67...]
    end
    
    subgraph Processing
        Valid{Validate<br/>Format}
        Split[Split into<br/>18-byte packs]
        Parse[Parse Each Pack]
        Decode[Decode ASCII<br/>bytes 4-15]
        Group[Group by<br/>Track Number]
    end
    
    subgraph Knowledge
        VecK[Vector Store<br/>Spec Knowledge]
        PromptK[System Prompt<br/>Algorithm]
        ByteK[ByteRover<br/>Learned Patterns]
    end
    
    subgraph Output
        Table["Markdown Table<br/>| Track | Type | Value |<br/>| Album | TITLE | Amazing Album |"]
    end
    
    Hex --> Valid
    Valid -->|✅ Valid| Split
    Valid -->|❌ Invalid| Error[Error Message]
    
    VecK -.-> Valid
    PromptK -.-> Split
    ByteK -.-> Parse
    
    Split --> Parse
    Parse --> Decode
    Decode --> Group
    Group --> Table
    
    style Hex fill:#4CAF50,color:white
    style Table fill:#2196F3,color:white
    style Error fill:#f44336,color:white
    style VecK fill:#9C27B0,color:white
    style PromptK fill:#FF9800,color:white
    style ByteK fill:#E91E63,color:white
```

---

## 🎯 Pack Structure Breakdown

```mermaid
flowchart TD
    Pack["18-byte CDTEXT Pack<br/>(36 hex characters)"]
    
    Pack --> B0[Byte 0<br/>Pack Type ID<br/>0x80=TITLE<br/>0x81=PERFORMER]
    Pack --> B1[Byte 1<br/>Track Number<br/>0=Album<br/>1-99=Tracks]
    Pack --> B2[Byte 2<br/>Sequence Number]
    Pack --> B3[Byte 3<br/>Block Char Position]
    Pack --> B4_15[Bytes 4-15<br/>Data: 12 bytes<br/>NULL-terminated ASCII]
    Pack --> B16_17[Bytes 16-17<br/>CRC Checksum]
    
    B0 --> Map["Type Mapping:<br/>TITLE<br/>PERFORMER<br/>ISRC<br/>GENRE"]
    B1 --> Track["Track Grouping:<br/>0 → 'Album'<br/>1 → '1'<br/>2 → '2'"]
    B4_15 --> ASCII["ASCII Decode:<br/>'Amazing Album'<br/>'The Artist'"]
    B16_17 --> CRC{"CRC Valid?"}
    
    CRC -->|Yes| OK[✅ Use data]
    CRC -->|No| Warn[⚠️ Mark error<br/>but decode anyway]
    
    style Pack fill:#4CAF50,color:white
    style Map fill:#2196F3,color:white
    style Track fill:#FF9800,color:white
    style ASCII fill:#9C27B0,color:white
    style OK fill:#4CAF50,color:white
    style Warn fill:#FF5722,color:white
```

---

## 🚀 Upload Workflow

```mermaid
flowchart LR
    Script[./scripts/upload-cdtext-knowledge.sh]
    
    Script --> API[POST /api/knowledge/upload]
    
    API --> File1[docs/cdtext-parsing-guide.md]
    API --> File2[docs/cdtext-examples.md]
    
    File1 --> Chunk1[Chunk into 1800-char pieces]
    File2 --> Chunk2[Chunk into 1800-char pieces]
    
    Chunk1 --> Embed1[Generate Embeddings<br/>Gemini text-embedding-004]
    Chunk2 --> Embed2[Generate Embeddings<br/>Gemini text-embedding-004]
    
    Embed1 --> DB[(Supabase siam_vectors)]
    Embed2 --> DB
    
    DB --> Meta["Metadata:<br/>source_type: 'knowledge'<br/>category: 'audio_mastering'<br/>skill: 'cdtext_parsing'"]
    
    style Script fill:#4CAF50,color:white
    style DB fill:#2196F3,color:white
    style Meta fill:#9C27B0,color:white
```

---

## 🧠 ByteRover Learning Cycle

```mermaid
graph TD
    subgraph Session1[Session 1: First Attempt]
        A1[User: Parse CDTEXT]
        A2[AI: Attempts parse]
        A3[Output: Wrong ❌]
        A4[User: Feedback]
        A5[AI: Stores error pattern]
    end
    
    subgraph Session2[Session 2: Improvement]
        B1[User: Same query]
        B2[AI: Retrieves error pattern]
        B3[AI: Avoids previous mistake]
        B4[Output: Better ✅]
        B5[User: 'Perfect!']
        B6[AI: Stores success pattern]
    end
    
    subgraph Session3[Session 3: Production Ready]
        C1[User: New CDTEXT]
        C2[AI: Retrieves success pattern]
        C3[Output: Perfect on first try ✅✅✅]
    end
    
    A1 --> A2 --> A3 --> A4 --> A5
    A5 -.->|ByteRover stores| B2
    B1 --> B2 --> B3 --> B4 --> B5 --> B6
    B6 -.->|ByteRover stores| C2
    C1 --> C2 --> C3
    
    style A3 fill:#f44336,color:white
    style B4 fill:#FF9800,color:white
    style C3 fill:#4CAF50,color:white
```

---

## 📊 Demo Flow

```mermaid
flowchart TB
    Start["🎬 Demo Start<br/>CapCut Recording"]
    
    Narrate1["🎤 'The system can parse<br/>specialized binary formats'"]
    
    Paste["👨‍💻 Paste CDTEXT hex<br/>(Example 5 from docs)"]
    
    Process["⚡ Processing<br/>< 3 seconds"]
    
    Table["📊 Beautiful Table Appears<br/>| Track | Type | Value |<br/>| Album | TITLE | The Best Of |<br/>| 1 | ISRC | USRC20250123 |"]
    
    Narrate2["🎤 'Binary data parsed instantly'<br/>'Learned through iteration'<br/>'ByteRover remembers'"]
    
    End["✅ Demo Complete<br/>Audience: 🤯"]
    
    Start --> Narrate1 --> Paste --> Process --> Table --> Narrate2 --> End
    
    style Start fill:#4CAF50,color:white
    style Table fill:#2196F3,color:white
    style End fill:#9C27B0,color:white
    style Process fill:#FF9800,color:white
```

---

## 🔧 Troubleshooting Decision Tree

```mermaid
flowchart TD
    Issue{Problem?}
    
    Issue -->|"AI doesn't recognize CDTEXT"| Check1{Vector docs uploaded?}
    Issue -->|"Wrong pack types decoded"| Check2{System prompt updated?}
    Issue -->|"Garbled ASCII output"| Check3{NULL terminator handled?}
    Issue -->|"Not improving over iterations"| Check4{ByteRover storing?}
    
    Check1 -->|No| Fix1[Run upload script]
    Check1 -->|Yes| Fix1b[Check retrieval logs]
    
    Check2 -->|No| Fix2[Restart dev server]
    Check2 -->|Yes| Fix2b[Check line ~920 in route.ts]
    
    Check3 -->|No| Fix3[Provide feedback:<br/>'Stop at NULL byte']
    Check3 -->|Yes| Fix3b[Store pattern in ByteRover]
    
    Check4 -->|No| Fix4[Manually trigger:<br/>'Store this in ByteRover']
    Check4 -->|Yes| Fix4b[Query ByteRover:<br/>'What did you learn?']
    
    Fix1 --> Retry[Try Again]
    Fix1b --> Retry
    Fix2 --> Retry
    Fix2b --> Retry
    Fix3 --> Retry
    Fix3b --> Retry
    Fix4 --> Retry
    Fix4b --> Retry
    
    style Issue fill:#f44336,color:white
    style Retry fill:#4CAF50,color:white
```

---

**These diagrams visualize:**
- ✅ Three-layer architecture (Vector + Prompt + ByteRover)
- ✅ Iteration cycle (feedback → learning → improvement)
- ✅ Data flow (hex → parse → table)
- ✅ Pack structure breakdown
- ✅ Upload workflow
- ✅ Demo flow
- ✅ Troubleshooting paths

**Use for:**
- Technical documentation
- Demo slides (via Nano Banana)
- Stakeholder presentations
- Developer onboarding

*Created: December 19, 2025*  
*For: Mattie (by Claudette)*




