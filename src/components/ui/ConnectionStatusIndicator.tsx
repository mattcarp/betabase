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
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([
    { type: "connecting", service: "Gemini" },
    { type: "connecting", service: "Database" },
  ]);

  const [primaryStatus, setPrimaryStatus] = useState<ConnectionStatus["type"]>("connected");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const checkConnections = async () => {
      const newStatuses: ConnectionStatus[] = [];

      try {
        const geminiCheck = await fetch("/api/chat", { method: "GET" });
        newStatuses.push({
          type: geminiCheck.ok ? "connected" : "error",
          service: "Gemini",
          lastChecked: new Date(),
        });
      } catch {
        newStatuses.push({
          type: "disconnected",
          service: "Gemini",
          lastChecked: new Date(),
        });
      }

      try {
        const dbCheck = await fetch("/api/health", { method: "GET" });
        newStatuses.push({
          type: dbCheck.ok ? "connected" : "disconnected",
          service: "Database",
          lastChecked: new Date(),
        });
      } catch (error) {
        console.error("Database health check error:", error);
        newStatuses.push({
          type: "disconnected",
          service: "Database",
          lastChecked: new Date(),
        });
      }

      setStatuses(newStatuses);

      const hasError = newStatuses.some((s) => s.type === "error");
      const hasDisconnected = newStatuses.some((s) => s.type === "disconnected");
      const hasConnected = newStatuses.some((s) => s.type === "connected");
      const allConnecting = newStatuses.every((s) => s.type === "connecting");

      if (hasError) setPrimaryStatus("error");
      else if (hasDisconnected) setPrimaryStatus("disconnected");
      else if (allConnecting) setPrimaryStatus("connecting");
      else if (hasConnected) setPrimaryStatus("connected");
      else setPrimaryStatus("disconnected");
    };

    // DISABLED: Causing Fast Refresh crash when API routes compile on first call
    // checkConnections();
    // const interval = setInterval(checkConnections, 120000);
    // return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ConnectionStatus["type"]) => {
    switch (status) {
      case "connected":
        return <Wifi className="h-3.5 w-3.5" />;
      case "disconnected":
        return <WifiOff className="h-3.5 w-3.5" />;
      case "connecting":
        return <Cloud className="h-3.5 w-3.5 animate-pulse" />;
      case "error":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <CloudOff className="h-3.5 w-3.5" />;
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

  const getStatusDescription = (status: ConnectionStatus["type"]) => {
    switch (status) {
      case "connected":
        return "All systems operational";
      case "disconnected":
        return "Service unavailable";
      case "error":
        return "Connection error detected";
      case "connecting":
        return "Establishing connection";
      default:
        return "Unknown status";
    }
  };

  const getStatusLabel = (status: ConnectionStatus["type"]) => {
    switch (status) {
      case "connected":
        return "Online";
      case "disconnected":
        return "Offline";
      case "error":
        return "Error";
      case "connecting":
        return "Connecting";
      default:
        return "Unknown";
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
      {/* Trigger Badge - MAC Design System compliant */}
      <Badge
        variant={primaryStatus === "connected" ? "default" : "secondary"}
        className={cn(
          "text-xs flex items-center gap-2 cursor-pointer transition-colors",
          primaryStatus === "connected"
            ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            : primaryStatus === "connecting"
              ? "bg-muted border-border text-muted-foreground hover:bg-muted/80"
              : "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
        )}
      >
        <div
          className={cn(
            "h-2 w-2 rounded-full",
            primaryStatus === "connecting" && "animate-pulse",
            primaryStatus === "connected"
              ? "bg-primary"
              : primaryStatus === "connecting"
                ? "bg-muted-foreground"
                : "bg-destructive"
          )}
        />
        <span>
          {connectedCount}/{totalCount}
        </span>
        <span className="hidden lg:inline">{getPrimaryStatusText()}</span>
      </Badge>

      {/* MAC Design System Compliant Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full right-0 mt-1 min-w-[280px] z-50",
            "rounded-md border border-border bg-popover text-popover-foreground shadow-md",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
          )}
        >
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                System Health
              </h3>
              <span className="text-xs text-muted-foreground">
                {connectedCount}/{totalCount} Online
              </span>
            </div>

            {/* Service Status Cards */}
            <div className="space-y-2">
              {statuses.map((status, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-md border bg-card p-3 transition-colors",
                    status.type === "connected"
                      ? "border-primary/30 hover:bg-primary/5"
                      : status.type === "error" || status.type === "disconnected"
                        ? "border-destructive/30 hover:bg-destructive/5"
                        : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    {/* Service Info */}
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-md",
                          status.type === "connected"
                            ? "bg-primary/10 text-primary"
                            : status.type === "error" || status.type === "disconnected"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-muted text-muted-foreground"
                        )}
                      >
                        {getStatusIcon(status.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {status.service}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusDescription(status.type)}
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          (status.type === "connected" || status.type === "connecting") &&
                            "animate-pulse",
                          status.type === "connected"
                            ? "bg-primary"
                            : status.type === "error" || status.type === "disconnected"
                              ? "bg-destructive"
                              : "bg-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium uppercase tracking-wide",
                          status.type === "connected"
                            ? "text-primary"
                            : status.type === "error" || status.type === "disconnected"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {getStatusLabel(status.type)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with timestamp */}
            {statuses[0]?.lastChecked && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                <div className="h-1 w-1 rounded-full bg-muted-foreground/50 animate-pulse" />
                <span className="text-xs text-muted-foreground">
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
