"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { SiamLogo } from "../ui/SiamLogo";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import {
  Bot,
  Sparkles,
  Trash2,
  Download,
  AlertCircle,
  Settings,
  MessageCircle,
  Zap,
  Brain,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Share,
  MoreHorizontal,
  LoaderIcon,
  ClockIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Import ALL AI SDK Elements for modern chat experience
import { Actions, Action } from "../ai-elements/actions";
import {
  Branch,
  BranchMessages,
  BranchSelector,
  BranchPrevious,
  BranchNext,
  BranchPage,
} from "../ai-elements/branch";
import { CodeBlock } from "../ai-elements/code-block";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { Image as AIImage } from "../ai-elements/image";
import { InlineCitation } from "../ai-elements/inline-citation";
import { Loader } from "../ai-elements/loader";
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from "../ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "../ai-elements/reasoning";
import { Response } from "../ai-elements/response";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "../ai-elements/source";
import { Suggestions, Suggestion } from "../ai-elements/suggestion";
import { Task, TaskTrigger, TaskContent, TaskItem } from "../ai-elements/task";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "../ai-elements/tool";
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from "../ai-elements/web-preview";
import { FileUpload } from "../ai-elements/file-upload";

interface AiSdkChatPanelProps {
  api?: string;
  initialMessages?: any[];
  className?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  onError?: (error: Error) => void;
  maxMessages?: number;
  systemPrompt?: string;
  enableAnimations?: boolean;
  enableWelcomeScreen?: boolean;
  theme?: "light" | "dark" | "auto";
  botAvatar?: string;
  userAvatar?: string;
  botName?: string;
  userName?: string;
}

