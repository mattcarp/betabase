/**
 * ElevenLabs MCP Server Registration Service
 * Handles registration of external MCP servers with ElevenLabs and agent association
 */

import {
  getElevenLabsApiKey,
  getElevenLabsAgentId,
  getMcpLambdaUrl,
} from "../config/apiKeys";

export interface McpServerConfig {
  name: string;
  url: string;
  transport: "SSE" | "STREAMABLE_HTTP";
  description: string;
  tool_approval_mode?: "always_ask" | "fine_grained" | "no_approval";
}

export interface McpServerRegistrationResponse {
  id: string;
  name: string;
  url: string;
  transport: string;
  status: string;
  created_at: string;
}

export interface AgentAssociationResponse {
  agent_id: string;
  mcp_server_id: string;
  associated_at: string;
}

export interface McpRegistrationResult {
  success: boolean;
  serverId?: string;
  associated?: boolean;
  error?: string;
  details?: {
    registration?: McpServerRegistrationResponse;
    association?: AgentAssociationResponse;
  };
}

export class ElevenLabsMCPService {
  private apiKey: string;
  private agentId: string;
  private lambdaUrl: string;
  private baseUrl = "https://api.elevenlabs.io";

  constructor() {
    this.apiKey = getElevenLabsApiKey();
    this.agentId = getElevenLabsAgentId();
    this.lambdaUrl = getMcpLambdaUrl();

    if (!this.apiKey) {
      throw new Error("ElevenLabs API key not configured");
    }
    if (!this.agentId) {
      throw new Error("ElevenLabs Agent ID not configured");
    }
  }

  /**
   * Validate ElevenLabs API credentials
   */
  async validateCredentials(): Promise<{
    valid: boolean;
    error?: string;
    userInfo?: any;
  }> {
    try {
      console.log("🔐 Validating ElevenLabs API credentials...");

      const response = await fetch(`${this.baseUrl}/v1/user`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          valid: false,
          error: `API validation failed: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const userInfo = await response.json();
      console.log("✅ ElevenLabs API credentials validated successfully");

      return {
        valid: true,
        userInfo,
      };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : "Unknown validation error",
      };
    }
  }

  /**
   * Register the Lambda MCP server with ElevenLabs
   */
  async registerMcpServer(config?: Partial<McpServerConfig>): Promise<{
    success: boolean;
    serverId?: string;
    error?: string;
    response?: McpServerRegistrationResponse;
  }> {
    try {
      console.log("📝 Registering AOMA Mesh MCP server with ElevenLabs...");

      const serverConfig: McpServerConfig = {
        name: "AOMA Mesh MCP Server",
        url: `${this.lambdaUrl}/rpc`,
        transport: "STREAMABLE_HTTP",
        description:
          "Lambda-deployed MCP server for RAG, document ingestion, and AI-powered insights",
        tool_approval_mode: "fine_grained",
        ...config,
      };

      console.log(`🔗 Server URL: ${serverConfig.url}`);
      console.log(`🚀 Transport: ${serverConfig.transport}`);

      const response = await fetch(`${this.baseUrl}/v1/convai/mcp-servers`, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: serverConfig,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ MCP server registration failed:",
          response.status,
          errorText,
        );
        return {
          success: false,
          error: `Registration failed: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const registrationResponse: McpServerRegistrationResponse =
        await response.json();
      console.log("✅ MCP server registered successfully");
      console.log(`🆔 Server ID: ${registrationResponse.id}`);

      return {
        success: true,
        serverId: registrationResponse.id,
        response: registrationResponse,
      };
    } catch (error) {
      console.error("❌ MCP server registration error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown registration error",
      };
    }
  }

  /**
   * Associate the registered MCP server with the ElevenLabs agent
   */
  async associateWithAgent(serverId: string): Promise<{
    success: boolean;
    error?: string;
    response?: AgentAssociationResponse;
  }> {
    try {
      console.log(
        `🔗 Associating MCP server ${serverId} with agent ${this.agentId}...`,
      );

      const response = await fetch(
        `${this.baseUrl}/v1/convai/agents/${this.agentId}/mcp-servers`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mcp_server_id: serverId,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Agent association failed:",
          response.status,
          errorText,
        );
        return {
          success: false,
          error: `Association failed: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const associationResponse: AgentAssociationResponse =
        await response.json();
      console.log("✅ MCP server associated with agent successfully");

      return {
        success: true,
        response: associationResponse,
      };
    } catch (error) {
      console.error("❌ Agent association error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown association error",
      };
    }
  }

  /**
   * List existing MCP servers for the account
   */
  async listMcpServers(): Promise<{
    success: boolean;
    servers?: any[];
    error?: string;
  }> {
    try {
      console.log("📋 Listing existing MCP servers...");

      const response = await fetch(`${this.baseUrl}/v1/convai/mcp-servers`, {
        method: "GET",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to list servers: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const servers = await response.json();
      console.log(`✅ Found ${servers.length || 0} MCP servers`);

      return {
        success: true,
        servers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown list error",
      };
    }
  }

  /**
   * Get agent details and associated MCP servers
   */
  async getAgentDetails(): Promise<{
    success: boolean;
    agent?: any;
    error?: string;
  }> {
    try {
      console.log(`🤖 Getting agent details for ${this.agentId}...`);

      const response = await fetch(
        `${this.baseUrl}/v1/convai/agents/${this.agentId}`,
        {
          method: "GET",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to get agent details: ${response.status} ${response.statusText} - ${errorText}`,
        };
      }

      const agent = await response.json();
      console.log("✅ Agent details retrieved successfully");

      return {
        success: true,
        agent,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown agent details error",
      };
    }
  }

