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
  className?: string;
  currentConversation?: any[];
  onToggle?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  className,
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
    <div className={cn("flex flex-col h-full space-y-6 relative", className)}>
      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -left-4 top-8 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border/50 hover:bg-muted transition-colors group"
        aria-label="Toggle sidebar"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {/* Navigation Section */}
      <div>
        <h3 className="mac-title">Navigation</h3>
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={cn(
                "w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200",
                "glass-panel border text-sm",
                item.isActive
                  ? "bg-neon-blue/20 border-neon-blue/30 text-neon-blue"
                  : "bg-white/5 border-white/20 text-white hover:bg-white/10"
              )}
            >
              <item.icon size={16} />
              <span className="font-normal">{item.label}</span>
              {item.isActive && <div className="" />}
            </button>
          ))}
        </div>
      </div>

      {/* Live Insights */}
      {/* <LiveInsights currentConversation={currentConversation} className="mb-6" /> */}

      {/* Wisdom Library */}
      <WisdomLibrary
        conversationContext={
          (currentConversation?.length > 0 ? JSON.stringify(currentConversation) : undefined) as any
        }
        className="mb-6"
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
          className="mb-6"
        />
      )}

      {/* Meeting Tools */}
      <div>
        <h3 className="mac-title text-lg font-normal text-white mb-4">Meeting Tools</h3>
        <div className="space-y-2">
          {meetingTools.map((tool, index) => (
            <button
              key={index}
              className="w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 glass-panel border border-white/20 bg-white/5 hover:bg-white/10 text-sm text-white"
            >
              <tool.icon size={16} />
              <span>{tool.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Metrics */}
      <div className="mt-auto">
        <h3 className="mac-title text-lg font-normal text-white mb-4">Meeting Metrics</h3>
        <div className="space-y-3">
          {sessionMetrics.length > 0 ? (
            sessionMetrics.map((metric, index) => (
              <div
                key={index}
                className="glass-panel p-4 rounded-lg border border-white/20 bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/70">{metric.label}</span>
                  <span className={cn("text-sm font-normal", `text-${metric.color}`)}>
                    {metric.value}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", `bg-${metric.color}`)}
                    style={{ width: metric.value }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel p-4 rounded-lg border border-white/20 bg-white/5 text-center">
              <p className="text-sm text-white/60">No active meeting metrics</p>
              <p className="text-xs text-white/40 mt-2">Metrics will appear during conversations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
