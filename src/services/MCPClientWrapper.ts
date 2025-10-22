/**
 * MCP Client Wrapper for SIAM
 * Provides browser-safe abstraction over MCP functionality
 */

import { getMcpUrl, isMcpAuthEnabled } from "../config/apiKeys";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    responseTime?: number;
    retryCount?: number;
    serverHealth?: string;
  };
}

export interface MCPState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  tools: MCPTool[];
  lastHealthCheck?: Date;
  connectionQuality?: "excellent" | "good" | "poor" | "disconnected";
  retryCount?: number;
}

export interface MCPHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  uptime: number;
  services: Record<string, { status: boolean; latency: number }>;
  error?: string;
}

export class MCPClientWrapper {
  private state: MCPState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    tools: [],
    connectionQuality: "disconnected",
    retryCount: 0,
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second
  private baseUrl: string;
  private timeout = 15000; // 15 second timeout

  constructor() {
    this.baseUrl = getMcpUrl();
    console.log(`🔧 MCP Client: Using ${this.baseUrl}`);
  }

  /**
   * Create request headers
   */
  private createRequestHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "User-Agent": "SIAM-Desktop-Client/1.0",
    };
  }

  async connect(): Promise<boolean> {
    this.state.isConnecting = true;
    this.state.error = null;
    this.state.retryCount = 0;

    try {
      const startTime = Date.now();

      // First check server health
      console.log(`🔌 MCP Client: Connecting to MCP server at ${this.baseUrl}...`);
      const healthStatus = await this.checkHealth();
      if (!healthStatus || healthStatus.status === "unhealthy") {
        throw new Error("MCP server health check failed");
      }

      // Establish connection to MCP server
      const connectionResult = await this.establishConnection();

      this.state.isConnected = connectionResult;
      this.state.isConnecting = false;

      if (connectionResult) {
        this.state.connectionQuality = this.determineConnectionQuality(Date.now() - startTime);
        this.state.lastHealthCheck = new Date();

        // Start health monitoring
        this.startHealthMonitoring();

        console.log(`✅ MCP Client: Connected with ${this.state.connectionQuality} quality`);
        console.log(`🛠️ MCP Client: ${this.state.tools.length} tools available`);
      }

      return connectionResult;
    } catch (error) {
      this.state.isConnecting = false;
      this.state.error = error instanceof Error ? error.message : "Connection failed";
      this.state.connectionQuality = "disconnected";

      // Attempt automatic retry
      if (this.state.retryCount < this.maxRetries) {
        console.log(
          `🔄 MCP Client: Retrying connection (${this.state.retryCount + 1}/${this.maxRetries})...`
        );
        await this.delay(this.retryDelay * Math.pow(2, this.state.retryCount)); // Exponential backoff
        this.state.retryCount++;
        return this.connect();
      }

      console.error(`❌ MCP Client: Failed to connect after ${this.maxRetries} retries:`, error);
      return false;
    }
  }

  /**
   * Establish connection to MCP server
   */
  private async establishConnection(): Promise<boolean> {
    try {
      // Fetch available tools to verify connection
      const toolsResponse = await this.fetchTools();
      if (toolsResponse.success && toolsResponse.data) {
        this.state.tools = toolsResponse.data;
        return true;
      }

      throw new Error(toolsResponse.error || "Failed to fetch tools from MCP server");
    } catch (error) {
      console.error("❌ MCP connection failed:", error);
      this.state.error = error instanceof Error ? error.message : "Connection failed";
      return false;
    }
  }

  /**
   * Fetch available tools from MCP server
   */
  private async fetchTools(): Promise<MCPResponse> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // For local development, we should use the API route instead
      if (this.baseUrl.includes("localhost") || this.baseUrl.includes("127.0.0.1")) {
        // Use the local API route
        const apiResponse = await fetch("/api/aoma-mcp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "tools/list" }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!apiResponse.ok) {
          throw new Error(`API tools fetch failed: ${apiResponse.status}`);
        }

        const apiData = await apiResponse.json();
        return {
          success: true,
          data: apiData.tools || [],
          metadata: {
            responseTime: Date.now() - startTime,
          },
        };
      }

      // Use MCP RPC format for remote server
      const rpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      };

      const response = await fetch(`${this.baseUrl}/api/rpc`, {
        method: "POST",
        headers: this.createRequestHeaders(),
        body: JSON.stringify(rpcRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error details from response
        let errorDetails = "";
        try {
          const errorBody = await response.text();
          errorDetails = ` - ${errorBody}`;
        } catch (e) {
          // Ignore if can't read body
        }
        throw new Error(
          `Tools fetch failed: ${response.status} ${response.statusText}${errorDetails}`
        );
      }

      const rpcResponse = await response.json();

      // Check for RPC error
      if (rpcResponse.error) {
        throw new Error(`MCP RPC Error: ${rpcResponse.error.message || "Unknown error"}`);
      }

      // Extract tools from RPC response
      const tools = rpcResponse.result?.tools || [];
      return {
        success: true,
        data: tools,
        metadata: {
          responseTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const err = error as any;
      let errorMessage = error instanceof Error ? error.message : "Tools fetch failed";

      // Handle CORS errors specifically
      if (
        err.name === "TypeError" &&
        err.message &&
        (err.message.includes("Failed to fetch") || err.message.includes("CORS"))
      ) {
        errorMessage = `CORS error: Server at ${this.baseUrl} needs CORS headers for origin ${window.location.origin}`;
        console.error("❌ CORS Error Details:", {
          serverUrl: this.baseUrl,
          origin: window.location.origin,
          error: err.message,
          suggestion: "Server needs Access-Control-Allow-Origin header",
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async disconnect(): Promise<void> {
    // Cleanup health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.state.isConnected = false;
    this.state.error = null;
    this.state.connectionQuality = "disconnected";
    this.state.retryCount = 0;

    console.log(`🔌 MCP Client: Disconnected from MCP server`);
  }

  async callTool(name: string, args: any): Promise<MCPResponse> {
    return this.callMcpTool(name, args);
  }

  /**
   * Call tool on MCP server
   */
  private async callMcpTool(name: string, args: any): Promise<MCPResponse> {
    if (!this.state.isConnected) {
      return {
        success: false,
        error: "MCP client not connected to server",
        metadata: {
          retryCount: 0,
        },
      };
    }

    const startTime = Date.now();
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const requestBody = JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: {
            name: name,
            arguments: args || {},
          },
        });

        const response = await fetch(`${this.baseUrl}/api/rpc`, {
          method: "POST",
          headers: this.createRequestHeaders(),
          body: requestBody,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Tool call failed: ${response.status} ${response.statusText}`);
        }

        const rpcResponse = await response.json();
        const responseTime = Date.now() - startTime;

        // Check for RPC error
        if (rpcResponse.error) {
          throw new Error(`MCP RPC Error: ${rpcResponse.error.message || "Unknown error"}`);
        }

        return {
          success: true,
          data: rpcResponse.result,
          metadata: {
            responseTime,
            retryCount,
            serverHealth: this.state.connectionQuality,
          },
        };
      } catch (error) {
        retryCount++;

        if (retryCount <= this.maxRetries) {
          console.log(`🔄 MCP Tool ${name}: Retry ${retryCount}/${this.maxRetries}`);
          await this.delay(this.retryDelay * Math.pow(2, retryCount - 1));

          // Check if we need to reconnect
          if (!this.state.isConnected) {
            await this.connect();
          }
        } else {
          const responseTime = Date.now() - startTime;
          return {
            success: false,
            error: error instanceof Error ? error.message : "Tool call failed",
            metadata: {
              responseTime,
              retryCount: retryCount - 1,
              serverHealth: this.state.connectionQuality,
            },
          };
        }
      }
    }

    return {
      success: false,
      error: "Max retries exceeded",
      metadata: {
        retryCount: this.maxRetries,
      },
    };
  }

  getState(): MCPState {
    return { ...this.state };
  }

  getTools(): MCPTool[] {
    return this.state.tools;
  }

  isAvailable(): boolean {
    return true; // MCP is always available
  }

  /**
   * Check server health status
   */
  async checkHealth(): Promise<MCPHealthStatus | null> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: "GET",
        headers: this.createRequestHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const healthData = await response.json();
      const latency = Date.now() - startTime;

      this.state.lastHealthCheck = new Date();
      this.state.connectionQuality = this.determineConnectionQuality(latency);

      return {
        status: healthData.status === "healthy" ? "healthy" : "degraded",
        latency,
        uptime: healthData.metrics?.uptime || 0,
        services: healthData.services || {},
      };
    } catch (error) {
      // Handle CORS and network errors gracefully in browser context
      const err = error as any;
      const isCorsError = err.message && err.message.includes("CORS");
      const isNetworkError =
        err.name === "AbortError" || (err.name === "TypeError" && err.message.includes("fetch"));

      if (isCorsError || isNetworkError) {
        console.log("🔍 MCP Health Check: CORS/Network error (expected in browser)", err.message);
        this.state.connectionQuality = "poor";
        return {
          status: "degraded",
          latency: 0,
          uptime: 0,
          services: {},
          error: "CORS/Network restriction - server not accessible from browser",
        };
      }

      console.error("❌ MCP Health check failed:", error);
      this.state.connectionQuality = "poor";
      return null;
    }
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkHealth();
      if (!health || health.status === "unhealthy") {
        console.warn("⚠️ MCP Server health degraded, attempting reconnection...");
        if (this.state.isConnected) {
          this.state.isConnected = false;
          this.state.connectionQuality = "poor";
          // Attempt to reconnect
          this.connect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Determine connection quality based on latency
   */
  private determineConnectionQuality(
    latency: number
  ): "excellent" | "good" | "poor" | "disconnected" {
    if (latency < 100) return "excellent";
    if (latency < 500) return "good";
    if (latency < 2000) return "poor";
    return "disconnected";
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get detailed connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    quality: string;
    lastHealthCheck: Date | null;
    tools: number;
    error: string | null;
    endpoint: string;
  } {
    return {
      isConnected: this.state.isConnected,
      quality: this.state.connectionQuality || "disconnected",
      lastHealthCheck: this.state.lastHealthCheck || null,
      tools: this.state.tools.length,
      error: this.state.error,
      endpoint: this.baseUrl,
    };
  }
}

// Export a singleton instance
export const mcpClientWrapper = new MCPClientWrapper();

// Also export default for easier imports
export default MCPClientWrapper;
