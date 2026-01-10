"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Button } from "../button";
import { Badge } from "../badge";
import { ScrollArea } from "../scroll-area";
import {
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wand2,
  RefreshCw,
  ChevronRight,
  Clock,
  Zap,
  GitBranch,
  // Eye, // Reserved for future use
  Check,
  X,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

// Types
interface TestResult {
  id: string;
  test_name: string;
  test_file: string;
  status: "passed" | "failed" | "skipped" | "pending";
  duration?: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface SelfHealingAttempt {
  id: string;
  test_id: string;
  test_name: string;
  test_file: string;
  change_type: string;
  old_selector: string;
  new_selector: string;
  healing_tier: number;
  confidence: number;
  healing_rationale: string;
  status: "pending" | "approved" | "rejected" | "applied";
  detected_at: string;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function TestsTab() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [healingAttempts, setHealingAttempts] = useState<SelfHealingAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [selectedHealing, setSelectedHealing] = useState<SelfHealingAttempt | null>(null);

  // Load test results from Supabase
  const loadTestResults = useCallback(async () => {
    if (!supabase) {
      setLoadError("Database connection not configured");
      return;
    }
    
    setLoading(true);
    setLoadError(null);
    try {
      const { data: results, error: resultsError } = await supabase
        .from("test_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (resultsError) throw resultsError;
      setTestResults(results || []);

      const { data: healing, error: healingError } = await supabase
        .from("self_healing_attempts")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(20);
      
      if (healingError) throw healingError;
      setHealingAttempts(healing || []);
    } catch (error) {
      // Set user-friendly error state instead of aggressive toast
      console.warn("⚠️ TEST RESULTS: Tables not available:", error);
      setLoadError("Test results unavailable - tables may not be configured yet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTestResults();
  }, [loadTestResults]);

  // Run blast radius demo tests
  const runBlastRadiusTests = async () => {
    setRunningTests(true);
    toast.info("Running blast radius demo tests...");
    
    try {
      const response = await fetch("/api/tests/run-blast-radius", {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to run tests");
      
      const result = await response.json();
      toast.success(`Tests completed: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped`);
      
      // Reload results
      await loadTestResults();
    } catch (error) {
      console.error("Failed to run tests:", error);
      toast.error("Failed to run tests");
    } finally {
      setRunningTests(false);
    }
  };

  // Approve self-healing suggestion
  const approveHealing = async (healing: SelfHealingAttempt) => {
    if (!supabase) return;
    
    try {
      // Update status to approved
      const { error } = await supabase
        .from("self_healing_attempts")
        .update({ status: "approved", resolved_at: new Date().toISOString() })
        .eq("id", healing.id);
      
      if (error) throw error;
      
      toast.success("Self-healing fix approved! Test selector will be updated.");
      
      // In a real implementation, this would trigger a PR or direct file update
      // For demo, we'll just show the approval
      await loadTestResults();
    } catch (error) {
      console.error("Failed to approve healing:", error);
      toast.error("Failed to approve healing suggestion");
    }
  };

  // Reject self-healing suggestion
  const rejectHealing = async (healing: SelfHealingAttempt) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from("self_healing_attempts")
        .update({ status: "rejected", resolved_at: new Date().toISOString() })
        .eq("id", healing.id);
      
      if (error) throw error;
      
      toast.info("Self-healing suggestion rejected");
      await loadTestResults();
    } catch (error) {
      console.error("Failed to reject healing:", error);
      toast.error("Failed to reject healing suggestion");
    }
  };

  // Stats
  const stats = {
    total: testResults.length,
    passed: testResults.filter(t => t.status === "passed").length,
    failed: testResults.filter(t => t.status === "failed").length,
    skipped: testResults.filter(t => t.status === "skipped").length,
    pendingHealing: healingAttempts.filter(h => h.status === "pending").length,
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <div className="h-full flex flex-col gap-4" data-test-id="tests-tab">
      {/* Header with Run Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="mac-heading">
            Test Results
          </h2>
          <Badge 
            variant="outline" 
            className={cn(
              "font-light",
              passRate >= 80 ? "text-green-400 border-green-400/30" :
              passRate >= 50 ? "text-yellow-400 border-yellow-400/30" :
              "text-red-400 border-red-400/30"
            )}
          >
            {passRate}% pass rate
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTestResults}
            disabled={loading}
            className="mac-button-outline"
            data-test-id="refresh-tests-button"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={runBlastRadiusTests}
            disabled={runningTests}
            className="mac-button mac-button-primary"
            data-test-id="run-tests-button"
          >
            <Play className={cn("h-4 w-4 mr-2", runningTests && "animate-pulse")} />
            Run Blast Radius Demo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} icon={<GitBranch className="h-4 w-4" />} />
        <StatCard label="Passed" value={stats.passed} icon={<CheckCircle className="h-4 w-4" />} color="green" />
        <StatCard label="Failed" value={stats.failed} icon={<XCircle className="h-4 w-4" />} color="red" />
        <StatCard label="Skipped" value={stats.skipped} icon={<Clock className="h-4 w-4" />} color="yellow" />
        <StatCard label="Pending Fixes" value={stats.pendingHealing} icon={<Wand2 className="h-4 w-4" />} color="purple" />
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        {/* Test Results List */}
        <Card className="mac-card overflow-hidden">
          <CardHeader className="mac-card py-3 px-4 border-b border-[var(--mac-utility-border)]">
            <CardTitle className="text-sm font-light flex items-center gap-2">
              <Zap className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
              Recent Test Runs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadError ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/30 mb-4">
                    <AlertTriangle className="h-6 w-6 text-amber-400/70" />
                  </div>
                  <p className="text-sm font-light text-[var(--mac-text-secondary)] mb-2">
                    {loadError}
                  </p>
                  <p className="text-xs text-[var(--mac-text-muted)]">
                    This feature requires database tables to be set up
                  </p>
                </div>
              ) : testResults.length === 0 ? (
                <div className="p-8 text-center text-[var(--mac-text-muted)] font-light">
                  No test results yet. Run the blast radius demo to see results.
                </div>
              ) : (
                <div className="divide-y divide-[var(--mac-utility-border)]">
                  {testResults.map((test) => (
                    <TestResultRow key={test.id} test={test} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Self-Healing Suggestions */}
        <Card className="mac-card overflow-hidden">
          <CardHeader className="mac-card py-3 px-4 border-b border-[var(--mac-utility-border)]">
            <CardTitle className="text-sm font-light flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-[var(--mac-accent-primary-400)]" />
              Self-Healing Suggestions
              {stats.pendingHealing > 0 && (
                <Badge className="bg-primary-400/20 text-primary-400 border-primary-400/30">
                  {stats.pendingHealing} pending
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {loadError ? (
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/30 mb-4">
                    <Wand2 className="h-6 w-6 text-primary-400/50" />
                  </div>
                  <p className="text-xs text-[var(--mac-text-muted)]">
                    Self-healing requires test tables to be configured
                  </p>
                </div>
              ) : healingAttempts.length === 0 ? (
                <div className="p-8 text-center text-[var(--mac-text-muted)] font-light">
                  No self-healing suggestions yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--mac-utility-border)]">
                  {healingAttempts.map((healing) => (
                    <HealingSuggestionRow 
                      key={healing.id} 
                      healing={healing}
                      onApprove={() => approveHealing(healing)}
                      onReject={() => rejectHealing(healing)}
                      onSelect={() => setSelectedHealing(healing)}
                      isSelected={selectedHealing?.id === healing.id}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Selected Healing Detail */}
      {selectedHealing && (
        <Card className="mac-card border-primary-400/30">
          <CardHeader className="mac-card py-3 px-4 border-b border-[var(--mac-utility-border)]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Healing Analysis: {selectedHealing.test_name}
              </CardTitle>
              <Button variant="ghost" className="mac-button mac-button-outline"
                size="sm"
                onClick={() => setSelectedHealing(null)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="mac-body text-[var(--mac-text-muted)] font-light mb-1">Old Selector</p>
                <code className="block p-2 bg-red-500/10 border border-red-400/30 rounded text-red-400 font-mono text-xs">
                  {selectedHealing.old_selector}
                </code>
              </div>
              <div>
                <p className="mac-body text-[var(--mac-text-muted)] font-light mb-1">Suggested New Selector</p>
                <code className="block p-2 bg-green-500/10 border border-green-400/30 rounded text-green-400 font-mono text-xs">
                  {selectedHealing.new_selector}
                </code>
              </div>
            </div>
            
            <div>
              <p className="mac-body text-[var(--mac-text-muted)] font-light mb-1">AI Analysis</p>
              <p className="text-[var(--mac-text-primary)] font-light text-sm bg-[var(--mac-surface-card)] p-3 rounded border border-[var(--mac-utility-border)]">
                {selectedHealing.healing_rationale}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge className={cn(
                  "font-light",
                  selectedHealing.confidence >= 0.8 ? "bg-green-500/20 text-green-400" :
                  selectedHealing.confidence >= 0.5 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                )}>
                  {Math.round(selectedHealing.confidence * 100)}% confidence
                </Badge>
                <Badge variant="outline" className="font-light">
                  Tier {selectedHealing.healing_tier}
                </Badge>
              </div>
              
              {selectedHealing.status === "pending" && (
                <div className="flex items-center gap-2">
                  <Button size="sm"
                    variant="outline" className="mac-button mac-button-outline"
                    onClick={() => rejectHealing(selectedHealing)}
                    className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button size="sm"
                    onClick={() => approveHealing(selectedHealing)}
                    className="bg-green-500/20 text-green-400 border border-green-400/30 hover:bg-green-400/30"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve & Update Test
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color = "blue" 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color?: "blue" | "green" | "red" | "yellow" | "purple";
}) {
  const colorMap = {
    blue: "text-[var(--mac-primary-blue-400)]",
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    purple: "text-primary-400",
  };

  return (
    <Card className="mac-card p-3">
      <div className="flex items-center gap-2">
        <span className={colorMap[color]}>{icon}</span>
        <span className="text-xs text-[var(--mac-text-muted)] font-light">{label}</span>
      </div>
      <p className={cn("text-2xl font-light mt-1", colorMap[color])}>
        {value}
      </p>
    </Card>
  );
}

// Test Result Row Component
function TestResultRow({ test }: { test: TestResult }) {
  const statusConfig = {
    passed: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    skipped: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    pending: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50" },
  };

  const config = statusConfig[test.status];
  const Icon = config.icon;

  return (
    <div className="p-3 hover:bg-[var(--mac-state-hover)] transition-colors" data-test-id="test-result-row">
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light text-[var(--mac-text-primary)] truncate">
            {test.test_name}
          </p>
          <p className="text-xs text-[var(--mac-text-muted)] font-light truncate">
            {test.test_file}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-xs font-light", config.color)}>
          {test.status}
        </Badge>
      </div>
      {test.error_message && (
        <p className="mt-2 text-xs text-red-400 font-light pl-10 truncate">
          {test.error_message}
        </p>
      )}
    </div>
  );
}

// Healing Suggestion Row Component
function HealingSuggestionRow({ 
  healing, 
  onApprove, 
  onReject, 
  onSelect,
  isSelected 
}: { 
  healing: SelfHealingAttempt;
  onApprove: () => void;
  onReject: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const statusConfig = {
    pending: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
    approved: { color: "text-green-400", bg: "bg-green-500/20" },
    rejected: { color: "text-red-400", bg: "bg-red-500/20" },
    applied: { color: "text-blue-400", bg: "bg-blue-500/20" },
  };

  const config = statusConfig[healing.status];

  return (
    <div 
      className={cn(
        "p-3 hover:bg-[var(--mac-state-hover)] transition-colors cursor-pointer",
        isSelected && "bg-primary-400/10 border-l-2 border-primary-400"
      )}
      onClick={onSelect}
      data-test-id="healing-suggestion-row"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded bg-primary-400/10">
          <Wand2 className="h-4 w-4 text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light text-[var(--mac-text-primary)] truncate">
            {healing.test_name}
          </p>
          <p className="text-xs text-[var(--mac-text-muted)] font-light">
            {healing.change_type} change • {Math.round(healing.confidence * 100)}% confidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs font-light", config.bg, config.color)}>
            {healing.status}
          </Badge>
          {healing.status === "pending" && (
            <>
              <Button variant="ghost" className="mac-button mac-button-outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onReject(); }}
                className="h-7 w-7 p-0 text-red-400 hover:bg-red-400/10"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="mac-button mac-button-outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onApprove(); }}
                className="h-7 w-7 p-0 text-green-400 hover:bg-green-400/10"
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          )}
          <ChevronRight className="h-4 w-4 text-[var(--mac-text-muted)]" />
        </div>
      </div>
    </div>
  );
}

export default TestsTab;
