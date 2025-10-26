"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import {
  Brain,
  Activity,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";

interface LangSmithTrace {
  id: string;
  name: string;
  runType: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: "success" | "error" | "pending";
  error?: string;
  inputs?: any;
  outputs?: any;
  metadata?: any;
}

interface LangSmithStatus {
  enabled: boolean;
  project: string;
  endpoint: string;
  tracingEnabled: boolean;
  hasApiKey: boolean;
  clientInitialized: boolean;
}

export function IntrospectionDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [traces, setTraces] = useState<LangSmithTrace[]>([]);
  const [status, setStatus] = useState<LangSmithStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTrace, setSelectedTrace] = useState<LangSmithTrace | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch LangSmith status and recent traces
  const fetchIntrospectionData = async () => {
    setLoading(true);
    try {
      // Call the AOMA API endpoint to get LangSmith data
      const response = await fetch("/api/introspection", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
        setTraces(data.traces || []);
      }
    } catch (error) {
      console.error("Failed to fetch introspection data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIntrospectionData();
      // Refresh every 5 seconds while open
      const interval = setInterval(fetchIntrospectionData, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case "pending":
        return <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRunTypeColor = (runType: string) => {
    switch (runType) {
      case "tool":
        return "bg-blue-500/10 text-blue-500";
      case "chain":
        return "bg-purple-500/10 text-purple-500";
      case "llm":
        return "bg-green-500/10 text-green-500";
      case "retriever":
        return "bg-orange-500/10 text-orange-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative flex items-center gap-2 mac-button mac-button-outline"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Introspection</span>
            {status?.tracingEnabled && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[400px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              AI Agent Introspection
            </span>
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          </DropdownMenuLabel>

          {status && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-2.5 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">LangSmith Status:</span>
                  <Badge
                    variant={status.tracingEnabled ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {status.tracingEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {status.tracingEnabled && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-muted-foreground">Project:</span>
                      <span className="font-mono text-xs">{status.project}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Traces (5s):</span>
                      <span className="font-mono text-xs">{traces.length}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Recent Agent Activity
          </DropdownMenuLabel>

          <ScrollArea className="h-[300px]">
            {traces.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                {status?.tracingEnabled ? (
                  <>
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent traces</p>
                    <p className="text-xs mt-2">Agent activity will appear here</p>
                  </>
                ) : (
                  <>
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Tracing disabled</p>
                    <p className="text-xs mt-2">Enable LangSmith to see traces</p>
                  </>
                )}
              </div>
            ) : (
              traces.map((trace) => (
                <DropdownMenuItem
                  key={trace.id}
                  className="flex flex-col items-start gap-2 py-2 cursor-pointer"
                  onClick={() => {
                    setSelectedTrace(trace);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(trace.status)}
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {trace.name}
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0 ${getRunTypeColor(trace.runType)}`}
                    >
                      {trace.runType}
                    </Badge>
                    <span className="text-muted-foreground">{formatTime(trace.startTime)}</span>
                    <span className="text-muted-foreground">{formatDuration(trace.duration)}</span>
                  </div>
                  {trace.error && (
                    <span className="text-xs text-red-500 truncate w-full">{trace.error}</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>

          {status?.tracingEnabled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-center justify-center cursor-pointer"
                onClick={() =>
                  window.open(
                    `https://smith.langchain.com/o/aoma-mesh/projects/p/${status.project}`,
                    "_blank"
                  )
                }
              >
                <Eye className="h-3 w-3 mr-2" />
                View in LangSmith Dashboard
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Trace Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTrace && getStatusIcon(selectedTrace.status)}
              {selectedTrace?.name}
            </DialogTitle>
            <DialogDescription>Trace ID: {selectedTrace?.id}</DialogDescription>
          </DialogHeader>

          {selectedTrace && (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {/* Metadata */}
                <div>
                  <h4 className="mac-title">Metadata</h4>
                  <div className="bg-muted rounded-lg p-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline" className={getRunTypeColor(selectedTrace.runType)}>
                        {selectedTrace.runType}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Time:</span>
                      <span>{new Date(selectedTrace.startTime).toLocaleString()}</span>
                    </div>
                    {selectedTrace.endTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Time:</span>
                        <span>{new Date(selectedTrace.endTime).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{formatDuration(selectedTrace.duration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={selectedTrace.status === "success" ? "default" : "destructive"}
                      >
                        {selectedTrace.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Inputs */}
                {selectedTrace.inputs && (
                  <div>
                    <h4 className="mac-title">Inputs</h4>
                    <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedTrace.inputs, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Outputs */}
                {selectedTrace.outputs && (
                  <div>
                    <h4 className="mac-title">Outputs</h4>
                    <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedTrace.outputs, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {selectedTrace.error && (
                  <div>
                    <h4
                      className="mac-title"
                      className="mac-title text-sm font-semibold mb-2 text-red-500"
                    >
                      Error
                    </h4>
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 text-sm text-red-600 dark:text-red-400">
                      {selectedTrace.error}
                    </div>
                  </div>
                )}

                {/* Additional Metadata */}
                {selectedTrace.metadata && Object.keys(selectedTrace.metadata).length > 0 && (
                  <div>
                    <h4 className="mac-title">Additional Context</h4>
                    <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                      {JSON.stringify(selectedTrace.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
