// Web-only environment - no Electron support
const isElectronEnvironment = () => {
  return false;
};

/**
 * Get current pipeline status
 */
export async function getPipelineStatus(): Promise<any> {
  try {
    // Web environment - return mock data or make HTTP request
    return {
      isRunning: false,
      currentStage: "idle",
      progress: 0,
      error: null,
    };
  } catch (error) {
    console.error("Error getting pipeline status:", error);
    return {
      isRunning: false,
      currentStage: "error",
      progress: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get AI insights
 */
export const getAIInsights = async (): Promise<any> => {
  try {
    // Web environment - return mock data or make HTTP request
    return {
      sentiment: "neutral",
      confidence: 0.8,
      keywords: ["SIAM", "conversation"],
      summary: "Real-time conversation analysis via ElevenLabs.",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to get AI insights:", error);
    throw error;
  }
};

/**
 * Check if running in Electron environment (for UI adaptation)
 */
export const getEnvironmentInfo = () => {
  return {
    isElectron: isElectronEnvironment(),
    hasWebAudio: typeof navigator !== "undefined" && "mediaDevices" in navigator,
    platform: isElectronEnvironment() ? "desktop" : "web",
  };
};
