import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { MCPGetStatusResponse, MCPServerStatus } from "../../shared/ipc/mcp";
import type { AOMAReshConfig, AOMAReshRequest } from "../../services/aomaMeshMcp";

/**
 * Type alias for MCP status - using the server status from the response
 */
export type McpStatus = MCPGetStatusResponse;

/**
 * MCP Context interface
 */
interface McpContextType {
  status: McpStatus | undefined;
  init: (cfg: AOMAReshConfig) => Promise<any>;
  send: (req: AOMAReshRequest) => Promise<any>;
  refresh: () => void;
}

/**
 * MCP Context - created with undefined default value
 */
const McpContext = createContext<McpContextType | undefined>(undefined);

/**
 * Custom hook to access MCP functionality
 */
export function useMcp(): McpContextType {
  const context = useContext(McpContext);
  if (context === undefined) {
    throw new Error("useMcp must be used within a McpProvider");
  }
  return context;
}

/**
 * MCP hook implementation (internal)
 */
function useInternalMcp(): McpContextType {
  const [status, setStatus] = useState<McpStatus>();

  const init = useCallback(async (cfg: AOMAReshConfig) => {
    try {
      if (!window.mcp) {
        console.warn("MCP not available - window.mcp is undefined");
        return Promise.resolve();
      }
      return await window.mcp.initialize(cfg);
    } catch (error) {
      console.error("MCP initialization failed:", error);
      return Promise.resolve();
    }
  }, []);

  const send = useCallback(async (req: AOMAReshRequest) => {
    try {
      if (!window.mcp) {
        console.warn("MCP not available - window.mcp is undefined");
        return Promise.resolve();
      }
      return await window.mcp.processMessage(req);
    } catch (error) {
      console.error("MCP message processing failed:", error);
      return Promise.resolve();
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      if (!window.mcp) {
        console.warn("MCP not available - window.mcp is undefined");
        return;
      }
      const result = await window.mcp.getStatus();
      setStatus(result);
    } catch (error) {
      console.error("AOMA health check failed:", error);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  return { status, init, send, refresh };
}

/**
 * MCP Provider Props
 */
interface McpProviderProps {
  children: ReactNode;
}

/**
 * MCP Provider component - wraps the application to provide MCP context
 */
export function McpProvider({ children }: McpProviderProps) {
  const mcpValue = useInternalMcp();

  return <McpContext.Provider value={mcpValue}>{children}</McpContext.Provider>;
}
