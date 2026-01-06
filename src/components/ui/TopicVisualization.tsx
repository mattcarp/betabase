/**
 * Topic Visualization Components
 *
 * Provides visual representations of extracted topics including:
 * - Topic cloud
 * - Topic badges
 * - Trending topics
 * - Topic network graph
 */

import React, { useMemo } from "react";
import {
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  // Sparkles, // Unused
  Circle,
  ChevronRight,
  // Filter, // Unused
  Clock,
  // Tag, // Unused
  // Zap, // Unused
  Lightbulb,
  FileText,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ExtractedTopic, TopicCluster } from "../../services/topicExtractionService";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface TopicBadgeProps {
  topic: ExtractedTopic;
  onClick?: (topic: ExtractedTopic) => void;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

export const TopicBadge: React.FC<TopicBadgeProps> = ({
  topic,
  onClick,
  size = "sm",
  showScore = false,
  className,
}) => {
  const getTrendIcon = () => {
    switch (topic.trend) {
      case "rising":
        return <TrendingUp className="h-3 w-3" />;
      case "declining":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      technical: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      error: "bg-red-500/20 text-red-300 border-red-500/30",
      feature: "bg-green-500/20 text-green-300 border-green-500/30",
      integration: "bg-primary-400/20 text-primary-300 border-primary-400/30",
      process: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      security: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      performance: "bg-pink-500/20 text-pink-300 border-pink-500/30",
    };
    return colors[category || "technical"] || colors.technical;
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };

  return (
    <button className="mac-button"
      onClick={() => onClick?.(topic)}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border transition-all",
        "hover:scale-105 hover:shadow-lg cursor-pointer",
        getCategoryColor(topic.category),
        sizeClasses[size],
        className
      )}
      title={`Score: ${topic.score.toFixed(2)} | Documents: ${topic.documentIds.length}`}
    >
      <Hash className="h-3 w-3 opacity-60" />
      <span className="font-normal">{topic.term}</span>
      {showScore && (
        <span className="opacity-60 text-[0.7em]">{(topic.score * 100).toFixed(0)}</span>
      )}
      {topic.trend && size !== "sm" && getTrendIcon()}
    </button>
  );
};

interface TopicCloudProps {
  topics: ExtractedTopic[];
  maxTopics?: number;
  onTopicClick?: (topic: ExtractedTopic) => void;
  className?: string;
}

export const TopicCloud: React.FC<TopicCloudProps> = ({
  topics,
  maxTopics = 30,
  onTopicClick,
  className,
}) => {
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => b.score - a.score).slice(0, maxTopics);
  }, [topics, maxTopics]);

  const getTopicSize = (score: number, maxScore: number): "sm" | "md" | "lg" => {
    const relative = score / maxScore;
    if (relative > 0.7) return "lg";
    if (relative > 0.4) return "md";
    return "sm";
  };

  if (sortedTopics.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        <Lightbulb className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No topics extracted yet</p>
      </div>
    );
  }

  const maxScore = Math.max(...sortedTopics.map((t) => t.score));

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {sortedTopics.map((topic) => (
        <TopicBadge
          key={topic.id}
          topic={topic}
          onClick={onTopicClick}
          size={getTopicSize(topic.score, maxScore)}
          showScore={true}
        />
      ))}
    </div>
  );
};

