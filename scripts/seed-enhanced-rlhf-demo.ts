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

/**
 * Enhanced Demo Data for HITL Showcase
 * 
 * This data demonstrates:
 * 1. Human knowledge curation improving AI responses
 * 2. Before/After examples showing HITL impact
 * 3. Multi-tenant knowledge management
 * 4. Document relevance feedback
 */
const ENHANCED_DEMO_DATA = [
  // Example 1: Curator corrects incorrect information
  {
    session_id: "hitl-demo-correction-1",
    query: "What authentication method does the Beta Base use for multi-tenant access?",
    response: "The Beta Base uses JWT tokens for authentication across all tenants.",
    retrieved_contexts: [
      { 
        doc_id: "auth-overview-v1.md", 
        content_preview: "Authentication is handled via standard JWT implementation...", 
        similarity: 0.82, 
        source_type: "document",
        user_marked_relevant: false
      },
      { 
        doc_id: "cognito-integration.md", 
        content_preview: "AWS Cognito provides multi-tenant authentication with magic links...", 
        similarity: 0.91, 
        source_type: "document",
        user_marked_relevant: true
      }
    ],
    feedback_type: "correction",
    feedback_value: { 
      score: 2,
      correction: "The Beta Base uses AWS Cognito with magic link authentication, not standard JWT. This enables passwordless, secure multi-tenant access with email-based verification codes."
    },
    curator_email: "security-lead@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "beta-base",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 hours ago
  },

  // Example 2: Curator validates excellent response
  {
    session_id: "hitl-demo-validation-2",
    query: "How does the RLHF feedback loop improve retrieval quality over time?",
    response: `The RLHF (Reinforcement Learning from Human Feedback) system in The Beta Base creates a continuous improvement cycle:

1. **Curator Feedback Collection**: Domain experts mark document relevance and provide corrections
2. **Reinforcement Signal**: Positive/negative feedback updates the retrieval_reinforcement table
3. **Embedding Refinement**: The system learns which documents are most valuable for specific query types
4. **Quality Metrics**: Accuracy trends show measurable improvement (currently 96% after curator input)

This creates a "virtuous cycle" where each piece of human feedback makes the entire system smarter for all users in the organization.`,
    retrieved_contexts: [
      { 
        doc_id: "rlhf-architecture.md", 
        content_preview: "The RLHF loop captures explicit curator feedback to update retrieval weights...", 
        similarity: 0.94, 
        source_type: "document",
        user_marked_relevant: true
      },
      { 
        doc_id: "supabase-schema.sql", 
        content_preview: "CREATE TABLE retrieval_reinforcement (feedback_id, doc_id, relevance_score)...", 
        similarity: 0.88, 
        source_type: "code",
        user_marked_relevant: true
      }
    ],
    feedback_type: "rating",
    feedback_value: { score: 5 },
    curator_email: "ai-lead@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "beta-base",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
  },

  // Example 3: Multi-tenant knowledge - AOMA specific
  {
    session_id: "hitl-demo-aoma-arch-3",
    query: "Generate a deployment architecture diagram for AOMA showing the production environment",
    response: `Here's the AOMA production deployment architecture:

\`\`\`mermaid
graph TB
    classDef prod fill:#1a1a1a,stroke:#22c55e,stroke-width:2px,color:white;
    classDef infra fill:#0f172a,stroke:#3b82f6,stroke-width:1px,color:white;
    classDef data fill:#1e1e1e,stroke:#a855f7,stroke-width:2px,color:white;

    subgraph "Production Environment"
        LB[Load Balancer]:::infra
        LB --> App1[AOMA Instance 1]:::prod
        LB --> App2[AOMA Instance 2]:::prod
        
        App1 --> Cache[(Redis Cluster)]:::data
        App2 --> Cache
        
        App1 --> DB[(PostgreSQL Primary)]:::data
        App2 --> DB
        DB --> Replica[(Read Replica)]:::data
    end
    
    subgraph "External Services"
        App1 --> S3[S3 Assets]:::infra
        App2 --> S3
        App1 --> CDN[CloudFront CDN]:::infra
    end
\`\`\`

The production setup uses horizontal scaling with 2+ instances behind a load balancer, Redis for session management, and PostgreSQL with read replicas for database operations.`,
    retrieved_contexts: [
      { 
        doc_id: "aoma-prod-deploy.md", 
        content_preview: "AOMA production uses AWS ECS with auto-scaling groups...", 
        similarity: 0.93, 
        source_type: "document",
        user_marked_relevant: true
      },
      { 
        doc_id: "infra-diagram-2024.png", 
        content_preview: "[Image: Production architecture showing load balancer, app servers, databases]", 
        similarity: 0.87, 
        source_type: "image",
        user_marked_relevant: true
      }
    ],
    feedback_type: "rating",
    feedback_value: { score: 5 },
    curator_email: "devops@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 mins ago
  },

  // Example 4: Curator improves incomplete answer
  {
    session_id: "hitl-demo-enhancement-4",
    query: "What are the key differences between AOMA v2 and v3 migration?",
    response: "AOMA v3 introduces a new API structure and improved performance.",
    retrieved_contexts: [
      { 
        doc_id: "migration-notes-v3.md", 
        content_preview: "Version 3 migration includes API restructuring...", 
        similarity: 0.79, 
        source_type: "document",
        user_marked_relevant: false
      },
      { 
        doc_id: "jira-epic-1247", 
        content_preview: "Epic: AOMA v3 Migration - Multi-tenant architecture overhaul", 
        similarity: 0.85, 
        source_type: "jira",
        user_marked_relevant: true
      }
    ],
    feedback_type: "correction",
    feedback_value: { 
      score: 3,
      correction: "AOMA v3 migration includes: 1) Multi-tenant architecture with org/division isolation, 2) Unified Session Manager (USM) replacing legacy auth, 3) Vector-based search replacing keyword search, 4) Real-time RLHF feedback integration, 5) 53% performance improvement (30s → 14s avg query time). This is a major architectural shift, not just API changes."
    },
    curator_email: "product-owner@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString() // 12 hours ago
  },

  // Example 5: Document relevance feedback (no retrieved docs were helpful)
  {
    session_id: "hitl-demo-no-context-5",
    query: "What is the SLA for AOMA API response times in production?",
    response: "I don't have specific SLA information for AOMA API response times in my current context. I'd recommend checking the production monitoring dashboard or consulting with the DevOps team.",
    retrieved_contexts: [
      { 
        doc_id: "general-sla.md", 
        content_preview: "Standard SLAs for all applications: 99.9% uptime...", 
        similarity: 0.72, 
        source_type: "document",
        user_marked_relevant: false
      },
      { 
        doc_id: "monitoring-setup.md", 
        content_preview: "DataDog monitors all API endpoints with alerting...", 
        similarity: 0.68, 
        source_type: "document",
        user_marked_relevant: false
      }
    ],
    feedback_type: "correction",
    feedback_value: { 
      score: 1,
      correction: "AOMA production SLA: p50 < 200ms, p95 < 500ms, p99 < 1000ms. Current performance exceeds SLA with p95 at 380ms. See DataDog dashboard: aoma-prod-api-metrics."
    },
    curator_email: "sre-team@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "aoma",
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString() // 20 mins ago
  },

  // Example 6: Perfect response - shows system learning
  {
    session_id: "hitl-demo-learned-6",
    query: "How does The Beta Base handle multi-tenant data isolation?",
    response: `The Beta Base implements multi-tenant data isolation through a three-tier approach:

**1. Organization Level**
- Each organization (e.g., "sony-music") has isolated data partitions
- RLS (Row Level Security) policies enforce org-level access control

**2. Division Level**
- Divisions within orgs (e.g., "mso", "columbia-records") have separate namespaces
- Knowledge elements are tagged with org + division for precise filtering

**3. Application Under Test (AUT) Level**
- Each AUT (e.g., "aoma", "ddex-portal") maintains separate vector embeddings
- Prevents knowledge bleed between different applications being tested

This architecture ensures that feedback and knowledge curation for AOMA doesn't affect other applications, while still allowing org-wide insights when needed.`,
    retrieved_contexts: [
      { 
        doc_id: "multi-tenant-architecture.md", 
        content_preview: "The Beta Base uses a three-tier isolation model: organization, division, and application...", 
        similarity: 0.96, 
        source_type: "document",
        user_marked_relevant: true
      },
      { 
        doc_id: "rls-policies.sql", 
        content_preview: "CREATE POLICY org_isolation ON knowledge_elements USING (organization = current_user_org())...", 
        similarity: 0.91, 
        source_type: "code",
        user_marked_relevant: true
      }
    ],
    feedback_type: "rating",
    feedback_value: { score: 5 },
    curator_email: "architect@sonymusic.com",
    organization: "sony-music",
    division: "mso",
    app_under_test: "beta-base",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() // 1 hour ago
  }
];

