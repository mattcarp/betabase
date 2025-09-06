/**
 * React Hook for MCP Client Integration
 * Manages connection state and provides MCP functionality to SIAM components
 */

import { useState, useEffect, useCallback, useRef } from "react";
// Direct import to avoid barrel export issues on Linux
import {
  mcpClientWrapper,
  MCPTool,
  MCPResponse,
} from "../services/MCPClientWrapper";

export interface MCPClientState {
  isConnected: boolean;
  isConnecting: boolean;
  tools: MCPTool[];
  error: string | null;
  lastActivity: Date | null;
}

export interface MCPClientActions {
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  callTool: (toolName: string, args?: any) => Promise<MCPResponse>;
  analyzeTranscription: (text: string) => Promise<MCPResponse>;
  searchKnowledgeBase: (query: string) => Promise<MCPResponse>;
  getMeetingInsights: (text: string) => Promise<MCPResponse>;
  storeMeetingContext: (meetingData: any) => Promise<MCPResponse>;
  clearError: () => void;
}

export function useMCPClient(): [MCPClientState, MCPClientActions] {
  const [state, setState] = useState<MCPClientState>({
    isConnected: false,
    isConnecting: false,
    tools: [],
    error: null,
    lastActivity: null,
  });

  const connectionAttemptRef = useRef<boolean>(false);

  // Update state helper
  const updateState = useCallback((updates: Partial<MCPClientState>) => {
    setState((prev) => ({
      ...prev,
      ...updates,
      lastActivity: new Date(),
    }));
  }, []);

  // Connect to MCP server
  const connect = useCallback(async (): Promise<boolean> => {
    if (state.isConnecting || state.isConnected) {
      return state.isConnected;
    }

    updateState({ isConnecting: true, error: null });

    try {
      console.log("🔌 SIAM: Attempting to connect to AOMA Mesh MCP Server...");
      const success = await mcpClientWrapper.connect();

      if (success) {
        const tools = mcpClientWrapper.getTools();
        updateState({
          isConnected: true,
          isConnecting: false,
          tools,
          error: null,
        });
        console.log(
          "✅ SIAM: Connected to AOMA Mesh MCP Server with",
          tools.length,
          "tools",
        );
        return true;
      } else {
        updateState({
          isConnected: false,
          isConnecting: false,
          error: "Failed to connect to AOMA Mesh MCP Server",
        });
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown connection error";
      console.error("❌ SIAM: MCP connection failed:", errorMessage);
      updateState({
        isConnected: false,
        isConnecting: false,
        error: errorMessage,
      });
      return false;
    }
  }, [state.isConnecting, state.isConnected, updateState]);

  // Disconnect from MCP server
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      await mcpClientWrapper.disconnect();
      updateState({
        isConnected: false,
        isConnecting: false,
        tools: [],
        error: null,
      });
      console.log("🔌 SIAM: Disconnected from AOMA Mesh MCP Server");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown disconnection error";
      console.error("❌ SIAM: MCP disconnection failed:", errorMessage);
      updateState({ error: errorMessage });
    }
  }, [updateState]);

  // Call a tool on the MCP server
  const callTool = useCallback(
    async (toolName: string, args: any = {}): Promise<MCPResponse> => {
      if (!state.isConnected) {
        const error = "MCP client not connected to AOMA server";
        updateState({ error });
        return { success: false, error };
      }

      try {
        updateState({ error: null });
        const response = await mcpClientWrapper.callTool(toolName, args);

        if (!response.success) {
          updateState({ error: response.error || "Tool call failed" });
        }

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Tool call error";
        updateState({ error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [state.isConnected, updateState],
  );

  // Analyze transcription using AOMA's analysis tools
  const analyzeTranscription = useCallback(
    async (text: string): Promise<MCPResponse> => {
      console.log("🔍 SIAM: Analyzing transcription with AOMA Mesh...");
      return callTool("analyze_transcription", { text });
    },
    [callTool],
  );

  // Search AOMA knowledge base
  const searchKnowledgeBase = useCallback(
    async (query: string): Promise<MCPResponse> => {
      console.log("🔍 SIAM: Searching AOMA knowledge base for:", query);
      return callTool("search_knowledge_base", { query });
    },
    [callTool],
  );

  // Get meeting insights
  const getMeetingInsights = useCallback(
    async (text: string): Promise<MCPResponse> => {
      console.log("💡 SIAM: Getting meeting insights from AOMA...");
      return callTool("get_meeting_insights", { text });
    },
    [callTool],
  );

  // Store meeting context
  const storeMeetingContext = useCallback(
    async (meetingData: any): Promise<MCPResponse> => {
      console.log("💾 SIAM: Storing meeting context in AOMA...");
      return callTool("store_meeting_context", { meetingData });
    },
    [callTool],
  );

  // Clear error state
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Auto-connect on mount (with debounce)
  useEffect(() => {
    if (
      !connectionAttemptRef.current &&
      !state.isConnected &&
      !state.isConnecting
    ) {
      connectionAttemptRef.current = true;

      const timer = setTimeout(() => {
        console.log("🚀 SIAM: Auto-connecting to AOMA Mesh MCP Server...");
        connect().finally(() => {
          connectionAttemptRef.current = false;
        });
      }, 1000); // 1 second delay to avoid immediate connection attempts

      return () => clearTimeout(timer);
    }
  }, [connect, state.isConnected, state.isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isConnected) {
        disconnect();
      }
    };
  }, []);

  const actions: MCPClientActions = {
    connect,
    disconnect,
    callTool,
    analyzeTranscription,
    searchKnowledgeBase,
    getMeetingInsights,
    storeMeetingContext,
    clearError,
  };

  return [state, actions];
}

export default useMCPClient;
