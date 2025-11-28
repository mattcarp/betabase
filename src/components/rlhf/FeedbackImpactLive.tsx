/**
 * FeedbackImpactLive - Real-Time RLHF Impact Visualization
 *
 * Shows the virtuous cycle of human feedback in real-time:
 * - Live counter of feedback received
 * - Test cases generated from corrections
 * - Accuracy improvements over time
 * - Training batch status
 * - Animated flow visualization
 *
 * This is a KEY demo component showing the feedback loop in action.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  MessageSquareQuote,
  FileCheck,
  BrainCircuit,
  Sparkles,
  Activity,
  Users,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
} from "lucide-react";

interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  testCasesGenerated: number;
  correctionsReceived: number;
  currentAccuracy: number;
  previousAccuracy: number;
  trainingBatches: number;
  pendingReview: number;
  approvedToday: number;
}

interface RecentFeedbackItem {
  id: string;
  type: "positive" | "negative" | "correction";
  preview: string;
  timestamp: Date;
  testsGenerated?: number;
  status: "pending" | "approved" | "training";
}

interface FeedbackImpactLiveProps {
  stats?: FeedbackStats;
  recentFeedback?: RecentFeedbackItem[];
  onRefresh?: () => void;
  isLive?: boolean;
  className?: string;
}

// Default demo stats
const DEFAULT_STATS: FeedbackStats = {
  totalFeedback: 156,
  positiveCount: 127,
  negativeCount: 29,
  testCasesGenerated: 89,
  correctionsReceived: 23,
  currentAccuracy: 94.2,
  previousAccuracy: 83.1,
  trainingBatches: 3,
  pendingReview: 12,
  approvedToday: 8,
};

const DEFAULT_RECENT: RecentFeedbackItem[] = [
  {
    id: "1",
    type: "correction",
    preview: "Added mandatory AOMA 9.1 section reference",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    testsGenerated: 4,
    status: "approved",
  },
  {
    id: "2",
    type: "correction",
    preview: "Fixed classification hierarchy for rights management",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    testsGenerated: 6,
    status: "training",
  },
  {
    id: "3",
    type: "negative",
    preview: "Response missing key royalty calculation details",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    testsGenerated: 3,
    status: "approved",
  },
];

// Animated counter component
function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

// Flow step component
function FlowStep({
  icon,
  label,
  isActive,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  pulse?: boolean;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={pulse ? { scale: [1, 1.1, 1] } : undefined}
      transition={{ duration: 0.5, repeat: pulse ? Infinity : 0, repeatDelay: 2 }}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all",
          isActive
            ? "bg-purple-500/30 text-purple-400 ring-2 ring-purple-500/50"
            : "bg-zinc-800/50 text-zinc-400"
        )}
      >
        {icon}
      </div>
      <span className="text-xs text-zinc-400 text-center max-w-[80px]">
        {label}
      </span>
    </motion.div>
  );
}

// Animated arrow
function AnimatedArrow({ isActive }: { isActive?: boolean }) {
  return (
    <motion.div
      className="flex items-center"
      animate={isActive ? { x: [0, 4, 0] } : undefined}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <ArrowRight
        className={cn(
          "h-5 w-5 transition-colors",
          isActive ? "text-purple-400" : "text-zinc-600"
        )}
      />
    </motion.div>
  );
}

export function FeedbackImpactLive({
  stats = DEFAULT_STATS,
  recentFeedback = DEFAULT_RECENT,
  onRefresh,
  isLive = true,
  className,
}: FeedbackImpactLiveProps) {
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [showNewFeedback, setShowNewFeedback] = useState(false);

  // Animate flow steps
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      setActiveFlowStep((prev) => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(timer);
  }, [isLive]);

  // Simulate new feedback notification
  useEffect(() => {
    if (!isLive) return;

    const timer = setInterval(() => {
      setShowNewFeedback(true);
      setTimeout(() => setShowNewFeedback(false), 3000);
    }, 15000);

    return () => clearInterval(timer);
  }, [isLive]);

  const accuracyImprovement = stats.currentAccuracy - stats.previousAccuracy;
  const positiveRate = (stats.positiveCount / stats.totalFeedback) * 100;

  return (
    <Card className={cn("bg-zinc-900/50 border-zinc-800", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-light text-zinc-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Feedback Impact
            {isLive && (
              <Badge
                variant="outline"
                className="bg-green-500/10 text-green-400 border-green-500/30 text-xs"
              >
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                Live
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 border-purple-500/30"
            >
              <TrendingUp className="h-3 w-3 mr-1" />+{accuracyImprovement.toFixed(1)}
              % accuracy
            </Badge>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* New Feedback Animation */}
        <AnimatePresence>
          {showNewFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 flex items-center gap-3"
            >
              <Zap className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-purple-300">
                New feedback received! Processing...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={<Users className="h-5 w-5" />}
            value={stats.totalFeedback}
            label="Total Feedback"
            trend={12}
            color="blue"
          />
          <MetricCard
            icon={<MessageSquareQuote className="h-5 w-5" />}
            value={stats.correctionsReceived}
            label="Corrections"
            color="orange"
          />
          <MetricCard
            icon={<FileCheck className="h-5 w-5" />}
            value={stats.testCasesGenerated}
            label="Tests Generated"
            color="green"
          />
          <MetricCard
            icon={<BrainCircuit className="h-5 w-5" />}
            value={stats.trainingBatches}
            label="Training Batches"
            color="purple"
          />
        </div>

        {/* Accuracy Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-400">Current Accuracy</span>
            <span className="text-lg font-medium text-zinc-100">
              <AnimatedCounter value={stats.currentAccuracy} suffix="%" />
            </span>
          </div>
          <div className="relative">
            <Progress value={stats.currentAccuracy} className="h-3" />
            {/* Previous accuracy marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-500"
              style={{ left: `${stats.previousAccuracy}%` }}
              title={`Previous: ${stats.previousAccuracy}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Started at {stats.previousAccuracy}%</span>
            <span>+{accuracyImprovement.toFixed(1)}% improvement</span>
          </div>
        </div>

        {/* Virtuous Cycle Flow Visualization */}
        <div className="py-6">
          <div className="flex items-center justify-center gap-4">
            <FlowStep
              icon={<MessageSquareQuote className="h-5 w-5" />}
              label="User Feedback"
              isActive={activeFlowStep === 0}
              pulse={activeFlowStep === 0}
            />
            <AnimatedArrow isActive={activeFlowStep >= 0} />
            <FlowStep
              icon={<CheckCircle className="h-5 w-5" />}
              label="Curator Review"
              isActive={activeFlowStep === 1}
              pulse={activeFlowStep === 1}
            />
            <AnimatedArrow isActive={activeFlowStep >= 1} />
            <FlowStep
              icon={<FileCheck className="h-5 w-5" />}
              label="Test Cases"
              isActive={activeFlowStep === 2}
              pulse={activeFlowStep === 2}
            />
            <AnimatedArrow isActive={activeFlowStep >= 2} />
            <FlowStep
              icon={<BrainCircuit className="h-5 w-5" />}
              label="Model Training"
              isActive={activeFlowStep === 3}
              pulse={activeFlowStep === 3}
            />
            <AnimatedArrow isActive={activeFlowStep >= 3} />
            <FlowStep
              icon={<Sparkles className="h-5 w-5" />}
              label="Better AI"
              isActive={activeFlowStep === 3}
            />
          </div>
        </div>

        {/* Queue Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Pending Review</span>
            </div>
            <div className="text-2xl font-light text-zinc-100">
              {stats.pendingReview}
            </div>
          </div>
          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 text-zinc-400 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm">Approved Today</span>
            </div>
            <div className="text-2xl font-light text-zinc-100">
              {stats.approvedToday}
            </div>
          </div>
        </div>

        {/* Recent Corrections with Impact */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <MessageSquareQuote className="h-4 w-4 text-orange-400" />
            Recent Corrections
          </h4>
          <div className="space-y-2">
            {recentFeedback.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{item.preview}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        item.status === "training"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          : item.status === "approved"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
                {item.testsGenerated && (
                  <Badge
                    variant="secondary"
                    className="ml-3 bg-blue-500/10 text-blue-400"
                  >
                    +{item.testsGenerated} tests
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for metric cards
function MetricCard({
  icon,
  value,
  label,
  trend,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  trend?: number;
  color: "blue" | "orange" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    orange: "bg-orange-500/10 text-orange-400 ring-orange-500/20",
    green: "bg-green-500/10 text-green-400 ring-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
  };

  return (
    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
      <div className="flex items-center justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center ring-1",
            colorClasses[color]
          )}
        >
          {icon}
        </div>
        {trend && (
          <Badge
            variant="outline"
            className="text-xs bg-green-500/10 text-green-400 border-green-500/30"
          >
            <TrendingUp className="h-3 w-3 mr-1" />+{trend}%
          </Badge>
        )}
      </div>
      <div className="text-2xl font-light text-zinc-100">
        <AnimatedCounter value={value} />
      </div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

// Helper function for timestamp formatting
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return "Just now";
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

export default FeedbackImpactLive;
