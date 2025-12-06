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
  // REMOVED: Railway aoma-mesh-mcp URL - no longer used
  // MCP configuration (Lambda MCP only now)
  mcpUrl: process.env.NEXT_PUBLIC_MCP_URL || undefined,
  mcpLambdaUrl: "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws",
  mcpAuthEnabled: false,
};

const config: ApiConfig = {
  openaiApiKey: getEnvVar("OPENAI_API_KEY") || defaultConfig.openaiApiKey,
  elevenLabsApiKey: getEnvVar("ELEVENLABS_API_KEY") || defaultConfig.elevenLabsApiKey,
  elevenLabsAgentId: getEnvVar("ELEVENLABS_AGENT_ID") || defaultConfig.elevenLabsAgentId,
  vectorStoreId: getEnvVar("VECTOR_STORE_ID") || defaultConfig.vectorStoreId,
  mcpUrl: getEnvVar("MCP_URL") || defaultConfig.mcpUrl,
  mcpLambdaUrl: getEnvVar("MCP_LAMBDA_URL") || defaultConfig.mcpLambdaUrl,
  mcpAuthEnabled: getEnvVar("MCP_AUTH_ENABLED") === "false" 
      ? false 
      : (defaultConfig.mcpAuthEnabled ?? false),
};

function getEnvVar(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
      if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`];
      if (process.env[key]) return process.env[key];
  }
  if (typeof window !== "undefined" && (window as any).__env?.[key]) {
      return (window as any).__env[key];
  }
  return undefined;
}

export const apiKeysService = {
  getOpenAIApiKey: () => config.openaiApiKey,
  getElevenLabsApiKey: () => config.elevenLabsApiKey,
  getElevenLabsAgentId: () => config.elevenLabsAgentId,
  getVectorStoreId: () => config.vectorStoreId,
  getMcpUrl: () => config.mcpUrl || defaultConfig.mcpUrl || "http://localhost:3333",
  getMcpLambdaUrl: () => config.mcpLambdaUrl || defaultConfig.mcpLambdaUrl || "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws",
  isMcpAuthEnabled: () => config.mcpAuthEnabled ?? false,
  updateConfig: (updates: Partial<ApiConfig>) => {
    Object.assign(config, updates);
  },
  validateConfig: () => {
    const missingKeys: string[] = [];
    if (!config.openaiApiKey) missingKeys.push("OPENAI_API_KEY");
    if (!config.elevenLabsApiKey) missingKeys.push("ELEVENLABS_API_KEY");
    if (!config.elevenLabsAgentId) missingKeys.push("ELEVENLABS_AGENT_ID");
    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }
};

// Export individual getters for convenience
export const getOpenAIApiKey = () => apiKeysService.getOpenAIApiKey();
export const getElevenLabsApiKey = () => apiKeysService.getElevenLabsApiKey();
export const getElevenLabsAgentId = () => apiKeysService.getElevenLabsAgentId();
export const getVectorStoreId = () => apiKeysService.getVectorStoreId();
export const getMcpUrl = () => apiKeysService.getMcpUrl();
export const getMcpLambdaUrl = () => apiKeysService.getMcpLambdaUrl();
export const isMcpAuthEnabled = () => apiKeysService.isMcpAuthEnabled();

export default apiKeysService;
