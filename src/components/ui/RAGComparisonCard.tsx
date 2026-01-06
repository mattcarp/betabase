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
import { GitCompare, Play, RefreshCw, TrendingUp, Clock, FileText, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

export function RAGComparisonCard() {
  const [testQuery, setTestQuery] = useState("How do I configure AOMA integration?");
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runComparison = async () => {
    if (!testQuery.trim()) {
      toast.error("Please enter a test query");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/rag-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery }),
      });

      if (!response.ok) {
        throw new Error("Comparison failed");
      }

      const data = await response.json();
      setComparison(data);
      toast.success("Comparison complete! Check the results below.");
    } catch (error) {
      console.error("Comparison error:", error);
      toast.error("Failed to run comparison");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mac-card bg-card/50 border-border">
      <CardHeader className="mac-card">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <GitCompare className="h-5 w-5 text-primary-400" />
          Basic vs Advanced RAG Comparison
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Side-by-side performance test - prove advanced RAG works better!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Query Input */}
        <div className="flex gap-2">
          <Input className="mac-input"
            placeholder="Enter test query..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            className="flex-1 bg-card/50 border-border"
          />
          <Button
            variant="teal-solid"
            onClick={runComparison}
            disabled={loading || !testQuery.trim()}
            className="gap-2"
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
              <Card className="mac-card bg-card/30 border-border">
                <CardHeader className="mac-card">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Basic RAG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Time:</span>
                    <Badge className="ml-2 bg-muted/20 text-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {comparison.basic.timeMs}ms
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Documents:</span>
                    <Badge className="ml-2 bg-muted/20 text-foreground">
                      <FileText className="h-3 w-3 mr-1" />
                      {comparison.basic.documentCount}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">Standard vector search only</div>
                </CardContent>
              </Card>

              {/* Advanced RAG */}
              <Card className="mac-card bg-card/30 border-primary-400/30 ring-1 ring-primary-400/20">
                <CardHeader className="mac-card">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary-400" />
                    Advanced RAG
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Time:</span>
                    <Badge
                      className={cn(
                        "ml-2",
                        comparison.advanced.timeMs < comparison.basic.timeMs
                          ? "bg-green-500/20 text-green-300"
                          : "bg-orange-500/20 text-orange-300"
                      )}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {comparison.advanced.timeMs}ms
                      {comparison.comparison.timeDifference !== 0 && (
                        <span className="ml-1">
                          ({comparison.comparison.timeDifference > 0 ? "+" : ""}
                          {comparison.comparison.timeDifferencePercent.toFixed(0)}%)
                        </span>
                      )}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Documents:</span>
                    <Badge className="ml-2 bg-primary-400/20 text-primary-300">
                      <FileText className="h-3 w-3 mr-1" />
                      {comparison.advanced.documentCount}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Strategy:</span>
                    <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                      {comparison.advanced.metadata.strategy}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <Badge className="ml-2 bg-green-500/20 text-green-300">
                      {Math.round(comparison.advanced.metadata.confidence * 100)}%
                    </Badge>
                  </div>
                  {comparison.advanced.metadata.agentIterations > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Agent Steps:</span>
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
              <Card className="mac-card bg-gradient-to-br from-primary-700/20 to-primary-400/10 border-primary-400/30">
                <CardHeader className="mac-card">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-400" />
                    Advanced RAG Advantages
                  </CardTitle>
                </CardHeader>
                <CardContent className="mac-card">
                  <ul className="space-y-2">
                    {comparison.comparison.advancedAdvantages.map(
                      (advantage: string, idx: number) => (
                        <li key={idx} className="text-xs text-foreground flex items-start gap-2">
                          <span className="text-primary-400 mt-0.5">✓</span>
                          <span>{advantage}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Document Overlap Analysis */}
            <Card className="mac-card bg-card/30 border-border">
              <CardHeader className="mac-card">
                <CardTitle className="text-sm text-foreground">Document Overlap Analysis</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Shared Documents:</span>
                    <Badge variant="outline">
                      {comparison.comparison.documentOverlap} / {comparison.basic.documentCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Overlap:</span>
                    <Badge variant="outline">
                      {comparison.comparison.documentOverlapPercent.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div
                      className="bg-gradient-to-r from-primary-400 to-primary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${comparison.comparison.documentOverlapPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {comparison.comparison.documentOverlapPercent < 50
                      ? "Advanced RAG discovered significantly different (potentially better) documents!"
                      : comparison.comparison.documentOverlapPercent < 80
                        ? "Moderate overlap - advanced RAG refined the results"
                        : "High overlap - both strategies found similar documents"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!comparison && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-3 text-muted" />
            <p className="text-sm">Enter a query and click "Run Comparison" to test</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
