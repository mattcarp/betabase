"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
// Native tabs to avoid React 19 + Radix ref composition issues
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
// import { Input } from "./input"; // Unused
// import { Checkbox } from "./checkbox"; // Unused - using native checkbox
import {
  Database,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Search,
  AlertCircle,
  CheckCircle,
  // Clock, // Unused
  FileIcon,
  FolderOpen,
  Info,
  X,
  // MoreVertical, // Unused - was for dropdown menu
  GitMerge,
  // Loader2, // Unused
  Eye,
  Lightbulb,
} from "lucide-react";
// Native buttons used instead to avoid React 19 + Radix ref issues
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "./dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { FileUpload } from "../ai-elements/file-upload";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription /* EmptyContent - Unused */,
} from "./empty";
import { Spinner } from "./spinner";
import { InputGroup, InputGroupInput, InputGroupAddon } from "./input-group";
import { usePermissions } from "../../hooks/usePermissions";
import { RLHFFeedbackTab } from "./rlhf-tabs/RLHFFeedbackTab";
import { CuratorQueue } from "./CuratorQueue";
import { FeedbackImpactCard } from "./FeedbackImpactCard";
import { DeduplicationTab } from "./DeduplicationTab";
import { cognitoAuth } from "../../services/cognitoAuth";
import { ListTodo, GitBranch } from "lucide-react";

interface VectorStoreFile {
  id: string;
  filename: string;
  bytes: number;
  created_at: number;
  status: string;
  purpose?: string;
}

