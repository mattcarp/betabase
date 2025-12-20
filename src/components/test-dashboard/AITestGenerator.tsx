"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  Lightbulb,
  Sparkles,
  FileText,
  Code,
  Wand2,
  Copy,
  Download,
  Play,
  Settings,
  MessageSquare,
  FileCode,
  Zap,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock,
  History,
  Video,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";
import {
  generateFeatureName,
  transformToRecordingScript,
  executeRecording,
  checkDevServer,
} from "../../lib/playwright/screencast-recorder";

interface GeneratedTest {
  id: string;
  name: string;
  type: string;
  language: string;
  code: string;
  description: string;
  coverage: string[];
  timestamp: Date;
}

export const AITestGenerator: React.FC = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [testType, setTestType] = useState("unit");
  const [language, setLanguage] = useState("typescript");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordScreencast, setRecordScreencast] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastVideoPath, setLastVideoPath] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState("https://");
  const [recordingResult, setRecordingResult] = useState<{
    videoPath: string;
    consoleErrors: string[];
  } | null>(null);
  const [generatedTests, setGeneratedTests] = useState<GeneratedTest[]>([
    {
      id: "1",
      name: "Authentication Flow Test",
      type: "e2e",
      language: "typescript",
      description:
        "Comprehensive test for user authentication including login, logout, and session management",
      coverage: ["Login", "Logout", "Session Persistence", "Error Handling"],
      timestamp: new Date(),
      code: `import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should successfully authenticate with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('[data-testid="email-input"]', 'user@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123');
    
    // Submit form
    await page.click('[data-testid="login-button"]');
    
    // Wait for navigation
    await page.waitForURL('/dashboard');
    
    // Verify successful login
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword');
    
    await page.click('[data-testid="login-button"]');
    
    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    
    // Ensure we stay on login page
    await expect(page).toHaveURL('/login');
  });
});`,
    },
    {
      id: "2",
      name: "API Response Validation",
      type: "integration",
      language: "typescript",
      description: "Test API endpoints for correct response structure and error handling",
      coverage: ["API Response", "Error Codes", "Data Validation"],
      timestamp: new Date(),
      code: `import { describe, it, expect } from 'vitest';
import { apiClient } from '../src/lib/api';

describe('API Integration Tests', () => {
  it('should fetch user data successfully', async () => {
    const response = await apiClient.get('/api/user/profile');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('id');
    expect(response.data).toHaveProperty('email');
    expect(response.data).toHaveProperty('name');
  });

  it('should handle 404 errors appropriately', async () => {
    try {
      await apiClient.get('/api/nonexistent');
    } catch (error) {
      expect(error.response.status).toBe(404);
      expect(error.response.data).toHaveProperty('message');
    }
  });
});`,
    },
  ]);

  const [selectedTest, setSelectedTest] = useState<GeneratedTest | null>(generatedTests[0]);

  const handleGenerate = async () => {
    if (recordScreencast) {
      // Recording mode
      setIsRecording(true);
      setIsGenerating(true);
      setRecordingResult(null);

      try {
        // Validate URL
        const url = targetUrl.trim();
        if (!url || !url.startsWith("http")) {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive",
          });
          return;
        }

        // For localhost URLs, check if server is running
        if (url.includes("localhost")) {
          const serverRunning = await checkDevServer(url);
          if (!serverRunning) {
            toast({
              title: "Server not reachable",
              description: `Cannot connect to ${url}`,
              variant: "destructive",
            });
            return;
          }
        }

        // Steps are empty for now - the script will just navigate and capture
        // In the future, these could be AI-generated from the prompt
        const steps: string[] = [];

        const featureName = generateFeatureName(prompt || "screencast");
        const script = transformToRecordingScript(steps, featureName, url);
        const result = await executeRecording(script);

        if (result.success && result.videoPath) {
          setLastVideoPath(result.videoPath);
          const consoleErrors = result.consoleErrors || [];

          // Store full result for UI
          setRecordingResult({
            videoPath: result.videoPath,
            consoleErrors: consoleErrors.map((e) => e.text),
          });

          const filename = result.videoPath.split("/").pop() || "recording.webm";

          if (consoleErrors.length > 0) {
            // Show warning toast when errors found
            toast({
              title: `Recording complete - ${consoleErrors.length} console error${consoleErrors.length > 1 ? "s" : ""} found`,
              description: filename,
              variant: "destructive",
            });
          } else {
            const directory = result.videoPath.replace(/\/[^/]+$/, "");
            toast({
              title: "Screencast recorded - No errors",
              description: filename,
              action: (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`file://${directory}`);
                  }}
                >
                  Show in Finder
                </Button>
              ),
            });
          }
        } else {
          console.error("Recording failed:", result.error);
          toast({
            title: "Recording failed",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Recording error:", error);
        toast({
          title: "Recording error",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setIsRecording(false);
        setIsGenerating(false);
      }
    } else {
      // Original test generation mode
      setIsGenerating(true);

      // Simulate AI generation
      setTimeout(() => {
        const newTest: GeneratedTest = {
          id: Date.now().toString(),
          name: "Generated Test Suite",
          type: testType,
          language: language,
          description: `AI-generated ${testType} test based on: ${prompt}`,
          coverage: ["Component Rendering", "User Interactions", "State Management"],
          timestamp: new Date(),
          code: `// AI-Generated Test
import { test, expect } from '@playwright/test';

test.describe('${prompt}', () => {
  test('should ${prompt.toLowerCase()}', async ({ page }) => {
    // AI-generated test implementation
    await page.goto('/');

    // Test logic based on natural language prompt
    // This would be generated by the AI model

    await expect(page).toHaveTitle(/SIAM/);
  });
});`,
        };

        setGeneratedTests([newTest, ...generatedTests]);
        setSelectedTest(newTest);
        setIsGenerating(false);
        setPrompt("");
      }, 2000);
    }
  };

  const testTypeOptions = [
    { value: "unit", label: "Unit Test", icon: <Code className="h-4 w-4" /> },
    {
      value: "integration",
      label: "Integration Test",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      value: "e2e",
      label: "End-to-End Test",
      icon: <FileCode className="h-4 w-4" />,
    },
    {
      value: "performance",
      label: "Performance Test",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const promptSuggestions = [
    "Test user authentication flow with magic links",
    "Verify file upload functionality works correctly",
    "Test real-time chat message streaming",
    "Validate API error handling and retry logic",
    "Test responsive design on mobile devices",
    "Verify accessibility compliance for screen readers",
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Generation Panel */}
      <div className="col-span-5 space-y-4">
        <Card className="mac-card">
          <CardHeader className="mac-card">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              AI Test Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Natural Language Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Describe what you want to test</Label>
              <Textarea
                id="prompt"
                placeholder="E.g., Test that users can successfully upload and process PDF documents..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] font-light bg-zinc-900/50 border-zinc-800"
              />
            </div>

            {/* Zeitgeist Integration: Trending Topics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-zinc-400">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  Trending Topics (Zeitgeist)
                </Label>
                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Live
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { topic: "AOMA S3 Glacier Tiers", source: "Jira #AOMA-122", type: "new-feature" },
                  { topic: "Magic Link Session Drift", source: "Alexandria Docs", type: "bug-risk" },
                  { topic: "UST Release 2026", source: "Recent Chats", type: "hot-topic" },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(`Test the ${item.topic} functionality as described in ${item.source}`)}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-light text-zinc-200 group-hover:text-emerald-300">{item.topic}</span>
                      <span className="text-[10px] text-zinc-500">{item.source}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-4 bg-zinc-900 text-zinc-500">
                      {item.type}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-2">
              <Label>Quick Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setPrompt(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Test Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-type">Test Type</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger id="test-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="typescript">TypeScript</SelectItem>
                    <SelectItem value="javascript">JavaScript</SelectItem>
                    <SelectItem value="python">Python</SelectItem>
                    <SelectItem value="java">Java</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Options */}
            <Card className="mac-card bg-muted/50">
              <CardContent className="p-4 space-y-3">
                <h4 className="mac-title">Advanced Options</h4>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    Include assertions
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    Add error handling
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Generate test data
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    Include performance metrics
                  </label>

                  {/* Record Screencast Option */}
                  <div className="border-t border-border my-3" />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={recordScreencast}
                      onChange={(e) => setRecordScreencast(e.target.checked)}
                    />
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Record screencast
                  </label>
                  {recordScreencast && (
                    <div className="ml-6 space-y-3 mt-2">
                      <div className="space-y-1">
                        <Label htmlFor="target-url" className="text-xs">Target URL</Label>
                        <input
                          id="target-url"
                          type="url"
                          className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-md"
                          placeholder="https://sonymusic.com"
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Resolution: 1920x1080</div>
                        <div>Output: ~/Desktop/playwright-screencasts/</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              className="w-full mac-button mac-button-primary"
              size="lg"
              onClick={handleGenerate}
              disabled={!prompt || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  {recordScreencast ? "Recording..." : "Generating..."}
                </>
              ) : (
                <>
                  {recordScreencast ? (
                    <Video className="h-4 w-4 mr-2" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  {recordScreencast ? "Generate & Record" : "Generate Automated Test"}
                </>
              )}
            </Button>

            {/* Recording Results Panel */}
            {recordingResult && (
              <Card className={cn(
                "mt-4",
                recordingResult.consoleErrors.length > 0
                  ? "border-destructive bg-destructive/5"
                  : "border-green-500/50 bg-green-500/5"
              )}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      {recordingResult.consoleErrors.length > 0 ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          {recordingResult.consoleErrors.length} Console Error{recordingResult.consoleErrors.length > 1 ? "s" : ""} Found
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          No Console Errors
                        </>
                      )}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRecordingResult(null)}
                      className="h-6 w-6 p-0"
                    >
                      x
                    </Button>
                  </div>

                  {/* Video path */}
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Video className="h-3 w-3" />
                    {recordingResult.videoPath.split("/").pop()}
                  </div>

                  {/* Console errors list */}
                  {recordingResult.consoleErrors.length > 0 && (
                    <div className="space-y-2">
                      <ScrollArea className="h-[120px]">
                        <div className="space-y-2">
                          {recordingResult.consoleErrors.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-mono p-2 bg-background rounded border border-border"
                            >
                              {error.length > 200 ? error.slice(0, 200) + "..." : error}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            // TODO: Implement troubleshoot flow
                            toast({
                              title: "Troubleshoot",
                              description: "Analyzing console errors...",
                            });
                          }}
                        >
                          Troubleshoot Errors
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const directory = recordingResult.videoPath.replace(/\/[^/]+$/, "");
                            window.open(`file://${directory}`);
                          }}
                        >
                          Show Video
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Generated Tests History */}
        <Card className="mac-card">
          <CardHeader className="mac-card">
            <CardTitle className="text-lg">Generated Automated Tests</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="p-4 space-y-2">
                {generatedTests.map((test) => (
                  <Card
                    key={test.id}
                    className={cn(
                      "mac-card",
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTest?.id === test.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTest(test)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{test.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {test.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{test.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Generated Test Preview */}
      <div className="col-span-7">
        {selectedTest ? (
          <Card className="mac-card h-full">
            <CardHeader className="mac-card">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedTest.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">{selectedTest.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="mac-button mac-button-outline"
                    variant="outline"
                    className="mac-button mac-button-outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    className="mac-button mac-button-outline"
                    variant="outline"
                    className="mac-button mac-button-outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button className="mac-button mac-button-primary" size="sm" aria-label="Play">
                    <Play className="h-4 w-4 mr-2" />
                    Run Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mac-card">
              <Tabs defaultValue="code" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="code">Generated Code</TabsTrigger>
                  <TabsTrigger value="coverage">Coverage Analysis</TabsTrigger>
                  <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="h-full">
                  <Card className="mac-card bg-muted/50">
                    <CardContent className="p-4">
                      <pre className="text-sm font-mono overflow-x-auto">
                        <code>{selectedTest.code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="coverage" className="space-y-4">
                  <Card className="mac-card">
                    <CardHeader className="mac-card">
                      <CardTitle className="text-base">Test Coverage Areas</CardTitle>
                    </CardHeader>
                    <CardContent className="mac-card">
                      <div className="space-y-2">
                        {selectedTest.coverage.map((area, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{area}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mac-card">
                    <CardHeader className="mac-card">
                      <CardTitle className="text-base">Potential Gaps</CardTitle>
                    </CardHeader>
                    <CardContent className="mac-card">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Edge case: Empty input handling</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">Network timeout scenarios</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-4">
                  <Card className="mac-card bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                      <h3
                        className="mac-title"
                        className="mac-title font-medium mb-2 flex items-center gap-2"
                      >
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        AI Recommendations
                      </h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Consider adding retry logic for flaky network requests</li>
                        <li>• Add data-testid attributes to improve test stability</li>
                        <li>• Include accessibility checks using axe-core</li>
                        <li>• Add visual regression tests for UI components</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="mac-card">
                    <CardHeader className="mac-card">
                      <CardTitle className="text-base">Related Tests to Generate</CardTitle>
                    </CardHeader>
                    <CardContent className="mac-card">
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start mac-button mac-button-outline"
                          size="sm"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Test error boundary behavior
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start mac-button mac-button-outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Test data persistence
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start mac-button mac-button-outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Test configuration changes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="mac-card h-full">
            <CardContent className="flex items-center justify-center h-full text-muted-foreground">
              Generate a test or select from history to preview
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AITestGenerator;
