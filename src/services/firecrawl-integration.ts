/**
 * Firecrawl Integration Service
 * Analyzes the Application Under Test (AUT) to build intelligence for:
 * - Test generation
 * - Documentation extraction
 * - Customer support knowledge base
 */

import Firecrawl from "@mendable/firecrawl-js";

interface TestableFeature {
  name: string;
  description: string;
  testPriority: "high" | "medium" | "low";
  testTypes: string[];
  selectors?: string[];
}

interface UserFlow {
  name: string;
  steps: string[];
  criticalPath: boolean;
}

interface AUTAnalysis {
  testableFeatures: TestableFeature[];
  userFlows: UserFlow[];
  apiEndpoints: string[];
  documentationUrls: string[];
  knowledgeExtracted: {
    category: string;
    content: string;
    relevance: number;
  }[];
}

export class FirecrawlIntegrationService {
  private firecrawl: Firecrawl | null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || "";
    // Only create Firecrawl if API key is provided
    this.firecrawl = this.apiKey ? new Firecrawl({ apiKey: this.apiKey }) : null;
  }

  /**
   * Analyze the Application Under Test
   * Crawls the application to understand its structure and features
   */
  async analyzeAUT(baseUrl: string): Promise<AUTAnalysis> {
    console.log(`🔍 Analyzing AUT at ${baseUrl}...`);

    if (!this.firecrawl) {
      throw new Error(
        "Firecrawl API key not configured. Set FIRECRAWL_API_KEY environment variable."
      );
    }

    try {
      // Map the application to discover all URLs (Firecrawl v2)
      const mapResult = await this.firecrawl.map(baseUrl, {
        search: "",
        limit: 100,
        sitemap: "include",
      });

      const urls = mapResult.links ?? [];
      console.log(`📍 Discovered ${urls.length} URLs`);

      // Scrape key pages for feature extraction
      const features: TestableFeature[] = [];
      const userFlows: UserFlow[] = [];
      const apiEndpoints: string[] = [];
      const documentationUrls: string[] = [];
      const knowledgeExtracted: any[] = [];

      // Analyze main page
      const mainPageAnalysis = await this.scrapeAndAnalyze(baseUrl);
      features.push(...mainPageAnalysis.features);
      userFlows.push(...mainPageAnalysis.flows);

      // Analyze other important pages
      for (const url of urls.slice(0, 10)) {
        // Limit to first 10 for performance
        if (url.includes("/api/")) {
          apiEndpoints.push(url);
        } else if (url.includes("/docs/") || url.includes("/help/")) {
          documentationUrls.push(url);
          const docAnalysis = await this.extractDocumentation(url);
          knowledgeExtracted.push(...docAnalysis);
        }
      }

      return {
        testableFeatures: features,
        userFlows,
        apiEndpoints,
        documentationUrls,
        knowledgeExtracted,
      };
    } catch (error) {
      console.error("Error analyzing AUT:", error);
      throw error;
    }
  }

  /**
   * Scrape and analyze a single page
   */
  private async scrapeAndAnalyze(url: string) {
    if (!this.firecrawl) {
      throw new Error("Firecrawl API key not configured");
    }
    const res = await this.firecrawl.scrape(url, {
      formats: [
        "markdown",
        {
          type: "json",
          prompt: `Extract testable features and user flows from this page. Focus on:
          1. Interactive elements (buttons, forms, inputs)
          2. Navigation paths
          3. Key functionality
          4. User workflows`,
          schema: {
            type: "object",
            properties: {
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    testPriority: { type: "string" },
                    testTypes: { type: "array", items: { type: "string" } },
                  },
                },
              },
              flows: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    steps: { type: "array", items: { type: "string" } },
                    criticalPath: { type: "boolean" },
                  },
                },
              },
            },
          },
        },
      ],
      onlyMainContent: true,
    });

    const extract = (res as any).json;
    return extract || { features: [], flows: [] };
  }

  /**
   * Extract documentation for knowledge base
   */
  private async extractDocumentation(url: string) {
    if (!this.firecrawl) {
      throw new Error("Firecrawl API key not configured");
    }
    const scrapeResult = await this.firecrawl.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    });

    const content = (scrapeResult as any).markdown || "";

    // Process content for knowledge base
    return [
      {
        category: "documentation",
        content: content.substring(0, 1000), // Limit content size
        relevance: this.calculateRelevance(content),
      },
    ];
  }

  /**
   * Generate test patterns from crawled documentation
   */
  async generateTestPatterns(documentationUrls: string[]): Promise<any[]> {
    if (!this.firecrawl) {
      throw new Error("Firecrawl API key not configured");
    }
    const patterns = [];

    for (const url of documentationUrls) {
      const scrapeResult = await this.firecrawl.scrape(url, {
        formats: [
          "markdown",
          {
            type: "json",
            prompt: "Extract test patterns, best practices, and testing guidelines",
            schema: {
              type: "object",
              properties: {
                testPatterns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pattern: { type: "string" },
                      description: { type: "string" },
                      example: { type: "string" },
                      useCase: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        ],
      });

      const extracted = (scrapeResult as any).json;
      if (extracted?.testPatterns) {
        patterns.push(...extracted.testPatterns);
      }
    }

    return patterns;
  }

  /**
   * Deep research on specific testing topics
   */
  async conductTestingResearch(query: string) {
    console.log(`🔬 Conducting deep research on: ${query}`);

    if (!this.firecrawl) {
      throw new Error("Firecrawl API key not configured");
    }

    const research = await this.firecrawl.search(query, {
      limit: 10,
      lang: "en",
      country: "us",
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
      },
    });

    // Process and structure research results
    const processedResults = research.data?.map((result) => ({
      title: result.title,
      url: result.url,
      content: result.markdown?.substring(0, 500),
      relevance: result.score || 0,
    }));

    return {
      query,
      results: processedResults,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate content relevance for knowledge base
   */
  private calculateRelevance(content: string): number {
    const keywords = ["test", "testing", "qa", "quality", "automation", "feature", "bug", "error"];
    let score = 0;

    keywords.forEach((keyword) => {
      const matches = (content.toLowerCase().match(new RegExp(keyword, "g")) || []).length;
      score += matches;
    });

    return Math.min(100, score * 5); // Cap at 100
  }

  /**
   * Sync with Supabase for shared knowledge base
   */
  async syncToKnowledgeBase(data: AUTAnalysis, supabaseClient: any) {
    console.log("📤 Syncing to Supabase knowledge base...");

    try {
      // Store testable features
      const { error: featuresError } = await supabaseClient.from("testable_features").upsert(
        data.testableFeatures.map((f) => ({
          ...f,
          app_name: "SIAM",
          created_at: new Date().toISOString(),
        }))
      );

      if (featuresError) throw featuresError;

      // Store user flows
      const { error: flowsError } = await supabaseClient.from("user_flows").upsert(
        data.userFlows.map((f) => ({
          ...f,
          app_name: "SIAM",
          created_at: new Date().toISOString(),
        }))
      );

      if (flowsError) throw flowsError;

      // Store extracted knowledge for customer support
      const { error: knowledgeError } = await supabaseClient.from("support_knowledge").upsert(
        data.knowledgeExtracted.map((k) => ({
          ...k,
          source: "firecrawl",
          app_name: "SIAM",
          created_at: new Date().toISOString(),
        }))
      );

      if (knowledgeError) throw knowledgeError;

      console.log("✅ Successfully synced to knowledge base");
      return { success: true };
    } catch (error) {
      console.error("Error syncing to knowledge base:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlIntegrationService();
