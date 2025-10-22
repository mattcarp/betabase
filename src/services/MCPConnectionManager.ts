/**
 * MCP Connection Manager
 * Manages connections to MCP servers with support for both local and production environments
 */

export interface MCPConnectionConfig {
  mode: "local" | "production" | "auto";
  localServerPath?: string;
  productionUrl?: string;
  timeout?: number;
}

export interface MCPServerInfo {
  type: "local" | "production";
  url?: string;
  path?: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  lastError?: string;
}

class MCPConnectionManager {
  private config: MCPConnectionConfig;
  private serverInfo: MCPServerInfo;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    // Determine mode based on environment
    const isProduction = process.env.NODE_ENV === "production";
    const mcpMode = process.env.NEXT_PUBLIC_MCP_MODE as "local" | "production" | "auto" | undefined;

    this.config = {
      mode: mcpMode || (isProduction ? "production" : "auto"),
      localServerPath:
        process.env.NEXT_PUBLIC_MCP_LOCAL_PATH ||
        "/Users/matt/Documents/projects/aoma-mesh-mcp/dist/aoma-mesh-server.js",
      productionUrl:
        process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ||
        "https://luminous-dedication-production.up.railway.app",
      timeout: 10000,
    };

    this.serverInfo = {
      type: this.config.mode === "local" ? "local" : "production",
      status: "disconnected",
    };

    console.log("🔧 MCP Connection Manager initialized:", {
      mode: this.config.mode,
      environment: process.env.NODE_ENV,
      serverType: this.serverInfo.type,
    });
  }

  /**
   * Get the appropriate connection configuration based on the current mode
   */
  getConnectionConfig(): {
    type: "local" | "production";
    endpoint?: string;
    command?: string;
    args?: string[];
  } {
    // If in auto mode, try local first, fall back to production
    if (this.config.mode === "auto") {
      // Check if we're in a browser environment
      if (typeof window !== "undefined") {
        // In browser, always use production HTTP endpoint
        return {
          type: "production",
          endpoint: this.config.productionUrl,
        };
      }

      // On server, check if local MCP server exists
      if (this.canUseLocalServer()) {
        return {
          type: "local",
          command: "node",
          args: [this.config.localServerPath!],
        };
      }

      // Fall back to production
      return {
        type: "production",
        endpoint: this.config.productionUrl,
      };
    }

    // Explicit local mode
    if (this.config.mode === "local") {
      return {
        type: "local",
        command: "node",
        args: [this.config.localServerPath!],
      };
    }

    // Production mode
    return {
      type: "production",
      endpoint: this.config.productionUrl,
    };
  }

  /**
   * Check if local MCP server can be used
   */
  private canUseLocalServer(): boolean {
    // Check if we're in a Node.js environment
    if (typeof window !== "undefined") {
      return false; // Can't use local server in browser
    }

    // Check if the local server file exists
    try {
      const fs = require("fs");
      return fs.existsSync(this.config.localServerPath);
    } catch {
      return false;
    }
  }

  /**
   * Connect to the appropriate MCP server
   */
  async connect(): Promise<boolean> {
    this.serverInfo.status = "connecting";
    const config = this.getConnectionConfig();

    console.log("🔌 Connecting to MCP server:", config);

    try {
      if (config.type === "production") {
        // Connect via HTTP to production server
        const connected = await this.connectToProductionServer(config.endpoint!);
        if (connected) {
          this.serverInfo = {
            type: "production",
            url: config.endpoint,
            status: "connected",
          };
          this.startHealthCheck();
          return true;
        }
      } else {
        // Connect via stdio to local server
        const connected = await this.connectToLocalServer(config.command!, config.args!);
        if (connected) {
          this.serverInfo = {
            type: "local",
            path: this.config.localServerPath,
            status: "connected",
          };
          this.startHealthCheck();
          return true;
        }
      }
    } catch (error) {
      console.error("❌ MCP connection failed:", error);
      this.serverInfo.status = "error";
      this.serverInfo.lastError = error instanceof Error ? error.message : "Unknown error";
    }

    return false;
  }

  /**
   * Connect to production MCP server via HTTP
   */
  private async connectToProductionServer(endpoint: string): Promise<boolean> {
    try {
      // Test connection with health check
      const response = await fetch(`${endpoint}/api/health`, {
        method: "GET",
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Connected to production MCP server:", data);
        return true;
      }

      throw new Error(`Health check failed: ${response.status}`);
    } catch (error) {
      console.error("❌ Production server connection failed:", error);
      throw error;
    }
  }

  /**
   * Connect to local MCP server via stdio
   */
  private async connectToLocalServer(command: string, args: string[]): Promise<boolean> {
    // This would use the StdioClientTransport from MCP SDK
    // For now, return false as this needs to be handled by MCPClient
    console.log("📍 Local server connection requested:", { command, args });

    // In a real implementation, this would spawn the local process
    // For now, we'll let the MCPClient handle this
    return false;
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    // Clear any existing interval
    this.stopHealthCheck();

    // Only health check production servers
    if (this.serverInfo.type === "production") {
      this.healthCheckInterval = setInterval(async () => {
        try {
          const response = await fetch(`${this.serverInfo.url}/api/health`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
          });

          if (!response.ok) {
            console.warn("⚠️ MCP health check failed:", response.status);
            this.serverInfo.status = "error";
          }
        } catch (error) {
          console.warn("⚠️ MCP health check error:", error);
          this.serverInfo.status = "error";
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Stop health check monitoring
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get current server status
   */
  getServerInfo(): MCPServerInfo {
    return { ...this.serverInfo };
  }

  /**
   * Switch connection mode
   */
  async switchMode(mode: "local" | "production" | "auto"): Promise<boolean> {
    console.log(`🔄 Switching MCP mode from ${this.config.mode} to ${mode}`);

    this.config.mode = mode;
    this.stopHealthCheck();
    this.serverInfo.status = "disconnected";

    return await this.connect();
  }

  /**
   * Disconnect from MCP server
   */
  disconnect(): void {
    this.stopHealthCheck();
    this.serverInfo.status = "disconnected";
    console.log("🔌 Disconnected from MCP server");
  }
}

// Export singleton instance
export const mcpConnectionManager = new MCPConnectionManager();
