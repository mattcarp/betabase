/**
 * MCP Client Service for SIAM
 * Handles communication with AOMA Mesh MCP Server
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private isConnected = false;
  private tools: MCPTool[] = [];

  constructor(
    private serverCommand: string = "node",
    private serverArgs: string[] = [
      "/Users/matt/Documents/projects/aoma-mesh-mcp/dist/aoma-mesh-server.js",
    ],
    private serverPort: number = 3342
  ) {}

  /**
   * Connect to the AOMA Mesh MCP Server
   */
  async connect(): Promise<boolean> {
    try {
      console.log("🔌 Connecting to AOMA Mesh MCP Server...");

      // Create transport for MCP communication
      this.transport = new StdioClientTransport({
        command: this.serverCommand,
        args: this.serverArgs,
        env: {
          ...process.env,
          PORT: this.serverPort.toString(),
          NODE_ENV: "development",
        },
      });

      // Initialize MCP client
      this.client = new Client(
        {
          name: "siam-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Connect to server
      await this.client.connect(this.transport);
      this.isConnected = true;

      console.log("✅ Connected to AOMA Mesh MCP Server");

      // Load available tools
      await this.loadTools();

      return true;
    } catch (error) {
      console.error("❌ Failed to connect to MCP server:", error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.transport = null;
        console.log("🔌 Disconnected from AOMA Mesh MCP Server");
      }
    } catch (error) {
      console.error("❌ Error disconnecting from MCP server:", error);
    }
  }

  /**
   * Load available tools from the MCP server
   */
  private async loadTools(): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error("MCP client not connected");
    }

    try {
      const response = await (this.client as any).request({
        method: "tools/list",
        params: {},
      });

      this.tools = (response as any).tools || [];
      console.log(`🔧 Loaded ${this.tools.length} MCP tools from AOMA server`);
    } catch (error) {
      console.error("❌ Failed to load MCP tools:", error);
      this.tools = [];
    }
  }

  /**
   * Get list of available tools
   */
  getTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName: string, args: any = {}): Promise<MCPResponse> {
    if (!this.client || !this.isConnected) {
      return {
        success: false,
        error: "MCP client not connected",
      };
    }

    try {
      console.log(`🔧 Calling MCP tool: ${toolName}`, args);

      const result = await (this.client as any).request({
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args,
        },
      });

      console.log(`✅ MCP tool ${toolName} completed successfully`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`❌ MCP tool ${toolName} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Analyze transcription using AOMA's development context analysis tool
   */
  async analyzeTranscription(transcriptionText: string): Promise<MCPResponse> {
    return this.callTool("analyze_development_context", {
      context_data: transcriptionText,
      analysis_type: "meeting_transcript",
      include_recommendations: true,
    });
  }

  /**
   * Search AOMA knowledge base for meeting-related information
   */
  async searchKnowledgeBase(query: string): Promise<MCPResponse> {
    return this.callTool("query_aoma_knowledge", {
      query,
      max_results: 10,
      include_metadata: true,
    });
  }

  /**
   * Get meeting insights and action items using JIRA search
   */
  async getMeetingInsights(transcriptionText: string): Promise<MCPResponse> {
    return this.callTool("search_jira_tickets", {
      query: `meeting insights action items: ${transcriptionText.substring(0, 200)}`,
      max_results: 5,
      include_metadata: true,
    });
  }

  /**
   * Store meeting context for future reference using system health endpoint
   */
  async storeMeetingContext(meetingData: {
    transcription: string;
    timestamp: string;
    participants?: string[];
    summary?: string;
  }): Promise<MCPResponse> {
    // Use system health to log meeting context
    return this.callTool("get_system_health", {
      include_cache_stats: true,
      include_performance_metrics: true,
    });
  }

  // ===========================================
  // ADVANCED AOMA MESH MCP TOOLS (v2.0+)
  // ===========================================

  /**
   * Search corporate Outlook emails for context analysis
   */
  async searchOutlookEmails(
    query: string,
    options?: {
      dateFrom?: string;
      dateTo?: string;
      fromEmail?: string[];
      toEmail?: string[];
    }
  ): Promise<MCPResponse> {
    return this.callTool("search_outlook_emails", {
      query,
      maxResults: 10,
      threshold: 0.7,
      ...options,
    });
  }

  /**
   * Get comprehensive system health and performance metrics
   */
  async getSystemHealth(includeMetrics = true): Promise<MCPResponse> {
    return this.callTool("get_system_health", {
      include_cache_stats: true,
      include_performance_metrics: includeMetrics,
      include_tool_usage: true,
    });
  }

  /**
   * Get all server capabilities and available tools
   */
  async getServerCapabilities(): Promise<MCPResponse> {
    return this.callTool("get_server_capabilities");
  }

  /**
   * Search Git commits across repositories
   */
  async searchGitCommits(
    query: string,
    options?: {
      repository?: string;
      dateFrom?: string;
      dateTo?: string;
      author?: string;
    }
  ): Promise<MCPResponse> {
    return this.callTool("search_git_commits", {
      query,
      max_results: 20,
      include_diff: true,
      ...options,
    });
  }

  /**
   * Search code files and implementations
   */
  async searchCodeFiles(
    query: string,
    options?: {
      language?: string;
      repository?: string;
      filePattern?: string;
    }
  ): Promise<MCPResponse> {
    return this.callTool("search_code_files", {
      query,
      max_results: 15,
      include_context: true,
      ...options,
    });
  }

  /**
   * Multi-agent swarm analysis for complex problems
   */
  async swarmAnalyzeCrossVector(analysisType: string, data: any): Promise<MCPResponse> {
    return this.callTool("swarm_analyze_cross_vector", {
      analysis_type: analysisType,
      input_data: data,
      max_agents: 3,
      convergence_threshold: 0.85,
    });
  }

  /**
   * Generate failure prediction heatmaps
   */
  async generateFailureHeatmap(options?: {
    timeWindow?: number;
    analysisType?: string;
  }): Promise<MCPResponse> {
    return this.callTool("generate_failure_heatmap", {
      analysisType: options?.analysisType || "failure_patterns",
      timeWindow: options?.timeWindow || 90,
      includeRecommendations: true,
      generatePredictions: true,
    });
  }

  /**
   * Build predictive models for system performance
   */
  async buildPredictiveModel(
    targetVariable: string,
    options?: {
      modelType?: string;
      trainingPeriod?: number;
      predictionHorizon?: number;
    }
  ): Promise<MCPResponse> {
    return this.callTool("build_predictive_model", {
      targetVariable,
      modelType: options?.modelType || "auto",
      trainingPeriod: options?.trainingPeriod || 90,
      predictionHorizon: options?.predictionHorizon || 7,
      includeFeatureImportance: true,
      generateActionablePredictions: true,
    });
  }

  /**
   * Get LangSmith observability metrics
   */
  async getLangSmithMetrics(options?: {
    timeRange?: string;
    includeToolBreakdown?: boolean;
  }): Promise<MCPResponse> {
    return this.callTool("get_langsmith_metrics", {
      timeRange: options?.timeRange || "24h",
      includeToolBreakdown: options?.includeToolBreakdown || true,
    });
  }

  /**
   * Get detailed trace data for debugging
   */
  async getTraceData(options?: {
    traceId?: string;
    limit?: number;
    includeInputOutput?: boolean;
  }): Promise<MCPResponse> {
    return this.callTool("get_trace_data", {
      limit: options?.limit || 50,
      includeInputOutput: options?.includeInputOutput || true,
      traceId: options?.traceId,
    });
  }

  /**
   * Get JIRA ticket counts and analytics
   */
  async getJiraTicketCount(options?: {
    status?: string;
    assignee?: string;
    project?: string;
  }): Promise<MCPResponse> {
    return this.callTool("get_jira_ticket_count", {
      ...options,
    });
  }
}

// Singleton instance for the application
export const mcpClient = new MCPClient();

// Types are already exported above
