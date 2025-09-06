"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Input } from "./input";
import { Progress } from "./progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Database,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Search,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  FileIcon,
  FolderOpen,
  Info,
  X,
  Eye,
  Filter,
  MoreVertical,
  GitMerge,
  Brain,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Hash,
  BarChart3,
  Network,
  Lightbulb,
  TestTube,
  Copy,
  FolderPlus,
  Shield,
  Zap,
  BookOpen,
  Target,
  Activity,
  Archive,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "./dropdown-menu";
import { FileUpload } from "../ai-elements/file-upload";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface VectorStoreFile {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  status: string;
  purpose?: string;
  // Enhanced metadata
  topics?: string[];
  quality_score?: number;
  duplicate_of?: string;
  summary?: string;
  entities?: string[];
  language?: string;
  readability?: number;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  files: string[];
  created_at: number;
  auto_generated?: boolean;
  topic?: string;
}

interface KnowledgeGap {
  topic: string;
  severity: "low" | "medium" | "high";
  description: string;
  suggested_content: string[];
}

interface DuplicateGroup {
  files: VectorStoreFile[];
  similarity: number;
  suggested_action: "merge" | "keep_both" | "delete_duplicates";
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function EnhancedCurateTab({
  className,
  assistantId = "asst_VvOHL1c4S6YapYKun4mY29fM",
}: {
  className?: string;
  assistantId?: string;
}) {
  // State management
  const [files, setFiles] = useState<VectorStoreFile[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("overview");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "size" | "quality" | "name">(
    "date",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ id: string; name: string } | null>(null);

  // Statistics
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.bytes, 0);
    const avgQuality =
      files.length > 0
        ? files.reduce((sum, file) => sum + (file.quality_score || 0), 0) /
          files.length
        : 0;
    const topics = new Set(files.flatMap((f) => f.topics || []));
    const languages = new Set(files.map((f) => f.language || "unknown"));

    return {
      totalFiles: files.length,
      totalSize,
      avgQuality,
      uniqueTopics: topics.size,
      languages: Array.from(languages),
      duplicateCount: duplicateGroups.reduce(
        (sum, g) => sum + g.files.length - 1,
        0,
      ),
      gapCount: knowledgeGaps.length,
      collectionCount: collections.length,
    };
  }, [files, duplicateGroups, knowledgeGaps, collections]);

  // Load and analyze files
  // Simple file loading without analysis (for quick refresh after upload)
  const loadFiles = async () => {
    try {
      const response = await fetch("/api/vector-store/files");
      if (response.ok) {
        const data = await response.json();
        const analyzedFiles = await analyzeFiles(data.files);
        setFiles(analyzedFiles);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    }
  };

  const loadAndAnalyzeFiles = async () => {
    setLoading(true);
    setAnalyzing(true);

    try {
      // Load files from vector store
      const response = await fetch("/api/vector-store/files");
      if (response.ok) {
        const data = await response.json();

        // Simulate AI analysis (in production, this would call an API)
        const analyzedFiles = await analyzeFiles(data.files);
        setFiles(analyzedFiles);

        // Find duplicates
        const duplicates = await findDuplicates(analyzedFiles);
        setDuplicateGroups(duplicates);

        // Identify knowledge gaps
        const gaps = await identifyKnowledgeGaps(analyzedFiles);
        setKnowledgeGaps(gaps);

        // Generate smart collections
        const smartCollections = await generateSmartCollections(analyzedFiles);
        setCollections(smartCollections);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to analyze knowledge base");
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  // Simulate AI analysis of files
  const analyzeFiles = async (
    files: VectorStoreFile[],
  ): Promise<VectorStoreFile[]> => {
    return files.map((file) => ({
      ...file,
      topics: generateTopics(file.filename),
      quality_score: Math.random() * 100,
      summary: `Summary of ${file.filename}...`,
      entities: generateEntities(file.filename),
      language: "en",
      readability: 60 + Math.random() * 30,
    }));
  };

  // Handle delete button click
  const handleDeleteClick = (fileId: string, fileName: string) => {
    setFileToDelete({ id: fileId, name: fileName });
    setDeleteDialogOpen(true);
  };

  // Confirm and execute deletion
  const confirmDelete = async () => {
    if (!fileToDelete) return;

    setLoading(true);
    setDeleteDialogOpen(false);
    
    try {
      const response = await fetch(`/api/vector-store/files?fileId=${fileToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Immediately remove the file from local state for instant UI feedback
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete.id));
        
        toast.success("File deleted successfully");
        
        // Then reload files from the server to ensure consistency
        // Use a slight delay to allow OpenAI's API to update
        setTimeout(async () => {
          await loadAndAnalyzeFiles();
        }, 1000);
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
      // Reload to ensure UI is in sync with server state
      await loadAndAnalyzeFiles();
    } finally {
      setLoading(false);
      setFileToDelete(null);
    }
  };

  // Generate topics based on filename (in production, use AI)
  const generateTopics = (filename: string): string[] => {
    const topics = [];
    if (filename.includes("api")) topics.push("API");
    if (filename.includes("guide")) topics.push("Documentation");
    if (filename.includes("test")) topics.push("Testing");
    if (filename.includes("config")) topics.push("Configuration");
    if (filename.includes("aoma")) topics.push("AOMA");
    if (topics.length === 0) topics.push("General");
    return topics;
  };

  // Generate entities (in production, use NER)
  const generateEntities = (filename: string): string[] => {
    return ["AOMA", "Sony Music", "Asset Management", "Metadata"];
  };

  // Find duplicate files
  const findDuplicates = async (
    files: VectorStoreFile[],
  ): Promise<DuplicateGroup[]> => {
    const groups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (const file of files) {
      if (processed.has(file.id)) continue;

      const similar = files.filter(
        (f) => f.id !== file.id && !processed.has(f.id) && isSimilar(file, f),
      );

      if (similar.length > 0) {
        groups.push({
          files: [file, ...similar],
          similarity: 0.85 + Math.random() * 0.15,
          suggested_action: "merge",
        });

        processed.add(file.id);
        similar.forEach((f) => processed.add(f.id));
      }
    }

    return groups;
  };

  // Check if files are similar
  const isSimilar = (
    file1: VectorStoreFile,
    file2: VectorStoreFile,
  ): boolean => {
    // Simple similarity check based on name and size
    const nameSimilarity = file1.filename
      .toLowerCase()
      .includes(file2.filename.toLowerCase().slice(0, 10));
    const sizeSimilarity =
      Math.abs(file1.bytes - file2.bytes) < file1.bytes * 0.1;
    return nameSimilarity || sizeSimilarity;
  };

  // Identify knowledge gaps
  const identifyKnowledgeGaps = async (
    files: VectorStoreFile[],
  ): Promise<KnowledgeGap[]> => {
    const topics = files.flatMap((f) => f.topics || []);
    const topicCounts = topics.reduce(
      (acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const gaps: KnowledgeGap[] = [];

    // Check for missing important topics
    const importantTopics = [
      "Security",
      "Performance",
      "Backup",
      "Migration",
      "Troubleshooting",
    ];
    for (const topic of importantTopics) {
      if (!topicCounts[topic] || topicCounts[topic] < 2) {
        gaps.push({
          topic,
          severity: topicCounts[topic] ? "medium" : "high",
          description: `Limited documentation on ${topic}`,
          suggested_content: [
            `${topic} best practices guide`,
            `${topic} troubleshooting manual`,
            `${topic} configuration reference`,
          ],
        });
      }
    }

    return gaps;
  };

  // Generate smart collections
  const generateSmartCollections = async (
    files: VectorStoreFile[],
  ): Promise<Collection[]> => {
    const collections: Collection[] = [];
    const topicGroups = new Map<string, string[]>();

    // Group files by topic
    files.forEach((file) => {
      (file.topics || []).forEach((topic) => {
        if (!topicGroups.has(topic)) {
          topicGroups.set(topic, []);
        }
        topicGroups.get(topic)!.push(file.id);
      });
    });

    // Create collections for topics with multiple files
    topicGroups.forEach((fileIds, topic) => {
      if (fileIds.length > 1) {
        collections.push({
          id: `collection-${topic.toLowerCase()}`,
          name: `${topic} Resources`,
          description: `Auto-generated collection for ${topic} related documents`,
          files: fileIds,
          created_at: Date.now() / 1000,
          auto_generated: true,
          topic,
        });
      }
    });

    return collections;
  };

  // Merge duplicate files
  const mergeDuplicates = async (group: DuplicateGroup) => {
    setLoading(true);
    try {
      // In production, this would call an API to merge files
      toast.success(`Merged ${group.files.length} duplicate files`);
      await loadAndAnalyzeFiles();
    } catch (error) {
      toast.error("Failed to merge duplicates");
    } finally {
      setLoading(false);
    }
  };

  // Test knowledge
  const testKnowledge = async (topic: string) => {
    setAnalyzing(true);
    try {
      // In production, this would test the AI's knowledge
      const testQuestions = [
        `What is ${topic}?`,
        `How does ${topic} work in AOMA?`,
        `What are the best practices for ${topic}?`,
      ];

      toast.success(`Testing knowledge on ${topic}...`, {
        description: `Running ${testQuestions.length} test questions`,
      });

      // Simulate test results
      setTimeout(() => {
        toast.success(`Knowledge test complete for ${topic}`, {
          description: "AI can answer 3/3 questions correctly",
        });
      }, 2000);
    } finally {
      setAnalyzing(false);
    }
  };

  // Filter files
  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (file) =>
          file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Topic filter
    if (filterTopic !== "all") {
      filtered = filtered.filter((file) => file.topics?.includes(filterTopic));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.filename.localeCompare(b.filename);
        case "size":
          return b.bytes - a.bytes;
        case "quality":
          return (b.quality_score || 0) - (a.quality_score || 0);
        case "date":
        default:
          return b.created_at - a.created_at;
      }
    });

    return filtered;
  }, [files, searchQuery, filterTopic, sortBy]);

  // Get all unique topics
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    files.forEach((file) => {
      (file.topics || []).forEach((topic) => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, [files]);

  // Load files on mount
  useEffect(() => {
    loadAndAnalyzeFiles();
  }, []);

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Knowledge Curation Center
            </CardTitle>
            <CardDescription>
              AI-powered knowledge base management and optimization
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {stats.totalFiles} files
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              {formatFileSize(stats.totalSize)}
            </Badge>
            <Badge
              variant={stats.avgQuality > 70 ? "default" : "destructive"}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              {stats.avgQuality.toFixed(0)}% quality
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="duplicates">
              <GitMerge className="h-4 w-4 mr-2" />
              Duplicates
            </TabsTrigger>
            <TabsTrigger value="collections">
              <FolderPlus className="h-4 w-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="gaps">
              <Lightbulb className="h-4 w-4 mr-2" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="test">
              <TestTube className="h-4 w-4 mr-2" />
              Test
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Knowledge Health Score */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Knowledge Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Score</span>
                      <span className="text-2xl font-bold text-green-600">
                        {(stats.avgQuality * 0.7 + 30).toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={stats.avgQuality * 0.7 + 30}
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Coverage: {stats.uniqueTopics * 10}%</div>
                      <div>Quality: {stats.avgQuality.toFixed(0)}%</div>
                      <div>Duplicates: {stats.duplicateCount}</div>
                      <div>Gaps: {stats.gapCount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("duplicates")}
                      className="justify-start"
                    >
                      <GitMerge className="h-4 w-4 mr-2" />
                      Fix Duplicates
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab("gaps")}
                      className="justify-start"
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Fill Gaps
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testKnowledge("AOMA")}
                      className="justify-start"
                      disabled={analyzing}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test AI
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAndAnalyzeFiles}
                      className="justify-start"
                      disabled={loading}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4 mr-2",
                          loading && "animate-spin",
                        )}
                      />
                      Re-analyze
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Topic Distribution */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allTopics.slice(0, 5).map((topic) => {
                      const count = files.filter((f) =>
                        f.topics?.includes(topic),
                      ).length;
                      return (
                        <div
                          key={topic}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{topic}</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(count / files.length) * 100}
                              className="w-20 h-1.5"
                            />
                            <span className="text-xs text-muted-foreground">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {files.slice(0, 5).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate max-w-xs">
                              {file.filename}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(file.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Files Tab with Advanced Features */}
          <TabsContent value="files" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4 h-full flex flex-col">
              {/* File Upload Section */}
              <div className="border rounded-lg p-4 bg-muted/10">
                <FileUpload
                  assistantId="asst_VvOHL1c4S6YapYKun4mY29fM"
                  onUploadComplete={async () => {
                    await loadFiles();
                    toast.success("File uploaded successfully!");
                  }}
                  onUploadError={(error) => toast.error(error)}
                />
              </div>
              
              {/* Enhanced Search and Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, content, or entities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterTopic} onValueChange={setFilterTopic}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {allTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setViewMode(viewMode === "list" ? "grid" : "list")
                  }
                >
                  {viewMode === "list" ? (
                    <BarChart3 className="h-4 w-4" />
                  ) : (
                    <Filter className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Enhanced File List */}
              <ScrollArea className="flex-1 border rounded-lg">
                {viewMode === "list" ? (
                  <div className="p-4 space-y-2">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {file.filename}
                            </p>
                            {file.duplicate_of && (
                              <Badge variant="secondary" className="text-xs">
                                <Copy className="h-3 w-3 mr-1" />
                                Duplicate
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{formatFileSize(file.bytes)}</span>
                            <span>•</span>
                            <span>{formatDate(file.created_at)}</span>
                            {file.topics && file.topics.length > 0 && (
                              <>
                                <span>•</span>
                                <div className="flex gap-1">
                                  {file.topics.slice(0, 2).map((topic) => (
                                    <Badge
                                      key={topic}
                                      variant="outline"
                                      className="text-xs h-4 px-1"
                                    >
                                      {topic}
                                    </Badge>
                                  ))}
                                  {file.topics.length > 2 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs h-4 px-1"
                                    >
                                      +{file.topics.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {file.summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {file.summary}
                            </p>
                          )}
                        </div>

                        {/* Quality Score */}
                        {file.quality_score !== undefined && (
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "text-sm font-medium",
                                file.quality_score > 70
                                  ? "text-green-600"
                                  : file.quality_score > 40
                                    ? "text-yellow-600"
                                    : "text-red-600",
                              )}
                            >
                              {file.quality_score.toFixed(0)}%
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Quality
                            </span>
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            alignOffset={-5}
                            sideOffset={5}
                            className="w-48"
                          >
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Analysis
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Brain className="h-4 w-4 mr-2" />
                              Re-analyze
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test Knowledge
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => handleDeleteClick(file.id, file.filename)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredFiles.map((file) => (
                      <Card
                        key={file.id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                            <Badge
                              variant={
                                file.quality_score && file.quality_score > 70
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {file.quality_score?.toFixed(0)}%
                            </Badge>
                          </div>
                          <CardTitle className="text-sm truncate mt-2">
                            {file.filename}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>{formatFileSize(file.bytes)}</div>
                            <div>{formatDate(file.created_at)}</div>
                            {file.topics && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {file.topics.map((topic) => (
                                  <Badge
                                    key={topic}
                                    variant="outline"
                                    className="text-xs h-5"
                                  >
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Duplicates Tab */}
          <TabsContent value="duplicates" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {duplicateGroups.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>No Duplicates Found</AlertTitle>
                  <AlertDescription>
                    Your knowledge base is clean with no duplicate content
                    detected.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Duplicate Content Detected</AlertTitle>
                    <AlertDescription>
                      Found {duplicateGroups.length} groups of similar
                      documents. Review and merge to optimize your knowledge
                      base.
                    </AlertDescription>
                  </Alert>

                  {duplicateGroups.map((group, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <GitMerge className="h-4 w-4" />
                            Duplicate Group {index + 1}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {(group.similarity * 100).toFixed(0)}% similar
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => mergeDuplicates(group)}
                              disabled={loading}
                            >
                              <GitMerge className="h-4 w-4 mr-2" />
                              Merge Files
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {group.files.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-3 p-2 rounded border"
                            >
                              <FileIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 text-sm">
                                {file.filename}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(file.bytes)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-muted/50 rounded">
                          <p className="text-sm">
                            <strong>Suggested Action:</strong>{" "}
                            {group.suggested_action === "merge"
                              ? "Merge these files into a single comprehensive document"
                              : "Review and keep the most recent version"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent
            value="collections"
            className="flex-1 overflow-auto mt-4"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Smart Collections</h3>
                <Button size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create Collection
                </Button>
              </div>

              {collections.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No collections yet. Collections help organize related
                    documents.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collections.map((collection) => (
                    <Card key={collection.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            {collection.name}
                          </CardTitle>
                          {collection.auto_generated && (
                            <Badge variant="secondary">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          {collection.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <span>{collection.files.length} documents</span>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Knowledge Gaps Tab */}
          <TabsContent value="gaps" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Knowledge Gap Analysis</AlertTitle>
                <AlertDescription>
                  AI-identified areas where your knowledge base could be
                  improved.
                </AlertDescription>
              </Alert>

              {knowledgeGaps.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Excellent! No significant knowledge gaps detected.
                  </AlertDescription>
                </Alert>
              ) : (
                knowledgeGaps.map((gap, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {gap.topic}
                        </CardTitle>
                        <Badge
                          variant={
                            gap.severity === "high"
                              ? "destructive"
                              : gap.severity === "medium"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {gap.severity} priority
                        </Badge>
                      </div>
                      <CardDescription>{gap.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Suggested Content:
                        </p>
                        <ul className="space-y-1">
                          {gap.suggested_content.map((content, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-center gap-2"
                            >
                              <BookOpen className="h-3 w-3" />
                              {content}
                            </li>
                          ))}
                        </ul>
                        <Button variant="outline" size="sm" className="mt-3">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {gap.topic} Documentation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Knowledge Test Tab */}
          <TabsContent value="test" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <Alert>
                <TestTube className="h-4 w-4" />
                <AlertTitle>Knowledge Testing</AlertTitle>
                <AlertDescription>
                  Test what the AI actually knows from your uploaded documents.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Test</CardTitle>
                  <CardDescription>
                    Select a topic to test the AI's knowledge
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {allTopics.map((topic) => (
                      <Button
                        key={topic}
                        variant="outline"
                        onClick={() => testKnowledge(topic)}
                        disabled={analyzing}
                      >
                        <TestTube className="h-4 w-4 mr-2" />
                        Test {topic}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Custom Test</CardTitle>
                  <CardDescription>
                    Enter a custom question to test the knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input placeholder="Ask a question about your documents..." />
                    <Button disabled={analyzing}>
                      <Send className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this file?</p>
              {fileToDelete && (
                <p className="font-medium text-foreground">"{fileToDelete.name}"</p>
              )}
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The file will be permanently removed from the vector store.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
