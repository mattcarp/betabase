import { useEffect, useState } from "react";
import { Brain, TrendingUp, Clock, Target, Lightbulb } from "lucide-react";
import { cn } from "../lib/utils";

interface Insight {
  id: string;
  type: "sentiment" | "topic" | "action" | "summary";
  title: string;
  content: string;
  confidence: number;
  timestamp: Date;
}

interface AIInsightsDashboardProps {
  transcription: string;
  isRecording: boolean;
  className?: string;
}

export function AIInsightsDashboard({
  transcription,
  isRecording,
  className,
}: AIInsightsDashboardProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [sentiment, setSentiment] = useState({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [keyTopics, setKeyTopics] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);

  // Simulate AI insights generation
  useEffect(() => {
    if (!transcription || transcription.length < 50) return;

    const generateInsights = () => {
      // Simulate sentiment analysis
      const newSentiment = {
        positive: Math.random() * 40 + 30,
        neutral: Math.random() * 30 + 20,
        negative: Math.random() * 20 + 10,
      };
      setSentiment(newSentiment);

      // Simulate topic extraction
      const topics = [
        "Project Timeline",
        "Budget Discussion",
        "Team Coordination",
        "Technical Requirements",
        "Client Feedback",
        "Risk Assessment",
        "Resource Allocation",
        "Quality Assurance",
        "Market Analysis",
      ];
      setKeyTopics(topics.slice(0, Math.floor(Math.random() * 4) + 3));

      // Simulate action items
      const actions = [
        "Follow up with client by Friday",
        "Review budget allocation for Q2",
        "Schedule technical review meeting",
        "Update project timeline documentation",
        "Coordinate with design team on prototypes",
      ];
      setActionItems(actions.slice(0, Math.floor(Math.random() * 3) + 2));

      // Generate new insight
      const insightTypes: Insight["type"][] = [
        "sentiment",
        "topic",
        "action",
        "summary",
      ];
      const randomType =
        insightTypes[Math.floor(Math.random() * insightTypes.length)] ||
        "summary";

      const newInsight: Insight = {
        id: Math.random().toString(36).substr(2, 9),
        type: randomType,
        title: getInsightTitle(randomType),
        content: getInsightContent(randomType),
        confidence: Math.random() * 0.3 + 0.7,
        timestamp: new Date(),
      };

      setInsights((prev) => [newInsight, ...prev.slice(0, 4)]);
    };

    const interval = setInterval(generateInsights, 5000);
    return () => clearInterval(interval);
  }, [transcription]);

  const getInsightTitle = (type: Insight["type"]) => {
    const titles = {
      sentiment: "Sentiment Shift Detected",
      topic: "New Topic Identified",
      action: "Action Item Suggested",
      summary: "Key Point Summary",
    };
    return titles[type];
  };

  const getInsightContent = (type: Insight["type"]) => {
    const content = {
      sentiment:
        "Discussion tone has become more positive in the last 2 minutes",
      topic: "Technical implementation details are being discussed",
      action: "Consider scheduling a follow-up meeting to discuss budget",
      summary: "Team alignment on project goals and next steps",
    };
    return content[type];
  };

  const getInsightIcon = (type: Insight["type"]) => {
    const icons = {
      sentiment: TrendingUp,
      topic: Target,
      action: Lightbulb,
      summary: Brain,
    };
    return icons[type];
  };

  const getInsightColor = (type: Insight["type"]) => {
    const colors = {
      sentiment: "text-green-400 bg-green-400/10 border-green-400/30",
      topic: "text-blue-400 bg-blue-400/10 border-blue-400/30",
      action: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
      summary: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    };
    return colors[type];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-mono text-gray-400">SENTIMENT</span>
          </div>
          <div className="text-lg font-bold text-green-400">
            {sentiment.positive.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">Positive</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-gray-400">TOPICS</span>
          </div>
          <div className="text-lg font-bold text-cyan-400">
            {keyTopics.length}
          </div>
          <div className="text-xs text-gray-500">Identified</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-mono text-gray-400">ACTIONS</span>
          </div>
          <div className="text-lg font-bold text-yellow-400">
            {actionItems.length}
          </div>
          <div className="text-xs text-gray-500">Suggested</div>
        </div>

        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-mono text-gray-400">DURATION</span>
          </div>
          <div className="text-lg font-bold text-purple-400">
            {Math.floor(Math.random() * 45 + 5)}m
          </div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
      </div>

      {/* Live Insights Feed */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-cyan-400 font-mono">
            AI Insights
          </h3>
          {isRecording && (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto"></div>
          )}
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {insights.length > 0 ? (
            insights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={insight.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-300",
                    getInsightColor(insight.type),
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold">
                          {insight.title}
                        </h4>
                        <span className="text-xs opacity-60">
                          {Math.floor(insight.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-xs opacity-80 leading-relaxed">
                        {insight.content}
                      </p>
                      <div className="text-xs opacity-50 mt-1">
                        {insight.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-mono text-sm">
                {isRecording
                  ? "Analyzing conversation..."
                  : "Start recording to see AI insights"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Key Topics */}
      {keyTopics.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-bold text-cyan-400 font-mono mb-3">
            KEY TOPICS
          </h3>
          <div className="flex flex-wrap gap-2">
            {keyTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-xs text-cyan-400 font-mono"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-bold text-yellow-400 font-mono mb-3">
            ACTION ITEMS
          </h3>
          <div className="space-y-2">
            {actionItems.map((action, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AIInsightsDashboard;
