# SOTA 2025 Web Testing Architecture for Third-Party Apps (AUTs)

## Executive Summary

This document outlines a state-of-the-art testing architecture for SIAM's Test Dashboard to test third-party web applications (Application Under Test - AUT), starting with AOMA and expanding to multiple enterprise applications.

**Current Date**: September 2025

## 🚨 CRITICAL FINDINGS

### 1. Database Multi-Tenancy Status: ✅ ALREADY IMPLEMENTED

Your database **already has multi-tenant capabilities** using an elegant design:

- **`app_name` field** serves as the tenant identifier
- **UNIQUE constraint on `(url, app_name)`** allows testing same URLs for different apps
- **Default to 'SIAM'** but supports any application (AOMA, etc.)
- **Already in production** - currently testing both SIAM and AOMA

### 2. Current Testing Capabilities Already in Place

Your existing infrastructure already includes:

- **Firecrawl Integration** - Web scraping and analysis (MCP configured)
- **TestSprite** - AI test generation (MCP configured)
- **Playwright** - Browser automation (MCP configured)
- **Browserbase** - Cloud browser infrastructure (MCP configured)
- **Multi-app support** - SIAM and AOMA already configured
- **Vector embeddings** - Supabase pgvector for similarity search
- **Knowledge sharing** - Test failures automatically become support knowledge

### 3. SOTA Testing Capabilities in 2025

Based on industry research, the cutting-edge features for September 2025 include:

#### **Agentic AI Testing** (The Big Shift)

- **Autonomous test agents** that plan, execute, and adapt without human intervention
- AI agents using GPT-5/Claude 3.5+ for intelligent test generation
- Self-healing tests that adapt to UI changes automatically
- 81% of teams now using AI in testing workflows (up from <20% in 2023)

#### **HITL (Human-In-The-Loop) Integration**

- Strategic human checkpoints for critical decisions
- Expert review workflows for complex scenarios
- Manager approval dashboards with real-time metrics
- Crowd-sourced validation for edge cases

## 📊 Recommended Architecture Enhancements

### Leverage Existing Multi-Tenant Design

Your current `app_name` based multi-tenancy is elegant and working. Here's how to enhance it:

```sql
-- Current working schema (KEEP THIS!)
CREATE TABLE firecrawl_analysis (
    url TEXT NOT NULL,
    app_name TEXT DEFAULT 'SIAM',  -- Your tenant identifier
    -- ... other fields
    UNIQUE(url, app_name)  -- Allows same URL for different apps
);

-- ENHANCEMENT: Add applications registry for better management
CREATE TABLE IF NOT EXISTS applications_registry (
    app_name TEXT PRIMARY KEY,  -- Links to existing app_name field
    display_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    environments JSONB DEFAULT '{"staging": "", "production": ""}',
    auth_config JSONB,  -- Encrypted auth details per app
    test_user_pools JSONB,  -- Test users per app
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing apps
INSERT INTO applications_registry (app_name, display_name, base_url) VALUES
    ('SIAM', 'SIAM Test Dashboard', 'https://thebetabase.com'),
    ('AOMA', 'AOMA Enterprise', 'https://aoma-stage.smcdp-de.net')
ON CONFLICT DO NOTHING;

-- ENHANCEMENT: Add app_name to tables that need it
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'SIAM';
ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'SIAM';
ALTER TABLE test_executions ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'SIAM';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_results_app ON test_results(app_name);
CREATE INDEX IF NOT EXISTS idx_test_runs_app ON test_runs(app_name);

-- RLS policies per app (optional but recommended)
CREATE POLICY "App isolation for test_results" ON test_results
    USING (app_name = current_setting('app.current_app', true));
```

### Testing Architecture Components

```typescript
// 1. Agentic Test Orchestrator
interface AgenticTestOrchestrator {
  // Autonomous test planning
  planTestStrategy(app: AUT): TestStrategy;

  // Self-healing capability
  detectUIChanges(previousRun: TestRun): UIChange[];
  adaptTestsToChanges(changes: UIChange[]): UpdatedTests;

  // Intelligent test selection
  selectTestsBasedOnRisk(codeChanges: Diff[]): Test[];

  // Continuous learning
  learnFromFailures(failures: TestFailure[]): ImprovedStrategy;
}

// 2. HITL Integration Points
interface HITLWorkflow {
  // Manager approval gates
  requestApproval(testPlan: TestPlan): ApprovalRequest;

  // Expert review triggers
  escalateComplexFailure(failure: TestFailure): ExpertReview;

  // Crowd validation
  distributeForValidation(test: Test): CrowdTask;
}

// 3. Multi-App Test Isolation (Leveraging app_name)
interface TestIsolation {
  // Browser profile per app
  createIsolatedBrowser(appName: string): BrowserContext;

  // Separate test data per app
  getTestData(appName: string): TestData;

  // Independent test queues per app
  queueTests(appName: string, tests: Test[]): Queue;

  // App-specific configuration
  getAppConfig(appName: string): ApplicationConfig;
}
```

## 🎨 EvilCharts Integration for Manager Dashboards

EvilCharts provides beautiful, animated charts perfect for executive dashboards:

### Installation

