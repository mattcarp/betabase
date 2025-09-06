/**
 * Supabase Test Integration Service
 * Connects Test Dashboard with shared knowledge base for:
 * - Test results persistence
 * - Knowledge sharing between QA and support
 * - Vector embeddings for intelligent search
 * - Cross-team collaboration
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
interface TestExecution {
  id: string;
  execution_id: string;
  suite_name: string;
  status: "running" | "completed" | "failed" | "cancelled";
  total_tests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  started_at: string;
  completed_at?: string;
  metadata?: any;
}

interface TestResult {
  id: string;
  execution_id: string;
  test_name: string;
  suite_name: string;
  status: "passed" | "failed" | "skipped";
  duration_ms: number;
  error_message?: string;
  error_stack?: string;
  screenshots?: string[];
  logs?: string[];
  created_at: string;
}

interface TestableFeature {
  id: string;
  app_name: string;
  feature_name: string;
  description: string;
  test_priority: "high" | "medium" | "low";
  test_types: string[];
  selectors?: string[];
  created_at: string;
  updated_at: string;
}

interface TestPattern {
  id: string;
  pattern_name: string;
  description: string;
  example_code: string;
  use_cases: string[];
  tags: string[];
  created_at: string;
}

interface SupportKnowledge {
  id: string;
  app_name: string;
  category: string;
  title: string;
  content: string;
  relevance_score: number;
  source: "firecrawl" | "test_results" | "manual" | "ai_generated";
  tags: string[];
  embedding?: number[]; // Vector embedding for similarity search
  created_at: string;
}

export class SupabaseTestIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    this.supabase = createClient(url, key);
  }

  /**
   * Store test execution record
   */
  async createTestExecution(
    data: Omit<TestExecution, "id">,
  ): Promise<TestExecution | null> {
    const { data: execution, error } = await this.supabase
      .from("test_executions")
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error("Error creating test execution:", error);
      return null;
    }

    return execution;
  }

  /**
   * Update test execution status
   */
  async updateTestExecution(
    executionId: string,
    updates: Partial<TestExecution>,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("test_executions")
      .update(updates)
      .eq("execution_id", executionId);

    if (error) {
      console.error("Error updating test execution:", error);
      return false;
    }

    return true;
  }

  /**
   * Store test results
   */
  async storeTestResults(results: Omit<TestResult, "id">[]): Promise<boolean> {
    const { error } = await this.supabase.from("test_results").insert(results);

    if (error) {
      console.error("Error storing test results:", error);
      return false;
    }

    return true;
  }

  /**
   * Get test results for an execution
   */
  async getTestResults(executionId: string): Promise<TestResult[]> {
    const { data, error } = await this.supabase
      .from("test_results")
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching test results:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Store testable features discovered by Firecrawl
   */
  async storeTestableFeatures(
    features: Omit<TestableFeature, "id" | "created_at" | "updated_at">[],
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("testable_features")
      .upsert(features, {
        onConflict: "app_name,feature_name",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error storing testable features:", error);
      return false;
    }

    return true;
  }

  /**
   * Get testable features for an app
   */
  async getTestableFeatures(
    appName: string = "SIAM",
  ): Promise<TestableFeature[]> {
    const { data, error } = await this.supabase
      .from("testable_features")
      .select("*")
      .eq("app_name", appName)
      .order("test_priority", { ascending: true });

    if (error) {
      console.error("Error fetching testable features:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Store test patterns
   */
  async storeTestPatterns(
    patterns: Omit<TestPattern, "id" | "created_at">[],
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("test_patterns")
      .insert(patterns);

    if (error) {
      console.error("Error storing test patterns:", error);
      return false;
    }

    return true;
  }

  /**
   * Search test patterns by tags or keywords
   */
  async searchTestPatterns(query: string): Promise<TestPattern[]> {
    const { data, error } = await this.supabase
      .from("test_patterns")
      .select("*")
      .or(
        `pattern_name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`,
      )
      .limit(10);

    if (error) {
      console.error("Error searching test patterns:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Store knowledge for customer support
   */
  async storeSupportKnowledge(
    knowledge: Omit<SupportKnowledge, "id" | "created_at">,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("support_knowledge")
      .insert(knowledge);

    if (error) {
      console.error("Error storing support knowledge:", error);
      return false;
    }

    return true;
  }

  /**
   * Search support knowledge using vector similarity
   */
  async searchSupportKnowledge(
    query: string,
    limit: number = 5,
  ): Promise<SupportKnowledge[]> {
    // This would use vector similarity search if embeddings are configured
    // For now, using text search
    const { data, error } = await this.supabase
      .from("support_knowledge")
      .select("*")
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`,
      )
      .order("relevance_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error searching support knowledge:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get test execution history
   */
  async getExecutionHistory(limit: number = 10): Promise<TestExecution[]> {
    const { data, error } = await this.supabase
      .from("test_executions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching execution history:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Get test statistics
   */
  async getTestStatistics(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from("test_executions")
      .select("*")
      .gte("started_at", startDate.toISOString());

    if (error) {
      console.error("Error fetching test statistics:", error);
      return null;
    }

    // Calculate statistics
    const stats = {
      totalExecutions: data?.length || 0,
      successRate: 0,
      averageDuration: 0,
      failureRate: 0,
      flakyTests: [],
    };

    if (data && data.length > 0) {
      const successful = data.filter((e) => e.status === "completed");
      stats.successRate = (successful.length / data.length) * 100;

      const totalDuration = data.reduce(
        (sum, e) => sum + (e.duration_ms || 0),
        0,
      );
      stats.averageDuration = totalDuration / data.length;

      const failed = data.filter((e) => e.status === "failed");
      stats.failureRate = (failed.length / data.length) * 100;
    }

    return stats;
  }

  /**
   * Sync test insights to support knowledge base
   */
  async syncTestInsightsToKnowledge(executionId: string): Promise<boolean> {
    try {
      // Get test results
      const results = await this.getTestResults(executionId);

      // Extract failed tests for knowledge base
      const failedTests = results.filter((r) => r.status === "failed");

      for (const test of failedTests) {
        const knowledge: Omit<SupportKnowledge, "id" | "created_at"> = {
          app_name: "SIAM",
          category: "test_failure",
          title: `Test Failure: ${test.test_name}`,
          content: `Test ${test.test_name} in suite ${test.suite_name} failed with error: ${test.error_message}. This may indicate an issue with the feature or test implementation.`,
          relevance_score: 75,
          source: "test_results",
          tags: ["test_failure", test.suite_name, "qa_insight"],
        };

        await this.storeSupportKnowledge(knowledge);
      }

      return true;
    } catch (error) {
      console.error("Error syncing test insights:", error);
      return false;
    }
  }

  /**
   * Create database tables if they don't exist
   */
  async initializeTables(): Promise<void> {
    // SQL to create tables if needed
    const createTablesSQL = `
      -- Test executions table
      CREATE TABLE IF NOT EXISTS test_executions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        execution_id TEXT UNIQUE NOT NULL,
        suite_name TEXT,
        status TEXT NOT NULL,
        total_tests INTEGER,
        passed INTEGER,
        failed INTEGER,
        skipped INTEGER,
        duration_ms INTEGER,
        started_at TIMESTAMPTZ NOT NULL,
        completed_at TIMESTAMPTZ,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Test results table
      CREATE TABLE IF NOT EXISTS test_results (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        execution_id TEXT REFERENCES test_executions(execution_id),
        test_name TEXT NOT NULL,
        suite_name TEXT,
        status TEXT NOT NULL,
        duration_ms INTEGER,
        error_message TEXT,
        error_stack TEXT,
        screenshots TEXT[],
        logs TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Testable features table
      CREATE TABLE IF NOT EXISTS testable_features (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        app_name TEXT NOT NULL,
        feature_name TEXT NOT NULL,
        description TEXT,
        test_priority TEXT,
        test_types TEXT[],
        selectors TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(app_name, feature_name)
      );

      -- Test patterns table
      CREATE TABLE IF NOT EXISTS test_patterns (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        pattern_name TEXT NOT NULL,
        description TEXT,
        example_code TEXT,
        use_cases TEXT[],
        tags TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Support knowledge table
      CREATE TABLE IF NOT EXISTS support_knowledge (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        app_name TEXT NOT NULL,
        category TEXT,
        title TEXT NOT NULL,
        content TEXT,
        relevance_score INTEGER,
        source TEXT,
        tags TEXT[],
        embedding vector(1536), -- For OpenAI embeddings
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
      CREATE INDEX IF NOT EXISTS idx_test_results_execution ON test_results(execution_id);
      CREATE INDEX IF NOT EXISTS idx_testable_features_app ON testable_features(app_name);
      CREATE INDEX IF NOT EXISTS idx_support_knowledge_app ON support_knowledge(app_name);
    `;

    console.log("Initializing Supabase tables for Test Dashboard...");
    // Note: This would need to be run through Supabase SQL editor or migration
  }
}

// Export singleton instance
export const supabaseTestDB = new SupabaseTestIntegration();
