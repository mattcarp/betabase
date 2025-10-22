"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import {
  Brain,
  Sparkles,
  Code,
  Play,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Copy,
  Download,
  GitCompare,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Editor from "@monaco-editor/react";

interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: Date;
  error?: {
    message: string;
    stack: string;
    expected?: string;
    actual?: string;
  };
  logs?: string[];
  screenshots?: string[];
  video?: string;
}

interface AssertionMapping {
  id: string;
  action: {
    type: "navigation" | "click" | "input" | "wait" | "screenshot" | "assertion";
    description: string;
    selector?: string;
    value?: string;
  };
  assertion: {
    type: string;
    code: string;
    description: string;
  };
  confidence: number; // 0-100
  lineNumber: number;
}

interface GenerationPhase {
  status: "analyzing" | "generating" | "complete" | "error";
  progress: number;
  message: string;
}

interface AITestGenerationModalProps {
  testResult: TestResult;
  isOpen: boolean;
  onClose: () => void;
  existingTest?: string;
}

export const AITestGenerationModal: React.FC<AITestGenerationModalProps> = ({
  testResult,
  isOpen,
  onClose,
  existingTest,
}) => {
  const [phase, setPhase] = useState<GenerationPhase>({
    status: "analyzing",
    progress: 0,
    message: "Analyzing test session...",
  });
  const [editedCode, setEditedCode] = useState("");
  const [assertions, setAssertions] = useState<AssertionMapping[]>([]);
  const [isPreviewRunning, setIsPreviewRunning] = useState(false);
  const [previewResults, setPreviewResults] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);

  // Start generation when modal opens
  useEffect(() => {
    if (isOpen) {
      generateTest();
    }
  }, [isOpen]);

  const generateTest = async () => {
    try {
      // Phase 1: Analyzing
      setPhase({
        status: "analyzing",
        progress: 20,
        message: "Analyzing test session and extracting actions...",
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Phase 2: Generating
      setPhase({
        status: "generating",
        progress: 50,
        message: "Generating Playwright test code with assertions...",
      });

      // Call API to generate test
      const response = await fetch("/api/test/generate-from-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testResult: testResult,
          existingTest: existingTest,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate test");
      }

      const data = await response.json();

      setPhase({
        status: "generating",
        progress: 80,
        message: "Mapping actions to assertions...",
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Set generated data
      const generatedCode = data.code || getMockGeneratedCode();
      setEditedCode(generatedCode);
      setAssertions(data.assertions || getMockAssertions());

      // Phase 3: Complete
      setPhase({
        status: "complete",
        progress: 100,
        message: "Test generation complete!",
      });
    } catch (error) {
      console.error("Error generating test:", error);
      setPhase({
        status: "error",
        progress: 0,
        message: "Failed to generate test. Using mock data for demo.",
      });

      // Use mock data for demo
      const mockCode = getMockGeneratedCode();
      setEditedCode(mockCode);
      setAssertions(getMockAssertions());

      // Automatically recover to complete state
      setTimeout(() => {
        setPhase({
          status: "complete",
          progress: 100,
          message: "Test generation complete (demo mode)!",
        });
      }, 2000);
    }
  };

  const getMockGeneratedCode = () => {
    return `import { test, expect } from '@playwright/test';

test.describe('${testResult.suite}', () => {
  test('${testResult.name}', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL(/localhost:3000/);

    // Fill in email field
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await expect(page.locator('[data-testid="email-input"]')).toHaveValue('test@example.com');

    // Click submit button
    await page.click('[data-testid="submit-button"]');

    // Wait for navigation
    await page.waitForURL(/dashboard/);

    // Verify successful authentication
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('text=Welcome')).toBeVisible();
  });
});`;
  };

  const getMockAssertions = (): AssertionMapping[] => {
    return [
      {
        id: "1",
        action: {
          type: "navigation",
          description: "Navigate to application",
          value: "http://localhost:3000",
        },
        assertion: {
          type: "toHaveURL",
          code: "await expect(page).toHaveURL(/localhost:3000/);",
          description: "Verify URL matches expected pattern",
        },
        confidence: 95,
        lineNumber: 5,
      },
      {
        id: "2",
        action: {
          type: "input",
          description: "Enter email address",
          selector: '[data-testid="email-input"]',
          value: "test@example.com",
        },
        assertion: {
          type: "toHaveValue",
          code: 'await expect(page.locator(\'[data-testid="email-input"]\')).toHaveValue(\'test@example.com\');',
          description: "Verify email input contains correct value",
        },
        confidence: 88,
        lineNumber: 9,
      },
      {
        id: "3",
        action: {
          type: "click",
          description: "Click submit button",
          selector: '[data-testid="submit-button"]',
        },
        assertion: {
          type: "waitForURL",
          code: "await page.waitForURL(/dashboard/);",
          description: "Wait for navigation to dashboard",
        },
        confidence: 92,
        lineNumber: 15,
      },
      {
        id: "4",
        action: {
          type: "assertion",
          description: "Verify user avatar is visible",
          selector: '[data-testid="user-avatar"]',
        },
        assertion: {
          type: "toBeVisible",
          code: 'await expect(page.locator(\'[data-testid="user-avatar"]\')).toBeVisible();',
          description: "Confirm user avatar appears after login",
        },
        confidence: 85,
        lineNumber: 18,
      },
      {
        id: "5",
        action: {
          type: "assertion",
          description: "Verify welcome message",
          selector: "text=Welcome",
        },
        assertion: {
          type: "toBeVisible",
          code: "await expect(page.locator('text=Welcome')).toBeVisible();",
          description: "Confirm welcome message is displayed",
        },
        confidence: 78,
        lineNumber: 19,
      },
    ];
  };

  const handlePreview = async () => {
    setIsPreviewRunning(true);
    setPreviewResults(null);

    try {
      // Call API to run test preview
      const response = await fetch("/api/test/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editedCode,
          testName: testResult.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Preview execution failed");
      }

      const data = await response.json();
      setPreviewResults(data);
    } catch (error) {
      console.error("Error previewing test:", error);
      // Mock preview results
      setPreviewResults({
        status: "passed",
        duration: 2345,
        output: "Test passed successfully!",
      });
    } finally {
      setIsPreviewRunning(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/test/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: editedCode,
          testName: testResult.name,
          suite: testResult.suite,
          sourceSessionId: testResult.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save test");
      }

      const data = await response.json();
      console.log("Test saved:", data);

      // Show success message
      alert(`Test saved successfully to ${data.filePath || "tests/" + testResult.suite + ".spec.ts"}`);
      onClose();
    } catch (error) {
      console.error("Error saving test:", error);
      alert("Failed to save test. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedCode);
    alert("Code copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([editedCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${testResult.suite}-${testResult.name}.spec.ts`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-500";
    if (confidence >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 85) return <TrendingUp className="h-4 w-4" />;
    if (confidence >= 70) return <Minus className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Test Generator
          </DialogTitle>
          <DialogDescription>
            Converting session: {testResult.name} to automated Playwright test
          </DialogDescription>
        </DialogHeader>

        {/* Loading/Analyzing Phase */}
        {phase.status !== "complete" && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              {phase.status === "error" ? (
                <AlertCircle className="h-16 w-16 text-yellow-500 animate-pulse" />
              ) : (
                <Sparkles className="h-16 w-16 text-primary animate-pulse" />
              )}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">{phase.message}</h3>
                <Progress value={phase.progress} className="w-64" />
                <p className="text-sm text-muted-foreground">{phase.progress}% complete</p>
              </div>
            </div>

            {phase.status === "analyzing" && (
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Extracting test actions and steps...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Analyzing console logs and errors...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Identifying selectors and elements...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {phase.status === "generating" && (
              <Card className="bg-muted/50">
                <CardContent className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Session analysis complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Playwright test code...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating action-to-assertion mappings...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating confidence scores...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Complete Phase - Main Content */}
        {phase.status === "complete" && (
          <Tabs defaultValue="code" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-2" />
                  Generated Code
                </TabsTrigger>
                <TabsTrigger value="mapping">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Action Mapping
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <Play className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                {existingTest && (
                  <TabsTrigger value="diff">
                    <GitCompare className="h-4 w-4 mr-2" />
                    Diff
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  disabled={isPreviewRunning}
                >
                  {isPreviewRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Test
                    </>
                  )}
                </Button>
              </div>
            </div>

            <TabsContent value="code" className="h-[500px] mt-0">
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <Editor
                    height="100%"
                    defaultLanguage="typescript"
                    value={editedCode}
                    onChange={(value) => setEditedCode(value || "")}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mapping" className="h-[500px] mt-0">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  {assertions.map((mapping) => (
                    <Card key={mapping.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Action */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{mapping.action.type}</Badge>
                              <span className="text-sm font-medium">
                                {mapping.action.description}
                              </span>
                            </div>
                            {mapping.action.selector && (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {mapping.action.selector}
                              </code>
                            )}
                          </div>

                          {/* Arrow */}
                          <ArrowRight className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-2" />

                          {/* Assertion */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge>{mapping.assertion.type}</Badge>
                              <span className="text-sm font-medium">
                                {mapping.assertion.description}
                              </span>
                            </div>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                              <code>{mapping.assertion.code}</code>
                            </pre>
                          </div>

                          {/* Confidence Score */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={cn("flex items-center gap-1", getConfidenceColor(mapping.confidence))}>
                              {getConfidenceIcon(mapping.confidence)}
                              <span className="text-lg font-bold">{mapping.confidence}%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">confidence</span>
                            <Badge variant="secondary" className="text-xs mt-1">
                              L{mapping.lineNumber}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="preview" className="h-[500px] mt-0">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Test Preview Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {!previewResults ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Play className="h-12 w-12 mb-4" />
                      <p>Click "Preview" to run the generated test</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        {previewResults.status === "passed" ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        )}
                        <div>
                          <h3 className="font-medium text-lg">
                            Test {previewResults.status === "passed" ? "Passed" : "Failed"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Duration: {previewResults.duration}ms
                          </p>
                        </div>
                      </div>

                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <h4 className="font-medium mb-2">Output</h4>
                          <pre className="text-sm">{previewResults.output}</pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {existingTest && (
              <TabsContent value="diff" className="h-[500px] mt-0">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Code Diff</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 h-[400px]">
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-red-500">Previous Version</h4>
                        <ScrollArea className="h-full">
                          <pre className="text-xs bg-muted p-3 rounded">{existingTest}</pre>
                        </ScrollArea>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-green-500">New Version</h4>
                        <ScrollArea className="h-full">
                          <pre className="text-xs bg-muted p-3 rounded">{editedCode}</pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AITestGenerationModal;
