"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Sparkles,
  Wrench,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Eye,
  Play,
  GitCompare,
  Clock,
  Zap,
  ArrowRight,
  RefreshCw,
  FileCode,
  Bug,
  Target,
  Settings,
} from "lucide-react";
import { cn } from "../../lib/utils";

// Types for self-healing workflow
interface DOMChange {
  type: "selector" | "attribute" | "structure";
  before: string;
  after: string;
  confidence: number;
  detected: Date;
}

// Tier classification for healing complexity
type HealingTier = 1 | 2 | 3;

interface SelfHealingAttempt {
  id: string;
  testName: string;
  testFile: string;
  status: "detecting" | "analyzing" | "healing" | "testing" | "success" | "failed" | "review";
  timestamp: Date;
  domChanges: DOMChange[];
  originalSelector: string;
  suggestedSelector: string;
  healingStrategy: "selector-update" | "wait-strategy" | "structure-adaptation" | "data-fix";
  confidence: number;
  tier: HealingTier; // Added tier classification
  similarTestsAffected: number; // Added impact metric
  error?: {
    message: string;
    stack?: string;
  };
  beforeCode?: string;
  afterCode?: string;
  screenshot?: {
    before: string;
    after: string;
  };
  metadata?: {
    executionTime: number;
    retryCount: number;
    aiModel?: string;
  };
}

interface SelfHealingStats {
  total: number;
  healed: number;
  pendingReview: number;
  failed: number;
  avgHealTime: number;
  successRate: number;
  last24h: number;
}

