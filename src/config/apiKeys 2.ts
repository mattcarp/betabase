/**
 * API Keys Configuration
 * Handles secure access to API keys for the application
 */

interface ApiConfig {
  openaiApiKey: string;
  elevenLabsApiKey: string;
  elevenLabsAgentId: string;
  vectorStoreId: string;
  // AWS credentials for Lambda MCP authentication
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
  // Lambda MCP configuration
  mcpLambdaUrl?: string;
  mcpAuthEnabled?: boolean;
}

// Default configuration with provided keys
const defaultConfig: ApiConfig = {
  openaiApiKey:
    "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",
  elevenLabsApiKey: "sk_3bdf311f445bb15d57306a7171b31c7257faf5acd69322df",
  elevenLabsAgentId: "agent_01jz1ar6k2e8tvst14g6cbgc7m",
  vectorStoreId: "vs_wJF8HgBFrYtdNaXUbUC2nfM",
  // AWS defaults
  awsRegion: "us-east-2",
  mcpLambdaUrl: "http://localhost:3000", // Use local API route for now
  mcpAuthEnabled: false, // Set to false to disable authentication for development
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
      // AWS credentials
      awsAccessKeyId: this.getEnvVar("AWS_ACCESS_KEY_ID"),
      awsSecretAccessKey: this.getEnvVar("AWS_SECRET_ACCESS_KEY"),
      awsRegion: this.getEnvVar("AWS_REGION") || defaultConfig.awsRegion,
      // Lambda MCP
      mcpLambdaUrl:
        this.getEnvVar("MCP_LAMBDA_URL") || defaultConfig.mcpLambdaUrl,
      mcpAuthEnabled:
        this.getEnvVar("MCP_AUTH_ENABLED") === "false"
          ? false
          : (defaultConfig.mcpAuthEnabled ?? true),
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

  // AWS credentials getters
  getAwsCredentials(): {
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
  } {
    return {
      accessKeyId: this.config.awsAccessKeyId,
      secretAccessKey: this.config.awsSecretAccessKey,
      region: this.config.awsRegion,
    };
  }

  getMcpLambdaUrl(): string {
    return this.config.mcpLambdaUrl || defaultConfig.mcpLambdaUrl!;
  }

  isMcpAuthEnabled(): boolean {
    return this.config.mcpAuthEnabled ?? true;
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

    // AWS credentials are optional - only required if auth is enabled
    if (this.config.mcpAuthEnabled) {
      if (!this.config.awsAccessKeyId) missingKeys.push("AWS_ACCESS_KEY_ID");
      if (!this.config.awsSecretAccessKey)
        missingKeys.push("AWS_SECRET_ACCESS_KEY");
    }

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
export const getAwsCredentials = () => apiKeysService.getAwsCredentials();
export const getMcpLambdaUrl = () => apiKeysService.getMcpLambdaUrl();
export const isMcpAuthEnabled = () => apiKeysService.isMcpAuthEnabled();

export default apiKeysService;
