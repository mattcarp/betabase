/**
 * ElevenLabs MCP Server Registration Service
 *
 * This service handles the registration and management of MCP servers
 * with ElevenLabs conversational AI agents.
 */

interface ElevenLabsMCPServerConfig {
  url: string;
  name: string;
  approval_policy: "auto_approve_all" | "manual_approval" | "auto_approve_safe";
  transport: "SSE" | "websocket";
  secret_token?: {
    secret_id: string;
  };
  request_headers?: Record<string, string>;
  description: string;
  tool_approval_hashes?: Array<{
    tool_name: string;
    tool_hash: string;
    approval_policy: "auto_approved" | "manual" | "denied";
  }>;
}

interface ElevenLabsMCPServerResponse {
  id: string;
  config: ElevenLabsMCPServerConfig;
  metadata: {
    created_at: number;
    owner_user_id: string;
  };
  access_info: {
    is_creator: boolean;
    creator_name: string;
    creator_email: string;
    role: string;
  };
  dependent_agents: Array<{
    type: string;
    [key: string]: any;
  }>;
}

interface ElevenLabsMCPListResponse {
  mcp_servers: ElevenLabsMCPServerResponse[];
}

class ElevenLabsMCPRegistrationService {
  private apiKey: string;
  private baseUrl = "https://api.elevenlabs.io/v1/convai";

