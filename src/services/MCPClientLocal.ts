/**
 * Local MCP Client for SIAM Development
 * Uses Next.js API routes as proxy to AOMA MCP functionality
 */

import { MCPTool, MCPResponse, MCPState } from "./MCPClientWrapper";

export class MCPClientLocal {
  private baseUrl: string;
  private state: MCPState = {
    isConnected: false,
    isConnecting: false,
    error: null,
    tools: [],
    connectionQuality: "disconnected",
    retryCount: 0,
    isLambda: false,
    authEnabled: false,
  };

  constructor(baseUrl: string = "http://localhost:3000/api/aoma-mcp") {
    this.baseUrl = baseUrl;
  }

  async connect(): Promise<boolean> {
    this.state.isConnecting = true;
    this.state.error = null;

    try {
      console.log("🔌 Connecting to local AOMA MCP proxy...");

      // Test health endpoint
      const healthResponse = await this.makeRequest("health");
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // Load tools
      const toolsResponse = await this.makeRequest("tools/list");
      if (!toolsResponse.ok) {
        throw new Error(`Tools list failed: ${toolsResponse.status}`);
      }

      const toolsData = await toolsResponse.json();
      this.state.tools = toolsData.tools || [];
      this.state.isConnected = true;
      this.state.isConnecting = false;
      this.state.connectionQuality = "excellent";

      console.log(`✅ Connected to local AOMA MCP proxy with ${this.state.tools.length} tools`);
      return true;
    } catch (error) {
      console.error("❌ Failed to connect to local AOMA MCP proxy:", error);
      this.state.isConnecting = false;
      this.state.error = error instanceof Error ? error.message : "Connection failed";
      this.state.connectionQuality = "disconnected";
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.state.isConnected = false;
    this.state.error = null;
    this.state.connectionQuality = "disconnected";
    console.log("🔌 Disconnected from local AOMA MCP proxy");
  }

  async callTool(name: string, args: any = {}): Promise<MCPResponse> {
    if (!this.state.isConnected) {
      return {
        success: false,
        error: "Not connected to local AOMA MCP proxy",
      };
    }

    try {
      const startTime = Date.now();
      const response = await this.makeRequest("tools/call", {
        tool: name,
        args,
      });

      if (!response.ok) {
        throw new Error(`Tool call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: data.data || data,
        metadata: {
          responseTime,
          retryCount: 0,
          serverHealth: this.state.connectionQuality,
          isLambda: false,
          authMethod: "none",
        },
      };
    } catch (error) {
      console.error(`❌ Tool call ${name} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Tool call failed",
        metadata: {
          responseTime: 0,
          retryCount: 0,
          serverHealth: this.state.connectionQuality,
          isLambda: false,
          authMethod: "none",
        },
      };
    }
  }

  getState(): MCPState {
    return { ...this.state };
  }

  getTools(): MCPTool[] {
    return this.state.tools;
  }

  isAvailable(): boolean {
    return true; // Always available for local development
  }

  async checkHealth(): Promise<any> {
    try {
      const response = await this.makeRequest("health");
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      const data = await response.json();
      return {
        status: "healthy",
        latency: 0,
        uptime: data.metrics?.uptime || 0,
        services: data.services || {},
        environment: "local",
      };
    } catch (error) {
      return null;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.state.isConnected,
      quality: this.state.connectionQuality || "disconnected",
      lastHealthCheck: new Date(),
      tools: this.state.tools.length,
      error: this.state.error,
      environment: "local" as const,
      endpoint: this.baseUrl,
      authEnabled: false,
      authMethod: "none" as const,
    };
  }

  private async makeRequest(action: string, body?: any): Promise<Response> {
    const requestBody = body ? { action, ...body } : { action };

    return fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  }
}

// Export singleton for local development
export const mcpClientLocal = new MCPClientLocal();
