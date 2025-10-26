import React from "react";
import { cn } from "../../../lib/utils";
import {
  MessageCircle,
  Target,
  TestTube,
  Wrench,
  ClipboardList,
  BarChart3,
  Lightbulb,
  CheckSquare,
  TrendingUp,
  FileText,
  // ArrowUpRight, // Unused
  // ArrowDownRight, // Unused
  // ArrowRight, // Unused
  ChevronRight,
} from "lucide-react";
import { LiveInsights } from "../LiveInsights";
import { WisdomLibrary } from "../WisdomLibrary";
import { TopicPanel } from "../TopicVisualization";
import { useTopicExtraction, useTopicVisualization } from "../../../hooks/useTopicExtraction";

interface RightSidebarProps {
  cclassName?: string;
  currentConversation?: any[];
  onToggle?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  cclassName,
  currentConversation = [],
  onToggle,
}) => {
  const [topicState, topicActions] = useTopicExtraction();
  const { trendingTopics, clusters } = useTopicVisualization();

  const navigationItems = [
    { id: "chat", label: "Chat", icon: MessageCircle, isActive: true },
    { id: "hud", label: "HUD", icon: Target },
    { id: "test", label: "Test", icon: TestTube },
    { id: "fix", label: "Fix", icon: Wrench },
    { id: "curate", label: "Curate", icon: ClipboardList },
  ];

  // NO MOCK DATA - Real metrics would come from actual conversation analysis
  // const wisdomLibraryItems: any[] = []; // Unused - keeping for future use

  const meetingTools = [
    { name: "Meeting Analyzer", icon: BarChart3 },
    { name: "Insight Generator", icon: Lightbulb },
    { name: "Action Tracker", icon: CheckSquare },
    { name: "Visual Summary", icon: TrendingUp },
    { name: "Report Builder", icon: FileText },
  ];

  // NO MOCK DATA - Real session metrics would come from actual meeting analysis
  const sessionMetrics: any[] = [];

  const handleTopicClick = (topic: any) => {
    // Find related documents when a topic is clicked
    const related = topicActions.findRelatedDocuments(topic.term, 5);
    console.log("Related documents for topic:", topic.term, related);
  };

  const handleClusterClick = (cluster: any) => {
    console.log("Cluster clicked:", cluster.name, cluster.topics.length, "topics");
  };

  return (
    <div cclassName={cn("flex flex-col h-full space-y-6 relative", cclassName)}>
      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        cclassName="absolute -left-4 top-8 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800/50 hover:bg-zinc-800 transition-colors group"
        aria-label="Toggle sidebar"
      >
        <ChevronRight cclassName="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
      </button>

      {/* Navigation Section */}
      <div>
        <h3 cclassName="mac-title">
          Navigation
        </h3>
        <div cclassName="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              cclassName={cn(
                "w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200",
                "glass-panel border text-sm",
                item.isActive
                  ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                  : "bg-white/5 border-white/20 text-white hover:bg-white/10"
              )}
            >
              <item.icon size={16} />
              <span cclassName="font-normal">{item.label}</span>
              {item.isActive && <div cclassName="" />}
            </button>
          ))}
        </div>
      </div>

      {/* Live Insights */}
      <LiveInsights currentConversation={currentConversation} cclassName="mb-6" />

      {/* Wisdom Library */}
      <WisdomLibrary
        conversationContext={
          (currentConversation?.length > 0 ? JSON.stringify(currentConversation) : undefined) as any
        }
        cclassName="mb-6"
      />

      {/* Topic Intelligence Panel */}
      {topicState.topics.length > 0 && (
        <TopicPanel
          topics={topicState.topics}
          clusters={clusters}
          trendingTopics={trendingTopics}
          stats={{
            totalTopics: topicState.totalTopics,
            totalClusters: topicState.clusters.length,
            totalDocuments: topicState.totalDocuments,
            lastUpdated: topicState.lastUpdated,
          }}
          onTopicClick={handleTopicClick}
          onClusterClick={handleClusterClick}
          cclassName="mb-6"
        />
      )}

      {/* Meeting Tools */}
      <div>
        <h3 cclassName="mac-title text-lg font-normal text-white mb-4">
          Meeting Tools
        </h3>
        <div cclassName="space-y-2">
          {meetingTools.map((tool, index) => (
            <button
              key={index}
              cclassName="w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 glass-panel border border-white/20 bg-white/5 hover:bg-white/10 text-sm text-white"
            >
              <tool.icon size={16} />
              <span>{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Metrics */}
      <div cclassName="mt-auto">
        <h3 cclassName="mac-title text-lg font-normal text-white mb-4">
          Meeting Metrics
        </h3>
        <div cclassName="space-y-3">
          {sessionMetrics.length > 0 ? (
            sessionMetrics.map((metric, index) => (
              <div
                key={index}
                cclassName="glass-panel p-4 rounded-lg border border-white/20 bg-white/5"
              >
                <div cclassName="flex items-center justify-between mb-2">
                  <span cclassName="text-xs text-white/70">{metric.label}</span>
                  <span cclassName={cn("text-sm font-normal", `text-${metric.color}`)}>
                    {metric.value}
                  </span>
                </div>
                <div cclassName="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    cclassName={cn("h-full rounded-full", `bg-${metric.color}`)}
                    style={{ width: metric.value }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div cclassName="glass-panel p-4 rounded-lg border border-white/20 bg-white/5 text-center">
              <p cclassName="text-sm text-white/60">No active meeting metrics</p>
              <p cclassName="text-xs text-white/40 mt-2">Metrics will appear during conversations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
