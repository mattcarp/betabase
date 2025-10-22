/**
 * useAOMAStream Hook
 * Manages streaming AOMA queries with real-time progress updates
 */

import { useState, useCallback, useRef } from "react";
import type { AOMAProgressUpdate, AOMASource } from "@/services/aomaProgressStream";

interface UseAOMAStreamResult {
  query: (text: string) => Promise<void>;
  isLoading: boolean;
  result: any | null;
  error: string | null;
  progress: AOMAProgressUpdate[];
  sources: AOMASource[];
  reset: () => void;
}

export function useAOMAStream(): UseAOMAStreamResult {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AOMAProgressUpdate[]>([]);
  const [sources, setSources] = useState<AOMASource[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress([]);
    setSources([]);
    setIsLoading(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const query = useCallback(
    async (text: string) => {
      // Reset previous state
      reset();
      setIsLoading(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/aoma-stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: text }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                setIsLoading(false);
                return;
              }

              try {
                const parsed = JSON.parse(data);

                switch (parsed.type) {
                  case "progress":
                    setProgress((prev) => [...prev, parsed.update]);

                    // Update sources if included in progress
                    if (parsed.update.sources) {
                      setSources((prev) => [...prev, ...parsed.update.sources]);
                    }
                    break;

                  case "complete":
                    setResult(parsed.result);
                    setSources(parsed.sources || []);
                    setProgress(parsed.progressSummary || []);
                    setIsLoading(false);
                    break;

                  case "error":
                    setError(parsed.error);
                    setIsLoading(false);
                    break;
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, not an error
          console.log("AOMA query aborted");
        } else {
          setError(err instanceof Error ? err.message : "Unknown error occurred");
        }
        setIsLoading(false);
      }
    },
    [reset]
  );

  return {
    query,
    isLoading,
    result,
    error,
    progress,
    sources,
    reset,
  };
}
