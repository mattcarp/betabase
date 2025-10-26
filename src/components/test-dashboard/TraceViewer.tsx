"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  Download,
  Eye,
  Code,
  Network,
  // Terminal, // Unused
  Clock,
  MousePointer,
  Smartphone,
  Monitor,
  ChevronRight,
  AlertCircle,
  Info,
  Pencil,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { AnnotationManager, AnnotationPins } from "./AnnotationManager";
import { AnnotationProvider } from "../../contexts/AnnotationContext";

interface TraceStep {
  id: string;
  type: "navigation" | "click" | "input" | "assertion" | "screenshot" | "network";
  timestamp: number;
  description: string;
  selector?: string;
  value?: string;
  url?: string;
  status?: "success" | "failure" | "warning";
  duration?: number;
  screenshot?: string;
  networkData?: {
    method: string;
    url: string;
    status: number;
    duration: number;
    size: string;
  };
}

export const TraceViewer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [_showNetwork, _setShowNetwork] = useState(true); // Unused - keeping for future network panel
  const [_showConsole, _setShowConsole] = useState(true); // Unused - keeping for future console panel
  const [annotationsEnabled, setAnnotationsEnabled] = useState(false);

  const traceSteps: TraceStep[] = [
    {
      id: "1",
      type: "navigation",
      timestamp: 0,
      description: "Navigate to /login",
      url: "https://app.example.com/login",
      status: "success",
      duration: 1234,
    },
    {
      id: "2",
      type: "screenshot",
      timestamp: 1500,
      description: "Page loaded",
      screenshot: "screenshot-1.png",
      status: "success",
    },
    {
      id: "3",
      type: "input",
      timestamp: 2000,
      description: "Fill email field",
      selector: '[data-testid="email"]',
      value: "user@example.com",
      status: "success",
      duration: 150,
    },
    {
      id: "4",
      type: "input",
      timestamp: 2500,
      description: "Fill password field",
      selector: '[data-testid="password"]',
      value: "••••••••",
      status: "success",
      duration: 120,
    },
    {
      id: "5",
      type: "network",
      timestamp: 3000,
      description: "API Request: POST /api/auth",
      networkData: {
        method: "POST",
        url: "/api/auth",
        status: 200,
        duration: 450,
        size: "2.3 KB",
      },
      status: "success",
    },
    {
      id: "6",
      type: "click",
      timestamp: 3500,
      description: "Click login button",
      selector: '[data-testid="login-button"]',
      status: "success",
      duration: 50,
    },
    {
      id: "7",
      type: "assertion",
      timestamp: 4000,
      description: "Assert URL changed to /dashboard",
      status: "success",
    },
    {
      id: "8",
      type: "screenshot",
      timestamp: 4500,
      description: "Dashboard loaded",
      screenshot: "screenshot-2.png",
      status: "success",
    },
  ];

  const consoleLog = [
    {
      type: "info",
      message: "Application initialized",
      timestamp: "00:00.000",
    },
    { type: "log", message: "Navigating to /login", timestamp: "00:00.100" },
    { type: "warn", message: "Slow network detected", timestamp: "00:01.234" },
    { type: "log", message: "Form validation passed", timestamp: "00:02.500" },
    {
      type: "error",
      message: "Failed to load analytics script",
      timestamp: "00:03.000",
    },
    {
      type: "log",
      message: "Authentication successful",
      timestamp: "00:03.500",
    },
  ];

  const getStepIcon = (type: string) => {
    switch (type) {
      case "navigation":
        return <Eye className="h-4 w-4" />;
      case "click":
        return <MousePointer className="h-4 w-4" />;
      case "input":
        return <Code className="h-4 w-4" />;
      case "assertion":
        return <AlertCircle className="h-4 w-4" />;
      case "screenshot":
        return <Monitor className="h-4 w-4" />;
      case "network":
        return <Network className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(3, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <AnnotationProvider>
      <div className="space-y-6 relative">
        {/* Playback Controls */}
        <Card className="mac-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  className="mac-button mac-button-outline"
                  variant="outline"
                  className="mac-button mac-button-outline"
                  size="icon"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  className="mac-button mac-button-primary"
                  variant="default"
                  className="mac-button mac-button-primary"
                  size="icon"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  className="mac-button mac-button-outline"
                  variant="outline"
                  className="mac-button mac-button-outline"
                  size="icon"
                  onClick={() => setCurrentStep(Math.min(traceSteps.length - 1, currentStep + 1))}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>

                <div className="ml-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  <div className="flex gap-2">
                    {[0.5, 1, 2, 4].map((speed) => (
                      <Button
                        className="mac-button mac-button-primary"
                        key={speed}
                        variant={playbackSpeed === speed ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPlaybackSpeed(speed)}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="mac-button mac-button-primary"
                  variant={annotationsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnnotationsEnabled(!annotationsEnabled)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Annotations
                </Button>
                <Button
                  className="mac-button mac-button-outline"
                  variant="outline"
                  className="mac-button mac-button-outline"
                  size="sm"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
                <Button
                  className="mac-button mac-button-outline"
                  variant="outline"
                  className="mac-button mac-button-outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Slider
                value={[currentStep]}
                max={traceSteps.length - 1}
                step={1}
                onValueChange={(value) => setCurrentStep(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(traceSteps[currentStep]?.timestamp || 0)}</span>
                <span>{formatTime(traceSteps[traceSteps.length - 1]?.timestamp || 0)}</span>
              </div>

              {/* Annotation Pins */}
              {annotationsEnabled && (
                <AnnotationPins
                  currentStep={currentStep}
                  totalSteps={traceSteps.length}
                  onPinClick={(annotation) => {
                    console.log("Annotation clicked:", annotation);
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          {/* Timeline */}
          <div className="col-span-3">
            <Card className="mac-card h-[600px]">
              <CardHeader className="mac-card">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[530px]">
                  <div className="p-4 space-y-2">
                    {traceSteps.map((step, index) => (
                      <Card
                        key={step.id}
                        className={cn(
                          "mac-card",
                          "cursor-pointer transition-all",
                          currentStep === index && "ring-2 ring-primary bg-primary/5",
                          step.status === "failure" && "border-red-500/20",
                          step.status === "warning" && "border-yellow-500/20"
                        )}
                        onClick={() => handleStepClick(index)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                step.status === "success" && "bg-green-500/10 text-green-500",
                                step.status === "failure" && "bg-red-500/10 text-red-500",
                                step.status === "warning" && "bg-yellow-500/10 text-yellow-500"
                              )}
                            >
                              {getStepIcon(step.type)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{step.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTime(step.timestamp)}
                                {step.duration && ` • ${step.duration}ms`}
                              </p>
                            </div>
                            {currentStep === index && (
                              <ChevronRight className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Viewport */}
          <div className="col-span-6">
            <Card className="mac-card h-[600px]">
              <CardHeader className="mac-card">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Viewport</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      className="mac-button mac-button-primary"
                      variant={selectedDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDevice("desktop")}
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      className="mac-button mac-button-primary"
                      variant={selectedDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDevice("mobile")}
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mac-card">
                <div
                  className={cn(
                    "bg-muted rounded-lg flex items-center justify-center",
                    selectedDevice === "desktop"
                      ? "aspect-video"
                      : "aspect-[9/16] max-w-[300px] mx-auto"
                  )}
                >
                  {traceSteps[currentStep]?.screenshot ? (
                    <div className="text-center">
                      <Monitor className="h-16 w-16 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Screenshot: {traceSteps[currentStep].screenshot}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-4">{getStepIcon(traceSteps[currentStep]?.type || "")}</div>
                      <p className="text-sm font-medium">{traceSteps[currentStep]?.description}</p>
                      {traceSteps[currentStep]?.selector && (
                        <code className="text-xs bg-muted-foreground/10 px-2 py-2 rounded mt-2 inline-block">
                          {traceSteps[currentStep].selector}
                        </code>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Panel */}
          <div className="col-span-3">
            <Card className="mac-card h-[600px]">
              <CardHeader className="mac-card">
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <Tabs defaultValue="console" className="h-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="source">Source</TabsTrigger>
                  </TabsList>

                  <TabsContent value="console">
                    <ScrollArea className="h-[450px]">
                      <div className="space-y-2">
                        {consoleLog.map((log, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded text-xs font-mono",
                              log.type === "error" && "bg-red-500/10 text-red-400",
                              log.type === "warn" && "bg-yellow-500/10 text-yellow-400",
                              log.type === "info" && "bg-blue-500/10 text-blue-400"
                            )}
                          >
                            <span className="text-muted-foreground">{log.timestamp}</span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network">
                    {traceSteps[currentStep]?.networkData ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Method:</span>
                            <Badge variant="outline" className="ml-2">
                              {traceSteps[currentStep].networkData.method}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <Badge
                              variant={
                                traceSteps[currentStep].networkData.status === 200
                                  ? "default"
                                  : "destructive"
                              }
                              className="ml-2"
                            >
                              {traceSteps[currentStep].networkData.status}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="ml-2">
                              {traceSteps[currentStep].networkData.duration}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <span className="ml-2">{traceSteps[currentStep].networkData.size}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">URL:</span>
                          <code className="block text-xs bg-muted p-2 rounded mt-2">
                            {traceSteps[currentStep].networkData.url}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No network activity</p>
                    )}
                  </TabsContent>

                  <TabsContent value="source">
                    <Card className="mac-card bg-muted/50">
                      <CardContent className="p-4">
                        <pre className="text-xs font-mono overflow-x-auto">
                          {`await page.goto('${traceSteps[currentStep]?.url || "/"}');
${traceSteps[currentStep]?.selector ? `await page.click('${traceSteps[currentStep].selector}');` : ""}
${traceSteps[currentStep]?.value ? `await page.fill('input', '${traceSteps[currentStep].value}');` : ""}`}
                        </pre>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Annotation Manager - Overlay when enabled */}
        {annotationsEnabled && (
          <AnnotationManager
            timestamp={traceSteps[currentStep]?.timestamp || 0}
            totalSteps={traceSteps.length}
            currentStep={currentStep}
          />
        )}
      </div>
    </AnnotationProvider>
  );
};

export default TraceViewer;