  /**
   * Complete end-to-end MCP server registration and agent association
   */
  async completeRegistration(
    config?: Partial<McpServerConfig>,
  ): Promise<McpRegistrationResult> {
    try {
      console.log("🚀 Starting complete MCP server registration process...");

      // Step 1: Validate credentials
      const credentialsCheck = await this.validateCredentials();
      if (!credentialsCheck.valid) {
        return {
          success: false,
          error: `Credentials validation failed: ${credentialsCheck.error}`,
        };
      }

      // Step 2: Check if server already exists
      const existingServers = await this.listMcpServers();
      if (
        existingServers.success &&
        existingServers.servers &&
        Array.isArray(existingServers.servers)
      ) {
        const aomaServer = existingServers.servers.find(
          (server) =>
            server.name === "AOMA Mesh MCP Server" ||
            server.url?.includes("ochwh4pvfaigb65koqxgf33ruy0rxnhy"),
        );

        if (aomaServer) {
          console.log(
            "⚠️ AOMA Mesh MCP server already exists, skipping registration",
          );
          console.log(`🆔 Existing Server ID: ${aomaServer.id}`);

          // Still try to associate with agent
          const association = await this.associateWithAgent(aomaServer.id);
          return {
            success: true,
            serverId: aomaServer.id,
            associated: association.success,
            error: association.success ? undefined : association.error,
            details: {
              registration: aomaServer,
              association: association.response,
            },
          };
        }
      }

      // Step 3: Register new MCP server
      const registration = await this.registerMcpServer(config);
      if (!registration.success) {
        return {
          success: false,
          error: registration.error,
        };
      }

      // Step 4: Associate with agent
      const association = await this.associateWithAgent(registration.serverId!);

      return {
        success: true,
        serverId: registration.serverId,
        associated: association.success,
        error: association.success ? undefined : association.error,
        details: {
          registration: registration.response,
          association: association.response,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown registration error",
      };
    }
  }

  /**
   * Get configuration summary
   */
  getConfigSummary() {
    return {
      apiKey: this.apiKey
        ? `${this.apiKey.substring(0, 8)}...`
        : "Not configured",
      agentId: this.agentId,
      lambdaUrl: this.lambdaUrl,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const elevenLabsMCPService = new ElevenLabsMCPService();