interface CurateTabProps {
  className?: string;
  assistantId?: string;
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

export function CurateTab({
  className,
  assistantId = "asst_VvOHL1c4S6YapYKun4mY29fM",
}: CurateTabProps) {
  // Permission check for RLHF features
  // Allow bypass on localhost for development, but enforce on production
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  const [userEmail, setUserEmail] = useState<string>("");
  const { hasPermission } = usePermissions(userEmail);

  // SECURITY: Only bypass permissions on localhost, never on production
  const canAccessRLHF = isLocalhost || hasPermission("rlhf_feedback");

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await cognitoAuth.getCurrentUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    }
    loadUser();
  }, []);

  const [files, setFiles] = useState<VectorStoreFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("queue");
  const [_statsLoading, _setStatsLoading] = useState(false); // Unused
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    lastUpdated: null as Date | null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [deduplicating, setDeduplicating] = useState(false);
  const [_dedupeResults, setDedupeResults] = useState<{
    totalDuplicates: number;
    duplicateGroups: number;
    removed: number;
  } | null>(null); // dedupeResults unused
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<VectorStoreFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Load files from vector store
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vector-store/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);

        // Calculate stats
        const totalSize = data.files.reduce(
          (sum: number, file: VectorStoreFile) => sum + file.bytes,
          0
        );
        setStats({
          totalFiles: data.files.length,
          totalSize,
          lastUpdated: new Date(),
        });
      } else {
        throw new Error("Failed to load files");
      }
    } catch (error) {
      // Network failures are expected during rapid navigation/tests - fail silently
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        // Silently ignore aborted requests
      } else {
        console.warn("Error loading files:", error);
        toast.error("Failed to load files from vector store");
      }
    } finally {
      setLoading(false);
    }
  };

  // Open delete confirmation dialog
  const confirmDeleteFiles = (fileIds: string[]) => {
    if (fileIds.length === 0) return;
    setFilesToDelete(fileIds);
    setDeleteDialogOpen(true);
  };

  // Delete selected files (after confirmation)
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

        if (response.ok) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
      }
    }

    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} file(s)`);
      setSelectedFiles(new Set());
      await loadFiles(); // Reload files
    } else {
      toast.error("Failed to delete files");
    }

    setFilesToDelete([]);
    setLoading(false);
  };

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
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  // Preview file content
  const previewFileContent = async (file: VectorStoreFile) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
    setPreviewLoading(true);
    setPreviewContent("");

    try {
      const response = await fetch(`/api/vector-store/files/content?fileId=${file.id}`);

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.content || "No content available");
      } else {
        setPreviewContent("Failed to load file content");
      }
    } catch (error) {
      console.error("Error loading file preview:", error);
      setPreviewContent("Error loading file content");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Run deduplication
  const runDeduplication = async () => {
    setDeduplicating(true);
    setDedupeResults(null);

    try {
      toast.info("Scanning knowledge base for duplicates...", {
        description: "Using semantic similarity analysis (85% threshold)",
      });

      const response = await fetch("/api/vector-store/deduplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dryRun: false, // Actually remove duplicates
          semanticThreshold: 0.85, // Lower threshold = catch more duplicates
          keepNewest: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDedupeResults({
          totalDuplicates: data.totalDuplicates,
          duplicateGroups: data.duplicateGroups,
          removed: data.removed,
        });

        if (data.removed > 0) {
          toast.success(
            `🎯 Cleaned up ${data.removed} duplicate file(s) from ${data.duplicateGroups} group(s)`,
            {
              description: "Knowledge base optimized - newer versions kept",
              duration: 5000,
            }
          );
          await loadFiles(); // Reload files
        } else {
          toast.success("✨ Knowledge base is clean!", {
            description: "No duplicates found - all files are unique",
          });
        }
      } else {
        throw new Error("Failed to deduplicate");
      }
    } catch (error) {
      console.error("Error deduplicating:", error);
      toast.error("Failed to deduplicate files", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setDeduplicating(false);
    }
  };

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, []);

  // Handle file upload completion
  const handleUploadComplete = () => {
    loadFiles(); // Reload files after upload
  };

  return (
    <Card
      className={cn(
        "mac-card",
        "h-full flex flex-col",
        "mac-glass",
        "bg-[var(--mac-surface-elevated)]",
        "border-[var(--mac-utility-border)]",
        className
      )}
    >
      <CardHeader className="mac-card">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-light text-[var(--mac-text-primary)]">
              <Database className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              Knowledge Curation
            </CardTitle>
            <CardDescription className="font-light text-[var(--mac-text-secondary)]">
              Manage documents in the AOMA vector storage
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                "flex items-center gap-2",
                "mac-status-badge mac-status-connected",
                "font-light"
              )}
            >
              <FileText className="h-3 w-3" />
              {stats.totalFiles} files
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "flex items-center gap-2",
                "bg-[var(--mac-surface-elevated)]/50",
                "border-[var(--mac-utility-border-elevated)]",
                "text-[var(--mac-text-secondary)]",
                "font-light"
              )}
            >
              <Database className="h-3 w-3" />
              {formatFileSize(stats.totalSize)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {/* Native tabs implementation to avoid React 19 + Radix ref issues */}
        <div className="h-full flex flex-col">
          <div
            role="tablist"
            className={cn(
              "flex w-full overflow-x-auto rounded-lg p-1",
              "mac-glass",
              "border border-[var(--mac-utility-border)]",
              "bg-[var(--mac-surface-card)]"
            )}
          >
            {/* Queue Tab - Curator Review Queue */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "queue"}
              onClick={() => setActiveTab("queue")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                activeTab === "queue"
                  ? "bg-[var(--mac-accent-orange-400)]/10 text-[var(--mac-accent-orange-400)] border-b-[3px] border-[var(--mac-accent-orange-400)] shadow-[0_2px_8px_rgba(251,146,60,0.3)]"
                  : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
              )}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Queue
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "files"}
              onClick={() => setActiveTab("files")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                activeTab === "files"
                  ? "bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-b-[3px] border-[var(--mac-primary-blue-400)] shadow-[0_2px_8px_rgba(51,133,255,0.3)]"
                  : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
              )}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "upload"}
              onClick={() => setActiveTab("upload")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                activeTab === "upload"
                  ? "bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-b-[3px] border-[var(--mac-primary-blue-400)] shadow-[0_2px_8px_rgba(51,133,255,0.3)]"
                  : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
              )}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "info"}
              onClick={() => setActiveTab("info")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                activeTab === "info"
                  ? "bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-b-[3px] border-[var(--mac-primary-blue-400)] shadow-[0_2px_8px_rgba(51,133,255,0.3)]"
                  : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
              )}
            >
              <Info className="h-4 w-4 mr-2" />
              Info
            </button>

            {/* RLHF Feedback Tab (permission-gated) */}
            {canAccessRLHF && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "rlhf-feedback"}
                onClick={() => setActiveTab("rlhf-feedback")}
                className={cn(
                  "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                  activeTab === "rlhf-feedback"
                    ? "bg-[var(--mac-accent-purple-400)]/10 text-[var(--mac-accent-purple-400)] border-b-[3px] border-[var(--mac-accent-purple-400)] shadow-[0_2px_8px_rgba(168,85,247,0.3)]"
                    : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
                )}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                RLHF
              </button>
            )}

            {/* Deduplication Intelligence Tab */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "dedupe"}
              onClick={() => setActiveTab("dedupe")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-light transition-all flex-1",
                activeTab === "dedupe"
                  ? "bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)] border-b-[3px] border-[var(--mac-primary-blue-400)] shadow-[0_2px_8px_rgba(51,133,255,0.3)]"
                  : "text-[var(--mac-text-secondary)] hover:text-[var(--mac-text-primary)] hover:bg-[var(--mac-state-hover)]"
              )}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Dedupe
            </button>
          </div>

          {/* Queue Tab Content - Curator Review Queue */}
          {activeTab === "queue" && (
            <div role="tabpanel" className="flex-1 overflow-hidden mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                {/* Curator Queue takes 2/3 width on large screens */}
                <div className="lg:col-span-2 overflow-hidden">
                  <CuratorQueue className="h-full" />
                </div>
                {/* Feedback Impact Card takes 1/3 width on large screens */}
                <div className="overflow-auto">
                  <FeedbackImpactCard />
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div role="tabpanel" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4 h-full flex flex-col">
              {/* Search and Actions Bar */}
              <div className="flex items-center gap-2">
                <InputGroup className="flex-1">
                  <InputGroupAddon className="bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)]">
                    <Search className="h-4 w-4 text-[var(--mac-text-secondary)]" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "mac-input",
                      "bg-[var(--mac-surface-elevated)]",
                      "border-[var(--mac-utility-border)]",
                      "text-[var(--mac-text-primary)]",
                      "placeholder:text-[var(--mac-text-muted)]",
                      "font-light"
                    )}
                  />
                </InputGroup>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFiles}
                  disabled={loading}
                  className={cn(
                    "mac-button-outline",
                    "hover:border-[var(--mac-primary-blue-400)]",
                    "hover:bg-[var(--mac-state-hover)]",
                    "transition-all duration-200"
                  )}
                >
                  {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runDeduplication}
                  disabled={deduplicating || loading}
                  title="Find and remove duplicate files"
                  className={cn(
                    "mac-button-outline",
                    "hover:border-[var(--mac-accent-purple-400)]",
                    "hover:bg-[var(--mac-state-hover)]",
                    "group",
                    "transition-all duration-200"
                  )}
                >
                  {deduplicating ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <GitMerge className="h-4 w-4 group-hover:text-[var(--mac-accent-purple-400)]" />
                  )}
                </Button>
                {selectedFiles.size > 0 && (
                  <>
                    <Button
                      className={cn(
                        "mac-button mac-button-primary",
                        "bg-[var(--mac-status-error-bg)]",
                        "border border-[var(--mac-status-error-border)]",
                        "text-[var(--mac-status-error-text)]",
                        "hover:bg-[var(--mac-status-error-bg)]/80",
                        "transition-all duration-200"
                      )}
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDeleteFiles(Array.from(selectedFiles))}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({selectedFiles.size})
                    </Button>
                    <Button
                      className="mac-button mac-button-outline"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles(new Set())}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Files List - native scroll to avoid React 19 + Radix ref issues */}
              <div
                className={cn(
                  "flex-1 rounded-lg overflow-y-auto",
                  "border border-[var(--mac-utility-border)]",
                  "bg-[var(--mac-surface-elevated)]"
                )}
              >
                {loading && filteredFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <Empty className={cn("h-32 border-0", "bg-[var(--mac-surface-elevated)]/50")}>
                    <EmptyMedia variant="icon" className="text-[var(--mac-text-muted)]">
                      <FileText className="h-10 w-10" />
                    </EmptyMedia>
                    <EmptyTitle className="text-[var(--mac-text-primary)] font-light">
                      No files found
                    </EmptyTitle>
                    <EmptyDescription className="text-[var(--mac-text-secondary)] font-light">
                      {searchQuery
                        ? `No files match "${searchQuery}"`
                        : "Upload files to get started"}
                    </EmptyDescription>
                  </Empty>
                ) : (
                  <div className="p-4 space-y-2">
                    {/* Select All */}
                    <div className="flex items-center gap-4 pb-4 border-b border-[var(--mac-utility-border)]">
                      <input
                        type="checkbox"
                        checked={
                          selectedFiles.size === filteredFiles.length && filteredFiles.length > 0
                        }
                        onChange={selectAllFiles}
                        className={cn(
                          "h-4 w-4 rounded-sm cursor-pointer",
                          "border-[var(--mac-utility-border-elevated)]",
                          "accent-[var(--mac-primary-blue-400)]"
                        )}
                      />
                      <label
                        className="text-sm text-[var(--mac-text-secondary)] font-light cursor-pointer"
                        onClick={selectAllFiles}
                      >
                        Select all ({filteredFiles.length})
                      </label>
                    </div>

                    {/* File Items */}
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "group flex items-center gap-4 p-4 rounded-lg",
                          "border border-[var(--mac-utility-border)]",
                          "bg-[var(--mac-surface-elevated)]",
                          "transition-all duration-200 ease-out",
                          "hover:bg-[var(--mac-state-hover)]",
                          "hover:border-[var(--mac-primary-blue-400)]/40",
                          "hover:shadow-xl hover:shadow-[var(--mac-primary-blue-400)]/20",
                          "hover:-translate-y-1",
                          "cursor-pointer",
                          selectedFiles.has(file.id) && [
                            "bg-[var(--mac-surface-card)]",
                            "border-[var(--mac-primary-blue-400)]",
                            "shadow-lg shadow-[var(--mac-primary-blue-400)]/10",
                          ]
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className={cn(
                            "h-4 w-4 rounded-sm cursor-pointer",
                            "border-[var(--mac-utility-border-elevated)]",
                            "accent-[var(--mac-primary-blue-400)]"
                          )}
                        />

                        <FileIcon className="h-5 w-5 text-[var(--mac-text-secondary)] flex-shrink-0" />

                        <div className="flex-1 min-w-0">
                          <p className="font-light text-sm truncate text-[var(--mac-text-primary)]">
                            {file.filename}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[var(--mac-text-secondary)] font-light flex-wrap">
                            <span>{formatFileSize(file.bytes)}</span>
                            <span className="text-[var(--mac-utility-border-elevated)]">│</span>
                            <span>{formatDate(file.created_at)}</span>
                            <span className="text-[var(--mac-utility-border-elevated)]">│</span>
                            <Badge
                              variant={
                                file.status === "processed" || file.status === "ready"
                                  ? "default"
                                  : "secondary"
                              }
                              className={cn(
                                "text-xs h-4 font-light",
                                file.status === "processed" || file.status === "ready"
                                  ? "mac-status-connected"
                                  : "mac-status-warning"
                              )}
                            >
                              {file.status}
                            </Badge>
                            {/* Knowledge Quality Indicators */}
                            {(() => {
                              const now = Date.now();
                              const fileAge = now - file.created_at * 1000;
                              const sevenDays = 7 * 24 * 60 * 60 * 1000;
                              const isNew = fileAge < sevenDays;
                              const isLarge = file.bytes > 1024 * 1024; // > 1MB

                              return (
                                <>
                                  {isNew && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs h-4 font-light",
                                        "bg-[var(--mac-accent-purple-400)]/10",
                                        "border-[var(--mac-accent-purple-400)]/30",
                                        "text-[var(--mac-accent-purple-400)]"
                                      )}
                                    >
                                      New
                                    </Badge>
                                  )}
                                  {isLarge && (
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-xs h-4 font-light",
                                        "bg-[var(--mac-primary-blue-400)]/10",
                                        "border-[var(--mac-primary-blue-400)]/30",
                                        "text-[var(--mac-primary-blue-400)]"
                                      )}
                                      title="Comprehensive document"
                                    >
                                      Detailed
                                    </Badge>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => previewFileContent(file)}
                            className="h-8 w-8 p-0 rounded-md hover:bg-[var(--mac-state-hover)] inline-flex items-center justify-center text-[var(--mac-text-secondary)] hover:text-[var(--mac-primary-blue-400)] transition-colors"
                            title="Preview file"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDeleteFiles([file.id])}
                            className="h-8 w-8 p-0 rounded-md hover:bg-[var(--mac-state-hover)] inline-flex items-center justify-center text-[var(--mac-text-secondary)] hover:text-[var(--mac-status-error-text)] transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Bar */}
              {stats.lastUpdated && (
                <div className="flex items-center justify-between text-xs text-[var(--mac-text-muted)] font-light">
                  <span>Last updated: {stats.lastUpdated.toLocaleTimeString()}</span>
                  <span>
                    {filteredFiles.length} of {files.length} files shown
                  </span>
                </div>
              )}
            </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div role="tabpanel" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-6">
              {/* Prominent Upload Hero Section */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl p-8",
                  "bg-gradient-to-br from-[var(--mac-primary-blue-400)]/10 via-[var(--mac-accent-purple-400)]/5 to-[var(--mac-surface-elevated)]",
                  "border-2 border-dashed border-[var(--mac-primary-blue-400)]/40",
                  "hover:border-[var(--mac-primary-blue-400)]/60",
                  "transition-all duration-300"
                )}
              >
                {/* Background decorative elements */}
                <div className="absolute top-4 right-4 opacity-10">
                  <Upload className="h-24 w-24 text-[var(--mac-primary-blue-400)]" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        "bg-[var(--mac-primary-blue-400)]/20",
                        "border border-[var(--mac-primary-blue-400)]/30"
                      )}
                    >
                      <Upload className="h-6 w-6 text-[var(--mac-primary-blue-400)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-normal text-[var(--mac-text-primary)]">
                        Upload Knowledge Documents
                      </h3>
                      <p className="text-sm font-light text-[var(--mac-text-secondary)]">
                        Drag and drop files or click to browse
                      </p>
                    </div>
                  </div>

                  <FileUpload
                    {...({
                      assistantId,
                      apiEndpoint: "/api/vector-store/files",
                      onUploadComplete: handleUploadComplete,
                      onUploadError: (error: string) => toast.error(error),
                    } as any)}
                  />
                </div>
              </div>

              {/* Info Card */}
              <Card
                className={cn(
                  "mac-card-elevated",
                  "border-[var(--mac-utility-border)]",
                  "bg-[var(--mac-surface-elevated)]/50"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg flex-shrink-0",
                        "bg-[var(--mac-primary-blue-400)]/10"
                      )}
                    >
                      <Info className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-light text-[var(--mac-text-secondary)]">
                        Uploaded files are automatically processed and indexed in the AOMA vector
                        store. They become immediately available for semantic search and AI-powered
                        analysis.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-light",
                            "bg-[var(--mac-status-success-bg)]/30",
                            "border-[var(--mac-status-success-border)]/50",
                            "text-[var(--mac-status-success-text)]"
                          )}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-indexed
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-light",
                            "bg-[var(--mac-primary-blue-400)]/10",
                            "border-[var(--mac-primary-blue-400)]/30",
                            "text-[var(--mac-primary-blue-400)]"
                          )}
                        >
                          <Search className="h-3 w-3 mr-1" />
                          Semantic search
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          )}

          {activeTab === "info" && (
            <div role="tabpanel" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4">
              <Card className="mac-card-elevated">
                <CardHeader className="mac-card">
                  <CardTitle className="text-lg font-light text-[var(--mac-text-primary)]">
                    Vector Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--mac-text-secondary)] font-light">
                      Assistant ID
                    </span>
                    <code
                      className={cn(
                        "text-xs px-2 py-2 rounded font-light",
                        "bg-[var(--mac-surface-background)]",
                        "text-[var(--mac-text-primary)]",
                        "border border-[var(--mac-utility-border)]"
                      )}
                    >
                      {assistantId}
                    </code>
                  </div>
                  <Separator className="bg-[var(--mac-utility-border)]" />
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--mac-text-secondary)] font-light">
                      Total Files
                    </span>
                    <span className="font-normal text-[var(--mac-text-primary)]">
                      {stats.totalFiles}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--mac-text-secondary)] font-light">
                      Total Size
                    </span>
                    <span className="font-normal text-[var(--mac-text-primary)]">
                      {formatFileSize(stats.totalSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--mac-text-secondary)] font-light">
                      Status
                    </span>
                    <Badge
                      variant="default"
                      className="flex items-center gap-2 mac-status-connected font-light"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="mac-card-elevated">
                <CardHeader className="mac-card">
                  <CardTitle className="text-lg font-light text-[var(--mac-text-primary)]">
                    Supported File Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="mac-card">
                  <div className="grid grid-cols-2 gap-2">
                    {["PDF", "TXT", "MD", "DOCX", "JSON", "CSV", "PNG", "JPG"].map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className={cn(
                          "justify-center font-light",
                          "bg-[var(--mac-surface-elevated)]/50",
                          "border-[var(--mac-utility-border)]",
                          "text-[var(--mac-text-secondary)]"
                        )}
                      >
                        .{type.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Alert
                className={cn(
                  "border-[var(--mac-utility-border)]",
                  "bg-[var(--mac-surface-elevated)]/50"
                )}
              >
                <AlertCircle className="h-4 w-4 text-[var(--mac-status-warning-text)]" />
                <AlertDescription className="font-light text-[var(--mac-text-secondary)]">
                  Files in the vector store are used to enhance AI responses with domain-specific
                  knowledge. Deleting files will permanently remove them from the knowledge base.
                </AlertDescription>
              </Alert>
            </div>
            </div>
          )}

          {/* RLHF Feedback Tab Content */}
          {canAccessRLHF && activeTab === "rlhf-feedback" && (
            <div role="tabpanel" className="flex-1 overflow-hidden mt-4">
              <RLHFFeedbackTab />
            </div>
          )}

          {/* Deduplication Intelligence Tab Content */}
          {activeTab === "dedupe" && (
            <div role="tabpanel" className="flex-1 overflow-auto mt-4">
              <DeduplicationTab />
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className={cn(
            "mac-glass",
            "border-[var(--mac-utility-border-elevated)]",
            "bg-[var(--mac-surface-elevated)]"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-[var(--mac-text-primary)] font-light flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[var(--mac-status-error-text)]" />
              Delete Files
            </DialogTitle>
            <DialogDescription className="text-[var(--mac-text-secondary)] font-light">
              Are you sure you want to delete {filesToDelete.length} file(s)? This action cannot be
              undone and will permanently remove the files from the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              className="mac-button mac-button-outline"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteFiles}
              disabled={loading}
              className={cn(
                "mac-button mac-button-primary",
                "bg-[var(--mac-status-error-bg)]",
                "border border-[var(--mac-status-error-border)]",
                "text-[var(--mac-status-error-text)]",
                "hover:bg-[var(--mac-status-error-bg)]/80",
                "transition-all duration-200"
              )}
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {filesToDelete.length} file{filesToDelete.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent
          className={cn(
            "mac-glass max-w-4xl max-h-[80vh]",
            "border-[var(--mac-utility-border-elevated)]",
            "bg-[var(--mac-surface-elevated)]"
          )}
        >
          <DialogHeader>
            <DialogTitle className="text-[var(--mac-text-primary)] font-light flex items-center gap-2">
              <Eye className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
              File Preview
            </DialogTitle>
            {previewFile && (
              <DialogDescription className="text-[var(--mac-text-secondary)] font-light">
                {previewFile.filename} • {formatFileSize(previewFile.bytes)} •{" "}
                {formatDate(previewFile.created_at)}
              </DialogDescription>
            )}
          </DialogHeader>

          <ScrollArea
            className={cn(
              "h-96 rounded-lg p-4",
              "border border-[var(--mac-utility-border)]",
              "bg-[var(--mac-surface-background)]"
            )}
          >
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner className="h-8 w-8" />
                <span className="ml-4 text-[var(--mac-text-secondary)] font-light">
                  Loading content...
                </span>
              </div>
            ) : (
              <pre
                className={cn(
                  "text-xs font-mono whitespace-pre-wrap",
                  "text-[var(--mac-text-primary)]",
                  "font-light"
                )}
              >
                {previewContent}
              </pre>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              className="mac-button mac-button-outline"
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
