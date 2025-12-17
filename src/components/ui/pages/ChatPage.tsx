import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AiSdkChatPanel } from "../../ai/ai-sdk-chat-panel"; // Re-enabled after fixing zod-to-json-schema dependency
import { ChatPanel } from "../../ai/chat-panel"; // For legacy tabs
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../sidebar";
import { RightSidebar } from "../layout/RightSidebar";
import { useConversationStore } from "../../../lib/conversation-store";
import { WisdomLibrary } from "../WisdomLibrary";
import { DocumentUpload as DocumentUploadComponent } from "../../DocumentUpload";
import { getChatAPIEndpoint } from "../../../config/featureFlags";
import { ResponseDebugger } from "../ResponseDebugger";
import { QuickFixPanel } from "../QuickFixPanel";
import { TestCaseGenerator } from "../TestCaseGenerator";
import { FeedbackTimeline } from "../FeedbackTimeline";

import { RLHFTestSuite } from "../../test-dashboard/RLHFTestSuite";
import { RLHFImpactDashboard } from "../../test-dashboard/RLHFImpactDashboard";
import { LiveRAGMonitor } from "../../test-dashboard/LiveRAGMonitor";
import {
  Upload,
  Settings,
  Bot,
  Sparkles,
  Zap,
  Lightbulb,
  Database,
  FileText,
  MessageSquare,
  TestTube,
  Wrench,
  Library,
  Menu,
  X,
  RefreshCw,
  LogOut,
  BarChart3,
  Activity,
} from "lucide-react";
import { Badge } from "../badge";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { cn } from "../../../lib/utils";
import { ConnectionStatusIndicator } from "../ConnectionStatusIndicator";
import { SiamLogo } from "../SiamLogo";
import { AOMAKnowledgePanel } from "../AOMAKnowledgePanel";
import EnhancedKnowledgePanel from "../EnhancedKnowledgePanel";
import { getKnowledgeSourceCounts } from "../../../services/knowledgeSearchService";
import { IntrospectionDropdown } from "../IntrospectionDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

// PERFORMANCE OPTIMIZATION: Dynamic imports for heavy components
// These components contain charts and heavy dependencies (recharts, etc.)
// and are only loaded when the user navigates to their respective tabs
const TestDashboard = dynamic(
  () =>
    import("../../test-dashboard/TestDashboard").then((mod) => ({ default: mod.TestDashboard })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div>Loading Test Dashboard...</div>
      </div>
    ),
    ssr: false,
  }
);

const HUDInterface = dynamic(
  () => import("../HUDLauncher").then((mod) => ({ default: mod.HUDLauncher })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div>Loading HUD...</div>
      </div>
    ),
    ssr: false,
  }
);

const CurateTab = dynamic(
  // Using CurateTab instead of CleanCurateTab - it has native tabs that avoid React 19 + Radix infinite loop
  () => import("../CurateTab").then((mod) => ({ default: mod.CurateTab })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div>Loading Curate...</div>
      </div>
    ),
    ssr: false,
  }
);

interface ComponentMode {
  mode: "chat" | "hud" | "test" | "fix" | "curate";
  label: string;
  description: string;
  icon: React.ReactNode;
}

const COMPONENT_MODES: ComponentMode[] = [
  {
    mode: "chat",
    label: "Chat",
    description: "AI-powered conversation",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    mode: "hud",
    label: "HUD",
    description: "Heads-up display interface",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    mode: "test",
    label: "Test",
    description: "Test and validate",
    icon: <TestTube className="h-4 w-4" />,
  },
  {
    mode: "fix",
    label: "Fix",
    description: "Debug and resolve issues",
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    mode: "curate",
    label: "Curate",
    description: "Manage knowledge base",
    icon: <Library className="h-4 w-4" />,
  },
];

interface ChatPageProps {
  onLogout?: () => void;
}

// Valid mode values for URL hash routing
const VALID_MODES: ComponentMode["mode"][] = ["chat", "hud", "test", "fix", "curate"];

