"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { EnhancedMessageThread } from "./enhanced-message-thread";
import { PromptInput } from "../ai-elements/prompt-input";
import { Suggestion } from "../ai-elements/suggestion";
import { Conversation } from "../ai-elements/conversation";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bot, Sparkles, Trash2, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";

interface EnhancedChatPanelProps {
  api?: string;
  initialMessages?: any[];
  cclassName?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  onError?: (error: Error) => void;
  showHeader?: boolean;
  showFooter?: boolean;
  maxMessages?: number;
  allowExport?: boolean;
  allowClear?: boolean;
  systemPrompt?: string;
  enableReasoning?: boolean;
  showModelSelector?: boolean;
  availableModels?: Array<{ id: string; name: string }>;
}

export function EnhancedChatPanel({
  api: _api = "/api/chat", // Unused - keeping for future API route configuration
  initialMessages = [],
  cclassName,
  title = "AI Assistant",
  description = "Powered by Vercel AI SDK with AI Elements",
  placeholder = "Ask me anything...",
  suggestions = [
    "What can you help me with?",
    "Tell me about your capabilities",
    "How do I get started?",
    "Explain your features",
  ],
  onError,
  showHeader = true,
  showFooter = true,
  maxMessages,
  allowExport = true,
  allowClear = true,
  systemPrompt,
  enableReasoning = true,
  showModelSelector = true,
  availableModels = [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "o1-preview", name: "O1 Preview" },
    { id: "o1-mini", name: "O1 Mini" },
  ],
}: EnhancedChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.id || "gpt-4o");

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
    setInput,
  } = (useChat as any)({
    initialMessages,
    body: {
      systemPrompt,
      model: selectedModel,
    },
    onError: (error: Error) => {
      console.error("Chat error:", error);

      // Transform AI SDK errors to user-friendly messages
      let userFriendlyError = error;

      // Parse JSON error messages from AI SDK
      let errorMessage = error.message || error.toString();

      try {
        // Try to parse if it's a JSON string
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.type) {
          const errorType = parsedError.error.type;
          const originalMessage = parsedError.error.message || "";

          if (errorType === "insufficient_quota" || originalMessage.includes("quota")) {
            userFriendlyError = new Error(
              "I've reached my OpenAI API quota limit. Please contact support or try again later when the quota resets."
            );
          } else if (
            errorType === "rate_limit_exceeded" ||
            originalMessage.includes("rate_limit") ||
            originalMessage.includes("Rate limit")
          ) {
            userFriendlyError = new Error(
              "I'm currently handling too many requests. Please wait a moment and try again."
            );
          } else {
            userFriendlyError = new Error(
              originalMessage ||
                "I'm experiencing technical difficulties. Please try again in a moment."
            );
          }
        }
      } catch (parseError) {
        // If it's not JSON, check if it contains quota/rate limit keywords
        if (errorMessage.includes("quota") || errorMessage.includes("insufficient_quota")) {
          userFriendlyError = new Error(
            "I've reached my OpenAI API quota limit. Please contact support or try again later when the quota resets."
          );
        } else if (errorMessage.includes("rate_limit") || errorMessage.includes("Rate limit")) {
          userFriendlyError = new Error(
            "I'm currently handling too many requests. Please wait a moment and try again."
          );
        }
      }

      onError?.(userFriendlyError);
    },
    onFinish: () => {
      if (maxMessages && messages.length >= maxMessages) {
        console.warn(`Maximum messages (${maxMessages}) reached`);
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Hide suggestions after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    append({
      role: "user",
      content: suggestion,
    });
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setShowSuggestions(true);
  };

  const handleExport = () => {
    const content = messages.map((m: any) => `${m.role}: ${m.content}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSubmit(e);
      setShowSuggestions(false);
    }
  };

  const isMaxMessagesReached = maxMessages ? messages.length >= maxMessages : false;

  return (
    <Card cclassName={cn("mac-card", "flex flex-col h-full", cclassName)}>
      {showHeader && (
        <CardHeader cclassName="mac-card px-4 py-4 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
          <div cclassName="flex items-center justify-between">
            <div cclassName="flex items-center gap-4">
              <div cclassName="relative">
                <Bot cclassName="h-6 w-6 text-primary" />
                <Sparkles cclassName="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <CardTitle cclassName="text-lg">{title}</CardTitle>
                {description && (
                  <p cclassName="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>

            <div cclassName="flex items-center gap-2">
              {messages.length > 0 && (
                <Badge variant="secondary" cclassName="text-xs">
                  {messages.length} messages
                </Badge>
              )}

              {allowClear && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  cclassName="h-8 w-8 mac-button mac-button-outline"
                  onClick={handleClear}
                  title="Clear conversation"
                >
                  <Trash2 cclassName="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  cclassName="h-8 w-8 mac-button mac-button-outline"
                  onClick={handleExport}
                  title="Export conversation"
                >
                  <Download cclassName="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent cclassName="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} cclassName="h-full">
          <div cclassName="px-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                cclassName="flex flex-col items-center justify-center min-h-[400px] text-center"
              >
                <div cclassName="relative mb-6">
                  <Bot cclassName="h-16 w-16 text-muted-foreground/30" />
                  <Sparkles cclassName="h-5 w-5 text-primary absolute -top-2 -right-2" />
                </div>

                <h3 cclassName="mac-title">
                  Welcome to {title}
                </h3>
                <p cclassName="text-sm text-muted-foreground mb-6 max-w-md">
                  I'm here to help you with your questions. You can ask me anything or choose from
                  the suggestions below.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div cclassName="w-full max-w-2xl space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <Suggestion
                        key={index}
                        suggestion={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        cclassName="w-full"
                      >
                        {suggestion}
                      </Suggestion>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <Conversation>
                <EnhancedMessageThread
                  messages={messages}
                  isLoading={isLoading}
                  onReload={reload}
                  onStop={stop}
                  showTimestamps={true}
                  showActions={true}
                  enableReasoning={enableReasoning}
                />
              </Conversation>
            )}

            {error && (
              <Alert variant="destructive" cclassName="mt-4">
                <AlertCircle cclassName="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An error occurred. Please try again."}
                  <Button
                    cclassName="mac-button mac-button-primary"
                    variant="link"
                    cclassName="mac-button"
                    size="sm"
                    onClick={() => reload()}
                    cclassName="ml-2 h-auto p-0"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isMaxMessagesReached && (
              <Alert cclassName="mt-4">
                <AlertCircle cclassName="h-4 w-4" />
                <AlertDescription>
                  Maximum message limit ({maxMessages}) reached. Please start a new conversation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {showFooter && (
        <CardFooter cclassName="p-4 border-t bg-background/95 backdrop-blur-xl">
          <form onSubmit={handleFormSubmit} cclassName="w-full">
            {/* PromptInput has extended props not in type definition */}
            {(PromptInput as any)({
              value: input,
              onChange: handleInputChange,
              placeholder: isMaxMessagesReached ? "Message limit reached" : placeholder,
              disabled: isMaxMessagesReached || isLoading,
              cclassName: "w-full",
              models: showModelSelector ? availableModels : undefined,
              selectedModelId: selectedModel,
              onModelChange: setSelectedModel,
              onStop: isLoading ? stop : undefined,
              attachments: [],
              onAttachmentsChange: () => {},
              isLoading: isLoading,
            })}
          </form>
        </CardFooter>
      )}
    </Card>
  );
}
