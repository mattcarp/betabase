# 📊 Test Intelligence Integration Guide

## Overview

The SIAM Test Dashboard now includes a fully integrated **Unified Test Intelligence System** that combines Firecrawl analysis, Supabase knowledge storage, and AOMA business intelligence to create a comprehensive testing ecosystem.

## 🏗️ Architecture

```mermaid
graph LR
    A[Test Dashboard UI] --> B[/api/test-intelligence]
    B --> C[Unified Test Intelligence Service]
    B --> D[Support Chat Intelligence]

    C --> E[Firecrawl API]
    C --> F[Supabase]
    C --> G[AOMA Mesh MCP]

    D --> F
    D --> G

    E -->|Analyzes| H[AUT/AOMA]
    F -->|Stores| I[Test Knowledge]
    G -->|Provides| J[Business Context]
```

## 🔑 Configuration

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# Firecrawl - For AUT analysis
FIRECRAWL_API_KEY=fc-your-api-key-here

# Supabase - For knowledge storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AOMA Mesh - For business intelligence
NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://your-lambda-url.amazonaws.com
```

## 📁 File Structure

```
src/
├── services/
│   ├── unified-test-intelligence.ts    # Main intelligence orchestrator
│   ├── support-chat-intelligence.ts    # Support Q&A system
│   ├── firecrawl-integration.ts       # Firecrawl API wrapper
│   └── supabase-test-integration-enhanced.ts # Supabase operations
│
├── components/test-dashboard/
│   └── FirecrawlPanel.tsx             # UI component (updated)
│
app/api/
└── test-intelligence/
    └── route.ts                        # REST API endpoint
```

## 🚀 Features

### 1. Application Under Test (AUT) Analysis

The system can analyze any web application to extract:

- **Testable Features**: Identified UI components and functionality
- **User Flows**: Critical paths through the application
- **API Endpoints**: Discovered API routes
- **Knowledge Base**: Domain-specific information

### 2. Test Failure Intelligence

When tests fail, the system:

1. Extracts error patterns
2. Queries AOMA for solutions
3. Stores the solution in knowledge base
4. Makes it searchable for future issues

### 3. Support Chat Intelligence

Answers support questions by:

1. Searching test failure knowledge
2. Querying AOMA documentation
3. Providing confidence scores
4. Learning from feedback

### 4. Test Generation

Automatically generates test recommendations based on:

- Common support issues
- Identified test gaps
- User flow analysis
- API endpoint coverage

## 📡 API Endpoints

### POST /api/test-intelligence

Available actions:

#### `analyze-aut`

Analyze an application for testing opportunities.

```javascript
fetch("/api/test-intelligence", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "analyze-aut",
    params: {
      url: "https://aoma-stage.smcdp-de.net",
    },
  }),
});
```

#### `process-failure`

Convert a test failure into searchable knowledge.

```javascript
fetch("/api/test-intelligence", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "process-failure",
    params: {
      testResult: {
        test_name: "Login Test",
        error_message: "Element not found",
        test_file: "auth.spec.ts",
      },
    },
  }),
});
```

#### `support-query`

Answer a support question using test knowledge.

```javascript
fetch("/api/test-intelligence", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "support-query",
    params: {
      question: "How do I upload assets to AOMA?",
    },
  }),
});
```

#### `generate-tests`

Generate test recommendations from support issues.

```javascript
fetch("/api/test-intelligence", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "generate-tests",
  }),
});
```

## 🎯 UI Integration

### Firecrawl Panel

The Firecrawl panel in the Test Dashboard provides:

1. **AUT Analysis** - Analyze any application URL
2. **Feature Discovery** - View testable features with priority
3. **User Flow Mapping** - See critical paths through the app
4. **API Discovery** - List of discovered endpoints
5. **Knowledge Extraction** - Domain-specific information

### Support Intelligence

- **Q&A Interface** - Ask questions about AOMA
- **Confidence Scoring** - See how confident the answer is
- **Source Attribution** - Know where answers come from
- **Common Issues** - View frequently encountered problems

## 💾 Database Schema

### Tables Created

#### `firecrawl_analysis`

Stores cached AUT analysis results with vector embeddings.

```sql
CREATE TABLE firecrawl_analysis (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,
    app_name TEXT,
    testable_features JSONB,
    user_flows JSONB,
    api_endpoints TEXT[],
    content_embedding vector(1536),
    analyzed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);
```

#### `test_knowledge_base`

Shared knowledge between QA and Support teams.

```sql
CREATE TABLE test_knowledge_base (
    id UUID PRIMARY KEY,
    source TEXT,  -- 'test_failure', 'firecrawl', 'documentation', etc.
    category TEXT,
    title TEXT,
    content TEXT,
    solution TEXT,
    tags TEXT[],
    relevance_score INTEGER,
    embedding vector(1536),
    created_at TIMESTAMPTZ
);
```

## 🔄 Data Flow

1. **User triggers AUT analysis** → FirecrawlPanel UI
2. **UI calls API** → `/api/test-intelligence`
3. **API orchestrates services**:
   - Firecrawl analyzes the application
   - Results stored in Supabase
   - Knowledge extracted and vectorized
4. **Results displayed** in Test Dashboard
5. **Support queries** search the knowledge base
6. **Test failures** add to knowledge base
7. **Continuous improvement** through feedback

## 📊 Monitoring

Check system health:

```javascript
fetch('/api/test-intelligence')
  .then(res => res.json())
  .then(data => console.log(data.configuration));

// Returns:
{
  firecrawl: true,  // API key configured
  supabase: true,   // Database connected
  aoma: true        // AOMA Mesh available
}
```

## 🧪 Testing

Run the test suite:

```bash
# Simple health check
node test-intelligence.js

# Full integration test
npx tsx test-unified-intelligence.ts
```

## 🚨 Troubleshooting

### Firecrawl not working

- Check API key is valid
- Verify you have credits remaining
- System falls back to mock data automatically

### Supabase connection issues

- Verify credentials in `.env.local`
- Check network connectivity
- Ensure tables are created (run migration)

### AOMA Mesh timeout

- Check Lambda endpoint is accessible
- Verify network/CORS settings
- System provides fallback responses

## 🎉 Benefits

1. **Automated Test Discovery** - Find what needs testing
2. **Self-Healing Tests** - Solutions for failures
3. **Intelligent Support** - Answer questions from test data
4. **Continuous Learning** - Improves with every interaction
5. **Cross-Functional** - QA and Support share knowledge

## 📚 Additional Resources

- [Firecrawl Documentation](https://firecrawl.dev/docs)
- [Supabase Vector Search](https://supabase.com/docs/guides/ai/vector-embeddings)
- [AOMA Mesh MCP Guide](../aoma-mesh-mcp/README.md)

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready
**Maintainer**: Test Dashboard Team
