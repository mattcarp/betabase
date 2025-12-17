/**
 * SIAM Vector Orchestrator Service
 *
 * CRITICAL DISTINCTION:
 * - SIAM = Our app (this testing/knowledge platform)
 * - AOMA = App Under Test (Sony Music's Asset and Offering Management Application)
 *
 * Direct Supabase pgvector queries for RAG context (~100ms response times).
 * NO external services - all queries go directly to Supabase.
 */

import { aomaCache } from "./aomaCache";
import { aomaProgressStream, type AOMASource } from "./aomaProgressStream";
import { getSupabaseVectorService } from "./supabaseVectorService";
import type { VectorSearchResult } from "@/lib/supabase";
import { DEFAULT_APP_CONTEXT } from "@/lib/supabase";
import { getQueryDeduplicator } from "./queryDeduplicator";

// Available AOMA-mesh-mcp tools and their capabilities
const AOMA_TOOLS = {
  query_aoma_knowledge: {
    description: "Query Sony Music AOMA knowledge base for general information",
    keywords: ["what is", "explain", "tell me about", "how does", "aoma", "usm", "dam", "metadata"],
    priority: 1,
  },
  search_jira_tickets: {
    description: "Search Jira for tickets, issues, bugs, features",
    keywords: ["jira", "ticket", "issue", "bug", "feature", "task", "story", "epic"],
    priority: 2,
  },
  get_jira_ticket_count: {
    description: "Get count of Jira tickets matching criteria",
    keywords: ["how many", "count", "number of", "tickets", "issues"],
    priority: 2,
  },
  search_git_commits: {
    description: "Search Git commit history",
    keywords: [
      "commit",
      "commits",
      "git",
      "github",
      "changes",
      "history",
      "recent",
      "latest",
      "who changed",
      "when was",
      "modified",
      "repository",
      "repo",
      "push",
      "pull",
      "merge",
    ],
    priority: 3,
  },
  search_code_files: {
    description: "Search through code files and repositories",
    keywords: ["code", "file", "function", "class", "implementation", "source", "repository"],
    priority: 3,
  },
  search_outlook_emails: {
    description: "Search Outlook emails and communications",
    keywords: ["email", "outlook", "message", "communication", "sent", "received", "mail"],
    priority: 4,
  },
  analyze_development_context: {
    description: "Analyze development context and provide insights",
    keywords: ["analyze", "context", "development", "insight", "assessment", "review"],
    priority: 5,
  },
  get_system_health: {
    description: "Check system health and status",
    keywords: ["health", "status", "system", "performance", "monitoring"],
    priority: 6,
  },
};

interface ToolCall {
  tool: string;
  args: any;
  reason: string;
}

interface OrchestrationResult {
  tools: ToolCall[];
  strategy: "single" | "parallel" | "sequential";
  reasoningText: string;
}

export class AOMAOrchestrator {
  private vectorService = getSupabaseVectorService();

