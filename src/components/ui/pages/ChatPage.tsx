import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AiSdkChatPanel } from "../../ai/ai-sdk-chat-panel"; // Re-enabled after fixing zod-to-json-schema dependency
// import { ChatPanel } from "../../ai/chat-panel"; // For legacy tabs
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
import { HistoricalTestExplorer } from "../../test-dashboard/HistoricalTestExplorer";
import { TestDashboardErrorBoundary } from "../../test-dashboard/TestDashboardErrorBoundary";
import {
  Upload,
  Settings,
  Bot,
  Sparkles,
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
import { CompactThemeSwitcher } from "../theme-switcher";
import { SiamLogo } from "../SiamLogo";
import { AOMAKnowledgePanel } from "../AOMAKnowledgePanel";
import EnhancedKnowledgePanel from "../EnhancedKnowledgePanel";
import { IntrospectionDropdown } from "../IntrospectionDropdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { DraggableLadybug } from "../../tester/DraggableLadybug";
import { FeedbackDialog } from "../../tester/FeedbackDialog";

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
  mode: "chat" | "test" | "fix" | "curate";
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
const VALID_MODES: ComponentMode["mode"][] = ["chat", "test", "fix", "curate"];

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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

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
    _hasHydrated,
  } = useConversationStore();

  // Create initial conversation if none exists OR if active conversation is incomplete
  // "Incomplete" = has user messages but no assistant response (e.g., user clicked suggestion then navigated away)
  // This ensures fresh startup always shows Zeitgeist welcome screen
  // ONLY runs after hydration to prevent race condition with localStorage
  useEffect(() => {
    if (!_hasHydrated) return;

    // Case 1: No conversations at all - create one
    if (conversations.length === 0) {
      const newConvo = createConversation();
      setActiveConversation(newConvo.id);
      return;
    }

    // Case 2: Active conversation is incomplete (no assistant response)
    // This happens when user clicked a suggestion but didn't get/wait for response
    if (activeConversationId) {
      const activeConvo = getConversation(activeConversationId);
      if (activeConvo && activeConvo.messages.length > 0) {
        const hasAssistantMessage = activeConvo.messages.some(
          (m) => m.role === "assistant"
        );
        if (!hasAssistantMessage) {
          // Start fresh with a new conversation to show Zeitgeist bubbles
          const newConvo = createConversation();
          setActiveConversation(newConvo.id);
        }
      }
    }
  }, [_hasHydrated, conversations.length, activeConversationId, createConversation, setActiveConversation, getConversation]);

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
      <div className="h-screen bg-background text-foreground overflow-hidden flex flex-col w-full">
        {/* Sophisticated Header - Mobile Optimized */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 flex-shrink-0 overflow-visible relative z-50">
          <div className="px-3 sm:px-6 py-2 sm:py-4 h-14 sm:h-16">
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 h-full">
              {/* Brand Identity - Compact on mobile */}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <SiamLogo size="md" variant="icon" className="sm:hidden" />
                <SiamLogo size="xl" variant="icon" className="hidden sm:block" />
                <div className="hidden sm:block">
                  <h1 className="mac-heading">
                    The Betabase
                  </h1>
                  <p className="text-xs text-muted-foreground font-light whitespace-nowrap">
                    Intelligence Platform
                  </p>
                </div>
              </div>

              {/* Navigation Tabs - Hidden on mobile, shown on tablet+ */}
              {/* Use hydration-safe mode: always "chat" during SSR, actual mode after hydration */}
              <TooltipProvider delayDuration={200}>
                <div className="hidden md:flex items-center space-x-1 bg-card/50 p-1 rounded-lg border border-border/50 flex-shrink-0">
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
                                ? "bg-muted text-white shadow-sm"
                                : "text-muted-foreground hover:text-white hover:bg-muted/50"
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
                          className="bg-muted text-foreground border-border"
                        >
                          <p className="mac-body font-normal">{mode.label}</p>
                          <p className="mac-body text-muted-foreground text-[10px]">{mode.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Mobile Navigation - Compact tabs for small screens */}
              <TooltipProvider delayDuration={300}>
                <div className="flex md:hidden items-center space-x-0.5 bg-card/50 p-1 rounded-lg border border-border/50">
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
                                ? "bg-muted shadow-sm"
                                : "text-muted-foreground hover:text-white hover:bg-muted/50"
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
                          className="bg-muted text-foreground border-border"
                        >
                          <p className="mac-body font-normal">{mode.label}</p>
                          <p className="mac-body text-muted-foreground text-[10px]">{mode.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Controls - Responsive spacing */}
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                <CompactThemeSwitcher />
                <ConnectionStatusIndicator />
                <div className="introspection-dropdown-container">
                  <IntrospectionDropdown />
                </div>

                {/* Sidebar trigger with MAC styling */}
                <SidebarTrigger className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 mac-button mac-button-outline"
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
                  className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 mac-button mac-button-outline"
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
                    className="sign-out-button text-muted-foreground hover:text-foreground hover:bg-muted/50 text-xs px-2 sm:px-4 flex items-center gap-1 sm:gap-2 mac-button mac-button-outline"
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
          {activeMode === "chat" && <AppSidebar className="border-r border-border/50" />}

          {/* Main Content with SidebarInset */}
          <SidebarInset className="flex-1 min-h-0 bg-transparent flex flex-col">
            <div className="flex-1 flex flex-col min-h-0">
              {activeMode === "chat" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <AiSdkChatPanel
                    key={`${getChatAPIEndpoint()}-${activeConversationId}`} // Force remount when endpoint or conversation changes
                    api={getChatAPIEndpoint()}
                    title={activeConversation?.title || "The Betabase"}
                    description="AI-Powered Intelligence Platform"
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

              {activeMode === "test" && (
                <div className="h-full p-6 space-y-6">
                  <div>
                    <h2 className="mac-heading">
                      Advanced Testing & Quality Assurance
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                      <TestDashboardErrorBoundary>
                        <TestDashboard className="h-full" />
                      </TestDashboardErrorBoundary>
                    </TabsContent>

                    <TabsContent value="historical" className="h-full">
                      <HistoricalTestExplorer />
                    </TabsContent>

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
                    <h2 className="mac-heading">
                      Debug & Fix Assistant
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
                <div className="h-full p-6">
                  <CurateTab className="h-full" />
                </div>
              )}
            </div>
          </SidebarInset>

          {/* Right Sidebar */}
          {isRightSidebarOpen && (
            <aside className="w-96 border-l border-border/50 bg-background/50 backdrop-blur-sm supports-[backdrop-filter]:bg-background/30">
              <RightSidebar onToggle={() => setIsRightSidebarOpen(false)}>
                <EnhancedKnowledgePanel className="h-full" />
              </RightSidebar>
            </aside>
          )}
        </div>
      </div>
      <DraggableLadybug onOpenFeedback={() => setIsFeedbackOpen(true)} />
      <FeedbackDialog
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={(data) => {
          console.log("Feedback submitted:", data);
          // TODO: Implement actual submission logic
        }}
      />
    </SidebarProvider>
  );
};

export default ChatPage;
