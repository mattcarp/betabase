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

  const [primaryStatus, setPrimaryStatus] = useState<ConnectionStatus["type"]>("connected");

  const [showDropdown, setShowDropdown] = useState(false);

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
          const elevenLabsTest = await fetch("https://api.elevenlabs.io/v1/user", {
            method: "GET",
            headers: {
              "xi-api-key": elevenLabsApiKey,
            },
          });
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
      const hasDisconnected = newStatuses.some((s) => s.type === "disconnected");
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
      case "error":
      case "connecting":
        return "Services Running";
      default:
        return "Status Unknown";
    }
  };

  const connectedCount = statuses.filter((s) => s.type === "connected").length;
  const totalCount = statuses.length;

  return (
    <div
      className="relative flex items-center gap-2"
      onMouseEnter={() => setShowDropdown(true)}
      onMouseLeave={() => setShowDropdown(false)}
    >
      <Badge
        variant={primaryStatus === "connected" ? "default" : "secondary"}
        className={cn(
          "text-xs flex items-center gap-2 cursor-pointer transition-all duration-200",
          primaryStatus === "connected"
            ? "motiff-status-connected bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
            : primaryStatus === "connecting"
              ? "motiff-status-connecting bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
              : "motiff-status-disconnected bg-white/5 border-orange-400/30 text-orange-300 hover:bg-white/10"
        )}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full animate-pulse",
            getStatusColor(primaryStatus),
            primaryStatus === "connected"
              ? "bg-green-500"
              : primaryStatus === "connecting"
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
        />
        <span>
          {connectedCount}/{totalCount}
        </span>
        <span className="hidden lg:inline">{getPrimaryStatusText()}</span>
      </Badge>

      {/* MAC Design System Status Popup */}
      {showDropdown && (
        <div
          className="absolute top-full right-0 mt-4 min-w-[22rem] animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl shadow-2xl border border-white/20"
          style={{
            zIndex: 99999,
            background:
              "linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="p-6 space-y-4">
            {/* Header with visual flair */}
            <div className="flex items-center justify-between border-b border-white/20 pb-4">
              <div className="flex items-center gap-2">
                <div className="mac-floating-orb h-2 w-2" />
                <h3
                  c
                  className="mac-title"
                  lassName="mac-title text-base font-[400] tracking-wide text-white"
                >
                  System Health
                </h3>
              </div>
              <div className="text-xs font-[300] text-white/70">
                {connectedCount}/{totalCount} Online
              </div>
            </div>

            {/* Service Status Cards */}
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div
                  key={index}
                  className={cn(
                    "group relative overflow-hidden rounded-lg p-4 transition-all duration-300",
                    "hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                    status.type === "connected"
                      ? "bg-green-500/20 hover:bg-green-500/30 border border-green-500/40"
                      : status.type === "error"
                        ? "bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40"
                        : status.type === "disconnected"
                          ? "bg-red-500/20 hover:bg-red-500/30 border border-red-500/40"
                          : "bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40"
                  )}
                >
                  {/* Status gradient overlay */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r",
                      status.type === "connected"
                        ? "from-green-500/5 to-transparent"
                        : status.type === "error"
                          ? "from-orange-500/5 to-transparent"
                          : status.type === "disconnected"
                            ? "from-red-500/5 to-transparent"
                            : "from-yellow-500/5 to-transparent"
                    )}
                  />

                  <div className="relative flex items-center justify-between">
                    {/* Service Info */}
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg",
                          status.type === "connected"
                            ? "bg-green-500/20"
                            : status.type === "error"
                              ? "bg-orange-500/20"
                              : status.type === "disconnected"
                                ? "bg-red-500/20"
                                : "bg-yellow-500/20"
                        )}
                      >
                        {React.cloneElement(getStatusIcon(status.type) as React.ReactElement, {
                          className: cn(
                            "h-4 w-4",
                            status.type === "connected"
                              ? "text-green-400"
                              : status.type === "error"
                                ? "text-orange-400"
                                : status.type === "disconnected"
                                  ? "text-red-400"
                                  : "text-yellow-400"
                          ),
                        })}
                      </div>
                      <div>
                        <div className="text-sm font-[400] text-white">{status.service}</div>
                        <div className="text-xs font-[200] text-white/60">
                          {status.type === "connected"
                            ? "All systems operational"
                            : status.type === "disconnected"
                              ? "Service unavailable"
                              : status.type === "error"
                                ? "Connection error detected"
                                : "Establishing connection"}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "relative h-2 w-2 rounded-full",
                          status.type === "connected" || status.type === "connecting"
                            ? "animate-pulse"
                            : ""
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full blur-sm",
                            status.type === "connected"
                              ? "bg-green-400"
                              : status.type === "error"
                                ? "bg-orange-400"
                                : status.type === "disconnected"
                                  ? "bg-red-400"
                                  : "bg-yellow-400"
                          )}
                        />
                        <div
                          className={cn(
                            "relative h-full w-full rounded-full",
                            status.type === "connected"
                              ? "bg-green-500"
                              : status.type === "error"
                                ? "bg-orange-500"
                                : status.type === "disconnected"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-[300] uppercase tracking-wider",
                          status.type === "connected"
                            ? "text-green-400"
                            : status.type === "error"
                              ? "text-orange-400"
                              : status.type === "disconnected"
                                ? "text-red-400"
                                : "text-yellow-400"
                        )}
                      >
                        {status.type === "connected"
                          ? "Online"
                          : status.type === "disconnected"
                            ? "Offline"
                            : status.type === "error"
                              ? "Error"
                              : "Connecting"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with timestamp */}
            {statuses[0]?.lastChecked && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/10">
                <div className="h-1 w-1 rounded-full bg-white/50 animate-pulse" />
                <span className="text-xs font-[200] text-white/50 tracking-wide">
                  Last checked {statuses[0].lastChecked.toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
