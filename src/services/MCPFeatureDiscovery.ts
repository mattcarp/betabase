/**
 * MCP Feature Discovery Service
 * Automatically discovers and exposes latest AOMA Mesh MCP server capabilities
 */

import { mcpClient } from "./MCPClient";

export interface MCPFeature {
  toolName: string;
  description: string;
  category: "knowledge" | "analytics" | "integration" | "observability" | "system";
  inputSchema: any;
  isAdvanced: boolean;
  version: string;
}

export interface MCPCapabilities {
  serverVersion: string;
  totalTools: number;
  features: MCPFeature[];
  lastUpdated: string;
  connectionStatus: "connected" | "disconnected" | "error";
}

class MCPFeatureDiscoveryService {
  private capabilities: MCPCapabilities | null = null;
  private discoveryInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(capabilities: MCPCapabilities) => void> = [];

  /**
   * Start automatic feature discovery
   */
  async startDiscovery(intervalMs = 300000): Promise<void> {
    // 5 minutes
    console.log("🔍 Starting MCP feature discovery service...");

    // Initial discovery
    await this.discoverFeatures();

    // Set up periodic discovery
    this.discoveryInterval = setInterval(() => {
      this.discoverFeatures();
    }, intervalMs);
  }

  /**
   * Stop automatic discovery
   */
  stopDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
      console.log("🛑 Stopped MCP feature discovery service");
    }
  }

  /**
   * Discover all available MCP features
   */
  async discoverFeatures(): Promise<MCPCapabilities> {
    try {
      console.log("🔍 Discovering MCP server capabilities...");

      // Try to get server capabilities
      const capabilitiesResponse = await mcpClient.getServerCapabilities();

      if (!capabilitiesResponse.success) {
        throw new Error(`Failed to get capabilities: ${capabilitiesResponse.error}`);
      }

      // Load all available tools
      const tools = mcpClient.getTools();

      const features: MCPFeature[] = this.categorizeTools(tools);

      this.capabilities = {
        serverVersion: "2.0.0", // From AOMA Mesh server
        totalTools: tools.length,
        features,
        lastUpdated: new Date().toISOString(),
        connectionStatus: mcpClient.isClientConnected() ? "connected" : "disconnected",
      };

      // Notify listeners
      this.notifyListeners(this.capabilities);

      console.log(
        `✅ Discovered ${features.length} MCP features across ${this.getCategories().length} categories`
      );

      return this.capabilities;
    } catch (error) {
      console.error("❌ MCP feature discovery failed:", error);

      // Create error state capabilities
      this.capabilities = {
        serverVersion: "unknown",
        totalTools: 0,
        features: [],
        lastUpdated: new Date().toISOString(),
        connectionStatus: "error",
      };

      this.notifyListeners(this.capabilities);
      return this.capabilities;
    }
  }

  /**
   * Categorize tools into feature groups
   */
  private categorizeTools(tools: any[]): MCPFeature[] {
    return tools.map((tool) => {
      const feature: MCPFeature = {
        toolName: tool.name,
        description: tool.description,
        category: this.getCategoryForTool(tool.name),
        inputSchema: tool.inputSchema,
        isAdvanced: this.isAdvancedTool(tool.name),
        version: "2.0.0",
      };
      return feature;
    });
  }

  /**
   * Determine category for a tool
   */
  private getCategoryForTool(toolName: string): MCPFeature["category"] {
    if (toolName.includes("aoma") || toolName.includes("knowledge") || toolName.includes("query")) {
      return "knowledge";
    }
    if (
      toolName.includes("analyze") ||
      toolName.includes("predict") ||
      toolName.includes("heatmap") ||
      toolName.includes("metrics")
    ) {
      return "analytics";
    }
    if (
      toolName.includes("jira") ||
      toolName.includes("git") ||
      toolName.includes("outlook") ||
      toolName.includes("search")
    ) {
      return "integration";
    }
    if (
      toolName.includes("trace") ||
      toolName.includes("langsmith") ||
      toolName.includes("introspection")
    ) {
      return "observability";
    }
    return "system";
  }

  /**
   * Check if a tool is considered advanced
   */
  private isAdvancedTool(toolName: string): boolean {
    const advancedTools = [
      "swarm_analyze_cross_vector",
      "build_predictive_model",
      "generate_failure_heatmap",
      "get_langsmith_metrics",
      "get_trace_data",
      "swarm_agent_handoff",
      "swarm_context_engineering",
    ];
    return advancedTools.includes(toolName);
  }

  /**
   * Get unique categories
   */
  getCategories(): string[] {
    if (!this.capabilities) return [];
    return [...new Set(this.capabilities.features.map((f) => f.category))];
  }

  /**
   * Get features by category
   */
  getFeaturesByCategory(category: MCPFeature["category"]): MCPFeature[] {
    if (!this.capabilities) return [];
    return this.capabilities.features.filter((f) => f.category === category);
  }

  /**
   * Get advanced features only
   */
  getAdvancedFeatures(): MCPFeature[] {
    if (!this.capabilities) return [];
    return this.capabilities.features.filter((f) => f.isAdvanced);
  }

  /**
   * Get current capabilities
   */
  getCurrentCapabilities(): MCPCapabilities | null {
    return this.capabilities;
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(toolName: string): boolean {
    if (!this.capabilities) return false;
    return this.capabilities.features.some((f) => f.toolName === toolName);
  }

  /**
   * Add listener for capability updates
   */
  onCapabilitiesUpdate(listener: (capabilities: MCPCapabilities) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (capabilities: MCPCapabilities) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of capability updates
   */
  private notifyListeners(capabilities: MCPCapabilities): void {
    this.listeners.forEach((listener) => {
      try {
        listener(capabilities);
      } catch (error) {
        console.error("❌ Error notifying capability listener:", error);
      }
    });
  }

  /**
   * Get feature usage recommendations based on context
   */
  getRecommendedFeatures(
    context: "meeting" | "development" | "analytics" | "debugging"
  ): MCPFeature[] {
    if (!this.capabilities) return [];

    const recommendations: { [key: string]: string[] } = {
      meeting: ["query_aoma_knowledge", "search_outlook_emails", "analyze_development_context"],
      development: [
        "search_git_commits",
        "search_code_files",
        "get_system_health",
        "search_jira_tickets",
      ],
      analytics: [
        "generate_failure_heatmap",
        "build_predictive_model",
        "analyze_performance_metrics",
      ],
      debugging: [
        "get_trace_data",
        "get_langsmith_metrics",
        "get_system_health",
        "get_server_introspection",
      ],
    };

    const recommendedToolNames = recommendations[context] || [];
    return this.capabilities.features.filter((f) => recommendedToolNames.includes(f.toolName));
  }
}

// Export singleton instance
export const mcpFeatureDiscovery = new MCPFeatureDiscoveryService();