export function AiSdkChatPanel({
  api = "/api/chat",
  initialMessages = [],
  className,
  title = "SIAM Intelligence",
  description = "Your AI-powered assistant, ready to help with anything",
  placeholder = "Message SIAM...",
  suggestions = [
    "Help me analyze this code",
    "Explain a complex concept",
    "Generate creative content",
    "Solve a technical problem",
    "Plan a project workflow",
    "Review and optimize",
  ],
  onError,
  maxMessages,
  systemPrompt,
  enableAnimations = true,
  enableWelcomeScreen = true,
  theme = "auto",
  botAvatar = undefined, // Let it use fallback initials
  userAvatar = undefined, // Let it use fallback initials
  botName = "AI",
  userName = "U",
}: AiSdkChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [showReasoning, setShowReasoning] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ fileId: string; filename: string }>
  >([]);
  const [currentProgress, setCurrentProgress] = useState<{
    phase: string;
    status: "pending" | "in-progress" | "completed" | "failed";
    title: string;
    progress?: number;
  } | null>(null);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Simpler loading state
  const [hasStartedStreaming, setHasStartedStreaming] = useState(false); // Track if response has started
  const [chatId] = useState<string>(() => {
    // Stable id for chat memory persistence - avoid hydration issues
    if (typeof window === "undefined") {
      return "siam-default";
    }

    const existingId = window.localStorage.getItem("siam.chatId");
    if (existingId) {
      return existingId;
    }

    const newId = crypto.randomUUID();
    window.localStorage.setItem("siam.chatId", newId);
    return newId;
  });

  const availableModels = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "claude-3-opus", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  ];

  const chatResult = useChat({
    api,
    id: chatId,
    initialMessages,
    body: {
      systemPrompt,
      model: selectedModel,
      enableReasoning: showReasoning,
    },
    onError: (err) => {
      console.error("Chat error:", err);
      console.log("Error type:", typeof err);
      console.log("Error keys:", Object.keys(err));

      // Parse the error message - check different possible structures
      const errorMessage = err.message || err.error?.message || err.toString();

      // Check for specific error types and show user-friendly messages
      if (
        errorMessage.includes("insufficient_quota") ||
        errorMessage.includes("exceeded your current quota")
      ) {
        toast.error("OpenAI API Quota Exceeded", {
          description:
            "The API key has reached its usage limit. Please check your OpenAI account billing or try again later.",
          duration: 6000,
        });
      } else if (errorMessage.includes("api_key")) {
        toast.error("Invalid API Key", {
          description: "Please check your OpenAI API key configuration.",
          duration: 5000,
        });
      } else if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch")
      ) {
        toast.error("Connection Error", {
          description:
            "Unable to connect to the AI service. Please check your internet connection.",
          duration: 5000,
        });
      } else {
        // Generic error message
        toast.error("Chat Error", {
          description: "Something went wrong. Please try again.",
          duration: 5000,
        });
      }

      onError?.(err);
    },
    onFinish: () => {
      // Clear progress indicator when response is complete
      setCurrentProgress(null);
      setManualLoading(false);
      setIsProcessing(false);
      setHasStartedStreaming(false); // Reset streaming state for next message
    },
  });

  const {
    messages = [],
    sendMessage,
    setMessages,
    regenerate,
    clearError,
    stop,
    error,
    status,
  } = chatResult || {};

  // Check if error exists and show toast
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || error.toString();

      if (
        errorMessage.includes("insufficient_quota") ||
        errorMessage.includes("exceeded your current quota")
      ) {
        toast.error("OpenAI API Quota Exceeded", {
          description:
            "The API key has reached its usage limit. Please check your OpenAI account billing or try again later.",
          duration: 6000,
        });
      } else {
        toast.error("Chat Error", {
          description:
            errorMessage || "Something went wrong. Please try again.",
          duration: 5000,
        });
      }
    }
  }, [error]);

  // Also check messages for error content (fallback for streaming errors)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Check if the last message contains an error indicator
      if (lastMessage?.content && typeof lastMessage.content === "string") {
        const content = lastMessage.content.toLowerCase();
        if (
          content.includes("insufficient_quota") ||
          content.includes("exceeded your current quota")
        ) {
          toast.error("OpenAI API Quota Exceeded", {
            description:
              "The API key has reached its usage limit. Please check your OpenAI account billing or try again later.",
            duration: 6000,
          });
        }
      }
    }
  }, [messages]);

  // Derive isLoading from status or manual loading state
  const isLoading = status === "loading" || manualLoading;

  // Clear progress when loading completes
  useEffect(() => {
    if (!isLoading && currentProgress) {
      // Small delay to show completion before clearing
      setTimeout(() => {
        setCurrentProgress(null);
      }, 1000);
    }
  }, [isLoading, currentProgress]);

  // Detect when assistant starts streaming (to prevent jitter)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // If last message is from assistant and we were processing, streaming has started
      if (
        lastMessage?.role === "assistant" &&
        (isProcessing || manualLoading)
      ) {
        setHasStartedStreaming(true);
        // Give a small delay then clear the loading states to prevent jitter
        setTimeout(() => {
          setManualLoading(false);
          setIsProcessing(false);
        }, 100);
      }
    }
  }, [messages, isProcessing, manualLoading]);

  // Create a local state for input since setInput might not exist in v5
  const [localInput, setLocalInput] = useState("");

  // Load dynamic suggestions from AOMA
  const loadDynamicSuggestions = async () => {
    if (suggestionsLoaded) return;

    try {
      const response = await fetch("/api/aoma/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query:
            "What are the top 6 most relevant AOMA topics users should ask about? Focus on recent features, common issues, and high-confidence areas. Format as concise questions.",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use suggestions from the API response
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setDynamicSuggestions(data.suggestions);
          setSuggestionsLoaded(true);
        }
      }
    } catch (error) {
      console.warn("Failed to load dynamic suggestions, using fallback");
      // Keep original suggestions as fallback
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
    // Persist messages for basic chat memory across reloads
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `siam.chat.${chatId}`,
          JSON.stringify(messages),
        );
      }
    } catch {}
  }, [messages, chatId]);

  // Restore messages on mount if present
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(`siam.chat.${chatId}`);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length > 0) {
            setMessages(saved);
          }
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dynamic suggestions on mount
  useEffect(() => {
    loadDynamicSuggestions();
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    if (typeof sendMessage === "function") {
      // Test toast - remove this after testing
      if (suggestion.includes("capabilities")) {
        toast.info("Test Toast", {
          description:
            "This is a test notification to verify Sonner is working.",
        });
      }
      sendMessage({
        role: "user",
        content: suggestion,
      });
    }
  };

  const handleClear = () => {
    setMessages([]);
    setLocalInput("");
    setShowSuggestions(true);
    setActiveTasks([]);
    setSources([]);
  };

  const handleExport = () => {
    const content = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siam-chat-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = localInput || "";
    if (messageToSend.trim() && typeof sendMessage === "function") {
      // Include uploaded files context if any
      let content = messageToSend;
      if (uploadedFiles.length > 0) {
        const filesList = uploadedFiles
          .map((f) => `- ${f.filename} (ID: ${f.fileId})`)
          .join("\n");
        content = `${messageToSend}\n\n[Attached files in AOMA knowledge base:\n${filesList}]`;
      }

      // Set BOTH loading states immediately for reliability
      setManualLoading(true);
      setIsProcessing(true);

      sendMessage({
        role: "user",
        content: content,
      });
      setLocalInput(""); // Clear the input after sending
    }
  };

  const handleFileUploadComplete = (fileId: string, filename: string) => {
    setUploadedFiles((prev) => [...prev, { fileId, filename }]);
    toast.success(`File "${filename}" is now available in AOMA knowledge base`);
  };

  const handleMessageAction = (action: string, messageId: string) => {
    switch (action) {
      case "copy":
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          navigator.clipboard.writeText(message.content);
        }
        break;
      case "retry":
        if (typeof regenerate === "function") {
          regenerate();
        }
        break;
      case "branch":
        setCurrentBranch(messageId);
        break;
    }
  };

  const renderMessage = (message: any, index: number) => {
    const isUser = message.role === "user";
    const isLastMessage = index === messages.length - 1;
    const messageVariants = {
      initial: { opacity: 0, y: 20, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -10, scale: 0.95 },
    };

    return (
      <motion.div
        key={message.id || index}
        variants={enableAnimations ? messageVariants : undefined}
        initial={enableAnimations ? "initial" : undefined}
        animate={enableAnimations ? "animate" : undefined}
        exit={enableAnimations ? "exit" : undefined}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Message from={message.role} className="group px-0 py-4">
          {/* Avatar */}
          <MessageAvatar
            src={isUser ? userAvatar || "" : botAvatar || ""}
            name={isUser ? userName : botName}
            className={cn(
              "ring-2 transition-all duration-200",
              isUser
                ? "ring-blue-200 dark:ring-blue-800"
                : "ring-emerald-200 dark:ring-emerald-800",
            )}
          />

          {/* Message Content */}
          <MessageContent
            className={cn(
              "relative backdrop-blur-sm border border-border/50 shadow-sm",
              "transition-all duration-200 hover:shadow-md",
              isUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                : "bg-background/80 hover:bg-background/90",
            )}
          >
            {/* Typing indicator for streaming */}
            {isLastMessage && isLoading && !isUser && (
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Loader type="dots" className="w-4 h-4" />
                <span className="text-xs">{botName} is thinking...</span>
              </div>
            )}

            {/* Reasoning display for AI messages */}
            {!isUser && showReasoning && message.reasoning && (
              <div className="mb-3">
                <Reasoning
                  defaultOpen={isLastMessage}
                  isStreaming={isLastMessage && isLoading}
                  className="border border-border/30 rounded-lg bg-muted/30 p-3"
                >
                  <ReasoningTrigger title="AI Reasoning Process" />
                  <ReasoningContent>{message.reasoning}</ReasoningContent>
                </Reasoning>
              </div>
            )}

            {/* Sources display for AI messages with citations */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mb-3">
                <Sources className="border border-border/30 rounded-lg bg-muted/20 p-3">
                  <SourcesTrigger count={message.sources.length} />
                  <SourcesContent>
                    {message.sources.map((source: any, idx: number) => (
                      <Source
                        key={idx}
                        href={source.url}
                        title={
                          source.title || source.name || `Source ${idx + 1}`
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      />
                    ))}
                  </SourcesContent>
                </Sources>
              </div>
            )}

            {/* Main message content with enhanced styling using Response component */}
            <div
              className={cn(
                "prose prose-sm max-w-none",
                isUser
                  ? "prose-invert [&>*]:text-white"
                  : "prose-invert [&>*]:text-zinc-100 [&>p]:text-zinc-100 [&>div]:text-zinc-100",
              )}
            >
              {/* Handle AI SDK v5 message parts or fallback to content */}
              {message.parts ? (
                message.parts.map((part: any, index: number) => {
                  if (part.type === "text") {
                    return (
                      <Response
                        key={index}
                        className={isUser ? "[&>*]:text-white" : ""}
                      >
                        {part.text}
                      </Response>
                    );
                  }

                  // Handle progress data parts
                  if (part.type === "data" && part.data?.type === "progress") {
                    const progressData = part.data;
                    return (
                      <div key={index} className="mt-4">
                        <Task className="border border-blue-200/50 rounded-lg bg-blue-50/20 p-3">
                          <TaskTrigger
                            title={progressData.title || "Processing..."}
                            status={progressData.status || "in_progress"}
                          />
                          <TaskContent>
                            <TaskItem>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm capitalize">
                                    {progressData.phase || "Processing"}
                                  </span>
                                  {progressData.progress !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {progressData.progress}%
                                    </span>
                                  )}
                                </div>
                                {progressData.progress !== undefined && (
                                  <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full transition-all duration-300"
                                      style={{
                                        width: `${Math.min(progressData.progress, 100)}%`,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </TaskItem>
                          </TaskContent>
                        </Task>
                      </div>
                    );
                  }

                  return null;
                })
              ) : (
                <Response className={isUser ? "[&>*]:text-white" : ""}>
                  {message.content || "No content available"}
                </Response>
              )}
            </div>

            {/* Show progress indicator for streaming AI responses */}
            {!isUser && isLoading && index === messages.length - 1 && (
              <div className="mt-4 space-y-3">
                <Task className="border border-blue-200/50 rounded-lg bg-blue-50/20 p-3">
                  <TaskTrigger
                    title="SIAM is processing your request..."
                    status="in_progress"
                  />
                  <TaskContent>
                    <TaskItem>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <LoaderIcon className="size-3 animate-spin text-blue-500" />
                          Querying AOMA knowledge base...
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <LoaderIcon className="size-3 animate-spin text-green-500" />
                          Processing with AI model...
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <LoaderIcon className="size-3 animate-spin text-purple-500" />
                          Generating response...
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <ClockIcon className="size-3" />
                          This usually takes 15-30 seconds
                        </div>
                      </div>
                    </TaskItem>
                  </TaskContent>
                </Task>
              </div>
            )}

            {/* Enhanced Code blocks */}
            {message.code && (
              <div className="mt-4">
                <CodeBlock
                  language={message.codeLanguage || "javascript"}
                  code={message.code}
                  className="rounded-lg border border-border/50 shadow-sm"
                />
              </div>
            )}

            {/* Enhanced Tool calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Zap className="w-4 h-4" />
                  Tool Executions
                </div>
                {message.toolCalls.map((tool: any, idx: number) => (
                  <Tool
                    key={idx}
                    className="border border-border/30 rounded-lg bg-muted/20"
                  >
                    <ToolHeader
                      type={tool.name || `Tool ${idx + 1}`}
                      state={
                        tool.status === "success"
                          ? "output-available"
                          : tool.status === "error"
                            ? "output-error"
                            : tool.status === "pending"
                              ? "input-streaming"
                              : "input-available"
                      }
                    />
                    <ToolContent>
                      {tool.input && <ToolInput input={tool.input} />}
                      <ToolOutput
                        output={tool.result}
                        errorText={
                          tool.error ||
                          (tool.status === "error"
                            ? "Tool execution failed"
                            : undefined)
                        }
                      />
                    </ToolContent>
                  </Tool>
                ))}
              </div>
            )}

            {/* Enhanced Task progress */}
            {message.tasks && message.tasks.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Brain className="w-4 h-4" />
                  Active Tasks
                </div>
                {message.tasks.map((task: any, idx: number) => (
                  <Task
                    key={idx}
                    className="border border-border/30 rounded-lg bg-muted/20 p-3"
                  >
                    <TaskTrigger title={task.title || `Task ${idx + 1}`} />
                    <TaskContent>
                      <TaskItem>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">
                            Status: {task.status || "pending"}
                          </span>
                          {task.progress !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {task.progress}%
                            </span>
                          )}
                        </div>
                        {task.progress !== undefined && (
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(task.progress, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {task.description}
                          </p>
                        )}
                      </TaskItem>
                    </TaskContent>
                  </Task>
                ))}
              </div>
            )}

            {/* Current Progress Indicator */}
            {!isUser && isLastMessage && isLoading && currentProgress && (
              <div className="mt-4">
                <div className="border border-border/30 rounded-lg bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-medium">
                        {currentProgress.title}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {currentProgress.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentProgress.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={cn("w-2 h-2 rounded-full", {
                        "bg-yellow-500 animate-pulse":
                          currentProgress.status === "in-progress",
                        "bg-green-500": currentProgress.status === "completed",
                        "bg-red-500": currentProgress.status === "failed",
                        "bg-muted-foreground":
                          currentProgress.status === "pending",
                      })}
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {currentProgress.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Web previews */}
            {message.webPreviews && message.webPreviews.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.webPreviews.map((preview: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border/50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-muted/20"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {preview.image && (
                          <img
                            src={preview.image}
                            alt={preview.title || "Preview"}
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground mb-1">
                            {preview.title || "Web Page"}
                          </h4>
                          {preview.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {preview.description}
                            </p>
                          )}
                          <a
                            href={preview.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {preview.url}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Images gallery */}
            {message.images && message.images.length > 0 && (
              <div className="mt-4">
                <div
                  className={cn(
                    "grid gap-3 rounded-lg overflow-hidden",
                    message.images.length === 1 ? "grid-cols-1" : "grid-cols-2",
                  )}
                >
                  {message.images.map((img: string, idx: number) => (
                    <AIImage
                      key={idx}
                      src={img}
                      alt={`Generated image ${idx + 1}`}
                      className="rounded-lg border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Message timestamp */}
            <div className="mt-3 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs opacity-60",
                  isUser ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {new Date(message.createdAt || Date.now()).toLocaleTimeString(
                  [],
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>

              {/* Message actions for assistant messages */}
              {!isUser && (
                <Actions className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Action
                    tooltip="Copy message"
                    onClick={() => handleMessageAction("copy", message.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Action>
                  <Action
                    tooltip="Regenerate response"
                    onClick={() => handleMessageAction("retry", message.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Action>
                  <Action
                    tooltip="TBD - Like response (coming soon)"
                    onClick={() => handleMessageAction("like", message.id)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Action>
                  <Action
                    tooltip="TBD - Dislike response (coming soon)"
                    onClick={() => handleMessageAction("dislike", message.id)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Action>
                  <Action
                    tooltip="TBD - Share message (coming soon)"
                    onClick={() => handleMessageAction("share", message.id)}
                  >
                    <Share className="h-4 w-4" />
                  </Action>
                  <Action
                    tooltip="TBD - More actions coming soon"
                    onClick={() => handleMessageAction("more", message.id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Action>
                </Actions>
              )}
            </div>

            {/* Branch selector for alternative responses */}
            {!isUser && message.branches && message.branches.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="border border-border/30 rounded-lg bg-muted/20 p-3">
                  <Branch
                    defaultBranch={0}
                    onBranchChange={(branchIndex) =>
                      console.log("Selected branch:", branchIndex)
                    }
                  >
                    <BranchSelector from="assistant" className="mb-2">
                      <BranchPrevious />
                      <BranchPage />
                      <BranchNext />
                    </BranchSelector>
                    <BranchMessages>
                      {message.branches.map((branch: any, idx: number) => (
                        <div
                          key={idx}
                          className="text-sm text-muted-foreground"
                        >
                          {branch.content || `Alternative response ${idx + 1}`}
                        </div>
                      ))}
                    </BranchMessages>
                  </Branch>
                </div>
              </motion.div>
            )}

            {/* TBD Branch indicator for future enhancement */}
            {currentBranch === message.id && !message.branches && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="border border-border/30 rounded-lg bg-muted/20 p-3 text-center">
                  <span
                    className="text-xs text-muted-foreground"
                    title="TBD - Branch functionality coming soon"
                  >
                    🔀 Branch alternatives (TBD)
                  </span>
                </div>
              </motion.div>
            )}
          </MessageContent>
        </Message>
      </motion.div>
    );
  };

  const isMaxMessagesReached = maxMessages
    ? messages.length >= maxMessages
    : false;

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-gradient-to-br from-background via-background to-muted/20",
        "backdrop-blur-sm",
        "overflow-hidden",
        className,
      )}
    >
      {/* Modern Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center gap-4">
            <SiamLogo size="sm" />
            <div>
              <h1 className="text-xl font-light text-white tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>

          {/* Control Panel */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs font-medium px-2 py-1"
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              {messages.length}
            </Badge>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleExport}
                    className="h-8 w-8 hover:bg-muted/50"
                    title="Export conversation"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    title="Clear conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowReasoning(!showReasoning)}
                className={cn(
                  "h-8 w-8 transition-colors",
                  showReasoning ? "bg-muted text-primary" : "hover:bg-muted/50",
                )}
                title={showReasoning ? "Hide reasoning" : "Show reasoning"}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent className="px-6 py-4">
            {messages.length === 0 && enableWelcomeScreen ? (
              /* Beautiful Welcome Screen */
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                {/* Hero Section */}
                <div className="relative mb-8">
                  <SiamLogo size="xl" className="mx-auto" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-8"
                >
                  <h2 className="text-4xl font-thin mb-3 text-white tracking-tight">
                    Welcome to the {title}
                  </h2>
                  <p className="text-lg font-light text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Ready to assist you with advanced AI capabilities, code
                    analysis, creative tasks, and intelligent problem-solving.
                    Again, don't be a dick.
                  </p>
                </motion.div>

                {/* Enhanced Suggestions */}
                {showSuggestions &&
                  (dynamicSuggestions.length > 0
                    ? dynamicSuggestions
                    : suggestions
                  ).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="w-full max-w-4xl"
                    >
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Try these to get started
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-w-3xl mx-auto w-full">
                        {(dynamicSuggestions.length > 0
                          ? dynamicSuggestions
                          : suggestions
                        ).map((suggestion, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.4 }}
                            className="w-full"
                          >
                            <Suggestion
                              suggestion={suggestion}
                              onClick={handleSuggestionClick}
                              className="w-full text-left justify-start hover:shadow-md hover:scale-105 transition-all duration-200 bg-gradient-to-r from-background to-muted/50 border border-border/50 backdrop-blur-sm h-auto whitespace-normal py-3 px-4"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
              </motion.div>
            ) : (
              /* Messages Area */
              <AnimatePresence>
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id || index}
                      layout={enableAnimations}
                      initial={enableAnimations ? { opacity: 0, y: 20 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      exit={enableAnimations ? { opacity: 0, y: -20 } : false}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {renderMessage(message, index)}
                    </motion.div>
                  ))}

                  {/* Enhanced Loading Indicator - More Prominent */}
                  {(isLoading || manualLoading || isProcessing) &&
                    !hasStartedStreaming && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex justify-start mb-6"
                      >
                        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg p-5 max-w-[85%] border border-blue-300/30 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex space-x-1">
                              <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2.5 h-2.5 bg-green-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-base font-medium">
                              🤖 SIAM is processing your request...
                            </span>
                          </div>

                          {/* Progress Steps */}
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                              <LoaderIcon className="w-4 h-4 animate-spin text-blue-400" />
                              <span className="text-sm">
                                Querying AOMA knowledge base
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <LoaderIcon className="w-4 h-4 animate-spin text-green-400" />
                              <span className="text-sm">
                                Processing with AI model
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <LoaderIcon className="w-4 h-4 animate-spin text-purple-400" />
                              <span className="text-sm">
                                Generating response
                              </span>
                            </div>
                          </div>

                          {/* Time Estimate */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-600">
                            <ClockIcon className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-gray-300">
                              This typically takes 30-45 seconds
                            </span>
                          </div>

                          {/* Skeleton Loading Animation */}
                          <div className="mt-4 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-4 w-3/5" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                </div>
              </AnimatePresence>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex items-center justify-center"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    clearError();
                    regenerate && regenerate();
                  }}
                  className="flex items-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <AlertCircle className="h-4 w-4" />
                  Retry last message
                </Button>
              </motion.div>
            )}

            {/* Max Messages Alert */}
            {isMaxMessagesReached && (
              <Alert className="mt-6 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-400">
                  Maximum message limit ({maxMessages}) reached. Start a new
                  conversation to continue.
                </AlertDescription>
              </Alert>
            )}
          </ConversationContent>

          {/* Scroll to Bottom Button */}
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Modern Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-border/50 bg-background/60 backdrop-blur-xl">
        <PromptInput
          onSubmit={handleFormSubmit}
          className="relative shadow-lg bg-background/80 border-border/50 hover:border-border transition-colors duration-200"
        >
          <PromptInputTextarea
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={
              isMaxMessagesReached ? "Message limit reached" : placeholder
            }
            disabled={isMaxMessagesReached || isLoading}
            className="resize-none border-0 bg-transparent focus:ring-0 placeholder:text-muted-foreground/60"
          />
          <PromptInputToolbar className="border-t border-border/30 bg-muted/20">
            <PromptInputTools className="gap-2">
              <FileUpload
                compact={true}
                assistantId="asst_VvOHL1c4S6YapYKun4mY29fM"
                onUploadComplete={handleFileUploadComplete}
                onUploadError={(error) =>
                  toast.error(`Upload failed: ${error}`)
                }
              />

              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isMaxMessagesReached || isLoading}
              >
                <PromptInputModelSelectTrigger className="h-8 bg-transparent border-border/50">
                  <PromptInputModelSelectValue />
                </PromptInputModelSelectTrigger>
                <PromptInputModelSelectContent>
                  {availableModels.map((model) => (
                    <PromptInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </PromptInputModelSelectItem>
                  ))}
                </PromptInputModelSelectContent>
              </PromptInputModelSelect>

              {uploadedFiles.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>{uploadedFiles.length} file(s) attached</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PromptInputTools>

            <PromptInputSubmit
              disabled={isMaxMessagesReached || !localInput?.trim()}
              status={isLoading ? "streaming" : undefined}
              className="h-8 px-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
