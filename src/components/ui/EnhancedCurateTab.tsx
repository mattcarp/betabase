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
  BarChart as BarChartIcon, // Aliased to avoid conflict with Recharts BarChart
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
  Users,
  Award,
  Trophy,
  GitBranch,
  ChevronRight,
  DollarSign,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
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
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Area as RechartsArea,
  AreaChart as RechartsAreaChart,
  ComposedChart,
} from "recharts";

interface VectorStoreFile {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  status: string;
  purpose?: string;
  // Enhanced metadata for curation
  topics?: string[];
  quality_score?: number;
  duplicate_of?: string;
  summary?: string;
  entities?: string[];
  language?: string;
  readability?: number;
  last_accessed?: number;
  access_count?: number;
  curator?: string;
  business_value?: number;
  compliance_status?: "compliant" | "review_needed" | "non_compliant";
  retention_date?: number;
}

interface CurationInsight {
  type: "duplicate" | "outdated" | "conflicting" | "gap" | "high-value" | "compliance";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  affectedFiles: string[];
  suggestedAction: string;
  potentialSavings?: number;
  riskScore?: number;
}

interface CuratorPerformance {
  name: string;
  filesProcessed: number;
  qualityScore: number;
  duplicatesFound: number;
  metadataEnriched: number;
  valueGenerated: number;
  badge?: "rookie" | "expert" | "champion" | "master";
  department?: string;
  lastActive?: Date;
}

interface KnowledgeHealth {
  category: string;
  health: number;
  documents: number;
  coverage: number;
  lastUpdated: Date;
  trend: "up" | "down" | "stable";
}

interface CurationTrend {
  period: string;
  uploaded: number;
  curated: number;
  deleted: number;
  quality: number;
  roi: number;
  savings: number;
}

// Stub data for executive dashboard
const executiveMetrics = {
  totalValue: 2340000,
  monthlySavings: 45000,
  complianceScore: 94,
  knowledgeUtilization: 78,
  curationVelocity: 120,
  duplicateReduction: 23,
};

const stubCuratorPerformance: CuratorPerformance[] = [
  { 
    name: "Sarah Chen", 
    filesProcessed: 342, 
    qualityScore: 94, 
    duplicatesFound: 87, 
    metadataEnriched: 298,
    valueGenerated: 125000,
    badge: "master",
    department: "Legal",
    lastActive: new Date()
  },
  { 
    name: "Marcus Johnson", 
    filesProcessed: 298, 
    qualityScore: 87, 
    duplicatesFound: 62, 
    metadataEnriched: 241,
    valueGenerated: 98000,
    badge: "champion",
    department: "A&R",
    lastActive: new Date()
  },
  { 
    name: "Emily Rodriguez", 
    filesProcessed: 156, 
    qualityScore: 91, 
    duplicatesFound: 31, 
    metadataEnriched: 142,
    valueGenerated: 67000,
    badge: "expert",
    department: "Marketing",
    lastActive: new Date()
  },
  { 
    name: "David Kim", 
    filesProcessed: 89, 
    qualityScore: 85, 
    duplicatesFound: 15, 
    metadataEnriched: 76,
    valueGenerated: 34000,
    badge: "rookie",
    department: "Finance",
    lastActive: new Date()
  },
];

const stubKnowledgeHealth: KnowledgeHealth[] = [
  { category: "Contracts", health: 85, documents: 1240, coverage: 92, lastUpdated: new Date(), trend: "up" },
  { category: "Artist Info", health: 92, documents: 3421, coverage: 88, lastUpdated: new Date(), trend: "stable" },
  { category: "Financials", health: 78, documents: 892, coverage: 71, lastUpdated: new Date(), trend: "down" },
  { category: "Marketing", health: 65, documents: 567, coverage: 58, lastUpdated: new Date(), trend: "down" },
  { category: "Compliance", health: 71, documents: 234, coverage: 64, lastUpdated: new Date(), trend: "up" },
  { category: "Catalog", health: 88, documents: 4567, coverage: 95, lastUpdated: new Date(), trend: "up" },
];

