"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Circle,
  Square,
  Pause,
  Camera,
  Edit3,
  Flag,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  MousePointerClick,
  Maximize2,
} from "lucide-react";
import { cn } from "../../lib/utils";

type ViewportMode = "desktop" | "tablet" | "mobile";
type RecordingState = "idle" | "recording" | "paused";

interface SessionInfo {
  startTime: Date | null;
  elapsedTime: number;
  interactionCount: number;
  screenshots: number;
  issues: number;
  annotations: number;
}

const VIEWPORT_SIZES = {
  desktop: { width: "100%", height: "100%", label: "Desktop", icon: Monitor },
  tablet: { width: "768px", height: "1024px", label: "Tablet", icon: Tablet },
  mobile: { width: "375px", height: "667px", label: "Mobile", icon: Smartphone },
};

export const ManualTestingPanel: React.FC = () => {
  const [url, setUrl] = useState("http://localhost:3000");
  const [currentUrl, setCurrentUrl] = useState("http://localhost:3000");
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    startTime: null,
    elapsedTime: 0,
    interactionCount: 0,
    screenshots: 0,
    issues: 0,
    annotations: 0,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Handle session timer
  useEffect(() => {
    if (recordingState === "recording") {
      timerRef.current = setInterval(() => {
        setSessionInfo((prev) => ({
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recordingState]);

  const handleStartRecording = () => {
    setRecordingState("recording");
    setSessionInfo({
      startTime: new Date(),
      elapsedTime: 0,
      interactionCount: 0,
      screenshots: 0,
      issues: 0,
      annotations: 0,
    });
  };

  const handleStopRecording = () => {
    setRecordingState("idle");
    setSessionInfo((prev) => ({
      ...prev,
      startTime: null,
      elapsedTime: 0,
    }));
  };

  const handlePauseRecording = () => {
    setRecordingState("paused");
  };

  const handleResumeRecording = () => {
    setRecordingState("recording");
  };

  const handleNavigate = () => {
    setCurrentUrl(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNavigate();
    }
  };

  const handleScreenshot = () => {
    setSessionInfo((prev) => ({
      ...prev,
      screenshots: prev.screenshots + 1,
      interactionCount: prev.interactionCount + 1,
    }));
    // TODO: Implement screenshot capture
    console.log("📸 Screenshot captured");
  };

  const handleAnnotate = () => {
    setSessionInfo((prev) => ({
      ...prev,
      annotations: prev.annotations + 1,
      interactionCount: prev.interactionCount + 1,
    }));
    // TODO: Implement annotation mode
    console.log("✏️ Annotation mode activated");
  };

  const handleFlagIssue = () => {
    setSessionInfo((prev) => ({
      ...prev,
      issues: prev.issues + 1,
      interactionCount: prev.interactionCount + 1,
    }));
    // TODO: Implement issue flagging
    console.log("🚩 Issue flagged");
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl;
    }
    setSessionInfo((prev) => ({
      ...prev,
      interactionCount: prev.interactionCount + 1,
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getRecordingColor = () => {
    switch (recordingState) {
      case "recording":
        return "text-red-500";
      case "paused":
        return "text-amber-500";
      default:
        return "text-slate-500";
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="mac-heading"
            className="mac-heading text-2xl font-light text-foreground mac-title"
          >
            Manual Testing Mode
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Interactive testing with built-in recording and annotation tools
          </p>
        </div>

        {/* Recording Status Badge */}
        <Badge
          className={cn(
            "mac-glass px-4 py-2 transition-all duration-300",
            recordingState === "recording" && "animate-pulse",
            recordingState === "idle" && "opacity-50"
          )}
        >
          <Circle
            className={cn(
              "h-3 w-3 mr-2 fill-current transition-colors duration-300",
              getRecordingColor()
            )}
          />
          <span className="text-sm font-medium">
            {recordingState === "recording" && "Recording"}
            {recordingState === "paused" && "Paused"}
            {recordingState === "idle" && "Not Recording"}
          </span>
        </Badge>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-[1fr,400px] gap-6 flex-1 min-h-0">
        {/* Left Side - Browser View */}
        <div className="flex flex-col gap-4">
          {/* URL Bar */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 hover:scale-110 mac-button mac-button-outline"
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.history.back();
                    }
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 hover:scale-110 mac-button mac-button-outline"
                  onClick={() => {
                    if (iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.history.forward();
                    }
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:rotate-180 mac-button mac-button-outline"
                  onClick={handleReload}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>

                <Input
                  className="mac-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter URL to test..."
                  className="flex-1 mac-input border-[var(--mac-utility-border)] focus:border-[var(--mac-primary-blue-400)] transition-all duration-200"
                />

                <Button
                  onClick={handleNavigate}
                  className="mac-button-primary shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Go
                </Button>
              </div>

              {/* Viewport Selector */}
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground font-medium">Viewport:</span>
                {(Object.keys(VIEWPORT_SIZES) as ViewportMode[]).map((mode) => {
                  const Icon = VIEWPORT_SIZES[mode].icon;
                  return (
                    <Button
                      className="mac-button mac-button-primary"
                      key={mode}
                      variant={viewport === mode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewport(mode)}
                      className={cn(
                        "gap-2 transition-all duration-300",
                        viewport === mode && "shadow-lg shadow-blue-500/20"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {VIEWPORT_SIZES[mode].label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Browser Iframe */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border)] flex-1 overflow-hidden">
            <CardContent className="p-0 h-full">
              <div className="h-full w-full flex items-center justify-center bg-[var(--mac-surface-background)]">
                <div
                  className="transition-all duration-500 ease-out h-full"
                  style={{
                    width: VIEWPORT_SIZES[viewport].width,
                    maxWidth: "100%",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-0 rounded-lg shadow-2xl"
                    title="Application Under Test"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Control Panel */}
        <div className="flex flex-col gap-4">
          {/* Recording Controls */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border)]">
            <CardContent className="p-6">
              <h3
                className="mac-title"
                className="mac-title text-sm font-medium text-foreground mb-4 flex items-center gap-2"
              >
                <Circle className="h-4 w-4 text-red-500" />
                Recording Controls
              </h3>

              <div className="flex flex-col gap-2">
                {recordingState === "idle" && (
                  <Button
                    onClick={handleStartRecording}
                    className="mac-button-primary w-full gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                    Start Recording
                  </Button>
                )}

                {recordingState === "recording" && (
                  <>
                    <Button
                      onClick={handlePauseRecording}
                      variant="outline"
                      className="w-full gap-2 transition-all duration-200 mac-button mac-button-outline"
                    >
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      variant="destructive"
                      className="w-full gap-2 transition-all duration-200 mac-button mac-button-primary"
                    >
                      <Square className="h-4 w-4" />
                      Stop & Save
                    </Button>
                  </>
                )}

                {recordingState === "paused" && (
                  <>
                    <Button
                      onClick={handleResumeRecording}
                      className="mac-button-primary w-full gap-2 shadow-lg transition-all duration-200"
                    >
                      <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                      Resume
                    </Button>
                    <Button
                      onClick={handleStopRecording}
                      variant="destructive"
                      className="w-full gap-2 transition-all duration-200 mac-button mac-button-primary"
                    >
                      <Square className="h-4 w-4" />
                      Stop & Save
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border)]">
            <CardContent className="p-6">
              <h3
                className="mac-title"
                className="mac-title text-sm font-medium text-foreground mb-4 flex items-center gap-2"
              >
                <Clock className="h-4 w-4 text-blue-500" />
                Session Information
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Session Time</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono transition-all duration-300",
                      recordingState === "recording" && "text-blue-400 border-blue-400/30"
                    )}
                  >
                    {formatTime(sessionInfo.elapsedTime)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Interactions</span>
                  <Badge variant="outline" className="font-mono">
                    {sessionInfo.interactionCount}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Screenshots</span>
                  <Badge variant="outline" className="font-mono">
                    {sessionInfo.screenshots}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Issues Flagged</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono",
                      sessionInfo.issues > 0 && "text-red-400 border-red-400/30"
                    )}
                  >
                    {sessionInfo.issues}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Annotations</span>
                  <Badge variant="outline" className="font-mono">
                    {sessionInfo.annotations}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border)]">
            <CardContent className="p-6">
              <h3
                className="mac-title"
                className="mac-title text-sm font-medium text-foreground mb-4 flex items-center gap-2"
              >
                <Maximize2 className="h-4 w-4 text-purple-500" />
                Quick Actions
              </h3>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleScreenshot}
                  variant="outline"
                  className="w-full gap-2 justify-start transition-all duration-200 hover:border-blue-400 hover:text-blue-400 mac-button mac-button-outline"
                  disabled={recordingState === "idle"}
                >
                  <Camera className="h-4 w-4" />
                  Take Screenshot
                </Button>

                <Button
                  onClick={handleAnnotate}
                  variant="outline"
                  className="w-full gap-2 justify-start transition-all duration-200 hover:border-purple-400 hover:text-purple-400 mac-button mac-button-outline"
                  disabled={recordingState === "idle"}
                >
                  <Edit3 className="h-4 w-4" />
                  Add Annotation
                </Button>

                <Button
                  onClick={handleFlagIssue}
                  variant="outline"
                  className="w-full gap-2 justify-start transition-all duration-200 hover:border-red-400 hover:text-red-400 mac-button mac-button-outline"
                  disabled={recordingState === "idle"}
                >
                  <Flag className="h-4 w-4" />
                  Flag Issue
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Testing Tips */}
          <Card className="mac-card mac-glass border-[var(--mac-utility-border-elevated)] bg-gradient-to-br from-blue-950/20 to-purple-950/20">
            <CardContent className="p-6">
              <h3
                className="mac-title"
                className="mac-title text-sm font-medium text-foreground mb-4 flex items-center gap-2"
              >
                <MousePointerClick className="h-4 w-4 text-blue-400" />
                Testing Tips
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Start recording before testing to capture all interactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Use annotations to mark areas of interest</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Flag issues immediately when discovered</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>Test across different viewport sizes</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManualTestingPanel;
