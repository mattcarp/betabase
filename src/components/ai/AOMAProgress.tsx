/**
 * AOMA Progress Component
 * Shows real-time, honest progress updates for AOMA queries
 * No fake progress - only actual service status
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Database,
  GitBranch,
  Mail,
  Ticket,
  Heart,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { AOMAProgressUpdate } from "@/services/aomaProgressStream";

interface AOMAProgressProps {
  updates: AOMAProgressUpdate[];
  cclassName?: string;
}

export function AOMAProgress({ updates, cclassName }: AOMAProgressProps) {
  const getIcon = (service?: string) => {
    if (!service) return <Loader2 cclassName="h-4 w-4 animate-spin" />;

    const iconMap: Record<string, React.ReactNode> = {
      query_aoma_knowledge: <Database cclassName="h-4 w-4" />,
      search_jira_tickets: <Ticket cclassName="h-4 w-4" />,
      search_git_commits: <GitBranch cclassName="h-4 w-4" />,
      search_outlook_emails: <Mail cclassName="h-4 w-4" />,
      get_system_health: <Heart cclassName="h-4 w-4" />,
      orchestrated: <Zap cclassName="h-4 w-4" />,
    };

    return iconMap[service] || <Loader2 cclassName="h-4 w-4 animate-spin" />;
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case "service_complete":
      case "complete":
        return <CheckCircle cclassName="h-4 w-4 text-green-500" />;
      case "service_error":
        return <AlertCircle cclassName="h-4 w-4 text-red-500" />;
      case "cache_hit":
        return <Zap cclassName="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock cclassName="h-4 w-4 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "service_complete":
      case "complete":
        return "text-green-600 dark:text-green-400";
      case "service_error":
        return "text-red-600 dark:text-red-400";
      case "cache_hit":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "text-blue-600 dark:text-blue-400";
    }
  };

  return (
    <div
      cclassName={cn(
        "space-y-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800",
        cclassName
      )}
    >
      <div cclassName="text-xs font-medium text-gray-600 dark:text-gray-400 mb-4">
        AOMA Query Progress
      </div>

      <AnimatePresence mode="popLayout">
        {updates.map((update, index) => (
          <motion.div
            key={`${update.type}-${update.timestamp}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            cclassName={cn("flex items-start gap-2 text-sm", getStatusColor(update.type))}
          >
            <span cclassName="mt-0.5 flex-shrink-0">{getStatusIcon(update.type)}</span>

            <div cclassName="flex-1 min-w-0">
              <div cclassName="flex items-center gap-2">
                {update.service && <span cclassName="flex-shrink-0">{getIcon(update.service)}</span>}
                <span cclassName="truncate">{update.message}</span>
              </div>

              {update.resultCount !== undefined && update.resultCount > 0 && (
                <div cclassName="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {update.resultCount} result{update.resultCount !== 1 ? "s" : ""} found
                </div>
              )}
            </div>

            {update.duration && (
              <span cclassName="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {formatDuration(update.duration)}
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {updates.length === 0 && (
        <div cclassName="text-sm text-gray-500 dark:text-gray-400 italic">Waiting for query...</div>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}
