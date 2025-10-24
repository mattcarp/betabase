"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Activity,
  Brain,
  FileSearch,
  LineChart,
  Bug,
  GitBranch,
  Zap,
  Eye,
  MousePointerClick,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { TestExecutionPanel } from "./TestExecutionPanel";
import { TestResultsViewer } from "./TestResultsViewer";
import { AITestGenerator } from "./AITestGenerator";
import { TraceViewer } from "./TraceViewer";
import { SessionPlaybackViewer } from "./SessionPlaybackViewer";
import { CoverageReport } from "./CoverageReport";
import { FlakyTestExplorer } from "./FlakyTestExplorer";
import { TestAnalytics } from "./TestAnalytics";
import { FirecrawlPanel } from "./FirecrawlPanel";
import { UnifiedResultsDashboard } from "./UnifiedResultsDashboard";
import SessionTimeline from "./SessionTimeline";
import { SessionInteraction } from "../../types/session-timeline";
import { ManualTestingPanel } from "./ManualTestingPanel";

interface TestDashboardProps {
  className?: string;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({ className }) => {
  const [activeView, setActiveView] = useState("unified");
  const [isRunning, setIsRunning] = useState(false);
  const [useRealTimeStreaming, setUseRealTimeStreaming] = useState(true);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [testStats, setTestStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    running: 0,
    duration: 0,
  });
  const [recentLogs, setRecentLogs] = useState<string[]>([]);

