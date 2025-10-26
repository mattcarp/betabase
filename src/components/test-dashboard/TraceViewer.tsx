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
        return <Eye cclassName="h-4 w-4" />;
      case "click":
        return <MousePointer cclassName="h-4 w-4" />;
      case "input":
        return <Code cclassName="h-4 w-4" />;
      case "assertion":
        return <AlertCircle cclassName="h-4 w-4" />;
      case "screenshot":
        return <Monitor cclassName="h-4 w-4" />;
      case "network":
        return <Network cclassName="h-4 w-4" />;
      default:
        return <Info cclassName="h-4 w-4" />;
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
      <div cclassName="space-y-6 relative">
        {/* Playback Controls */}
        <Card cclassName="mac-card">
          <CardContent cclassName="p-4">
            <div cclassName="flex items-center justify-between">
              <div cclassName="flex items-center gap-2">
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="outline"
                  cclassName="mac-button mac-button-outline"
                  size="icon"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                >
                  <SkipBack cclassName="h-4 w-4" />
                </Button>
                <Button
                  cclassName="mac-button mac-button-primary"
                  variant="default"
                  cclassName="mac-button mac-button-primary"
                  size="icon"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause cclassName="h-4 w-4" /> : <Play cclassName="h-4 w-4" />}
                </Button>
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="outline"
                  cclassName="mac-button mac-button-outline"
                  size="icon"
                  onClick={() => setCurrentStep(Math.min(traceSteps.length - 1, currentStep + 1))}
                >
                  <SkipForward cclassName="h-4 w-4" />
                </Button>

                <div cclassName="ml-4 flex items-center gap-2">
                  <span cclassName="text-sm text-muted-foreground">Speed:</span>
                  <div cclassName="flex gap-2">
                    {[0.5, 1, 2, 4].map((speed) => (
                      <Button
                        cclassName="mac-button mac-button-primary"
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

              <div cclassName="flex items-center gap-2">
                <Button
                  cclassName="mac-button mac-button-primary"
                  variant={annotationsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAnnotationsEnabled(!annotationsEnabled)}
                  cclassName="gap-2"
                >
                  <Pencil cclassName="h-4 w-4" />
                  Annotations
                </Button>
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="outline"
                  cclassName="mac-button mac-button-outline"
                  size="sm"
                >
                  <Maximize2 cclassName="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
                <Button
                  cclassName="mac-button mac-button-outline"
                  variant="outline"
                  cclassName="mac-button mac-button-outline"
                  size="sm"
                >
                  <Download cclassName="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <div cclassName="mt-4 space-y-3">
              <Slider
                value={[currentStep]}
                max={traceSteps.length - 1}
                step={1}
                onValueChange={(value) => setCurrentStep(value[0])}
                cclassName="w-full"
              />
              <div cclassName="flex justify-between text-xs text-muted-foreground">
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

        <div cclassName="grid grid-cols-12 gap-6">
          {/* Timeline */}
          <div cclassName="col-span-3">
            <Card cclassName="mac-card h-[600px]">
              <CardHeader cclassName="mac-card">
                <CardTitle cclassName="text-lg flex items-center gap-2">
                  <Clock cclassName="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent cclassName="p-0">
                <ScrollArea cclassName="h-[530px]">
                  <div cclassName="p-4 space-y-2">
                    {traceSteps.map((step, index) => (
                      <Card
                        key={step.id}
                        cclassName={cn(
                          "mac-card",
                          "cursor-pointer transition-all",
                          currentStep === index && "ring-2 ring-primary bg-primary/5",
                          step.status === "failure" && "border-red-500/20",
                          step.status === "warning" && "border-yellow-500/20"
                        )}
                        onClick={() => handleStepClick(index)}
                      >
                        <CardContent cclassName="p-4">
                          <div cclassName="flex items-start gap-4">
                            <div
                              cclassName={cn(
                                "p-2 rounded-lg",
                                step.status === "success" && "bg-green-500/10 text-green-500",
                                step.status === "failure" && "bg-red-500/10 text-red-500",
                                step.status === "warning" && "bg-yellow-500/10 text-yellow-500"
                              )}
                            >
                              {getStepIcon(step.type)}
                            </div>
                            <div cclassName="flex-1">
                              <p cclassName="text-sm font-medium">{step.description}</p>
                              <p cclassName="text-xs text-muted-foreground mt-2">
                                {formatTime(step.timestamp)}
                                {step.duration && ` • ${step.duration}ms`}
                              </p>
                            </div>
                            {currentStep === index && (
                              <ChevronRight cclassName="h-4 w-4 text-primary" />
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
          <div cclassName="col-span-6">
            <Card cclassName="mac-card h-[600px]">
              <CardHeader cclassName="mac-card">
                <div cclassName="flex items-center justify-between">
                  <CardTitle cclassName="text-lg">Viewport</CardTitle>
                  <div cclassName="flex gap-2">
                    <Button
                      cclassName="mac-button mac-button-primary"
                      variant={selectedDevice === "desktop" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDevice("desktop")}
                    >
                      <Monitor cclassName="h-4 w-4" />
                    </Button>
                    <Button
                      cclassName="mac-button mac-button-primary"
                      variant={selectedDevice === "mobile" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDevice("mobile")}
                    >
                      <Smartphone cclassName="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent cclassName="mac-card">
                <div
                  cclassName={cn(
                    "bg-muted rounded-lg flex items-center justify-center",
                    selectedDevice === "desktop"
                      ? "aspect-video"
                      : "aspect-[9/16] max-w-[300px] mx-auto"
                  )}
                >
                  {traceSteps[currentStep]?.screenshot ? (
                    <div cclassName="text-center">
                      <Monitor cclassName="h-16 w-16 text-muted-foreground mb-2" />
                      <p cclassName="text-sm text-muted-foreground">
                        Screenshot: {traceSteps[currentStep].screenshot}
                      </p>
                    </div>
                  ) : (
                    <div cclassName="text-center">
                      <div cclassName="mb-4">{getStepIcon(traceSteps[currentStep]?.type || "")}</div>
                      <p cclassName="text-sm font-medium">{traceSteps[currentStep]?.description}</p>
                      {traceSteps[currentStep]?.selector && (
                        <code cclassName="text-xs bg-muted-foreground/10 px-2 py-2 rounded mt-2 inline-block">
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
          <div cclassName="col-span-3">
            <Card cclassName="mac-card h-[600px]">
              <CardHeader cclassName="mac-card">
                <CardTitle cclassName="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent cclassName="mac-card">
                <Tabs defaultValue="console" cclassName="h-full">
                  <TabsList cclassName="grid w-full grid-cols-3">
                    <TabsTrigger value="console">Console</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                    <TabsTrigger value="source">Source</TabsTrigger>
                  </TabsList>

                  <TabsContent value="console">
                    <ScrollArea cclassName="h-[450px]">
                      <div cclassName="space-y-2">
                        {consoleLog.map((log, index) => (
                          <div
                            key={index}
                            cclassName={cn(
                              "flex items-start gap-2 p-2 rounded text-xs font-mono",
                              log.type === "error" && "bg-red-500/10 text-red-400",
                              log.type === "warn" && "bg-yellow-500/10 text-yellow-400",
                              log.type === "info" && "bg-blue-500/10 text-blue-400"
                            )}
                          >
                            <span cclassName="text-muted-foreground">{log.timestamp}</span>
                            <span>{log.message}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="network">
                    {traceSteps[currentStep]?.networkData ? (
                      <div cclassName="space-y-3">
                        <div cclassName="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span cclassName="text-muted-foreground">Method:</span>
                            <Badge variant="outline" cclassName="ml-2">
                              {traceSteps[currentStep].networkData.method}
                            </Badge>
                          </div>
                          <div>
                            <span cclassName="text-muted-foreground">Status:</span>
                            <Badge
                              variant={
                                traceSteps[currentStep].networkData.status === 200
                                  ? "default"
                                  : "destructive"
                              }
                              cclassName="ml-2"
                            >
                              {traceSteps[currentStep].networkData.status}
                            </Badge>
                          </div>
                          <div>
                            <span cclassName="text-muted-foreground">Duration:</span>
                            <span cclassName="ml-2">
                              {traceSteps[currentStep].networkData.duration}ms
                            </span>
                          </div>
                          <div>
                            <span cclassName="text-muted-foreground">Size:</span>
                            <span cclassName="ml-2">{traceSteps[currentStep].networkData.size}</span>
                          </div>
                        </div>
                        <div>
                          <span cclassName="text-sm text-muted-foreground">URL:</span>
                          <code cclassName="block text-xs bg-muted p-2 rounded mt-2">
                            {traceSteps[currentStep].networkData.url}
                          </code>
                        </div>
                      </div>
                    ) : (
                      <p cclassName="text-sm text-muted-foreground">No network activity</p>
                    )}
                  </TabsContent>

                  <TabsContent value="source">
                    <Card cclassName="mac-card bg-muted/50">
                      <CardContent cclassName="p-4">
                        <pre cclassName="text-xs font-mono overflow-x-auto">
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
