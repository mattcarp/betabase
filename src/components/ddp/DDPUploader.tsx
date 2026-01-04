"use client";

/**
 * DDP Uploader Component
 *
 * A standalone component for uploading and parsing DDP folders.
 * Supports both folder upload (webkitdirectory) and multiple file selection.
 */

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FolderOpen,
  FileUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDDPParser } from '@/hooks/useDDPParser';
import { DDPDisplay } from './DDPDisplay';

// ============================================================================
// Types
// ============================================================================

interface DDPUploaderProps {
  className?: string;
  onParsed?: (result: ReturnType<typeof useDDPParser>['result']) => void;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function DDPUploader({ className, onParsed, compact = false }: DDPUploaderProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);

  const {
    isDetecting,
    isParsing,
    isLookingUp,
    result,
    error,
    processFiles,
    reset,
  } = useDDPParser();

  const isLoading = isDetecting || isParsing;

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Track skipped files (> 20MB)
    const skipped = fileArray
      .filter(f => f.size > 20 * 1024 * 1024)
      .map(f => f.name);
    setSkippedFiles(skipped);

    const parseResult = await processFiles(fileArray);
    if (parseResult && onParsed) {
      onParsed(parseResult);
    }
  }, [processFiles, onParsed]);

  const handleFolderSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same folder can be selected again
    if (e.target) e.target.value = '';
  }, [handleFiles]);

  const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (e.target) e.target.value = '';
  }, [handleFiles]);

  const handleReset = useCallback(() => {
    reset();
    setSkippedFiles([]);
  }, [reset]);

  // Status indicator
  const renderStatus = () => {
    if (isDetecting) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Detecting DDP structure...</span>
        </div>
      );
    }
    if (isParsing) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Parsing DDP files...</span>
        </div>
      );
    }
    if (isLookingUp) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Looking up MusicBrainz...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      );
    }
    if (result?.parsed) {
      return (
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">DDP parsed successfully</span>
        </div>
      );
    }
    return null;
  };

  // Compact mode: just the upload buttons
  if (compact) {
    return (
      <TooltipProvider>
        <div className={cn('flex items-center gap-2', className)}>
          {/* Hidden inputs */}
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore - webkitdirectory is not in the types
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={handleFolderSelect}
          />
          <input
            ref={filesInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesSelect}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isLoading}
                className="h-9 w-9 mac-button mac-button-outline"
                onClick={() => folderInputRef.current?.click()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Upload DDP folder</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Full mode: card with upload area and results
  return (
    <Card className={cn('border-border', className)}>
      <CardContent className="p-4">
        {/* Hidden inputs */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is not in the types
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleFolderSelect}
        />
        <input
          ref={filesInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilesSelect}
        />

        {/* Upload Area */}
        {!result?.parsed && (
          <div
            className={cn(
              'border-2 border-dashed border-border rounded-lg p-8',
              'flex flex-col items-center justify-center gap-4',
              'transition-colors duration-200',
              'hover:border-primary/50 hover:bg-primary/5',
              isLoading && 'opacity-50 pointer-events-none'
            )}
          >
            <div className="p-3 bg-primary/10 rounded-full">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center">
              <h3 className="font-medium text-foreground">Upload DDP Master</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Select a DDP folder or multiple files to parse
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="default"
                disabled={isLoading}
                className="mac-button mac-button-primary"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Select Folder
              </Button>

              <span className="text-muted-foreground text-sm">or</span>

              <Button
                variant="outline"
                disabled={isLoading}
                className="mac-button mac-button-outline"
                onClick={() => filesInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            </div>

            {renderStatus()}
          </div>
        )}

        {/* Skipped Files Warning */}
        {skippedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">
                  Skipped {skippedFiles.length} large file{skippedFiles.length > 1 ? 's' : ''} (audio)
                </p>
                <p className="text-muted-foreground mt-1">
                  {skippedFiles.join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {result?.parsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header with collapse toggle and reset */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {isExpanded ? 'Collapse' : 'Expand'} DDP Details
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>

              {/* Collapsed Summary */}
              {!isExpanded && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {result.parsed.summary.albumTitle || 'Untitled Album'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {result.parsed.summary.performer || 'Unknown Artist'} -{' '}
                        {result.parsed.summary.trackCount} tracks
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {result.parsed.summary.hasCdText && (
                        <Badge variant="secondary">CD-TEXT</Badge>
                      )}
                      {result.musicBrainz?.success && (
                        <Badge variant="secondary">MusicBrainz</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Details */}
              {isExpanded && (
                <DDPDisplay
                  ddp={result.parsed}
                  musicBrainz={result.musicBrainz}
                  isLoadingMusicBrainz={isLookingUp}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Not a DDP Error */}
        {result && !result.parsed && result.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Not a valid DDP</p>
                <p className="text-muted-foreground mt-1">{result.error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default DDPUploader;
