"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../dialog";
import { Button } from "../button";
import { Input } from "../input";
import { Label } from "../label";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentModal({ open, onOpenChange }: UploadDocumentModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setSuccess(false);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    // Mock upload progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate API call
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setUploading(false);
      setSuccess(true);
      toast.success("Document uploaded successfully!");

      // Reset after delay
      setTimeout(() => {
        onOpenChange(false);
        setFile(null);
        setSuccess(false);
        setProgress(0);
      }, 1500);
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] mac-card-elevated border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--mac-text-primary)]">Upload Knowledge</DialogTitle>
          <DialogDescription className="text-[var(--mac-text-secondary)] font-light">
            Add PDF or text documents to the AOMA knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!success ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--mac-utility-border)] rounded-lg p-8 transition-colors hover:bg-[var(--mac-surface-background)]/50">
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center"
                  >
                    <FileText className="h-10 w-10 text-[var(--mac-primary-blue-400)] mb-2" />
                    <p className="text-sm font-normal text-[var(--mac-text-primary)]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[var(--mac-text-muted)] font-light">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <Button className="mac-button"
                      variant="ghost" className="mac-button mac-button-outline"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="mt-2 text-[var(--mac-status-error-text)] hover:text-[var(--mac-status-error-text)] hover:bg-[var(--mac-status-error-bg)]/10"
                      disabled={uploading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <Upload className="h-10 w-10 text-[var(--mac-text-muted)] mb-2" />
                    <Label
                      htmlFor="file-upload"
                      className="cursor-pointer text-sm font-normal text-[var(--mac-primary-blue-400)] hover:text-[var(--mac-primary-blue-600)]"
                    >
                      Choose a file
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      className="mac-input hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.txt,.md"
                    />
                    <p className="text-xs text-[var(--mac-text-muted)] mt-1 font-light">
                      PDF, TXT, or MD up to 10MB
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle2 className="h-16 w-16 text-[var(--mac-status-connected)] mb-4" />
              <p className="text-lg font-normal text-[var(--mac-text-primary)]">Upload Complete!</p>
              <p className="text-sm text-[var(--mac-text-muted)] font-light">
                Processing for vector search...
              </p>
            </motion.div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-[var(--mac-text-muted)]">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-[var(--mac-utility-border)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[var(--mac-primary-blue-400)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!success && (
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="mac-button w-full sm:w-auto font-light"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
