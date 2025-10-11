import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AiSdkChatPanel } from "../../ai/ai-sdk-chat-panel"; // Re-enabled after fixing zod-to-json-schema dependency
import { ChatPanel } from "../../ai/chat-panel"; // For legacy tabs
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "../sidebar";
import { RightSidebar } from "../layout/RightSidebar";
import { useConversationStore } from "../../../lib/conversation-store";
import { WisdomLibrary } from "../WisdomLibrary";
import { HUDInterface } from "../HUDInterface";
import { DocumentUpload as DocumentUploadComponent } from "../../DocumentUpload";
import { getChatAPIEndpoint } from "../../../config/featureFlags";
import {
  Upload,
  Settings,
  Bot,
  Sparkles,
  Zap,
  Brain,
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
import { TestDashboard } from "../../test-dashboard/TestDashboard";
import { IntrospectionDropdown } from "../IntrospectionDropdown";

import { CurateTab } from "../CurateTab";

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

export const ChatPage: React.FC<ChatPageProps> = ({ onLogout }) => {
  const [activeMode, setActiveMode] = useState<ComponentMode["mode"]>("chat");
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [knowledgeCounts, setKnowledgeCounts] = useState<Record<string, number>>({});
  const [knowledgeStatus, setKnowledgeStatus] = useState<'ok'|'degraded'|'unknown'>("unknown");
  const [lastKnowledgeRefresh, setLastKnowledgeRefresh] = useState<string>("");
  
  const { 
    activeConversationId, 
    conversations, 
    createConversation, 
    setActiveConversation,
    getConversation 
  } = useConversationStore();
  
  // Create initial conversation if none exists
  useEffect(() => {
    if (conversations.length === 0) {
      const newConvo = createConversation("The Betabase");
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
    return () => { mounted = false; };
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

  const suggestions = [
    "How can I analyze complex data sets and extract meaningful insights?",
    "What are the best practices for implementing AI-powered workflows?",
    "Can you help me optimize my code for better performance?",
    "How do I create effective documentation for technical projects?",
  ];

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="h-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col w-full">
      {/* Sophisticated Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm supports-[backdrop-filter]:bg-zinc-950/60 flex-shrink-0 overflow-visible relative z-50">
        <div className="px-6 py-3 h-16">
          <div className="flex flex-row items-center justify-between gap-4 h-full">
            {/* Brand Identity */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <SiamLogo size="lg" variant="icon" />
              <div>
                <h1 className="text-xl font-extralight text-white tracking-tight whitespace-nowrap">
                  The Betabase
                </h1>
                <p className="text-xs text-slate-400 font-light whitespace-nowrap">
                  Intelligence Platform
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50 flex-shrink-0">
              {COMPONENT_MODES.map((mode) => (
                <button
                  key={mode.mode}
                  onClick={() => setActiveMode(mode.mode)}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-light transition-all duration-200",
                    activeMode === mode.mode
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-zinc-800/50",
                  )}
                >
                  {mode.icon}
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <ConnectionStatusIndicator />
              <div className="introspection-dropdown-container">
                <IntrospectionDropdown />
              </div>
              {/* Knowledge status badges */}
              <div className="hidden lg:flex items-center gap-1">
                <Badge variant="outline" title="Knowledge status" className="whitespace-nowrap">
                  {knowledgeStatus === 'ok' ? 'Knowledge: OK' : knowledgeStatus === 'degraded' ? 'Knowledge: Degraded' : 'Knowledge: Unknown'}
                </Badge>
                {lastKnowledgeRefresh && (
                  <Badge variant="outline" className="text-xs whitespace-nowrap" title="Last refresh">
                    updated {lastKnowledgeRefresh}
                  </Badge>
                )}
              </div>
              
              {/* Sidebar trigger with MAC styling */}
              <SidebarTrigger className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-colors" />

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              >
                <Database className="h-4 w-4" />
              </Button>

              {onLogout && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="sign-out-button text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 text-xs px-3 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sign-out-text">Sign Out</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with proper sidebar */}
      <div className="flex flex-1 min-h-0 relative w-full">
        {/* Enhanced Sidebar with persistence */}
        <AppSidebar className="border-r border-zinc-800/50" />

        {/* Main Content with SidebarInset */}
        <SidebarInset className="flex-1 min-h-0 bg-transparent flex flex-col">
          <div className="flex-1 flex flex-col min-h-0">
            {activeMode === "chat" && (
              <div className="flex-1 flex flex-col min-h-0">
                <AiSdkChatPanel
                  key={`${getChatAPIEndpoint()}-${activeConversationId}`} // Force remount when endpoint or conversation changes
                  api={getChatAPIEndpoint()}
                  title={activeConversation?.title || "The Betabase"}
                  description="AI-Powered Assistant. Don't be a dick."
                  systemPrompt={systemPrompt}
                  suggestions={suggestions}
                  className="flex-1 border-0"
                  placeholder="Ask me anything..."
                  enableWelcomeScreen={!activeConversation || activeConversation.messages.length === 0}
                  showHeader={false}
                  conversationId={activeConversationId}
                />
              </div>
            )}

            {activeMode === "hud" && (
              <div className="h-full p-6">
                <HUDInterface />
              </div>
            )}

            {activeMode === "test" && <TestDashboard className="h-full" />}

            {activeMode === "fix" && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col border-0 bg-transparent">
                  <div className="p-6 border-b border-zinc-800/50">
                    <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-zinc-400" />
                      Debug Assistant
                    </h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      AI-powered debugging and issue resolution
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <ChatPanel
                      api="/api/chat"
                      title="Debug Assistant"
                      description="AI-powered debugging and issue resolution"
                      systemPrompt="You are a debugging expert. Help users identify and fix issues in their code."
                      suggestions={[
                        "Debug this error message",
                        "Why is my code not working?",
                        "Optimize performance issues",
                        "Fix memory leaks",
                      ]}
                      showHeader={false}
                      className="flex-1 border-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeMode === "curate" && (
              <div className="h-full">
                <div className="p-6 border-b border-zinc-800/50">
                  <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <Library className="h-5 w-5 text-zinc-400" />
                    Knowledge Curation
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
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

        {/* Right Sidebar Toggle Button (Always Visible When Collapsed) */}
        <button
          onClick={() => setIsRightSidebarOpen(true)}
          className={cn(
            "absolute right-4 top-8 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800/50 hover:bg-zinc-800 transition-colors group",
            isRightSidebarOpen && "hidden",
          )}
          aria-label="Open knowledge panel"
        >
          <Database className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
    </SidebarProvider>
  );
};

export default ChatPage;
