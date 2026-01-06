"use client";

import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai"; // Removed - not available in current ai version
import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { cn } from "../../lib/utils";
import { getMessageContent } from "../../lib/conversation-store";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import { BetabaseLogo as SiamLogo } from "../ui/BetabaseLogo";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useGeminiLive } from "../../hooks/useGeminiLive";
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
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Search,
  FileSearch,
  Brain,
  Lightbulb,
  CornerDownLeft,
  Square,
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
// 6 Zeitgeist-style default suggestions
const DEFAULT_SUGGESTIONS = [
  "What are the latest updates in the AOMA architecture?",
  "How do I implement the new Gemini 3.0 Flash features?",
  "Show me the current test coverage metrics.",
  "Help me debug a complex React rendering issue.",
  "Which components are violating the MAC Design System?",
  "Generate a performance report for the last deployment."
];

// Import ALL AI SDK Elements for modern chat experience
import { Actions, Action } from "../ai-elements/actions";
import {
  Branch,
  BranchMessages,
  BranchSelector,
} from "../ai-elements/branch"; // Correct module path
import { Suggestions, Suggestion } from "../ai-elements/suggestion";
import { Task, TaskTrigger, TaskContent, TaskItem } from "../ai-elements/task";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import { Image as AIImage } from "../ai-elements/image";
import { Loader } from "../ai-elements/loader";
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
// Use dynamic imports to prevent circular dependencies
const PromptInput = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInput),
  { ssr: false }
);
const PromptInputTextarea = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputTextarea),
  { ssr: false }
);
const PromptInputToolbar = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputToolbar),
  { ssr: false }
);
const PromptInputTools = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputTools),
  { ssr: false }
);
const PromptInputSubmit = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputSubmit),
  { ssr: false }
);
const PromptInputModelSelect = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputModelSelect),
  { ssr: false }
);
const PromptInputModelSelectTrigger = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputModelSelectTrigger),
  { ssr: false }
);
const PromptInputModelSelectContent = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputModelSelectContent),
  { ssr: false }
);
const PromptInputModelSelectItem = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputModelSelectItem),
  { ssr: false }
);
const PromptInputModelSelectValue = dynamic(
  () => import("../ai-elements/prompt-input").then((mod) => mod.PromptInputModelSelectValue),
  { ssr: false }
);
import { Reasoning, ReasoningTrigger, ReasoningContent } from "../ai-elements/reasoning";
import { Response } from "../ai-elements/response";
// Dynamic import for AOMAResponse to avoid cycles
const AOMAResponse = dynamic(() => import("./AOMAResponse").then((mod) => mod.AOMAResponse), {
  loading: () => <div className="p-4"><div className="animate-pulse h-4 w-3/4 bg-muted rounded"></div></div>,
});
import { Sources, SourcesTrigger, SourcesContent, Source } from "../ai-elements/source";
// Demo Enhancement Components for visibility during demos
import {
  HeroMetricsStrip,
  useDemoMode,
  RAGContextViewer,
  ConfidenceBadge,
  DiagramOffer,
  useDiagramOffer,
} from "./demo-enhancements";
// Dynamic import for DemoMode
const DemoMode = dynamic(() => import("./demo-enhancements").then((mod) => mod.DemoMode), {
  ssr: false,
});

import { FeedbackSegueDialog } from "./FeedbackSegueDialog";

// import { DiagramOffer, useDiagramOffer } from "./demo-enhancements/DiagramOffer";

/*
// Local stub to bypass build error
const useDiagramOffer = () => ({
  shouldOffer: false,
  offerDiagram: () => {},
  dismissOffer: () => {},
  cancelOffer: () => {},
});
const DiagramOffer = () => null;
*/

import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "../ai-elements/tool";
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from "../ai-elements/web-preview";
import { FileUpload } from "../ai-elements/file-upload";

