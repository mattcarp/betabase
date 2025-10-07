"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "./badge";
import { Wifi, WifiOff, Cloud, CloudOff, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface ConnectionStatus {
  type: "connected" | "disconnected" | "connecting" | "error";
  service: string;
  lastChecked?: Date;
}

export const ConnectionStatusIndicator: React.FC = () => {
  // Force component update with timestamp
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([
    { type: "connecting", service: "AOMA-MESH" },
    { type: "connecting", service: "OpenAI" },
    { type: "connecting", service: "ElevenLabs" },
  ]);

  const [primaryStatus, setPrimaryStatus] =
    useState<ConnectionStatus["type"]>("connected");

  // Simulate connection health checks
  useEffect(() => {
    const checkConnections = async () => {
      const newStatuses: ConnectionStatus[] = [];

      // Check AOMA-MESH MCP Server (Render deployment)
      try {
        // Check if we can reach the AOMA knowledge API
        const aomaHealthy = await fetch("/api/aoma/health", {
          method: "GET",
        });
        newStatuses.push({
          type: aomaHealthy.ok ? "connected" : "error",
          service: "AOMA-MESH",
          lastChecked: new Date(),
        });
      } catch {
        newStatuses.push({
          type: "disconnected",
          service: "AOMA-MESH",
          lastChecked: new Date(),
        });
      }

      // Check OpenAI - try a simple API test
      try {
        const openaiCheck = await fetch("/api/chat-vercel", {
          method: "GET",
        });
        newStatuses.push({
          type: openaiCheck.ok ? "connected" : "error",
          service: "OpenAI",
          lastChecked: new Date(),
        });
      } catch {
        newStatuses.push({
          type: "disconnected",
          service: "OpenAI",
          lastChecked: new Date(),
        });
      }

      // Check ElevenLabs TTS service
      try {
        const elevenLabsApiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
        if (!elevenLabsApiKey) {
          newStatuses.push({
            type: "disconnected",
            service: "ElevenLabs",
            lastChecked: new Date(),
          });
        } else {
          // Test ElevenLabs API with a quick user info request
          const elevenLabsTest = await fetch(
            "https://api.elevenlabs.io/v1/user",
            {
              method: "GET",
              headers: {
                "xi-api-key": elevenLabsApiKey,
              },
            }
          );
          newStatuses.push({
            type: elevenLabsTest.ok ? "connected" : "error",
            service: "ElevenLabs",
            lastChecked: new Date(),
          });
        }
      } catch {
        newStatuses.push({
          type: "disconnected",
          service: "ElevenLabs",
          lastChecked: new Date(),
        });
      }

      setStatuses(newStatuses);

      // Determine primary status
      const hasError = newStatuses.some((s) => s.type === "error");
      const hasDisconnected = newStatuses.some(
        (s) => s.type === "disconnected",
      );
      const hasConnected = newStatuses.some((s) => s.type === "connected");
      const allConnecting = newStatuses.every((s) => s.type === "connecting");

      if (hasError) {
        setPrimaryStatus("error");
      } else if (hasDisconnected) {
        setPrimaryStatus("disconnected");
      } else if (allConnecting) {
        setPrimaryStatus("connecting");
      } else if (hasConnected) {
        setPrimaryStatus("connected");
      } else {
        setPrimaryStatus("disconnected");
      }
    };

    // Initial check
    checkConnections();

    // Periodic health checks every 2 minutes (reduced frequency for performance)
    const interval = setInterval(checkConnections, 120000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ConnectionStatus["type"]) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-3 w-3" />;
      case "disconnected":
        return <WifiOff className="h-3 w-3" />;
      case "connecting":
        return <Cloud className="h-3 w-3 animate-pulse" />;
      case "error":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <CloudOff className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: ConnectionStatus["type"]) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "disconnected":
        return "text-red-500";
      case "connecting":
        return "text-yellow-500";
      case "error":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const getPrimaryStatusText = () => {
    switch (primaryStatus) {
      case "connected":
        return "All Systems Online";
      case "disconnected":
        return "Some Services Offline";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Connection Issues";
      default:
        return "Status Unknown";
    }
  };

  const connectedCount = statuses.filter((s) => s.type === "connected").length;
  const totalCount = statuses.length;

  return (
    <div 
      className="group relative flex items-center gap-2"
    >
      <Badge
        variant={primaryStatus === "connected" ? "default" : "secondary"}
        className={cn(
          "text-xs flex items-center gap-1 cursor-pointer transition-all duration-200",
          primaryStatus === "connected"
            ? "motiff-status-connected bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
            : primaryStatus === "connecting"
            ? "motiff-status-connecting bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
            : "motiff-status-disconnected bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20",
        )}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            getStatusColor(primaryStatus),
            primaryStatus === "connected" ? "bg-green-500" : 
            primaryStatus === "connecting" ? "bg-yellow-500" : "bg-red-500",
          )}
        />
        <span>
          {connectedCount}/{totalCount}
        </span>
        <span className="hidden sm:inline">{getPrimaryStatusText()}</span>
      </Badge>

      {/* Enhanced Status Display - Shows on hover */}
      <div
        className="hidden absolute top-full right-0 mt-2 p-3 bg-black/95 backdrop-blur-md border border-white/30 rounded-xl shadow-2xl min-w-[16rem] transition-opacity duration-200 group-hover:block"
        style={{ zIndex: 9999 }}>
          <div className="space-y-3">
          <div className="text-sm font-medium text-white border-b border-white/20 pb-2">
            Service Status
          </div>
          {statuses.map((status, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm hover:bg-white/5 rounded-lg p-2 transition-colors"
            >
              <span className="flex items-center gap-2">
                {getStatusIcon(status.type)}
                <span className="text-white font-medium">{status.service}</span>
              </span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  status.type === "connected" ? "bg-green-500 animate-pulse" :
                  status.type === "error" ? "bg-orange-500" :
                  status.type === "disconnected" ? "bg-red-500" :
                  "bg-yellow-500 animate-pulse"
                )} />
                <span className={cn("capitalize text-xs font-medium", getStatusColor(status.type))}>
                  {status.type === "connected" ? "Online" :
                   status.type === "disconnected" ? "Offline" :
                   status.type === "error" ? "Error" : "Connecting"}
                </span>
              </div>
            </div>
          ))}
          {statuses[0]?.lastChecked && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-gray-400 text-center">
              Last checked: {statuses[0].lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
