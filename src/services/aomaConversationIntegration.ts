/**
 * AOMA Conversation Integration Service
 *
 * Integrates AOMA Mesh MCP server directly into SIAM's conversation flow.
 * When users ask questions about AOMA, Sony Music, or related topics,
 * this service queries the AOMA knowledge base and provides contextual responses.
 */

interface AOMAResponse {
  query: string;
  response: string;
  metadata: {
    strategy: string;
    resultsCount: number;
    processingTime: number;
    confidence?: number;
    context?: string;
    suggestions?: string;
  };
}

interface AomaIntegrationConfig {
  serverUrl: string;
  rpcUrl: string;
  healthUrl: string;
  enableAutoQuery: boolean;
  confidenceThreshold: number;
  queryTimeout: number;
}

// Add this helper function before the class
async function retryFetch(
  url: string,
  options: RequestInit,
  retries = 3,
  backoff = 300
): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error as Error;
      await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, i)));
    }
  }
  throw lastError || new Error("Fetch failed after retries");
}

class AomaConversationIntegration {
  private config: AomaIntegrationConfig;
  private healthyStatus = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;

  // Keywords that trigger AOMA queries
  private readonly AOMA_KEYWORDS = [
    "aoma",
    "sony music",
    "asset management",
    "digital asset",
    "music asset",
    "content management",
    "DAM system",
    "sony",
    "music catalog",
    "metadata",
    "asset workflow",
    "music publishing",
    "rights management",
    "audio export",
    "music distribution",
    "content delivery",
    "usm",
    "universal state management",
    "ci",
    "sony ci",
    "media batch",
    "immersive audio",
    "track linking",
  ];

  constructor(config?: Partial<AomaIntegrationConfig>) {
    // Handle import.meta.env availability (not available in Node.js tests)
    const getEnvVar = (key: string, defaultValue: string | boolean): string | boolean => {
      try {
        return process.env[`NEXT_PUBLIC_${key}`] ?? process.env[key] ?? defaultValue;
      } catch {
        return defaultValue;
      }
    };

    // Use environment variables with Railway fallback
    const baseUrl = getEnvVar(
      "NEXT_PUBLIC_AOMA_MESH_SERVER_URL",
      "https://luminous-dedication-production.up.railway.app"
    ) as string;

    this.config = {
      serverUrl: baseUrl,
      rpcUrl: `${baseUrl}/rpc`,
      healthUrl: `${baseUrl}/api/health`,
      enableAutoQuery: getEnvVar("NEXT_PUBLIC_ENABLE_MCP_INTEGRATION", true) !== "false",
      confidenceThreshold: 0.7,
      queryTimeout: 25000, // Increase timeout to 25 seconds to account for slow OpenAI responses
      ...config,
    };

    // Only start health monitoring if integration is enabled
    if (this.config.enableAutoQuery) {
      console.log("🔍 Starting AOMA health monitoring with config:", this.config);
      this.startHealthMonitoring();
    }
  }

  /**
   * Check if a user query should trigger an AOMA search
   */
  shouldQueryAoma(userInput: string): boolean {
    if (!this.config.enableAutoQuery) {
      return false;
    }

    // Always query AOMA - let the MCP server determine relevance
    // The server will return null/empty if no relevant knowledge exists
    console.log("🔍 Querying AOMA for all inputs - server will determine relevance:", userInput);

    return true;
  }

  /**
   * Process user input and determine if it needs AOMA context
   */
  async processUserInput(userInput: string): Promise<{
    needsAomaContext: boolean;
    aomaResponse?: AOMAResponse;
    enhancedPrompt?: string;
  }> {
    try {
      if (!this.shouldQueryAoma(userInput)) {
        return { needsAomaContext: false };
      }

      console.log("🔍 AOMA query triggered for:", userInput);

      // Query AOMA knowledge base
      const aomaResponse = await this.queryAomaKnowledge(userInput);

      if (!aomaResponse) {
        return { needsAomaContext: false };
      }

      // Create enhanced prompt with AOMA context
      const enhancedPrompt = this.createEnhancedPrompt(userInput, aomaResponse);

      return {
        needsAomaContext: true,
        aomaResponse,
        enhancedPrompt,
      };
    } catch (error) {
      console.error("Error processing AOMA context:", error);
      return { needsAomaContext: false };
    }
  }

