import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";

export interface UseGPT5ResponsesOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  verbosity?: "low" | "medium" | "high";
  tools?: string[];
  vectorStoreIds?: string[];
  onError?: (error: Error) => void;
  onFinish?: (message: string) => void;
}

export interface GPT5Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  metadata?: {
    isThinking?: boolean;
    reasoningSteps?: string[];
    responseId?: string;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export function useGPT5Responses(options: UseGPT5ResponsesOptions = {}) {
  const [conversationId] = useState(() => nanoid());
  const [messages, setMessages] = useState<GPT5Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Custom implementation for Responses API
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!input.trim() || isLoading) return;

      const userMessage: GPT5Message = {
        id: nanoid(),
        role: "user",
        content: input,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      // Show thinking state for complex queries
      if (options.reasoningEffort === "high" || input.length > 200) {
        setIsThinking(true);
      }

      try {
        // Abort previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/gpt5-responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: input,
            conversationId,
            reasoningEffort: options.reasoningEffort || "medium",
            verbosity: options.verbosity || "medium",
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4096,
            tools: options.tools || ["web_search", "file_search"],
            vectorStoreIds: options.vectorStoreIds || ["vs_3dqHL3Wcmt1WrUof0qS4UQqo"],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const assistantMessage: GPT5Message = {
          id: nanoid(),
          role: "assistant",
          content: "",
          createdAt: new Date(),
          metadata: {},
        };

        setMessages((prev) => [...prev, assistantMessage]);

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "text") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + data.content }
                        : msg
                    )
                  );
                  setIsThinking(false);
                } else if (data.type === "reasoning") {
                  setIsThinking(true);
                } else if (data.type === "done") {
                  assistantMessage.metadata!.responseId = data.responseId;
                  options.onFinish?.(assistantMessage.content);
                }
              } catch (err) {
                console.warn("Failed to parse SSE data:", err);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return; // User cancelled

        const error = new Error(err.message || "Failed to send message");
        setError(error);
        options.onError?.(error);

        // Remove user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, conversationId, options]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Stop current request
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Clear conversation
  const clearConversation = useCallback(async () => {
    try {
      await fetch(`/api/gpt5-responses?conversationId=${conversationId}`, {
        method: "DELETE",
      });
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear conversation:", error);
    }
  }, [conversationId]);

  // Append a message programmatically
  const append = useCallback((message: Omit<GPT5Message, "id" | "createdAt">) => {
    const newMessage: GPT5Message = {
      ...message,
      id: nanoid(),
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  return {
    // Chat state
    messages,
    input,
    isLoading,
    isThinking,
    error,
    conversationId,

    // Actions
    handleInputChange,
    handleSubmit,
    append,
    stop,
    clearConversation,
    setMessages,
  };
}

// Helper function to format messages for display
export function formatGPT5Message(message: GPT5Message) {
  // Handle GPT-5 thinking messages
  if (message.metadata?.isThinking) {
    return {
      ...message,
      content: `🤔 Thinking deeply... ${message.content}`,
    };
  }

  return message;
}
