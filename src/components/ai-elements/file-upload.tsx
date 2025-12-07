"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";
import {
  Upload,
  FileText,
  X,
  Check,
  AlertCircle,
  Loader2,
  Paperclip,
  FileIcon,
  FileImage,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Action } from "./actions";

interface FileUploadItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  fileId?: string;
}

interface FileUploadProps {
  className?: string;
  onUploadComplete?: (fileId: string, filename: string) => void;
  onUploadError: (error: string) => void;
  assistantId?: string;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  compact?: boolean;
  apiEndpoint?: string; // Add API endpoint for flexibility
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("sheet") || fileType.includes("excel")) return FileSpreadsheet;
  if (fileType.includes("code") || fileType.includes("javascript") || fileType.includes("json"))
    return FileCode;
  return FileIcon;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileUpload({
  className,
  onUploadComplete,
  onUploadError,
  maxFileSize = 20 * 1024 * 1024, // 20MB default
  acceptedFileTypes = [
    ".pdf",
    ".txt",
    ".md",
    ".doc",
    ".docx",
    ".json",
    ".csv",
    ".png",
    ".jpg",
    ".jpeg",
  ],
  compact = false,
  apiEndpoint = "/api/assistant", // Use assistant API
}: FileUploadProps) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const newFiles: FileUploadItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (file.size > maxFileSize) {
          toast.error(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxFileSize)}`);
          continue;
        }

        // Create upload item
        newFiles.push({
          file,
          id: `${Date.now()}-${i}`,
          status: "pending",
          progress: 0,
        });
      }

      if (newFiles.length > 0) {
        setUploadQueue((prev) => [...prev, ...newFiles]);
        // Auto-start upload
        uploadFiles(newFiles);
      }
    },
    [maxFileSize]
  );

  const uploadFiles = async (files: FileUploadItem[]) => {
    setIsUploading(true);

    for (const item of files) {
      try {
        // Update status to uploading
        setUploadQueue((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 10 } : f))
        );

        // Create FormData
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("purpose", "assistants");

        // Upload to API
        const response = await fetch(apiEndpoint, {
          method: "PUT", // Use PUT for file upload
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();

        // Update status to completed
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: "completed",
                  progress: 100,
                  fileId: result.fileId,
                }
              : f
          )
        );

        toast.success(`"${item.file.name}" uploaded successfully`);
        onUploadComplete?.(result.fileId, item.file.name);
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Upload failed";

        setUploadQueue((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "error", error: errorMessage } : f))
        );

        toast.error(`Failed to upload "${item.file.name}": ${errorMessage}`);
        onUploadError?.(errorMessage);
      }
    }

    setIsUploading(false);
  };

  const removeFile = (id: string) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const clearCompleted = () => {
    setUploadQueue((prev) => prev.filter((f) => f.status !== "completed"));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (compact) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          suppressHydrationWarning
        />
        <Action
          onClick={() => fileInputRef.current?.click()}
          tooltip="Upload files to knowledge base"
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Action>
        {uploadQueue.length > 0 && (
          <div className="absolute bottom-full mb-2 right-0 w-80 bg-background border rounded-lg shadow-lg p-4 space-y-2 max-h-60 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploads</span>
              {uploadQueue.some((f) => f.status === "completed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  className="h-6 text-xs mac-button mac-button-outline"
                >
                  Clear completed
                </Button>
              )}
            </div>
            {uploadQueue.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  {item.status === "uploading" && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                  {item.status === "completed" && <Check className="h-3 w-3 text-green-500" />}
                  {item.status === "error" && <AlertCircle className="h-3 w-3 text-red-500" />}
                  <span className="text-xs flex-1 truncate">{item.file.name}</span>
                  <Button
                    className="mac-button mac-button-outline"
                    variant="ghost"
                    className="mac-button mac-button-outline"
                    size="sm"
                    onClick={() => removeFile(item.id)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                {item.status === "uploading" && <Progress value={item.progress} className="h-1" />}
                {item.status === "error" && <p className="text-xs text-red-500">{item.error}</p>}
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          "mac-glass",
          "border-[var(--mac-utility-border)]",
          "hover:border-[var(--mac-primary-blue-400)]/50",
          "hover:bg-[var(--mac-state-hover)]",
          "hover:shadow-lg hover:shadow-[var(--mac-primary-blue-400)]/10",
          "focus-within:border-[var(--mac-primary-blue-400)]",
          "focus-within:ring-2 focus-within:ring-[var(--mac-primary-blue-400)]/20",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          suppressHydrationWarning
        />

        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--mac-primary-blue-400)]/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-[var(--mac-primary-blue-400)]" />
          </div>

          <div>
            <h3
              className="mac-title"
              className="mac-title text-lg font-light mb-2 text-[var(--mac-text-primary)]"
            >
              Upload to Knowledge Base
            </h3>
            <p className="text-sm text-[var(--mac-text-secondary)] mb-4 font-light">
              Drag and drop files or click to browse
            </p>
            <Button
              className="mac-button mac-button-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Files
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-[var(--mac-text-muted)] font-light">
            Max file size: {formatFileSize(maxFileSize)} • Supported: PDF, TXT, MD, DOC, DOCX, JSON,
            CSV, Images
          </p>
        </div>
      </div>

      {uploadQueue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="mac-title">Upload Queue</h4>
            {uploadQueue.some((f) => f.status === "completed") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="h-7 text-xs mac-button mac-button-outline"
              >
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {uploadQueue.map((item) => {
              const FileIconComponent = getFileIcon(item.file.type);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                >
                  <FileIconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>

                    {item.status === "uploading" && (
                      <Progress value={item.progress} className="h-1.5" />
                    )}

                    {item.status === "error" && (
                      <p className="text-xs text-[var(--mac-status-error-text)] font-light">
                        {item.error}
                      </p>
                    )}

                    {item.status === "completed" && (
                      <p className="text-xs text-[var(--mac-status-success-text)] font-light">
                        Successfully uploaded
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {item.status === "pending" && (
                      <div className="h-5 w-5 rounded-full bg-[var(--mac-utility-border)]" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--mac-primary-blue-400)]" />
                    )}
                    {item.status === "completed" && (
                      <Check className="h-5 w-5 text-[var(--mac-status-success-text)]" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="h-5 w-5 text-[var(--mac-status-error-text)]" />
                    )}
                  </div>

                  <Button
                    className="mac-button mac-button-outline"
                    variant="ghost"
                    className="mac-button mac-button-outline"
                    size="sm"
                    onClick={() => removeFile(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