async function seedEnhancedData() {
  console.log("🌱 Seeding Enhanced HITL Demo Data...\n");

  // Clear existing demo data
  console.log("🧹 Clearing old demo data...");
  const { error: deleteError } = await supabaseAdmin
    .from("rlhf_feedback")
    .delete()
    .ilike("session_id", "hitl-demo-%");

  if (deleteError) {
    console.warn("⚠️  Warning during cleanup:", deleteError.message);
  }

  // Insert new enhanced data
  let successCount = 0;
  let failCount = 0;

  for (const item of ENHANCED_DEMO_DATA) {
    const { error } = await supabaseAdmin.from("rlhf_feedback").insert(item);
    if (error) {
      console.error(`❌ Failed to insert ${item.session_id}:`, error.message);
      failCount++;
    } else {
      console.log(`✅ Inserted ${item.session_id}`);
      console.log(`   Query: "${item.query.substring(0, 60)}..."`);
      console.log(`   Feedback: ${item.feedback_type} (${item.feedback_value?.score || 'N/A'})`);
      console.log("");
      successCount++;
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log(`✨ Seeding complete!`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📊 Total: ${ENHANCED_DEMO_DATA.length}`);
  console.log("=".repeat(60));
  console.log("\n💡 These examples showcase:");
  console.log("   • Human knowledge curation improving AI responses");
  console.log("   • Document relevance feedback");
  console.log("   • Multi-tenant knowledge management");
  console.log("   • Before/After HITL impact");
}

seedEnhancedData();
