/**
 * Feature Flags Configuration
 * Controls feature toggles and experimental features
 */

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Safe access to process.env (handles edge cases where process is undefined)
const getEnvVar = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
};

// Check for Vercel AI SDK preference (default enabled)
const useVercelSDKFlag =
  getEnvVar("NEXT_PUBLIC_USE_VERCEL_SDK") !== "false" && // Default true unless explicitly disabled
  !(isBrowser && window.location.search.includes("vercel=false")); // Allow URL override

export const featureFlags = {
  /**
   * Vercel AI SDK Flag (Primary Implementation)
   * When true: Uses Vercel AI SDK (/api/chat-vercel)
   * When false: Falls back to legacy implementation (/api/chat)
   * Default: true
   */
  useVercelSDK: useVercelSDKFlag,

  /**
   * Store Conversations
   * Enables conversation persistence and history
   */
  storeConversations: getEnvVar("NEXT_PUBLIC_STORE_CONVERSATIONS") !== "false", // Default true

  /**
   * Debug Mode
   * Enables additional logging and debugging features
   */
  debugMode: getEnvVar("NEXT_PUBLIC_DEBUG_MODE") === "true" || false,
};

/**
 * Get the appropriate chat API endpoint based on feature flags
 */
export function getChatAPIEndpoint(): string {
  // Since we're not using Vercel, return empty string to let the component decide
  // This allows the AiSdkChatPanel to use its dynamic endpoint logic
  // based on the selected model (GPT-5 vs others)
  return "";
}

/**
 * Get API configuration for the current mode
 */
export function getAPIConfig() {
  return {
    endpoint: getChatAPIEndpoint(),
    storeConversations: featureFlags.storeConversations,
    apiType: featureFlags.useVercelSDK ? "vercel-sdk" : "legacy",
  };
}
