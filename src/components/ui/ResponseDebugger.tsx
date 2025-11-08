/**
 * Response Debugger Component
 * 
 * Shows full RAG pipeline trace for debugging responses
 * Part of Fix tab in Phase 5
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { ScrollArea } from "./scroll-area";
import { Input } from "./input";
import { 
  Search, 
  RefreshCw, 
  Activity, 
  GitBranch, 
  FileText, 
  Brain 
} from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

interface ResponseDebuggerProps {
  conversationId?: string;
  messageId?: string;
}

export function ResponseDebugger({ conversationId, messageId }: ResponseDebuggerProps) {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient();

  const loadDebugInfo = async (msgId: string) => {
    if (!msgId) {
      toast.error('Please provide a message ID');
      return;
    }

    setLoading(true);
    
    try {
      // Load feedback/metadata for this message
      const { data: feedback, error } = await supabase
        .from('rlhf_feedback')
        .select('*')
        .eq('id', msgId)
        .single();

      if (error) {
        console.error('Failed to load debug info:', error);
        toast.error('Message not found in feedback database');
        setLoading(false);
        return;
      }

      // Extract debug information from metadata
      const metadata = feedback.documents_marked || {};
      
      setDebugData({
        query: feedback.user_query || 'N/A',
        strategy: metadata.strategy || 'unknown',
        retrievedDocs: metadata.initialDocs || [],
        rerankedDocs: metadata.finalDocs || [],
        agentSteps: metadata.agentTrace?.steps || [],
        confidence: metadata.confidence || 0,
        sessionHistory: metadata.sessionHistory || [],
        rlhfSignalsUsed: metadata.rlhfSignalsUsed || false
      });

      toast.success('Debug information loaded');
    } catch (error) {
      console.error('Error loading debug info:', error);
      toast.error('Failed to load debug information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Activity className="h-5 w-5 text-purple-400" />
          RAG Pipeline Debugger
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Trace the full retrieval, re-ranking, and generation pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Search for message ID */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter message or feedback ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-zinc-900/50 border-zinc-800"
          />
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
                  <Card className="bg-zinc-900/30 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-300">Query Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <span className="text-xs text-zinc-500">Original Query:</span>
                        <p className="text-sm text-zinc-200 mt-1">{debugData.query}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Badge className={cn(
                          "text-xs",
                          debugData.strategy === 'agentic' ? "bg-purple-500/20 text-purple-300" :
                          debugData.strategy === 'context-aware' ? "bg-blue-500/20 text-blue-300" :
                          "bg-gray-500/20 text-gray-300"
                        )}>
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

                  <Card className="bg-zinc-900/30 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-zinc-300">Pipeline Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-zinc-500">Initial Documents:</span>
                        <p className="text-lg font-bold text-purple-400">{debugData.retrievedDocs.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500">After Re-ranking:</span>
                        <p className="text-lg font-bold text-blue-400">{debugData.rerankedDocs.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500">Agent Steps:</span>
                        <p className="text-lg font-bold text-cyan-400">{debugData.agentSteps.length}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500">History Turns:</span>
                        <p className="text-lg font-bold text-green-400">{debugData.sessionHistory.length}</p>
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
                      <Card key={idx} className="bg-zinc-900/30 border-zinc-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-zinc-300">
                              Document #{idx + 1}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs">
                              {(doc.similarity * 100).toFixed(1)}% similar
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs text-zinc-400 line-clamp-3">
                            {doc.content?.substring(0, 200)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-zinc-500 text-center py-8">No retrieval data available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="reranking" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {debugData.rerankedDocs.length > 0 ? (
                    debugData.rerankedDocs.map((doc, idx) => (
                      <Card key={idx} className="bg-zinc-900/30 border-zinc-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm text-zinc-300">
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
                          <p className="text-xs text-zinc-400 line-clamp-3">
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
                    <p className="text-zinc-500 text-center py-8">No re-ranking data available</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agent" className="flex-1">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {debugData.agentSteps.length > 0 ? (
                    debugData.agentSteps.map((step, idx) => (
                      <Card key={idx} className="bg-zinc-900/30 border-zinc-800">
                        <CardHeader>
                          <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-cyan-400" />
                            Step {idx + 1}: {step.action}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="text-xs text-zinc-500">Reasoning:</span>
                            <p className="text-xs text-zinc-300 mt-1">{step.reasoning}</p>
                          </div>
                          <div>
                            <span className="text-xs text-zinc-500">Confidence:</span>
                            <Badge className="ml-2 text-xs">
                              {(step.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 mx-auto text-zinc-600 mb-2" />
                      <p className="text-zinc-500">No agent steps (standard retrieval used)</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="context" className="flex-1">
              <ScrollArea className="h-[500px]">
                <Card className="bg-zinc-900/30 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm text-zinc-300">Session Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-zinc-400 overflow-x-auto">
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
          <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500">
            <FileText className="h-16 w-16 mb-4 text-zinc-700" />
            <p className="text-lg mb-2">No debug session loaded</p>
            <p className="text-sm">Enter a message ID above to trace its RAG pipeline</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

