/**
 * Unified Test Intelligence Service
 * Orchestrates Firecrawl, Playwright results, and AOMA knowledge
 * for comprehensive test generation and support intelligence
 */

import { firecrawlService } from "./firecrawl-integration";
import { EnhancedSupabaseTestIntegration } from "./supabase-test-integration-enhanced";
import { aomaOrchestrator } from "./aomaOrchestrator";
import { aomaCache } from "./aomaCache";

interface TestableFeature {
  name: string;
  description: string;
  testPriority: "high" | "medium" | "low";
  testTypes: string[];
  selectors?: string[];
}

interface TestRecommendation {
  title: string;
  description: string;
  priority: number;
  category: string;
  suggestedTests: string[];
}

interface KnowledgeEntry {
  source: "test_failure" | "firecrawl" | "documentation" | "support_ticket" | "ai_generated";
  source_id?: string;
  category: string;
  title: string;
  content: string;
  solution?: string;
  tags: string[];
  relevance_score: number;
  helpful_count?: number;
}

export class UnifiedTestIntelligence {
  private supabaseIntegration: EnhancedSupabaseTestIntegration;
  private readonly AOMA_STAGING_URL = "https://aoma-stage.smcdp-de.net";

  constructor() {
    // Use Supabase credentials from aoma-mesh-mcp .env
    this.supabaseIntegration = new EnhancedSupabaseTestIntegration(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kfxetwuuzljhybfgmpuc.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Gather test intelligence from AUT analysis
   */
  async gatherAUTIntelligence(appUrl: string = this.AOMA_STAGING_URL) {
    try {
      console.log(`🔍 Gathering intelligence from ${appUrl}...`);

      // Check if we have a recent analysis cached
      const cachedAnalysis = await this.getCachedAnalysis(appUrl);
      if (cachedAnalysis) {
        console.log("✅ Using cached analysis (less than 7 days old)");
        return cachedAnalysis;
      }

      // Only use Firecrawl if we have an API key
      const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      if (!firecrawlApiKey || firecrawlApiKey.includes("YOUR_")) {
        console.log("⚠️ Firecrawl API key not configured, using mock data");
        return this.getMockAUTAnalysis(appUrl);
      }

      // 1. Crawl the application with Firecrawl
      const analysis = await firecrawlService.analyzeAUT(appUrl);

      // 2. Store in Supabase for future use
      await this.supabaseIntegration.storeFirecrawlAnalysis({
        url: appUrl,
        app_name: "AOMA",
        testable_features: analysis.testableFeatures,
        user_flows: analysis.userFlows,
        api_endpoints: analysis.apiEndpoints,
        analyzed_at: new Date().toISOString(),
      });

      // 3. Convert to test knowledge
      const knowledge: KnowledgeEntry[] = analysis.knowledgeExtracted.map((k) => ({
        source: "firecrawl" as const,
        category: k.category,
        title: `AOMA Feature: ${k.category}`,
        content: k.content,
        relevance_score: k.relevance,
        tags: ["aoma", "aut", k.category.toLowerCase()],
        helpful_count: 0,
      }));

      await this.storeTestKnowledge(knowledge);

      console.log(
        `✅ Gathered intelligence: ${analysis.testableFeatures.length} features, ${analysis.userFlows.length} flows`
      );
      return analysis;
    } catch (error) {
      console.error("❌ Error gathering AUT intelligence:", error);
      // Return mock data as fallback
      return this.getMockAUTAnalysis(appUrl);
    }
  }

  /**
   * Process test failures into knowledge
   */
  async processTestFailure(testResult: any) {
    try {
      console.log(`🔬 Processing test failure: ${testResult.test_name}`);

      // Extract error patterns
      const errorPattern = this.extractErrorPattern(testResult.error_message);

      // Query AOMA for known solutions with cache
      const cacheKey = `test_error_${errorPattern}`;
      let aomaResponse = aomaCache.get(cacheKey, "rapid");

      if (!aomaResponse) {
        const orchestratorResponse = await aomaOrchestrator.orchestrateQuery(
          `How to fix test error in AOMA: ${errorPattern}. Provide specific steps.`,
          { strategy: "focused" }
        );
        aomaResponse = orchestratorResponse.response;
        aomaCache.set(cacheKey, aomaResponse, "focused");
      }

      // Store as knowledge
      const knowledge: KnowledgeEntry = {
        source: "test_failure",
        source_id: testResult.id,
        category: "error_solution",
        title: `Fix for: ${testResult.test_name}`,
        content: testResult.error_message,
        solution: aomaResponse || "Check logs for detailed error information",
        tags: ["test_failure", testResult.test_file || "unknown", errorPattern],
        relevance_score: 85,
      };

      await this.storeTestKnowledge([knowledge]);

      console.log(`✅ Processed test failure and stored solution`);
      return knowledge;
    } catch (error) {
      console.error("❌ Error processing test failure:", error);
      throw error;
    }
  }

  /**
   * Generate test recommendations based on support tickets
   */
  async generateTestsFromSupport() {
    try {
      console.log("🎯 Generating test recommendations from support issues...");

      // Query support issues with cache
      const cacheKey = "aoma_support_issues";
      let supportIssues = aomaCache.get(cacheKey, "comprehensive");

      if (!supportIssues) {
        const response = await aomaOrchestrator.orchestrateQuery(
          "What are the most common AOMA support issues? List specific features that users struggle with.",
          { strategy: "comprehensive" }
        );
        supportIssues = response.response;
        aomaCache.set(cacheKey, supportIssues, "comprehensive");
      }

      // Generate test recommendations
      const testRecommendations = this.analyzeForTestGaps(supportIssues);

      // Store recommendations
      const knowledge: KnowledgeEntry[] = testRecommendations.map((rec) => ({
        source: "support_ticket" as const,
        category: "test_recommendation",
        title: rec.title,
        content: rec.description,
        tags: ["support_driven", "recommended", rec.category],
        relevance_score: rec.priority,
        helpful_count: 0,
      }));

      await this.storeTestKnowledge(knowledge);

      console.log(`✅ Generated ${testRecommendations.length} test recommendations`);
      return testRecommendations;
    } catch (error) {
      console.error("❌ Error generating tests from support:", error);
      return [];
    }
  }

  /**
   * Search and retrieve test knowledge
   */
  async searchTestKnowledge(
    query: string,
    options?: {
      sources?: string[];
      minRelevance?: number;
      limit?: number;
    }
  ) {
    try {
      console.log(`🔍 Searching test knowledge for: ${query}`);

      const results = await this.supabaseIntegration.searchTestKnowledge(
        query,
        options?.sources,
        options?.minRelevance || 70,
        options?.limit || 10
      );

      console.log(`✅ Found ${results.length} relevant knowledge entries`);
      return results;
    } catch (error) {
      console.error("❌ Error searching test knowledge:", error);
      return [];
    }
  }

  // Private helper methods

  private async getCachedAnalysis(url: string) {
    try {
      const result = await this.supabaseIntegration.getFirecrawlAnalysis(url);
      if (result && result.analyzed_at) {
        const analyzedDate = new Date(result.analyzed_at);
        const daysSinceAnalysis = (Date.now() - analyzedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAnalysis < 7) {
          return result;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private getMockAUTAnalysis(url: string) {
    return {
      testableFeatures: [
        {
          name: "Authentication",
          description: "User login and session management",
          testPriority: "high" as const,
          testTypes: ["e2e", "integration"],
          selectors: ["#login-form", '[data-testid="login-button"]'],
        },
        {
          name: "Asset Upload",
          description: "Upload and process digital assets",
          testPriority: "high" as const,
          testTypes: ["e2e", "integration", "performance"],
          selectors: ['[data-testid="upload-area"]', ".upload-button"],
        },
        {
          name: "Search Functionality",
          description: "Search across assets and metadata",
          testPriority: "medium" as const,
          testTypes: ["e2e", "api"],
          selectors: ["#search-input", '[data-testid="search-results"]'],
        },
      ],
      userFlows: [
        {
          name: "Asset Upload Flow",
          steps: [
            "User logs in",
            "Navigate to upload page",
            "Select files",
            "Add metadata",
            "Submit upload",
            "Verify processing",
          ],
          criticalPath: true,
        },
      ],
      apiEndpoints: [
        `${url}/api/auth/login`,
        `${url}/api/assets/upload`,
        `${url}/api/assets/search`,
        `${url}/api/metadata/update`,
      ],
      documentationUrls: [`${url}/docs`, `${url}/help`],
      knowledgeExtracted: [
        {
          category: "authentication",
          content: "AOMA uses SSO authentication with Sony Music corporate credentials",
          relevance: 95,
        },
        {
          category: "asset_management",
          content:
            "Support for audio formats including WAV, FLAC, MP3 with automatic metadata extraction",
          relevance: 90,
        },
      ],
    };
  }

  private extractErrorPattern(errorMessage: string): string {
    if (!errorMessage) return "unknown_error";

    // Extract common error patterns
    const patterns = [
      { regex: /timeout/i, pattern: "timeout_error" },
      { regex: /not found|404/i, pattern: "not_found_error" },
      { regex: /unauthorized|401/i, pattern: "auth_error" },
      { regex: /network|connection/i, pattern: "network_error" },
      { regex: /element.*not.*visible/i, pattern: "element_visibility_error" },
      { regex: /click.*failed/i, pattern: "click_error" },
    ];

    for (const { regex, pattern } of patterns) {
      if (regex.test(errorMessage)) {
        return pattern;
      }
    }

    // Extract first meaningful part of error
    return errorMessage
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
  }

  private analyzeForTestGaps(supportIssues: string): TestRecommendation[] {
    const recommendations: TestRecommendation[] = [];

    // Analyze support issues for test gaps
    const commonIssues = [
      { keyword: "upload", category: "file_upload", priority: 95 },
      { keyword: "login", category: "authentication", priority: 100 },
      { keyword: "search", category: "search", priority: 85 },
      { keyword: "metadata", category: "metadata", priority: 80 },
      { keyword: "export", category: "export", priority: 75 },
      { keyword: "permission", category: "authorization", priority: 90 },
    ];

    for (const issue of commonIssues) {
      if (supportIssues.toLowerCase().includes(issue.keyword)) {
        recommendations.push({
          title: `Test ${issue.category} functionality`,
          description: `Users report issues with ${issue.category}. Comprehensive testing needed.`,
          priority: issue.priority,
          category: issue.category,
          suggestedTests: [
            `${issue.category}_happy_path`,
            `${issue.category}_error_handling`,
            `${issue.category}_edge_cases`,
            `${issue.category}_performance`,
          ],
        });
      }
    }

    return recommendations;
  }

  private async storeTestKnowledge(knowledge: KnowledgeEntry[]) {
    try {
      for (const entry of knowledge) {
        await this.supabaseIntegration.storeTestKnowledge(entry);
      }
    } catch (error) {
      console.error("Error storing test knowledge:", error);
    }
  }
}

// Export singleton instance
export const unifiedTestIntelligence = new UnifiedTestIntelligence();
