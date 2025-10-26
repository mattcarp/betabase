"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
// MessageThread component removed - using inline message display
import { ChatInput } from "./chat-input";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
// import { Separator } from "../ui/separator"; // Unused
import {
  Bot,
  Sparkles,
  // RefreshCw, // Unused
  Trash2,
  Download,
  // Settings, // Unused
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";

interface ChatPanelProps {
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
}

export function ChatPanel({
  api: _api = "/api/chat", // Unused - v5 uses default endpoint
  initialMessages = [],
  cclassName,
  title = "AI Assistant",
  description = "Powered by Vercel AI SDK",
  placeholder = "Ask me anything...",
  suggestions = [
    "What can you help me with?",
    "Tell me about your capabilities",
    "How do I get started?",
  ],
  onError,
  showHeader = true,
  showFooter = true,
  maxMessages,
  allowExport = true,
  allowClear = true,
  systemPrompt: _systemPrompt, // Unused - should be handled differently in v5
}: ChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: _handleSubmit, // Unused - using custom submit handler
    isLoading,
    error,
    reload,
    stop: _stop, // Unused
    append,
    setMessages,
    setInput,
  } = (useChat as any)({
    // Note: 'api' is not a valid option in v5, use default endpoint
    initialMessages,
    // body is also not valid in v5, system prompt should be handled differently
    onError: (error: Error) => {
      console.error("Chat error:", error);
      onError?.(error);
    },
    onFinish: () => {
      // Check if we've reached max messages
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
    // Submit the suggestion
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
    const content = messages.map((m: any) => `${m.role}: ${(m as any).content}`).join("\n\n");
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

  const handleFormSubmit = (value: string) => {
    if (value.trim()) {
      append({
        role: "user",
        content: value,
      });
      setInput("");
    }
  };

  const isMaxMessagesReached = maxMessages ? messages.length >= maxMessages : false;

  return (
    <Card cclassName={cn("flex flex-col h-full", cclassName)}>
      {showHeader && (
        <CardHeader cclassName="px-4 py-3 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
          <div cclassName="flex items-center justify-between">
            <div cclassName="flex items-center gap-3">
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

            <div cclassName="flex items-center gap-1">
              {messages.length > 0 && (
                <Badge variant="secondary" cclassName="text-xs">
                  {messages.length} messages
                </Badge>
              )}

              {allowClear && messages.length > 0 && (
                <Button size="icon" variant="ghost" cclassName="h-8 w-8" onClick={handleClear}>
                  <Trash2 cclassName="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button size="icon" variant="ghost" cclassName="h-8 w-8" onClick={handleExport}>
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

                <h3 cclassName="text-lg font-semibold mb-2">Welcome to {title}</h3>
                <p cclassName="text-sm text-muted-foreground mb-6 max-w-md">
                  I'm here to help you with your questions. You can ask me anything or choose from
                  the suggestions below.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div cclassName="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        cclassName="text-xs"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div cclassName="space-y-4">
                {messages.map((message: any, index: number) => (
                  <div key={message.id || index} cclassName="flex gap-3">
                    <div cclassName="flex-shrink-0">
                      {message.role === "user" ? (
                        <div cclassName="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          U
                        </div>
                      ) : (
                        <div cclassName="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                          <Bot cclassName="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div cclassName="flex-1 min-w-0">
                      <div cclassName="text-sm text-gray-900 dark:text-gray-100">
                        {(message as any).content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div cclassName="flex gap-3">
                    <div cclassName="flex-shrink-0">
                      <div cclassName="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                        <Bot cclassName="w-4 h-4" />
                      </div>
                    </div>
                    <div cclassName="flex-1 min-w-0">
                      <div cclassName="text-sm text-gray-500">Thinking...</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive" cclassName="mt-4">
                <AlertCircle cclassName="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An error occurred. Please try again."}
                  <Button
                    variant="link"
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
          <div cclassName="w-full">
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleFormSubmit}
              onStop={stop}
              isLoading={isLoading}
              placeholder={isMaxMessagesReached ? "Message limit reached" : placeholder}
              cclassName="w-full"
              allowAttachments={false}
              allowVoice={false}
              suggestions={showSuggestions ? suggestions : []}
              onSuggestionClick={handleSuggestionClick}
            />

            {isLoading && (
              <div cclassName="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Loader2 cclassName="h-3 w-3 animate-spin" />
                AI is generating response...
                <Button variant="link" size="sm" onClick={stop} cclassName="h-auto p-0 text-xs">
                  Stop
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
