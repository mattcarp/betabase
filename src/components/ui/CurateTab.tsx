"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { ScrollArea } from "./scroll-area";
import { Separator } from "./separator";
import { Input } from "./input";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
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
  const [files, setFiles] = useState<VectorStoreFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("files");
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    lastUpdated: null as Date | null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);

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
          0,
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
      console.error("Error loading files:", error);
      toast.error("Failed to load files from vector store");
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

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Knowledge Curation
            </CardTitle>
            <CardDescription>
              Manage documents in the AOMA vector storage
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
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files">
              <FolderOpen className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="info">
              <Info className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4 h-full flex flex-col">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFiles}
                  disabled={loading}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles(new Set())}
                    >
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
                        checked={
                          selectedFiles.size === filteredFiles.length &&
                          filteredFiles.length > 0
                        }
                        onChange={selectAllFiles}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-muted-foreground">
                        Select all ({filteredFiles.length})
                      </span>
                    </div>

                    {/* File Items */}
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          selectedFiles.has(file.id) &&
                            "bg-muted/50 border-primary/50",
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
                          <p className="font-medium text-sm truncate">
                            {file.filename}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.bytes)}</span>
                            <span>•</span>
                            <span>{formatDate(file.created_at)}</span>
                            <span>•</span>
                            <Badge
                              variant={
                                file.status === "processed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs h-4"
                            >
                              {file.status}
                            </Badge>
                          </div>
                        </div>

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
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
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

              {/* Status Bar */}
              {stats.lastUpdated && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Last updated: {stats.lastUpdated.toLocaleTimeString()}
                  </span>
                  <span>
                    {filteredFiles.length} of {files.length} files shown
                  </span>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4">
              <FileUpload
                assistantId={assistantId}
                onUploadComplete={handleUploadComplete}
                onUploadError={(error) => toast.error(error)}
              />

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Uploaded files are automatically processed and indexed in the
                  AOMA vector store. They become immediately available for
                  semantic search and AI-powered analysis.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="info" className="flex-1 overflow-hidden mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Vector Store Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Assistant ID
                    </span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {assistantId}
                    </code>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Files
                    </span>
                    <span className="font-medium">{stats.totalFiles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Size
                    </span>
                    <span className="font-medium">
                      {formatFileSize(stats.totalSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant="default"
                      className="flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Supported File Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "PDF",
                      "TXT",
                      "MD",
                      "DOCX",
                      "JSON",
                      "CSV",
                      "PNG",
                      "JPG",
                    ].map((type) => (
                      <Badge
                        key={type}
                        variant="outline"
                        className="justify-center"
                      >
                        .{type.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Files in the vector store are used to enhance AI responses
                  with domain-specific knowledge. Deleting files will
                  permanently remove them from the knowledge base.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Files</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {filesToDelete.length} file(s)? 
              This action cannot be undone and will permanently remove the files from the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteFiles}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {filesToDelete.length} file{filesToDelete.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
