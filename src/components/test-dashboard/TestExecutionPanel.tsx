"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Cpu,
  HardDrive,
  Wifi,
  ChevronRight,
  Terminal,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface TestExecutionPanelProps {
  isRunning: boolean;
  onRunTests: () => void;
  testStats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    running: number;
    duration: number;
  };
}

interface TestSuite {
  id: string;
  name: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  tests: Test[];
  duration?: number;
  progress?: number;
}

interface Test {
  id: string;
  name: string;
  suite: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  duration?: number;
  error?: string;
  retries?: number;
}

export const TestExecutionPanel: React.FC<TestExecutionPanelProps> = ({
  isRunning,
  onRunTests,
  testStats,
}) => {
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: "auth",
      name: "Authentication Tests",
      status: "pending",
      tests: [
        {
          id: "auth-1",
          name: "Login with valid credentials",
          suite: "auth",
          status: "pending",
        },
        {
          id: "auth-2",
          name: "Login with invalid credentials",
          suite: "auth",
          status: "pending",
        },
        {
          id: "auth-3",
          name: "Magic link authentication",
          suite: "auth",
          status: "pending",
        },
        {
          id: "auth-4",
          name: "Session persistence",
          suite: "auth",
          status: "pending",
        },
      ],
    },
    {
      id: "api",
      name: "API Integration Tests",
      status: "pending",
      tests: [
        {
          id: "api-1",
          name: "Health check endpoint",
          suite: "api",
          status: "pending",
        },
        {
          id: "api-2",
          name: "Chat completion endpoint",
          suite: "api",
          status: "pending",
        },
        {
          id: "api-3",
          name: "Vector store operations",
          suite: "api",
          status: "pending",
        },
        {
          id: "api-4",
          name: "WebSocket connections",
          suite: "api",
          status: "pending",
        },
      ],
    },
    {
      id: "ui",
      name: "UI Component Tests",
      status: "pending",
      tests: [
        {
          id: "ui-1",
          name: "Chat interface rendering",
          suite: "ui",
          status: "pending",
        },
        {
          id: "ui-2",
          name: "Message streaming",
          suite: "ui",
          status: "pending",
        },
        {
          id: "ui-3",
          name: "File upload component",
          suite: "ui",
          status: "pending",
        },
        { id: "ui-4", name: "Navigation tabs", suite: "ui", status: "pending" },
      ],
    },
    {
      id: "e2e",
      name: "End-to-End Tests",
      status: "pending",
      tests: [
        {
          id: "e2e-1",
          name: "Complete user journey",
          suite: "e2e",
          status: "pending",
        },
        {
          id: "e2e-2",
          name: "Document upload and processing",
          suite: "e2e",
          status: "pending",
        },
        {
          id: "e2e-3",
          name: "AI conversation flow",
          suite: "e2e",
          status: "pending",
        },
      ],
    },
  ]);

  const [systemResources, setSystemResources] = useState({
    cpu: 45,
    memory: 62,
    network: 78,
  });

  // Simulate test execution
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTestSuites((prev) => {
          const updated = [...prev];
          const pendingSuite = updated.find((s) => s.status === "pending");

          if (pendingSuite) {
            pendingSuite.status = "running";
            pendingSuite.progress = 0;
          } else {
            const runningSuite = updated.find((s) => s.status === "running");
            if (runningSuite) {
              if (runningSuite.progress === undefined)
                runningSuite.progress = 0;
              runningSuite.progress += 25;

              if (runningSuite.progress >= 100) {
                runningSuite.status = Math.random() > 0.1 ? "passed" : "failed";
                runningSuite.duration = Math.floor(Math.random() * 5000) + 1000;
              }

              // Update individual tests
              runningSuite.tests.forEach((test) => {
                if (test.status === "pending" && Math.random() > 0.5) {
                  test.status = "running";
                } else if (test.status === "running" && Math.random() > 0.3) {
                  test.status = Math.random() > 0.15 ? "passed" : "failed";
                  test.duration = Math.floor(Math.random() * 2000) + 100;
                }
              });
            }
          }

          return updated;
        });

        // Update system resources
        setSystemResources({
          cpu: Math.min(
            100,
            Math.max(20, systemResources.cpu + (Math.random() - 0.5) * 10),
          ),
          memory: Math.min(
            100,
            Math.max(30, systemResources.memory + (Math.random() - 0.5) * 5),
          ),
          network: Math.min(
            100,
            Math.max(10, systemResources.network + (Math.random() - 0.5) * 15),
          ),
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "passed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-rose-600" />;
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "border-l-4 border-l-blue-600";
      case "passed":
        return "border-l-4 border-l-emerald-600";
      case "failed":
        return "border-l-4 border-l-rose-600";
      case "skipped":
        return "border-l-4 border-l-amber-600";
      default:
        return "border-l-4 border-l-slate-400";
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Test Suites List */}
      <div className="col-span-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Test Suites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-2">
                {testSuites.map((suite) => (
                  <Card
                    key={suite.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedSuite === suite.id && "ring-2 ring-primary",
                      getStatusColor(suite.status),
                    )}
                    onClick={() => setSelectedSuite(suite.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(suite.status)}
                          <span className="font-medium">{suite.name}</span>
                        </div>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{suite.tests.length} tests</span>
                        {suite.duration && <span>{suite.duration}ms</span>}
                      </div>
                      {suite.status === "running" &&
                        suite.progress !== undefined && (
                          <Progress
                            value={suite.progress}
                            className="h-1 mt-2"
                          />
                        )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Test Details */}
      <div className="col-span-5 space-y-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Test Execution Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSuite ? (
              <ScrollArea className="h-[450px]">
                <div className="space-y-2">
                  {testSuites
                    .find((s) => s.id === selectedSuite)
                    ?.tests.map((test) => (
                      <Card
                        key={test.id}
                        className={cn("border", getStatusColor(test.status))}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              {getStatusIcon(test.status)}
                              <span className="text-sm">{test.name}</span>
                            </div>
                            {test.duration && (
                              <Badge variant="secondary" className="text-xs">
                                {test.duration}ms
                              </Badge>
                            )}
                          </div>
                          {test.error && (
                            <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400 font-mono">
                              {test.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-[450px] text-muted-foreground">
                Select a test suite to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-foreground">
                    CPU Usage
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {systemResources.cpu}%
                </span>
              </div>
              <Progress value={systemResources.cpu} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-foreground">
                    Memory
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {systemResources.memory}%
                </span>
              </div>
              <Progress value={systemResources.memory} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-foreground">
                    Network I/O
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {systemResources.network}%
                </span>
              </div>
              <Progress value={systemResources.network} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Parallel Workers</span>
              <Badge>4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Retry Failed</span>
              <Badge>2x</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Timeout</span>
              <Badge>30s</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Environment</span>
              <Badge variant="outline">Development</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestExecutionPanel;