interface TrendingTopicsProps {
  topics: ExtractedTopic[];
  limit?: number;
  onTopicClick?: (topic: ExtractedTopic) => void;
  className?: string;
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({
  topics,
  limit = 5,
  onTopicClick,
  className,
}) => {
  const trendingTopics = useMemo(() => {
    return topics
      .filter((t) => t.trend === "rising")
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }, [topics, limit]);

  if (trendingTopics.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-4", className)}>
        <TrendingUp className="mx-auto mb-2 h-6 w-6 opacity-50" />
        <p className="text-sm">No trending topics</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {trendingTopics.map((topic, index) => (
        <div
          key={topic.id}
          className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
          onClick={() => onTopicClick?.(topic)}
        >
          <div className="flex items-center gap-4">
            <span className="text-lg font-normal text-muted-foreground">#{index + 1}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-normal text-foreground">{topic.term}</span>
                <TrendingUp className="h-3 w-3 text-green-400" />
              </div>
              <div className="text-xs text-muted-foreground">
                {topic.documentIds.length} documents • Score: {(topic.score * 100).toFixed(0)}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
};

interface TopicClustersProps {
  clusters: TopicCluster[];
  onClusterClick?: (cluster: TopicCluster) => void;
  className?: string;
}

export const TopicClusters: React.FC<TopicClustersProps> = ({
  clusters,
  onClusterClick,
  className,
}) => {
  if (clusters.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        <Circle className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No topic clusters found</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {clusters.map((cluster) => (
        <Card
          key={cluster.id}
          className="mac-card bg-card/50 border-border hover:border-muted transition-colors cursor-pointer"
          onClick={() => onClusterClick?.(cluster)}
        >
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-normal flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-muted-foreground" />
                {cluster.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {cluster.topics.length} topics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {cluster.topics.slice(0, 5).map((topic) => (
                <Badge key={topic.id} variant="outline" className="text-xs border-border">
                  {topic.term}
                </Badge>
              ))}
              {cluster.topics.length > 5 && (
                <Badge variant="outline" className="text-xs border-border">
                  +{cluster.topics.length - 5} more
                </Badge>
              )}
            </div>

            {cluster.metadata && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                {cluster.metadata.jiraTickets?.length &&
                  cluster.metadata.jiraTickets.length > 0 && (
                    <div>Jira: {cluster.metadata.jiraTickets?.length} tickets</div>
                  )}
                {cluster.metadata.releaseNotes?.length &&
                  cluster.metadata.releaseNotes.length > 0 && (
                    <div>Releases: {cluster.metadata.releaseNotes?.length} notes</div>
                  )}
                {cluster.metadata.supportDocs?.length &&
                  cluster.metadata.supportDocs.length > 0 && (
                    <div>Docs: {cluster.metadata.supportDocs?.length} documents</div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface TopicStatsProps {
  totalTopics: number;
  totalClusters: number;
  totalDocuments: number;
  lastUpdated: Date | null;
  className?: string;
}

export const TopicStats: React.FC<TopicStatsProps> = ({
  totalTopics,
  totalClusters,
  totalDocuments,
  lastUpdated,
  className,
}) => {
  const stats = [
    { label: "Topics", value: totalTopics, icon: Hash, color: "text-blue-400" },
    {
      label: "Clusters",
      value: totalClusters,
      icon: Circle,
      color: "text-primary-400",
    },
    {
      label: "Documents",
      value: totalDocuments,
      icon: FileText,
      color: "text-green-400",
    },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-4", className)}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-4 w-4", stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-2xl font-normal text-foreground">{stat.value.toLocaleString()}</div>
          </div>
        );
      })}
      {lastUpdated && (
        <div className="col-span-3 text-xs text-muted-foreground text-center pt-2 border-t border-border">
          <Clock className="inline-block h-3 w-3 mr-2" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

interface TopicPanelProps {
  topics: ExtractedTopic[];
  clusters: TopicCluster[];
  trendingTopics: ExtractedTopic[];
  stats: {
    totalTopics: number;
    totalClusters: number;
    totalDocuments: number;
    lastUpdated: Date | null;
  };
  onTopicClick?: (topic: ExtractedTopic) => void;
  onClusterClick?: (cluster: TopicCluster) => void;
  className?: string;
}

export const TopicPanel: React.FC<TopicPanelProps> = ({
  topics,
  clusters,
  trendingTopics,
  stats,
  onTopicClick,
  onClusterClick,
  className,
}) => {
  return (
    <Card className={cn("mac-card", "bg-background border-border", className)}>
      <CardHeader className="mac-card">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          Topic Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="mac-card">
        <Tabs defaultValue="cloud" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card">
            <TabsTrigger value="cloud">Cloud</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="cloud" className="mt-4">
            <ScrollArea className="h-[300px]">
              <TopicCloud topics={topics} onTopicClick={onTopicClick} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trending" className="mt-4">
            <ScrollArea className="h-[300px]">
              <TrendingTopics topics={trendingTopics} onTopicClick={onTopicClick} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="clusters" className="mt-4">
            <ScrollArea className="h-[300px]">
              <TopicClusters clusters={clusters} onClusterClick={onClusterClick} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="mt-4">
            <TopicStats {...stats} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
