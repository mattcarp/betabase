"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Eye,
  Code,
  Network,
  Clock,
  MousePointer,
  Smartphone,
  Monitor,
  ChevronRight,
  AlertCircle,
  Info,
  Video,
  MessageSquare,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { SessionVideoExporter } from "../../utils/sessionVideoExporter";
import "../../styles/session-playback.css";

interface SessionAnnotation {
  id: string;
  stepId: string;
  timestamp: number;
  text: string;
  author: string;
  type: "note" | "bug" | "improvement";
}

interface InteractionOverlay {
  id: string;
  type: "click" | "input" | "hover";
  x: number;
  y: number;
  timestamp: number;
  duration: number;
  selector?: string;
  value?: string;
}

interface SessionStep {
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
  interactions?: InteractionOverlay[];
}

interface ConsoleLog {
  type: "info" | "log" | "warn" | "error";
  message: string;
  timestamp: string;
}

export const SessionPlaybackViewer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [isExporting, setIsExporting] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<InteractionOverlay[]>([]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock session data
  const sessionSteps: SessionStep[] = React.useMemo(() => [
    {
      id: "1",
      type: "navigation",
      timestamp: 0,
      description: "Navigate to /login",
      url: "https://app.example.com/login",
      status: "success",
      duration: 1234,
      interactions: [],
    },
    {
      id: "2",
      type: "screenshot",
      timestamp: 1500,
      description: "Page loaded",
      screenshot: "screenshot-1.png",
      status: "success",
      interactions: [],
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
      interactions: [
        {
          id: "int-1",
          type: "click",
          x: 200,
          y: 150,
          timestamp: 2000,
          duration: 100,
          selector: '[data-testid="email"]',
        },
        {
          id: "int-2",
          type: "input",
          x: 200,
          y: 150,
          timestamp: 2050,
          duration: 100,
          value: "user@example.com",
        },
      ],
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
      interactions: [
        {
          id: "int-3",
          type: "click",
          x: 200,
          y: 220,
          timestamp: 2500,
          duration: 100,
          selector: '[data-testid="password"]',
        },
        {
          id: "int-4",
          type: "input",
          x: 200,
          y: 220,
          timestamp: 2550,
          duration: 70,
          value: "••••••••",
        },
      ],
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
      interactions: [],
    },
    {
      id: "6",
      type: "click",
      timestamp: 3500,
      description: "Click login button",
      selector: '[data-testid="login-button"]',
      status: "success",
      duration: 50,
      interactions: [
        {
          id: "int-5",
          type: "click",
          x: 250,
          y: 300,
          timestamp: 3500,
          duration: 50,
          selector: '[data-testid="login-button"]',
        },
      ],
    },
    {
      id: "7",
      type: "assertion",
      timestamp: 4000,
      description: "Assert URL changed to /dashboard",
      status: "success",
      interactions: [],
    },
    {
      id: "8",
      type: "screenshot",
      timestamp: 4500,
      description: "Dashboard loaded",
      screenshot: "screenshot-2.png",
      status: "success",
      interactions: [],
    },
  ], []);

  const annotations: SessionAnnotation[] = [
    {
      id: "ann-1",
      stepId: "3",
      timestamp: 2000,
      text: "Email validation should be case-insensitive",
      author: "QA Team",
      type: "improvement",
    },
    {
      id: "ann-2",
      stepId: "6",
      timestamp: 3500,
      text: "Button click requires double-tap on mobile",
      author: "Mobile Tester",
      type: "bug",
    },
  ];

  const consoleLog: ConsoleLog[] = [
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

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setIsPlaying(false);
  };

  const handleExportVideo = async () => {
    if (!viewportRef.current) {
      console.error("Viewport element not found");
      return;
    }

    setIsExporting(true);

    try {
      const exporter = new SessionVideoExporter();

      const videoBlob = await exporter.exportSession(
        viewportRef.current,
        {
          format: "webm",
          quality: "medium",
          fps: 30,
          includeAudio: false,
        },
        (progress) => {
          console.log(`Export ${progress.phase}: ${progress.progress}%`);
        }
      );

      // Download the video
      SessionVideoExporter.downloadVideo(
        videoBlob,
        `session-playback-${Date.now()}.webm`
      );

      console.log("Video export completed successfully");
    } catch (error) {
      console.error("Failed to export video:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && viewportRef.current) {
      viewportRef.current.requestFullscreen();
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Playback automation
  useEffect(() => {
    if (isPlaying && currentStep < sessionSteps.length - 1) {
      const currentStepData = sessionSteps[currentStep];
      const nextStepData = sessionSteps[currentStep + 1];
      const delay = (nextStepData.timestamp - currentStepData.timestamp) / playbackSpeed;

      playbackTimerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, delay);
    } else if (currentStep >= sessionSteps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (playbackTimerRef.current) {
        clearTimeout(playbackTimerRef.current);
      }
    };
  }, [isPlaying, currentStep, playbackSpeed, sessionSteps]);

  // Show interaction overlays for current step
  useEffect(() => {
    const currentStepData = sessionSteps[currentStep];
    if (currentStepData?.interactions && currentStepData.interactions.length > 0) {
      setActiveOverlays(currentStepData.interactions);

      // Clear overlays after animation
      const timer = setTimeout(() => {
        setActiveOverlays([]);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setActiveOverlays([]);
    }
  }, [currentStep, sessionSteps]);

  const currentAnnotations = annotations.filter(
    (ann) => ann.stepId === sessionSteps[currentStep]?.id
  );

  return (
    <div className="space-y-6 mac-professional">
      {/* Playback Controls */}
      <Card className="mac-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="default" size="icon" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentStep(Math.min(sessionSteps.length - 1, currentStep + 1))
                }
                disabled={currentStep >= sessionSteps.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>

              <div className="ml-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground mac-body">Speed:</span>
                <div className="flex gap-1">
                  {[0.5, 1, 2].map((speed) => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                      className="min-w-[60px]"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportVideo}
                disabled={isExporting}
              >
                <Video className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export Video"}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Slider
              value={[currentStep]}
              max={sessionSteps.length - 1}
              step={1}
              onValueChange={(value) => {
                setCurrentStep(value[0]);
                setIsPlaying(false);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatTime(sessionSteps[currentStep]?.timestamp || 0)}</span>
              <span>
                Step {currentStep + 1} of {sessionSteps.length}
              </span>
              <span>{formatTime(sessionSteps[sessionSteps.length - 1]?.timestamp || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Timeline with Annotations */}
        <div className="col-span-3">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 mac-title">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[630px]">
                <div className="p-4 space-y-2">
                  {sessionSteps.map((step, index) => {
                    const stepAnnotations = annotations.filter((ann) => ann.stepId === step.id);
                    return (
                      <div key={step.id}>
                        <Card
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            currentStep === index && "ring-2 ring-primary bg-primary/5",
                            step.status === "failure" && "border-red-500/20",
                            step.status === "warning" && "border-yellow-500/20"
                          )}
                          onClick={() => handleStepClick(index)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
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
                                <p className="text-sm font-medium mac-body">{step.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">
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

                        {/* Annotations for this step */}
                        {stepAnnotations.length > 0 && (
                          <div className="ml-12 mt-2 space-y-1">
                            {stepAnnotations.map((ann) => (
                              <Card
                                key={ann.id}
                                className={cn(
                                  "border-l-2",
                                  ann.type === "bug" && "border-l-red-500 bg-red-500/5",
                                  ann.type === "improvement" && "border-l-blue-500 bg-blue-500/5",
                                  ann.type === "note" && "border-l-yellow-500 bg-yellow-500/5"
                                )}
                              >
                                <CardContent className="p-2">
                                  <div className="flex items-start gap-2">
                                    <MessageSquare className="h-3 w-3 mt-0.5" />
                                    <div className="flex-1">
                                      <p className="text-xs font-medium">{ann.text}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        - {ann.author}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Viewport with Interaction Overlays */}
        <div className="col-span-6">
          <Card className="h-[700px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg mac-title">Browser Viewport</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={selectedDevice === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDevice("desktop")}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={selectedDevice === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent ref={viewportRef}>
              <div
                className={cn(
                  "bg-muted rounded-lg flex items-center justify-center relative overflow-hidden",
                  selectedDevice === "desktop"
                    ? "aspect-video"
                    : "aspect-[9/16] max-w-[300px] mx-auto"
                )}
              >
                {/* Browser viewport simulation */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="p-8 text-white">
                    {sessionSteps[currentStep]?.screenshot ? (
                      <div className="text-center">
                        <Monitor className="h-16 w-16 text-muted-foreground mb-2 mx-auto" />
                        <p className="text-sm text-muted-foreground">
                          Screenshot: {sessionSteps[currentStep].screenshot}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4 flex justify-center">
                          {getStepIcon(sessionSteps[currentStep]?.type || "")}
                        </div>
                        <p className="text-sm font-medium">
                          {sessionSteps[currentStep]?.description}
                        </p>
                        {sessionSteps[currentStep]?.selector && (
                          <code className="text-xs bg-muted-foreground/10 px-2 py-1 rounded mt-2 inline-block">
                            {sessionSteps[currentStep].selector}
                          </code>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interaction Overlays */}
                {activeOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${overlay.x}px`,
                      top: `${overlay.y}px`,
                    }}
                  >
                    {overlay.type === "click" && (
                      <div className="relative">
                        {/* Ripple effect for clicks */}
                        <div className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-blue-500/50" />
                        <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-500/70" />
                        <div className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500" />
                      </div>
                    )}

                    {overlay.type === "input" && (
                      <div className="relative">
                        {/* Input highlight effect */}
                        <div className="absolute w-32 h-10 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-green-500 bg-green-500/20 animate-pulse" />
                        <Zap className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-green-500 animate-bounce" />
                      </div>
                    )}

                    {overlay.type === "hover" && (
                      <div className="absolute w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-yellow-500/50 bg-yellow-500/10 animate-pulse" />
                    )}
                  </div>
                ))}

                {/* Playback indicator */}
                {isPlaying && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-white font-medium">Playing {playbackSpeed}x</span>
                  </div>
                )}
              </div>

              {/* Current annotation display */}
              {currentAnnotations.length > 0 && (
                <div className="mt-4 space-y-2">
                  {currentAnnotations.map((ann) => (
                    <Card
                      key={ann.id}
                      className={cn(
                        "border-l-4",
                        ann.type === "bug" && "border-l-red-500 bg-red-500/5",
                        ann.type === "improvement" && "border-l-blue-500 bg-blue-500/5",
                        ann.type === "note" && "border-l-yellow-500 bg-yellow-500/5"
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 mt-0.5" />
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-1">
                              {ann.type}
                            </Badge>
                            <p className="text-sm font-medium">{ann.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">- {ann.author}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="col-span-3">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="text-lg mac-title">Interaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="interactions" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="interactions">Interactions</TabsTrigger>
                  <TabsTrigger value="console">Console</TabsTrigger>
                  <TabsTrigger value="network">Network</TabsTrigger>
                </TabsList>

                <TabsContent value="interactions" className="space-y-3">
                  <ScrollArea className="h-[580px]">
                    {sessionSteps[currentStep]?.interactions &&
                    sessionSteps[currentStep].interactions!.length > 0 ? (
                      <div className="space-y-2">
                        {sessionSteps[currentStep].interactions!.map((interaction) => (
                          <Card key={interaction.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                {interaction.type === "click" && (
                                  <MousePointer className="h-4 w-4 text-blue-500" />
                                )}
                                {interaction.type === "input" && (
                                  <Code className="h-4 w-4 text-green-500" />
                                )}
                                {interaction.type === "hover" && (
                                  <Eye className="h-4 w-4 text-yellow-500" />
                                )}
                                <div className="flex-1 space-y-1">
                                  <p className="text-xs font-medium capitalize">
                                    {interaction.type}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Position: ({interaction.x}, {interaction.y})
                                  </p>
                                  {interaction.selector && (
                                    <code className="block text-xs bg-muted p-1 rounded">
                                      {interaction.selector}
                                    </code>
                                  )}
                                  {interaction.value && (
                                    <p className="text-xs">Value: {interaction.value}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Duration: {interaction.duration}ms
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No interactions for this step
                      </p>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="console">
                  <ScrollArea className="h-[580px]">
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
                          <span className="text-muted-foreground shrink-0">
                            {log.timestamp}
                          </span>
                          <span className="break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="network">
                  {sessionSteps[currentStep]?.networkData ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Method:</span>
                          <Badge variant="outline" className="ml-2">
                            {sessionSteps[currentStep].networkData!.method}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant={
                              sessionSteps[currentStep].networkData!.status === 200
                                ? "default"
                                : "destructive"
                            }
                            className="ml-2"
                          >
                            {sessionSteps[currentStep].networkData!.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="ml-2">
                            {sessionSteps[currentStep].networkData!.duration}ms
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <span className="ml-2">
                            {sessionSteps[currentStep].networkData!.size}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">URL:</span>
                        <code className="block text-xs bg-muted p-2 rounded mt-1 break-all">
                          {sessionSteps[currentStep].networkData!.url}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No network activity
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SessionPlaybackViewer;