export const SelfHealingTestViewer: React.FC = () => {
  const [selectedAttempt, setSelectedAttempt] = useState<SelfHealingAttempt | null>(null);
  const [viewMode, setViewMode] = useState<"workflow" | "history">("workflow");

  // Mock data for demonstration
  const stats: SelfHealingStats = {
    total: 1247,
    healed: 1175,
    pendingReview: 18,
    failed: 54,
    avgHealTime: 4.2, // seconds
    successRate: 94.2,
    last24h: 18,
  };

  const healingAttempts: SelfHealingAttempt[] = [
    {
      id: "1",
      testName: "Login Flow - Submit Button Click",
      testFile: "tests/auth/login.spec.ts",
      status: "success",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
      tier: 1, // Auto-heal - high confidence
      similarTestsAffected: 4, // This fix will repair 4 similar tests
      domChanges: [
        {
          type: "selector",
          before: 'button[data-testid="submit-btn"]',
          after: 'button[data-testid="login-submit"]',
          confidence: 0.95,
          detected: new Date(),
        },
      ],
      originalSelector: 'button[data-testid="submit-btn"]',
      suggestedSelector: 'button[data-testid="login-submit"]',
      healingStrategy: "selector-update",
      confidence: 0.95,
      beforeCode: `await page.click('button[data-testid="submit-btn"]');`,
      afterCode: `await page.click('button[data-testid="login-submit"]');`,
      metadata: {
        executionTime: 3.8,
        retryCount: 0,
        aiModel: "Claude Sonnet 4.5",
      },
    },
    {
      id: "2",
      testName: "Dashboard - User Profile Load",
      testFile: "tests/dashboard/profile.spec.ts",
      status: "review",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
      tier: 2, // Requires human review
      similarTestsAffected: 7, // This fix will repair 7 similar tests
      domChanges: [
        {
          type: "structure",
          before: '<div class="avatar"><img /></div>',
          after: '<div class="user-avatar"><span><img /></span></div>',
          confidence: 0.78,
          detected: new Date(),
        },
      ],
      originalSelector: '.avatar img',
      suggestedSelector: '.user-avatar span img',
      healingStrategy: "structure-adaptation",
      confidence: 0.78,
      beforeCode: `await expect(page.locator('.avatar img')).toBeVisible();`,
      afterCode: `await expect(page.locator('.user-avatar span img')).toBeVisible();`,
      metadata: {
        executionTime: 5.2,
        retryCount: 2,
        aiModel: "Claude Sonnet 4.5",
      },
    },
    {
      id: "3",
      testName: "Search - Input Field Focus",
      testFile: "tests/search/search.spec.ts",
      status: "analyzing",
      timestamp: new Date(),
      tier: 1, // Auto-heal - high confidence
      similarTestsAffected: 2, // This fix will repair 2 similar tests
      domChanges: [
        {
          type: "attribute",
          before: 'input[name="query"]',
          after: 'input[name="searchQuery"]',
          confidence: 0.92,
          detected: new Date(),
        },
      ],
      originalSelector: 'input[name="query"]',
      suggestedSelector: 'input[name="searchQuery"]',
      healingStrategy: "selector-update",
      confidence: 0.92,
    },
    {
      id: "4",
      testName: "Payment Flow - Multi-Step Wizard",
      testFile: "tests/checkout/payment.spec.ts",
      status: "review",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      tier: 3, // Complex - architect review required
      similarTestsAffected: 12, // This fix will repair 12 similar tests
      domChanges: [
        {
          type: "structure",
          before: '<form id="payment"><div class="steps">...</div></form>',
          after: '<div id="payment-wizard"><section class="step-container">...</section></div>',
          confidence: 0.58,
          detected: new Date(),
        },
      ],
      originalSelector: 'form#payment .steps .step-1',
      suggestedSelector: '#payment-wizard .step-container [data-step="1"]',
      healingStrategy: "structure-adaptation",
      confidence: 0.58,
      beforeCode: `await page.locator('form#payment .steps .step-1').fill(cardNumber);`,
      afterCode: `await page.locator('#payment-wizard .step-container [data-step="1"]').fill(cardNumber);`,
      metadata: {
        executionTime: 8.4,
        retryCount: 3,
        aiModel: "Claude Sonnet 4.5",
      },
    },
  ];

  const [attempts, setAttempts] = useState<SelfHealingAttempt[]>(healingAttempts);

  const handleApprove = (attemptId: string) => {
    setAttempts(
      attempts.map((a) => (a.id === attemptId ? { ...a, status: "success" as const } : a)),
    );
  };

  const handleReject = (attemptId: string) => {
    setAttempts(
      attempts.map((a) => (a.id === attemptId ? { ...a, status: "failed" as const } : a)),
    );
  };

  const getStatusIcon = (status: SelfHealingAttempt["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "review":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "detecting":
      case "analyzing":
      case "healing":
      case "testing":
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SelfHealingAttempt["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "review":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "detecting":
      case "analyzing":
      case "healing":
      case "testing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStrategyIcon = (strategy: SelfHealingAttempt["healingStrategy"]) => {
    switch (strategy) {
      case "selector-update":
        return <Target className="h-4 w-4" />;
      case "wait-strategy":
        return <Clock className="h-4 w-4" />;
      case "structure-adaptation":
        return <GitCompare className="h-4 w-4" />;
      case "data-fix":
        return <FileCode className="h-4 w-4" />;
    }
  };

  // Tier badge configuration
  const getTierBadge = (tier: HealingTier) => {
    switch (tier) {
      case 1:
        return {
          label: "Tier 1: Auto",
          color: "bg-green-500/10 text-green-500 border-green-500/20",
          description: "Automatic healing - high confidence",
        };
      case 2:
        return {
          label: "Tier 2: Review",
          color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          description: "Requires human review",
        };
      case 3:
        return {
          label: "Tier 3: Architect",
          color: "bg-red-500/10 text-red-500 border-red-500/20",
          description: "Complex change - architect review required",
        };
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Self-Healing Test Monitor</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered test maintenance and automatic failure recovery
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Configure
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Automated tests monitored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Healed</CardTitle>
            <Wrench className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.healed}</div>
            <p className="text-xs text-muted-foreground">Automatically fixed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Healing accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Heal Time</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHealTime}s</div>
            <p className="text-xs text-muted-foreground">Mean time to fix</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.last24h}</div>
            <p className="text-xs text-muted-foreground">Recent healings</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="workflow">Live Healing Workflow</TabsTrigger>
          <TabsTrigger value="history">Healing History</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Healing Queue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Active Healing Queue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {attempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className={cn(
                          "rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md",
                          selectedAttempt?.id === attempt.id && "ring-2 ring-purple-500",
                        )}
                        onClick={() => setSelectedAttempt(attempt)}
                      >
                        {/* Test Info */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(attempt.status)}
                            <div>
                              <p className="font-medium text-sm">{attempt.testName}</p>
                              <p className="text-xs text-muted-foreground">{attempt.testFile}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Tier Badge */}
                            <Badge
                              variant="outline"
                              className={cn("text-xs", getTierBadge(attempt.tier).color)}
                              title={getTierBadge(attempt.tier).description}
                            >
                              {getTierBadge(attempt.tier).label}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(attempt.status)}>
                              {attempt.status}
                            </Badge>
                          </div>
                        </div>

                        {/* Impact Callout */}
                        {attempt.similarTestsAffected > 0 && (
                          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                            <Sparkles className="h-3 w-3 text-purple-400" />
                            <span className="text-xs text-purple-300">
                              This fix will repair{" "}
                              <span className="font-semibold">{attempt.similarTestsAffected}</span>{" "}
                              similar test{attempt.similarTestsAffected !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}

                        {/* Healing Strategy */}
                        <div className="flex items-center gap-2 mt-2">
                          {getStrategyIcon(attempt.healingStrategy)}
                          <span className="text-xs text-muted-foreground">
                            {attempt.healingStrategy.replace("-", " ")}
                          </span>
                          <span className="ml-auto text-xs font-mono">
                            {(attempt.confidence * 100).toFixed(0)}% confidence
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {attempt.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Healing Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Healing Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAttempt ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {/* Tier Classification & Impact */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="outline"
                            className={cn("text-sm px-3 py-1", getTierBadge(selectedAttempt.tier).color)}
                          >
                            {getTierBadge(selectedAttempt.tier).label}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(selectedAttempt.status)}>
                            {selectedAttempt.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {getTierBadge(selectedAttempt.tier).description}
                        </p>
                        {selectedAttempt.similarTestsAffected > 0 && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-purple-300">
                              Applying this fix will automatically repair{" "}
                              <span className="font-bold">{selectedAttempt.similarTestsAffected}</span>{" "}
                              similar test{selectedAttempt.similarTestsAffected !== 1 ? "s" : ""} across the codebase
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Visual Workflow */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold">Healing Workflow</h3>
                        <div className="relative">
                          {/* Step 1: Detection */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                              <Bug className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Test Failure Detected</p>
                              <p className="text-xs text-muted-foreground">
                                Selector not found: {selectedAttempt.originalSelector}
                              </p>
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 2: Analysis */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                              <Sparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">AI Analysis</p>
                              <p className="text-xs text-muted-foreground">
                                {selectedAttempt.domChanges.length} DOM change(s) detected
                              </p>
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 3: Healing */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20">
                              <Wrench className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Auto-Healing Applied</p>
                              <p className="text-xs text-muted-foreground">
                                Strategy: {selectedAttempt.healingStrategy.replace("-", " ")}
                              </p>
                            </div>
                          </div>

                          <div className="ml-5 border-l-2 border-dashed border-gray-700 h-8" />

                          {/* Step 4: Result */}
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full border",
                                selectedAttempt.status === "success" &&
                                  "bg-green-500/10 border-green-500/20",
                                selectedAttempt.status === "review" &&
                                  "bg-yellow-500/10 border-yellow-500/20",
                              )}
                            >
                              {selectedAttempt.status === "success" ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {selectedAttempt.status === "success"
                                  ? "Healing Successful"
                                  : "Awaiting Review"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Confidence: {(selectedAttempt.confidence * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Diff */}
                      {selectedAttempt.beforeCode && selectedAttempt.afterCode && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <GitCompare className="h-4 w-4" />
                            Code Changes
                          </h3>
                          <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
                            {/* Before */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <XCircle className="h-3 w-3 text-red-500" />
                                <span className="text-xs font-mono text-red-500">Before</span>
                              </div>
                              <pre className="text-xs bg-red-500/5 p-2 rounded border border-red-500/20 overflow-x-auto">
                                <code className="text-red-400">{selectedAttempt.beforeCode}</code>
                              </pre>
                            </div>

                            {/* Arrow */}
                            <div className="flex justify-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* After */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-xs font-mono text-green-500">After</span>
                              </div>
                              <pre className="text-xs bg-green-500/5 p-2 rounded border border-green-500/20 overflow-x-auto">
                                <code className="text-green-400">{selectedAttempt.afterCode}</code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DOM Changes Detail */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold">DOM Changes Detected</h3>
                        <div className="space-y-2">
                          {selectedAttempt.domChanges.map((change, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border bg-muted/50 p-3 text-xs space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {change.type}
                                </Badge>
                                <span className="font-mono text-muted-foreground">
                                  {(change.confidence * 100).toFixed(0)}% match
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-red-400">- {change.before}</p>
                                <p className="text-green-400">+ {change.after}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metadata */}
                      {selectedAttempt.metadata && (
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold">Execution Metadata</h3>
                          <div className="rounded-lg border bg-muted/50 p-3 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Execution Time</span>
                              <span className="font-mono">
                                {selectedAttempt.metadata.executionTime}s
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Retry Count</span>
                              <span className="font-mono">{selectedAttempt.metadata.retryCount}</span>
                            </div>
                            {selectedAttempt.metadata.aiModel && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">AI Model</span>
                                <span className="font-mono">{selectedAttempt.metadata.aiModel}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {selectedAttempt.status === "review" && (
                        <div className="flex gap-2 pt-4">
                          <Button
                            className="flex-1"
                            variant="default"
                            onClick={() => handleApprove(selectedAttempt.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve Healing
                          </Button>
                          <Button
                            className="flex-1"
                            variant="destructive"
                            onClick={() => handleReject(selectedAttempt.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {selectedAttempt.status === "success" && (
                        <div className="flex gap-2 pt-4">
                          <Button className="flex-1" variant="outline">
                            <Play className="mr-2 h-4 w-4" />
                            Re-run Test
                          </Button>
                          <Button className="flex-1" variant="outline">
                            <Code className="mr-2 h-4 w-4" />
                            View Full Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[600px] items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Sparkles className="h-12 w-12 mx-auto opacity-50" />
                      <p className="text-sm">Select a healing attempt to view details</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Healing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Historical healing data will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
