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
  Lightbulb,
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
import { TestHomeDashboard } from "./TestHomeDashboard";
import { SelfHealingTestViewer } from "./SelfHealingTestViewer";
import { HistoricalTestExplorer } from "./HistoricalTestExplorer";
import { Wrench, Home } from "lucide-react";

interface TestDashboardProps {
  className?: string;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({ className }) => {
  const [activeView, setActiveView] = useState("home");
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
  
  // Historical analytics data from database
  const [historicalStats, setHistoricalStats] = useState({
    totalTests: 0,
    totalExecutions: 0,
    passRate: "0",
  });

  // Prefetched historical tests (ready before tab switch)
  const [prefetchedTests, setPrefetchedTests] = useState<any>(null);

  // Fetch real analytics on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/tests/analytics");
        if (response.ok) {
          const data = await response.json();
          setHistoricalStats({
            totalTests: data.summary?.totalTests || 0,
            totalExecutions: data.summary?.totalExecutions || 0,
            passRate: data.summary?.passRate || "0",
          });
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };
    fetchAnalytics();
  }, []);

  // Prefetch historical tests during idle time (non-blocking)
  useEffect(() => {
    const prefetchHistoricalTests = async () => {
      try {
        // Use requestIdleCallback if available, otherwise setTimeout
        const scheduleIdleFetch = (callback: () => void) => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            window.requestIdleCallback(callback, { timeout: 2000 });
          } else {
            setTimeout(callback, 1000);
          }
        };

        scheduleIdleFetch(async () => {
          const params = new URLSearchParams({
            page: "1",
            limit: "50", // First 50 tests
          });

          const response = await fetch(`/api/tests/historical?${params}`);
          if (response.ok) {
            const data = await response.json();
            setPrefetchedTests(data);
            console.log("✅ Prefetched 50 historical tests");
          }
        });
      } catch (error) {
        console.error("Failed to prefetch historical tests:", error);
        // Silent failure - not critical
      }
    };

    prefetchHistoricalTests();
  }, []);

  // Session Timeline state
  const [sessionInteractions, setSessionInteractions] = useState<SessionInteraction[]>([]);
  const [selectedInteractionId, setSelectedInteractionId] = useState<string | undefined>();
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(true); // Hidden by default

  // Real-time test status updates are handled via Server-Sent Events in handleRunTests
  // Real-time duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTestStats((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
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
        {/* Header with Stats - GOLD STANDARD COMPACT */}
        <div className="border-b border-border bg-background p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-light tracking-tight text-foreground">Test Dashboard</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Unified testing and quality assurance platform
                </p>
              </div>
            </div>

            {/* Control Buttons - GOLD STANDARD COMPACT */}
            <div className="flex items-center gap-2">
              <Button
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={isRunning ? () => setIsRunning(false) : handleRunTests}
                className={cn(
                  "gap-2 h-8 text-xs",
                  !isRunning && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isRunning ? (
                  <><Pause className="h-3.5 w-3.5" />Stop</>
                ) : (
                  <><Play className="h-3.5 w-3.5" />Run Tests</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-8 text-xs border-border text-foreground"
                onClick={handleRerunFailed}
                disabled={isRunning || testStats.failed === 0}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Re-run Failed
              </Button>
            </div>
          </div>

          {/* Test Statistics Bar - GOLD STANDARD UNIFIED BLUE */}
          <div className="grid grid-cols-6 gap-2">
            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5">
                  {isRunning ? "Running" : "Total"}
                </div>
                <span className="text-base font-light text-foreground">
                  {isRunning ? testStats.total : historicalStats.totalTests.toLocaleString()}
                </span>
              </CardContent>
            </Card>

            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Activity className="h-2.5 w-2.5 text-primary" />
                  Executions
                </div>
                <span className="text-base font-light text-primary">
                  {isRunning ? testStats.passed + testStats.failed : historicalStats.totalExecutions.toLocaleString()}
                </span>
              </CardContent>
            </Card>

            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <CheckCircle className="h-2.5 w-2.5 text-emerald-400" />
                  Pass Rate
                </div>
                <span className="text-base font-light text-emerald-400">
                  {isRunning ? `${getSuccessRate()}%` : `${historicalStats.passRate}%`}
                </span>
              </CardContent>
            </Card>

            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <XCircle className="h-2.5 w-2.5 text-rose-400" />
                  Failed
                </div>
                <span className="text-base font-light text-rose-400">{testStats.failed}</span>
              </CardContent>
            </Card>

            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                  Duration
                </div>
                <span className="text-base font-light text-muted-foreground">
                  {formatDuration(testStats.duration)}
                </span>
              </CardContent>
            </Card>

            <Card className="mac-card-static border-border bg-card/50">
              <CardContent className="p-2">
                <div className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mb-0.5 flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5 text-amber-400" />
                  Status
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isRunning ? "text-amber-400" : "text-emerald-400"
                )}>
                  {isRunning ? "⏳ In Progress" : "✅ Ready"}
                </span>
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

          {/* Real-time Logs - GOLD STANDARD COMPACT */}
          {(isRunning || recentLogs.length > 0) && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">Live Output</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseRealTimeStreaming(!useRealTimeStreaming)}
                  className="h-6 text-[9px] text-muted-foreground hover:text-foreground"
                >
                  {useRealTimeStreaming ? "📡 Streaming" : "🔄 Polling"}
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 max-h-20 overflow-y-auto border border-border">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, index) => (
                    <div key={index} className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-muted-foreground/50 italic">
                    {isRunning ? "Waiting for test output..." : "No recent logs"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex w-full rounded-none border-b border-border bg-background overflow-x-auto shrink-0">
            <TabsTrigger value="home" className="gap-2">
              <Home className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="self-healing" className="gap-2">
              <Wrench className="h-4 w-4" />
              Self-Healing
            </TabsTrigger>
            <TabsTrigger value="historical" className="gap-2">
              <FileSearch className="h-4 w-4" />
              Historical
            </TabsTrigger>
            <TabsTrigger value="unified" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Unified
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
              Manual
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              AI Generate
            </TabsTrigger>
            <TabsTrigger value="trace" className="gap-2">
              <Eye className="h-4 w-4" />
              Trace
            </TabsTrigger>
            <TabsTrigger value="session-playback" className="gap-2">
              <Play className="h-4 w-4" />
              Playback
            </TabsTrigger>
            <TabsTrigger value="coverage" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Coverage
            </TabsTrigger>
            <TabsTrigger value="flaky" className="gap-2">
              <Bug className="h-4 w-4" />
              Flaky
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <LineChart className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 relative min-h-0">
            <TabsContent value="home" className="m-0 p-6 h-full overflow-auto">
              <TestHomeDashboard
                onNavigate={setActiveView}
                testStats={{
                  total: testStats.total,
                  passed: testStats.passed,
                  failed: testStats.failed,
                  skipped: testStats.skipped,
                  duration: testStats.duration,
                }}
              />
            </TabsContent>

            <TabsContent value="self-healing" className="m-0 p-0 h-full overflow-auto">
              <SelfHealingTestViewer />
            </TabsContent>

            <TabsContent value="historical" className="m-0 p-4 h-full">
              <HistoricalTestExplorer prefetchedData={prefetchedTests} />
            </TabsContent>

            <TabsContent value="unified" className="m-0 p-6 h-full overflow-auto">
              <UnifiedResultsDashboard />
            </TabsContent>

            <TabsContent value="execution" className="m-0 p-6 h-full overflow-auto">
              <TestExecutionPanel
                isRunning={isRunning}
                onRunTests={handleRunTests}
                testStats={testStats}
              />
            </TabsContent>

            <TabsContent value="results" className="m-0 p-6 h-full overflow-auto">
              <TestResultsViewer />
            </TabsContent>

            <TabsContent value="manual" className="m-0 p-6 h-full">
              <ManualTestingPanel />
            </TabsContent>

            <TabsContent value="ai-generate" className="m-0 p-6 h-full overflow-auto">
              <AITestGenerator />
            </TabsContent>

            <TabsContent value="trace" className="m-0 p-6 h-full overflow-auto">
              <TraceViewer />
            </TabsContent>

            <TabsContent value="coverage" className="m-0 p-6 h-full overflow-auto">
              <CoverageReport />
            </TabsContent>

            <TabsContent value="flaky" className="m-0 p-6 h-full overflow-auto">
              <FlakyTestExplorer />
            </TabsContent>

            <TabsContent value="analytics" className="m-0 p-6 h-full overflow-auto">
              <TestAnalytics />
            </TabsContent>

            <TabsContent value="firecrawl" className="m-0 p-6 h-full overflow-auto">
              <FirecrawlPanel />
            </TabsContent>

            <TabsContent value="session-playback" className="m-0 p-6 h-full overflow-auto">
              <SessionPlaybackViewer />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default TestDashboard;
