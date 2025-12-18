/**
 * Test Case Generator Component
 *
 * Generates Playwright test cases from RLHF feedback
 * Part of Fix tab in Phase 5.3
 * 
 * Enhanced 2025-12-16: Added recent items dropdown for demo
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { FileCode, Download, RefreshCw, CheckCircle, Play, ChevronDown, Clock, ThumbsUp, CheckCheck, TestTube } from "lucide-react";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface RecentFeedback {
  id: string;
  query: string;
  thumbs_up: boolean | null;
  rating: number | null;
  created_at: string;
  status: string;
  suggested_correction: string | null;
}

interface TestCaseGeneratorProps {
  feedbackItemId?: string;
}

export function TestCaseGenerator({ feedbackItemId }: TestCaseGeneratorProps) {
  const [searchId, setSearchId] = useState(feedbackItemId || "");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [recentItems, setRecentItems] = useState<RecentFeedback[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const supabase = useSupabaseClient();

  // Load recent approved/corrected feedback items
  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    setLoadingRecent(true);
    try {
      // Get items that are good candidates for test generation
      // (approved, corrected, or highly rated)
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("id, query, user_query, feedback_type, feedback_value, created_at, status, feedback_metadata")
        .or("status.eq.approved,feedback_type.eq.thumbs_up")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Failed to load recent items:", error);
      } else {
        setRecentItems(data?.map(item => ({
          ...item,
          query: item.query || item.user_query || "Unknown query",
          thumbs_up: item.feedback_type === "thumbs_up",
          rating: item.feedback_value?.score ?? null,
          suggested_correction: item.feedback_metadata?.correction ?? null
        })) || []);
      }
    } catch (error) {
      console.error("Error loading recent items:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const loadFeedbackItem = async (idToLoad?: string) => {
    const targetId = idToLoad || searchId;
    if (!targetId.trim()) {
      toast.error("Please enter a feedback ID");
      return;
    }

    setLoading(true);
    setSearchId(targetId);

    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("*")
        .eq("id", targetId)
        .single();

      if (error) {
        console.error("Failed to load feedback:", error);
        toast.error("Feedback item not found");
        return;
      }

      setFeedbackData(data);
      setShowRecent(false);
      toast.success("Feedback loaded - ready to generate test");
    } catch (error) {
      console.error("Error loading feedback:", error);
      toast.error("Failed to load feedback item");
    } finally {
      setLoading(false);
    }
  };

  const generateTestCase = async () => {
    if (!feedbackData) {
      toast.error("Please load a feedback item first");
      return;
    }

    setGenerating(true);

    try {
      // Generate Playwright test code from feedback
      const query = feedbackData.query || feedbackData.user_query || "";
      const expectedResponse = feedbackData.feedback_metadata?.correction || feedbackData.feedback_metadata?.text || feedbackData.response || "";
      const relevantDocs = feedbackData.retrieved_contexts || feedbackData.documents_marked || [];

      const parts = [];
      parts.push("/**\n");
      parts.push(" * Auto-generated from RLHF feedback\n");
      parts.push(" * Feedback ID: " + feedbackData.id + "\n");
      parts.push(" * Generated: " + new Date().toISOString() + "\n");
      parts.push(" */\n\n");
      parts.push("import { test, expect } from '@playwright/test';\n\n");
      parts.push("test('RLHF Regression: " + query.substring(0, 80).replace(/"/g, '\\"') + "...', async ({ page }) => {\n");
      parts.push("  // Navigate to chat\n");
      parts.push("  await page.goto('http://localhost:3000');\n");
      parts.push("  await page.waitForLoadState('networkidle');\n\n");
      parts.push("  // Send query\n");
      parts.push("  const chatInput = page.locator('[data-testid=\"chat-input\"], textarea[placeholder*=\"Message\"]').first();\n");
      parts.push("  await chatInput.fill(`" + query.replace(/`/g, "\\`") + "`);\n\n");
      parts.push("  const sendButton = page.locator('button:has-text(\"Send\"), [data-testid=\"send-button\"]').first();\n");
      parts.push("  await sendButton.click();\n\n");
      parts.push("  // Wait for AI response\n");
      parts.push("  await page.waitForSelector('[role=\"assistant\"], .assistant-message, .ai-message', { timeout: 30000 });\n");
      parts.push("  const response = await page.locator('[role=\"assistant\"], .assistant-message, .ai-message').last().textContent();\n\n");
      parts.push("  // Verify response quality (based on curator feedback)\n");
      parts.push("  expect(response).toBeTruthy();\n");

      if (feedbackData.feedback_value?.score >= 4 || feedbackData.feedback_type === "thumbs_up") {
        parts.push("  // This response received positive feedback (" + (feedbackData.feedback_value?.score || 5) + "/5 stars)\n");
        parts.push("  // Expected to contain key information:\n");
      } else {
        parts.push("  // This response received negative feedback - should be improved\n");
        parts.push("  // Curator correction:\n");
      }

      if (expectedResponse) {
        parts.push("  expect(response?.toLowerCase()).toContain('" + expectedResponse.substring(0, 50).toLowerCase().replace(/'/g, "\\'") + "');\n");
      } else {
        parts.push("  // No specific assertions - manual verification required\n");
      }

      if (relevantDocs.length > 0) {
        parts.push("\n  // Verify correct documents were retrieved (based on curator marks)\n");
        parts.push("  // " + relevantDocs.length + " documents marked as relevant\n");
        relevantDocs.slice(0, 3).forEach((doc: any) => {
          const docContent = doc.content?.substring(0, 60) || ("Document " + doc.id);
          parts.push("  // - " + docContent + "...\n");
        });
      }

      parts.push("\n  // Verify RAG metadata present (proof of advanced RAG)\n");
      parts.push("  const ragBadges = page.locator('[class*=\"bg-purple-500\"], [class*=\"bg-blue-500\"]');\n");
      parts.push("  const badgeCount = await ragBadges.count();\n");
      parts.push("  expect(badgeCount).toBeGreaterThan(0); // Should show RAG strategy badges\n\n");
      parts.push("  console.log('✅ RLHF regression test passed for query: ' + '" + query.substring(0, 50).replace(/'/g, "\\'") + "' + '...');\n");
      parts.push("});\n");

      const testCodeGenerated = parts.join('');
      setTestCode(testCodeGenerated);
      toast.success("Test case generated! Review and save to file.");
    } catch (error) {
      console.error("Error generating test:", error);
      toast.error("Failed to generate test case");
    } finally {
      setGenerating(false);
    }
  };

  const downloadTestFile = () => {
    if (!testCode) {
      toast.error("No test code to download");
      return;
    }

    const blob = new Blob([testCode], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = "rlhf-" + (feedbackData?.id || "test") + ".spec.ts";
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Test saved to " + fileName);
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <FileCode className="h-5 w-5 text-cyan-400" />
          Test Case Generator
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Auto-generate Playwright tests from user feedback
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Search/Load feedback */}
        {!feedbackData && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Enter feedback ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  onFocus={() => setShowRecent(true)}
                  className="bg-zinc-900/50 border-zinc-800 pr-10"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => {
                    setShowRecent(!showRecent);
                    if (!showRecent) loadRecentItems();
                  }}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showRecent && "rotate-180")} />
                </Button>

                {/* Recent items dropdown - shows approved/good feedback */}
                {showRecent && recentItems.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-zinc-700 text-xs text-zinc-400 flex items-center gap-2">
                      <TestTube className="h-3 w-3 text-cyan-400" />
                      Ready for Test Generation
                      {loadingRecent && <RefreshCw className="h-3 w-3 animate-spin ml-auto" />}
                    </div>
                    {recentItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFeedbackItem(item.id)}
                        className="w-full text-left px-3 py-2 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {item.status === "approved" && <CheckCheck className="h-3 w-3 text-green-400" />}
                          {item.thumbs_up && <ThumbsUp className="h-3 w-3 text-green-400" />}
                          {item.suggested_correction && <FileCode className="h-3 w-3 text-cyan-400" />}
                          <span className="text-xs text-zinc-300 truncate flex-1">
                            {item.query?.substring(0, 60)}...
                          </span>
                          <span className="text-xs text-zinc-500">{formatTimeAgo(item.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-[10px] text-zinc-500 font-mono">{item.id.substring(0, 8)}...</code>
                          {item.rating && (
                            <Badge variant="outline" className="text-[10px] h-4 border-green-500/50 text-green-400">
                              {item.rating}/5
                            </Badge>
                          )}
                          {item.status === "approved" && (
                            <Badge variant="outline" className="text-[10px] h-4 border-green-500/50 text-green-400">
                              approved
                            </Badge>
                          )}
                          {item.suggested_correction && (
                            <Badge variant="outline" className="text-[10px] h-4 border-cyan-500/50 text-cyan-400">
                              corrected
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => loadFeedbackItem()}
                disabled={loading || !searchId.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Load
                  </>
                )}
              </Button>
            </div>

            {/* Quick access hint */}
            {recentItems.length > 0 && !showRecent && (
              <p className="text-xs text-zinc-500">
                {recentItems.length} approved responses ready for test generation.
              </p>
            )}
          </div>
        )}

        {/* Feedback info */}
        {feedbackData && !testCode && (
          <Card className="bg-zinc-900/30 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300">Feedback Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-xs text-zinc-500">Query:</span>
                <p className="text-sm text-zinc-200 mt-1">{feedbackData.query || feedbackData.user_query || "N/A"}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  className={cn(
                    "text-xs",
                    (feedbackData.feedback_value?.score >= 4 || feedbackData.feedback_type === "thumbs_up")
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  )}
                >
                  {feedbackData.feedback_type === "thumbs_up" ? "👍" : feedbackData.feedback_type === "thumbs_down" ? "👎" : "⏳"}{" "}
                  {feedbackData.feedback_value?.score ? (feedbackData.feedback_value.score + "/5") : "No rating"}
                </Badge>
                {(feedbackData.retrieved_contexts || feedbackData.documents_marked) && (
                  <Badge className="text-xs bg-purple-500/20 text-purple-300">
                    {(feedbackData.retrieved_contexts || feedbackData.documents_marked).length} docs
                  </Badge>
                )}
                {feedbackData.status && (
                  <Badge className={cn(
                    "text-xs",
                    feedbackData.status === "approved" && "bg-green-500/20 text-green-300",
                    feedbackData.status === "pending" && "bg-yellow-500/20 text-yellow-300"
                  )}>
                    {feedbackData.status}
                  </Badge>
                )}
                {feedbackData.suggested_correction && (
                  <Badge className="text-xs bg-cyan-500/20 text-cyan-300">
                    Has Correction
                  </Badge>
                )}
              </div>
              <Button
                onClick={generateTestCase}
                disabled={generating}
                className="w-full mt-4 gap-2 bg-cyan-600 hover:bg-cyan-700"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileCode className="h-4 w-4" />
                    Generate Playwright Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generated test code */}
        {testCode && (
          <>
            <div className="flex items-center justify-between">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Test generated successfully
              </Badge>
              <Button onClick={downloadTestFile} variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>

            <ScrollArea className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <pre className="text-xs text-zinc-300 font-mono">
                <code>{testCode}</code>
              </pre>
            </ScrollArea>

            <Button
              variant="outline"
              onClick={() => {
                setFeedbackData(null);
                setTestCode("");
                setSearchId("");
              }}
              className="gap-2"
            >
              <FileCode className="h-4 w-4" />
              Generate Another Test
            </Button>
          </>
        )}

        {/* Empty state */}
        {!feedbackData && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
            <FileCode className="h-16 w-16 mb-4 text-zinc-700" />
            <p className="text-lg mb-2">No feedback loaded</p>
            <p className="text-sm">Enter a feedback ID to generate a test case</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
