"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
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
  Sparkles,
  GitBranch,
  Zap,
  Eye,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { TestExecutionPanel } from "./TestExecutionPanel";
import { TestResultsViewer } from "./TestResultsViewer";
import { AITestGenerator } from "./AITestGenerator";
import { TraceViewer } from "./TraceViewer";
import { CoverageReport } from "./CoverageReport";
import { FlakyTestExplorer } from "./FlakyTestExplorer";
import { TestAnalytics } from "./TestAnalytics";
import { FirecrawlPanel } from "./FirecrawlPanel";

interface TestDashboardProps {
  className?: string;
}

export const TestDashboard: React.FC<TestDashboardProps> = ({ className }) => {
  const [activeView, setActiveView] = useState("execution");
  const [isRunning, setIsRunning] = useState(false);
  const [testStats, setTestStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    running: 0,
    duration: 0,
  });

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
    setTestStats({
      total: 150,
      passed: 0,
      failed: 0,
      skipped: 0,
      running: 150,
      duration: 0,
    });

    try {
      // Call the test execution API
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
            workers: 4,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start test execution");
      }

      const data = await response.json();
      console.log("Test execution started:", data);

      // Poll for status updates
      const pollInterval = setInterval(async () => {
        const statusResponse = await fetch(
          `/api/test/execute?executionId=${data.executionId}`,
        );
        if (statusResponse.ok) {
          const status = await statusResponse.json();

          if (status.status === "completed") {
            clearInterval(pollInterval);
            setIsRunning(false);
            setTestStats({
              total: status.results.total,
              passed: status.results.passed,
              failed: status.results.failed,
              skipped: status.results.skipped,
              running: 0,
              duration: Math.floor(status.duration / 1000),
            });
          }
        }
      }, 2000);

      // Cleanup interval after timeout
      setTimeout(() => clearInterval(pollInterval), 60000);
    } catch (error) {
      console.error("Error running tests:", error);
      setIsRunning(false);
      alert("Failed to start test execution. Please try again.");
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
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header with Stats */}
      <div className="border-b bg-background/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-muted/50">
              <Activity className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
              className="gap-2"
              onClick={handleRerunFailed}
              disabled={isRunning || testStats.failed === 0}
            >
              <RefreshCw className="h-4 w-4" />
              Re-run Failed
            </Button>
          </div>
        </div>

        {/* Test Statistics Bar */}
        <div className="grid grid-cols-6 gap-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {testStats.total}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Passed
                  </span>
                </div>
                <span className="text-lg font-semibold text-emerald-700">
                  {testStats.passed}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Failed
                  </span>
                </div>
                <span className="text-lg font-semibold text-rose-700">
                  {testStats.failed}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Skipped
                  </span>
                </div>
                <span className="text-lg font-semibold text-amber-700">
                  {testStats.skipped}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Duration
                  </span>
                </div>
                <span className="text-lg font-semibold text-slate-700">
                  {formatDuration(testStats.duration)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Success
                  </span>
                </div>
                <span className="text-lg font-semibold text-blue-700">
                  {getSuccessRate()}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="mt-4">
            <Progress
              value={
                ((testStats.passed + testStats.failed + testStats.skipped) /
                  testStats.total) *
                100
              }
              className="h-2"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <Tabs
        value={activeView}
        onValueChange={setActiveView}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid grid-cols-8 w-full rounded-none border-b bg-muted/30">
          <TabsTrigger value="execution" className="gap-2">
            <Activity className="h-4 w-4" />
            Execution
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="ai-generate" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Generate
          </TabsTrigger>
          <TabsTrigger value="trace" className="gap-2">
            <Eye className="h-4 w-4" />
            Trace Viewer
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
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default TestDashboard;
