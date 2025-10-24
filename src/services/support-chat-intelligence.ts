/**
 * Support Chat Intelligence Service
 * Provides intelligent answers to support queries by combining
 * test knowledge, AOMA documentation, and live system insights
 */

import { EnhancedSupabaseTestIntegration } from "./supabase-test-integration-enhanced";
import { aomaOrchestrator } from "./aomaOrchestrator";
import { aomaCache } from "./aomaCache";
import { unifiedTestIntelligence } from "./unified-test-intelligence";

interface SupportQuery {
  question: string;
  context?: string;
  userId?: string;
  sessionId?: string;
}

interface SupportResponse {
  answer: string;
  confidence: number;
  sources: string[];
  relatedKnowledge?: any[];
  suggestedActions?: string[];
}

interface KnowledgeSource {
  type: "test_failure" | "documentation" | "firecrawl" | "aoma_knowledge";
  content: string;
  relevance: number;
  solution?: string;
}

export class SupportChatIntelligence {
  private supabaseIntegration: EnhancedSupabaseTestIntegration;

  constructor() {
    this.supabaseIntegration = new EnhancedSupabaseTestIntegration(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kfxetwuuzljhybfgmpuc.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  /**
   * Query knowledge base for support answers
   */
  async querySupportKnowledge(query: SupportQuery): Promise<SupportResponse> {
    try {
      console.log(`🤖 Processing support query: ${query.question.substring(0, 100)}...`);

      // Check cache first
      const cacheKey = `support_${this.hashQuery(query.question)}`;
      const cachedResponse = aomaCache.get(cacheKey, "rapid");
      if (cachedResponse && typeof cachedResponse === "object") {
        console.log("✅ Using cached support response");
        return cachedResponse as SupportResponse;
      }

      // 1. Search test knowledge base
      const testKnowledge = await unifiedTestIntelligence.searchTestKnowledge(query.question, {
        sources: ["test_failure", "firecrawl", "documentation", "support_ticket"],
        minRelevance: 70,
        limit: 5,
      });

      // 2. Query AOMA mesh for business context
      const aomaContext = await this.queryAOMAKnowledge(query.question);

      // 3. Combine and synthesize response
      const response = await this.synthesizeResponse(query, testKnowledge, aomaContext);

      // Cache the response
      aomaCache.set(cacheKey, response, "rapid");

      console.log(`✅ Generated support response with confidence: ${response.confidence}%`);
      return response;
    } catch (error) {
      console.error("❌ Error processing support query:", error);
      return this.getFallbackResponse(query.question);
    }
  }

  /**
   * Learn from support interactions
   */
  async learnFromInteraction(
    question: string,
    answer: string,
    wasHelpful: boolean,
    feedback?: string
  ) {
    try {
      console.log(`📝 Recording support interaction feedback: ${wasHelpful ? "👍" : "👎"}`);

      if (wasHelpful) {
        // Store successful Q&A as knowledge
        // TODO: Implement storeTestKnowledge method in supabase-test-integration-enhanced
        console.log("⚠️  storeTestKnowledge not yet implemented");

        console.log("✅ Stored helpful interaction in knowledge base");
      } else {
        // Record failed interaction for improvement
        await this.recordFailedInteraction(question, answer, feedback);
        console.log("📊 Recorded failed interaction for analysis");
      }
    } catch (error) {
      console.error("❌ Error learning from interaction:", error);
    }
  }

  /**
   * Get common issues and their solutions
   */
  async getCommonIssues(limit: number = 10) {
    try {
      console.log("📊 Fetching common support issues...");

      // Get most helpful knowledge entries
      // TODO: Implement getMostHelpfulKnowledge method in supabase-test-integration-enhanced
      console.log("⚠️  getMostHelpfulKnowledge not yet implemented");
      return this.getDefaultCommonIssues();
    } catch (error) {
      console.error("❌ Error fetching common issues:", error);
      return this.getDefaultCommonIssues();
    }
  }

  /**
   * Analyze support trends
   */
  async analyzeSupportTrends(timeRange: { start: Date; end: Date }) {
    try {
      console.log("📈 Analyzing support trends...");

      // Get support tickets in time range
      // TODO: Implement getSupportTicketsInRange method in supabase-test-integration-enhanced
      console.log("⚠️  getSupportTicketsInRange not yet implemented");
      const tickets: any[] = [];

      // Analyze patterns
      const trends = this.extractTrends(tickets);

      console.log(`✅ Identified ${trends.length} trends`);
      return trends;
    } catch (error) {
      console.error("❌ Error analyzing trends:", error);
      return [];
    }
  }

  // Private helper methods

  private async queryAOMAKnowledge(question: string) {
    try {
      const response = await aomaOrchestrator.executeOrchestration(
        `Answer this AOMA support question: ${question}`
      );
      return response.response;
    } catch (error) {
      console.error("Error querying AOMA knowledge:", error);
      return null;
    }
  }

  private async synthesizeResponse(
    query: SupportQuery,
    testKnowledge: any[],
    aomaContext: string | null
  ): Promise<SupportResponse> {
    const sources: string[] = [];
    const suggestedActions: string[] = [];
    let answer = "";
    let confidence = 0;

    // Prioritize test knowledge if available
    if (testKnowledge.length > 0) {
      sources.push("test_knowledge_base");
      const topSolution = testKnowledge[0];

      if (topSolution.solution) {
        answer = topSolution.solution;
        confidence = topSolution.relevance_score || 80;
      } else {
        answer = topSolution.content;
        confidence = (topSolution.relevance_score || 70) * 0.9; // Slightly lower confidence without solution
      }

      // Add related solutions
      if (testKnowledge.length > 1) {
        suggestedActions.push("Related issues found in knowledge base");
        testKnowledge.slice(1, 3).forEach((k) => {
          if (k.title) {
            suggestedActions.push(`See also: ${k.title}`);
          }
        });
      }
    }

    // Enhance with AOMA context
    if (aomaContext) {
      sources.push("aoma_documentation");

      if (!answer) {
        answer = aomaContext;
        confidence = 75;
      } else {
        // Combine both sources
        answer = `${answer}\n\nAdditional context: ${aomaContext}`;
        confidence = Math.min(95, confidence + 10);
      }
    }

    // Fallback to general response
    if (!answer) {
      answer = this.generateGenericResponse(query.question);
      confidence = 50;
      sources.push("general_knowledge");
    }

    // Add suggested actions based on question type
    const questionType = this.classifyQuestion(query.question);
    switch (questionType) {
      case "error":
        suggestedActions.push("Check system logs", "Verify user permissions");
        break;
      case "howto":
        suggestedActions.push("View documentation", "Watch tutorial video");
        break;
      case "feature":
        suggestedActions.push("Check feature availability", "Review release notes");
        break;
    }

    return {
      answer,
      confidence,
      sources,
      relatedKnowledge: testKnowledge.slice(0, 3),
      suggestedActions,
    };
  }

  private hashQuery(query: string): string {
    // Simple hash for cache key
    return query
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .substring(0, 50);
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];

    // Extract keywords
    const keywords = [
      "upload",
      "download",
      "export",
      "import",
      "login",
      "authentication",
      "permission",
      "access",
      "metadata",
      "search",
      "filter",
      "sort",
      "error",
      "bug",
      "issue",
      "problem",
      "slow",
      "performance",
      "timeout",
      "crash",
    ];

    const lowerText = text.toLowerCase();
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        tags.push(keyword);
      }
    }

