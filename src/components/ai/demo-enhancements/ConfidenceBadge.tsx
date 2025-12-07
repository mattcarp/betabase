"use client";

import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";

interface ConfidenceBadgeProps {
  confidence: number; // 0-1 scale
  sourceCount?: number;
  strategy?: "standard" | "context-aware" | "agentic";
  className?: string;
  showTooltip?: boolean;
}

/**
 * Confidence badge showing system self-awareness
 * Color-coded based on confidence level with tooltip explanation
 */
export function ConfidenceBadge({
  confidence,
  sourceCount,
  strategy,
  className,
  showTooltip = true,
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  const getConfidenceLevel = () => {
    if (confidence >= 0.85) return "high";
    if (confidence >= 0.7) return "medium";
    if (confidence >= 0.5) return "low";
    return "uncertain";
  };

  const level = getConfidenceLevel();

  const config = {
    high: {
      icon: ShieldCheck,
      label: "High Confidence",
      description: "Response well-supported by multiple verified sources",
      bgClass: "bg-green-500/10",
      borderClass: "border-green-500/30",
      textClass: "text-green-400",
      iconClass: "text-green-400",
    },
    medium: {
      icon: Shield,
      label: "Good Confidence",
      description: "Response supported by relevant documentation",
      bgClass: "bg-yellow-500/10",
      borderClass: "border-yellow-500/30",
      textClass: "text-yellow-400",
      iconClass: "text-yellow-400",
    },
    low: {
      icon: ShieldAlert,
      label: "Lower Confidence",
      description: "Limited source coverage - verify important details",
      bgClass: "bg-orange-500/10",
      borderClass: "border-orange-500/30",
      textClass: "text-orange-400",
      iconClass: "text-orange-400",
    },
    uncertain: {
      icon: ShieldQuestion,
      label: "Needs Review",
      description: "Insufficient source data - human verification recommended",
      bgClass: "bg-red-500/10",
      borderClass: "border-red-500/30",
      textClass: "text-red-400",
      iconClass: "text-red-400",
    },
  };

  const {
    icon: Icon,
    label,
    description,
    bgClass,
    borderClass,
    textClass,
    iconClass,
  } = config[level];

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 px-2 py-0.5 font-medium transition-all duration-200",
        bgClass,
        borderClass,
        textClass,
        "hover:scale-105",
        className
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", iconClass)} />
      <span>{percentage}%</span>
      {sourceCount !== undefined && (
        <span className="text-zinc-500 text-[10px] ml-1">
          ({sourceCount} source{sourceCount !== 1 ? "s" : ""})
        </span>
      )}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-zinc-900 border-zinc-700">
          <div className="space-y-1">
            <div className={cn("font-medium", textClass)}>{label}</div>
            <p className="text-xs text-zinc-400">{description}</p>
            {strategy && (
              <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-700 mt-2">
                Strategy:{" "}
                {strategy === "context-aware"
                  ? "Context-Aware"
                  : strategy === "agentic"
                    ? "Agentic RAG"
                    : "Standard"}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ConfidenceBadge;
