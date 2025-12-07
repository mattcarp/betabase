/**
 * RLHF Test Suite Component
 *
 * Auto-generated tests from human feedback and curator corrections
 * Part of Test tab integration - Phase 6
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import {
  Lightbulb,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  FileText,
  TrendingUp,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface RLHFGeneratedTest {
  id: string;
  feedback_id: string;
  test_description: string;
  test_code: string;
  original_query: string;
  curator_correction: string;
  generated_at: string;
  run_count: number;
  pass_count: number;
  fail_count: number;
  last_run_at?: string;
  status: "pending" | "passing" | "failing" | "flaky";
}

export function RLHFTestSuite() {
  const [tests, setTests] = useState<RLHFGeneratedTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    passing: 0,
    failing: 0,
    pending: 0,
    generationRate: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadRLHFTests();
  }, []);

  const loadRLHFTests = async () => {
    setLoading(true);

    try {
      // Note: This table will be created as tests are generated from feedback
      // For now, showing placeholder structure

      const { data: tableCheck, error: tableError } = await supabase
        .from("rlhf_generated_tests")
        .select("count")
        .limit(1);

      if (tableError && tableError.code === "42P01") {
        // Table doesn't exist yet - show placeholder
        console.warn("RLHF test table not created yet");
        setTests([]);
        setStats({
          total: 0,
          passing: 0,
          failing: 0,
          pending: 0,
          generationRate: 0,
        });
        toast.info("No RLHF-generated tests yet - start by curating feedback!");
        setLoading(false);
        return;
      }

      // Load tests
      const { data, error } = await supabase
        .from("rlhf_generated_tests")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to load RLHF tests:", error);
        toast.error("Failed to load RLHF tests");
        return;
      }

      setTests(data || []);

      // Calculate stats
      const total = (data || []).length;
      const passing = (data || []).filter((t) => t.status === "passing").length;
      const failing = (data || []).filter((t) => t.status === "failing").length;
      const pending = (data || []).filter((t) => t.status === "pending").length;

      // Calculate generation rate (tests per week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentTests = (data || []).filter((t) => new Date(t.generated_at) > oneWeekAgo).length;

      setStats({
        total,
        passing,
        failing,
        pending,
        generationRate: recentTests,
      });
    } catch (error) {
      console.error("Error loading RLHF tests:", error);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (test: RLHFGeneratedTest) => {
    toast.info("Running RLHF test...");
    // TODO: Implement test execution
    console.log("Run test:", test);
  };

  const viewTestCode = async (test: RLHFGeneratedTest) => {
    // TODO: Implement code viewer
    console.log("View test code:", test);
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Lightbulb className="h-5 w-5 text-purple-400" />
          RLHF-Generated Test Suite
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Auto-generated from curator corrections and high-confidence feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="bg-zinc-900/30 border-zinc-800">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-zinc-100">{stats.total}</div>
              <div className="text-xs text-zinc-500">Total Tests</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-400">{stats.passing}</div>
              <div className="text-xs text-zinc-500">Passing</div>
            </CardContent>
          </Card>
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-400">{stats.failing}</div>
              <div className="text-xs text-zinc-500">Failing</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
              <div className="text-xs text-zinc-500">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-400">{stats.generationRate}</div>
              <div className="text-xs text-zinc-500">Generated/Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadRLHFTests} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
            <TrendingUp className="h-4 w-4" />
            Generate New Tests
          </Button>
        </div>

        {/* Test list */}
        <ScrollArea className="flex-1">
          {tests.length > 0 ? (
            <div className="space-y-3">
              {tests.map((test) => (
                <Card key={test.id} className="bg-zinc-900/30 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={cn(
                              "text-xs",
                              test.status === "passing" && "bg-green-500/20 text-green-300",
                              test.status === "failing" && "bg-red-500/20 text-red-300",
                              test.status === "pending" && "bg-amber-500/20 text-amber-300",
                              test.status === "flaky" && "bg-yellow-500/20 text-yellow-300"
                            )}
                          >
                            {test.status === "passing" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {test.status === "failing" && <XCircle className="h-3 w-3 mr-1" />}
                            {test.status}
                          </Badge>
                          {test.run_count > 0 && (
                            <span className="text-xs text-zinc-500">
                              Runs: {test.run_count} ({test.pass_count}✓ / {test.fail_count}✗)
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-sm text-zinc-200">
                          {test.test_description}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-xs text-zinc-500">Original Query:</span>
                      <p className="text-xs text-zinc-300 mt-1 font-mono bg-zinc-950/50 p-2 rounded line-clamp-2">
                        {test.original_query}
                      </p>
                    </div>
                    {test.curator_correction && (
                      <div>
                        <span className="text-xs text-zinc-500">Curator Correction:</span>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {test.curator_correction}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runTest(test)}
                        className="gap-1 text-xs h-7"
                      >
                        <Play className="h-3 w-3" />
                        Run Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewTestCode(test)}
                        className="gap-1 text-xs h-7"
                      >
                        <FileText className="h-3 w-3" />
                        View Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 py-12">
              {loading ? (
                <>
                  <RefreshCw className="h-12 w-12 animate-spin mb-4 text-zinc-700" />
                  <p>Loading RLHF tests...</p>
                </>
              ) : (
                <>
                  <Lightbulb className="h-16 w-16 mb-4 text-zinc-700" />
                  <p className="text-lg mb-2">No RLHF-generated tests yet</p>
                  <p className="text-sm text-zinc-600 max-w-md">
                    Tests will be automatically generated from curator feedback and corrections.
                    Start curating in the RLHF Feedback tab!
                  </p>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
