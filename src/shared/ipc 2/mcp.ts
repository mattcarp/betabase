/**
 * MCP (Model Context Protocol) IPC Schema
 *
 * This file serves as a single source of truth for MCP-related IPC communication
 * between main, preload, and renderer processes in the Electron application.
 */

// MCP IPC Channel Constants
export const MCP_CHANNELS = {
  INIT: "mcp:init",
  PROCESS: "mcp:process",
  UPDATE_CONFIG: "mcp:update-config",
  GET_STATUS: "mcp:get-status",
} as const;

// Base interfaces for request/response patterns
export interface MCPRequest {
  id: string;
  timestamp: number;
}

export interface MCPResponse<T = any> {
  id: string;
  timestamp: number;
  success: boolean;
  data?: T;
  error?: string;
}

// MCP:INIT - Initialize MCP connection
export interface MCPInitRequest extends MCPRequest {
  config: {
    serverPath: string;
    args?: string[];
    env?: Record<string, string>;
    timeout?: number;
  };
}

export interface MCPInitResponse
  extends MCPResponse<{
    serverId: string;
    serverInfo: {
      name: string;
      version: string;
      protocolVersion: string;
    };
    capabilities: {
      tools?: boolean;
      resources?: boolean;
      prompts?: boolean;
      logging?: boolean;
    };
  }> {}

// MCP:PROCESS - Process MCP request/response
export interface MCPProcessRequest extends MCPRequest {
  serverId: string;
  method: string;
  params?: any;
}

export interface MCPProcessResponse
  extends MCPResponse<{
    result?: any;
    error?: {
      code: number;
      message: string;
      data?: any;
    };
  }> {}

// MCP:UPDATE-CONFIG - Update MCP server configuration
export interface MCPUpdateConfigRequest extends MCPRequest {
  serverId: string;
  config: {
    serverPath?: string;
    args?: string[];
    env?: Record<string, string>;
    timeout?: number;
    enabled?: boolean;
  };
}

export interface MCPUpdateConfigResponse
  extends MCPResponse<{
    serverId: string;
    updated: boolean;
    restartRequired?: boolean;
  }> {}

// MCP:GET-STATUS - Get MCP server status
export interface MCPGetStatusRequest extends MCPRequest {
  serverId?: string; // If not provided, returns status for all servers
}

export interface MCPServerStatus {
  serverId: string;
  name: string;
  status: "connected" | "disconnected" | "connecting" | "error";
  uptime?: number;
  lastActivity?: number;
  error?: string;
  config: {
    serverPath: string;
    args?: string[];
    env?: Record<string, string>;
    timeout?: number;
    enabled: boolean;
  };
  capabilities: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    logging?: boolean;
  };
  statistics?: {
    requestCount: number;
    errorCount: number;
    avgResponseTime: number;
  };
}

export interface MCPGetStatusResponse
  extends MCPResponse<{
    servers: MCPServerStatus[];
  }> {}

// Union types for all MCP requests and responses
export type MCPRequestType =
  | MCPInitRequest
  | MCPProcessRequest
  | MCPUpdateConfigRequest
  | MCPGetStatusRequest;

export type MCPResponseType =
  | MCPInitResponse
  | MCPProcessResponse
  | MCPUpdateConfigResponse
  | MCPGetStatusResponse;

// Type guards for request/response identification
export function isMCPInitRequest(req: MCPRequest): req is MCPInitRequest {
  return "config" in req && "serverPath" in (req as any).config;
}

export function isMCPProcessRequest(req: MCPRequest): req is MCPProcessRequest {
  return "serverId" in req && "method" in req;
}

export function isMCPUpdateConfigRequest(
  req: MCPRequest,
): req is MCPUpdateConfigRequest {
  return "serverId" in req && "config" in req;
}

export function isMCPGetStatusRequest(
  req: MCPRequest,
): req is MCPGetStatusRequest {
  return (
    !("config" in req) &&
    !("method" in req) &&
    !("serverId" in req || "serverId" in req)
  );
}

// Utility type for channel handlers
export type MCPChannelHandler<T extends MCPRequest, R extends MCPResponse> = (
  request: T,
) => Promise<R>;

// Channel mapping for type safety
export interface MCPChannelMap {
  [MCP_CHANNELS.INIT]: {
    request: MCPInitRequest;
    response: MCPInitResponse;
  };
  [MCP_CHANNELS.PROCESS]: {
    request: MCPProcessRequest;
    response: MCPProcessResponse;
  };
  [MCP_CHANNELS.UPDATE_CONFIG]: {
    request: MCPUpdateConfigRequest;
    response: MCPUpdateConfigResponse;
  };
  [MCP_CHANNELS.GET_STATUS]: {
    request: MCPGetStatusRequest;
    response: MCPGetStatusResponse;
  };
}
