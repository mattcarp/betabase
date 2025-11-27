import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing credentials");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DEMO_DATA = [
  {
    session_id: "demo-session-arch-1",
    query: "Generate a system architecture diagram for AOMA showing all integration points",
    response: `Based on the AOMA technical documentation, here is the multi-tenant architecture showing the integration points between the Unified Session Manager, Data Lake, and external providers.

\`\`\`mermaid
flowchart TD
    classDef core fill:#1a1a1a,stroke:#a855f7,stroke-width:2px,color:white;
    classDef ext fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:white;
    classDef db fill:#1e1e1e,stroke:#22c55e,stroke-width:2px,color:white;

    User((User)) -->|Auth| Gateway[API Gateway]:::core
    Gateway -->|Route| USM[Unified Session Manager]:::core
    
    subgraph "AOMA Core"
        USM -->|Orchestrate| Agents[Agent Swarm]:::core
        Agents -->|Query| VectorDB[(Supabase Vector)]:::db
        Agents -->|Cache| Redis[(Redis Cache)]:::db
    end
    
    subgraph "Integrations"
        USM -->|Sync| JIRA[JIRA API]:::ext
        USM -->|Fetch| Git[GitHub API]:::ext
        USM -->|Index| Drive[Google Drive]:::ext
    end
    
    VectorDB -.->|Context| USM
\`\`\`

The architecture uses a hub-and-spoke model where the USM acts as the central orchestrator for AOMA.`,
    retrieved_contexts: [
      { doc_id: "aoma-arch-spec-v2.pdf", content_preview: "The AOMA architecture follows a multi-tenant design...", similarity: 0.95, source_type: "document" },
      { doc_id: "jira-ticket-882", content_preview: "Ticket: Implement USM Gateway routing logic for AOMA...", similarity: 0.88, source_type: "jira" }
    ],
    feedback_type: "rating",
    feedback_value: { score: 5 },
    curator_email: "demo-curator@siam.ai",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
  },
  {
    session_id: "demo-session-rlhf-2",
    query: "How does the Beta Base's RLHF feedback loop improve retrieval quality for AOMA?",
    response: "The RLHF (Reinforcement Learning from Human Feedback) loop in The Beta Base works by capturing explicit curator feedback. This helps the system better understand AOMA-specific terminology and architecture, creating a 'virtuous cycle' of learning.",
    retrieved_contexts: [
      { doc_id: "rlhf-spec.md", content_preview: "The feedback loop updates the retrieval_reinforcement table...", similarity: 0.92, source_type: "document" }
    ],
    feedback_type: "thumbs_up",
    feedback_value: { score: 1 },
    curator_email: "demo-curator@siam.ai",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  },
  {
    session_id: "demo-session-test-3",
    query: "Explain how TestSprite automatically fixed the broken login test in AOMA",
    response: `TestSprite uses a multi-stage agentic workflow to detect and fix broken tests in AOMA automatically.

\`\`\`mermaid
sequenceDiagram
    participant CI as AOMA CI/CD
    participant TS as TestSprite Agent
    participant App as AOMA App
    participant Code as AOMA Repo

    CI->>TS: Report Failure
    TS->>App: Replay Session
    App-->>TS: Capture DOM State
    TS->>TS: Analyze Selector Drift
    TS->>Code: Generate Fix Patch
    Code-->>TS: Verify Fix
    TS->>CI: Commit & Merge
\`\`\`

When the AOMA login test failed, TestSprite captured the DOM state and identified that the submit button ID had changed.`,
    retrieved_contexts: [
      { doc_id: "test-sprite-docs.md", content_preview: "Self-healing tests rely on DOM snapshot comparison...", similarity: 0.89, source_type: "document" }
    ],
    feedback_type: "rating",
    feedback_value: { score: 4 },
    curator_email: "qa-lead@siam.ai",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 mins ago
  },
  {
    session_id: "demo-session-fail-4",
    query: "What is the AOMA API endpoint for user deletion?",
    response: "I'm not sure about the specific endpoint for user deletion in AOMA. It might be DELETE /users/:id but I don't have the specific documentation in my context.",
    retrieved_contexts: [],
    feedback_type: "thumbs_down",
    feedback_value: { score: 0, correction: "The correct endpoint in AOMA is DELETE /api/v1/account/deactivate. User deletion is soft-delete only." },
    curator_email: "security@siam.ai",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
  }
];

async function seedData() {
  console.log("🌱 Seeding Demo Data...");

  // Optional: Clear existing demo data to avoid duplicates if running multiple times
  // await supabaseAdmin.from("rlhf_feedback").delete().ilike("session_id", "demo-session-%");

  for (const item of DEMO_DATA) {
    const { error } = await supabaseAdmin.from("rlhf_feedback").insert(item);
    if (error) {
      console.error(`❌ Failed to insert ${item.session_id}:`, error.message);
    } else {
      console.log(`✅ Inserted ${item.session_id}`);
    }
  }
  
  console.log("✨ Seeding complete!");
}

seedData();
