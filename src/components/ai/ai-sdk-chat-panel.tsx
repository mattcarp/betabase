"use client";

import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai"; // Removed - not available in current ai version
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { BetabaseLogo as SiamLogo } from "../ui/BetabaseLogo";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { useElevenLabsSTT } from "../../hooks/useElevenLabsSTT";
import { useElevenLabsVoice } from "../../hooks/useElevenLabsVoice";
import { VoiceSelector } from "../ui/VoiceSelector";
import {
  Sparkles,
  Trash2,
  Download,
  AlertCircle,
  Settings,
  MessageCircle,
  Zap,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Share,
  MoreHorizontal,
  LoaderIcon,
  ClockIcon,
  X,
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion, AnimatePresence } from "framer-motion";
// import { toast } from "sonner";
const toast = {
  success: (msg: string, options?: any) => {
    console.log("✅", msg);
    if (options?.description) console.log("  ", options.description);
  },
  error: (msg: string, options?: any) => {
    console.error("❌", msg);
    if (options?.description) console.error("  ", options.description);
  },
  info: (msg: string, options?: any) => {
    console.info("ℹ️", msg);
    if (options?.description) console.info("  ", options.description);
  },
};

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
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../ai-elements/reasoning";
import { Response } from "../ai-elements/response";
import { AOMAResponse } from "./AOMAResponse";
import { Sources, SourcesTrigger, SourcesContent, Source } from "../ai-elements/source";
import { Task, TaskTrigger, TaskContent, TaskItem } from "../ai-elements/task";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "../ai-elements/tool";
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
  conversationId?: string;
  onMessagesChange?: (messages: any[]) => void;
  enableAnimations?: boolean;
  enableWelcomeScreen?: boolean;
  showHeader?: boolean; // Controls header visibility to prevent UI overlap
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
  title = "The Betabase",
  description = "Your AI-powered assistant, ready to help with anything",
  placeholder = "Message The Betabase...",
  suggestions = [
    "Help me analyze this code",
    "Explain a complex concept",
    "Generate creative content",
    "Solve a technical problem",
    "Plan a project workflow",
    "Review and optimize",
  ],
  onError,
  conversationId,
  onMessagesChange,
  maxMessages,
  systemPrompt,
  enableAnimations = true,
  enableWelcomeScreen = true,
  showHeader = true,
  theme = "auto",
  botAvatar = undefined, // Let it use fallback initials
  userAvatar = undefined, // Let it use fallback initials
  botName = "AI",
  userName = "U",
}: AiSdkChatPanelProps) {
  console.log("🎯 AiSdkChatPanel: Component mounted with api:", api);
  console.log("🎤 Voice buttons should be rendering in PromptInputTools");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gpt-5");
  const [showReasoning, setShowReasoning] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileId: string; filename: string }>>(
    []
  );
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

  // Voice feature states - define before using in hooks
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState("21m00Tcm4TlvDq8ikWAM"); // Rachel as default

  // Voice integration hooks
  const {
    speak,
    stop: stopSpeaking,
    isPlaying,
    isLoading: isSpeechLoading,
  } = useElevenLabsVoice({
    voiceConfig: {
      voiceId: selectedVoiceId,
    },
    onError: (error) => {
      console.error("TTS Error:", error);
      toast.error(`Voice error: ${error.message}`);
    },
  });

  const {
    isRecording,
    transcript,
    interimTranscript,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useElevenLabsSTT({
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        // Set the final transcript as input
        setLocalInput(text);
      } else if (!isFinal && interimTranscript) {
        // Show interim transcript as preview
        setLocalInput(interimTranscript);
      }
    },
    onError: (error) => {
      console.error("STT Error:", error);
      toast.error(`Recording error: ${error.message}`);
    },
    continuous: false, // Push-to-talk mode
  });

  // Use conversationId prop or create fallback
  const chatId =
    conversationId ||
    (() => {
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
    })();

  const availableModels = [
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-5-mini", name: "GPT-5 Mini" },
    { id: "gpt-5-nano", name: "GPT-5 Nano" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "claude-3-opus", name: "Claude 3 Opus" },
    { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
  ];

  // Determine API endpoint based on selected model
  const getApiEndpoint = () => {
    // CRITICAL: ALL models (including GPT-5) MUST use AOMA-MESH-MCP orchestration
    // The /api/chat endpoint integrates with AOMA's LangChain orchestration
    // which brings together multiple knowledge sources (VITAL requirement per user)
    console.log("🎯 Using AOMA-MESH-MCP orchestrated endpoint for model:", selectedModel);

    // Never use vercel endpoint or bypass AOMA
    if (api && api !== "/api/chat-vercel" && api !== "/api/gpt5-responses" && api !== "") {
      // If a custom API is provided that's not Vercel or GPT5-direct, use it
      return api;
    }

    // ALWAYS use /api/chat for ALL models to ensure AOMA orchestration
    return "/api/chat";
  };

  // CRITICAL: Use the actual endpoint dynamically
  const currentApiEndpoint = getApiEndpoint();

  // Debug logging
  console.log("🎯 Chat configuration:", {
    selectedModel,
    currentApiEndpoint,
    shouldUseGPT5: selectedModel.toLowerCase().includes("gpt-5"),
    apiProp: api,
  });

  // Override fetch to ensure AOMA orchestration
  useEffect(() => {
    console.log("🎯 Ensuring AOMA orchestration for endpoint:", currentApiEndpoint);

    // CRITICAL: Override fetch to intercept wrong endpoints
    if (typeof window !== "undefined") {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        let url = args[0];
        const options = args[1];

        // Intercept and redirect wrong endpoints to ensure AOMA orchestration
        if (typeof url === "string") {
          // CRITICAL: ALL requests must go through AOMA-MESH-MCP (/api/chat)
          if (url === "/api/chat-vercel" || url === "/api/gpt5-responses") {
            console.log(`🚫 Intercepting endpoint that bypasses AOMA: ${url}`);
            console.log(`✅ Redirecting to AOMA-orchestrated endpoint: /api/chat`);
            url = "/api/chat";
            args[0] = url;
          }
        }

        return originalFetch.apply(this, args);
      };

      // Cleanup on unmount
      return () => {
        window.fetch = originalFetch;
      };
    }
  }, [currentApiEndpoint, selectedModel]);

  const chatResult = useChat({
    api: currentApiEndpoint, // Use the calculated endpoint directly (v5 still supports this)
    id: chatId,
    messages: (initialMessages || []).filter((m) => m.content != null && m.content !== ""), // CRITICAL: Filter null content
    onError: (err) => {
      console.error("Chat error:", err);
      console.log("Error type:", typeof err);
      console.log("Error keys:", Object.keys(err));

      // Clear progress interval if it exists
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
        (window as any).currentProgressInterval = null;
      }

      // Show error state in progress
      setCurrentProgress({
        phase: "error",
        status: "failed",
        title: "Request failed",
        progress: 0,
      });

      // Parse the error message - check different possible structures
      let errorMessage = err.message || (err as any).error?.message || err.toString();

      // Try to parse JSON error messages from AI SDK streaming errors
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.type) {
          errorMessage = parsedError.error.message || parsedError.error.type;
        }
      } catch (parseError) {
        // Not JSON, use original message
      }

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
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
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

      // Clear error state after showing
      setTimeout(() => {
        setCurrentProgress(null);
        setManualLoading(false);
        setIsProcessing(false);
      }, 3000);

      onError?.(err);
    },
    onFinish: () => {
      // Clear progress interval if it exists
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
        (window as any).currentProgressInterval = null;
      }

      // Show completion state briefly
      setCurrentProgress((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              progress: 100,
              title: "Response complete!",
            }
          : null
      );

      // Clear progress indicator after a delay
      setTimeout(() => {
        setCurrentProgress(null);
        setManualLoading(false);
        setIsProcessing(false);
        setHasStartedStreaming(false); // Reset streaming state for next message
      }, 1500);
    },
  });

  const {
    messages = [],
    input,
    setInput,
    handleSubmit: originalHandleSubmit,
    sendMessage: originalSendMessage,
    append,
    setMessages,
    regenerate,
    clearError,
    stop,
    error,
    status,
    isLoading: chatIsLoading,
  } = chatResult || {};

  // CRITICAL: Wrap sendMessage to validate content before sending
  const sendMessage = (message: any) => {
    if (!originalSendMessage) {
      console.error("[SIAM] sendMessage not available from useChat hook");
      return;
    }

    // AI SDK v5 uses 'text' property, older versions use 'content'
    const messageText = message?.text || message?.content;

    // Validate message has content
    if (!message || messageText == null || messageText === "") {
      console.error("[SIAM] Attempted to send message with null/empty content:", message);
      toast.error("Cannot send empty message");
      return;
    }

    // Ensure text is a string - AI SDK v5 format
    const validatedMessage = {
      ...message,
      text: String(messageText),
    };

    console.log("[SIAM] Sending validated message:", validatedMessage);
    return originalSendMessage(validatedMessage);
  };

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
          description: errorMessage || "Something went wrong. Please try again.",
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
      const messageContent = (lastMessage as any)?.content;
      if (messageContent && typeof messageContent === "string") {
        const content = messageContent.toLowerCase();
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

  // Derive isLoading from useChat isLoading, status, or manual loading state
  const isLoading = chatIsLoading || (status as any) === "loading" || manualLoading;

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
      if (lastMessage?.role === "assistant" && (isProcessing || manualLoading)) {
        setHasStartedStreaming(true);
        // Don't clear loading states immediately - let the progress indicator continue
        // The onFinish handler will clear everything when done
      }
    }
  }, [messages, isProcessing, manualLoading]);

  // Create a local state for input since setInput might not exist in v5
  const [localInput, setLocalInput] = useState("");

  // State for storing and displaying the last prompt
  const [lastPrompt, setLastPrompt] = useState<string>("");

  // Sync messages with conversation manager
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages, onMessagesChange]);

  // Auto-speak AI responses when TTS is enabled
  useEffect(() => {
    if (isTTSEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.content) {
        // Only speak if this is a new message (not during streaming)
        if (!isLoading) {
          speak(lastMessage.content);
        }
      }
    }
  }, [messages, isTTSEnabled, isLoading, speak]);

  // Update chatId when conversationId changes
  useEffect(() => {
    if (conversationId && chatId !== conversationId) {
      // Clear current messages when switching conversations
      setMessages([]);
    }
  }, [conversationId, chatId, setMessages]);

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
        "[data-radix-scroll-area-viewport]"
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
        window.localStorage.setItem(`siam.chat.${chatId}`, JSON.stringify(messages));
      }
    } catch {}
  }, [messages, chatId]);

  // Restore messages and last prompt on mount if present
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

        // Restore last prompt for this chat session
        const lastPromptRaw = window.localStorage.getItem(`siam.lastPrompt.${chatId}`);
        if (lastPromptRaw) {
          const savedPrompt = JSON.parse(lastPromptRaw);
          if (savedPrompt && savedPrompt.text && savedPrompt.timestamp) {
            // Only show prompts from the last 24 hours
            const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
            if (savedPrompt.timestamp > dayAgo) {
              setLastPrompt(savedPrompt.text);
            }
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
          description: "This is a test notification to verify Sonner is working.",
        });
      }

      // Set loading states for progress indicator
      setManualLoading(true);
      setIsProcessing(true);

      // Initialize progress tracking for suggestions with context-aware title
      const getProgressTitle = (message: string) => {
        // Extract key intent from the message for better task descriptions
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("code") || lowerMessage.includes("implement")) {
          return "Analyzing code requirements and preparing implementation strategy";
        } else if (
          lowerMessage.includes("fix") ||
          lowerMessage.includes("debug") ||
          lowerMessage.includes("error")
        ) {
          return "Diagnosing issues and formulating solutions";
        } else if (lowerMessage.includes("analyze") || lowerMessage.includes("review")) {
          return "Performing comprehensive analysis of your request";
        } else if (
          lowerMessage.includes("explain") ||
          lowerMessage.includes("what") ||
          lowerMessage.includes("how")
        ) {
          return "Researching and preparing detailed explanation";
        } else if (lowerMessage.includes("test") || lowerMessage.includes("verify")) {
          return "Setting up test scenarios and validation checks";
        } else if (lowerMessage.includes("optimize") || lowerMessage.includes("improve")) {
          return "Analyzing optimization opportunities and best practices";
        } else if (
          lowerMessage.includes("create") ||
          lowerMessage.includes("generate") ||
          lowerMessage.includes("build")
        ) {
          return "Designing architecture and generating components";
        } else {
          return "Understanding your request and preparing comprehensive response";
        }
      };

      const initialProgress = {
        phase: "initializing",
        status: "in-progress" as const,
        title: getProgressTitle(suggestion),
        progress: 5,
      };

      console.log("📊 Setting initial progress from suggestion:", initialProgress);
      setCurrentProgress(initialProgress);

      // Start progress simulation with more descriptive phases
      const progressInterval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (!prev || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }

          // Update progress based on phase with more descriptive titles
          let newProgress = prev.progress;
          let newPhase = prev.phase;
          let newTitle = prev.title;

          if (prev.progress < 20) {
            newProgress = prev.progress + 5;
            newPhase = "connecting";
            newTitle = "Establishing secure connection to AI service and validating credentials";
          } else if (prev.progress < 35) {
            newProgress = prev.progress + 3;
            newPhase = "parsing";
            newTitle = "Parsing your request and extracting key requirements";
          } else if (prev.progress < 50) {
            newProgress = prev.progress + 2.5;
            newPhase = "knowledge-search";
            newTitle = "Searching AOMA knowledge base for relevant information";
          } else if (prev.progress < 65) {
            newProgress = prev.progress + 2;
            newPhase = "context-building";
            newTitle = "Building context from project files and previous interactions";
          } else if (prev.progress < 80) {
            newProgress = prev.progress + 1.5;
            newPhase = "generating";
            newTitle = "Generating comprehensive response with AI model";
          } else {
            newProgress = Math.min(prev.progress + 1, 90);
            newPhase = "formatting";
            newTitle = "Formatting response with code blocks, citations, and structure";
          }

          return {
            ...prev,
            phase: newPhase,
            title: newTitle,
            progress: newProgress,
          };
        });
      }, 1000);

      // Store interval ID for cleanup
      (window as any).currentProgressInterval = progressInterval;

      // Store the prompt for display
      try {
        if (typeof window !== "undefined") {
          const promptData = {
            text: suggestion.trim(),
            timestamp: Date.now(),
          };
          window.localStorage.setItem(`siam.lastPrompt.${chatId}`, JSON.stringify(promptData));
          setLastPrompt(suggestion.trim());
        }
      } catch {}

      // Set input and trigger submit using AI SDK's built-in flow
      // Always set local input first
      setLocalInput(suggestion);

      // Try to use setInput if available (AI SDK v5 compatibility)
      if (typeof setInput === "function") {
        try {
          setInput(suggestion);
        } catch (err) {
          console.warn("[SIAM] setInput call failed, using fallback", err);
        }
      }

      // Use sendMessage as primary method (AI SDK v5)
      // This directly sends the message using AI SDK's sendMessage function
      setTimeout(() => {
        if (typeof sendMessage === "function") {
          sendMessage({ text: suggestion }); // v5 format
        } else if (typeof append === "function") {
          // Fallback to v4 append if sendMessage not available
          append({
            role: "user",
            content: suggestion,
          });
        } else {
          // Final fallback: trigger form submit
          const form = document.querySelector('form[data-chat-form="true"]') as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          } else {
            console.error("[SIAM] No message sending method available");
          }
        }
      }, 50);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setLocalInput("");
    setShowSuggestions(true);
    setActiveTasks([]);
    setSources([]);
    setLastPrompt(""); // Clear the last prompt display
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(`siam.lastPrompt.${chatId}`);
      }
    } catch {}
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = localInput || "";
    if (messageToSend.trim()) {
      // Debug logging for endpoint routing
      console.log("📨 Submitting message with:");
      console.log("  - Model:", selectedModel);
      console.log("  - Endpoint:", currentApiEndpoint);
      console.log("  - Chat ID:", chatId);

      // Include uploaded files context if any
      let content = messageToSend;
      if (uploadedFiles.length > 0) {
        const filesList = uploadedFiles.map((f) => `- ${f.filename} (ID: ${f.fileId})`).join("\n");
        content = `${messageToSend}\n\n[Attached files in AOMA knowledge base:\n${filesList}]`;
      }

      // Set BOTH loading states immediately for reliability
      setManualLoading(true);
      setIsProcessing(true);

      // Initialize progress tracking with more informative descriptions
      const getProgressTitle = (message: string) => {
        // Extract key intent from the message for better task descriptions
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes("code") || lowerMessage.includes("implement")) {
          return "Analyzing code requirements and preparing implementation strategy";
        } else if (
          lowerMessage.includes("fix") ||
          lowerMessage.includes("debug") ||
          lowerMessage.includes("error")
        ) {
          return "Diagnosing issues and formulating solutions";
        } else if (lowerMessage.includes("analyze") || lowerMessage.includes("review")) {
          return "Performing comprehensive analysis of your request";
        } else if (
          lowerMessage.includes("explain") ||
          lowerMessage.includes("what") ||
          lowerMessage.includes("how")
        ) {
          return "Researching and preparing detailed explanation";
        } else if (lowerMessage.includes("test") || lowerMessage.includes("verify")) {
          return "Setting up test scenarios and validation checks";
        } else if (lowerMessage.includes("optimize") || lowerMessage.includes("improve")) {
          return "Analyzing optimization opportunities and best practices";
        } else if (
          lowerMessage.includes("create") ||
          lowerMessage.includes("generate") ||
          lowerMessage.includes("build")
        ) {
          return "Designing architecture and generating components";
        } else {
          return "Understanding your request and preparing comprehensive response";
        }
      };

      const initialProgress = {
        phase: "initializing",
        status: "in-progress" as const,
        title: getProgressTitle(messageToSend),
        progress: 5,
      };

      console.log("📊 Setting initial progress:", initialProgress);
      setCurrentProgress(initialProgress);

      // More detailed progress simulation with context-aware phases
      const progressInterval = setInterval(() => {
        setCurrentProgress((prev) => {
          if (!prev || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }

          // Update progress based on phase with more descriptive titles
          let newProgress = prev.progress;
          let newPhase = prev.phase;
          let newTitle = prev.title;

          if (prev.progress < 20) {
            newProgress = prev.progress + 5;
            newPhase = "connecting";
            newTitle = "Establishing secure connection to AI service and validating credentials";
          } else if (prev.progress < 35) {
            newProgress = prev.progress + 3;
            newPhase = "parsing";
            newTitle = "Parsing your request and extracting key requirements";
          } else if (prev.progress < 50) {
            newProgress = prev.progress + 2.5;
            newPhase = "knowledge-search";
            newTitle = "Searching AOMA knowledge base for relevant information";
          } else if (prev.progress < 65) {
            newProgress = prev.progress + 2;
            newPhase = "context-building";
            newTitle = "Building context from project files and previous interactions";
          } else if (prev.progress < 80) {
            newProgress = prev.progress + 1.5;
            newPhase = "generating";
            newTitle = "Generating comprehensive response with AI model";
          } else {
            newProgress = Math.min(prev.progress + 1, 90);
            newPhase = "formatting";
            newTitle = "Formatting response with code blocks, citations, and structure";
          }

          return {
            ...prev,
            phase: newPhase,
            title: newTitle,
            progress: newProgress,
          };
        });
      }, 1000); // Update every second

      // Store interval ID for cleanup
      (window as any).currentProgressInterval = progressInterval;

      // Store the prompt for display as last prompt
      try {
        if (typeof window !== "undefined") {
          const promptData = {
            text: messageToSend.trim(),
            timestamp: Date.now(),
          };
          window.localStorage.setItem(`siam.lastPrompt.${chatId}`, JSON.stringify(promptData));
          setLastPrompt(messageToSend.trim());
        }
      } catch {}

      // Manually add the message to the messages array and let useChat handle the API call
      // This works around AI SDK v5's complex message submission patterns
      const newUserMessage = {
        id: `user-${Date.now()}`,
        role: "user" as const,
        content,
        createdAt: new Date(),
      };

      // Update messages array immediately for instant UI feedback
      setMessages([...messages, newUserMessage]);
      setLocalInput(""); // Clear the local input immediately

      // Now trigger the API call manually with the full messages array
      try {
        const response = await fetch(currentApiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, newUserMessage],
            model: selectedModel,
          }),
        });

        if (!response.ok) {
          // Handle rate limiting gracefully
          if (response.status === 429) {
            const rateLimitMessage =
              "⚠️ Rate limit reached. Please wait a moment before sending another message.";
            setMessages((prev) => [
              ...prev,
              {
                id: `error-${Date.now()}`,
                role: "assistant",
                content: rateLimitMessage,
                createdAt: new Date(),
              },
            ]);
            setManualLoading(false);
            setIsProcessing(false);
            return; // Don't throw error, just show message
          }
          throw new Error(`API error: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let assistantContent = "";
        const assistantMessageId = `assistant-${Date.now()}`;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            // Handle SSE format: "data: {json}"
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6); // Remove "data: " prefix
                if (jsonStr === "[DONE]") break; // End of stream marker

                const json = JSON.parse(jsonStr);

                // Handle text-delta events (streaming response chunks)
                if (json.type === "text-delta" && json.delta) {
                  assistantContent += json.delta;
                  // Update assistant message in real-time
                  setMessages((prev) => {
                    const withoutLastAssistant = prev.filter((m) => m.id !== assistantMessageId);
                    return [
                      ...withoutLastAssistant,
                      {
                        id: assistantMessageId,
                        role: "assistant" as const,
                        content: assistantContent,
                        createdAt: new Date(),
                      },
                    ];
                  });
                }
              } catch (parseError) {
                // Ignore JSON parse errors in streaming
              }
            }
          }
        }

        // Streaming complete - manually trigger completion logic
        // (onFinish callback doesn't fire for manual fetch streams)
        if ((window as any).currentProgressInterval) {
          clearInterval((window as any).currentProgressInterval);
          (window as any).currentProgressInterval = null;
        }

        setCurrentProgress((prev) =>
          prev
            ? {
                ...prev,
                status: "completed",
                progress: 100,
                title: "Response complete!",
              }
            : null
        );

        setTimeout(() => {
          setCurrentProgress(null);
          setManualLoading(false);
          setIsProcessing(false);
          setHasStartedStreaming(false);
        }, 1500);
      } catch (error: any) {
        console.error("[SIAM] Message send error:", error);
        toast.error(`Failed to send message: ${error.message || "Unknown error"}`);
        setManualLoading(false);
        setIsProcessing(false);
        // Remove the optimistically added user message on error
        setMessages(messages);
      }
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
          const messageContent = (message as any).content || "";
          navigator.clipboard.writeText(messageContent);
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
              isUser ? "ring-blue-200 dark:ring-blue-800" : "ring-emerald-200 dark:ring-emerald-800"
            )}
          />

          {/* Message Content */}
          <MessageContent
            className={cn(
              "relative backdrop-blur-sm border border-border/50 shadow-sm",
              "transition-all duration-200 hover:shadow-md",
              isUser
                ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                : "bg-background/80 hover:bg-background/90"
            )}
          >
            {/* Typing indicator for streaming */}
            {isLastMessage && isLoading && !isUser && (
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Loader className="w-4 h-4" />
                <span className="text-xs">{botName} is thinking...</span>
              </div>
            )}

            {/* Reasoning display for AI messages */}
            {!isUser && showReasoning && message.reasoning && (
              <div className="mb-4">
                <Reasoning
                  defaultOpen={isLastMessage}
                  isStreaming={isLastMessage && isLoading}
                  className="border border-border/30 rounded-lg bg-muted/30 p-4"
                >
                  <ReasoningTrigger title="AI Reasoning Process" />
                  <ReasoningContent>{message.reasoning}</ReasoningContent>
                </Reasoning>
              </div>
            )}

            {/* Sources display for AI messages with citations */}
            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mb-4">
                <Sources className="border border-border/30 rounded-lg bg-muted/20 p-4">
                  <SourcesTrigger count={message.sources.length} />
                  <SourcesContent>
                    {message.sources.map((source: any, idx: number) => (
                      <Source
                        key={idx}
                        href={source.url}
                        title={source.title || source.name || `Source ${idx + 1}`}
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
                  : "prose-invert [&>*]:text-zinc-100 [&>p]:text-zinc-100 [&>div]:text-zinc-100"
              )}
            >
              {/* Handle AI SDK v5 message parts or fallback to content */}
              {message.parts ? (
                message.parts.map((part: any, index: number) => {
                  if (part.type === "text") {
                    // Check if this is an AOMA response with sources
                    const hasAOMAMarkers = /\[\d+\]/.test(part.text);
                    const aomaMetadata = message.metadata?.aoma;

                    if (!isUser && (hasAOMAMarkers || aomaMetadata?.sources)) {
                      return (
                        <AOMAResponse
                          key={index}
                          content={part.text}
                          sources={aomaMetadata?.sources || aomaMetadata?.formattedSources}
                          metadata={aomaMetadata?.metadata}
                        />
                      );
                    }

                    return (
                      <Response key={index} className={isUser ? "[&>*]:text-white" : ""}>
                        {part.text}
                      </Response>
                    );
                  }

                  // Handle progress data parts
                  if (part.type === "data" && part.data?.type === "progress") {
                    const progressData = part.data;
                    return (
                      <div key={index} className="mt-4">
                        <Task className="border border-blue-200/50 rounded-lg bg-blue-50/20 p-4">
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
                  {(message as any).content || "No content available"}
                </Response>
              )}
            </div>

            {/* PERFORMANCE FIX: REMOVED DUPLICATE PROGRESS INDICATOR - Now only rendered once at line 1538 */}

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
                  <Tool key={idx} className="border border-border/30 rounded-lg bg-muted/20">
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
                          (tool.status === "error" ? "Tool execution failed" : undefined)
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
                  <CheckCircle className="w-4 h-4" />
                  Active Tasks
                </div>
                {message.tasks.map((task: any, idx: number) => (
                  <Task key={idx} className="border border-border/30 rounded-lg bg-muted/20 p-4">
                    <TaskTrigger title={task.title || `Task ${idx + 1}`} />
                    <TaskContent>
                      <TaskItem>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Status: {task.status || "pending"}</span>
                          {task.progress !== undefined && (
                            <span className="text-xs text-muted-foreground">{task.progress}%</span>
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
                          <p className="text-xs text-muted-foreground mt-2">{task.description}</p>
                        )}
                      </TaskItem>
                    </TaskContent>
                  </Task>
                ))}
              </div>
            )}

            {/* PERFORMANCE FIX: REMOVED ANOTHER DUPLICATE PROGRESS INDICATOR */}

            {/* Enhanced Web previews */}
            {message.webPreviews && message.webPreviews.length > 0 && (
              <div className="mt-4 space-y-3">
                {message.webPreviews.map((preview: any, idx: number) => (
                  <div
                    key={idx}
                    className="border border-border/50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-muted/20"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        {preview.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={preview.image}
                            alt={preview.title || "Preview"}
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <h4
                            c
                            className="mac-title"
                            lassName="mac-title text-sm font-medium text-foreground mb-2"
                          >
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
                    "grid gap-4 rounded-lg overflow-hidden",
                    message.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
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
            <div className="mt-4 flex items-center justify-between">
              <span
                className={cn(
                  "text-xs opacity-60",
                  isUser ? "text-white/70" : "text-muted-foreground"
                )}
              >
                {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
                className="mt-4"
              >
                <div className="border border-border/30 rounded-lg bg-muted/20 p-4">
                  <Branch
                    defaultBranch={0}
                    onBranchChange={(branchIndex) => console.log("Selected branch:", branchIndex)}
                  >
                    <BranchSelector from="assistant" className="mb-2">
                      <BranchPrevious />
                      <BranchPage />
                      <BranchNext />
                    </BranchSelector>
                    <BranchMessages>
                      {message.branches.map((branch: any, idx: number) => (
                        <div key={idx} className="text-sm text-muted-foreground">
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
                className="mt-4"
              >
                <div className="border border-border/30 rounded-lg bg-muted/20 p-4 text-center">
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

  const isMaxMessagesReached = maxMessages ? messages.length >= maxMessages : false;

  return (
    <div
      className={cn("flex flex-col flex-1 min-h-0", "bg-zinc-950", "overflow-hidden", className)}
    >
      {/* Modern Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-background/60 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center gap-4">
              <SiamLogo size="sm" />
              <div>
                <h1
                  c
                  className="mac-heading"
                  lassName="mac-heading text-xl font-light text-white tracking-tight"
                >
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium px-2 py-2">
                <MessageCircle className="w-3 h-3 mr-2" />
                {messages.length}
              </Badge>

              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExport}
                      className="h-8 w-8 hover:bg-muted/50 mac-button mac-button-outline"
                      title="Export conversation"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClear}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive mac-button mac-button-outline"
                      title="Clear conversation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  className="mac-button mac-button-outline"
                  variant="ghost"
                  className="mac-button mac-button-outline"
                  size="icon"
                  onClick={() => setShowReasoning(!showReasoning)}
                  className={cn(
                    "h-8 w-8 transition-colors",
                    showReasoning ? "bg-muted text-primary" : "hover:bg-muted/50"
                  )}
                  title={showReasoning ? "Hide reasoning" : "Show reasoning"}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-950">
        <Conversation className="bg-zinc-950">
          <ConversationContent className="px-6 py-4 pb-8 bg-zinc-950">
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
                  <h2
                    c
                    className="mac-heading"
                    lassName="mac-heading text-4xl font-thin mb-4 text-white tracking-tight"
                  >
                    Welcome to The Betabase
                  </h2>
                  <p className="text-lg font-light text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Ready to assist you with advanced AI capabilities, code analysis, creative
                    tasks, and intelligent problem-solving. Again, don't be a dick.
                  </p>
                </motion.div>

                {/* Enhanced Suggestions */}
                {showSuggestions &&
                  (dynamicSuggestions.length > 0 ? dynamicSuggestions : suggestions).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="w-full max-w-4xl"
                    >
                      <div className="mb-4">
                        <h3
                          c
                          className="mac-title"
                          lassName="mac-title text-sm font-medium text-muted-foreground mb-4 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Try these to get started
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
                        {(dynamicSuggestions.length > 0 ? dynamicSuggestions : suggestions).map(
                          (suggestion, index) => (
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
                                className="w-full text-left justify-start hover:shadow-md hover:scale-105 transition-all duration-200 bg-zinc-800/50 border border-zinc-700/50 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 hover:text-white backdrop-blur-sm h-auto whitespace-normal py-4 px-4"
                              />
                            </motion.div>
                          )
                        )}
                      </div>
                    </motion.div>
                  )}
              </motion.div>
            ) : (
              /* Messages Area */
              <AnimatePresence>
                <div className="space-y-6">
                  {/* Enhanced Loading Indicator with Progress Bar - MOVED TO TOP */}
                  {(isLoading || manualLoading || isProcessing || currentProgress) &&
                    !hasStartedStreaming &&
                    (console.log("🔄 Rendering progress indicator:", {
                      isLoading,
                      manualLoading,
                      isProcessing,
                      hasCurrentProgress: !!currentProgress,
                      currentProgress,
                      hasStartedStreaming,
                    }) || (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex justify-start mb-6"
                      >
                        <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-lg p-6 max-w-[85%] border border-blue-300/30 shadow-lg">
                          {/* Main Loading Header */}
                          <div className="flex items-center gap-4 mb-4">
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
                              🤖{" "}
                              {currentProgress?.title ||
                                "The Betabase is processing your request..."}
                            </span>
                          </div>

                          {/* Progress Bar if available */}
                          {currentProgress && (
                            <div className="mb-4">
                              <div className="flex justify-between text-xs mb-2">
                                <span className="capitalize">{currentProgress.phase}</span>
                                <span>{Math.round(currentProgress.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all duration-500",
                                    currentProgress.status === "failed"
                                      ? "bg-red-500"
                                      : currentProgress.status === "completed"
                                        ? "bg-green-500"
                                        : "bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"
                                  )}
                                  style={{ width: `${currentProgress.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Progress Steps - Show all phases with current one highlighted */}
                          <div className="space-y-2.5">
                            {/* Phase 1: Connection */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "connecting"
                                  ? "opacity-100"
                                  : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "connecting" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-blue-400" />
                              ) : currentProgress?.progress && currentProgress.progress > 20 ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Establishing secure connection to AI service
                              </span>
                            </div>

                            {/* Phase 2: Parsing */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "parsing" ? "opacity-100" : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "parsing" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-yellow-400" />
                              ) : currentProgress?.progress && currentProgress.progress > 35 ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Parsing request and extracting requirements
                              </span>
                            </div>

                            {/* Phase 3: Knowledge Search */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "knowledge-search"
                                  ? "opacity-100"
                                  : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "knowledge-search" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-green-400" />
                              ) : currentProgress?.progress && currentProgress.progress > 50 ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Searching AOMA knowledge base for context
                              </span>
                            </div>

                            {/* Phase 4: Context Building */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "context-building"
                                  ? "opacity-100"
                                  : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "context-building" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-purple-400" />
                              ) : currentProgress?.progress && currentProgress.progress > 65 ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Building context from previous interactions
                              </span>
                            </div>

                            {/* Phase 5: Generating */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "generating"
                                  ? "opacity-100"
                                  : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "generating" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-indigo-400" />
                              ) : currentProgress?.progress && currentProgress.progress > 80 ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Generating AI response with selected model
                              </span>
                            </div>

                            {/* Phase 6: Formatting */}
                            <div
                              className={cn(
                                "flex items-center gap-4 transition-opacity duration-300",
                                currentProgress?.phase === "formatting"
                                  ? "opacity-100"
                                  : "opacity-40"
                              )}
                            >
                              {currentProgress?.phase === "formatting" ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-cyan-400" />
                              ) : currentProgress?.status === "completed" ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <ClockIcon className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="text-sm">
                                Formatting response with proper structure
                              </span>
                            </div>
                          </div>

                          {/* Time Estimate */}
                          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-600">
                            <ClockIcon className="w-4 h-4 text-amber-400" />
                            <span className="text-sm text-gray-300">
                              {currentProgress?.status === "in-progress" &&
                              currentProgress?.progress
                                ? `Estimated time remaining: ${Math.max(5, Math.round((100 - currentProgress.progress) / 3))} seconds`
                                : "This typically takes 30-45 seconds"}
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
                    ))}

                  {/* Messages rendered AFTER progress indicator */}
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
                  className="mac-button mac-button-outline"
                  variant="outline"
                  className="mac-button mac-button-outline"
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
                  Maximum message limit ({maxMessages}) reached. Start a new conversation to
                  continue.
                </AlertDescription>
              </Alert>
            )}
          </ConversationContent>

          {/* Scroll to Bottom Button */}
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Modern Input Area */}
      <div className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-zinc-800/50 bg-zinc-950 relative">
        {/* Real-Time Transcription Display */}
        {(isRecording || interimTranscript || transcript) && (
          <div className="mb-4 p-4 bg-black/30 rounded-lg backdrop-blur-sm border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                {isRecording && (
                  <div className="mt-2 flex flex-col gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-400 rounded-full mac-audio-bar"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-2">
                  {isRecording ? "Listening..." : "Transcription"}
                </div>
                <div className="text-sm text-white">
                  {transcript && <span className="text-white/90">{transcript}</span>}
                  {interimTranscript && (
                    <span className="text-white/50 italic ml-2">{interimTranscript}</span>
                  )}
                  {!transcript && !interimTranscript && isRecording && (
                    <span className="text-white/30 italic">Start speaking...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice buttons moved to form section below for better integration */}
        {/* Duplicate buttons removed - see MAC-styled versions in form below */}

        <PromptInput
          onSubmit={handleFormSubmit}
          className="relative shadow-lg"
          data-chat-form="true"
        >
          <PromptInputTextarea
            value={localInput}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalInput(newValue);
              if (typeof setInput === "function") {
                setInput(newValue);
              }
            }}
            placeholder={isMaxMessagesReached ? "Message limit reached" : placeholder}
            disabled={isMaxMessagesReached || isLoading}
            className="resize-none border-0 bg-transparent focus:ring-0 placeholder:text-muted-foreground/60"
          />
          {/* Last prompt reminder - moved above toolbar */}
          {lastPrompt && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground bg-muted/30 border border-border/30 rounded-md mb-2">
              <MessageCircle className="h-3 w-3 flex-shrink-0" />
              <span className="text-xs opacity-75">Last:</span>
              <span className="truncate flex-1 font-medium">{lastPrompt}</span>
              <Button
                className="mac-button mac-button-outline"
                variant="ghost"
                className="mac-button mac-button-outline"
                size="sm"
                onClick={() => {
                  setLastPrompt("");
                  try {
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem(`siam.lastPrompt.${chatId}`);
                    }
                  } catch {}
                }}
                className="h-4 w-4 p-0 hover:bg-destructive/20 opacity-60 hover:opacity-100 flex-shrink-0"
                title="Clear last prompt reminder"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          <PromptInputToolbar className="border-t border-zinc-800/50 bg-zinc-900/30">
            <PromptInputTools className="gap-2">
              <FileUpload
                compact={true}
                assistantId="asst_VvOHL1c4S6YapYKun4mY29fM"
                onUploadComplete={handleFileUploadComplete}
                onUploadError={(error) => toast.error(`Upload failed: ${error}`)}
              />

              {/* Voice Input Button (Push-to-Talk) */}
              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                className={cn(
                  "mac-button mac-button-primary",
                  "!h-8 !w-8 !p-0 transition-all duration-300 relative overflow-visible shrink-0",
                  isRecording
                    ? [
                        "bg-gradient-to-r from-red-500 to-red-600",
                        "border-red-400/50 shadow-[0_0_20px_rgba(239,68,68,0.6)]",
                        "text-white",
                        "animate-pulse",
                      ]
                    : ["hover:bg-zinc-800/50 hover:border-zinc-700"]
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  console.log("🎤 VOICE: Starting recording");
                  clearTranscript();
                  startRecording();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  console.log("🎤 VOICE: Stopping recording");
                  stopRecording();
                }}
                onMouseLeave={() => {
                  if (isRecording) {
                    console.log("🎤 VOICE: Mouse left button - stopping recording");
                    stopRecording();
                  }
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  clearTranscript();
                  startRecording();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopRecording();
                }}
                disabled={isLoading}
                title={isRecording ? "Release to stop recording" : "Hold to record"}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4 text-white" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isRecording && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse border border-white" />
                )}
              </Button>

              {/* TTS Toggle Button */}
              <Button
                type="button"
                variant={isTTSEnabled ? "default" : "ghost"}
                className={cn(
                  "mac-button mac-button-primary",
                  "!h-8 !w-8 !p-0 transition-all duration-300 relative overflow-visible shrink-0",
                  isTTSEnabled
                    ? [
                        "bg-gradient-to-r from-emerald-500/80 to-teal-600/80",
                        "border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
                      ]
                    : ["hover:bg-zinc-800/50 hover:border-zinc-700"]
                )}
                onClick={() => {
                  setIsTTSEnabled(!isTTSEnabled);
                  if (isPlaying) {
                    stopSpeaking();
                  }
                  toast.info(isTTSEnabled ? "Voice responses disabled" : "Voice responses enabled");
                }}
                disabled={isLoading || isSpeechLoading}
                title={isTTSEnabled ? "Disable voice responses" : "Enable voice responses"}
              >
                {isTTSEnabled ? (
                  <Volume2 className="h-4 w-4 text-white" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse border border-white" />
                )}
              </Button>

              {/* Voice Selection Dropdown */}
              {isTTSEnabled && (
                <VoiceSelector
                  selectedVoiceId={selectedVoiceId}
                  onVoiceSelect={setSelectedVoiceId}
                  disabled={isLoading || isSpeechLoading}
                  className="ml-2"
                />
              )}

              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isMaxMessagesReached || isLoading}
              >
                <PromptInputModelSelectTrigger className="!h-8 !w-[100px] !px-2 !text-xs bg-transparent border-zinc-700/50 shrink-0 !shadow-none [&.mac-shimmer]:animate-none">
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{uploadedFiles.length} file(s) attached</span>
                  <Button
                    className="mac-button mac-button-outline"
                    variant="ghost"
                    className="mac-button mac-button-outline"
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
              shimmer={false}
              className="!h-8 !w-8 !p-0 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 shrink-0"
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
