"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  GitBranch,
  FileCode,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Download,
  Filter,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CoverageData {
  statements: { covered: number; total: number; percentage: number };
  branches: { covered: number; total: number; percentage: number };
  functions: { covered: number; total: number; percentage: number };
  lines: { covered: number; total: number; percentage: number };
}

interface FileCoverage {
  path: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

export const CoverageReport: React.FC = () => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileCoverage | null>(null);
  const [coverageFilter, setCoverageFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const coverageData: CoverageData = {
    statements: { covered: 3421, total: 4100, percentage: 83.4 },
    branches: { covered: 1823, total: 2340, percentage: 77.9 },
    functions: { covered: 892, total: 1050, percentage: 85.0 },
    lines: { covered: 3156, total: 3800, percentage: 83.1 },
  };

  const trendData = [
    { date: "Mon", coverage: 78 },
    { date: "Tue", coverage: 80 },
    { date: "Wed", coverage: 79 },
    { date: "Thu", coverage: 82 },
    { date: "Fri", coverage: 83 },
    { date: "Sat", coverage: 83 },
    { date: "Sun", coverage: 83.4 },
  ];

  const pieData = [
    { name: "Covered", value: 83.4, color: "var(--mac-success-green)" },
    { name: "Uncovered", value: 16.6, color: "var(--mac-error-red)" },
  ];

  const fileCoverage: FileCoverage[] = [
    {
      path: "src/components/auth/MagicLinkLoginForm.tsx",
      statements: 92,
      branches: 88,
      functions: 95,
      lines: 91,
      uncoveredLines: [45, 67, 89, 102],
    },
    {
      path: "src/components/test-dashboard/TestDashboard.tsx",
      statements: 78,
      branches: 72,
      functions: 85,
      lines: 76,
      uncoveredLines: [120, 145, 178, 203, 234],
    },
    {
      path: "src/services/api/chat.ts",
      statements: 65,
      branches: 58,
      functions: 70,
      lines: 63,
      uncoveredLines: [34, 56, 78, 91, 112, 134, 156],
    },
    {
      path: "src/utils/validation.ts",
      statements: 95,
      branches: 92,
      functions: 98,
      lines: 94,
      uncoveredLines: [23, 45],
    },
    {
      path: "src/hooks/useAuth.ts",
      statements: 88,
      branches: 85,
      functions: 90,
      lines: 87,
      uncoveredLines: [67, 89, 101],
    },
  ];

  const fileTree = {
    src: {
      components: {
        auth: ["MagicLinkLoginForm.tsx", "AuthProvider.tsx"],
        "test-dashboard": ["TestDashboard.tsx", "TestExecutionPanel.tsx"],
        ui: ["Button.tsx", "Card.tsx", "Dialog.tsx"],
      },
      services: {
        api: ["chat.ts", "auth.ts", "upload.ts"],
      },
      utils: ["validation.ts", "format.ts", "constants.ts"],
      hooks: ["useAuth.ts", "useSettings.ts", "useWebSocket.ts"],
    },
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getCoverageBadge = (percentage: number) => {
    if (percentage >= 80) return { variant: "default" as const, className: "bg-green-500" };
    if (percentage >= 60) return { variant: "default" as const, className: "bg-yellow-500" };
    return { variant: "destructive" as const, className: "" };
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Overall Coverage Summary */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(coverageData).map(([key, data]) => (
          <Card className="mac-card" key={key}>
            <CardHeader className="mac-card pb-4">
              <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                {key === "branches" && <GitBranch className="h-4 w-4" />}
                {key === "functions" && <FileCode className="h-4 w-4" />}
                {key === "statements" && <CheckCircle className="h-4 w-4" />}
                {key === "lines" && <FileCode className="h-4 w-4" />}
                {key}
              </CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className={cn("text-2xl font-bold", getCoverageColor(data.percentage))}>
                    {data.percentage}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {data.covered}/{data.total}
                  </span>
                </div>
                <Progress value={data.percentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Coverage Trend */}
        <div className="col-span-6">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <div className="flex items-center justify-between">
                <CardTitle className="mac-card">Coverage Trend</CardTitle>
                <Badge className="bg-green-500/20 text-green-500">
                  <TrendingUp className="h-3 w-3 mr-2" />
                  +3.4%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" domain={[70, 90]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="coverage"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Distribution */}
        <div className="col-span-3">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Coverage Distribution</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">
                      {entry.name}: {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Uncovered Code Summary */}
        <div className="col-span-3">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Uncovered Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Uncovered Lines</span>
                  <Badge variant="destructive">644</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Files with Low Coverage</span>
                  <Badge className="bg-yellow-500/20 text-yellow-500">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critical Paths Uncovered</span>
                  <Badge className="bg-red-500/20 text-red-500">3</Badge>
                </div>
              </div>

              <Button
          aria-label="Download"
                className="w-full mac-button mac-button-outline"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Coverage Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Coverage Details */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <div className="flex items-center justify-between">
                <CardTitle className="mac-card">File Coverage</CardTitle>
                <div className="flex gap-2">
                  <Button
                    className="mac-button mac-button-primary"
                    variant={coverageFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoverageFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    className="mac-button mac-button-primary"
                    variant={coverageFilter === "low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoverageFilter("low")}
                  >
                    Low
                  </Button>
                  <Button
                    className="mac-button mac-button-primary"
                    variant={coverageFilter === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoverageFilter("medium")}
                  >
                    Medium
                  </Button>
                  <Button
                    className="mac-button mac-button-primary"
                    variant={coverageFilter === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCoverageFilter("high")}
                  >
                    High
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                <div className="p-4 space-y-2">
                  {fileCoverage
                    .filter((file) => {
                      if (coverageFilter === "all") return true;
                      const avg =
                        (file.statements + file.branches + file.functions + file.lines) / 4;
                      if (coverageFilter === "low") return avg < 60;
                      if (coverageFilter === "medium") return avg >= 60 && avg < 80;
                      if (coverageFilter === "high") return avg >= 80;
                      return true;
                    })
                    .map((file) => {
                      const avgCoverage =
                        (file.statements + file.branches + file.functions + file.lines) / 4;
                      return (
                        <Card
                          key={file.path}
                          className={cn(
                            "mac-card",
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedFile?.path === file.path && "ring-2 ring-primary"
                          )}
                          onClick={() => setSelectedFile(file)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium truncate">
                                  {file.path.split("/").pop()}
                                </span>
                              </div>
                              <Badge {...getCoverageBadge(avgCoverage)}>
                                {avgCoverage.toFixed(1)}%
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {file.path.substring(0, file.path.lastIndexOf("/"))}
                            </div>
                            <Progress value={avgCoverage} className="h-1 mt-2" />
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-7">
          {selectedFile ? (
            <Card className="mac-card">
              <CardHeader className="mac-card">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedFile.path.split("/").pop()}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{selectedFile.path}</p>
                  </div>
                  <Button
                    className="mac-button mac-button-outline"
                    variant="outline"
                    size="sm"
                  >
                    <FileCode className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coverage Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="mac-card">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Statements</span>
                          <Badge {...getCoverageBadge(selectedFile.statements)}>
                            {selectedFile.statements}%
                          </Badge>
                        </div>
                        <Progress value={selectedFile.statements} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mac-card">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Branches</span>
                          <Badge {...getCoverageBadge(selectedFile.branches)}>
                            {selectedFile.branches}%
                          </Badge>
                        </div>
                        <Progress value={selectedFile.branches} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mac-card">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Functions</span>
                          <Badge {...getCoverageBadge(selectedFile.functions)}>
                            {selectedFile.functions}%
                          </Badge>
                        </div>
                        <Progress value={selectedFile.functions} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mac-card">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Lines</span>
                          <Badge {...getCoverageBadge(selectedFile.lines)}>
                            {selectedFile.lines}%
                          </Badge>
                        </div>
                        <Progress value={selectedFile.lines} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Uncovered Lines */}
                <Card className="mac-card bg-red-500/10 border-red-500/20">
                  <CardHeader className="mac-card">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Uncovered Lines
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mac-card">
                    <div className="flex flex-wrap gap-2">
                      {selectedFile.uncoveredLines.map((line) => (
                        <Badge key={line} variant="destructive">
                          Line {line}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ) : (
            <Card className="mac-card h-full">
              <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to view detailed coverage
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoverageReport;
