/**
 * AOMA Orchestrator Service
 * Intelligently routes queries to appropriate AOMA-mesh-mcp LangChain agents
 * Enables full utilization of all orchestrated resources
 */

import { aomaCache } from "./aomaCache";

// Available AOMA-mesh-mcp tools and their capabilities
const AOMA_TOOLS = {
  query_aoma_knowledge: {
    description: "Query Sony Music AOMA knowledge base for general information",
    keywords: [
      "what is",
      "explain",
      "tell me about",
      "how does",
      "aoma",
      "usm",
      "dam",
      "metadata",
    ],
    priority: 1,
  },
  search_jira_tickets: {
    description: "Search Jira for tickets, issues, bugs, features",
    keywords: [
      "jira",
      "ticket",
      "issue",
      "bug",
      "feature",
      "task",
      "story",
      "epic",
    ],
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
      "git",
      "changes",
      "history",
      "who changed",
      "when was",
      "modified",
    ],
    priority: 3,
  },
  search_code_files: {
    description: "Search through code files and repositories",
    keywords: [
      "code",
      "file",
      "function",
      "class",
      "implementation",
      "source",
      "repository",
    ],
    priority: 3,
  },
  search_outlook_emails: {
    description: "Search Outlook emails and communications",
    keywords: [
      "email",
      "outlook",
      "message",
      "communication",
      "sent",
      "received",
      "mail",
    ],
    priority: 4,
  },
  analyze_development_context: {
    description: "Analyze development context and provide insights",
    keywords: [
      "analyze",
      "context",
      "development",
      "insight",
      "assessment",
      "review",
    ],
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
  /**
   * Analyze query to determine which tools to call
   */
  private analyzeQuery(query: string): OrchestrationResult {
    const lowerQuery = query.toLowerCase();
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
    const sortedTools = Array.from(toolScores.entries()).sort(
      (a, b) => b[1] - a[1],
    );

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
      reasoning =
        "No specific tool keywords found, defaulting to knowledge base";
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
   * Execute orchestrated tool calls
   */
  async executeOrchestration(query: string): Promise<any> {
    // Check cache first
    const cacheKey = `orchestrated:${query}`;
    const cached = aomaCache.get(cacheKey, "rapid");
    if (cached) {
      console.log("⚡ Returning cached orchestrated response");
      return cached;
    }

    // Analyze query to determine tool strategy
    const orchestration = this.analyzeQuery(query);
    console.log(`🎯 Orchestration strategy: ${orchestration.strategy}`);
    console.log(
      `📋 Tools selected: ${orchestration.tools.map((t) => t.tool).join(", ")}`,
    );
    console.log(`💭 Reasoning: ${orchestration.reasoning}`);

    let results: any = {};

    try {
      if (orchestration.strategy === "parallel") {
        // Execute all tools in parallel
        const promises = orchestration.tools.map((toolCall) =>
          this.callAOMATool(toolCall.tool, toolCall.args)
            .then((result) => ({ tool: toolCall.tool, result }))
            .catch((error) => ({ tool: toolCall.tool, error: error.message })),
        );

        const parallelResults = await Promise.all(promises);

        // Combine results
        for (const { tool, result, error } of parallelResults) {
          results[tool] = error ? { error } : result;
        }
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
      const formattedResponse = this.formatOrchestratedResponse(
        results,
        orchestration,
      );

      // Cache the orchestrated response
      aomaCache.set(cacheKey, formattedResponse, "rapid");

      return formattedResponse;
    } catch (error) {
      console.error("❌ Orchestration failed:", error);

      // Fallback to knowledge base
      console.log("🔄 Falling back to knowledge base query");
      return this.callAOMATool("query_aoma_knowledge", {
        query,
        strategy: "rapid",
      });
    }
  }

  /**
   * Call a specific AOMA tool
   */
  private async callAOMATool(toolName: string, args: any): Promise<any> {
    const railwayUrl =
      process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ||
      "https://aoma-mesh-mcp.onrender.com";

    const rpcPayload = {
      jsonrpc: "2.0",
      id: Math.random(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    try {
      const response = await fetch(`${railwayUrl}/rpc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rpcPayload),
        signal: AbortSignal.timeout(25000),
      });

      if (!response.ok) {
        throw new Error(`Tool ${toolName} failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      if (data.result?.content?.[0]?.text) {
        try {
          return JSON.parse(data.result.content[0].text);
        } catch {
          return data.result.content[0].text;
        }
      }

      return data.result;
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      throw error;
    }
  }

  /**
   * Format orchestrated responses into a coherent answer
   */
  private formatOrchestratedResponse(
    results: any,
    orchestration: OrchestrationResult,
  ): any {
    if (orchestration.strategy === "single") {
      return results;
    }

    // For multi-tool responses, combine intelligently
    const combined = {
      response: "",
      sources: [],
      metadata: {
        orchestration: orchestration.strategy,
        tools_used: orchestration.tools.map((t) => t.tool),
        reasoning: orchestration.reasoning,
      },
    };

    // Combine responses from different tools
    for (const [tool, result] of Object.entries(results)) {
      if (result && typeof result === "object") {
        if (result.error) {
          continue; // Skip failed tools
        }

        if (result.response) {
          combined.response += `\n\n[${tool}]:\n${result.response}`;
        }

        if (result.sources) {
          combined.sources.push(...result.sources);
        }
      }
    }

    if (!combined.response) {
      combined.response =
        "Unable to retrieve information from the requested sources.";
    }

    return combined;
  }
}

// Export singleton instance
export const aomaOrchestrator = new AOMAOrchestrator();
