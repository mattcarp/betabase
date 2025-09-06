"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  FileSearch,
  Globe,
  Database,
  Search,
  RefreshCw,
  Download,
  Upload,
  Link,
  BookOpen,
  Code,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface CrawledDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  extractedTests: string[];
  relevanceScore: number;
  lastCrawled: Date;
  status: "success" | "partial" | "failed";
  linkedTests: number;
  size: string;
}

interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: "documentation" | "api-spec" | "github" | "confluence";
  status: "active" | "paused" | "error";
  documentsCount: number;
  lastSync: Date;
  schedule: string;
}

export const FirecrawlPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDocument, setSelectedDocument] =
    useState<CrawledDocument | null>(null);
  const [crawlProgress, setCrawlProgress] = useState(0);

  const crawlSources: CrawlSource[] = [
    {
      id: "1",
      name: "API Documentation",
      url: "https://docs.api.example.com",
      type: "documentation",
      status: "active",
      documentsCount: 145,
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      schedule: "Every 6 hours",
    },
    {
      id: "2",
      name: "GitHub Repository",
      url: "https://github.com/example/repo",
      type: "github",
      status: "active",
      documentsCount: 89,
      lastSync: new Date(Date.now() - 12 * 60 * 60 * 1000),
      schedule: "Daily",
    },
    {
      id: "3",
      name: "Confluence Wiki",
      url: "https://example.atlassian.net/wiki",
      type: "confluence",
      status: "paused",
      documentsCount: 234,
      lastSync: new Date(Date.now() - 48 * 60 * 60 * 1000),
      schedule: "Weekly",
    },
    {
      id: "4",
      name: "OpenAPI Spec",
      url: "https://api.example.com/swagger.json",
      type: "api-spec",
      status: "active",
      documentsCount: 67,
      lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000),
      schedule: "On change",
    },
  ];

  const crawledDocuments: CrawledDocument[] = [
    {
      id: "1",
      url: "https://docs.api.example.com/authentication",
      title: "Authentication Guide",
      content:
        "Complete guide for implementing authentication with magic links, OAuth, and JWT tokens...",
      extractedTests: [
        "Test magic link generation",
        "Verify OAuth flow",
        "Validate JWT token expiry",
        "Check session persistence",
      ],
      relevanceScore: 95,
      lastCrawled: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "success",
      linkedTests: 12,
      size: "24 KB",
    },
    {
      id: "2",
      url: "https://docs.api.example.com/file-upload",
      title: "File Upload API",
      content:
        "API documentation for file upload endpoints including multipart form data handling...",
      extractedTests: [
        "Test file size limits",
        "Verify MIME type validation",
        "Check concurrent uploads",
        "Test progress tracking",
      ],
      relevanceScore: 88,
      lastCrawled: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: "success",
      linkedTests: 8,
      size: "18 KB",
    },
    {
      id: "3",
      url: "https://github.com/example/repo/blob/main/TESTING.md",
      title: "Testing Best Practices",
      content:
        "Repository testing guidelines including unit test patterns, integration test setup...",
      extractedTests: [
        "Unit test structure",
        "Mock service patterns",
        "Test data factories",
        "Assertion helpers",
      ],
      relevanceScore: 92,
      lastCrawled: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: "partial",
      linkedTests: 15,
      size: "32 KB",
    },
  ];

  const testPatterns = [
    { pattern: "Authentication Flow", count: 24, confidence: 95 },
    { pattern: "Error Handling", count: 18, confidence: 88 },
    { pattern: "Data Validation", count: 31, confidence: 92 },
    { pattern: "API Response Format", count: 27, confidence: 90 },
    { pattern: "Async Operations", count: 15, confidence: 85 },
  ];

  const handleStartCrawl = () => {
    setIsScanning(true);
    setCrawlProgress(0);

    const interval = setInterval(() => {
      setCrawlProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "documentation":
        return <BookOpen className="h-4 w-4" />;
      case "api-spec":
        return <Code className="h-4 w-4" />;
      case "github":
        return <Database className="h-4 w-4" />;
      case "confluence":
        return <FileSearch className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "success":
        return "border-l-4 border-l-emerald-600";
      case "paused":
      case "partial":
        return "border-l-4 border-l-amber-600";
      case "error":
      case "failed":
        return "border-l-4 border-l-rose-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search crawled documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isScanning ? "destructive" : "default"}
            onClick={handleStartCrawl}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <FileSearch className="h-4 w-4 mr-2" />
                Start Crawl
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Crawl Progress */}
      {isScanning && (
        <Card className="bg-muted/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Crawling documentation...
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {crawlProgress}%
              </span>
            </div>
            <Progress value={crawlProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Discovering test patterns and extracting relevant documentation...
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Crawl Sources */}
        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Documentation Sources</CardTitle>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-2">
                  {crawlSources.map((source) => (
                    <Card
                      key={source.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        getStatusColor(source.status),
                      )}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(source.type)}
                            <span className="font-medium text-sm">
                              {source.name}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {source.documentsCount}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {source.url}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {source.schedule}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Extracted Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Discovered Test Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testPatterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm">{pattern.pattern}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{pattern.count}</Badge>
                    <Badge
                      className={cn(
                        pattern.confidence >= 90 &&
                          "bg-green-500/20 text-green-500",
                        pattern.confidence >= 80 &&
                          pattern.confidence < 90 &&
                          "bg-yellow-500/20 text-yellow-500",
                        pattern.confidence < 80 && "bg-red-500/20 text-red-500",
                      )}
                    >
                      {pattern.confidence}%
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Crawled Documents */}
        <div className="col-span-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crawled Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="h-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Documents</TabsTrigger>
                  <TabsTrigger value="recent">Recently Updated</TabsTrigger>
                  <TabsTrigger value="relevant">Most Relevant</TabsTrigger>
                  <TabsTrigger value="linked">Linked Tests</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4 mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {crawledDocuments.map((doc) => (
                        <Card
                          key={doc.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedDocument?.id === doc.id &&
                              "ring-2 ring-primary",
                          )}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-medium">{doc.title}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {doc.url}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  doc.status === "success" &&
                                    "bg-emerald-100 text-emerald-700 border-emerald-200",
                                  doc.status === "partial" &&
                                    "bg-amber-100 text-amber-700 border-amber-200",
                                  doc.status === "failed" &&
                                    "bg-rose-100 text-rose-700 border-rose-200",
                                )}
                              >
                                {doc.status}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {doc.content}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {doc.extractedTests.length} patterns
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  <Link className="h-3 w-3 mr-1" />
                                  {doc.linkedTests} tests
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {doc.size}
                                </span>
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    doc.relevanceScore >= 90 &&
                                      "bg-emerald-100 text-emerald-700 border-emerald-200",
                                    doc.relevanceScore >= 70 &&
                                      doc.relevanceScore < 90 &&
                                      "bg-amber-100 text-amber-700 border-amber-200",
                                    doc.relevanceScore < 70 &&
                                      "bg-rose-100 text-rose-700 border-rose-200",
                                  )}
                                >
                                  {doc.relevanceScore}% relevant
                                </Badge>
                              </div>
                            </div>

                            {doc.extractedTests.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium mb-2">
                                  Extracted Test Patterns:
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {doc.extractedTests
                                    .slice(0, 3)
                                    .map((test, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {test}
                                      </Badge>
                                    ))}
                                  {doc.extractedTests.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      +{doc.extractedTests.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="recent">
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Recently updated documents will appear here
                  </div>
                </TabsContent>

                <TabsContent value="relevant">
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Most relevant documents based on your test suite
                  </div>
                </TabsContent>

                <TabsContent value="linked">
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    Documents linked to existing tests
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FirecrawlPanel;