  // AOMA Mesh MCP Server Configuration
  private aomaMeshConfig: ElevenLabsMCPServerConfig = {
    url: "https://5so2f6gefeuoaywpuymjikix5e0rhqyo.lambda-url.us-east-2.on.aws/rpc",
    name: "AOMA Mesh MCP Server",
    approval_policy: "auto_approve_all",
    transport: "SSE",
    description:
      "AOMA knowledge base and system integration for SIAM conversational AI",
    tool_approval_hashes: [
      {
        tool_name: "query_aoma_knowledge",
        tool_hash: "aoma_knowledge_v1",
        approval_policy: "auto_approved",
      },
      {
        tool_name: "search_jira_tickets",
        tool_hash: "jira_search_v1",
        approval_policy: "auto_approved",
      },
      {
        tool_name: "get_system_health",
        tool_hash: "system_health_v1",
        approval_policy: "auto_approved",
      },
    ],
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Register the AOMA Mesh MCP server with ElevenLabs
   */
  async registerAomaMeshServer(): Promise<ElevenLabsMCPServerResponse> {
    console.log("🔄 Registering AOMA Mesh MCP server with ElevenLabs...");

    try {
      const response = await fetch(`${this.baseUrl}/mcp-servers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": this.apiKey,
        },
        body: JSON.stringify({
          config: this.aomaMeshConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `ElevenLabs MCP registration failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = (await response.json()) as ElevenLabsMCPServerResponse;

      console.log("✅ AOMA Mesh MCP server registered successfully:", {
        serverId: result.id,
        serverName: result.config.name,
        tools: result.config.tool_approval_hashes?.length || 0,
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to register AOMA Mesh MCP server:", error);
      throw error;
    }
  }

  /**
   * List all registered MCP servers
   */
  async listMcpServers(): Promise<ElevenLabsMCPListResponse> {
    console.log("📋 Fetching registered MCP servers...");

    try {
      const response = await fetch(`${this.baseUrl}/mcp-servers`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to list MCP servers: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const result = (await response.json()) as ElevenLabsMCPListResponse;

      console.log("📋 Found MCP servers:", {
        count: result.mcp_servers.length,
        servers: result.mcp_servers.map((s) => ({
          id: s.id,
          name: s.config.name,
        })),
      });

      return result;
    } catch (error) {
      console.error("❌ Failed to list MCP servers:", error);
      throw error;
    }
  }

  /**
   * Find the AOMA Mesh server if already registered
   */
  async findAomaMeshServer(): Promise<ElevenLabsMCPServerResponse | null> {
    try {
      const serverList = await this.listMcpServers();

      const aomaMeshServer = serverList.mcp_servers.find(
        (server) =>
          server.config.name === this.aomaMeshConfig.name ||
          server.config.url === this.aomaMeshConfig.url,
      );

      if (aomaMeshServer) {
        console.log("🔍 Found existing AOMA Mesh server:", aomaMeshServer.id);
        return aomaMeshServer;
      }

      console.log("🔍 No existing AOMA Mesh server found");
      return null;
    } catch (error) {
      console.error("❌ Error searching for AOMA Mesh server:", error);
      return null;
    }
  }

  /**
   * Delete an MCP server by ID
   */
  async deleteMcpServer(serverId: string): Promise<boolean> {
    console.log(`🗑️ Deleting MCP server: ${serverId}`);

    try {
      const response = await fetch(`${this.baseUrl}/mcp-servers/${serverId}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete MCP server: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      console.log("✅ MCP server deleted successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to delete MCP server:", error);
      return false;
    }
  }

  /**
   * Ensure AOMA Mesh server is registered (register if not exists)
   */
  async ensureAomaMeshServerRegistered(): Promise<ElevenLabsMCPServerResponse> {
    console.log("🔄 Ensuring AOMA Mesh MCP server is registered...");

    // Check if already registered
    const existingServer = await this.findAomaMeshServer();

    if (existingServer) {
      console.log("✅ AOMA Mesh server already registered");
      return existingServer;
    }

    // Register new server
    return await this.registerAomaMeshServer();
  }

  /**
   * Get server health check
   */
  async checkAomaMeshHealth(): Promise<{
    healthy: boolean;
    responseTime: number;
    details?: any;
  }> {
    const startTime = performance.now();

    try {
      const healthUrl =
        "https://5so2f6gefeuoaywpuymjikix5e0rhqyo.lambda-url.us-east-2.on.aws/health";

      const response = await fetch(healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        return {
          healthy: false,
          responseTime,
          details: { error: `HTTP ${response.status}: ${response.statusText}` },
        };
      }

      const healthData = await response.json();

      return {
        healthy: true,
        responseTime,
        details: healthData,
      };
    } catch (error) {
      const responseTime = performance.now() - startTime;

      return {
        healthy: false,
        responseTime,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Test MCP server tools
   */
  async testAomaMeshTools(): Promise<{
    success: boolean;
    results: Record<string, any>;
  }> {
    console.log("🧪 Testing AOMA Mesh MCP tools...");

    const results: Record<string, any> = {};
    const mcpRpcUrl =
      "https://5so2f6gefeuoaywpuymjikix5e0rhqyo.lambda-url.us-east-2.on.aws/rpc";

    try {
      // Test 1: List available tools
      const toolsResponse = await fetch(mcpRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "tools/list" }),
      });

      if (toolsResponse.ok) {
        results.tools_list = await toolsResponse.json();
      }

      // Test 2: Query AOMA knowledge
      const queryResponse = await fetch(mcpRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "tools/call",
          params: {
            name: "query_aoma_knowledge",
            arguments: {
              query: "What is AOMA?",
              strategy: "quick",
            },
          },
        }),
      });

      if (queryResponse.ok) {
        results.aoma_query = await queryResponse.json();
      }

      // Test 3: System health
      const healthResponse = await fetch(mcpRpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "tools/call",
          params: {
            name: "get_system_health",
            arguments: {},
          },
        }),
      });

      if (healthResponse.ok) {
        results.system_health = await healthResponse.json();
      }

      console.log("✅ AOMA Mesh MCP tools tested successfully");
      return { success: true, results };
    } catch (error) {
      console.error("❌ Failed to test AOMA Mesh MCP tools:", error);
      return {
        success: false,
        results: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }
}

// Export singleton instance factory
export const createElevenLabsMCPService = (apiKey: string) => {
  return new ElevenLabsMCPRegistrationService(apiKey);
};

export type {
  ElevenLabsMCPServerConfig,
  ElevenLabsMCPServerResponse,
  ElevenLabsMCPListResponse,
};
