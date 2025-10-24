/**
 * Updated Firecrawl Panel - Connected to Unified Test Intelligence API
 * Analyzes AUT and provides test intelligence
 */

import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Search,
  FileSearch,
  Globe,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Code,
  BookOpen,
  Database,
  ExternalLink,
  Loader2,
  Sparkles,
  Brain,
  Bug,
  HelpCircle,
} from "lucide-react";

interface DocumentSource {
  id: string;
  name: string;
  url: string;
  type: "documentation" | "api-spec" | "github" | "confluence";
  status: "active" | "inactive" | "syncing";
  documentsCount: number;
  lastSync: Date;
  schedule: string;
}

interface TestableFeature {
  name: string;
  description: string;
  testPriority: "high" | "medium" | "low";
  testTypes: string[];
  selectors?: string[];
}

interface UserFlow {
  name: string;
  steps: string[];
  criticalPath: boolean;
}

interface AUTAnalysis {
  testableFeatures: TestableFeature[];
  userFlows: UserFlow[];
  apiEndpoints: string[];
  documentationUrls: string[];
  knowledgeExtracted: {
    category: string;
    content: string;
    relevance: number;
  }[];
}

interface SupportResponse {
  answer: string;
  confidence: number;
  sources: string[];
  suggestedActions?: string[];
}

