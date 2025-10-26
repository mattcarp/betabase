import React, { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";

interface DocumentUploadProps {
  onUploadComplete?: (fileId: string, fileName: string) => void;
  assistantId?: string;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUploadComplete,
  assistantId = "asst_uVCyntqMojfXNSo5gXq8uxm4", // Default AOMA Assistant
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "complete" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ id: string; name: string; size: number }>
  >([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 50MB limit");
      setUploadStatus("error");
      return;
    }

    // Supported formats
    const supportedFormats = [
      ".pdf",
      ".txt",
      ".md",
      ".doc",
      ".docx",
      ".png",
      ".jpg",
      ".jpeg",
      ".csv",
      ".json",
    ];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!supportedFormats.includes(fileExtension)) {
      setErrorMessage(`File format ${fileExtension} not supported`);
      setUploadStatus("error");
      return;
    }

    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assistantId", assistantId);
      formData.append("purpose", "assistants");

      // Upload to OpenAI
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setUploadStatus("processing");

      // Vector store handling is already performed in /api/upload when assistantId is provided.
      // No additional call is required here.

      setUploadStatus("complete");
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: result.fileId,
          name: file.name,
          size: file.size,
        },
      ]);

      if (onUploadComplete) {
        onUploadComplete(result.fileId, file.name);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus("idle");
        setUploadProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h3 className="mac-title">
          Document Upload
        </h3>
        <p className="text-sm text-gray-400">
          Upload documents to the AOMA knowledge base for enhanced assistance
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.csv,.json"
          disabled={isUploading}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center">
            {uploadStatus === "idle" && (
              <>
                <Upload className="w-12 h-12 text-blue-500 mb-4" />
                <p className="mac-body text-white mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-400">
                  Supports PDF, TXT, MD, DOC, DOCX, Images, CSV, JSON (max 50MB)
                </p>
              </>
            )}

            {uploadStatus === "uploading" && (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                <p className="mac-body text-white mb-2">Uploading...</p>
                <Progress value={uploadProgress} className="w-full max-w-xs mt-2" />
              </>
            )}

            {uploadStatus === "processing" && (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                <p className="mac-body text-white mb-2">Processing document...</p>
                <p className="text-sm text-gray-400">Adding to knowledge base</p>
              </>
            )}

            {uploadStatus === "complete" && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <p className="mac-body text-white mb-2">Upload complete!</p>
                <p className="text-sm text-gray-400">Document added to knowledge base</p>
              </>
            )}

            {uploadStatus === "error" && (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="mac-body text-white mb-2">Upload failed</p>
                <p className="text-sm text-red-400">{errorMessage}</p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="mac-title">
            Uploaded Documents
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <File className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-white">{file.name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Alert */}
      <Alert className="mt-6 border-blue-500/20 bg-blue-500/5">
        <AlertCircle className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-gray-300">
          Documents are indexed and searchable immediately after upload. The AI will use this
          knowledge to provide more accurate AOMA-specific answers.
        </AlertDescription>
      </Alert>
    </div>
  );
};
