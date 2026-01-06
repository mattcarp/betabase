"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";
import { Badge } from "./badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { cn } from "../../lib/utils";
import {
  KnowledgeSourceType,
  KnowledgeSearchResponse,
  getQuerySuggestions,
  searchKnowledge,
} from "../../services/knowledgeSearchService";
import {
  Search,
  Zap,
  Target,
  GitBranch,
  BookOpen,
  ListChecks,
  Loader2,
  ExternalLink,
  Gauge,
  Filter,
} from "lucide-react";

type Strategy = "rapid" | "focused" | "comprehensive";

interface EnhancedKnowledgePanelProps {
  className?: string;
  onResultSelected?: (r: any) => void;
}

const SOURCE_OPTIONS: { label: string; value?: KnowledgeSourceType }[] = [
  { label: "All" },
  { label: "Code (Git)", value: "git" },
  { label: "Docs (Confluence)", value: "confluence" },
  { label: "JIRA", value: "jira" },
  { label: "Web (Firecrawl)", value: "firecrawl" },
];

export function EnhancedKnowledgePanel({
  className,
  onResultSelected,
}: EnhancedKnowledgePanelProps) {
  const [query, setQuery] = useState("");
  const [strategy, setStrategy] = useState<Strategy>("focused");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [threshold, setThreshold] = useState<number>(0.78);
  const [limit, setLimit] = useState<number>(8);
  const [isSearching, setIsSearching] = useState(false);
  const [resp, setResp] = useState<KnowledgeSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("search");

  const selectedSources = useMemo(() => {
    const opt = SOURCE_OPTIONS.find((o) => o.label === sourceFilter);
    return opt?.value ? [opt.value] : undefined;
  }, [sourceFilter]);

  const suggestions = useMemo(() => getQuerySuggestions(query), [query]);

  const runSearch = async (q: string) => {
    const text = q.trim();
    if (!text) return;
    setIsSearching(true);
    setError(null);
    setActiveTab("search");
    try {
      const result = await searchKnowledge(text, {
        sourceTypes: selectedSources,
        matchThreshold: threshold,
        matchCount: limit,
        timeoutMs: strategy === "rapid" ? 2000 : strategy === "focused" ? 4000 : 6000,
      });
      setResp(result);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  return (
    <Card className={cn("mac-card", "flex flex-col h-full", className)}>
      <CardHeader className="mac-card pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <CardTitle className="mac-card">Knowledge</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {strategy}
            </Badge>
            <Badge variant="outline" className="text-xs" title="Relevance threshold">
              ≥ {threshold.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Query bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="mac-input pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, docs, JIRA..."
              disabled={isSearching}
              data-test-id="enhanced-knowledge-input"
            />
          </div>
          <Button
            className="mac-button mac-button-primary"
            type="submit"
            disabled={isSearching || !query.trim()}
            data-test-id="enhanced-knowledge-search"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="text-xs mac-button mac-button-outline"
              aria-label="Source filter"
            >
              <Filter className="h-3 w-3 mr-2" /> {sourceFilter}
            </Button>
            <div className="absolute z-20 mt-2 w-48 bg-popover border rounded-md shadow-lg overflow-hidden">
              {/* Simple always-visible list to avoid adding a full dropdown dependency */}
              {SOURCE_OPTIONS.map((o) => (
                <button
                  key={o.label}
                  className={cn(
                    "w-full text-left px-4 py-2 text-xs hover:bg-muted",
                    sourceFilter === o.label && "bg-muted/60"
                  )}
                  onClick={() => setSourceFilter(o.label)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            className="mac-button mac-button-primary text-xs"
            size="sm"
            variant={strategy === "rapid" ? "default" : "outline"}
            onClick={() => setStrategy("rapid")}
          >
            <Zap className="h-3 w-3 mr-2" /> Rapid
          </Button>
          <Button
            className="mac-button mac-button-primary text-xs"
            size="sm"
            variant={strategy === "focused" ? "default" : "outline"}
            onClick={() => setStrategy("focused")}
          >
            <Target className="h-3 w-3 mr-2" /> Focused
          </Button>
          <Button
            className="mac-button mac-button-primary text-xs"
            size="sm"
            variant={strategy === "comprehensive" ? "default" : "outline"}
            onClick={() => setStrategy("comprehensive")}
          >
            <ListChecks className="h-3 w-3 mr-2" /> Comprehensive
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Input
              className="mac-input h-8 w-20 text-xs"
              type="number"
              min={0.5}
              max={0.95}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              aria-label="Relevance threshold"
            />
            <Input
              className="mac-input h-8 w-16 text-xs"
              type="number"
              min={3}
              max={25}
              step={1}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="Result limit"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Results</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>
          <TabsContent value="search" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full">
              {error && <div className="text-xs text-destructive">{error}</div>}
              {!error && !resp && (
                <div className="text-xs text-muted-foreground">
                  Try a query like "How does AOMA handle file uploads?"
                </div>
              )}
              {resp && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{resp.stats.count} results</Badge>
                    <Badge variant="outline">{resp.durationMs} ms</Badge>
                    <Badge variant="outline">{resp.usedEmbedding ? "semantic" : "keyword"}</Badge>
                    {resp.stats.sourcesCovered.map((s) => (
                      <Badge key={s} variant="outline" title="Source">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {resp.results.map((r, idx) => (
                      <div
                        key={(r.id || idx) + "-row"}
                        className="p-4 rounded-md border hover:bg-muted/40 transition-colors"
                        data-test-id="knowledge-result"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xxs">
                              {String(r.source_type || "unknown")}
                            </Badge>
                            {typeof r.similarity === "number" && (
                              <span className="text-[10px] text-muted-foreground">
                                sim {r.similarity.toFixed(3)}
                              </span>
                            )}
                          </div>
                          {r.url && (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary inline-flex items-center gap-2"
                            >
                              Open <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {r.content?.slice(0, 500)}
                          {r.content && r.content.length > 500 ? "…" : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="suggestions" className="flex-1 overflow-hidden mt-4">
            <div className="grid gap-2">
              {suggestions.map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="justify-start text-left h-auto p-4 mac-button mac-button-outline"
                  onClick={() => {
                    setQuery(s);
                    runSearch(s);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3" />
                    <span className="text-sm">{s}</span>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default EnhancedKnowledgePanel;
