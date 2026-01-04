"use client";

import { useRef, useState, useCallback, KeyboardEvent } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Send,
  Paperclip,
  Mic,
  StopCircle,
  Image,
  FileText,
  X,
  Loader2,
  Sparkles,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Suggestions, Suggestion } from "../ai-elements/suggestion";
import { detectDDP, parseDDP } from "../../services/ddpParser";
import type { ParsedDDP } from "../../types/ddp";

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  allowAttachments?: boolean;
  allowVoice?: boolean;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  isRecording?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  onDDPDetected?: (ddp: ParsedDDP) => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isLoading = false,
  placeholder = "Type your message...",
  className,
  maxLength = 4000,
  allowAttachments = false,
  allowVoice = false,
  onVoiceStart,
  onVoiceEnd,
  isRecording = false,
  suggestions = [],
  onSuggestionClick,
  onDDPDetected,
}: ChatInputProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isParsingDDP, setIsParsingDDP] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (value?.trim() && !isLoading) {
      onSubmit(value, attachments.length > 0 ? attachments : undefined);
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if this looks like a DDP folder
    const detection = detectDDP(files);

    if (detection.isDDP && onDDPDetected) {
      // It's a DDP - parse it
      setIsParsingDDP(true);
      try {
        const parsed = await parseDDP(files);
        onDDPDetected(parsed);
      } catch (error) {
        console.error('Failed to parse DDP:', error);
        // Fall back to treating as regular attachments
        const newAttachments: Attachment[] = files
          .filter(f => f.size <= 20 * 1024 * 1024) // Skip large files
          .map((file) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
          }));
        setAttachments((prev) => [...prev, ...newAttachments]);
      } finally {
        setIsParsingDDP(false);
      }
    } else {
      // Regular attachments
      const newAttachments: Attachment[] = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }

    // Reset input so same files can be selected again
    if (e.target) e.target.value = '';
  }, [onDDPDetected]);

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-3", className)}>
        {/* Enhanced Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && isFocused && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 rounded-lg blur" />
              <div className="relative p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Quick suggestions
                  </span>
                </div>
                <Suggestions>
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Suggestion
                        suggestion={suggestion}
                        onClick={(s) => {
                          onChange(s);
                          onSuggestionClick?.(s);
                        }}
                        className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-background to-muted/30"
                      />
                    </motion.div>
                  ))}
                </Suggestions>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Attachments */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-lg blur" />
              <div className="relative p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Paperclip className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Attachments ({attachments.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <motion.div
                      key={attachment.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-2.5 pr-2 bg-background/80 border border-border/50 shadow-sm"
                      >
                        {getFileIcon(attachment.type)}
                        <span className="max-w-[120px] truncate text-xs">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground/70">
                          {formatFileSize(attachment.size)}
                        </span>
                        <button
                          onClick={() => removeAttachment(attachment.id)}
                          className="ml-2 p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Input Area */}
        <div className="relative group">
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />

          <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 group-focus-within:border-primary/50">
            <Textarea
              ref={textareaRef}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder={placeholder}
              disabled={isLoading || isRecording}
              maxLength={maxLength}
              rows={1}
              className={cn(
                "min-h-[60px] max-h-[200px] resize-none pr-20 border-0 bg-transparent",
                "focus:ring-0 focus:outline-none placeholder:text-muted-foreground/60",
                "text-sm leading-relaxed p-4",
                (isLoading || isRecording) && "opacity-50 cursor-not-allowed"
              )}
            />

            {/* Character Count */}
            {value && value.length > maxLength * 0.8 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-3 left-4"
              >
                <Badge
                  variant={value.length >= maxLength ? "destructive" : "secondary"}
                  className="text-xs px-2 py-0.5"
                >
                  {value.length} / {maxLength}
                </Badge>
              </motion.div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {/* Attachment Button - auto-detects DDP */}
              {allowAttachments && !isLoading && !isRecording && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 hover:bg-muted/50 transition-colors mac-button mac-button-outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsingDDP}
                      >
                        {isParsingDDP ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {onDDPDetected ? "Attach files (DDP auto-detected)" : "Attach files"}
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              {/* Voice Button */}
              {allowVoice && !isLoading && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant={isRecording ? "destructive" : "ghost"}
                      className={cn(
                        "mac-button mac-button-primary",
                        "h-9 w-9 transition-all duration-200",
                        isRecording ? "animate-pulse" : "hover:bg-muted/50"
                      )}
                      onClick={isRecording ? onVoiceEnd : onVoiceStart}
                    >
                      {isRecording ? (
                        <StopCircle className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Stop recording" : "Start voice input"}
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Enhanced Submit/Stop Button */}
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9 shadow-md hover:shadow-lg transition-shadow mac-button mac-button-primary"
                      onClick={onStop}
                    >
                      <StopCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      disabled={!value?.trim() || isRecording}
                      onClick={handleSubmit}
                      className={cn(
                        "mac-button mac-button-primary",
                        "h-9 w-9 shadow-md hover:shadow-lg transition-all duration-200",
                        "bg-gradient-to-r from-blue-500 to-emerald-500",
                        "hover:from-blue-600 hover:to-emerald-600",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        value?.trim() && !isRecording && "hover:scale-105"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Send message</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