  /**
   * Query the AOMA knowledge base
   */
  async queryAomaKnowledge(
    query: string,
    strategy: "comprehensive" | "focused" | "rapid" = "focused"
  ): Promise<AOMAResponse | null> {
    try {
      const startTime = performance.now();

      // Always use local API proxy for browser compatibility (avoids CORS issues)
      console.log("🔍 Using local AOMA MCP proxy for browser compatibility");
      return this.queryAomaLocal(query, strategy);

      console.log("🔍 Making AOMA query:", {
        url: this.config.rpcUrl,
        query,
        strategy,
        threshold: this.config.confidenceThreshold,
        timeout: this.config.queryTimeout,
      });

      const rpcPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: {
            query,
            strategy,
            threshold: this.config.confidenceThreshold,
          },
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.queryTimeout);

      const response = await retryFetch(`${this.config.rpcUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("🔍 AOMA response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new Error(`AOMA query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔍 Raw server response:", data);

      if (!data.result?.content?.[0]?.text) {
        console.log("🔍 No content in server response");
        return null;
      }

      const parsedContent = JSON.parse(data.result.content[0].text);
      console.log("🔍 Parsed content:", parsedContent);

      if (!parsedContent.response) {
        console.log("🔍 No response field in parsed content");
        return null;
      }

      // Clean up citation formatting
      let cleanedResponse = parsedContent.response;

      // Convert raw filename citations to readable format
      cleanedResponse = cleanedResponse.replace(
        /\[(\d+):(\d+)([^[\]]*\.(?:md|txt|pdf|doc|docx))\]/g,
        "[[Source $1]($3)]"
      );

      // Clean up any remaining ugly formatting
      cleanedResponse = cleanedResponse.replace(/\*\*([^*]+):\*\*/g, "**$1:**");

      return {
        query,
        response: cleanedResponse,
        metadata: {
          strategy: parsedContent.strategy || strategy,
          resultsCount: parsedContent.metadata?.resultsCount || 1,
          processingTime: performance.now() - startTime,
          confidence: parsedContent.metadata?.confidence || 90,
          context: parsedContent.metadata?.context,
          suggestions: parsedContent.metadata?.suggestions,
        },
      };
    } catch (error) {
      console.error("AOMA query failed:", error);
      return null;
    }
  }

