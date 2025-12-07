/**
 * Test Case Generator Component
 *
 * Generates Playwright test cases from RLHF feedback
 * Part of Fix tab in Phase 5.3
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { FileCode, Download, RefreshCw, CheckCircle, Play } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface TestCaseGeneratorProps {
  feedbackItemId?: string;
}

export function TestCaseGenerator({ feedbackItemId }: TestCaseGeneratorProps) {
  const [searchId, setSearchId] = useState(feedbackItemId || "");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [testCode, setTestCode] = useState("");
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const supabase = createClientComponentClient();

  const loadFeedbackItem = async () => {
    if (!searchId.trim()) {
      toast.error("Please enter a feedback ID");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("*")
        .eq("id", searchId)
        .single();

      if (error) {
        console.error("Failed to load feedback:", error);
        toast.error("Feedback item not found");
        return;
      }

      setFeedbackData(data);
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
      const query = feedbackData.user_query || "";
      const expectedResponse = feedbackData.feedback_text || feedbackData.ai_response || "";
      const relevantDocs = feedbackData.documents_marked || [];

      const testCodeGenerated = `/**
 * Auto-generated from RLHF feedback
 * Feedback ID: ${feedbackData.id}
 * Generated: ${new Date().toISOString()}
 */

import { test, expect } from '@playwright/test';

test('RLHF Regression: ${query.substring(0, 80).replace(/"/g, '\\"')}...', async ({ page }) => {
  // Navigate to chat
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Send query
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Message"]').first();
  await chatInput.fill(\`${query.replace(/`/g, "\\`")}\`);
  
  const sendButton = page.locator('button:has-text("Send"), [data-testid="send-button"]').first();
  await sendButton.click();
  
  // Wait for AI response
  await page.waitForSelector('[role="assistant"], .assistant-message, .ai-message', { timeout: 30000 });
  const response = await page.locator('[role="assistant"], .assistant-message, .ai-message').last().textContent();
  
  // Verify response quality (based on curator feedback)
  expect(response).toBeTruthy();
  ${
    feedbackData.rating >= 4
      ? `
  // This response received positive feedback (${feedbackData.rating}/5 stars)
  // Expected to contain key information:`
      : `
  // This response received negative feedback - should be improved
  // Curator correction:`
  }
  ${expectedResponse ? `expect(response?.toLowerCase()).toContain('${expectedResponse.substring(0, 50).toLowerCase().replace(/'/g, "\\'")}');` : "// No specific assertions - manual verification required"}
  
  ${
    relevantDocs.length > 0
      ? `
  // Verify correct documents were retrieved (based on curator marks)
  // ${relevantDocs.length} documents marked as relevant`
      : ""
  }
  ${relevantDocs
    .slice(0, 3)
    .map((doc: any) => `// - ${doc.content?.substring(0, 60) || "Document " + doc.id}...`)
    .join("\n  ")}
  
  // Verify RAG metadata present (proof of advanced RAG)
  const ragBadges = page.locator('[class*="bg-purple-500"], [class*="bg-blue-500"]');
  const badgeCount = await ragBadges.count();
  expect(badgeCount).toBeGreaterThan(0); // Should show RAG strategy badges
  
  console.log('✅ RLHF regression test passed for query: ${query.substring(0, 50)}...');
});
`;

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
    a.download = `rlhf-${feedbackData?.id || "test"}.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Test saved to rlhf-${feedbackData?.id || "test"}.spec.ts`);
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
          <div className="flex gap-2">
            <Input
              placeholder="Enter feedback ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="flex-1 bg-zinc-900/50 border-zinc-800"
            />
            <Button
              onClick={loadFeedbackItem}
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
                <p className="text-sm text-zinc-200 mt-1">{feedbackData.user_query}</p>
              </div>
              <div className="flex gap-2">
                <Badge
                  className={cn(
                    "text-xs",
                    feedbackData.rating >= 4
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  )}
                >
                  {feedbackData.thumbs_up ? "👍" : "👎"}{" "}
                  {feedbackData.rating ? `${feedbackData.rating}/5` : "No rating"}
                </Badge>
                {feedbackData.documents_marked && (
                  <Badge className="text-xs bg-purple-500/20 text-purple-300">
                    {feedbackData.documents_marked.length} docs marked
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