// AI Elements - Previously installed but not used (now implementing)
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSpinner,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "../ai-elements/chain-of-thought";
import { Shimmer } from "../ai-elements/shimmer";
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
} from "../ai-elements/context";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactActions,
  ArtifactAction,
  ArtifactClose,
  ArtifactContent,
} from "../ai-elements/artifact";
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
} from "../ai-elements/queue";
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
  PlanAction,
} from "../ai-elements/plan";
// Workflow/React Flow components for experimental System Diagrams and Agent Execution Visualizer
import { Canvas } from "../ai-elements/canvas";
import { Node, NodeHeader, NodeTitle, NodeContent } from "../ai-elements/node";
import { Controls } from "../ai-elements/controls";
import { Edge } from "../ai-elements/edge";
import { ReactFlowProvider } from "@xyflow/react";
import { DDPDisplay } from "../ddp/DDPDisplay";
import { getTrackOffsets, getLeadoutOffset } from "../../services/ddpParser";
import { lookupFromDDP, calculateDiscId } from "../../services/musicBrainz";
import type { ParsedDDP } from "../../types/ddp";
import type { MusicBrainzLookupResult } from "../../services/musicBrainz";

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
  const [selectedModel, setSelectedModel] = useState("gemini-3-flash-preview");
  const [showReasoning, setShowReasoning] = useState(true);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [activeTasks, setActiveTasks] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ fileId: string; filename: string }>>(
    []
  );
  // DDP parsing state
  const [parsedDDP, setParsedDDP] = useState<ParsedDDP | null>(null);
  const [ddpMusicBrainz, setDdpMusicBrainz] = useState<MusicBrainzLookupResult | null>(null);
  const [isLoadingMusicBrainz, setIsLoadingMusicBrainz] = useState(false);

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
  const expectedAssistantMessagesRef = useRef(0); // Track expected count for new response detection
  const [loadingSeconds, setLoadingSeconds] = useState(0); // Track seconds elapsed during loading
  const [pendingRagMetadata, setPendingRagMetadata] = useState<any>(null); // RAG metadata from response headers

  // Chain of Thought thinking steps for enhanced loading indicator
  type ThinkingStep = {
    label: string;
    status: "complete" | "active" | "pending";
    description?: string;
  };
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  // Context token usage tracking for visualization
  const [tokenUsage, setTokenUsage] = useState<{
    usedTokens: number;
    maxOutputTokens: number;
    inputTokens: number;
    outputTokens: number;
  }>({
    usedTokens: 0,
    maxOutputTokens: 128000, // Default for Gemini 1.5 Flash
    inputTokens: 0,
    outputTokens: 0,
  });

  // Detect if current query is a planning-type request
  const [isPlanningQuery, setIsPlanningQuery] = useState(false);
  // Detect if current query is a diagram/architecture request (EXPERIMENTAL)
  const [isDiagramQuery, setIsDiagramQuery] = useState(false);
  // Detect if current query triggers multi-tool agent execution (EXPERIMENTAL)
  const [isAgentQuery, setIsAgentQuery] = useState(false);
  const [messageDurations, setMessageDurations] = useState<Record<string, number>>(() => {
    // Initialize from sessionStorage to survive remounts
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("siam_message_durations");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  }); // Duration per message ID

  // Use window object for refs that need to survive remounts
  const getQueryStartTime = () => (window as any).__siamQueryStartTime as number | null;
  const setQueryStartTime = (time: number | null) => {
    (window as any).__siamQueryStartTime = time;
  };
  const getPendingDuration = () => (window as any).__siamPendingDuration as number | null;
  const setPendingDuration = (duration: number | null) => {
    (window as any).__siamPendingDuration = duration;
  };

  // RLHF Feedback tracking
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "up" | "down" | null>>({});
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackDialogProps, setFeedbackDialogProps] = useState<{
    userQuery: string;
    aiResponse: string;
    messageId: string;
  } | null>(null);
  
  const supabase = useSupabaseClient();

  // Demo Enhancement hooks for video recording
  const demoMode = useDemoMode();
  const diagramOffer = useDiagramOffer();
  // const diagramOffer = { shouldOffer: false, offerDiagram: () => {}, dismissOffer: () => {}, isGenerating: false, startBackgroundGeneration: () => {} }; // Mock

  // Gemini Live Hook - Voice integration (STT + TTS via Gemini 2.5 Flash)
  const {
      connect: connectGeminiLive,
      disconnect: disconnectGeminiLive,
      startRecording: startGeminiRecording,
      stopRecording: stopGeminiRecording,
      isRecording: isGeminiRecording,
      isPlaying: isGeminiPlaying,
      isConnected: isGeminiConnected,
      isMuted: isGeminiMuted,
      setIsMuted: setIsGeminiMuted
  } = useGeminiLive({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "", 
      // Pass the selected model directly. The hook will map it to a Live-compatible ID if needed.
      model: selectedModel,
      onConnectionStatusChange: (status) => {
          if (status === "connected") {
              toast.success("Connected to Gemini Live");
          } else if (status === "disconnected") {
              // toast.info("Disconnected from Gemini Live");
          } else if (status === "error") {
              toast.error("Gemini Live connection error");
          }
      },
      onError: (err) => {
          toast.error(`Gemini Live Error: ${err.message}`);
      }
  });
  
  // Debug: Gemini Live status
  console.log("🎤 Gemini Live:", { isGeminiConnected, isGeminiRecording, isGeminiPlaying, isGeminiMuted });

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
    // Gemini models (primary)
    { id: "gemini-3-flash-preview", name: "Gemini 3.0 Flash Preview" },
    { id: "gemini-3-pro-preview", name: "Gemini 3.0 Pro Preview" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (2M context)" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
  ];

  // Determine API endpoint based on selected model
  const getApiEndpoint = () => {
    // ALL models use /api/chat with Supabase vector search for RAG
    console.log("🎯 Using Supabase vector RAG for model:", selectedModel);

    // Never use vercel endpoint or bypass RAG
    if (api && api !== "/api/chat-vercel" && api !== "/api/gpt5-responses" && api !== "") {
      // If a custom API is provided that's not Vercel or GPT5-direct, use it
      return api;
    }

    // ALWAYS use /api/chat for ALL models to ensure RAG context
    return "/api/chat";
  };

  // CRITICAL: Use the actual endpoint dynamically
  const currentApiEndpoint = getApiEndpoint();

  // Debug log for endpoint configuration (only on mount or when endpoint changes)
  useEffect(() => {
    console.log("🎯 Chat initialized:", {
      selectedModel,
      endpoint: currentApiEndpoint,
      modelProvider: selectedModel.startsWith("gemini-") ? "Google Gemini" : "OpenAI/Claude",
    });
  }, [currentApiEndpoint, selectedModel]); // Only log when endpoint or model changes

  const chatResult = useChat({
    // @ts-ignore - AI SDK v5 still supports api option but types haven't caught up
    api: currentApiEndpoint, // Use the calculated endpoint directly
    id: chatId,
    messages: (initialMessages || []).filter((m) => {
      // CRITICAL: Filter null content - support both AI SDK v4 (content) and v5/v6 (parts) formats
      const content = getMessageContent(m);
      return content != null && content !== "";
    }),
    // Pass selected model to API - this enables the model selector to actually work
    body: {
      model: selectedModel,
    },
    onResponse: (response: Response) => {
      // Capture RAG metadata from response headers before streaming starts
      const ragMetadataHeader = response.headers.get("X-RAG-Metadata");
      if (ragMetadataHeader) {
        try {
          const metadata = JSON.parse(ragMetadataHeader);
          console.log("📊 Captured RAG metadata from headers:", metadata);
          setPendingRagMetadata(metadata);
        } catch (e) {
          console.warn("Failed to parse RAG metadata header:", e);
        }
      }
    },
    onError: (err) => {
      // Network failures are expected during rapid navigation/tests - fail silently
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        return;
      }
      console.warn("Chat error:", err);
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
      const lowerError = errorMessage.toLowerCase();
      
      if (
        lowerError.includes("insufficient_quota") ||
        lowerError.includes("exceeded your current quota") ||
        lowerError.includes("429")
      ) {
        const providerName = selectedModel.includes("gemini") ? "Google Gemini" : "OpenAI";
        toast.error(`${providerName} Quota Exceeded`, {
          description: `The ${providerName} API key has reached its usage limit or does not have access to this model.`,
          duration: 6000,
        });
      } else if (lowerError.includes("api_key") || lowerError.includes("config_error")) {
        toast.error("Configuration Error", {
          description: "API Key or service configuration is missing. Please check your settings.",
          duration: 5000,
        });
      } else if (lowerError.includes("authentication") || lowerError.includes("401") || lowerError.includes("unauthorized")) {
        toast.error("Authentication Failed", {
          description: "Your session may have expired. Please refresh the page or sign in again.",
          duration: 5000,
        });
      } else if (lowerError.includes("network") || lowerError.includes("fetch")) {
        toast.error("Connection Error", {
          description:
            "Unable to connect to the AI service. Please check your internet connection.",
          duration: 5000,
        });
      } else {
        // Generic error message with details
        toast.error("Chat Error", {
          description: errorMessage || "Something went wrong. Please try again.",
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
      // Calculate and store response duration
      const startTime = getQueryStartTime();
      if (startTime) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log(`[SIAM] Response completed in ${duration}s`);
        setQueryStartTime(null);
        // Store duration in window - will be picked up by isLoading watcher
        setPendingDuration(duration);
      }

      // Clear progress interval if it exists
      if ((window as any).currentProgressInterval) {
        clearInterval((window as any).currentProgressInterval);
        (window as any).currentProgressInterval = null;
      }

      // Immediately clear loading states
      setCurrentProgress(null);
      setManualLoading(false);
      setIsProcessing(false);
      setHasStartedStreaming(false); // Reset streaming state for next message

      // Note: Don't clear pendingRagMetadata here - it's needed for display
      // It will be cleared when a new response starts via onResponse

      // CRITICAL FIX: Clear input field after response completes
      setLocalInput("");
      if (typeof setInput === "function") {
        try {
          setInput("");
        } catch (err) {
          console.warn("[SIAM] setInput clear failed", err);
        }
      }
    },
  });

  // Destructure values from chatResult to restore functionality
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatIsLoading,
    stop,
    append,
    reload,
    setInput,
    status,
    error,
    sendMessage, // AI SDK v5 uses sendMessage instead of append
  } = chatResult as any;


  /* 
  // Redundant useEffect removed - onError callback handles notifications
  useEffect(() => {
    if (error) { ... }
  }, [error]);
  */

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

  // Derive isLoading from useChat status (AI SDK v6 removed isLoading, use status instead)
  // Status values: 'submitted' (waiting), 'streaming' (receiving), 'ready', 'error'
  const isLoading = chatIsLoading || status === "submitted" || status === "streaming" || manualLoading;

  // Detect when assistant ACTUALLY starts streaming content for a NEW response
  // We only hide the chain of thought when we SEE NEW assistant content, not just status change
  useEffect(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    const currentAssistantCount = assistantMessages.length;

    // Only trigger when we have MORE assistant messages than expected (new response started)
    if (
      currentAssistantCount > expectedAssistantMessagesRef.current &&
      (isProcessing || manualLoading || status === "streaming")
    ) {
      const lastAssistant = assistantMessages[assistantMessages.length - 1];
      // Wait for actual content to appear
      if (lastAssistant?.content && lastAssistant.content.length > 0) {
        setHasStartedStreaming(true);
      }
    }
  }, [messages, isProcessing, manualLoading, status]);

  // Track loading time with seconds counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if ((isLoading || manualLoading || isProcessing) && !hasStartedStreaming) {
      // Reset counter when loading starts
      setLoadingSeconds(0);

      // Start counting every second
      interval = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Reset counter when loading stops
      setLoadingSeconds(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, manualLoading, isProcessing, hasStartedStreaming]);

  // Update thinking steps based on loading progress
  useEffect(() => {
    if ((isLoading || manualLoading || isProcessing) && !hasStartedStreaming) {
      // Progressive thinking steps based on elapsed time
      const steps: ThinkingStep[] = [];

      if (loadingSeconds >= 0) {
        steps.push({
          label: "Understanding your question...",
          status: loadingSeconds >= 2 ? "complete" : "active",
          description: "Analyzing intent and context",
        });
      }

      if (loadingSeconds >= 2) {
        steps.push({
          label: "Searching knowledge base...",
          status: loadingSeconds >= 5 ? "complete" : "active",
          description: "Querying AOMA documentation and tickets",
        });
      }

      if (loadingSeconds >= 5) {
        steps.push({
          label: "Retrieving relevant documents...",
          status: loadingSeconds >= 8 ? "complete" : "active",
          description: "Fetching sources and citations",
        });
      }

      if (loadingSeconds >= 8) {
        steps.push({
          label: "Synthesizing response...",
          status: "active",
          description: "Generating comprehensive answer",
        });
      }

      setThinkingSteps(steps);
    } else {
      // Clear steps when not loading
      setThinkingSteps([]);
    }
  }, [loadingSeconds, isLoading, manualLoading, isProcessing, hasStartedStreaming]);

  // Track previous isLoading state to detect when streaming completes
  const prevIsLoadingRef = useRef(isLoading);

  // Assign pending duration when isLoading transitions from true to false
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current;
    prevIsLoadingRef.current = isLoading;

    // Check if streaming just completed (isLoading went from true to false)
    if (wasLoading && !isLoading) {
      // Small delay to ensure messages state is updated
      setTimeout(() => {
        const pendingDuration = getPendingDuration();
        if (pendingDuration != null && messages.length > 0) {
          // Find the latest assistant message
          const latestAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
          if (latestAssistantMsg?.id && !messageDurations[latestAssistantMsg.id]) {
            setMessageDurations((prev) => {
              const updated = {
                ...prev,
                [latestAssistantMsg.id]: pendingDuration,
              };
              // Persist to sessionStorage
              if (typeof window !== "undefined") {
                sessionStorage.setItem("siam_message_durations", JSON.stringify(updated));
              }
              return updated;
            });
            console.log(`[SIAM] Assigned ${pendingDuration}s duration to message ${latestAssistantMsg.id}`);
            setPendingDuration(null);
          }
        }
      }, 100);
    }
  }, [isLoading, messages, messageDurations]);

  // Estimate token usage from messages for Context visualization
  // Rough estimate: ~4 characters per token for English text
  useEffect(() => {
    if (messages.length > 0) {
      let inputTokens = 0;
      let outputTokens = 0;

      messages.forEach((msg) => {
        const content = typeof msg.content === "string" ? msg.content : (msg.content ? JSON.stringify(msg.content) : "");
        const estimatedTokens = Math.ceil((content?.length || 0) / 4);

        if (msg.role === "user") {
          inputTokens += estimatedTokens;
        } else if (msg.role === "assistant") {
          outputTokens += estimatedTokens;
        }
      });

      setTokenUsage({
        usedTokens: inputTokens + outputTokens,
        maxOutputTokens: 128000, // Gemini context window
        inputTokens,
        outputTokens,
      });
    }
  }, [messages]);

  // Create a local state for input since setInput might not exist in v5
  const [localInput, setLocalInput] = useState("");

  // State for storing and displaying the last prompt
  const [lastPrompt, setLastPrompt] = useState<string>("");

  // CRITICAL FIX: Sync AI SDK input state back to localInput
  // This ensures when AI SDK clears input after sending, our local state updates too
  useEffect(() => {
    if (input !== undefined && input !== localInput) {
      setLocalInput(input);
    }
  }, [input]);

  // Sync messages with conversation manager
  // NOTE: onMessagesChange is excluded from deps to prevent loops if parent updates state
  useEffect(() => {
    if (onMessagesChange && messages.length > 0) {
      onMessagesChange(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Update chatId when conversationId changes
  // NOTE: setMessages is intentionally excluded from deps - it's stable and including it causes infinite loops
  useEffect(() => {
    if (conversationId && chatId !== conversationId) {
      // Clear current messages when switching conversations
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, chatId]);

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
    // Hide suggestions panel
    setShowSuggestions(false);

    // INSERT-ONLY behavior: populate input field, let user submit when ready
    const trimmedSuggestion = suggestion.trim();

    // Set local input state
    setLocalInput(trimmedSuggestion);

    // Also set AI SDK input state
    if (typeof setInput === "function") {
      try {
        setInput(trimmedSuggestion);
      } catch (err) {
        console.warn("[SIAM] setInput failed", err);
      }
    }

    // Focus the input field so user can edit or submit
    setTimeout(() => {
      const inputElement = document.querySelector(
        'textarea[placeholder*="Ask me anything"]'
      ) as HTMLTextAreaElement;
      if (inputElement) {
        inputElement.focus();
        // Move cursor to end of text
        inputElement.setSelectionRange(trimmedSuggestion.length, trimmedSuggestion.length);
      }
    }, 50);
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

  const handleFormSubmit = async (message: { text: string; files: any[] }, e: React.FormEvent) => {
    e.preventDefault();
    const messageToSend = message.text || localInput || "";
    if (messageToSend.trim()) {
      // CRITICAL: Reset streaming state BEFORE starting new message
      // This ensures chain of thought shows for subsequent questions
      setHasStartedStreaming(false);

      // Track the current number of assistant messages so we can detect when a NEW one appears
      const currentAssistantCount = messages.filter((m) => m.role === "assistant").length;
      expectedAssistantMessagesRef.current = currentAssistantCount;

      // Track query start time for duration calculation
      setQueryStartTime(Date.now());

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
          if (!prev || (prev.progress || 0) >= 90) {
            clearInterval(progressInterval);
            return prev;
          }

          // Update progress based on phase with more descriptive titles
          let newProgress = prev.progress || 0;
          let newPhase = prev.phase;
          let newTitle = prev.title;

          if ((prev.progress || 0) < 20) {
            newProgress = (prev.progress || 0) + 5;
            newPhase = "connecting";
            newTitle = "Establishing secure connection to AI service and validating credentials";
          } else if ((prev.progress || 0) < 35) {
            newProgress = (prev.progress || 0) + 3;
            newPhase = "parsing";
            newTitle = "Parsing your request and extracting key requirements";
          } else if ((prev.progress || 0) < 50) {
            newProgress = (prev.progress || 0) + 2.5;
            newPhase = "knowledge-search";
            newTitle = "Searching AOMA knowledge base for relevant information";
          } else if ((prev.progress || 0) < 65) {
            newProgress = (prev.progress || 0) + 2;
            newPhase = "context-building";
            newTitle = "Building context from project files and previous interactions";
          } else if ((prev.progress || 0) < 80) {
            newProgress = (prev.progress || 0) + 1.5;
            newPhase = "generating";
            newTitle = "Generating comprehensive response with AI model";
          } else {
            newProgress = Math.min((prev.progress || 0) + 1, 90);
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

      // Clear local input immediately
      setLocalInput("");

      // Use the AI SDK's sendMessage function (v6 API)
      // This properly handles the streaming response format
      try {
        if (typeof sendMessage === "function") {
          // AI SDK v6 uses sendMessage({ text: string }) signature
          await sendMessage({ text: content });
        } else if (typeof append === "function") {
          // Fallback to legacy append for older AI SDK versions
          await append({
            role: "user",
            content,
          });
        } else {
          console.error("Neither sendMessage nor append available from useChat");
          throw new Error("Chat API not properly initialized");
        }

        // Streaming complete - manually trigger completion logic
        // (onFinish callback should handle this, but we add fallback)
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

        // Clear progress on error
        if ((window as any).currentProgressInterval) {
          clearInterval((window as any).currentProgressInterval);
          (window as any).currentProgressInterval = null;
        }
        setCurrentProgress(null);
      }
    }
  };

  const handleFileUploadComplete = (fileId: string, filename: string) => {
    setUploadedFiles((prev) => [...prev, { fileId, filename }]);
    toast.success(`File "${filename}" is now available in AOMA knowledge base`);
  };

  // DDP parsing handler - receives already-parsed DDP from FileUpload
  const handleDDPDetected = useCallback(async (parsed: ParsedDDP) => {
    setParsedDDP(parsed);
    setDdpMusicBrainz(null);
    toast.success(`DDP parsed: ${parsed.summary.trackCount} tracks found`);

    // Look up MusicBrainz in the background
    setIsLoadingMusicBrainz(true);
    try {
      let discId: string | undefined;
      if (parsed.pqEntries.length > 0) {
        const offsets = getTrackOffsets(parsed.pqEntries);
        const leadout = getLeadoutOffset(parsed.pqEntries);
        if (offsets.length > 0 && leadout > 0) {
          discId = await calculateDiscId(1, offsets.length, leadout, offsets);
        }
      }

      const isrcs = parsed.tracks
        .map(t => t.isrc)
        .filter((isrc): isrc is string => !!isrc);

      const mbResult = await lookupFromDDP({
        discId,
        barcode: parsed.summary.upc,
        isrcs,
        artist: parsed.cdText?.albumPerformer,
        title: parsed.cdText?.albumTitle,
      });

      setDdpMusicBrainz(mbResult);
    } catch (error) {
      console.error('MusicBrainz lookup failed:', error);
    } finally {
      setIsLoadingMusicBrainz(false);
    }
  }, []);

  const clearDDP = useCallback(() => {
    setParsedDDP(null);
    setDdpMusicBrainz(null);
  }, []);

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

  // RLHF Feedback Handler
  const handleFeedback = async (messageId: string, type: "up" | "down") => {
    if (feedbackGiven[messageId]) {
      toast.info("Feedback already recorded for this message");
      return;
    }

    try {
      // Find the message to get content and metadata
      const message = messages.find((m) => m.id === messageId);
      if (!message) {
        console.error("Message not found:", messageId);
        return;
      }

      // Extract message content
      const messageContent = message.parts?.[0]?.text || (message as any).content || "";

      // Find the user query (previous message)
      const messageIndex = messages.findIndex((m) => m.id === messageId);
      const userQuery =
        messageIndex > 0
          ? messages[messageIndex - 1].parts?.[0]?.text ||
            (messages[messageIndex - 1] as any).content ||
            ""
          : "";

      // Store feedback in database
      const { error } = await supabase.from("rlhf_feedback").insert({
        conversation_id: conversationId || `session_${Date.now()}`,
        user_query: userQuery,
        ai_response: messageContent,
        rating: type === "up" ? 5 : 1,
        thumbs_up: type === "up",
        feedback_text: null,
        documents_marked: message.ragMetadata || null,
        user_email: null, // Will be set by RLS policy from auth user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Failed to save feedback:", error);
        toast.error("Failed to save feedback. Please try again.");
        return;
      }

      // Update local state
      setFeedbackGiven((prev) => ({ ...prev, [messageId]: type }));

      // Show success message or open dialog
      if (type === "up") {
        toast.success("Feedback recorded! Thank you! 💜");
      } else {
        // Prepare data for dialog
        setFeedbackDialogProps({
          userQuery,
          aiResponse: messageContent,
          messageId
        });
        setShowFeedbackDialog(true);
      }
    } catch (err) {
      console.error("Error saving feedback:", err);
      toast.error("Failed to save feedback");
    }
  };

  const handleFeedbackDialogSubmit = async (feedbackText: string) => {
    if (!feedbackDialogProps) return;
    
    try {
      // Update the feedback record with text
      const { error } = await supabase
        .from("rlhf_feedback")
        .update({ 
          feedback_text: feedbackText,
          updated_at: new Date().toISOString()
        })
        .eq("ai_response", feedbackDialogProps.aiResponse) // Best effort match - ideally use ID returned from insert
        .eq("user_query", feedbackDialogProps.userQuery);
        
      if (error) throw error;
      
      toast.success("Detailed feedback saved to curation queue");
    } catch (err) {
      console.error("Error updating feedback details:", err);
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
                  : "prose-invert [&>*]:text-foreground [&>p]:text-foreground [&>div]:text-foreground"
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

            {/* RAG Metadata - Enhanced Demo Components */}
            {(() => {
              // Use message's ragMetadata or pendingRagMetadata for last assistant message
              const ragMeta =
                message.ragMetadata || (isLastMessage && !isUser ? pendingRagMetadata : null);
              if (!ragMeta || isUser) return null;

              return (
                <div className="space-y-3 mt-4 pt-3 border-t border-border/30">
                  {/* Confidence Badge with Tooltip */}
                  <div className="flex items-center gap-3">
                    <ConfidenceBadge
                      confidence={ragMeta.confidence || 0.75}
                      sourceCount={ragMeta.finalDocs || ragMeta.documentsUsed || 0}
                      strategy={ragMeta.strategy || "standard"}
                      showTooltip={true}
                    />
                    {ragMeta.timeMs && (
                      <Badge
                        variant="outline"
                        className="bg-muted/10 border-border/30 text-muted-foreground text-xs"
                      >
                        {ragMeta.timeMs}ms
                      </Badge>
                    )}
                  </div>

                  {/* RAG Context Viewer - Expandable Details */}
                  <RAGContextViewer
                    strategy={ragMeta.strategy || "standard"}
                    documents={ragMeta.documents || []}
                    totalVectors={45399}
                    searchTimeMs={ragMeta.timeMs}
                    reranked={ragMeta.documentsReranked}
                    initialDocs={ragMeta.initialDocs}
                    finalDocs={ragMeta.finalDocs}
                    agentSteps={ragMeta.agentSteps}
                    defaultOpen={false}
                  />
                </div>
              );
            })()}

            {/* HITL Feedback Buttons - Thumbs Up/Down */}
            {!isUser && (
              <div className="flex gap-2 mt-3">
                <Button variant="ghost" className="mac-button mac-button-outline"
                  size="sm"
                  onClick={() => handleFeedback(message.id, "up")}
                  disabled={feedbackGiven[message.id] !== undefined}
                  data-testid="thumbs-up"
                  className={cn(
                    "h-7 px-2 transition-colors",
                    feedbackGiven[message.id] === "up"
                      ? "text-green-400 bg-green-500/20"
                      : "hover:bg-green-500/10 hover:text-green-400"
                  )}
                  title="This response was helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" className="mac-button mac-button-outline"
                  size="sm"
                  onClick={() => handleFeedback(message.id, "down")}
                  disabled={feedbackGiven[message.id] !== undefined}
                  data-testid="thumbs-down"
                  className={cn(
                    "h-7 px-2 transition-colors",
                    feedbackGiven[message.id] === "down"
                      ? "text-red-400 bg-red-500/20"
                      : "hover:bg-red-500/10 hover:text-red-400"
                  )}
                  title="This response needs improvement"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Diagram Offer - Non-blocking "Would you like a diagram?" */}
            {!isUser && isLastMessage && !isLoading && (
              <DiagramOffer
                shouldOffer={true}
                onAccept={() => {
                  diagramOffer.offerDiagram();
                  // In a real app, this would append a message or trigger detailed view
                }}
                onDismiss={diagramOffer.dismissOffer}
                isGenerating={diagramOffer.isGenerating}
              />
            )}

            {/* Active Diagram Display */}
            {diagramOffer.status === "viewing" && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 border rounded-lg overflow-hidden bg-black/30 border-white/10"
                >
                    <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <span className="text-sm font-normal text-white flex items-center gap-2">
                           <div className="h-4 w-4">🕸️</div> AOMA Architecture
                        </span>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </div>
                    <div className="p-8 flex justify-center items-center bg-black/50 aspect-video">
                        <div className="text-center space-y-4">
                            <div className="flex items-center justify-center gap-4 text-white/50 text-xs font-mono">
                                <div className="p-2 border border-white/20 rounded">Client</div>
                                <div>➜</div>
                                <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded text-blue-300">AOMA API</div>
                                <div>➜</div>
                                <div className="p-2 border border-primary-500/50 bg-primary-500/10 rounded text-primary-300">Vector DB</div>
                            </div>
                            <p className="text-muted-foreground text-xs mt-4">Interactive Diagram Visualization Loaded</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* PERFORMANCE FIX: REMOVED DUPLICATE PROGRESS INDICATOR - Now only rendered once at line 1538 */}

            {/* Enhanced Code blocks wrapped in Artifact container */}
            {message.code && (
              <div className="mt-4" data-slot="artifact" data-testid="artifact">
                <Artifact className="border-border/50">
                  <ArtifactHeader className="ArtifactHeader">
                    <div className="flex items-center gap-2">
                      <ArtifactTitle>{message.codeLanguage || "Code"}</ArtifactTitle>
                    </div>
                    <ArtifactActions>
                      <ArtifactAction
                        icon={Copy}
                        tooltip="Copy code"
                        aria-label="copy"
                        onClick={() => {
                          navigator.clipboard.writeText(message.code || "");
                          toast.success("Code copied to clipboard");
                        }}
                      />
                    </ArtifactActions>
                  </ArtifactHeader>
                  <ArtifactContent className="p-0">
                    <CodeBlock
                      language={message.codeLanguage || "javascript"}
                      code={message.code}
                      className="rounded-none border-0 shadow-none"
                    />
                  </ArtifactContent>
                </Artifact>
              </div>
            )}

            {/* Enhanced Tool calls */}
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
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
                <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
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
                          <h4 className="mac-title">
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
            <div className="mt-4 flex items-center justify-between relative">
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
                {/* Show duration for assistant messages */}
                {!isUser && messageDurations[message.id] !== undefined && (
                  <span className="ml-2 text-emerald-500/80">
                    ({messageDurations[message.id] >= 60
                      ? `${Math.floor(messageDurations[message.id] / 60)}m ${messageDurations[message.id] % 60}s`
                      : `${messageDurations[message.id]}s`})
                  </span>
                )}
              </span>

              {/* Message actions for assistant messages */}
              {!isUser && (
                <Actions className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
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
      className={cn("flex flex-col flex-1 min-h-0", "bg-background", "overflow-hidden", className)}
    >
      {/* Modern Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="flex-shrink-0 px-6 py-4 border-b border-border/50 bg-background/60 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center gap-4">
              <SiamLogo size="sm" />
              <div>
                <h1 className="mac-heading">
                  {title}
                </h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-normal px-2 py-2">
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
                <Button variant="ghost" className="mac-button mac-button-outline"
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

      {/* Hero Metrics Strip - Show RAG stats at a glance (always visible for demo) */}
      <HeroMetricsStrip
        vectorCount={26568}
        embeddingModel="Gemini"
        avgLatencyMs={pendingRagMetadata?.timeMs || 280}
        compact={true}
        className="flex-shrink-0"
      />

      {/* Main Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-background">
        <Conversation className="bg-background">
          <ConversationContent className="px-6 py-4 pb-8 bg-background">
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
                  <h2 className="mac-heading">
                    Welcome to The Betabase
                  </h2>
                  <p className="text-lg font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    AI-Powered Intelligence Platform
                  </p>
                </motion.div>

                {/* Enhanced Suggestions - Restored Zeitgeist Bubbles */}
                {showSuggestions &&
                  (dynamicSuggestions.length > 0 ? dynamicSuggestions : suggestions).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="w-full max-w-4xl"
                    >
                      <div className="mb-4">
                        <h3 className="mac-title">
                          <Sparkles className="w-4 h-4" />
                          Try these to get started
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
                        {(suggestions.length > 0 ? suggestions : (dynamicSuggestions.length > 0 ? dynamicSuggestions : DEFAULT_SUGGESTIONS)).map(
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
                                className="w-full hover:shadow-md hover:scale-105 transition-all duration-200 backdrop-blur-sm min-h-[120px] flex items-center whitespace-normal py-4 px-4"
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
              <div className="space-y-6">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id || index}
                      layout={enableAnimations}
                      initial={enableAnimations ? { opacity: 0, y: 20 } : undefined}
                      animate={{ opacity: 1, y: 0 }}
                      exit={enableAnimations ? { opacity: 0, y: -20 } : undefined}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {renderMessage(message, index)}
                    </motion.div>
                  ))}

                  {/* Chain of Thought loading indicator - appears AFTER messages (below user question, above AI response) */}
                  {/* CRITICAL: Only show when waiting for response, hide once streaming starts */}
                  {(isLoading || manualLoading || isProcessing) && !hasStartedStreaming && (
                    <motion.div
                      key="loading-indicator"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 ml-12"
                      data-slot="chain-of-thought"
                    >
                      <ChainOfThought defaultOpen={true}>
                        <ChainOfThoughtHeader>
                          <Shimmer duration={2} className="text-sm">
                            {thinkingSteps.length > 0
                              ? thinkingSteps[thinkingSteps.length - 1].label
                              : "Thinking..."}
                          </Shimmer>
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {thinkingSteps.map((step, index) => (
                            <ChainOfThoughtStep
                              key={index}
                              icon={
                                index === 0
                                  ? Brain
                                  : index === 1
                                    ? Search
                                    : index === 2
                                      ? FileSearch
                                      : Sparkles
                              }
                              label={step.label}
                              description={step.description}
                              status={step.status}
                              data-slot="chain-of-thought-step"
                            />
                          ))}
                          {loadingSeconds >= 8 && (
                            <ChainOfThoughtSpinner message={`Synthesizing... (${loadingSeconds}s)`} />
                          )}
                        </ChainOfThoughtContent>
                      </ChainOfThought>

                      {/* Queue display for multi-step operations (appears when searching) */}
                      {loadingSeconds >= 5 && thinkingSteps.length >= 3 && (
                        <Queue className="mt-4" data-testid="task-queue">
                          <QueueSection>
                            <QueueSectionTrigger>
                              <QueueSectionLabel
                                label="tasks in progress"
                                count={thinkingSteps.length}
                                icon={<Zap className="w-4 h-4" />}
                              />
                            </QueueSectionTrigger>
                            <QueueSectionContent>
                              <QueueList>
                                {thinkingSteps.map((step, idx) => (
                                  <QueueItem key={idx} className="QueueItem">
                                    <div className="flex items-center gap-2">
                                      <QueueItemIndicator
                                        completed={step.status === "complete"}
                                        className={step.status === "complete" ? "border-green-500 bg-green-500/20" : ""}
                                      />
                                      <QueueItemContent completed={step.status === "complete"}>
                                        {step.label}
                                      </QueueItemContent>
                                    </div>
                                  </QueueItem>
                                ))}
                              </QueueList>
                            </QueueSectionContent>
                          </QueueSection>
                        </Queue>
                      )}

                      {/* Plan display for planning-type queries */}
                      {isPlanningQuery && loadingSeconds >= 3 && (
                        <Plan
                          defaultOpen={true}
                          isStreaming={true}
                          className="mt-4"
                          data-slot="plan"
                          data-testid="execution-plan"
                        >
                          <PlanHeader>
                            <div>
                              <PlanTitle>Generating execution plan...</PlanTitle>
                              <PlanDescription>
                                Analyzing requirements and creating step-by-step workflow
                              </PlanDescription>
                            </div>
                            <PlanTrigger data-slot="plan-trigger" />
                          </PlanHeader>
                          <PlanContent className="space-y-2 text-sm text-muted-foreground">
                            {thinkingSteps.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className={step.status === "complete" ? "text-green-500" : ""}>
                                  {step.status === "complete" ? "done" : step.status === "active" ? "arrow" : "circle"}
                                </span>
                                <span className={step.status === "complete" ? "line-through text-muted-foreground/50" : ""}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </PlanContent>
                        </Plan>
                      )}

                      {/* EXPERIMENTAL: System Diagram for architecture queries */}
                      {isDiagramQuery && loadingSeconds >= 4 && (
                        <div
                          className="mt-4 h-[300px] rounded-lg border border-border overflow-hidden"
                          data-testid="system-diagram"
                        >
                          <ReactFlowProvider>
                            <Canvas
                              nodes={[
                                {
                                  id: "user",
                                  type: "default",
                                  position: { x: 50, y: 100 },
                                  data: { label: "User Query" },
                                  className: "react-flow__node",
                                },
                                {
                                  id: "rag",
                                  type: "default",
                                  position: { x: 250, y: 50 },
                                  data: { label: "RAG Pipeline" },
                                  className: "react-flow__node",
                                },
                                {
                                  id: "llm",
                                  type: "default",
                                  position: { x: 250, y: 150 },
                                  data: { label: "LLM Processing" },
                                  className: "react-flow__node",
                                },
                                {
                                  id: "response",
                                  type: "default",
                                  position: { x: 450, y: 100 },
                                  data: { label: "Response" },
                                  className: "react-flow__node",
                                },
                              ]}
                              edges={[
                                { id: "e1", source: "user", target: "rag", animated: true },
                                { id: "e2", source: "rag", target: "llm", animated: true },
                                { id: "e3", source: "llm", target: "response", animated: true },
                              ]}
                              className="react-flow"
                            >
                              <Controls className="react-flow__controls" />
                            </Canvas>
                          </ReactFlowProvider>
                        </div>
                      )}

                      {/* EXPERIMENTAL: Agent Execution Visualizer for multi-tool queries */}
                      {isAgentQuery && loadingSeconds >= 3 && (
                        <div
                          className="mt-4 h-[250px] rounded-lg border border-border overflow-hidden"
                          data-testid="agent-execution-visualizer"
                          data-execution="true"
                        >
                          <ReactFlowProvider>
                            <Canvas
                              nodes={[
                                {
                                  id: "start",
                                  type: "default",
                                  position: { x: 50, y: 80 },
                                  data: { label: "Start" },
                                  className: `react-flow__node ${thinkingSteps[0]?.status === "complete" ? "border-green-500" : thinkingSteps[0]?.status === "active" ? "animate-pulse" : ""}`,
                                },
                                {
                                  id: "jira",
                                  type: "default",
                                  position: { x: 200, y: 40 },
                                  data: { label: "Search Jira" },
                                  className: `react-flow__node ${thinkingSteps[1]?.status === "complete" ? "border-green-500 complete" : thinkingSteps[1]?.status === "active" ? "animate-pulse running" : ""}`,
                                },
                                {
                                  id: "wiki",
                                  type: "default",
                                  position: { x: 200, y: 120 },
                                  data: { label: "Search Wiki" },
                                  className: `react-flow__node ${thinkingSteps[2]?.status === "complete" ? "border-green-500 complete" : thinkingSteps[2]?.status === "active" ? "animate-pulse running" : ""}`,
                                },
                                {
                                  id: "synthesize",
                                  type: "default",
                                  position: { x: 380, y: 80 },
                                  data: { label: "Synthesize" },
                                  className: `react-flow__node ${thinkingSteps[3]?.status === "complete" ? "border-green-500 complete" : thinkingSteps[3]?.status === "active" ? "animate-pulse running" : ""}`,
                                },
                              ]}
                              edges={[
                                { id: "e1", source: "start", target: "jira", animated: true },
                                { id: "e2", source: "start", target: "wiki", animated: true },
                                { id: "e3", source: "jira", target: "synthesize", animated: true },
                                { id: "e4", source: "wiki", target: "synthesize", animated: true },
                              ]}
                              className="react-flow"
                            >
                              <Controls className="react-flow__controls" />
                            </Canvas>
                          </ReactFlowProvider>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
                  className="mac-button mac-button-outline flex items-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  <AlertCircle className="h-4 w-4" />
                  Retry last message
                </Button>
              </motion.div>
            )}

            {/* DDP Display - shows parsed DDP data from folder upload */}
            {parsedDDP && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <DDPDisplay
                  ddp={parsedDDP}
                  musicBrainz={ddpMusicBrainz}
                  isLoadingMusicBrainz={isLoadingMusicBrainz}
                  onDismiss={clearDDP}
                />
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
      <div className="flex-shrink-0 px-4 pt-4 pb-6 border-t border-border/50 bg-background relative">
        {/* Gemini Live Recording Indicator */}
        {isGeminiRecording && (
          <div className="mb-4 p-4 bg-black/30 rounded-lg backdrop-blur-sm border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
              <div className="text-sm text-white">
                Recording... Release to send
              </div>
              <div className="flex gap-1 ml-auto">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-400 rounded-full mac-audio-bar"
                    style={{
                      height: `${Math.random() * 16 + 8}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
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
          {/* Textarea wrapper with submit button positioned inside on the right */}
          <div className="relative w-full">
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
              className="resize-none border-0 bg-transparent focus:ring-0 placeholder:text-muted-foreground/60 !pr-14"
            />
            {/* Submit button absolutely positioned inside textarea area on the right */}
            <Button type="submit"
              disabled={isMaxMessagesReached || !localInput?.trim()}
              className="mac-button absolute right-3 bottom-3 !h-9 !w-9 !p-0 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 rounded-lg"
            >
              {isLoading ? (
                <Square className="h-4 w-4" />
              ) : (
                <CornerDownLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <PromptInputToolbar className="border-t border-border/50 bg-card/30">
            <PromptInputTools className="gap-2">
              <FileUpload
                compact={true}
                onUploadComplete={handleFileUploadComplete}
                onUploadError={(error) => toast.error(`Upload failed: ${error}`)}
                onDDPDetected={handleDDPDetected}
              />

              {/* Voice Input Button (Push-to-Talk) - Gemini 2.5 Flash */}
              <Button
                data-testid="voice-input-button"
                type="button"
                variant={isGeminiRecording ? "destructive" : "ghost"}
                className={cn(
                  "mac-button rounded-full select-none",
                  "!h-8 !w-8 !p-0 transition-all duration-200 relative overflow-visible shrink-0",
                  isGeminiRecording
                    ? ["bg-red-500 hover:bg-red-600 border-red-400", "text-white shadow-none"]
                    : ["text-primary hover:text-primary/80", "hover:bg-primary/10"]
                )}
                // PUSH-TO-TALK: Hold to record, release to stop
                onPointerDown={async (e) => {
                  e.preventDefault();
                  console.log("🎤 Mic button pressed (push-to-talk START)");

                  // Connect to Gemini Live if not connected
                  if (!isGeminiConnected) {
                    console.log("🎤 Connecting to Gemini Live...");
                    try {
                      const connected = await connectGeminiLive();
                      if (connected) {
                        console.log("🎤 Connection successful, starting recording");
                        startGeminiRecording();
                      } else {
                        console.error("🎤 Connection failed");
                        toast.error("Failed to connect to Gemini Live");
                      }
                    } catch (err) {
                      console.error("🎤 Connection error:", err);
                      toast.error("Connection error: " + (err instanceof Error ? err.message : "Unknown error"));
                    }
                  } else {
                    startGeminiRecording();
                  }
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  console.log("🎤 Mic button released (push-to-talk STOP)");
                  if (isGeminiRecording) {
                    stopGeminiRecording();
                  }
                }}
                onPointerLeave={() => {
                  // Stop recording if pointer leaves button while held
                  if (isGeminiRecording) {
                    console.log("🎤 Pointer left button while recording - stopping");
                    stopGeminiRecording();
                  }
                }}
                disabled={isLoading}
                title="Hold to talk"
              >
                {isGeminiRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Speaker / Mute Button - Gemini Live */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-colors",
                  isGeminiMuted
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    : "text-primary hover:text-primary/80 hover:bg-primary/10"
                )}
                onClick={() => {
                  const newMutedState = !isGeminiMuted;
                  setIsGeminiMuted(newMutedState);
                  console.log(`🔊 Speaker ${newMutedState ? "muted" : "unmuted"}`);
                  toast.info(newMutedState ? "Speaker muted" : "Speaker unmuted");
                }}
                title={isGeminiMuted ? "Unmute voice" : "Mute voice"}
              >
                {isGeminiMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>

              <PromptInputModelSelect
                value={selectedModel}
                onValueChange={setSelectedModel}
                disabled={isMaxMessagesReached || isLoading}
              >
                <PromptInputModelSelectTrigger className="!h-8 !w-[160px] !px-2 !text-xs bg-transparent border-border/50 shrink-0 !shadow-none [&.mac-shimmer]:animate-none">
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
                  <Button variant="ghost"
                    size="sm"
                    onClick={() => setUploadedFiles([])}
                    className="mac-button mac-button-outline h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </PromptInputTools>

            {/* Context Token Usage Visualization */}
            {(tokenUsage.inputTokens > 0 || tokenUsage.outputTokens > 0) && (
              <Context
                usedTokens={tokenUsage.usedTokens}
                maxOutputTokens={tokenUsage.maxOutputTokens}
                usage={{
                  inputTokens: tokenUsage.inputTokens,
                  outputTokens: tokenUsage.outputTokens,
                  totalTokens: tokenUsage.usedTokens,
                }}
                modelId={selectedModel}
                data-testid="context-usage"
              >
                <ContextTrigger aria-label="context usage" className="!h-8 !px-2 text-xs" />
                <ContextContent>
                  <ContextContentHeader />
                  <ContextContentBody className="space-y-2">
                    <ContextInputUsage />
                    <ContextOutputUsage />
                  </ContextContentBody>
                  <ContextContentFooter />
                </ContextContent>
              </Context>
            )}
          </PromptInputToolbar>
        </PromptInput>
      </div>
      
      {/* Feedback Segue Dialog */}
      {showFeedbackDialog && feedbackDialogProps && (
        <FeedbackSegueDialog
          isOpen={showFeedbackDialog}
          onClose={() => setShowFeedbackDialog(false)}
          userQuery={feedbackDialogProps.userQuery}
          aiResponse={feedbackDialogProps.aiResponse}
          onSubmitFeedback={handleFeedbackDialogSubmit}
          onGoToCurationQueue={() => {
            setShowFeedbackDialog(false);
            // Use hash navigation to switch tabs
            if (typeof window !== "undefined") {
              window.location.hash = "curate";
            }
          }}
          onGoToIntegration={() => {
             setShowFeedbackDialog(false);
             if (typeof window !== "undefined") {
               window.location.hash = "fix";
             }
          }}
        />
      )}
    </div>
  );
}