```bash
# Add EvilCharts components
npx shadcn@latest add https://evilcharts.com/chart/default-bar-chart.json
npx shadcn@latest add https://evilcharts.com/chart/animated-area-chart.json
npx shadcn@latest add https://evilcharts.com/chart/radar-chart.json
```

### Key Visualizations for Managers

```typescript
// Test execution trends
<AnimatedAreaChart
  data={testExecutionTrends}
  title="Test Coverage Over Time"
  gradient={true}
/>

// Pass/fail distribution
<InteractivePieChart
  data={passFailRates}
  title="Test Success Rate by Application"
/>

// Flakiness radar
<RadarChart
  data={flakinessMetrics}
  title="Test Stability Across Apps"
/>

// Cost/ROI analysis
<MultipleBarChart
  data={costSavingsData}
  title="Automated Testing ROI"
/>
```

## 🚀 Implementation Roadmap

### Phase 1: Enhance Multi-Tenant Foundation (Week 1)

1. ✅ Multi-tenancy already exists via `app_name`
2. Add applications_registry table for better management
3. Extend `app_name` to remaining tables
4. Create app switcher UI component
5. Add per-app configuration management

### Phase 2: AI Agent Integration (Week 3-4)

1. Integrate with AI providers (OpenAI, Anthropic)
2. Implement self-healing test logic
3. Build autonomous test planner
4. Add intelligent failure analysis

### Phase 3: HITL Workflows (Week 5-6)

1. Manager approval dashboard with EvilCharts
2. Expert review queue system
3. Escalation workflows
4. Feedback loops to AI

### Phase 4: Advanced Features (Week 7-8)

1. Cross-browser testing at scale
2. Visual regression with AI
3. Performance testing integration
4. Accessibility automation

## 🔧 Technology Stack

### Core Testing

- **Playwright** - Primary automation framework
- **TestSprite** - AI test generation (you have MCP)
- **Firecrawl** - Web scraping and analysis (you have MCP)
- **Browserbase** - Cloud browser infrastructure (you have MCP)

### AI/ML

- **OpenAI GPT-4/5** - Test generation and analysis
- **Claude 3.5** - Complex reasoning and debugging
- **Vector embeddings** - Similar failure detection
- **Supabase pgvector** - Vector storage (already configured)

### Visualization

- **EvilCharts** - Executive dashboards
- **shadcn/ui** - Component library (already using)
- **Recharts** - Base charting library

### Infrastructure

- **Supabase** - Database and real-time
- **Render.com** - Deployment
- **GitHub Actions** - CI/CD

## 📈 Expected Outcomes

### Metrics to Track

- **Test creation time**: 90% reduction with AI
- **Maintenance effort**: 75% reduction with self-healing
- **Test coverage**: 40% increase with intelligent generation
- **False positives**: 60% reduction with AI analysis
- **Time to feedback**: 80% faster with parallel execution

### ROI Calculation

```typescript
const roi = {
  manualTestingCost: 100_000, // per month
  automatedTestingCost: 25_000, // including AI costs
  savings: 75_000, // per month
  paybackPeriod: "1.5 months",
};
```

## 🎯 Managing Multiple AUTs (Applications Under Test)

### Current Setup

- **SIAM** - Your own app (default)
- **AOMA** - Enterprise app (already configured)

### Adding New AUTs

```typescript
// Simple function to add new app to test
async function registerNewAUT(appName: string, config: AppConfig) {
  // 1. Add to applications_registry
  await supabase.from("applications_registry").insert({
    app_name: appName,
    display_name: config.displayName,
    base_url: config.baseUrl,
    auth_config: config.auth,
    test_user_pools: config.testUsers,
  });

  // 2. Run initial Firecrawl analysis
  await firecrawlService.analyzeAUT(config.baseUrl, appName);

  // 3. Generate initial test suite
  await testSprite.generateTests(appName);
}

// Example: Add a new app
await registerNewAUT("SPOTIFY_ENTERPRISE", {
  displayName: "Spotify for Enterprise",
  baseUrl: "https://enterprise.spotify.com",
  auth: { type: "oauth", clientId: "..." },
  testUsers: [{ email: "test@spotify.com", role: "admin" }],
});
```

### Test Execution Per App

```typescript
// Run tests for specific app
await testRunner.execute({
  app_name: "AOMA", // Specify which app
  suite: "smoke",
  parallel: true,
});

// Query results by app
const aomaResults = await supabase
  .from("test_results")
  .select("*")
  .eq("app_name", "AOMA")
  .order("created_at", { ascending: false });
```

## 🎯 Next Steps

1. **Immediate Action**: ✅ Multi-tenant already works! Just add applications_registry table
2. **Quick Win**: Integrate EvilCharts for multi-app visualization dashboards
3. **Expand Testing**: Add 2-3 more enterprise apps (using existing app_name pattern)
4. **AI Enhancement**: Implement agentic testing with your existing AI MCPs

## 📚 References

- Agentic AI Testing (QualiZeal, 2025)
- AI Testing Adoption Survey (TestGuild, 2025)
- Open-Source AI Testing Frameworks Review (Medium, 2025)
- EvilCharts Documentation (https://evilcharts.com)
- shadcn/ui Charts (https://ui.shadcn.com/charts)

---

**Document Version**: 1.0
**Last Updated**: September 2025
**Author**: SIAM Test Architecture Team