  /**
   * Extract key search terms from a verbose user query.
   * Long queries with filler words dilute the embedding and reduce match quality.
   * 
   * Examples:
   *   "Asset Upload Sorting Failed error - do we have any JIRA tickets about this?"
   *   → "Asset Upload Sorting Failed"
   *   
   *   "I'm getting an 'Invalid product ID' error when trying to link products"  
   *   → "Invalid product ID"
   */
  private extractKeySearchTerms(query: string): string {
    // 1. Extract quoted text (single or double quotes) - these are usually the key terms
    const quotedMatch = query.match(/['"]([^'"]{5,80})['"]/);
    if (quotedMatch) {
      console.log(`🔑 Extracted quoted key term: "${quotedMatch[1]}"`);
      return quotedMatch[1];
    }

    // 2. Look for error patterns: "XYZ error", "XYZ failed", "getting XYZ"
    const errorPatterns = [
      /(?:getting|receiving|seeing|have|got)\s+(?:an?\s+)?["']?([A-Z][A-Za-z0-9\s]+(?:Failed|Error|Issue|Problem))["']?/i,
      /["']?([A-Z][A-Za-z0-9\s]+(?:Failed|Error|Issue|Problem))["']?\s+(?:error|issue|problem)?/i,
      /error[:\s]+["']?([A-Za-z0-9\s]{5,50})["']?/i,
    ];
    
    for (const pattern of errorPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        console.log(`🔑 Extracted error pattern: "${extracted}"`);
        return extracted;
      }
    }

    // 2.5. Code-specific query optimization
    // Queries asking for code should include technical terms for better matches
    const codeQueryPatterns = [
      // "show me the reducer code for X" -> "ngrx reducer X"
      /(?:show me|find|get|display)\s+(?:the\s+)?(\w+)\s+code\s+(?:for|in)\s+(.+)/i,
      // "code in X.ts" -> extract file path terms
      /code\s+(?:in|from)\s+(\S+\.(?:ts|js|tsx|jsx))/i,
    ];
    
    for (const pattern of codeQueryPatterns) {
      const match = query.match(pattern);
      if (match) {
        // Build a technical search query with Angular/ngrx terms
        let technicalQuery = query;
        if (query.toLowerCase().includes('reducer')) {
          // Add ngrx-specific terms for reducer queries
          technicalQuery = `ngrx reducer ${match[1] || ''} ${match[2] || ''} .sort createReducer on`;
        } else if (query.toLowerCase().includes('component')) {
          technicalQuery = `angular component ${match[1] || ''} ${match[2] || ''}`;
        } else if (query.toLowerCase().includes('service')) {
          technicalQuery = `angular service injectable ${match[1] || ''} ${match[2] || ''}`;
        }
        if (technicalQuery !== query) {
          console.log(`🔑 Enhanced code query: "${technicalQuery}"`);
          return technicalQuery.replace(/\s+/g, ' ').trim();
        }
      }
    }

    // 3. Remove common question phrases that dilute embeddings
    const fillerPhrases = [
      /^(do we have any|are there any|can you find|please search for|search for|look for|find|show me)/i,
      /(jira tickets?|tickets?|issues?|bugs?)\s+(about|for|related to|regarding)/gi,
      /\?+$/,
      /^(i'm|i am|we're|we are)\s+(getting|seeing|having|experiencing)/i,
      /(do we have|are there|can you|please|could you)/gi,
      /(any|some|the)\s+(jira\s+)?tickets?\s+(about|for|on|regarding)/gi,
      /(this exact|this specific|this particular|exactly this)/gi,
    ];

    let cleaned = query;
    for (const phrase of fillerPhrases) {
      cleaned = cleaned.replace(phrase, ' ');
    }
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // If the cleaned query is significantly shorter and still meaningful, use it
    if (cleaned.length >= 10 && cleaned.length < query.length * 0.7) {
      console.log(`🔑 Cleaned query: "${cleaned}" (from ${query.length} to ${cleaned.length} chars)`);
      return cleaned;
    }

    // 4. If query is too long, truncate to first meaningful part
    if (query.length > 100) {
      // Take first sentence or first 80 chars
      const firstPart = query.split(/[.!?-]/)[0].trim();
      if (firstPart.length >= 15 && firstPart.length <= 80) {
        console.log(`🔑 Using first part: "${firstPart}"`);
        return firstPart;
      }
    }

    // Return original if no optimization possible
    return query;
  }

  /**
   * Query unified vector store (FAST PATH - sub-second responses)
   * This is the primary query method that replaces multiple API calls
   */
  async queryVectorStore(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      sourceTypes?: string[];
      useCache?: boolean;
    } = {}
  ): Promise<{
    response: string;
    sources: VectorSearchResult[];
    metadata: any;
    fromCache?: boolean;
  }> {
    // TUNED: Lower threshold for better recall with chunked documents
    // Chunking creates more specific embeddings that may have lower similarity scores
    // but contain more relevant specific content
    const { matchThreshold = 0.55, matchCount = 15, sourceTypes, useCache = true } = options;

    // Normalize query for consistent caching
    const normalizedQuery = this.normalizeQuery(query);

    // Check cache first using normalized query
    if (useCache) {
      const cacheKey = `vector:${normalizedQuery}:${sourceTypes?.join(",")}`;
      const cached = aomaCache.get(cacheKey, "rapid");
      if (cached) {
        console.log("⚡ Returning cached vector response");
        return { ...cached, fromCache: true };
      }
    }

    try {
      // Extract key search terms for better embedding quality
      // Long verbose queries dilute embeddings and reduce match accuracy
      const searchQuery = this.extractKeySearchTerms(query);
      
      // Perform vector similarity search (multi-tenant: Sony Music / Digital Operations / AOMA)
      const vectorResults: VectorSearchResult[] = await this.vectorService.searchVectors(searchQuery, {
        ...DEFAULT_APP_CONTEXT, // organization, division, app_under_test
        matchThreshold,
        matchCount,
        sourceTypes,
      });

      if (!vectorResults || vectorResults.length === 0) {
        return {
          response: "No relevant information found in the knowledge base.",
          sources: [],
          metadata: { vectorSearch: true, resultsCount: 0 },
        };
      }

      // Return full VectorSearchResult objects (not just citations)
      // This ensures content field is preserved for result merging
      const formattedResponse = this.synthesizeVectorResponse(query, vectorResults);

      const result = {
        response: formattedResponse,
        sources: vectorResults, // Return full objects with content field
        metadata: {
          vectorSearch: true,
          resultsCount: vectorResults.length,
          avgSimilarity:
            vectorResults.reduce((sum, r) => sum + r.similarity, 0) / vectorResults.length,
          sourceTypes: [...new Set(vectorResults.map((r) => r.source_type))],
        },
      };

      // Cache the result using normalized query
      if (useCache) {
        const cacheKey = `vector:${normalizedQuery}:${sourceTypes?.join(",")}`;
        aomaCache.set(cacheKey, result, "rapid");
      }

      return result;
    } catch (error) {
      console.error("❌ Vector store query failed:", error);
      throw error;
    }
  }

  /**
   * Determine which source types are relevant for a query
   * This enables intelligent source selection for vector search
   */
  private determineSourceTypes(query: string): string[] | undefined {
    const lowerQuery = query.toLowerCase();
    const sourceTypes: string[] = [];

    // Check for specific source type indicators
    if (
      lowerQuery.includes("jira") ||
      lowerQuery.includes("ticket") ||
      lowerQuery.includes("issue") ||
      lowerQuery.includes("bug")
    ) {
      sourceTypes.push("jira");
    }

    if (
      lowerQuery.includes("commit") ||
      lowerQuery.includes("git") ||
      lowerQuery.includes("code") ||
      lowerQuery.includes("repository")
    ) {
      sourceTypes.push("git");
    }

    if (
      lowerQuery.includes("email") ||
      lowerQuery.includes("outlook") ||
      lowerQuery.includes("message") ||
      lowerQuery.includes("communication")
    ) {
      sourceTypes.push("email");
    }

    if (
      lowerQuery.includes("metric") ||
      lowerQuery.includes("performance") ||
      lowerQuery.includes("monitoring") ||
      lowerQuery.includes("health")
    ) {
      sourceTypes.push("metrics");
    }

    // Always search knowledge base for AOMA-related queries
    if (
      lowerQuery.includes("aoma") ||
      lowerQuery.includes("usm") ||
      lowerQuery.includes("dam") ||
      lowerQuery.includes("metadata") ||
      lowerQuery.includes("asset") ||
      sourceTypes.length === 0
    ) {
      sourceTypes.push("knowledge");
      sourceTypes.push("firecrawl"); // Include Playwright-crawled AOMA pages
    }

    // If no specific types matched, search all sources
    if (sourceTypes.length === 0) {
      return undefined; // undefined means search all source types
    }

    console.log(`🎯 Determined source types for query: ${sourceTypes.join(", ")}`);
    return sourceTypes;
  }

  /**
   * Synthesize a coherent response from vector search results
   */
  private synthesizeVectorResponse(query: string, results: VectorSearchResult[]): string {
    if (results.length === 0) {
      return "No relevant information found.";
    }

    // Group results by source type for better organization
    const bySourceType = results.reduce(
      (acc, result) => {
        const type = result.source_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(result);
        return acc;
      },
      {} as Record<string, VectorSearchResult[]>
    );

    let response = "";
    let citationIndex = 1;

    // Prioritize knowledge base results first
    const priorityOrder = ["knowledge", "jira", "git", "email", "metrics"];
    const orderedTypes = priorityOrder.filter((type) => bySourceType[type]);

    // Add remaining types not in priority order
    Object.keys(bySourceType).forEach((type) => {
      if (!priorityOrder.includes(type)) {
        orderedTypes.push(type);
      }
    });

    // Build response from top results
    orderedTypes.forEach((sourceType) => {
      const typeResults = bySourceType[sourceType];
      const topResults = typeResults.slice(0, 3); // Take top 3 per source type

      topResults.forEach((result) => {
        // Add content with citation marker
        const content = result.content.trim();
        response += `${content} [${citationIndex}]\n\n`;
        citationIndex++;
      });
    });

    return response.trim();
  }

  /**
   * Analyze query to determine which tools to call
   */
  private analyzeQuery(query: string | any): OrchestrationResult {
    // Ensure query is a string
    let queryString: string;
    if (typeof query === "string") {
      queryString = query;
    } else if (query && typeof query === "object") {
      // Handle object format (e.g., {type: 'text', text: '...'})
      if (query.text) {
        queryString = query.text;
      } else if (Array.isArray(query)) {
        queryString = query.map((part: any) => part.text || part.content || "").join(" ");
      } else {
        queryString = JSON.stringify(query);
      }
    } else {
      queryString = String(query || "");
    }

    const lowerQuery = queryString.toLowerCase();
    const selectedTools: ToolCall[] = [];

    // Check for multi-tool indicators
    const hasMultipleTopics =
      (lowerQuery.includes(" and ") ||
        lowerQuery.includes(" also ") ||
        lowerQuery.includes(" plus ")) &&
      !lowerQuery.includes("and how"); // Avoid splitting natural phrases

    // Score each tool based on keyword matches
    const toolScores: Map<string, number> = new Map();

    for (const [toolName, config] of Object.entries(AOMA_TOOLS)) {
      let score = 0;
      for (const keyword of config.keywords) {
        if (lowerQuery.includes(keyword)) {
          score += 10 / config.priority; // Higher priority = higher score
        }
      }
      if (score > 0) {
        toolScores.set(toolName, score);
      }
    }

    // Sort tools by score
    const sortedTools = Array.from(toolScores.entries()).sort((a, b) => b[1] - a[1]);

    // Determine strategy based on query analysis
    let strategy: "single" | "parallel" | "sequential" = "single";
    let reasoning = "";

    if (sortedTools.length === 0) {
      // Default to knowledge base for general queries
      selectedTools.push({
        tool: "query_aoma_knowledge",
        args: { query, strategy: "rapid" },
        reason: "General query - using knowledge base",
      });
      reasoning = "No specific tool keywords found, defaulting to knowledge base";
    } else if (hasMultipleTopics && sortedTools.length > 1) {
      // Multiple topics - run tools in parallel
      strategy = "parallel";
      reasoning = "Query contains multiple topics, running tools in parallel";

      // Take top 3 tools maximum
      for (const [toolName] of sortedTools.slice(0, 3)) {
        selectedTools.push({
          tool: toolName,
          args: this.buildToolArgs(toolName, query),
          reason: `Matched keywords for ${toolName}`,
        });
      }
    } else if (lowerQuery.includes("then") || lowerQuery.includes("after")) {
      // Sequential operations
      strategy = "sequential";
      reasoning = "Query requires sequential operations";

      for (const [toolName] of sortedTools) {
        selectedTools.push({
          tool: toolName,
          args: this.buildToolArgs(toolName, query),
          reason: `Sequential step: ${toolName}`,
        });
      }
    } else {
      // Single best tool
      const [toolName] = sortedTools[0];
      selectedTools.push({
        tool: toolName,
        args: this.buildToolArgs(toolName, query),
        reason: `Best match: ${toolName}`,
      });
      reasoning = `Single tool selected based on highest keyword match`;
    }

    return {
      tools: selectedTools,
      strategy,
      reasoningText,
    };
  }

  /**
   * Extract sources from tool results for citation tracking
   */
  private extractSources(toolName: string, result: any): AOMASource[] {
    const sources: AOMASource[] = [];

    if (!result) return sources;

    switch (toolName) {
      case "query_aoma_knowledge":
        sources.push({
          type: "knowledge_base",
          title: "AOMA Knowledge Base",
          description: result.topic || "General AOMA information",
          relevance: 1.0,
        });
        break;

      case "search_jira_tickets":
        if (Array.isArray(result)) {
          result.forEach((ticket: any) => {
            sources.push({
              type: "jira",
              title: `Jira ${ticket.key || "Ticket"}`,
              url: ticket.url,
              description: ticket.summary || ticket.description,
              timestamp: ticket.created || ticket.updated,
            });
          });
        }
        break;

      case "search_git_commits":
        if (Array.isArray(result)) {
          result.forEach((commit: any) => {
            sources.push({
              type: "git",
              title: `Git Commit ${commit.sha?.substring(0, 7) || ""}`,
              description: commit.message || commit.description,
              timestamp: commit.date,
            });
          });
        }
        break;

      case "search_outlook_emails":
        if (Array.isArray(result)) {
          result.forEach((email: any) => {
            sources.push({
              type: "outlook",
              title: email.subject || "Email",
              description: email.preview || email.body?.substring(0, 100),
              timestamp: email.receivedDateTime || email.sentDateTime,
            });
          });
        }
        break;

      case "get_system_health":
        sources.push({
          type: "system",
          title: "System Health Check",
          description: "Current system status and metrics",
          timestamp: new Date().toISOString(),
        });
        break;
    }

    return sources;
  }

  /**
   * Build appropriate arguments for each tool
   */
  private buildToolArgs(toolName: string, query: string): any {
    switch (toolName) {
      case "query_aoma_knowledge":
        return { query, strategy: "rapid" };

      case "search_jira_tickets":
        return { query, maxResults: 10 };

      case "get_jira_ticket_count":
        return { query };

      case "search_git_commits":
        return { query, limit: 10 };

      case "search_code_files":
        return { query, maxResults: 10 };

      case "search_outlook_emails":
        return { query, limit: 10 };

      case "analyze_development_context":
        return { currentTask: query };

      case "get_system_health":
        return {};

      default:
        return { query };
    }
  }

  /**
   * Normalize query for consistent caching
   * Removes trailing punctuation, extra whitespace, and lowercases
   */
  private normalizeQuery(query: string): string {
    return query
      .trim()
      .toLowerCase()
      .replace(/[?!.]+$/, "") // Remove trailing punctuation
      .replace(/\s+/g, " "); // Normalize whitespace
  }

  /**
   * Execute orchestrated tool calls with progress tracking
   * PRIMARY PATH: Vector store query (fast, local, sub-second)
   * FALLBACK PATH: External API calls (slow, but comprehensive)
   */
  async executeOrchestration(
    query: string,
    options?: {
      progressCallback?: (update: any) => void;
      sourceTypes?: string[]; // From intent classifier - skip internal detection if provided
    }
  ): Promise<any> {
    const { progressCallback, sourceTypes } = options || {};
    
    // Start progress tracking
    aomaProgressStream.startQuery(query);

    // Normalize query for consistent caching
    const normalizedQuery = this.normalizeQuery(query);

    // Include sourceTypes in cache key for accurate cache hits
    const sourceTypesKey = sourceTypes?.sort().join(',') || 'auto';
    const cacheKey = `orchestrated:${normalizedQuery}:${sourceTypesKey}`;
    const cached = aomaCache.get(cacheKey, "rapid");
    if (cached) {
      console.log("⚡ Returning cached orchestrated response");
      aomaProgressStream.recordCacheHit("orchestrated");
      aomaProgressStream.completeQuery();

      // Send progress updates if callback provided
      if (progressCallback) {
        aomaProgressStream.getUpdates().forEach((update) => progressCallback(update));
      }

      return cached;
    }

    // TIER 1 OPTIMIZATION: Deduplicate concurrent identical queries
    // If the same query is already in-flight from another request, reuse that promise
    const deduplicator = getQueryDeduplicator();
    const dedupeKey = `${normalizedQuery}:${sourceTypesKey}:${progressCallback ? 'with-callback' : 'no-callback'}`;
    
    return deduplicator.dedupe(dedupeKey, async () => {
      return this.executeOrchestrationInternal(query, normalizedQuery, cacheKey, progressCallback, sourceTypes);
    });
  }

  /**
   * Internal orchestration execution (wrapped by deduplication)
   * OPTIMIZED: Supabase-only (OpenAI removed - was empty and added 2.5s latency)
   */
  private async executeOrchestrationInternal(
    query: string,
    normalizedQuery: string,
    cacheKey: string,
    progressCallback?: (update: any) => void,
    classifiedSourceTypes?: string[] // From intent classifier
  ): Promise<any> {

    // SUPABASE-ONLY PATH: Direct vector store query (FAST - <100ms)
    console.log("🚀 Querying Supabase vector store...");
    
    try {
      // Start service tracking
      aomaProgressStream.startService("vector_store");

      // Use classified source types if provided, otherwise detect from query
      const sourceTypes = classifiedSourceTypes || this.determineSourceTypes(query);
      
      if (classifiedSourceTypes) {
        console.log(`🎯 Using intent-classified sources: [${classifiedSourceTypes.join(', ')}]`);
      }

      // Query Supabase vector store
      const vectorResult = await this.queryVectorStore(query, {
        matchThreshold: 0.25, // Lowered for AOMA pages with CSS noise (0.25-0.45 typical)
        matchCount: 10,
        sourceTypes,
        useCache: true,
      });

      console.log(`✅ Supabase returned ${vectorResult.sources.length} results`);

      // Map VectorSearchResult to AOMASource
      const aomaSources: AOMASource[] = vectorResult.sources.map(s => ({
        type: (s.source_type === 'email' ? 'outlook' : 
               s.source_type === 'metrics' ? 'system' : 
               s.source_type === 'knowledge' ? 'knowledge_base' : 
               s.source_type === 'firecrawl' ? 'knowledge_base' :
               s.source_type) as any,
        title: s.metadata?.title || s.source_id || 'Unknown Source',
        url: s.metadata?.url,
        description: s.content.substring(0, 100) + '...',
        relevance: s.similarity,
        timestamp: s.created_at
      }));

      // Update progress stream
      aomaProgressStream.completeService(
        "vector_store",
        vectorResult.sources.length,
        aomaSources
      );

      aomaProgressStream.completeQuery();

      // Send progress updates
      if (progressCallback) {
        aomaProgressStream.getUpdates().forEach((update) => progressCallback(update));
      }

      // Cache the result
      aomaCache.set(cacheKey, vectorResult, "rapid");

      return vectorResult;
    } catch (error) {
      console.error("❌ Vector store query failed:", error);
      aomaProgressStream.errorService(
        "vector_store",
        error instanceof Error ? error.message : String(error)
      );
      
      aomaProgressStream.completeQuery();
      
      // Return empty result (no fallback needed)
      return {
        sources: [],
        response: "Unable to retrieve information from the knowledge base. Please try again.",
        metadata: { error: true },
      };
    }
  }

  // REMOVED: callAOMATool method - Railway aoma-mesh-mcp integration removed
  // All queries now use direct Supabase vector search (see executeOrchestrationInternal above)
  // This provides sub-100ms response times vs 6-10s+ with Railway
  //
  // If you need Jira/Git/Outlook integration in the future, query Supabase directly
  // where that data is already stored (see jira_tickets table in Supabase)

  /**
   * Format orchestrated responses into a coherent answer
   */
  private formatOrchestratedResponse(results: any, orchestration: OrchestrationResult): any {
    if (orchestration.strategy === "single") {
      // Format single responses with citation markers if sources exist
      if (results.sources && Array.isArray(results.sources)) {
        const formattedResponse = this.addCitationMarkers(results.response, results.sources);
        return {
          ...results,
          response: formattedResponse,
          formattedSources: results.sources.map((source: any, idx: number) => ({
            id: `source-${idx + 1}`,
            title: typeof source === "string" ? source : source.title,
            url: typeof source === "object" ? source.url : undefined,
            description: typeof source === "object" ? source.description : source,
          })),
        };
      }
      return results;
    }

    // For multi-tool responses, combine intelligently
    const combined: {
      response: string;
      sources: any[];
      formattedSources: any[];
      metadata: any;
    } = {
      response: "",
      sources: [],
      formattedSources: [],
      metadata: {
        orchestration: orchestration.strategy,
        tools_used: orchestration.tools.map((t) => t.tool),
        reasoningText: orchestration.reasoningText,
      },
    };

    // Combine responses from different tools
    let sourceIndex = 0;
    for (const [tool, res] of Object.entries(results)) {
      const result = res as any;
      if (result && typeof result === "object") {
        if (result.error) {
          continue; // Skip failed tools
        }

        if (result.response) {
          let toolResponse = result.response;

          // Add citations if this tool has sources
          if (result.sources && Array.isArray(result.sources)) {
            const citationMap = new Map();
            result.sources.forEach((source: any) => {
              sourceIndex++;
              citationMap.set(source, sourceIndex);
              combined.sources.push(source);
              combined.formattedSources.push({
                id: `source-${sourceIndex}`,
                title: typeof source === "string" ? source : source.title,
                url: typeof source === "object" ? source.url : undefined,
                description: typeof source === "object" ? source.description : source,
                tool: tool,
              });
            });

            // Add citation markers to this tool's response
            toolResponse = `${toolResponse} [${Array.from(citationMap.values()).join(",")}]`;
          }

          combined.response += `\n\n${toolResponse}`;
        }
      }
    }

    if (!combined.response) {
      combined.response = "Unable to retrieve information from the requested sources.";
    }

    return combined;
  }

  /**
   * Add citation markers to response text
   */
  private addCitationMarkers(response: string, sources: any[]): string {
    if (!sources || sources.length === 0) return response;

    // Simple approach: Add citations at the end of sentences that might reference the sources
    // In a real implementation, you'd want more sophisticated matching
    const sentences = response.split(/(?<=[.!?])\s+/);
    const citationIndices = sources.map((_, idx) => idx + 1);

    // Distribute citations throughout the response
    const citedSentences = sentences.map((sentence, idx) => {
      if (idx < sources.length && !sentence.includes("[")) {
        return `${sentence} [${idx + 1}]`;
      }
      return sentence;
    });

    return citedSentences.join(" ");
  }
}

// Export singleton instance
export const aomaOrchestrator = new AOMAOrchestrator();
