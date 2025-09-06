/**
 * Example usage of MCP API integration
 *
 * This demonstrates how to use the MCP client for various operations
 */

import React from "react";
import { MCPClient } from "../services/MCPClient";

// Example 1: Initialize MCP service
export async function initializeMCP() {
  try {
    const response = await window.mcp.initialize({
      enabled: true,
      serverUrl: "http://localhost:3000",
      timeout: 10000,
    });

    if (response.success) {
      console.log("MCP initialized successfully:", response.data);
    } else {
      console.error("MCP initialization failed:", response.error);
    }
  } catch (error) {
    console.error("MCP initialization error:", error);
  }
}

// Example 2: Process a message through MCP
export async function processMessage(conversationId: string, message: string) {
  try {
    const response = await window.mcp.processMessage({
      conversationId,
      message,
      context: {
        speaker: "user",
        timestamp: new Date(),
        confidence: 0.95,
      },
    });

    if (response.success && response.data) {
      console.log(
        "Enhanced message:",
        (response.data as any)?.enhancedMessage || "N/A",
      );
      console.log("Insights:", (response.data as any)?.insights || "N/A");
      console.log(
        "Recommendations:",
        (response.data as any)?.recommendations || "N/A",
      );
      console.log(
        "Mesh actions:",
        (response.data as any)?.meshActions || "N/A",
      );
      return response.data;
    } else {
      console.error("Message processing failed:", response.error);
      return null;
    }
  } catch (error) {
    console.error("Message processing error:", error);
    return null;
  }
}

// Example 3: Update MCP configuration
export async function updateMCPConfig(
  config: Partial<{
    enabled: boolean;
    serverUrl: string;
    timeout: number;
  }>,
) {
  try {
    const response = await window.mcp.updateConfig(config);

    if (response.success) {
      console.log(
        "MCP config updated successfully:",
        (response as any).config || "N/A",
      );
    } else {
      console.error("MCP config update failed:", response.error);
    }
  } catch (error) {
    console.error("MCP config update error:", error);
  }
}

// Example 4: Get MCP status
export async function getMCPStatus() {
  try {
    const response = await window.mcp.getStatus();

    if (response.success && response.data) {
      console.log("MCP servers:", response.data.servers);
      return response.data.servers;
    } else {
      console.error("Failed to get MCP status:", response.error);
      return [];
    }
  } catch (error) {
    console.error("MCP status error:", error);
    return [];
  }
}

// Example 5: Listen for MCP status changes
export function setupMCPEventListeners() {
  // Listen for general status changes
  const statusCleanup = window.mcp.onStatusChange((event) => {
    console.log("MCP status change:", event);

    switch (event.type) {
      case "status-change":
        console.log("General status change detected");
        break;
      case "server-update":
        console.log("Server update detected:", event.serverId);
        break;
      case "connection-change":
        console.log("Connection change detected");
        break;
    }
  });

  // Listen for server updates
  const serverCleanup = window.mcp.onServerUpdate((serverId, status) => {
    console.log(`Server ${serverId} status:`, status);

    // Update UI based on server status
    if (status.status === "connected") {
      console.log(`Server ${serverId} is now connected`);
    } else if (status.status === "error") {
      console.error(`Server ${serverId} has an error:`, status.error);
    }
  });

  // Listen for connection changes
  const connectionCleanup = window.mcp.onConnectionChange(
    (connected, serverId) => {
      if (connected) {
        console.log(
          `MCP connection established${serverId ? ` for server ${serverId}` : ""}`,
        );
      } else {
        console.log(
          `MCP connection lost${serverId ? ` for server ${serverId}` : ""}`,
        );
      }
    },
  );

  // Return cleanup function
  return () => {
    statusCleanup();
    serverCleanup();
    connectionCleanup();
  };
}

// Example 6: React hook for MCP integration
export function useMCP() {
  const [status, setStatus] = React.useState<any>(null);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    // Initialize MCP when component mounts
    initializeMCP();

    // Set up event listeners
    const cleanup = setupMCPEventListeners();

    // Get initial status
    getMCPStatus().then(setStatus);

    // Cleanup on unmount
    return () => {
      cleanup();
      window.mcp.removeAllListeners();
    };
  }, []);

  const processMessage = React.useCallback(
    async (conversationId: string, message: string) => {
      return await processMessage(conversationId, message);
    },
    [],
  );

  const updateConfig = React.useCallback(async (config: any) => {
    await updateMCPConfig(config);
    // Refresh status after config update
    const newStatus = await getMCPStatus();
    setStatus(newStatus);
  }, []);

  return {
    status,
    connected,
    processMessage,
    updateConfig,
    initialize: initializeMCP,
    getStatus: getMCPStatus,
  };
}

// Example 7: Error handling wrapper
export async function safeMCPCall<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  errorMessage: string = "MCP operation failed",
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    return fallbackValue;
  }
}

// Example usage of error wrapper:
// const result = await safeMCPCall(
//   () => window.mcp.processMessage(request),
//   { success: false, error: 'Fallback response' },
//   'Failed to process message through MCP'
// )