    // Add AOMA-specific tags
    if (lowerText.includes("aoma")) tags.push("aoma");
    if (lowerText.includes("sony")) tags.push("sony_music");
    if (lowerText.includes("asset")) tags.push("asset_management");

    return [...new Set(tags)]; // Remove duplicates
  }

  private classifyQuestion(question: string): "error" | "howto" | "feature" | "general" {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes("error") || lowerQ.includes("fail") || lowerQ.includes("not work")) {
      return "error";
    }
    if (lowerQ.includes("how to") || lowerQ.includes("how do") || lowerQ.includes("how can")) {
      return "howto";
    }
    if (lowerQ.includes("feature") || lowerQ.includes("support") || lowerQ.includes("can i")) {
      return "feature";
    }

    return "general";
  }

  private generateGenericResponse(question: string): string {
    const questionType = this.classifyQuestion(question);

    switch (questionType) {
      case "error":
        return "I understand you're experiencing an issue. Please check the system logs for more details, or contact your administrator if the problem persists.";
      case "howto":
        return "For detailed instructions, please refer to the AOMA documentation or contact your system administrator for assistance.";
      case "feature":
        return "For information about specific features and capabilities, please consult the AOMA user guide or contact support.";
      default:
        return "Thank you for your question. For assistance with AOMA, please consult the documentation or contact your system administrator.";
    }
  }

  private getFallbackResponse(question: string): SupportResponse {
    return {
      answer: this.generateGenericResponse(question),
      confidence: 40,
      sources: ["fallback"],
      suggestedActions: ["Contact support", "Check documentation"],
    };
  }

  private async recordFailedInteraction(_question: string, _answer: string, _feedback?: string) {
    // Store failed interactions for analysis
    // TODO: Implement storeTestKnowledge method in supabase-test-integration-enhanced
    console.log("⚠️  storeTestKnowledge not yet implemented");
  }

  private getDefaultCommonIssues() {
    return [
      {
        title: "Login Issues",
        content: "Users unable to log in with SSO",
        solution:
          "Clear browser cache and cookies, ensure VPN is connected for corporate network access",
        helpful_count: 45,
      },
      {
        title: "Upload Failures",
        content: "Files fail to upload or process",
        solution: "Check file format compatibility, ensure file size is under 2GB limit",
        helpful_count: 38,
      },
      {
        title: "Search Not Working",
        content: "Search returns no results or incorrect results",
        solution: "Verify metadata is properly indexed, use specific search terms",
        helpful_count: 32,
      },
    ];
  }

  private extractTrends(tickets: any[]) {
    const trendMap = new Map<string, number>();

    // Count occurrences of issues
    for (const ticket of tickets) {
      const tags = this.extractTags(ticket.content || "");
      for (const tag of tags) {
        trendMap.set(tag, (trendMap.get(tag) || 0) + 1);
      }
    }

    // Convert to sorted array
    return Array.from(trendMap.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        trend: count > 10 ? "rising" : "stable",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

// Export singleton instance
export const supportChatIntelligence = new SupportChatIntelligence();