  /**
   * Query AOMA using local development proxy
   */
  private async queryAomaLocal(
    query: string,
    strategy: "comprehensive" | "focused" | "rapid" = "focused"
  ): Promise<AOMAResponse | null> {
    try {
      const startTime = performance.now();

      const response = await fetch("/api/aoma-mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "tools/call",
          tool: "query_aoma_knowledge",
          args: {
            query,
            strategy,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Local AOMA query failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("🔍 Local AOMA response:", data);

      if (!data.success || !data.data) {
        console.log("🔍 No valid response from local AOMA proxy");
        return null;
      }

      return {
        query,
        response: data.data.result || `Local development response for: ${query}`,
        metadata: {
          strategy,
          resultsCount: 1,
          processingTime: performance.now() - startTime,
          confidence: 85,
          context: "Local development mode",
          suggestions: "This is a mock response for development",
        },
      };
    } catch (error) {
      console.error("Local AOMA query failed:", error);
      return null;
    }
  }

  /**
   * Create an enhanced prompt with AOMA context
   */
  private createEnhancedPrompt(originalQuery: string, aomaData: AOMAResponse): string {
    return `User Query: "${originalQuery}"

AOMA Knowledge Context:
${aomaData.response}

Instructions: Use the AOMA knowledge context above to provide a comprehensive and accurate response to the user's query. Focus on Sony Music's AOMA system capabilities, workflows, and best practices as described in the context. If the user is asking about technical details, asset management, or operational procedures, reference the specific information provided.

Please respond naturally and conversationally, incorporating the AOMA context where relevant to give the user the most helpful and accurate information about Sony Music's digital asset management system.`;
  }

  /**
   * Get system health status
   * NOTE: Browser-based CORS-compliant health check
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    details?: any;
    responseTime?: number;
  }> {
    try {
      console.log("🔍 AOMA Health Check: Starting check to", this.config.healthUrl);
      const startTime = performance.now();

      // Add CORS-compliant headers for browser requests
      const response = await fetch(this.config.healthUrl, {
        method: "GET",
        mode: "cors", // Explicitly set CORS mode
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // Increase timeout for cross-origin requests
      });

      const responseTime = performance.now() - startTime;
      console.log("🔍 AOMA Health Check: Response received", {
        status: response.status,
        ok: response.ok,
        responseTime,
      });

      if (!response.ok) {
        console.log("🔍 AOMA Health Check: Response not OK, status:", response.status);
        // For CORS errors, treat as "server exists but not accessible from browser"
        return {
          healthy: false,
          responseTime,
          details: {
            status: response.status,
            message:
              response.status === 403
                ? "Server accessible but requires authentication"
                : "Server not accessible",
          },
        };
      }

      const healthData = await response.json();
      const healthy = healthData.status === "healthy"; // Only accept fully healthy, not degraded
      console.log("🔍 AOMA Health Check: Data parsed", {
        healthy,
        healthData,
        serverStatus: healthData.status,
      });

      // If server is degraded (can't reach OpenAI/Supabase), it's useless
      if (healthData.status === "degraded") {
        console.log("🔍 AOMA Health Check: Server is degraded - marking as unhealthy");
        this.healthyStatus = false;
        return {
          healthy: false,
          details: healthData,
          responseTime: Math.round(responseTime),
        };
      }

      this.healthyStatus = healthy;
      this.lastHealthCheck = Date.now();

      return {
        healthy,
        details: healthData,
        responseTime: Math.round(responseTime),
      };
    } catch (error) {
      const errorObj = error as Error;
      console.log(
        "🔍 AOMA Health Check: Failed with error (expected for CORS)",
        errorObj.message || error
      );
      this.healthyStatus = false;
      this.consecutiveFailures++;

      // Determine if this is a CORS error or network error
      const isCorsError = errorObj.message && errorObj.message.includes("CORS");
      const isNetworkError = errorObj.name === "TypeError" && errorObj.message.includes("fetch");

      // For browser environments, CORS errors are expected when calling Lambda directly
      if (isCorsError || isNetworkError) {
        console.log(
          "🔍 AOMA Health Check: CORS error - Lambda server needs CORS headers for browser access"
        );
        return {
          healthy: false,
          details: {
            error: "CORS headers missing",
            message: "Lambda server needs CORS configuration for browser requests",
            serverUrl: this.config.healthUrl,
            fix: "Add Access-Control-Allow-Origin: * to Lambda responses",
          },
        };
      }

      // Only log unexpected errors for the first few failures to avoid spam
      if (this.consecutiveFailures <= this.maxConsecutiveFailures) {
        console.error("AOMA health check failed:", error);
      }

      return {
        healthy: false,
        details: { error: errorObj.message || "Unknown error" },
      };
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Initial health check
    this.checkHealth();

    // Periodic health checks
    setInterval(() => {
      this.checkHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Search JIRA tickets (additional capability)
   */
  async searchJiraTickets(query: string, projectKey?: string): Promise<any> {
    try {
      const response = await fetch(this.config.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.config.queryTimeout),
        body: JSON.stringify({
          method: "tools/call",
          params: {
            name: "search_jira_tickets",
            arguments: {
              query,
              projectKey,
              maxResults: 10,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`JIRA search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.result ? JSON.parse(data.result.content[0].text) : null;
    } catch (error) {
      console.error("JIRA search failed:", error);
      return null;
    }
  }

  /**
   * Get current status
   */
  getStatus(): {
    healthy: boolean;
    lastHealthCheck: Date;
    config: AomaIntegrationConfig;
  } {
    return {
      healthy: this.healthyStatus,
      lastHealthCheck: new Date(this.lastHealthCheck),
      config: this.config,
    };
  }
}

// Export singleton instance
export const aomaIntegration = new AomaConversationIntegration();

export type { AOMAResponse, AomaIntegrationConfig };
export { AomaConversationIntegration };
