/**
 * FeedbackBadge - Inline Feedback Status Indicator
 *
 * Compact badge showing feedback status on messages:
 * - Positive/negative feedback indicators
 * - Rating stars
 * - Correction availability
 * - Curator approval status
 *
 * Designed for inline use in chat messages and lists.
 */

"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  StarHalf,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { FeedbackStatus, FeedbackSeverity } from "./types";

export interface FeedbackBadgeData {
  thumbsUp?: boolean | null;
  rating?: number | null;
  hasCorrection?: boolean;
  status?: FeedbackStatus;
  severity?: FeedbackSeverity | null;
  categoriesCount?: number;
  feedbackText?: string | null;
}

interface FeedbackBadgeProps {
  feedback: FeedbackBadgeData | null;
  variant?: "minimal" | "compact" | "detailed";
  onClick?: () => void;
  className?: string;
}

export function FeedbackBadge({
  feedback,
  variant = "compact",
  onClick,
  className,
}: FeedbackBadgeProps) {
  if (!feedback) return null;

  const { thumbsUp, rating, hasCorrection, status, severity, categoriesCount, feedbackText } =
    feedback;

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalf && <StarHalf className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-muted-foreground" />
        ))}
      </div>
    );
  };

  const renderStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
        label: "Pending",
      },
      reviewing: {
        icon: Clock,
        color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
        label: "Reviewing",
      },
      approved: {
        icon: CheckCircle,
        color: "text-green-400 border-green-500/30 bg-green-500/10",
        label: "Approved",
      },
      rejected: {
        icon: XCircle,
        color: "text-red-400 border-red-500/30 bg-red-500/10",
        label: "Rejected",
      },
      needs_revision: {
        icon: AlertTriangle,
        color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
        label: "Needs Revision",
      },
      exported: {
        icon: CheckCircle,
        color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
        label: "Exported",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("text-xs", config.color)}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderSeverityIndicator = () => {
    if (!severity) return null;

    const severityConfig = {
      critical: {
        color: "bg-red-500",
        label: "Critical issue",
      },
      major: {
        color: "bg-orange-500",
        label: "Major issue",
      },
      minor: {
        color: "bg-yellow-500",
        label: "Minor issue",
      },
      suggestion: {
        color: "bg-blue-500",
        label: "Suggestion",
      },
    };

    const config = severityConfig[severity];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={cn("h-2 w-2 rounded-full", config.color)} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Minimal variant - just thumbs icon
  if (variant === "minimal") {
    if (thumbsUp === null || thumbsUp === undefined) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={cn(
                "inline-flex items-center justify-center p-1 rounded transition-colors",
                thumbsUp
                  ? "text-green-400 hover:bg-green-500/10"
                  : "text-red-400 hover:bg-red-500/10",
                className
              )}
            >
              {thumbsUp ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {thumbsUp ? "Positive feedback" : "Negative feedback"}
              {feedbackText && (
                <span className="block text-xs text-muted-foreground mt-1 max-w-48 truncate">
                  &ldquo;{feedbackText}&rdquo;
                </span>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Compact variant - thumbs + optional indicators
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
                "bg-muted/50 border border-border/50",
                "hover:bg-muted transition-colors",
                className
              )}
            >
              {thumbsUp !== null &&
                thumbsUp !== undefined &&
                (thumbsUp ? (
                  <ThumbsUp className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <ThumbsDown className="h-3.5 w-3.5 text-red-400" />
                ))}

              {rating !== null && rating !== undefined && (
                <div className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-foreground">{rating}</span>
                </div>
              )}

              {hasCorrection && <Target className="h-3.5 w-3.5 text-blue-400" />}

              {severity && renderSeverityIndicator()}

              {categoriesCount !== undefined && categoriesCount > 0 && (
                <span className="text-xs text-muted-foreground">+{categoriesCount}</span>
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            <div className="space-y-1">
              {thumbsUp !== null && thumbsUp !== undefined && (
                <p className="text-sm">{thumbsUp ? "Positive feedback" : "Negative feedback"}</p>
              )}
              {rating !== null && rating !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">Rating:</span>
                  {renderStars(rating)}
                </div>
              )}
              {hasCorrection && (
                <p className="text-xs text-blue-400">Contains suggested correction</p>
              )}
              {feedbackText && (
                <p className="text-xs text-muted-foreground italic">&ldquo;{feedbackText}&rdquo;</p>
              )}
              {status && <p className="text-xs text-muted-foreground">Status: {status}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant - full display
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg",
        "bg-muted/30 border border-border/50",
        onClick && "cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
    >
      {/* Thumbs Indicator */}
      {thumbsUp !== null && thumbsUp !== undefined && (
        <div
          className={cn(
            "flex items-center justify-center p-1.5 rounded-full",
            thumbsUp ? "bg-green-500/20" : "bg-red-500/20"
          )}
        >
          {thumbsUp ? (
            <ThumbsUp className="h-4 w-4 text-green-400" />
          ) : (
            <ThumbsDown className="h-4 w-4 text-red-400" />
          )}
        </div>
      )}

      {/* Rating */}
      {rating !== null && rating !== undefined && renderStars(rating)}

      {/* Indicators */}
      <div className="flex items-center gap-2">
        {hasCorrection && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                  <Target className="h-3 w-3 mr-1" />
                  Correction
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>User provided a suggested correction</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {feedbackText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Comment
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                <p className="text-sm italic">&ldquo;{feedbackText}&rdquo;</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {severity && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              severity === "critical"
                ? "text-red-400 border-red-500/30"
                : severity === "major"
                  ? "text-orange-400 border-orange-500/30"
                  : severity === "minor"
                    ? "text-yellow-400 border-yellow-500/30"
                    : "text-blue-400 border-blue-500/30"
            )}
          >
            {severity}
          </Badge>
        )}

        {renderStatusBadge()}
      </div>
    </motion.div>
  );
}

export default FeedbackBadge;
