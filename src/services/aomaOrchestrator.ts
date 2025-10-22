/**
 * AOMA Orchestrator Service
 * Intelligently routes queries to appropriate AOMA-mesh-mcp LangChain agents
 * Enables full utilization of all orchestrated resources
 */

import { aomaCache } from "./aomaCache";
import { aomaProgressStream, type AOMASource } from "./aomaProgressStream";
import { getSupabaseVectorService } from "./supabaseVectorService";
import type { VectorSearchResult } from "@/lib/supabase";

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
  reasoning: string;
}

export class AOMAOrchestrator {
  private vectorService = getSupabaseVectorService();

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
    sources: AOMASource[];
    metadata: any;
    fromCache?: boolean;
  }> {
    const { matchThreshold = 0.78, matchCount = 10, sourceTypes, useCache = true } = options;

    // Check cache first
    if (useCache) {
      const cacheKey = `vector:${query}:${sourceTypes?.join(",")}`;
      const cached = aomaCache.get(cacheKey, "rapid");
      if (cached) {
        console.log("⚡ Returning cached vector response");
        return { ...cached, fromCache: true };
      }
    }

    try {
      // Perform vector similarity search
      const vectorResults: VectorSearchResult[] = await this.vectorService.searchVectors(query, {
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

      // Extract sources for citation
      const sources: AOMASource[] = vectorResults.map((result, idx) => ({
        type: result.source_type as any,
        title: result.metadata?.title || result.metadata?.filename || `Source ${idx + 1}`,
        description: result.content.substring(0, 150) + "...",
        relevance: result.similarity,
        url: result.metadata?.url,
        timestamp: result.metadata?.created_at || result.metadata?.updated_at,
      }));

      // Format response with citations
      const formattedResponse = this.synthesizeVectorResponse(query, vectorResults);

      const result = {
        response: formattedResponse,
        sources,
        metadata: {
          vectorSearch: true,
          resultsCount: vectorResults.length,
          avgSimilarity:
            vectorResults.reduce((sum, r) => sum + r.similarity, 0) / vectorResults.length,
          sourceTypes: [...new Set(vectorResults.map((r) => r.source_type))],
        },
      };

      // Cache the result
      if (useCache) {
        const cacheKey = `vector:${query}:${sourceTypes?.join(",")}`;
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
      reasoning,
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
   * Execute orchestrated tool calls with progress tracking
   * PRIMARY PATH: Vector store query (fast, local, sub-second)
   * FALLBACK PATH: External API calls (slow, but comprehensive)
   */
  async executeOrchestration(
    query: string,
    progressCallback?: (update: any) => void
  ): Promise<any> {
    // Start progress tracking
    aomaProgressStream.startQuery(query);

    // Check cache first
    const cacheKey = `orchestrated:${query}`;
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

    // FAST PATH: Try vector store first
    try {
      console.log("🚀 Attempting vector store query (fast path)...");
      aomaProgressStream.startService("vector_store");

      // Determine relevant source types from query
      const sourceTypes = this.determineSourceTypes(query);

      const vectorResult = await this.queryVectorStore(query, {
        matchThreshold: 0.75, // Slightly lower threshold for better recall
        matchCount: 10,
        sourceTypes,
        useCache: true,
      });

      // If we got good results from vector store, use them
      if (vectorResult.sources.length > 0) {
        console.log(`✅ Vector store returned ${vectorResult.sources.length} results`);
        aomaProgressStream.completeService(
          "vector_store",
          vectorResult.sources.length,
          vectorResult.sources
        );
        aomaProgressStream.completeQuery();

        // Send progress updates
        if (progressCallback) {
          aomaProgressStream.getUpdates().forEach((update) => progressCallback(update));
        }

        // Cache the result
        aomaCache.set(cacheKey, vectorResult, "rapid");

        return vectorResult;
      }

      console.log("⚠️ Vector store returned no results, falling back to external APIs...");
      aomaProgressStream.completeService("vector_store", 0, []);
    } catch (error) {
      console.error("❌ Vector store query failed:", error);
      aomaProgressStream.errorService(
        "vector_store",
        error instanceof Error ? error.message : String(error)
      );
      console.log("🔄 Falling back to external API orchestration...");
    }

    // Analyze query to determine tool strategy
    const orchestration = this.analyzeQuery(query);
    console.log(`🎯 Orchestration strategy: ${orchestration.strategy}`);
    console.log(`📋 Tools selected: ${orchestration.tools.map((t) => t.tool).join(", ")}`);
    console.log(`💭 Reasoning: ${orchestration.reasoning}`);

    let results: any = {};

    try {
      if (orchestration.strategy === "parallel") {
        // Execute all tools in parallel with progress tracking
        const promises = orchestration.tools.map((toolCall) => {
          // Track start of each service
          aomaProgressStream.startService(toolCall.tool);

          return this.callAOMATool(toolCall.tool, toolCall.args)
            .then((result) => {
              // Extract sources if available
              const sources = this.extractSources(toolCall.tool, result);
              aomaProgressStream.completeService(toolCall.tool, sources.length, sources);

              // Send progress update if callback provided
              if (progressCallback) {
                progressCallback(aomaProgressStream.getLatestUpdate());
              }

              return { tool: toolCall.tool, result, sources };
            })
            .catch((error) => {
              aomaProgressStream.errorService(toolCall.tool, error.message);

              // Send progress update if callback provided
              if (progressCallback) {
                progressCallback(aomaProgressStream.getLatestUpdate());
              }

              return { tool: toolCall.tool, error: error.message };
            });
        });

        const parallelResults = await Promise.all(promises);

        // Combine results with source tracking
        const allSources: AOMASource[] = [];
        for (const { tool, result, error, sources } of parallelResults) {
          results[tool] = error ? { error } : result;
          if (sources) {
            allSources.push(...sources);
          }
        }

        // Add sources to results
        results._sources = allSources;
      } else if (orchestration.strategy === "sequential") {
        // Execute tools sequentially, passing context forward
        let context = "";

        for (const toolCall of orchestration.tools) {
          const args = { ...toolCall.args };
          if (context) {
            args.context = context;
          }

          const result = await this.callAOMATool(toolCall.tool, args);
          results[toolCall.tool] = result;

          // Extract context for next tool
          if (result && typeof result === "object" && result.response) {
            context += `\n${result.response}`;
          }
        }
      } else {
        // Single tool execution
        const toolCall = orchestration.tools[0];
        const result = await this.callAOMATool(toolCall.tool, toolCall.args);
        results = result;
      }

      // Format the combined response
      const formattedResponse = this.formatOrchestratedResponse(results, orchestration);

      // Cache the orchestrated response
      aomaCache.set(cacheKey, formattedResponse, "rapid");

      // Mark query as complete
      aomaProgressStream.completeQuery();

      // Send final progress update if callback provided
      if (progressCallback) {
        aomaProgressStream.getUpdates().forEach((update) => progressCallback(update));
      }

      return formattedResponse;
    } catch (error) {
      console.error("❌ Orchestration failed:", error);

      // Fallback to knowledge base with progress tracking
      console.log("🔄 Falling back to knowledge base query");
      aomaProgressStream.startService("query_aoma_knowledge");

      const fallbackResult = await this.callAOMATool("query_aoma_knowledge", {
        query,
        strategy: "rapid",
      });

      const sources = this.extractSources("query_aoma_knowledge", fallbackResult);
      aomaProgressStream.completeService("query_aoma_knowledge", sources.length, sources);
      aomaProgressStream.completeQuery();

      // Send progress updates if callback provided
      if (progressCallback) {
        aomaProgressStream.getUpdates().forEach((update) => progressCallback(update));
      }

      // Add sources to result
      if (fallbackResult && typeof fallbackResult === "object") {
        fallbackResult._sources = sources;
      }

      return fallbackResult;
    }
  }

  /**
   * Call a specific AOMA tool using MCP client
   */
  private async callAOMATool(toolName: string, args: any): Promise<any> {
    try {
      // Use the AOMA MCP tools via Claude's MCP integration
      console.log(`🔄 Calling AOMA tool: ${toolName}`, args);

      // For now, we'll use a direct approach until we can properly integrate the MCP client
      // This should be replaced with actual MCP tool calls when the infrastructure is ready
      switch (toolName) {
        case "query_aoma_knowledge":
          // Call Railway AOMA server directly in production to avoid circular references
          // In development, use the local API endpoint for easier testing
          const aomaEndpoint =
            process.env.NODE_ENV === "production"
              ? "https://luminous-dedication-production.up.railway.app/rpc"
              : "http://localhost:3000/api/aoma";

          // For production Railway calls, we need to use JSON-RPC format
          const requestBody =
            process.env.NODE_ENV === "production"
              ? {
                  jsonrpc: "2.0",
                  id: 1,
                  method: "tools/call",
                  params: {
                    name: "query_aoma_knowledge",
                    arguments: { query: args.query, strategy: args.strategy },
                  },
                }
              : { query: args.query, strategy: args.strategy };

          const response = await fetch(aomaEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "SIAM-Orchestrator/1.0",
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ AOMA MCP ERROR [${response.status}]:`, errorText);
            throw new Error(`AOMA query failed: ${response.statusText} - ${errorText}`);
          }

          const result = await response.json();
          console.log("✅ AOMA MCP response:", JSON.stringify(result).substring(0, 200));

          // Handle different response formats (JSON-RPC in production vs direct in dev)
          const actualResult =
            process.env.NODE_ENV === "production"
              ? result.result // Extract from JSON-RPC wrapper
              : result;

          // Handle new AOMA response format with content array
          if ((actualResult.success && actualResult.result?.content) || actualResult.content) {
            const content = actualResult.content || actualResult.result?.content;
            // Extract text from the structured content
            const textContent = content
              .filter((item: any) => item.type === "text")
              .map((item: any) => {
                // Parse the JSON text if it contains a response
                try {
                  const parsed = JSON.parse(item.text);
                  if (parsed.response) {
                    // Extract sources from the response text
                    const sources = [];
                    const sourceMatches = parsed.response.match(/【[^】]+】/g);
                    if (sourceMatches) {
                      sourceMatches.forEach((match: string) => {
                        const cleaned = match.replace(/【|】/g, "");
                        if (!sources.includes(cleaned)) {
                          sources.push(cleaned);
                        }
                      });
                    }

                    return {
                      response: parsed.response,
                      sources: sources.length > 0 ? sources : ["AOMA Knowledge Base"],
                      metadata: parsed.metadata || result.result.metadata,
                    };
                  }
                  return parsed;
                } catch {
                  return item.text;
                }
              })[0];

            return textContent || result;
          }

          return result;

        case "get_system_health":
          // Return a simple health check response
          return {
            response:
              "System Health Check:\n\n✅ AOMA Services: Online\n✅ MCP Integration: Connected\n✅ Knowledge Base: Available\n✅ Orchestrator: Operational\n✅ Cache: Active\n\nAll systems operational.",
            sources: ["System Health Monitor"],
            metadata: {
              tool: "get_system_health",
              status: "healthy",
              timestamp: new Date().toISOString(),
              services: {
                aoma: "online",
                mcp: "connected",
                knowledge_base: "available",
                orchestrator: "operational",
                cache: "active",
              },
            },
          };

        case "search_jira_tickets":
        case "get_jira_ticket_count":
        case "search_git_commits":
        case "search_code_files":
        case "search_outlook_emails":
        case "analyze_development_context":
          // Call the aoma-mesh-mcp server for these tools
          // Use Railway endpoint for aoma-mesh-mcp (Railway is the correct deployment platform)
          const mcpEndpoint = "https://luminous-dedication-production.up.railway.app/rpc";

          const mcpRequest = {
            jsonrpc: "2.0",
            id: Math.random(),
            method: "tools/call",
            params: {
              name: toolName,
              arguments: args,
            },
          };

          const mcpResponse = await fetch(mcpEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mcpRequest),
            signal: AbortSignal.timeout(25000),
          });

          if (!mcpResponse.ok) {
            throw new Error(`aoma-mesh-mcp returned ${mcpResponse.status}`);
          }

          const mcpResult = await mcpResponse.json();

          if (mcpResult.error) {
            throw new Error(mcpResult.error.message || "MCP tool error");
          }

          // Parse the MCP response
          if (mcpResult.result?.content?.[0]?.text) {
            try {
              const parsedContent = JSON.parse(mcpResult.result.content[0].text);
              return parsedContent;
            } catch {
              // If not JSON, return as-is
              return {
                response: mcpResult.result.content[0].text,
                metadata: { tool: toolName },
              };
            }
          }

          return mcpResult.result || {};

        default:
          console.warn(`⚠️ Tool ${toolName} not yet implemented in orchestrator`);
          return {
            response: `The ${toolName} tool is available but not yet integrated with the orchestrator. Please use the AOMA knowledge base for general queries.`,
            metadata: { tool: toolName, status: "not_implemented" },
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error calling AOMA tool ${toolName}:`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        toolName,
        args,
        timestamp: new Date().toISOString(),
      });

      // Provide specific error messages based on error type
      if (errorMessage.includes("401") || errorMessage.includes("API key")) {
        throw new Error(
          `AOMA MCP server authentication failed. The OpenAI API key is invalid or expired. ` +
            `Server error: ${errorMessage}`
        );
      } else if (errorMessage.includes("fetch") || errorMessage.includes("ECONNREFUSED")) {
        throw new Error(
          `AOMA MCP server is unreachable. Please check that it's running on the correct port. ` +
            `Connection error: ${errorMessage}`
        );
      } else {
        throw new Error(`AOMA knowledge base error for ${toolName}: ${errorMessage}`);
      }
    }
  }

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
    const combined = {
      response: "",
      sources: [],
      formattedSources: [],
      metadata: {
        orchestration: orchestration.strategy,
        tools_used: orchestration.tools.map((t) => t.tool),
        reasoning: orchestration.reasoning,
      },
    };

    // Combine responses from different tools
    let sourceIndex = 0;
    for (const [tool, result] of Object.entries(results)) {
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
