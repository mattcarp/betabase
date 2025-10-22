/**
 * TypeScript declarations for MCP preload API
 *
 * This file provides type definitions for the MCP API exposed through
 * the Electron preload script to ensure type safety in the renderer process.
 */

import type {
  MCPInitResponse,
  MCPProcessResponse,
  MCPUpdateConfigResponse,
  MCPGetStatusResponse,
  MCPServerStatus,
} from "../shared/ipc/mcp";
import type { AOMAReshConfig, AOMAReshRequest } from "../services/aomaMeshMcp";

/**
 * Event structure for MCP status updates
 */
export interface MCPStatusEvent {
  type: "status-change" | "server-update" | "connection-change";
  serverId?: string;
  status?: MCPServerStatus;
  timestamp: number;
  data?: any;
}

/**
 * MCP API interface exposed to renderer process
 */
export interface MCPPreloadAPI {
  /**
   * Initialize MCP server with configuration
   * @param cfg - MCP initialization configuration
   * @returns Promise with initialization response
   */
  initialize(cfg: AOMAReshConfig): Promise<MCPInitResponse>;

  /**
   * Update MCP server configuration
   * @param cfg - Updated configuration (partial)
   * @returns Promise with update response
   */
  updateConfig(cfg: Partial<AOMAReshConfig>): Promise<MCPUpdateConfigResponse>;

  /**
   * Process a message through MCP
   * @param req - Message processing request
   * @returns Promise with processing response
   */
  processMessage(req: AOMAReshRequest): Promise<MCPProcessResponse>;

  /**
   * Get current MCP status
   * @returns Promise with status response
   */
  getStatus(): Promise<MCPGetStatusResponse>;

  /**
   * Listen for MCP status updates
   * @param callback - Function to call when status changes
   * @returns Cleanup function to remove listener
   */
  onStatusChange(callback: (event: MCPStatusEvent) => void): () => void;

  /**
   * Listen for MCP server updates
   * @param callback - Function to call when server updates
   * @returns Cleanup function to remove listener
   */
  onServerUpdate(callback: (serverId: string, status: MCPServerStatus) => void): () => void;

  /**
   * Listen for MCP connection changes
   * @param callback - Function to call when connection changes
   * @returns Cleanup function to remove listener
   */
  onConnectionChange(callback: (connected: boolean, serverId?: string) => void): () => void;

  /**
   * Remove all MCP event listeners
   */
  removeAllListeners(): void;
}

/**
 * Global window interface extension for MCP API
 */
declare global {
  interface Window {
    mcp: MCPPreloadAPI;
  }
}