const stubCurationTrends: CurationTrend[] = [
  { period: "Jan", uploaded: 120, curated: 98, deleted: 15, quality: 82, roi: 2.1, savings: 12000 },
  { period: "Feb", uploaded: 145, curated: 132, deleted: 22, quality: 85, roi: 2.4, savings: 15000 },
  { period: "Mar", uploaded: 98, curated: 95, deleted: 8, quality: 88, roi: 2.8, savings: 18000 },
  { period: "Apr", uploaded: 167, curated: 155, deleted: 31, quality: 91, roi: 3.2, savings: 24000 },
  { period: "May", uploaded: 134, curated: 128, deleted: 19, quality: 94, roi: 3.5, savings: 28000 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

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

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function EnhancedCurateTab({
  className,
  assistantId = "asst_VvOHL1c4S6YapYKun4mY29fM",
}: {
  className?: string;
  assistantId?: string;
}) {
  // State management
  const [mounted, setMounted] = useState(false);
  const [files, setFiles] = useState<VectorStoreFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "size" | "quality" | "name">("date");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<CurationInsight | null>(null);

  // Ensure client-side rendering for Recharts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Stub insights
  const insights: CurationInsight[] = [
    {
      type: "duplicate",
      severity: "high",
      title: "23 Duplicate Contract Templates",
      description: "Multiple versions of standard recording contracts detected",
      affectedFiles: ["Contract_v1.pdf", "Contract_final.pdf", "Contract_FINAL2.pdf"],
      suggestedAction: "Merge into single authoritative template library",
      potentialSavings: 45000,
      riskScore: 75
    },
    {
      type: "compliance",
      severity: "critical",
      title: "GDPR Compliance Documents Outdated",
      description: "Privacy policies haven't been updated for new EU regulations",
      affectedFiles: ["Privacy_Policy_2023.pdf"],
      suggestedAction: "Urgent: Update with latest GDPR requirements",
      riskScore: 95
    },
    {
      type: "high-value",
      severity: "low",
      title: "High-Impact Catalog Metadata",
      description: "Master recordings catalog showing 5x average usage",
      affectedFiles: ["Master_Catalog_2024.xlsx"],
      suggestedAction: "Promote to featured knowledge base",
      potentialSavings: -120000 // Negative means value generated
    },
    {
      type: "gap",
      severity: "medium",
      title: "Missing Streaming Platform Guidelines",
      description: "No documentation for Spotify, Apple Music submission processes",
      affectedFiles: [],
      suggestedAction: "Create streaming platform playbooks",
      riskScore: 60
    }
  ];

  // Statistics with executive metrics
  const stats = useMemo(() => {
    const totalSize = files.reduce((sum, file) => sum + file.bytes, 0);
    const avgQuality = files.length > 0
      ? files.reduce((sum, file) => sum + (file.quality_score || 0), 0) / files.length
      : 0;
    const topics = new Set(files.flatMap((f) => f.topics || []));
    
    return {
      totalFiles: files.length,
      totalSize,
      avgQuality,
      uniqueTopics: topics.size,
      duplicateCount: Math.floor(files.length * 0.15),
      complianceIssues: 3,
      knowledgeGaps: 7,
      curatorCount: stubCuratorPerformance.length,
      monthlyROI: 3.2,
      totalValueGenerated: executiveMetrics.totalValue,
    };
  }, [files]);

  // Load files from vector store
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vector-store/files");
      if (response.ok) {
        const data = await response.json();
        // Enhance files with stub metadata
        const enhancedFiles = (data.files || []).map((file: VectorStoreFile) => ({
          ...file,
          quality_score: 60 + Math.random() * 40,
          topics: generateTopics(file.filename),
          entities: ["Sony Music", "AOMA", "Contract"],
          access_count: Math.floor(Math.random() * 100),
          curator: stubCuratorPerformance[Math.floor(Math.random() * 4)].name,
          business_value: Math.floor(Math.random() * 50000),
          compliance_status: Math.random() > 0.8 ? "review_needed" : "compliant",
        }));
        setFiles(enhancedFiles);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  // Generate topics based on filename
  const generateTopics = (filename: string): string[] => {
    const topics = [];
    if (filename.toLowerCase().includes("contract")) topics.push("Contracts");
    if (filename.toLowerCase().includes("artist")) topics.push("Artist Info");
    if (filename.toLowerCase().includes("finance")) topics.push("Financials");
    if (filename.toLowerCase().includes("catalog")) topics.push("Catalog");
    if (topics.length === 0) topics.push("General");
    return topics;
  };

  // Smart deduplication
  const runSmartDeduplication = async () => {
    setAnalyzing(true);
    toast.info("Running AI-powered semantic deduplication...");
    setTimeout(() => {
      toast.success("Found 23 duplicate groups. Potential savings: $45,000/year");
      setAnalyzing(false);
    }, 2000);
  };

  // Auto-tag and enrich
  const autoEnrichContent = async () => {
    setAnalyzing(true);
    toast.info("Extracting entities and generating smart tags...");
    setTimeout(() => {
      toast.success("Enriched 156 documents with 42 unique tags");
      setAnalyzing(false);
    }, 1500);
  };

  // Delete files
  const confirmDeleteFiles = (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    setFilesToDelete(fileIds);
    setDeleteDialogOpen(true);
  };

  const deleteFiles = async () => {
    if (filesToDelete.length === 0) return;
    
    setDeleteDialogOpen(false);
    setLoading(true);
    let successCount = 0;

    for (const fileId of filesToDelete) {
      try {
        const response = await fetch(`/api/vector-store/files?fileId=${fileId}`, {
          method: "DELETE",
        });
        if (response.ok) successCount++;
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} file(s)`);
      setSelectedFiles(new Set());
      await loadFiles();
    } else {
      toast.error("Failed to delete files");
    }

    setFilesToDelete([]);
    setLoading(false);
  };

  // Filter files
  const filteredFiles = useMemo(() => {
    let filtered = files;
    
    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterTopic !== "all") {
      filtered = filtered.filter(file => file.topics?.includes(filterTopic));
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.filename.localeCompare(b.filename);
        case "size": return b.bytes - a.bytes;
        case "quality": return (b.quality_score || 0) - (a.quality_score || 0);
        default: return b.created_at - a.created_at;
      }
    });
    
    return filtered;
  }, [files, searchQuery, filterTopic, sortBy]);

  // Get unique topics
  const allTopics = useMemo(() => {
    const topics = new Set<string>();
    files.forEach(file => {
      (file.topics || []).forEach(topic => topics.add(topic));
    });
    return Array.from(topics).sort();
  }, [files]);

  // Toggle file selection
  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  // Select all files
  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Prevent SSR rendering of Recharts - render loading state until mounted
  if (!mounted) {
    return (
      <div className={cn("h-full flex items-center justify-center", className)}>
        <p className="text-muted-foreground">Loading curate interface...</p>
      </div>
    );
  }

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
              Executive dashboard for knowledge management & curator performance
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
            <Badge className="flex items-center gap-1 bg-green-600">
              <TrendingUp className="h-3 w-3" />
              {stats.avgQuality.toFixed(0)}% Quality
            </Badge>
            <Badge className="flex items-center gap-1 bg-blue-600">
              <DollarSign className="h-3 w-3" />
              {stats.monthlyROI}x ROI
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="curators">
              <Users className="h-4 w-4 mr-2" />
              Curators
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Executive Dashboard - "Evil Charts" */}
          <TabsContent value="dashboard" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {/* Executive KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Knowledge ROI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">3.5x</span>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(executiveMetrics.totalValue)} generated
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Monthly Savings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatCurrency(executiveMetrics.monthlySavings)}
                      </span>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      From deduplication & optimization
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Compliance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{executiveMetrics.complianceScore}%</span>
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <Progress value={executiveMetrics.complianceScore} className="mt-2 h-1" />
                    <p className="text-xs text-muted-foreground mt-1">3 issues need review</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Curation Velocity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{executiveMetrics.curationVelocity}</span>
                      <Activity className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Files/week processed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Value Generation Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Value Generation & Cost Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart data={stubCurationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <RechartsArea
                        yAxisId="left"
                        type="monotone"
                        dataKey="savings"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                        name="Monthly Savings"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="roi"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="ROI Multiple"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Knowledge Health Heatmap */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Knowledge Health by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsBarChart data={stubKnowledgeHealth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="health" name="Health Score">
                          {stubKnowledgeHealth.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.health > 80 ? '#10b981' : entry.health > 60 ? '#f59e0b' : '#ef4444'} 
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Curation Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Curation Activity Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsLineChart data={stubCurationTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="uploaded" stroke="#8884d8" name="Uploaded" />
                        <Line type="monotone" dataKey="curated" stroke="#82ca9d" name="Curated" />
                        <Line type="monotone" dataKey="quality" stroke="#ffc658" name="Quality %" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions for Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Executive Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" className="justify-start" onClick={runSmartDeduplication}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Smart Dedup
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={autoEnrichContent}>
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-Enrich
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Map Relations
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Compliance Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Files Tab - Preserved with Enhancements */}
          <TabsContent value="files" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4 h-full flex flex-col">
              {/* Upload Section */}
              <div className="border rounded-lg p-4 bg-muted/10">
                <FileUpload
                  assistantId={assistantId}
                  onUploadComplete={async () => {
                    await loadFiles();
                    toast.success("File uploaded and AI-analyzed!");
                  }}
                  onUploadError={(error) => toast.error(error)}
                />
              </div>

              {/* Search and Actions Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
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
                    {allTopics.map(topic => (
                      <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={loadFiles} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
                {selectedFiles.size > 0 && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDeleteFiles(Array.from(selectedFiles))}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete ({selectedFiles.size})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFiles(new Set())}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Files List */}
              <ScrollArea className="flex-1 border rounded-lg">
                {loading && filteredFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2" />
                    <p>No files found</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {/* Select All */}
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onChange={selectAllFiles}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-muted-foreground">
                        Select all ({filteredFiles.length})
                      </span>
                    </div>

                    {/* File Items */}
                    {filteredFiles.map(file => (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50",
                          selectedFiles.has(file.id) && "bg-muted/50 border-primary/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="rounded border-gray-300"
                        />

                        <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{file.filename}</p>
                            {file.compliance_status === "review_needed" && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Review
                              </Badge>
                            )}
                            {file.business_value && file.business_value > 10000 && (
                              <Badge className="text-xs bg-green-600">
                                <DollarSign className="h-3 w-3 mr-1" />
                                High Value
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.bytes)}</span>
                            <span>•</span>
                            <span>{formatDate(file.created_at)}</span>
                            <span>•</span>
                            <span>Quality: {file.quality_score?.toFixed(0)}%</span>
                            {file.curator && (
                              <>
                                <span>•</span>
                                <span>Curator: {file.curator}</span>
                              </>
                            )}
                          </div>
                          {file.topics && file.topics.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {file.topics.map(topic => (
                                <Badge key={topic} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Brain className="h-4 w-4 mr-2" />
                              AI Analysis
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => confirmDeleteFiles([file.id])}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI-Powered Curation Insights</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-analyze
                </Button>
              </div>

              {insights.map((insight, index) => (
                <Card
                  key={index}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg",
                    insight.severity === "critical" && "border-red-500",
                    insight.severity === "high" && "border-orange-500"
                  )}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {insight.type === "duplicate" && <Copy className="h-5 w-5 mt-0.5 text-orange-600" />}
                        {insight.type === "compliance" && <Shield className="h-5 w-5 mt-0.5 text-red-600" />}
                        {insight.type === "high-value" && <Award className="h-5 w-5 mt-0.5 text-green-600" />}
                        {insight.type === "gap" && <AlertTriangle className="h-5 w-5 mt-0.5 text-yellow-600" />}
                        <div className="flex-1">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <CardDescription className="mt-1">{insight.description}</CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          insight.severity === "critical" ? "destructive" :
                          insight.severity === "high" ? "default" :
                          "secondary"
                        }
                      >
                        {insight.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm">
                        {insight.potentialSavings && (
                          <span className={cn(
                            "font-medium",
                            insight.potentialSavings > 0 ? "text-green-600" : "text-blue-600"
                          )}>
                            {insight.potentialSavings > 0 ? 'Save: ' : 'Generate: '}
                            {formatCurrency(Math.abs(insight.potentialSavings))}
                          </span>
                        )}
                        {insight.riskScore && (
                          <span className="text-muted-foreground">
                            Risk: {insight.riskScore}%
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Take Action
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Knowledge Curators Tab */}
          <TabsContent value="curators" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Knowledge Curator Leaderboard</h3>
                <div className="flex gap-2">
                  <Badge variant="outline">May 2024</Badge>
                  <Button variant="outline" size="sm">
                    <Award className="h-4 w-4 mr-2" />
                    Award Monthly Badges
                  </Button>
                </div>
              </div>

              {/* Curator Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stubCuratorPerformance.map((curator, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {curator.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <CardTitle className="text-base">{curator.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{curator.department}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {curator.badge === "master" && (
                                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                                  <Award className="h-3 w-3 mr-1" />
                                  Master Curator
                                </Badge>
                              )}
                              {curator.badge === "champion" && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Champion
                                </Badge>
                              )}
                              {curator.badge === "expert" && (
                                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
                                  <Target className="h-3 w-3 mr-1" />
                                  Expert
                                </Badge>
                              )}
                              {curator.badge === "rookie" && (
                                <Badge className="bg-gradient-to-r from-green-500 to-teal-500">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Rising Star
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(curator.valueGenerated)}
                          </p>
                          <p className="text-xs text-muted-foreground">Value Generated</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-lg font-semibold">{curator.filesProcessed}</p>
                          <p className="text-xs text-muted-foreground">Files</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{curator.qualityScore}%</p>
                          <p className="text-xs text-muted-foreground">Quality</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{curator.duplicatesFound}</p>
                          <p className="text-xs text-muted-foreground">Deduped</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{curator.metadataEnriched}</p>
                          <p className="text-xs text-muted-foreground">Enriched</p>
                        </div>
                      </div>
                      <Progress value={curator.qualityScore} className="mt-3 h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Active today at {curator.lastActive?.toLocaleTimeString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Team Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Team Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={[
                      { metric: 'Speed', value: 87 },
                      { metric: 'Accuracy', value: 92 },
                      { metric: 'Coverage', value: 78 },
                      { metric: 'Quality', value: 85 },
                      { metric: 'Collaboration', value: 94 },
                      { metric: 'Innovation', value: 81 },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="Team Average" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Knowledge Base Analytics</h3>
              
              {/* Content Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <RechartsPieChart>
                        <Pie
                          data={stubKnowledgeHealth}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, documents }) => `${category}: ${documents}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="documents"
                        >
                          {stubKnowledgeHealth.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Knowledge Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stubKnowledgeHealth.map(category => (
                        <div key={category.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category.category}</span>
                            <span className="text-muted-foreground">{category.coverage}%</span>
                          </div>
                          <Progress value={category.coverage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Utilization Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Knowledge Utilization Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsAreaChart data={stubCurationTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <RechartsArea type="monotone" dataKey="uploaded" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <RechartsArea type="monotone" dataKey="curated" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      <RechartsArea type="monotone" dataKey="deleted" stackId="1" stroke="#ffc658" fill="#ffc658" />
                    </RechartsAreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4">
              <FileUpload
                assistantId={assistantId}
                onUploadComplete={async () => {
                  await loadFiles();
                  toast.success("File uploaded and AI-processed!");
                }}
                onUploadError={(error) => toast.error(error)}
              />

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertTitle>AI-Powered Processing</AlertTitle>
                <AlertDescription>
                  Uploaded files undergo comprehensive AI analysis:
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Smart Upload Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Semantic duplicate detection (save ~$45K/year)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Automatic entity extraction & tagging</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Compliance & rights verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Business value assessment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Knowledge graph integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Quality scoring & gap analysis</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your Knowledge Curators process an average of 120 files per week,
                  generating {formatCurrency(45000)} in monthly savings through
                  intelligent curation and deduplication.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {filesToDelete.length} file(s)?
              This will permanently remove them from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFiles} className="bg-destructive text-destructive-foreground">
              Delete {filesToDelete.length} file{filesToDelete.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}