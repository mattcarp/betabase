import { cn } from "../lib/utils";
import { Loader2 } from "lucide-react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-700/50", className)} />;
}

interface PulsingDotProps {
  className?: string;
  delay?: string;
}

export function PulsingDot({ className, delay = "0s" }: PulsingDotProps) {
  return (
    <div
      className={cn("w-2 h-2 bg-blue-600 rounded-full animate-pulse", className)}
      style={{ animationDelay: delay }}
    />
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "cyan" | "green" | "purple" | "yellow";
  className?: string;
}

export function LoadingSpinner({ size = "md", color = "cyan", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const colorClasses = {
    cyan: "text-blue-600",
    green: "text-green-400",
    purple: "text-purple-400",
    yellow: "text-yellow-400",
  };

  return (
    <Loader2 className={cn("animate-spin", sizeClasses[size], colorClasses[color], className)} />
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  animated?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  animated = true,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-8", className)}>
      <div className={cn("mx-auto mb-4 opacity-50", animated && "animate-pulse")}>{icon}</div>
      <h3 className="mac-title">{title}</h3>
      <p className="text-sm text-gray-400 font-mono">{description}</p>
      {animated && (
        <div className="flex justify-center gap-2 mt-4">
          <PulsingDot delay="0s" />
          <PulsingDot delay="0.2s" />
          <PulsingDot delay="0.4s" />
        </div>
      )}
    </div>
  );
}

interface TranscriptionSkeletonProps {
  count?: number;
}

export function TranscriptionSkeleton({ count = 3 }: TranscriptionSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gray-700/50 border border-gray-600 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface SearchLoadingProps {
  isSearching: boolean;
  query: string;
}

export function SearchLoading({ isSearching, query }: SearchLoadingProps) {
  if (!isSearching) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-blue-600 font-mono">
      <LoadingSpinner size="sm" color="cyan" />
      <span>
        Searching for "{query.slice(0, 20)}
        {query.length > 20 ? "..." : ""}"
      </span>
    </div>
  );
}

interface VectorMatchesSkeletonProps {
  count?: number;
}

export function VectorMatchesSkeleton({ count = 3 }: VectorMatchesSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-gray-700/50 border border-gray-600 rounded p-2">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

interface AnimatedWaitingProps {
  message: string;
  icon?: React.ReactNode;
  subMessage?: string;
}

export function AnimatedWaiting({ message, icon, subMessage }: AnimatedWaitingProps) {
  return (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        {icon && <div className="animate-pulse opacity-50">{icon}</div>}
      </div>
      <div className="font-mono text-gray-300 mb-2">
        {message}
        <span className="inline-flex ml-2">
          <span className="animate-pulse" style={{ animationDelay: "0s" }}>
            .
          </span>
          <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>
            .
          </span>
          <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>
            .
          </span>
        </span>
      </div>
      {subMessage && <p className="text-sm text-gray-400 font-mono">{subMessage}</p>}
      <div className="flex justify-center gap-2 mt-4">
        <PulsingDot delay="0s" />
        <PulsingDot delay="0.3s" />
        <PulsingDot delay="0.6s" />
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  status: "loading" | "success" | "error" | "idle";
  message?: string;
  size?: "sm" | "md";
}

export function StatusIndicator({ status, message, size = "md" }: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "loading":
        return {
          color: "text-blue-600",
          icon: <LoadingSpinner size={size === "sm" ? "sm" : "md"} color="cyan" />,
        };
      case "success":
        return {
          color: "text-green-400",
          icon: <div className="w-4 h-4 bg-green-400 rounded-full" />,
        };
      case "error":
        return {
          color: "text-red-400",
          icon: <div className="w-4 h-4 bg-red-400 rounded-full" />,
        };
      default:
        return {
          color: "text-gray-400",
          icon: <div className="w-4 h-4 bg-gray-400 rounded-full opacity-50" />,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn("flex items-center gap-2", config.color)}>
      {config.icon}
      {message && <span className="text-sm font-mono">{message}</span>}
    </div>
  );
}

// Export all components as named exports and a default object
const LoadingStates = {
  LoadingSpinner,
  Skeleton,
  TranscriptionSkeleton,
  PulsingDot,
  EmptyState,
  SearchLoading,
  VectorMatchesSkeleton,
  AnimatedWaiting,
  StatusIndicator,
};

export default LoadingStates;