export const FirecrawlPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(0);
  const [autAnalysis, setAutAnalysis] = useState<AUTAnalysis | null>(null);
  const [supportQuery, setSupportQuery] = useState("");
  const [supportResponse, setSupportResponse] = useState<SupportResponse | null>(null);
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [apiHealth, setApiHealth] = useState<any>(null);
  const [commonIssues, setCommonIssues] = useState<any[]>([]);

  // Check API health on mount
  useEffect(() => {
    checkApiHealth();
    fetchCommonIssues();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch("/api/test-intelligence");
      const data = await response.json();
      setApiHealth(data.configuration);
    } catch (error) {
      console.error("Failed to check API health:", error);
    }
  };

  const fetchCommonIssues = async () => {
    try {
      const response = await fetch("/api/test-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "common-issues", params: { limit: 5 } }),
      });
      const data = await response.json();
      if (data.success) {
        setCommonIssues(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch common issues:", error);
    }
  };

  const handleAnalyzeAUT = async () => {
    setIsScanning(true);
    setCrawlProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setCrawlProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      const response = await fetch("/api/test-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-aut",
          params: { url: newSourceUrl || "https://aoma-stage.smcdp-de.net" },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAutAnalysis(data.data);
        setCrawlProgress(100);
      } else {
        console.error("Analysis failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to analyze AUT:", error);
    } finally {
      clearInterval(progressInterval);
      setIsScanning(false);
    }
  };

  const handleSupportQuery = async () => {
    if (!supportQuery.trim()) return;

    setIsLoadingSupport(true);
    setSupportResponse(null);

    try {
      const response = await fetch("/api/test-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "support-query",
          params: { question: supportQuery },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSupportResponse(data.data);
      } else {
        console.error("Support query failed:", data.error);
      }
    } catch (error) {
      console.error("Failed to get support answer:", error);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  const handleGenerateTests = async () => {
    try {
      const response = await fetch("/api/test-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate-tests" }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("Generated test recommendations:", data.data);
        // You could show these in a modal or separate section
      }
    } catch (error) {
      console.error("Failed to generate tests:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* API Status Banner */}
      {apiHealth && (
        <Alert className={apiHealth.firecrawl ? "border-green-500/20" : "border-yellow-500/20"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Test Intelligence Status:
              {apiHealth.firecrawl ? " ✅ Firecrawl" : " ⚠️ Mock Mode"} |
              {apiHealth.supabase ? " ✅ Supabase" : " ❌ Supabase"} |
              {apiHealth.aoma ? " ✅ AOMA" : " ❌ AOMA"}
            </span>
            <Button
              className="mac-button mac-button-outline"
              size="sm"
              variant="ghost"
              className="mac-button mac-button-outline"
              onClick={checkApiHealth}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* AUT Analysis Section */}
      <Card className="mac-card">
        <CardHeader className="mac-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="mac-card">Application Under Test Analysis</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs">
              {apiHealth?.firecrawl ? "Live Analysis" : "Mock Data"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="mac-input"
              placeholder="Enter AUT URL (default: AOMA staging)"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAnalyzeAUT}
              disabled={isScanning}
              className="min-w-[120px] mac-button mac-button-primary"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileSearch className="mr-2 h-4 w-4" />
                  Analyze AUT
                </>
              )}
            </Button>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing application...</span>
                <span>{crawlProgress}%</span>
              </div>
              <Progress value={crawlProgress} />
            </div>
          )}

          {autAnalysis && (
            <Tabs defaultValue="features" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="flows">User Flows</TabsTrigger>
                <TabsTrigger value="apis">APIs</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="space-y-2">
                <h4 c className="mac-title" lassName="mac-title text-sm font-semibold mb-2">
                  Testable Features ({autAnalysis.testableFeatures.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  {autAnalysis.testableFeatures.map((feature, idx) => (
                    <Card key={idx} className="mac-card mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium">{feature.name}</h5>
                              <Badge
                                variant="outline"
                                className={getPriorityColor(feature.testPriority)}
                              >
                                {feature.testPriority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              {feature.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {feature.testTypes.map((type, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="flows" className="space-y-2">
                <h4 c className="mac-title" lassName="mac-title text-sm font-semibold mb-2">
                  User Flows ({autAnalysis.userFlows.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  {autAnalysis.userFlows.map((flow, idx) => (
                    <Card key={idx} className="mac-card mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">{flow.name}</h5>
                          {flow.criticalPath && (
                            <Badge variant="destructive" className="text-xs">
                              Critical Path
                            </Badge>
                          )}
                        </div>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground">
                          {flow.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="apis" className="space-y-2">
                <h4 c className="mac-title" lassName="mac-title text-sm font-semibold mb-2">
                  API Endpoints ({autAnalysis.apiEndpoints.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {autAnalysis.apiEndpoints.map((endpoint, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                      >
                        <Code className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm flex-1">{endpoint}</code>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="knowledge" className="space-y-2">
                <h4 c className="mac-title" lassName="mac-title text-sm font-semibold mb-2">
                  Extracted Knowledge ({autAnalysis.knowledgeExtracted.length})
                </h4>
                <ScrollArea className="h-[300px]">
                  {autAnalysis.knowledgeExtracted.map((item, idx) => (
                    <Card key={idx} className="mac-card mb-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Badge variant="outline" className="mb-2">
                              {item.category}
                            </Badge>
                            <p className="text-sm">{item.content}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">{item.relevance}%</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Support Intelligence Section */}
      <Card className="mac-card">
        <CardHeader className="mac-card">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="mac-card">Support Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              className="mac-input"
              placeholder="Ask a support question about AOMA..."
              value={supportQuery}
              onChange={(e) => setSupportQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSupportQuery()}
              className="flex-1"
            />
            <Button
              className="mac-button mac-button-primary"
              onClick={handleSupportQuery}
              disabled={isLoadingSupport}
            >
              {isLoadingSupport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <HelpCircle className="h-4 w-4" />
              )}
            </Button>
          </div>

          {supportResponse && (
            <Card className="mac-card border-primary/20">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {supportResponse.confidence}% confidence
                    </Badge>
                    <div className="flex gap-2">
                      {supportResponse.sources.map((source, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">{supportResponse.answer}</p>
                  {supportResponse.suggestedActions &&
                    supportResponse.suggestedActions.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium mb-2">Suggested Actions:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {supportResponse.suggestedActions.map((action, i) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Common Issues */}
          {commonIssues.length > 0 && (
            <div className="pt-4 border-t">
              <h4 c className="mac-title" lassName="mac-title text-sm font-semibold mb-2">
                Common Issues
              </h4>
              <div className="space-y-2">
                {commonIssues.map((issue, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="flex items-center gap-2">
                      <Bug className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{issue.title}</span>
                    </div>
                    {issue.solution && (
                      <p className="text-xs text-muted-foreground ml-6 mt-2">
                        {issue.solution.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="mac-button mac-button-outline"
          onClick={handleGenerateTests}
          variant="outline"
          className="mac-button mac-button-outline"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Test Recommendations
        </Button>
        <Button
          className="mac-button mac-button-outline"
          onClick={fetchCommonIssues}
          variant="outline"
          className="mac-button mac-button-outline"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Common Issues
        </Button>
      </div>
    </div>
  );
};
