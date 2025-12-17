"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// Browser-compatible UUID v4 generator
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  responseId?: string;
  tools?: string[];
}

interface UseGPT5ResponsesOptions {
  systemPrompt?: string;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
  verbosity?: "low" | "medium" | "high";
  temperature?: number;
  maxOutputTokens?: number;
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
}

export function useGPT5Responses(options: UseGPT5ResponsesOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId] = useState(() => generateUUID());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Add system prompt as first message if provided
  useEffect(() => {
    if (options.systemPrompt && messages.length === 0) {
      setMessages([
        {
          id: generateUUID(),
          role: "system",
          content: options.systemPrompt,
          timestamp: new Date(),
        },
      ]);
    }
  }, [options.systemPrompt]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!input.trim() || isLoading) return;

      const userMessage: Message = {
        id: generateUUID(),
        role: "user",
        content: input.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setIsThinking(true);
      setError(null);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/gpt5-responses-fixed", {
          // Using fixed endpoint
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
            conversationId,
            reasoningEffort: options.reasoningEffort || "medium",
            verbosity: options.verbosity || "medium",
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxOutputTokens || 4096,
            tools: ["web_search", "file_search"],
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage: Message = {
          id: generateUUID(),
          role: "assistant",
          content: "",
          timestamp: new Date(),
          tools: [],
        };

        if (reader) {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") continue;

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "text") {
                    setIsThinking(false);
                    assistantMessage.content += parsed.content;
                    assistantMessage.responseId = parsed.responseId;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage?.role === "assistant") {
                        newMessages[newMessages.length - 1] = { ...assistantMessage };
                      } else {
                        newMessages.push(assistantMessage);
                      }
                      return newMessages;
                    });
                  } else if (parsed.type === "tool") {
                    assistantMessage.tools?.push(parsed.tool);
                  } else if (parsed.type === "reasoning") {
                    // Could display reasoning steps if desired
                    console.log("Reasoning:", parsed.content);
                  } else if (parsed.type === "done") {
                    assistantMessage.responseId = parsed.responseId;
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
        }

        if (options.onFinish) {
          options.onFinish(assistantMessage);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Request aborted");
        } else {
          const error = err as Error;
          setError(error);
          if (options.onError) {
            options.onError(error);
          }
        }
      } finally {
        setIsLoading(false);
        setIsThinking(false);
        abortControllerRef.current = null;
      }
    },
    [input, isLoading, conversationId, options]
  );

  const clearConversation = useCallback(async () => {
    setMessages([]);
    setInput("");
    setError(null);

    // Clear conversation on server
    await fetch(`/api/gpt5-responses-proper?conversationId=${conversationId}`, {
      method: "DELETE",
    });
  }, [conversationId]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    input,
    isLoading,
    isThinking,
    error,
    conversationId,
    handleInputChange,
    handleSubmit,
    clearConversation,
    abort,
  };
}