  // Session Timeline state
  const [sessionInteractions, setSessionInteractions] = useState<SessionInteraction[]>([]);
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | undefined>();
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  // Mock real-time test status updates
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTestStats((prev) => ({
          ...prev,
          running: Math.max(0, prev.running - 1),
          passed: prev.passed + (prev.running > 0 ? 1 : 0),
          duration: prev.duration + 1,
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const handleRunTests = async () => {
    setIsRunning(true);
    setRecentLogs([]);
    setTestStats({
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      running: 0,
      duration: 0,
    });

    try {
      console.log("🚀 Starting Playwright test execution...");

      if (useRealTimeStreaming) {
        // Use Server-Sent Events for real-time streaming
        const executionId = `exec_${Date.now()}`;
        setCurrentExecutionId(executionId);

        const response = await fetch("/api/test/ws", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "stream",
            executionId,
            testFiles: [], // Run all tests
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start streaming test execution");
        }

        // Handle Server-Sent Events stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          const processStream = async () => {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log("✅ Test stream completed");
                setIsRunning(false);
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split("\n").filter((line) => line.trim());

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const event = JSON.parse(line.slice(6));
                    handleStreamEvent(event);
                  } catch (error) {
                    console.warn("Failed to parse stream event:", line);
                  }
                }
              }
            }
          };

          processStream().catch((error) => {
            console.error("Stream processing error:", error);
            setIsRunning(false);
            alert("Test execution stream failed. Please try again.");
          });
        }
      } else {
        // Fallback to polling method
        const response = await fetch("/api/test/execute", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testSuite: "all",
            testFiles: [],
            options: {
              parallel: true,
              workers: 2,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start test execution");
        }

        const data = await response.json();
        console.log("Test execution started:", data);
        setCurrentExecutionId(data.executionId);

        // Poll for status updates
        const pollInterval = setInterval(async () => {
          const statusResponse = await fetch(`/api/test/execute?executionId=${data.executionId}`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();

            // Update stats from polling
            setTestStats({
              total: status.results.total || 0,
              passed: status.results.passed || 0,
              failed: status.results.failed || 0,
              skipped: status.results.skipped || 0,
              running: status.results.running || 0,
              duration: status.duration || 0,
            });

            if (status.recentOutput) {
              setRecentLogs((prev) => [...prev, ...status.recentOutput].slice(-10));
            }

            if (
              status.status === "completed" ||
              status.status === "failed" ||
              status.status === "error"
            ) {
              clearInterval(pollInterval);
              setIsRunning(false);
            }
          }
        }, 2000);

        // Cleanup interval after timeout
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsRunning(false);
        }, 300000); // 5 minutes timeout
      }
    } catch (error) {
      console.error("Error running tests:", error);
      setIsRunning(false);
      alert("Failed to start test execution. Please try again.");
    }
  };

  // Capture interaction for timeline
  const captureInteraction = (interaction: Omit<SessionInteraction, "id" | "timestamp">) => {
    const newInteraction: SessionInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setSessionInteractions((prev) => [...prev, newInteraction]);
  };

  // Handle interaction click from timeline
  const handleInteractionClick = (interaction: SessionInteraction) => {
    setSelectedInteractionId(interaction.id);
    console.log("Selected interaction:", interaction);
    // Here you would typically scroll to or highlight the relevant test result
  };

  // Handle real-time stream events
  const handleStreamEvent = (event: any) => {
    console.log("📡 Stream event:", event);

    switch (event.type) {
      case "begin":
        setTestStats((prev) => ({
          ...prev,
          total: event.totalTests || 0,
          running: event.totalTests || 0,
        }));
        setRecentLogs((prev) =>
          [...prev, `🏁 Test execution started with ${event.totalTests} tests`].slice(-10)
        );
        // Capture test start interaction
        captureInteraction({
          type: "navigate",
          description: `Test execution started (${event.totalTests} tests)`,
          status: "info",
        });
        break;

      case "testEnd":
        if (event.stats) {
          setTestStats(event.stats);
        }
        const status = event.test?.status || "unknown";
        const emoji = status === "passed" ? "✅" : status === "failed" ? "❌" : "⚠️";
        setRecentLogs((prev) =>
          [...prev, `${emoji} ${event.test?.title || "Test"} - ${status}`].slice(-10)
        );
        // Capture test completion interaction
        captureInteraction({
          type: status === "passed" ? "assertion" : "error",
          description: event.test?.title || "Test completed",
          status: status === "passed" ? "success" : "error",
          duration: event.test?.duration,
        });
        break;

      case "end":
        setTestStats(event.stats || {});
        setRecentLogs((prev) =>
          [...prev, `🏁 Test execution completed - Status: ${event.status}`].slice(-10)
        );
        setIsRunning(false);
        // Capture execution completion
        captureInteraction({
          type: "screenshot",
          description: "Test execution completed",
          status: event.status === "success" ? "success" : "error",
        });
        break;

      case "error":
      case "process_error":
        setRecentLogs((prev) => [...prev, `❌ Error: ${event.message || event.error}`].slice(-10));
        // Capture error interaction
        captureInteraction({
          type: "error",
          description: event.message || event.error || "Test error occurred",
          status: "error",
          error: {
            message: event.message || event.error || "Unknown error",
            stack: event.stack,
          },
        });
        break;

      case "complete":
        const completionStatus = event.status === "success" ? "✅ Success" : "❌ Failed";
        setRecentLogs((prev) =>
          [...prev, `🎯 Execution completed: ${completionStatus}`].slice(-10)
        );
        setIsRunning(false);
        break;

      case "log":
        setRecentLogs((prev) => [...prev, `📝 ${event.message}`].slice(-10));
        break;

      default:
        console.log("Unknown event type:", event.type);
    }
  };

  const handleRerunFailed = async () => {
    // This would be implemented to re-run only failed tests
    console.log("Re-running failed tests...");
    // Similar implementation to handleRunTests but with filter for failed tests
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSuccessRate = () => {
    if (testStats.total === 0) return 0;
    return Math.round((testStats.passed / testStats.total) * 100);
  };

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Session Timeline Sidebar */}
      <SessionTimeline
        interactions={sessionInteractions}
        currentInteractionId={selectedInteractionId}
        onInteractionClick={handleInteractionClick}
        isCollapsed={isTimelineCollapsed}
        onToggleCollapse={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
        defaultWidth={320}
        minWidth={240}
        maxWidth={600}
      />

      {/* Main Dashboard Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header with Stats */}
        <div className="border-b bg-background/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-md bg-muted/50">
                <Activity className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h1
                  c
                  className="mac-heading"
                  lassName="mac-heading text-2xl font-semibold tracking-tight text-foreground"
                >
                  Test Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Unified testing and quality assurance platform
                </p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                className="mac-button mac-button-primary"
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={isRunning ? () => setIsRunning(false) : handleRunTests}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Tests
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mac-button mac-button-outline"
                onClick={handleRerunFailed}
                disabled={isRunning || testStats.failed === 0}
              >
                <RefreshCw className="h-4 w-4" />
                Re-run Failed
              </Button>
            </div>
          </div>

          {/* Test Statistics Bar */}
          <div className="grid grid-cols-6 gap-4">
            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold text-foreground">{testStats.total}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-muted-foreground">Passed</span>
                  </div>
                  <span className="text-lg font-semibold text-emerald-700">{testStats.passed}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm font-medium text-muted-foreground">Failed</span>
                  </div>
                  <span className="text-lg font-semibold text-rose-700">{testStats.failed}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-muted-foreground">Skipped</span>
                  </div>
                  <span className="text-lg font-semibold text-amber-700">{testStats.skipped}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-muted-foreground">Duration</span>
                  </div>
                  <span className="text-lg font-semibold text-slate-700">
                    {formatDuration(testStats.duration)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Success</span>
                  </div>
                  <span className="text-lg font-semibold text-blue-700">{getSuccessRate()}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="mt-4">
              <Progress
                value={
                  testStats.total > 0
                    ? ((testStats.passed + testStats.failed + testStats.skipped) /
                        testStats.total) *
                      100
                    : 0
                }
                className="h-2"
              />
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {testStats.passed + testStats.failed + testStats.skipped} of {testStats.total}{" "}
                  tests completed
                </span>
                <span>Execution ID: {currentExecutionId}</span>
              </div>
            </div>
          )}

          {/* Real-time Logs Display */}
          {(isRunning || recentLogs.length > 0) && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Live Test Output</span>
                <Button
                  className="mac-button mac-button-outline"
                  variant="ghost"
                  className="mac-button mac-button-outline"
                  size="sm"
                  onClick={() => setUseRealTimeStreaming(!useRealTimeStreaming)}
                  className="text-xs"
                >
                  {useRealTimeStreaming ? "📡 Streaming" : "🔄 Polling"}
                </Button>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 max-h-24 overflow-y-auto">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div key={index} className="text-xs text-muted-foreground font-mono">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    {isRunning ? "Waiting for test output..." : "No recent logs"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-10 w-full rounded-none border-b bg-muted/30">
            <TabsTrigger value="unified" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Unified Results
            </TabsTrigger>
            <TabsTrigger value="execution" className="gap-2">
              <Activity className="h-4 w-4" />
              Execution
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <MousePointerClick className="h-4 w-4" />
              Manual Testing
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="gap-2">
              <Brain className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="trace" className="gap-2">
              <Eye className="h-4 w-4" />
              Trace Viewer
            </TabsTrigger>
            <TabsTrigger value="session-playback" className="gap-2">
              <Play className="h-4 w-4" />
              Session Playback
            </TabsTrigger>
            <TabsTrigger value="coverage" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Coverage
            </TabsTrigger>
            <TabsTrigger value="flaky" className="gap-2">
              <Bug className="h-4 w-4" />
              Flaky Tests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="firecrawl" className="gap-2">
              <FileSearch className="h-4 w-4" />
              Firecrawl
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="unified" className="m-0 p-6">
              <UnifiedResultsDashboard />
            </TabsContent>

            <TabsContent value="execution" className="m-0 p-6">
              <TestExecutionPanel
                isRunning={isRunning}
                onRunTests={handleRunTests}
                testStats={testStats}
              />
            </TabsContent>

            <TabsContent value="results" className="m-0 p-6">
              <TestResultsViewer />
            </TabsContent>

            <TabsContent value="manual" className="m-0 p-6 h-full">
              <ManualTestingPanel />
            </TabsContent>

            <TabsContent value="ai-generate" className="m-0 p-6">
              <AITestGenerator />
            </TabsContent>

            <TabsContent value="trace" className="m-0 p-6">
              <TraceViewer />
            </TabsContent>

            <TabsContent value="coverage" className="m-0 p-6">
              <CoverageReport />
            </TabsContent>

            <TabsContent value="flaky" className="m-0 p-6">
              <FlakyTestExplorer />
            </TabsContent>

            <TabsContent value="analytics" className="m-0 p-6">
              <TestAnalytics />
            </TabsContent>

            <TabsContent value="firecrawl" className="m-0 p-6">
              <FirecrawlPanel />
            </TabsContent>

            <TabsContent value="session-playback" className="m-0 p-6">
              <SessionPlaybackViewer />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
};

export default TestDashboard;