export const ChatPage: React.FC<ChatPageProps> = ({ onLogout }) => {
  // Track if component has hydrated to prevent SSR/client mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Always initialize with "chat" to prevent hydration mismatch
  // The URL hash will be read and applied in a useEffect after hydration
  const [activeMode, setActiveMode] = useState<ComponentMode["mode"]>("chat");

  // Mark as hydrated after first render on client
  useEffect(() => {
    setIsHydrated(true);
    // Read URL hash only after component mounts on client
    const hash = window.location.hash.slice(1);
    if (VALID_MODES.includes(hash as ComponentMode["mode"])) {
      setActiveMode(hash as ComponentMode["mode"]);
    }
  }, []);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [knowledgeCounts, setKnowledgeCounts] = useState<Record<string, number>>({});
  const [knowledgeStatus, setKnowledgeStatus] = useState<"ok" | "degraded" | "unknown">("unknown");
  const [lastKnowledgeRefresh, setLastKnowledgeRefresh] = useState<string>("");

  // URL hash-based routing for deep linking
  useEffect(() => {
    // Update URL hash when activeMode changes
    if (typeof window !== "undefined") {
      window.location.hash = activeMode;
    }
  }, [activeMode]);

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (VALID_MODES.includes(hash as ComponentMode["mode"])) {
        setActiveMode(hash as ComponentMode["mode"]);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const {
    activeConversationId,
    conversations,
    createConversation,
    setActiveConversation,
    getConversation,
    regenerateDefaultTitles,
  } = useConversationStore();

  // Regenerate titles for existing conversations that still have default names
  // This runs once on mount to fix any legacy "New Conversation" entries
  useEffect(() => {
    const updated = regenerateDefaultTitles();
    if (updated > 0) {
      console.log(`[ChatPage] Regenerated ${updated} conversation titles`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const newConvo = createConversation(); // Let auto-title generate from first message
      setActiveConversation(newConvo.id);
    }
  }, [conversations.length, createConversation, setActiveConversation]);

  // Load quick knowledge indicators for header badges
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const counts = await getKnowledgeSourceCounts();
        if (!mounted) return;
        setKnowledgeCounts(counts);
        const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
        setKnowledgeStatus(total > 0 ? "ok" : "degraded");
        setLastKnowledgeRefresh(new Date().toLocaleTimeString());
      } catch {
        if (!mounted) return;
        setKnowledgeStatus("degraded");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeConversation = activeConversationId ? getConversation(activeConversationId) : null;

  const handleFileUpload = async (files: FileList) => {
    // Handle file upload logic here
    const newDocs = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
    }));
    setUploadedDocuments((prev) => [...prev, ...newDocs]);
  };

  const handleNewConversation = () => {
    const newConvo = createConversation();
    setActiveConversation(newConvo.id);
    // Chat panel will reset automatically with new conversation
  };

  const systemPrompt = `You are SIAM (Sentient Intelligence and Augmented Memory), an advanced AI assistant powered by the Vercel AI SDK.
You have access to a knowledge base and can help with various tasks including analysis, problem-solving, and creative work.
Be helpful, concise, and professional in your responses.`;

  // PREMIUM SUGGESTED QUESTIONS: Curated showcase with pre-cached responses
  // All 6 trigger infographic generation and have Mermaid diagrams
  // Updated: December 2025 with latest AOMA corpus and release notes
  const suggestions = [
    "What are the different asset types in AOMA and how do they relate to each other?",
    "How does AOMA use AWS S3 storage tiers for long-term archiving?",
    "What's the difference between asset registration and master linking in AOMA?",
    "What are the permission levels in AOMA and what can each role do?",
    "What new UST features are being planned for the 2026 releases?",
    "How do I upload and archive digital assets in AOMA from preparation to storage?",
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col w-full">
        {/* Sophisticated Header - Mobile Optimized */}
        <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm supports-[backdrop-filter]:bg-zinc-950/60 flex-shrink-0 overflow-visible relative z-50">
          <div className="px-3 sm:px-6 py-2 sm:py-4 h-14 sm:h-16">
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 h-full">
              {/* Brand Identity - Compact on mobile */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <SiamLogo size="md" variant="icon" className="sm:hidden" />
                <SiamLogo size="lg" variant="icon" className="hidden sm:block" />
                <div className="hidden sm:block">
                  <h1 className="mac-heading text-xl font-extralight text-white tracking-tight whitespace-nowrap">
                    The Betabase
                  </h1>
                  <p className="text-xs text-zinc-200 font-light whitespace-nowrap">
                    Intelligence Platform
                  </p>
                </div>
              </div>

              {/* Navigation Tabs - Hidden on mobile, shown on tablet+ */}
              {/* Use hydration-safe mode: always "chat" during SSR, actual mode after hydration */}
              <TooltipProvider delayDuration={200}>
                <div className="hidden md:flex items-center space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50 flex-shrink-0">
                  {COMPONENT_MODES.map((mode) => {
                    // Only use actual activeMode after hydration to prevent SSR mismatch
                    const isActive = isHydrated ? activeMode === mode.mode : mode.mode === "chat";
                    return (
                      <Tooltip key={mode.mode}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveMode(mode.mode)}
                            className={cn(
                              "relative flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-light transition-all duration-200",
                              isActive
                                ? "bg-zinc-800 text-white shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            )}
                            suppressHydrationWarning
                          >
                            <span
                              className={cn(
                                "flex items-center",
                                isActive && "text-[var(--mac-primary-blue-400)]"
                              )}
                              suppressHydrationWarning
                            >
                              {mode.icon}
                            </span>
                            <span className="hidden lg:inline">{mode.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          className="bg-zinc-800 text-zinc-100 border-zinc-700"
                        >
                          <p className="font-medium">{mode.label}</p>
                          <p className="text-zinc-400 text-[10px]">{mode.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Mobile Navigation - Compact tabs for small screens */}
              <TooltipProvider delayDuration={300}>
                <div className="flex md:hidden items-center space-x-0.5 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
                  {COMPONENT_MODES.map((mode) => {
                    const isActive = isHydrated ? activeMode === mode.mode : mode.mode === "chat";
                    return (
                      <Tooltip key={mode.mode}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveMode(mode.mode)}
                            className={cn(
                              "flex items-center justify-center p-2 rounded-md transition-all duration-200",
                              isActive
                                ? "bg-zinc-800 shadow-sm"
                                : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            )}
                            aria-label={mode.label}
                            suppressHydrationWarning
                          >
                            <span
                              className={cn(
                                "flex items-center",
                                isActive && "text-[var(--mac-primary-blue-400)]"
                              )}
                              suppressHydrationWarning
                            >
                              {mode.icon}
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="bottom" 
                          className="bg-zinc-800 text-zinc-100 border-zinc-700"
                        >
                          <p className="font-medium">{mode.label}</p>
                          <p className="text-zinc-400 text-[10px]">{mode.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Controls - Responsive spacing */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <ConnectionStatusIndicator />
                <div className="introspection-dropdown-container">
                  <IntrospectionDropdown />
                </div>
                {/* Knowledge status badges */}
                <div className="hidden lg:flex items-center gap-2">
                  <Badge variant="secondary" title="Knowledge status" className="whitespace-nowrap border-0 bg-zinc-800/50 text-zinc-400">
                    {knowledgeStatus === "ok"
                      ? "Knowledge: OK"
                      : knowledgeStatus === "degraded"
                        ? "Knowledge: Degraded"
                        : "Knowledge: Unknown"}
                  </Badge>
                  {lastKnowledgeRefresh && (
                    <Badge
                      variant="secondary"
                      className="text-xs whitespace-nowrap border-0 bg-zinc-800/50 text-zinc-400"
                      title="Last refresh"
                    >
                      updated {lastKnowledgeRefresh}
                    </Badge>
                  )}
                </div>

                {/* Sidebar trigger with MAC styling */}
                <SidebarTrigger className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-colors" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 mac-button mac-button-outline"
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                  title="Knowledge Base"
                  aria-label="Toggle knowledge base panel"
                >
                  <Database className="h-4 w-4" />
                </Button>

                {/* Performance Dashboard Link - Hidden on small mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 mac-button mac-button-outline"
                  onClick={() => (window.location.href = "/performance")}
                  title="Performance Dashboard"
                  aria-label="Open performance dashboard"
                >
                  <Activity className="h-4 w-4" />
                </Button>

                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    className="sign-out-button text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 text-xs px-2 sm:px-4 flex items-center gap-1 sm:gap-2 mac-button mac-button-outline"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sign-out-text hidden sm:inline">Sign Out</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout with proper sidebar */}
        <div className="flex flex-1 min-h-0 relative w-full">
          {/* Enhanced Sidebar with persistence - Only show on Chat tab */}
          {activeMode === "chat" && <AppSidebar className="border-r border-zinc-800/50" />}

          {/* Main Content with SidebarInset */}
          <SidebarInset className="flex-1 min-h-0 bg-transparent flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
              {activeMode === "chat" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <AiSdkChatPanel
                    key={`${getChatAPIEndpoint()}-${activeConversationId}`} // Force remount when endpoint or conversation changes
                    api={getChatAPIEndpoint()}
                    title={activeConversation?.title || "The Betabase"}
                    description="Don't be an ass-hat."
                    systemPrompt={systemPrompt}
                    suggestions={suggestions}
                    className="flex-1 border-0"
                    placeholder="Ask me anything..."
                    enableWelcomeScreen={
                      !activeConversation || activeConversation.messages.length === 0
                    }
                    showHeader={false}
                    conversationId={activeConversationId || undefined}
                    initialMessages={activeConversation?.messages}
                    onMessagesChange={(messages) => {
                      if (activeConversationId && messages.length > 0) {
                        const { updateConversation, getConversation } = useConversationStore.getState();
                        const currentConv = getConversation(activeConversationId);
                        
                        // Safety check: Don't overwrite stored messages if we would lose data
                        // This prevents filtered initial messages from overwriting complete conversations
                        const storedMsgCount = currentConv?.messages?.length || 0;
                        const hasStoredAssistant = currentConv?.messages?.some((m: any) => m.role === 'assistant');
                        const newHasAssistant = messages.some((m: any) => m.role === 'assistant');
                        
                        if (storedMsgCount > messages.length) {
                          return; // Would lose messages - skip this update
                        }
                        
                        if (hasStoredAssistant && !newHasAssistant && messages.length <= storedMsgCount) {
                          return; // Would lose assistant message - skip this update
                        }
                        
                        // Helper to extract message content from AI SDK v4 or v5 format
                        const getMessageContent = (m: any): string | undefined => {
                          // AI SDK v5: parts[0].text
                          if (m.parts && m.parts[0]?.text) {
                            return m.parts[0].text;
                          }
                          // AI SDK v4 / fallback: content
                          if (m.content && typeof m.content === "string") {
                            return m.content;
                          }
                          return undefined;
                        };
                        
                        // Generate title from first user message if title is still default
                        const isDefaultTitle = (title: string) => {
                          const defaults = ["new conversation", "the betabase", "untitled", ""];
                          return defaults.includes((title || "").toLowerCase().trim());
                        };
                        
                        let newTitle: string | undefined;
                        if (currentConv && isDefaultTitle(currentConv.title)) {
                          // Find first user message in the messages array
                          const firstUserMsg = messages.find((m: any) => m.role === "user" && getMessageContent(m));
                          const msgContent = firstUserMsg ? getMessageContent(firstUserMsg) : undefined;
                          
                          if (msgContent) {
                            // Generate concise title from user's message
                            let title = msgContent
                              .trim()
                              .replace(/\s+/g, " ")
                              .replace(/^(hey|hi|hello|please|can you|could you|i need|i want)\s+/i, "")
                              .replace(/[?!.]+$/, "");
                            title = title.charAt(0).toUpperCase() + title.slice(1);
                            if (title.length > 45) {
                              const truncateAt = title.lastIndexOf(" ", 45);
                              title = truncateAt > 20 ? title.substring(0, truncateAt) + "..." : title.substring(0, 45) + "...";
                            }
                            newTitle = title || undefined;
                          }
                        }
                        
                        // Update conversation with messages and potentially new title
                        updateConversation(activeConversationId, { 
                          messages: messages as any[],
                          ...(newTitle && { title: newTitle })
                        });
                      }
                    }}
                  />
                </div>
              )}

              {activeMode === "hud" && (
                <div className="h-full p-6">
                  <HUDInterface />
                </div>
              )}

              {activeMode === "test" && (
                <div className="h-full p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-normal text-zinc-100 flex items-center gap-2">
                      <TestTube className="h-5 w-5 text-zinc-300" />
                      Advanced Testing & Quality Assurance
                    </h2>
                    <p className="text-sm text-zinc-300 mt-1">
                      Comprehensive testing suite with historical data, RLHF-generated tests, and
                      live monitoring
                    </p>
                  </div>

                  <Tabs defaultValue="dashboard" className="h-[calc(100%-80px)]">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                      <TabsTrigger value="historical">Historical Tests</TabsTrigger>
                      <TabsTrigger value="rlhf-tests">RLHF Tests</TabsTrigger>
                      <TabsTrigger value="impact">Impact Metrics</TabsTrigger>
                      <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="h-full">
                      <TestDashboard className="h-full" />
                    </TabsContent>

                    {/* <TabsContent value="historical" className="h-full">
                      <HistoricalTestExplorer />
                    </TabsContent> */}

                    <TabsContent value="rlhf-tests" className="h-full">
                      <RLHFTestSuite />
                    </TabsContent>

                    <TabsContent value="impact" className="h-full">
                      <RLHFImpactDashboard />
                    </TabsContent>

                    <TabsContent value="monitor" className="h-full">
                      <LiveRAGMonitor />
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeMode === "fix" && (
                <div className="h-full p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-normal text-zinc-100 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-zinc-300" />
                      Debug & Fix Assistant
                    </h2>
                    <p className="text-sm text-zinc-300 mt-1">
                      Analyze responses, make corrections, and generate tests
                    </p>
                  </div>

                  <Tabs defaultValue="debugger" className="h-[calc(100%-80px)]">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="debugger">Response Debugger</TabsTrigger>
                      <TabsTrigger value="quickfix">Quick Fix</TabsTrigger>
                      <TabsTrigger value="generator">Test Generator</TabsTrigger>
                      <TabsTrigger value="timeline">Feedback Timeline</TabsTrigger>
                    </TabsList>

                    <TabsContent value="debugger" className="h-full">
                      <ResponseDebugger />
                    </TabsContent>

                    <TabsContent value="quickfix" className="h-full">
                      <QuickFixPanel />
                    </TabsContent>

                    <TabsContent value="generator" className="h-full">
                      <TestCaseGenerator />
                    </TabsContent>

                    <TabsContent value="timeline" className="h-full">
                      <FeedbackTimeline className="h-full" />
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {activeMode === "curate" && (
                <div className="h-full">
                  <div className="p-6 border-b border-zinc-800/50">
                    <h2 className="mac-heading text-lg font-normal text-zinc-100 flex items-center gap-2">
                      <Library className="h-5 w-5 text-zinc-300" />
                      Knowledge Curation
                    </h2>
                    <p className="text-sm text-zinc-300 mt-2">
                      Manage and organize your knowledge base
                    </p>
                  </div>
                  <div className="h-[calc(100%-81px)] p-6">
                    <CurateTab className="h-full" />
                  </div>
                </div>
              )}
            </div>
          </SidebarInset>

          {/* Right Sidebar */}
          {isRightSidebarOpen && (
            <aside className="w-96 border-l border-zinc-800/50 bg-zinc-950/50 backdrop-blur-sm supports-[backdrop-filter]:bg-zinc-950/30">
              <RightSidebar onToggle={() => setIsRightSidebarOpen(false)}>
                <EnhancedKnowledgePanel className="h-full" />
              </RightSidebar>
            </aside>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ChatPage;
