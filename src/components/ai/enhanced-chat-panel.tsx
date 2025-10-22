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
  className?: string;
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
  api = "/api/chat",
  initialMessages = [],
  className,
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
    onError: (error) => {
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
    const content = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");
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
    <Card className={cn("flex flex-col h-full", className)}>
      {showHeader && (
        <CardHeader className="px-4 py-3 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6 text-primary" />
                <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messages.length} messages
                </Badge>
              )}

              {allowClear && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleClear}
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleExport}
                  title="Export conversation"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="px-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[400px] text-center"
              >
                <div className="relative mb-6">
                  <Bot className="h-16 w-16 text-muted-foreground/30" />
                  <Sparkles className="h-5 w-5 text-primary absolute -top-2 -right-2" />
                </div>

                <h3 className="text-lg font-semibold mb-2">Welcome to {title}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  I'm here to help you with your questions. You can ask me anything or choose from
                  the suggestions below.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="w-full max-w-2xl space-y-2">
                    {suggestions.map((suggestion, index) => (
                      <Suggestion
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full"
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
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An error occurred. Please try again."}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => reload()}
                    className="ml-2 h-auto p-0"
                  >
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {isMaxMessagesReached && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Maximum message limit ({maxMessages}) reached. Please start a new conversation.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {showFooter && (
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-xl">
          <form onSubmit={handleFormSubmit} className="w-full">
            <PromptInput
              value={input}
              onChange={(e) => handleInputChange(e as any)}
              placeholder={isMaxMessagesReached ? "Message limit reached" : placeholder}
              disabled={isMaxMessagesReached || isLoading}
              className="w-full"
              models={showModelSelector ? availableModels : undefined}
              selectedModelId={selectedModel}
              onModelChange={setSelectedModel}
              onStop={isLoading ? stop : undefined}
              attachments={[]}
              onAttachmentsChange={() => {}}
              isLoading={isLoading}
            />
          </form>
        </CardFooter>
      )}
    </Card>
  );
}
