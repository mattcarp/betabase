/**
 * API Keys Configuration
 * Handles secure access to API keys for the application
 */

interface ApiConfig {
  openaiApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsAgentId: string;
  vectorStoreId: string;
  // MCP configuration
  mcpUrl?: string;
  mcpLambdaUrl?: string;
  mcpAuthEnabled?: boolean;
}

// Default configuration with provided keys
const defaultConfig: ApiConfig = {
  openaiApiKey:
    "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",
  elevenLabsApiKey: "sk_b495cffb8979229634b620c1bddbf5583f5c9fd69e5785fb",
  elevenLabsAgentId: "agent_01jz1ar6k2e8tvst14g6cbgc7m",
  vectorStoreId: "vs_68a6c6337b10819194ce40498ca7dd6a", // SIAM Knowledge Base (active)
  // MCP configuration - use proper URLs
  mcpUrl:
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? "https://aoma-mesh-mcp.replit.app" // Production AOMA MCP server
      : "http://localhost:3333", // Local AOMA MCP server
  mcpLambdaUrl: "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws",
  mcpAuthEnabled: false,
};

class ApiKeysService {
  private config: ApiConfig;

  constructor() {
    // Try to get from environment first, fallback to defaults
    this.config = {
      openaiApiKey:
        this.getEnvVar("OPENAI_API_KEY") || defaultConfig.openaiApiKey,
      elevenLabsApiKey:
        this.getEnvVar("ELEVENLABS_API_KEY") || defaultConfig.elevenLabsApiKey,
      elevenLabsAgentId:
        this.getEnvVar("ELEVENLABS_AGENT_ID") ||
        defaultConfig.elevenLabsAgentId,
      vectorStoreId:
        this.getEnvVar("VECTOR_STORE_ID") || defaultConfig.vectorStoreId,
      // MCP configuration
      mcpUrl: this.getEnvVar("MCP_URL") || defaultConfig.mcpUrl,
      mcpLambdaUrl:
        this.getEnvVar("MCP_LAMBDA_URL") || defaultConfig.mcpLambdaUrl,
      mcpAuthEnabled:
        this.getEnvVar("MCP_AUTH_ENABLED") === "false"
          ? false
          : (defaultConfig.mcpAuthEnabled ?? false),
    };
  }

  private getEnvVar(key: string): string | undefined {
    // Check multiple possible environment variable formats
    // Handle Next.js and Node.js environment variables
    return (
      process.env[`NEXT_PUBLIC_${key}`] ||
      process.env[key] ||
      (typeof window !== "undefined" && (window as any).__env?.[key])
    );
  }

  getOpenAIApiKey(): string {
    return this.config.openaiApiKey;
  }

  getElevenLabsApiKey(): string {
    return this.config.elevenLabsApiKey;
  }

  getElevenLabsAgentId(): string {
    return this.config.elevenLabsAgentId;
  }

  getVectorStoreId(): string {
    return this.config.vectorStoreId;
  }

  getMcpUrl(): string {
    return (
      this.config.mcpUrl || defaultConfig.mcpUrl || "http://localhost:3333"
    );
  }

  getMcpLambdaUrl(): string {
    return (
      this.config.mcpLambdaUrl ||
      defaultConfig.mcpLambdaUrl ||
      "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws"
    );
  }

  isMcpAuthEnabled(): boolean {
    return this.config.mcpAuthEnabled ?? false;
  }

  // Update configuration at runtime if needed
  updateConfig(updates: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  // Validate that all required keys are present
  validateConfig(): { isValid: boolean; missingKeys: string[] } {
    const missingKeys: string[] = [];

    if (!this.config.openaiApiKey) missingKeys.push("OPENAI_API_KEY");
    if (!this.config.elevenLabsApiKey) missingKeys.push("ELEVENLABS_API_KEY");
    if (!this.config.elevenLabsAgentId) missingKeys.push("ELEVENLABS_AGENT_ID");

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }
}

// Singleton instance
export const apiKeysService = new ApiKeysService();

// Export individual getters for convenience
export const getOpenAIApiKey = () => apiKeysService.getOpenAIApiKey();
export const getElevenLabsApiKey = () => apiKeysService.getElevenLabsApiKey();
export const getElevenLabsAgentId = () => apiKeysService.getElevenLabsAgentId();
export const getVectorStoreId = () => apiKeysService.getVectorStoreId();
export const getMcpUrl = () => apiKeysService.getMcpUrl();
export const getMcpLambdaUrl = () => apiKeysService.getMcpLambdaUrl();
export const isMcpAuthEnabled = () => apiKeysService.isMcpAuthEnabled();

export default apiKeysService;
