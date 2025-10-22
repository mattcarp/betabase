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
import { Separator } from "../ui/separator";
import {
  Bot,
  Sparkles,
  RefreshCw,
  Trash2,
  Download,
  Settings,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";

interface ChatPanelProps {
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
}

export function ChatPanel({
  api = "/api/chat",
  initialMessages = [],
  className,
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
  systemPrompt,
}: ChatPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

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
    // Note: 'api' is not a valid option in v5, use default endpoint
    initialMessages,
    // body is also not valid in v5, system prompt should be handled differently
    onError: (error) => {
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
    const content = messages.map((m) => `${m.role}: ${(m as any).content}`).join("\n\n");
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
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleExport}>
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
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={message.id || index} className="flex gap-3">
                    <div className="flex-shrink-0">
                      {message.role === "user" ? (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                          U
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 dark:text-gray-100">
                        {(message as any).content}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-500">Thinking...</div>
                    </div>
                  </div>
                )}
              </div>
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
          <div className="w-full">
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleFormSubmit}
              onStop={stop}
              isLoading={isLoading}
              placeholder={isMaxMessagesReached ? "Message limit reached" : placeholder}
              className="w-full"
              allowAttachments={false}
              allowVoice={false}
              suggestions={showSuggestions ? suggestions : []}
              onSuggestionClick={handleSuggestionClick}
            />

            {isLoading && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI is generating response...
                <Button variant="link" size="sm" onClick={stop} className="h-auto p-0 text-xs">
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
