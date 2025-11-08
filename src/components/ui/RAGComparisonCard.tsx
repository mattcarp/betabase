/**
 * RAG Strategy Comparison Card
 * 
 * Side-by-side comparison of basic vs advanced RAG
 * Proves the value of RLHF-enhanced retrieval
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { 
  GitCompare, 
  Play, 
  RefreshCw,
  TrendingUp,
  Clock,
  FileText,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function RAGComparisonCard() {
  const [testQuery, setTestQuery] = useState("How do I configure AOMA integration?");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    if (!testQuery.trim()) {
      toast.error('Please enter a test query');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/rag-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: testQuery })
      });

      if (!response.ok) {
        throw new Error('Comparison failed');
      }

      const data = await response.json();
      setComparison(data);
      toast.success('Comparison complete! Check the results below.');
    } catch (error) {
      console.error('Comparison error:', error);
      toast.error('Failed to run comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <GitCompare className="h-5 w-5 text-purple-400" />
          Basic vs Advanced RAG Comparison
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Side-by-side performance test - prove advanced RAG works better!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Query Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter test query..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="flex-1 bg-zinc-900/50 border-zinc-800"
          />
          <Button
            onClick={runComparison}
            disabled={loading || !testQuery.trim()}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Comparison
              </>
            )}
          </Button>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-4 mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Basic RAG */}
              <Card className="bg-zinc-900/30 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    Basic RAG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-zinc-500">Time:</span>
                    <Badge className="ml-2 bg-gray-500/20 text-gray-300">
                      <Clock className="h-3 w-3 mr-1" />
                      {comparison.basic.timeMs}ms
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Documents:</span>
                    <Badge className="ml-2 bg-gray-500/20 text-gray-300">
                      <FileText className="h-3 w-3 mr-1" />
                      {comparison.basic.documentCount}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-500 pt-2">
                    Standard vector search only
                  </div>
                </CardContent>
              </Card>

              {/* Advanced RAG */}
              <Card className="bg-zinc-900/30 border-purple-500/30 ring-1 ring-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    Advanced RAG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-zinc-500">Time:</span>
                    <Badge className={cn(
                      "ml-2",
                      comparison.advanced.timeMs < comparison.basic.timeMs 
                        ? "bg-green-500/20 text-green-300" 
                        : "bg-orange-500/20 text-orange-300"
                    )}>
                      <Clock className="h-3 w-3 mr-1" />
                      {comparison.advanced.timeMs}ms
                      {comparison.comparison.timeDifference !== 0 && (
                        <span className="ml-1">
                          ({comparison.comparison.timeDifference > 0 ? '+' : ''}
                          {comparison.comparison.timeDifferencePercent.toFixed(0)}%)
                        </span>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Documents:</span>
                    <Badge className="ml-2 bg-purple-500/20 text-purple-300">
                      <FileText className="h-3 w-3 mr-1" />
                      {comparison.advanced.documentCount}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Strategy:</span>
                    <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                      {comparison.advanced.metadata.strategy}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Confidence:</span>
                    <Badge className="ml-2 bg-green-500/20 text-green-300">
                      {Math.round(comparison.advanced.metadata.confidence * 100)}%
                    </Badge>
                  </div>
                  {comparison.advanced.metadata.agentIterations > 0 && (
                    <div>
                      <span className="text-xs text-zinc-500">Agent Steps:</span>
                      <Badge className="ml-2 bg-cyan-500/20 text-cyan-300">
                        {comparison.advanced.metadata.agentIterations}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Advantages */}
            {comparison.comparison.advancedAdvantages.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Advanced RAG Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {comparison.comparison.advancedAdvantages.map((advantage: string, idx: number) => (
                      <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-purple-400 mt-0.5">✓</span>
                        <span>{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Document Overlap Analysis */}
            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-sm text-zinc-300">Document Overlap Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Shared Documents:</span>
                    <Badge variant="outline">
                      {comparison.comparison.documentOverlap} / {comparison.basic.documentCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Overlap:</span>
                    <Badge variant="outline">
                      {comparison.comparison.documentOverlapPercent.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${comparison.comparison.documentOverlapPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {comparison.comparison.documentOverlapPercent < 50 
                      ? "Advanced RAG discovered significantly different (potentially better) documents!"
                      : comparison.comparison.documentOverlapPercent < 80
                      ? "Moderate overlap - advanced RAG refined the results"
                      : "High overlap - both strategies found similar documents"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!comparison && !loading && (
          <div className="text-center py-8 text-zinc-500">
            <GitCompare className="h-12 w-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm">Enter a query and click "Run Comparison" to test</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

