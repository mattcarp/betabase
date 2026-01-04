/**
 * Response Debugger Component
 *
 * Shows full RAG pipeline trace for debugging responses
 * Part of Fix tab in Phase 5
 * 
 * Enhanced 2025-12-16: Added recent items dropdown for demo
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { Search, RefreshCw, Activity, GitBranch, FileText, Lightbulb, ChevronDown, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface DebugData {
  query: string;
  strategy: string;
  retrievedDocs: any[];
  rerankedDocs: any[];
  agentSteps: any[];
  confidence: number;
  sessionHistory: any[];
  rlhfSignalsUsed: boolean;
}

interface RecentFeedback {
  id: string;
  query: string;
  thumbs_up: boolean | null;
  rating: number | null;
  created_at: string;
  status: string | null;
}

interface ResponseDebuggerProps {
  conversationId?: string;
  messageId?: string;
}

export function ResponseDebugger({ conversationId, messageId }: ResponseDebuggerProps) {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentItems, setRecentItems] = useState<RecentFeedback[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const supabase = useSupabaseClient();

  // Load recent feedback items on mount
  useEffect(() => {
    loadRecentItems();
  }, []);

  const loadRecentItems = async () => {
    setLoadingRecent(true);
    try {
      const { data, error } = await supabase
        .from("rlhf_feedback")
        .select("id, query, user_query, feedback_type, feedback_value, created_at, status")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // console.error("Failed to load recent items:", error);
        // Silently fail - table might not exist in dev environments
      } else {
        setRecentItems(data?.map(item => ({
          id: item.id,
          query: item.query || item.user_query || "Unknown query",
          thumbs_up: item.feedback_type === 'thumbs_up' ? true : item.feedback_type === 'thumbs_down' ? false : null,
          rating: item.feedback_value?.score ?? null,
          created_at: item.created_at,
          status: item.status,
        })) || []);
      }
    } catch (error) {
      // console.error("Error loading recent items:", error);
    } finally {
      setLoadingRecent(false);
    }
  };

  const loadDebugInfo = async (msgId: string) => {
    if (!msgId) {
      toast.error("Please provide a message ID");
      return;
    }

    setLoading(true);
    setSelectedId(msgId);

    try {
      // Load feedback/metadata for this message
      const { data: feedback, error } = await supabase
        .from("rlhf_feedback")
        .select("*")
        .eq("id", msgId)
        .single();

      if (error) {
        console.error("Failed to load debug info:", error);
        toast.error("Message not found in feedback database");
        setLoading(false);
        return;
      }

      // Extract debug information from metadata
      // Using correct column names: query, retrieved_contexts, feedback_metadata
      const metadata = feedback.feedback_metadata || feedback.rag_metadata || {};

      setDebugData({
        query: feedback.query || feedback.user_query || "N/A",
        strategy: metadata.strategy || "unknown",
        retrievedDocs: feedback.retrieved_contexts || [],
        rerankedDocs: metadata.finalDocs || feedback.retrieved_contexts || [],
        agentSteps: metadata.agentTrace?.steps || [],
        confidence: metadata.confidence || 0,
        sessionHistory: metadata.sessionHistory || [],
        rlhfSignalsUsed: metadata.rlhfSignalsUsed || false,
      });

      toast.success("Debug information loaded");
      setShowRecent(false);
    } catch (error) {
      console.error("Error loading debug info:", error);
      toast.error("Failed to load debug information");
    } finally {
      setLoading(false);
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

  return (
    <Card className="h-full flex flex-col bg-card/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Activity className="h-5 w-5 text-purple-400" />
          RAG Pipeline Debugger
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Trace the full retrieval, re-ranking, and generation pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Search for message ID */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Input
              placeholder="Enter message or feedback ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowRecent(true)}
              className="bg-card/50 border-border pr-10"
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

            {/* Recent items dropdown */}
            {showRecent && recentItems.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-border text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  Recent Feedback Items
                  {loadingRecent && <RefreshCw className="h-3 w-3 animate-spin ml-auto" />}
                </div>
                {recentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSearchQuery(item.id);
                      loadDebugInfo(item.id);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border/50 last:border-0",
                      selectedId === item.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {item.thumbs_up === true && <ThumbsUp className="h-3 w-3 text-green-400" />}
                      {item.thumbs_up === false && <ThumbsDown className="h-3 w-3 text-red-400" />}
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {item.query?.substring(0, 60)}...
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTimeAgo(item.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] text-muted-foreground font-mono">{item.id.substring(0, 8)}...</code>
                      {item.rating && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          {item.rating}/5
                        </Badge>
                      )}
                      {item.status && (
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] h-4",
                            item.status === "approved" && "border-green-500/50 text-green-400",
                            item.status === "pending" && "border-yellow-500/50 text-yellow-400",
                            item.status === "rejected" && "border-red-500/50 text-red-400"
                          )}
                        >
                          {item.status}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => loadDebugInfo(searchQuery)}
            disabled={loading || !searchQuery.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Debug
              </>
            )}
          </Button>
        </div>

        {/* Debug information tabs */}
        {debugData && (
          <Tabs defaultValue="overview" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
              <TabsTrigger value="reranking">Re-ranking</TabsTrigger>
              <TabsTrigger value="agent">Agent</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  <Card className="bg-card/30 border-border">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Query Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Original Query:</span>
                        <p className="text-sm text-foreground mt-1">{debugData.query}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge
                          className={cn(
                            "text-xs",
                            debugData.strategy === "agentic"
                              ? "bg-purple-500/20 text-purple-300"
                              : debugData.strategy === "context-aware"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-muted/20 text-foreground"
                          )}
                        >
                          {debugData.strategy} RAG
                        </Badge>
                        <Badge className="text-xs bg-green-500/20 text-green-300">
                          {(debugData.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        {debugData.rlhfSignalsUsed && (
                          <Badge className="text-xs bg-orange-500/20 text-orange-300">
                            🎯 RLHF Enhanced
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/30 border-border">
                    <CardHeader>
                      <CardTitle className="text-sm text-muted-foreground">Pipeline Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Initial Documents:</span>
                        <p className="text-lg font-bold text-purple-400">
                          {debugData.retrievedDocs.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">After Re-ranking:</span>
                        <p className="text-lg font-bold text-blue-400">
                          {debugData.rerankedDocs.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Agent Steps:</span>
                        <p className="text-lg font-bold text-cyan-400">
                          {debugData.agentSteps.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">History Turns:</span>
                        <p className="text-lg font-bold text-green-400">
                          {debugData.sessionHistory.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="retrieval" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {debugData.retrievedDocs.length > 0 ? (
                    debugData.retrievedDocs.map((doc, idx) => (
                      <Card key={idx} className="bg-card/30 border-border">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-muted-foreground">
                              Document #{idx + 1}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {(doc.similarity * 100).toFixed(1)}% similar
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {doc.content?.substring(0, 200)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No retrieval data available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reranking" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {debugData.rerankedDocs.length > 0 ? (
                    debugData.rerankedDocs.map((doc, idx) => (
                      <Card key={idx} className="bg-card/30 border-border">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-muted-foreground">
                              Document #{idx + 1}
                            </CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs bg-blue-500/10">
                                Before: {(doc.originalScore * 100).toFixed(1)}%
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-purple-500/10">
                                After: {(doc.rerankScore * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {doc.content?.substring(0, 200)}...
                          </p>
                          {doc.rlhfBoost && (
                            <Badge className="mt-2 text-xs bg-orange-500/20 text-orange-300">
                              🚀 +{(doc.rlhfBoost * 100).toFixed(0)}% RLHF boost
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No re-ranking data available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agent" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {debugData.agentSteps.length > 0 ? (
                    debugData.agentSteps.map((step, idx) => (
                      <Card key={idx} className="bg-card/30 border-border">
                        <CardHeader>
                          <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-cyan-400" />
                            Step {idx + 1}: {step.action}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Reasoning:</span>
                            <p className="text-xs text-muted-foreground mt-1">{step.reasoningText}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <Badge className="ml-2 text-xs">
                              {(step.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No agent steps (standard retrieval used)</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="context" className="flex-1">
              <ScrollArea className="h-[500px]">
                <Card className="bg-card/30 border-border">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Session Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-muted-foreground overflow-x-auto">
                      {JSON.stringify(debugData.sessionHistory, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty state */}
        {!debugData && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
            <p className="text-lg mb-2">No debug session loaded</p>
            <p className="text-sm">Enter a message ID above to trace its RAG pipeline</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
