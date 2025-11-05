"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Loader } from "../ai-elements/loader";
import {
  Search,
  History,
  Sparkles,
  Loader2,
  RefreshCw,
  BookOpen,
  Brain,
  Zap,
  ChevronRight,
  Clock,
  TrendingUp,
  AlertCircle,
  Database,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Alert, AlertDescription } from "./alert";

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  strategy: "comprehensive" | "focused" | "rapid";
  responsePreview?: string;
  success: boolean;
}

interface QuerySuggestion {
  text: string;
  category: string;
  icon: React.ReactNode;
}

interface AOMAKnowledgePanelProps {
  className?: string;
  onQueryResult?: (result: any) => void;
}

export function AOMAKnowledgePanel({ className, onQueryResult }: AOMAKnowledgePanelProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<"comprehensive" | "focused" | "rapid">("focused");
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  // Load query history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem("aoma_query_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setQueryHistory(
          parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }))
        );
      } catch (e) {
        console.error("Failed to load query history:", e);
      }
    }
  }, []);

  // Save query history to localStorage
  useEffect(() => {
    if (queryHistory.length > 0) {
      localStorage.setItem("aoma_query_history", JSON.stringify(queryHistory));
    }
  }, [queryHistory]);

  const [querySuggestions, setQuerySuggestions] = useState<QuerySuggestion[]>([
    {
      text: "What are the latest enhancements to AOMA's asset ingestion workflow?",
      category: "Ingestion",
      icon: <RefreshCw className="h-3 w-3" />,
    },
    {
      text: "How has AOMA improved its search and retrieval functionality recently?",
      category: "Search",
      icon: <Search className="h-3 w-3" />,
    },
    {
      text: "What new integrations with third-party systems have been introduced in AOMA?",
      category: "Integrations",
      icon: <Zap className="h-3 w-3" />,
    },
    {
      text: "How does AOMA's updated permissions and access control model work?",
      category: "Security",
      icon: <AlertCircle className="h-3 w-3" />,
    },
    {
      text: "What features support compliance and legal requirements in AOMA?",
      category: "Compliance",
      icon: <Database className="h-3 w-3" />,
    },
    {
      text: "How does AOMA support collaboration and workflow management for teams?",
      category: "Collaboration",
      icon: <Sparkles className="h-3 w-3" />,
    },
  ]);

  // Fetch dynamic suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // UPDATED: Use /api/aoma-stream instead of deleted /api/aoma-mcp
        const response = await fetch("/api/aoma-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              "What are good questions about AOMA technical features, USM (Universal Service Model), cover hot swap functionality, asset ingestion, metadata management, and AOMA workflows? Provide 6 concise technical questions.",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result?.response) {
            // Parse the response to extract questions
            const lines = data.result.response.split("\n").filter((line: string) => line.trim());
            const newSuggestions: QuerySuggestion[] = [];

            const categories = [
              "Workflow",
              "Integration",
              "Security",
              "Troubleshooting",
              "Data Flow",
              "Updates",
            ];
            const iconComponents = [RefreshCw, Zap, AlertCircle, BookOpen, TrendingUp, Sparkles];

            lines.forEach((line: string, index: number) => {
              // Extract questions from numbered format
              const match = line.match(/^\d+\.\s+\*\*.*?\*\*:?\s*(.+)/);
              if (match && newSuggestions.length < 6) {
                const IconComponent = iconComponents[newSuggestions.length] || BookOpen;
                newSuggestions.push({
                  text: match[1].trim(),
                  category: categories[newSuggestions.length] || "General",
                  icon: <IconComponent className="h-3 w-3" />,
                });
              }
            });

            if (newSuggestions.length > 0) {
              setQuerySuggestions(newSuggestions);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch dynamic suggestions:", error);
        // Keep default suggestions on error
      }
    };

    fetchSuggestions();
  }, []);

  const executeQuery = useCallback(
    async (queryText: string, queryStrategy: string = strategy) => {
      if (!queryText.trim()) return;

      setIsLoading(true);
      setError(null);
      setActiveTab("search");

      try {
        // UPDATED: Use /api/aoma-stream instead of deleted /api/aoma-mcp
        const response = await fetch("/api/aoma-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: queryText,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to query AOMA knowledge base");
        }

        setCurrentResponse(data.result);

        // Add to history
        const historyItem: QueryHistoryItem = {
          id: Date.now().toString(),
          query: queryText,
          timestamp: new Date(),
          strategy: queryStrategy as any,
          responsePreview: data.result?.response?.substring(0, 100),
          success: true,
        };

        setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]); // Keep last 20

        if (onQueryResult) {
          onQueryResult(data.result);
        }
      } catch (err) {
        console.error("AOMA query failed:", err);
        setError(err instanceof Error ? err.message : "Query failed");

        // Add failed query to history
        const historyItem: QueryHistoryItem = {
          id: Date.now().toString(),
          query: queryText,
          timestamp: new Date(),
          strategy: queryStrategy as any,
          success: false,
        };

        setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
      } finally {
        setIsLoading(false);
      }
    },
    [strategy, onQueryResult]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(query);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    executeQuery(suggestion);
  };

  const handleHistoryRerun = (item: QueryHistoryItem) => {
    setQuery(item.query);
    executeQuery(item.query, item.strategy);
  };

  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem("aoma_query_history");
  };

  return (
    <Card className={cn("mac-card", "flex flex-col h-full", className)}>
      <CardHeader className="mac-card pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="mac-card">AOMA Knowledge Base</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {queryHistory.length} queries
            </Badge>
            <Badge
              variant={
                strategy === "comprehensive"
                  ? "default"
                  : strategy === "focused"
                    ? "secondary"
                    : "outline"
              }
              className="text-xs"
            >
              {strategy}
            </Badge>
          </div>
        </div>
        <CardDescription className="mac-card">
          Query Sony Music's AOMA knowledge system for insights and documentation
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Search Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="mac-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about AOMA, SIAM, or Sony Music systems..."
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          <Button
            className="mac-button mac-button-primary"
            type="submit"
            disabled={isLoading || !query.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Strategy Selector */}
        <div className="flex gap-2">
          <Button
            className="mac-button mac-button-primary"
            size="sm"
            variant={strategy === "rapid" ? "default" : "outline"}
            onClick={() => setStrategy("rapid")}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-2" />
            Rapid
          </Button>
          <Button
            className="mac-button mac-button-primary"
            size="sm"
            variant={strategy === "focused" ? "default" : "outline"}
            onClick={() => setStrategy("focused")}
            className="text-xs"
          >
            <Search className="h-3 w-3 mr-2" />
            Focused
          </Button>
          <Button
            className="mac-button mac-button-primary"
            size="sm"
            variant={strategy === "comprehensive" ? "default" : "outline"}
            onClick={() => setStrategy("comprehensive")}
            className="text-xs"
          >
            <BookOpen className="h-3 w-3 mr-2" />
            Comprehensive
          </Button>
        </div>

        {/* Main Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader />
                  <p className="text-sm text-muted-foreground mt-4">
                    Querying AOMA knowledge base...
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Strategy: {strategy}</p>
                </div>
              )}

              {error && !isLoading && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {currentResponse && !isLoading && (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formatResponse(currentResponse.response || currentResponse),
                      }}
                    />
                  </div>

                  {currentResponse.metadata && (
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-2" />
                        {new Date(currentResponse.metadata.timestamp).toLocaleTimeString()}
                      </Badge>
                      {currentResponse.metadata.version && (
                        <Badge variant="outline" className="text-xs">
                          v{currentResponse.metadata.version}
                        </Badge>
                      )}
                      {currentResponse.metadata.threadId && (
                        <Badge variant="outline" className="text-xs">
                          Thread: {currentResponse.metadata.threadId.slice(-8)}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!isLoading && !error && !currentResponse && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Brain className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">Query the AOMA knowledge base to get started</p>
                  <p className="text-xs mt-2">
                    Try searching for architecture, workflows, or features
                  </p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="suggestions" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              <div className="grid gap-2">
                {querySuggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto p-4 mac-button mac-button-outline"
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <div className="mt-2">{suggestion.icon}</div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{suggestion.text}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {suggestion.category}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 mt-2 opacity-50" />
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {queryHistory.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Recent queries</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="text-xs mac-button mac-button-outline"
                    >
                      Clear all
                    </Button>
                  </div>

                  {queryHistory.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              !item.success && "text-destructive"
                            )}
                          >
                            {item.query}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {item.strategy}
                          </Badge>
                        </div>
                        {item.responsePreview && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {item.responsePreview}...
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {item.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        className="mac-button mac-button-outline"
                        size="sm"
                        variant="ghost"
                        className="mac-button mac-button-outline"
                        onClick={() => handleHistoryRerun(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <History className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No query history yet</p>
                  <p className="text-xs mt-2">Your recent queries will appear here</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to format markdown-like response to HTML
function formatResponse(text: any): string {
  if (!text) return "";

  // Handle non-string inputs
  if (typeof text !== "string") {
    text = JSON.stringify(text, null, 2);
  }

  // Convert markdown-like syntax to HTML
  let formatted = text
    // Headers
    .replace(
      /^### (.*?)$/gm,
      '<h3  className="mac-title"class="font-normal text-base mt-4 mb-2">$1</h3>'
    )
    .replace(
      /^## (.*?)$/gm,
      '<h2  className="mac-heading"class="font-bold text-lg mt-4 mb-2">$1</h2>'
    )
    .replace(
      /^# (.*?)$/gm,
      '<h1  className="mac-heading"class="font-bold text-xl mt-4 mb-2">$1</h1>'
    )
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Lists
    .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*?)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-4">')
    // Code blocks
    .replace(/`([^`]+)`/g, '<code class="px-2 py-0.5 bg-muted rounded text-sm">$1</code>');

  // Wrap in paragraph if not already wrapped
  if (!formatted.startsWith("<")) {
    formatted = `<p class="mb-4">${formatted}</p>`;
  }

  return formatted;
}
