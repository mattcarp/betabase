import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Lightbulb,
  Star,
  Clock,
  Tag,
  Search,
  Filter,
  TrendingUp,
  Users,
  MessageCircle,
  ArrowRight,
  Database,
  Zap,
  FileText,
  Brain,
  Target,
  Hash,
  Sparkles,
} from "lucide-react";
import { useMCPClient } from "../../hooks/useMCPClient";
import { useTopicExtraction, useTopicVisualization } from "../../hooks/useTopicExtraction";
import { aomaTopicIntegration } from "../../services/aomaTopicIntegration";

interface WisdomEntry {
  id: string;
  title: string;
  content: string;
  category: "strategy" | "innovation" | "leadership" | "process" | "insight" | "technical";
  tags: string[];
  confidence: number;
  relevance: number;
  lastAccessed: Date;
  source: "aoma" | "conversation" | "knowledge_base" | "system";
  interactionCount: number;
  featured: boolean;
  summary?: string;
}

interface WisdomLibraryProps {
  conversationContext?: {
    sessionId: string;
    startTime: Date;
    userId: string;
    totalMessages: number;
    topics: string[];
  };
  currentConversation?: any[];
  className?: string;
}

export const WisdomLibrary: React.FC<WisdomLibraryProps> = ({
  conversationContext,
  currentConversation = [],
  className,
}) => {
  const [wisdomEntries, setWisdomEntries] = useState<WisdomEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [mcpState, mcpActions] = useMCPClient();

  // Topic extraction hooks
  const [topicState, topicActions] = useTopicExtraction();
  const { getTopicCloud, trendingTopics } = useTopicVisualization();

  const categories = [
    { value: "all", label: "All", icon: Database },
    { value: "strategy", label: "Strategy", icon: Target },
    { value: "innovation", label: "Innovation", icon: Lightbulb },
    { value: "leadership", label: "Leadership", icon: Users },
    { value: "process", label: "Process", icon: TrendingUp },
    { value: "technical", label: "Technical", icon: Zap },
    { value: "insight", label: "Insights", icon: Brain },
  ];

  // Generate wisdom entries from AOMA knowledge base and conversation context
  const generateWisdomEntries = async (): Promise<WisdomEntry[]> => {
    setIsLoading(true);

    try {
      const entries: WisdomEntry[] = [];

      // Generate entries from current conversation topics
      if (currentConversation.length > 0) {
        const recentMessages = currentConversation.slice(-3);
        const conversationTopics = recentMessages
          .filter((m) => m.role === "user")
          .map((m) => m.content)
          .join(" ");

        if (conversationTopics.length > 0) {
          // Extract key themes for wisdom recommendations
          const themes = extractThemes(conversationTopics);

          themes.forEach((theme, index) => {
            entries.push({
              id: `conv-${index}`,
              title: `${theme.charAt(0).toUpperCase() + theme.slice(1)} Best Practices`,
              content: `Contextual insights and best practices related to ${theme} based on conversation analysis.`,
              summary: `Key recommendations for ${theme} implementation and strategy.`,
              category: categorizeTheme(theme),
              tags: [theme, "conversation", "contextual"],
              confidence: 85 + Math.random() * 10,
              relevance: 90 + Math.random() * 10,
              lastAccessed: new Date(),
              source: "conversation",
              interactionCount: Math.floor(Math.random() * 50) + 10,
              featured: index === 0,
            });
          });
        }
      }

      // Add AOMA knowledge base entries
      const aomaEntries = await fetchAOMAKnowledge();
      entries.push(...aomaEntries);

      // Add sample entries if no AOMA data available
      if (aomaEntries.length === 0) {
        entries.push(...getSampleWisdomEntries());
      }

      return entries
        .sort((a, b) => {
          // Sort by relevance and featured status
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.relevance - a.relevance;
        })
        .slice(0, 8); // Show top 8 entries
    } catch (error) {
      console.error("Error generating wisdom entries:", error);
      return getSampleWisdomEntries();
    } finally {
      setIsLoading(false);
    }
  };

  // Extract themes from conversation text
  const extractThemes = (text: string): string[] => {
    const keywords = text.toLowerCase().split(/\s+/);
    const themeMap: { [key: string]: number } = {};

    // Business/strategy themes
    const businessThemes = [
      "strategy",
      "leadership",
      "innovation",
      "process",
      "efficiency",
      "growth",
      "management",
      "planning",
      "execution",
    ];
    const techThemes = [
      "technology",
      "automation",
      "digital",
      "data",
      "analytics",
      "ai",
      "integration",
      "system",
      "platform",
    ];

    [...businessThemes, ...techThemes].forEach((theme) => {
      const count = keywords.filter((word) => word.includes(theme) || theme.includes(word)).length;
      if (count > 0) themeMap[theme] = count;
    });

    return Object.entries(themeMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);
  };

  // Categorize themes
  const categorizeTheme = (theme: string): WisdomEntry["category"] => {
    if (["strategy", "planning", "growth"].includes(theme)) return "strategy";
    if (["innovation", "ai", "digital"].includes(theme)) return "innovation";
    if (["leadership", "management"].includes(theme)) return "leadership";
    if (["process", "efficiency", "execution"].includes(theme)) return "process";
    if (["technology", "system", "platform", "data", "analytics"].includes(theme))
      return "technical";
    return "insight";
  };

  // Fetch real AOMA knowledge base entries
  const fetchAOMAKnowledge = async (): Promise<WisdomEntry[]> => {
    const entries: WisdomEntry[] = [];

    // Use Next.js env variables for URLs
    const HEALTH_URL =
      process.env.NEXT_PUBLIC_AOMA_MESH_HEALTH_URL ||
      "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws/health";
    const RPC_URL =
      process.env.NEXT_PUBLIC_AOMA_MESH_RPC_URL ||
      "https://ochwh4pvfaigb65koqxgf33ruy0rxnhy.lambda-url.us-east-2.on.aws";
    try {
      // Test AOMA MCP server health
      const healthResponse = await fetch(HEALTH_URL);
      const aomaStatus = healthResponse.ok;

      if (aomaStatus) {
        // Fetch real AOMA knowledge base entries
        try {
          const knowledgeResponse = await fetch(RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "tools/call",
              params: {
                name: "query_aoma_knowledge",
                arguments: {
                  query:
                    "What are the key strategic insights and best practices from the Sony Music AOMA knowledge base?",
                  strategy: "comprehensive",
                },
              },
            }),
          });

          const knowledgeData = await knowledgeResponse.json();
          console.log("AOMA Wisdom Response:", knowledgeData);

          if (
            knowledgeData.result &&
            knowledgeData.result.content &&
            knowledgeData.result.content[0]
          ) {
            try {
              // Parse the JSON string from the response
              const aomaResponse = JSON.parse(knowledgeData.result.content[0].text);
              console.log("Parsed AOMA Wisdom Response:", aomaResponse);

              const responseText = aomaResponse.response || "";

              // Extract key insights and create wisdom entries
              const insightsList = responseText
                .split("\\n")
                .filter((line: string) => line.trim().startsWith("**"));

              if (insightsList.length > 0) {
                entries.push({
                  id: "aoma-strategic-insights",
                  title: "Sony Music AOMA Strategy",
                  content:
                    responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
                  category: "strategy",
                  tags: ["AOMA", "strategy", "Sony Music", "digital assets"],
                  confidence: 92,
                  relevance: 95,
                  lastAccessed: new Date(aomaResponse.metadata?.timestamp || Date.now()),
                  source: "aoma",
                  interactionCount: insightsList.length * 3,
                  featured: true,
                  summary: `Latest strategic insights from Sony Music AOMA system with ${insightsList.length} key updates`,
                });
              }
            } catch (parseError) {
              console.error("Error parsing AOMA wisdom response:", parseError);
              // Fallback entry
              entries.push({
                id: "aoma-strategic-insights",
                title: "Strategic AOMA Insights",
                content: "Key strategic insights from Sony Music AOMA knowledge base",
                category: "strategy",
                tags: ["AOMA", "strategy", "Sony Music"],
                confidence: 92,
                relevance: 95,
                lastAccessed: new Date(),
                source: "aoma",
                interactionCount: 15,
                featured: true,
                summary: "Comprehensive strategic insights from the AOMA knowledge base",
              });
            }
          }
        } catch (error) {
          console.log("AOMA wisdom query failed:", error);
        }

        // Fetch additional knowledge categories
        try {
          const workflowResponse = await fetch(RPC_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: "query_aoma_knowledge",
                arguments: {
                  query:
                    "What are the latest workflow optimization insights and process improvements?",
                  strategy: "focused",
                },
              },
            }),
          });

          const workflowData = await workflowResponse.json();
          console.log("AOMA Workflow Response:", workflowData);

          if (
            workflowData.result &&
            workflowData.result.content &&
            workflowData.result.content[0]
          ) {
            try {
              // Parse the JSON string from the response
              const aomaResponse = JSON.parse(workflowData.result.content[0].text);
              console.log("Parsed AOMA Workflow Response:", aomaResponse);

              const responseText = aomaResponse.response || "";

              // Extract workflow insights
              const workflowInsights = responseText
                .split("\\n")
                .filter(
                  (line: string) =>
                    line.trim().startsWith("**") ||
                    line.includes("workflow") ||
                    line.includes("process")
                );

              if (workflowInsights.length > 0) {
                entries.push({
                  id: "aoma-workflow-optimization",
                  title: "AOMA Workflow Optimization",
                  content:
                    responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
                  category: "process",
                  tags: ["workflow", "optimization", "process", "AOMA"],
                  confidence: 88,
                  relevance: 87,
                  lastAccessed: new Date(aomaResponse.metadata?.timestamp || Date.now()),
                  source: "aoma",
                  interactionCount: workflowInsights.length * 2,
                  featured: false,
                  summary: `Process improvement insights from AOMA workflows with ${workflowInsights.length} optimization points`,
                });
              }
            } catch (parseError) {
              console.error("Error parsing AOMA workflow response:", parseError);
              // Fallback entry
              entries.push({
                id: "aoma-workflow-optimization",
                title: "Workflow Optimization",
                content: "Latest workflow optimization insights and process improvements",
                category: "process",
                tags: ["workflow", "optimization", "process"],
                confidence: 88,
                relevance: 87,
                lastAccessed: new Date(),
                source: "aoma",
                interactionCount: 8,
                featured: false,
                summary: "Process improvement insights from AOMA workflows",
              });
            }
          }
        } catch (error) {
          console.log("AOMA workflow query failed:", error);
        }

        // Add fallback entries if no real data was fetched
        if (entries.length === 0) {
          entries.push({
            id: "aoma-1",
            title: "Digital Asset Management Best Practices",
            content:
              "Comprehensive guide to managing digital assets in enterprise environments with focus on metadata, versioning, and access control.",
            summary: "Essential strategies for DAM implementation and optimization.",
            category: "technical",
            tags: ["dam", "assets", "metadata", "enterprise"],
            confidence: 92,
            relevance: 88,
            lastAccessed: new Date(),
            source: "aoma",
            interactionCount: 156,
            featured: true,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching AOMA knowledge:", error);
    }

    return entries;
  };

  // Sample wisdom entries for demo
  const getSampleWisdomEntries = (): WisdomEntry[] => [
    {
      id: "sample-1",
      title: "Effective Meeting Facilitation",
      content:
        "Techniques for running productive meetings that drive decision-making and maintain engagement.",
      summary: "Key principles for meeting effectiveness and participant engagement.",
      category: "leadership",
      tags: ["meetings", "facilitation", "productivity"],
      confidence: 85,
      relevance: 82,
      lastAccessed: new Date(),
      source: "knowledge_base",
      interactionCount: 42,
      featured: false,
    },
    {
      id: "sample-2",
      title: "Innovation Pipeline Management",
      content:
        "Structured approach to managing innovation initiatives from ideation to implementation.",
      summary: "Framework for systematic innovation management and execution.",
      category: "innovation",
      tags: ["innovation", "pipeline", "management", "execution"],
      confidence: 90,
      relevance: 87,
      lastAccessed: new Date(Date.now() - 1800000), // 30 minutes ago
      source: "knowledge_base",
      interactionCount: 67,
      featured: true,
    },
  ];

  // Filter entries based on search and category
  const filteredEntries = wisdomEntries.filter((entry) => {
    const matchesSearch =
      searchQuery === "" ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Load wisdom entries on component mount and when conversation changes
  useEffect(() => {
    generateWisdomEntries().then(setWisdomEntries);
  }, [currentConversation]);

  const getSourceColor = (source: string): string => {
    switch (source) {
      case "aoma":
        return "text-motiff-secondary";
      case "conversation":
        return "text-motiff-primary";
      case "knowledge_base":
        return "text-motiff-accent";
      case "system":
        return "text-motiff-green";
      default:
        return "text-white/60";
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryConfig = categories.find((c) => c.value === category);
    if (categoryConfig) {
      const Icon = categoryConfig.icon;
      return <Icon size={14} />;
    }
    return <FileText size={14} />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="mac-title">Wisdom Library</h3>
        <div className="flex items-center gap-2">
          {mcpState.isConnected && <span className="motiff-status-connected text-xs">AOMA</span>}
          <button className="text-motiff-accent/70 hover:text-motiff-accent text-sm transition-colors">
            Browse All
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search wisdom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="motiff-chat-input w-full pl-10 pr-4 py-2 text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto motiff-scrollbar">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-motiff-accent/20 text-motiff-accent border border-motiff-accent/30"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={12} />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wisdom Entries */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="motiff-glass-panel p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded mb-2"></div>
              <div className="h-3 bg-white/5 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="motiff-glass-panel p-4 text-center">
          <BookOpen className="mx-auto mb-2 text-motiff-accent" size={24} />
          <p className="text-sm text-white/60">
            {searchQuery || selectedCategory !== "all"
              ? "No matching wisdom found"
              : "Wisdom entries will appear here"}
          </p>
          <p className="text-xs text-white/40 mt-2">
            Start a conversation to get contextual recommendations
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className={`motiff-insight-card cursor-pointer ${entry.featured ? "ring-1 ring-motiff-accent/30" : ""}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-motiff-accent/10 text-motiff-accent">
                    {getCategoryIcon(entry.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4
                        className="mac-title"
                        className="mac-title font-medium text-white text-sm truncate"
                      >
                        {entry.title}
                      </h4>
                      {entry.featured && (
                        <Star size={12} className="text-motiff-orange flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-white/60 mb-2 line-clamp-2">
                      {entry.summary || entry.content}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="motiff-metric-value text-xs">
                        {Math.round(entry.confidence)}% relevant
                      </span>
                      <span className="text-xs text-white/40">{entry.interactionCount} views</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-white/40">
                    {entry.lastAccessed.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div
                    className={`text-xs px-2 py-2 rounded-full bg-white/10 ${getSourceColor(entry.source)}`}
                  >
                    {entry.source.toUpperCase()}
                  </div>
                  <ArrowRight
                    size={12}
                    className="text-white/40 hover:text-white transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {filteredEntries.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex gap-2">
            <button className="flex-1 motiff-glass-panel px-4 py-2 text-xs text-white/70 hover:text-white transition-colors">
              <Brain size={12} className="inline mr-2" />
              AI Summary
            </button>
            <button className="flex-1 motiff-glass-panel px-4 py-2 text-xs text-white/70 hover:text-white transition-colors">
              <MessageCircle size={12} className="inline mr-2" />
              Ask About
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
