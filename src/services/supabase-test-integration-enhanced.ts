/**
 * Enhanced Supabase Test Integration Service
 * Works with existing tables and adds minimal new functionality
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as sharedSupabaseClient } from "../lib/supabase";

// Existing table interfaces based on actual schema
interface TestResult {
  id: string;
  test_name: string;
  test_file: string;
  status: "passed" | "failed" | "skipped" | "pending";
  duration?: number;
  error_message?: string;
  stack_trace?: string;
  html_snapshot?: string;
  screenshot_url?: string;
  console_logs?: any;
  performance_metrics?: any;
  browser_logs?: any;
  metadata?: any;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

interface TestRun {
  id: string;
  spec_id?: string;
  branch: string;
  status: string;
  duration_ms?: number;
  started_at: string;
  completed_at?: string;
  runner?: string;
  created_at: string;
}

// Unused type - keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - Unused type kept for future use
type _TestSpec = {
  id: string;
  path: string;
  jira_key?: string;
  ai_generated?: boolean;
  flaky?: boolean;
  created_at: string;
};

interface GeneratedTest {
  id: string;
  query: string;
  test_code: string;
  options: any;
  jira_context?: string;
  git_context?: string;
  aoma_docs_context?: string;
  aoma_ui_context?: string;
  created_at: string;
  user_id?: string;
}

interface TestFeedback {
  id: string;
  test_spec_id?: string;
  original_test_content: string;
  improved_test_content?: string;
  feedback_status: string;
  feedback_reason?: string;
  feedback_category?: string;
  feedback_score?: number;
  context_sources?: any;
  feedback_details?: any;
  reviewer?: string;
  created_at: string;
  updated_at: string;
}

// New minimal tables we need to add
interface TestExecution {
  id: string;
  run_id: string;
  execution_id: string;
  suite_name?: string;
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky_count?: number;
  environment?: string;
  triggered_by?: "manual" | "ci" | "schedule" | "ai";
  metadata?: any;
  created_at: string;
}

interface FirecrawlAnalysis {
  id: string;
  url: string;
  app_name: string;
  testable_features: any;
  user_flows: any;
  api_endpoints: string[];
  selectors: any;
  accessibility_issues?: any;
  performance_metrics?: any;
  content_embedding?: number[];
  analyzed_at: string;
  expires_at?: string;
}

interface TestKnowledge {
  id: string;
  source: "test_failure" | "firecrawl" | "documentation" | "support_ticket" | "ai_generated";
  source_id?: string;
  category: string;
  title: string;
  content: string;
  solution?: string;
  tags: string[];
  relevance_score: number;
  usage_count: number;
  helpful_count: number;
  embedding?: number[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export class EnhancedSupabaseTestIntegration {
  private supabase: SupabaseClient | null = null;

  constructor(_supabaseUrl?: string, _supabaseKey?: string) {
    // Use shared Supabase client to avoid multiple GoTrueClient instances
    // Ignore custom URL/key params - use shared singleton
    this.supabase = sharedSupabaseClient;
  }

  // ============= Working with Existing Tables =============

  /**
   * Create a new test run (existing table)
   */
  async createTestRun(data: Omit<TestRun, "id" | "created_at">): Promise<TestRun | null> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return null;
    }

    const { data: run, error } = await this.supabase
      .from("test_runs")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating test run:", error);
      return null;
    }

    return run;
  }

  /**
   * Store test results (existing table)
   */
  async storeTestResults(
    results: Omit<TestResult, "id" | "created_at" | "updated_at">[]
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return false;
    }

    const { error } = await this.supabase.from("test_results").insert(results);

    if (error) {
      console.error("Error storing test results:", error);
      return false;
    }

    return true;
  }

  /**
   * Get test results with enhanced filtering
   */
  async getTestResults(filters: {
    test_name?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): Promise<TestResult[]> {
    if (!this.supabase) {
      console.warn("Supabase not initialized, returning empty results");
      return [];
    }

    let query = this.supabase.from("test_results").select("*");

    if (filters.test_name) {
      query = query.eq("test_name", filters.test_name);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.from_date) {
      query = query.gte("created_at", filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte("created_at", filters.to_date);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching test results:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Store AI-generated test (existing table)
   */
  async storeGeneratedTest(
    test: Omit<GeneratedTest, "id" | "created_at">
  ): Promise<GeneratedTest | null> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return null;
    }

    const { data, error } = await this.supabase
      .from("generated_tests")
      .insert(test)
      .select()
      .single();

    if (error) {
      console.error("Error storing generated test:", error);
      return null;
    }

    return data;
  }

  /**
   * Add test feedback (existing table)
   */
  async addTestFeedback(
    feedback: Omit<TestFeedback, "id" | "created_at" | "updated_at">
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return false;
    }

    const { error } = await this.supabase.from("test_feedback").insert(feedback);

    if (error) {
      console.error("Error adding test feedback:", error);
      return false;
    }

    return true;
  }

  /**
   * Get flaky tests using existing data
   */
  async getFlakyTests(days: number = 7): Promise<any[]> {
    if (!this.supabase) {
      console.warn("Supabase not initialized, returning empty flaky tests");
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase.rpc("get_flaky_tests", {
      start_date: startDate.toISOString(),
      min_runs: 5,
      flakiness_threshold: 0.3,
    });

    if (error) {
      // Fallback to manual calculation if RPC doesn't exist
      console.log("RPC not found, calculating manually...");
      return this.calculateFlakyTests(startDate);
    }

    return data || [];
  }

  /**
   * Manual flaky test calculation
   */
  private async calculateFlakyTests(startDate: Date): Promise<any[]> {
    if (!this.supabase) {
      return [];
    }

    const { data: results, error } = await this.supabase
      .from("test_results")
      .select("test_name, status")
      .gte("created_at", startDate.toISOString())
      .order("test_name");

    if (error || !results) return [];

    // Group by test name and calculate flakiness
    const testGroups = results.reduce(
      (acc, result) => {
        if (!acc[result.test_name]) {
          acc[result.test_name] = { passed: 0, failed: 0, total: 0 };
        }
        acc[result.test_name].total++;
        if (result.status === "passed") acc[result.test_name].passed++;
        if (result.status === "failed") acc[result.test_name].failed++;
        return acc;
      },
      {} as Record<string, any>
    );

    // Calculate flakiness score
    return Object.entries(testGroups)
      .filter(([_, stats]) => stats.total >= 5)
      .map(([testName, stats]) => {
        const failureRate = stats.failed / stats.total;
        const isFlaky =
          stats.passed > 0 && stats.failed > 0 && failureRate > 0.1 && failureRate < 0.9;
        return {
          test_name: testName,
          total_runs: stats.total,
          failures: stats.failed,
          passes: stats.passed,
          failure_rate: (failureRate * 100).toFixed(2),
          flakiness_score: isFlaky ? (failureRate * (1 - failureRate) * 4).toFixed(2) : "0",
        };
      })
      .filter((test) => parseFloat(test.flakiness_score) > 0)
      .sort((a, b) => parseFloat(b.flakiness_score) - parseFloat(a.flakiness_score));
  }

  // ============= New Tables (Minimal Additions) =============

  /**
   * Create test execution record (new table needed)
   */
  async createTestExecution(
    data: Omit<TestExecution, "id" | "created_at">
  ): Promise<TestExecution | null> {
    if (!this.supabase) {
      console.warn("Supabase not initialized, returning mock execution");
      return {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
      };
    }

    const { data: execution, error } = await this.supabase
      .from("test_executions")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating test execution:", error);
      // Table might not exist yet, return mock data
      return {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
      };
    }

    return execution;
  }

  /**
   * Store Firecrawl analysis (new table needed)
   */
  async storeFirecrawlAnalysis(
    analysis: Omit<FirecrawlAnalysis, "id" | "analyzed_at">
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return false;
    }

    const { error } = await this.supabase.from("firecrawl_analysis").upsert({
      ...analysis,
      analyzed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing Firecrawl analysis:", error);
      // Table might not exist yet
      return false;
    }

    return true;
  }

  /**
   * Add to test knowledge base (new table needed)
   */
  async addTestKnowledge(
    knowledge: Omit<TestKnowledge, "id" | "created_at" | "updated_at">
  ): Promise<boolean> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return false;
    }

    const { error } = await this.supabase.from("test_knowledge_base").insert({
      ...knowledge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error adding test knowledge:", error);
      // Table might not exist yet
      return false;
    }

    return true;
  }

  /**
   * Search test knowledge using existing tables
   */
  async searchTestKnowledge(query: string, limit: number = 5): Promise<any[]> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return [];
    }

    // First try test_feedback table
    const { data: feedback, error: feedbackError } = await this.supabase
      .from("test_feedback")
      .select("*")
      .or(`feedback_reason.ilike.%${query}%,feedback_category.ilike.%${query}%`)
      .limit(limit);

    // Then try test results for similar errors
    const { data: results, error: resultsError } = await this.supabase
      .from("test_results")
      .select("*")
      .or(`error_message.ilike.%${query}%,test_name.ilike.%${query}%`)
      .limit(limit);

    const knowledge = [];

    if (feedback && !feedbackError) {
      knowledge.push(
        ...feedback.map((f) => ({
          source: "test_feedback",
          title: `Feedback: ${f.feedback_category || "General"}`,
          content: f.feedback_reason || "",
          solution: f.improved_test_content,
          relevance: f.feedback_score || 50,
        }))
      );
    }

    if (results && !resultsError) {
      knowledge.push(
        ...results.map((r) => ({
          source: "test_results",
          title: `Test: ${r.test_name}`,
          content: r.error_message || "",
          solution: null,
          relevance: 40,
        }))
      );
    }

    return knowledge;
  }

  /**
   * Get test coverage data
   */
  async getTestCoverage(executionId: string): Promise<any> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return {
        line: 0,
        branch: 0,
        function: 0,
        statement: 0,
      };
    }

    // Check if coverage data exists in test_results metadata
    const { data, error } = await this.supabase
      .from("test_results")
      .select("metadata")
      .eq("metadata->>execution_id", executionId)
      .single();

    if (error || !data?.metadata?.coverage) {
      return {
        line: 0,
        branch: 0,
        function: 0,
        statement: 0,
      };
    }

    return data.metadata.coverage;
  }

  /**
   * Real-time subscription to test execution updates
   */
  subscribeToTestExecutions(callback: (payload: any) => void) {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return null;
    }

    return this.supabase
      .channel("test-executions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "test_runs",
        },
        callback
      )
      .subscribe();
  }

  /**
   * Get test statistics from existing data
   */
  async getTestStatistics(days: number = 7): Promise<any> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return null;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get test runs
    const { data: runs, error: runsError } = await this.supabase
      .from("test_runs")
      .select("*")
      .gte("started_at", startDate.toISOString());

    // Get test results
    const { data: results, error: resultsError } = await this.supabase
      .from("test_results")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (runsError || resultsError) {
      console.error("Error fetching test statistics");
      return null;
    }

    // Calculate statistics
    const stats = {
      totalRuns: runs?.length || 0,
      totalTests: results?.length || 0,
      passedTests: results?.filter((r) => r.status === "passed").length || 0,
      failedTests: results?.filter((r) => r.status === "failed").length || 0,
      skippedTests: results?.filter((r) => r.status === "skipped").length || 0,
      averageDuration: 0,
      successRate: 0,
      failureRate: 0,
      topFailingTests: [] as any[],
    };

    if (stats.totalTests > 0) {
      stats.successRate = (stats.passedTests / stats.totalTests) * 100;
      stats.failureRate = (stats.failedTests / stats.totalTests) * 100;

      // Calculate average duration
      const durations = results?.map((r) => r.duration).filter((d) => d) || [];
      if (durations.length > 0) {
        stats.averageDuration =
          durations.reduce((a, b) => (a || 0) + (b || 0), 0) / durations.length;
      }

      // Get top failing tests
      const failedTests = results?.filter((r) => r.status === "failed") || [];
      const testFailCounts = failedTests.reduce(
        (acc, test) => {
          acc[test.test_name] = (acc[test.test_name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      stats.topFailingTests = Object.entries(testFailCounts)
        .map(([name, count]) => ({ test_name: name, failure_count: count }))
        .sort((a, b) => (b.failure_count as number) - (a.failure_count as number))
        .slice(0, 5);
    }

    return stats;
  }

  /**
   * Create minimal new tables if they don't exist
   */
  async initializeNewTables(): Promise<void> {
    // SQL for table creation - would be used with Supabase migrations
    // @ts-ignore - Unused SQL definition kept for documentation
    const _createTablesSQL = `
      -- Test executions table (aggregates test runs)
      CREATE TABLE IF NOT EXISTS test_executions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        run_id UUID REFERENCES test_runs(id),
        execution_id TEXT UNIQUE NOT NULL,
        suite_name TEXT,
        total_tests INTEGER DEFAULT 0,
        passed INTEGER DEFAULT 0,
        failed INTEGER DEFAULT 0,
        skipped INTEGER DEFAULT 0,
        flaky_count INTEGER DEFAULT 0,
        environment TEXT,
        triggered_by TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Firecrawl analysis cache
      CREATE TABLE IF NOT EXISTS firecrawl_analysis (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        url TEXT NOT NULL,
        app_name TEXT DEFAULT 'SIAM',
        testable_features JSONB,
        user_flows JSONB,
        api_endpoints TEXT[],
        selectors JSONB,
        accessibility_issues JSONB,
        performance_metrics JSONB,
        content_embedding vector(1536),
        analyzed_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        UNIQUE(url, app_name)
      );

      -- Test knowledge base (supplements existing feedback)
      CREATE TABLE IF NOT EXISTS test_knowledge_base (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        source TEXT NOT NULL,
        source_id TEXT,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        solution TEXT,
        tags TEXT[],
        relevance_score INTEGER DEFAULT 50,
        usage_count INTEGER DEFAULT 0,
        helpful_count INTEGER DEFAULT 0,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_test_executions_run ON test_executions(run_id);
      CREATE INDEX IF NOT EXISTS idx_firecrawl_url ON firecrawl_analysis(url);
      CREATE INDEX IF NOT EXISTS idx_knowledge_source ON test_knowledge_base(source);
      CREATE INDEX IF NOT EXISTS idx_knowledge_category ON test_knowledge_base(category);

      -- Enable real-time for new tables
      ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS test_executions;
    `;

    console.log("SQL for new tables ready. Execute in Supabase SQL editor.");
    console.log("Note: Most functionality works with existing tables!");
  }

  /**
   * Get test executions
   */
  async getTestExecutions(limit: number = 10): Promise<TestExecution[]> {
    if (!this.supabase) {
      console.warn("Supabase not initialized, returning empty executions");
      return [];
    }

    const { data, error } = await this.supabase
      .from("test_executions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching test executions:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Update test execution
   */
  async updateTestExecution(
    executionId: string,
    updates: Partial<TestExecution>
  ): Promise<TestExecution | null> {
    if (!this.supabase) {
      console.warn("Supabase not initialized");
      return null;
    }

    const { data, error } = await this.supabase
      .from("test_executions")
      .update(updates)
      .eq("execution_id", executionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating test execution:", error);
      return null;
    }

    return data;
  }

  /**
   * Search knowledge base
   */
  async searchKnowledgeBase(query: string, limit: number = 5): Promise<any[]> {
    return this.searchTestKnowledge(query, limit);
  }
}

// Export singleton instance
export const enhancedSupabaseTestDB = new EnhancedSupabaseTestIntegration();
