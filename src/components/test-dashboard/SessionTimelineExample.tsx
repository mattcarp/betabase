"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import SessionTimeline from "./SessionTimeline";
import { SessionInteraction, SessionTimelineFilter } from "../../types/session-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Play, Pause } from "lucide-react";

/**
 * SessionTimelineExample
 *
 * Demonstrates the SessionTimeline component with mock data
 * Shows real-time updates and interaction highlighting
 */
export const SessionTimelineExample: React.FC = () => {
  const [interactions, setInteractions] = useState<SessionInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<SessionInteraction | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Generate mock interactions for demo
  const generateMockInteraction = (): SessionInteraction => {
    const types = [
      "click",
      "type",
      "navigate",
      "scroll",
      "hover",
      "screenshot",
      "network",
      "error",
    ] as const;
    const statuses = ["success", "warning", "error", "info"] as const;

    const type = types[Math.floor(Math.random() * types.length)];
    const status =
      type === "error" ? "error" : statuses[Math.floor(Math.random() * statuses.length)];

    const mockInteractions = {
      click: {
        description: "Clicked submit button",
        elementDescription: "button.mac-button-primary",
        selector: '[data-testid="submit-btn"]',
      },
      type: {
        description: "Typed into email field",
        elementDescription: "input[type='email']",
        selector: '[name="email"]',
        value: "user@example.com",
      },
      navigate: {
        description: "Navigated to dashboard",
        url: "https://app.example.com/dashboard",
      },
      scroll: {
        description: "Scrolled to bottom of page",
        elementDescription: "main content area",
      },
      hover: {
        description: "Hovered over menu item",
        elementDescription: "nav.menu > li:nth-child(2)",
        selector: '[data-menu="settings"]',
      },
      screenshot: {
        description: "Captured page screenshot",
        thumbnail:
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100'%3E%3Crect fill='%23141414' width='200' height='100'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%234a9eff' text-anchor='middle' dominant-baseline='middle'%3EScreenshot%3C/text%3E%3C/svg%3E",
      },
      network: {
        description: "API request completed",
        networkData: {
          method: "POST",
          url: "/api/users",
          statusCode: 200,
          duration: Math.floor(Math.random() * 500) + 50,
          size: "1.2 KB",
        },
      },
      error: {
        description: "Failed to load resource",
        error: {
          message: "Network request failed",
          stack: "Error: Network request failed\n  at fetch...",
        },
      },
    };

    const mock = mockInteractions[type as keyof typeof mockInteractions];

    return {
      id: `interaction-${Date.now()}-${Math.random()}`,
      type: type as any,
      timestamp: Date.now(),
      status,
      duration: Math.floor(Math.random() * 200) + 10,
      ...mock,
    };
  };

  // Simulate real-time interaction recording
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const newInteraction = generateMockInteraction();
      setInteractions((prev) => [...prev, newInteraction]);
    }, 2000); // New interaction every 2 seconds

    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle interaction selection
  const handleInteractionClick = (interaction: SessionInteraction) => {
    setSelectedInteraction(interaction);
  };

  // Handle filter changes
  const handleFilterChange = (filter: SessionTimelineFilter) => {
    console.log("Filter changed:", filter);
  };

  // Toggle recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording && interactions.length === 0) {
      // Add initial interactions
      const initialInteractions = [
        generateMockInteraction(),
        generateMockInteraction(),
        generateMockInteraction(),
      ];
      setInteractions(initialInteractions);
    }
  };

  // Clear all interactions
  const clearInteractions = () => {
    setInteractions([]);
    setSelectedInteraction(null);
    setIsRecording(false);
  };

  return (
    <div className="flex h-screen bg-mac-surface-background">
      {/* Timeline Sidebar */}
      <SessionTimeline
        interactions={interactions}
        currentInteractionId={selectedInteraction?.id}
        onInteractionClick={handleInteractionClick}
        onFilterChange={handleFilterChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        defaultWidth={320}
        minWidth={240}
        maxWidth={600}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-mac-utility-border p-6 bg-mac-surface-elevated">
          <h1
            className="mac-heading"
            className="text-2xl font-light text-mac-text-primary mac-heading mb-2"
          >
            Session Timeline Demo
          </h1>
          <p className="text-sm text-mac-text-secondary mb-4">
            Demonstrates real-time interaction capture and timeline visualization
          </p>

          <div className="flex items-center gap-4">
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className="gap-2 mac-button mac-button-primary"
            >
              {isRecording ? (
                <>
                  <Pause className="h-4 w-4" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Recording
                </>
              )}
            </Button>

            <Button
              className="mac-button mac-button-outline"
              onClick={clearInteractions}
              variant="outline"
              className="mac-button mac-button-outline"
              size="sm"
              disabled={interactions.length === 0}
            >
              Clear All
            </Button>

            {isRecording && (
              <Badge
                variant="outline"
                className="animate-pulse bg-rose-500/10 text-rose-500 border-rose-500/30"
              >
                Recording...
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {selectedInteraction ? (
            <Card className="mac-card max-w-3xl mx-auto">
              <CardHeader className="mac-card">
                <CardTitle className="text-lg font-light flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={
                      selectedInteraction.status === "success"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                        : selectedInteraction.status === "error"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : selectedInteraction.status === "warning"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                    }
                  >
                    {selectedInteraction.type.toUpperCase()}
                  </Badge>
                  {selectedInteraction.description}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timestamp */}
                <div>
                  <h4
                    className="mac-title"
                    className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                  >
                    Timestamp
                  </h4>
                  <p className="text-sm text-mac-text-primary">
                    {new Date(selectedInteraction.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Element Description */}
                {selectedInteraction.elementDescription && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Element
                    </h4>
                    <code className="text-sm text-mac-text-primary bg-mac-surface-card px-2 py-2 rounded">
                      {selectedInteraction.elementDescription}
                    </code>
                  </div>
                )}

                {/* Selector */}
                {selectedInteraction.selector && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Selector
                    </h4>
                    <code className="text-sm text-mac-text-primary bg-mac-surface-card px-2 py-2 rounded">
                      {selectedInteraction.selector}
                    </code>
                  </div>
                )}

                {/* Value */}
                {selectedInteraction.value && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Value
                    </h4>
                    <p className="text-sm text-mac-text-primary italic">
                      "{selectedInteraction.value}"
                    </p>
                  </div>
                )}

                {/* URL */}
                {selectedInteraction.url && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      URL
                    </h4>
                    <p className="text-sm text-mac-text-primary break-all">
                      {selectedInteraction.url}
                    </p>
                  </div>
                )}

                {/* Duration */}
                {selectedInteraction.duration && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Duration
                    </h4>
                    <p className="text-sm text-mac-text-primary">
                      {selectedInteraction.duration}ms
                    </p>
                  </div>
                )}

                {/* Network Data */}
                {selectedInteraction.networkData && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Network Details
                    </h4>
                    <div className="bg-mac-surface-card p-4 rounded space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-mac-text-muted">Method:</span>
                        <span className="text-mac-text-primary font-medium">
                          {selectedInteraction.networkData.method}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mac-text-muted">Status:</span>
                        <span className="text-emerald-500 font-medium">
                          {selectedInteraction.networkData.statusCode}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mac-text-muted">Duration:</span>
                        <span className="text-mac-text-primary font-medium">
                          {selectedInteraction.networkData.duration}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mac-text-muted">Size:</span>
                        <span className="text-mac-text-primary font-medium">
                          {selectedInteraction.networkData.size}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-mac-utility-border">
                        <span className="text-mac-text-muted">URL:</span>
                        <p className="mac-body text-mac-text-primary break-all mt-2">
                          {selectedInteraction.networkData.url}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {selectedInteraction.error && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-rose-500 mb-2"
                    >
                      Error Details
                    </h4>
                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded space-y-2">
                      <p className="text-sm text-rose-400 font-medium">
                        {selectedInteraction.error.message}
                      </p>
                      {selectedInteraction.error.stack && (
                        <pre className="text-xs text-rose-300/80 overflow-auto max-h-32">
                          {selectedInteraction.error.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {/* Screenshot */}
                {selectedInteraction.thumbnail && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Screenshot
                    </h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedInteraction.thumbnail}
                      alt="Interaction screenshot"
                      className="rounded border border-mac-utility-border max-w-full"
                    />
                  </div>
                )}

                {/* Metadata */}
                {selectedInteraction.metadata && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-medium text-mac-text-secondary mb-2"
                    >
                      Metadata
                    </h4>
                    <pre className="text-xs text-mac-text-primary bg-mac-surface-card p-4 rounded overflow-auto max-h-48">
                      {JSON.stringify(selectedInteraction.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <h3
                  className="mac-title"
                  className="mac-title text-lg font-light text-mac-text-primary mb-2"
                >
                  No Interaction Selected
                </h3>
                <p className="text-sm text-mac-text-secondary">
                  {interactions.length === 0
                    ? "Click 'Start Recording' to begin capturing interactions"
                    : "Select an interaction from the timeline to view details"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionTimelineExample;
