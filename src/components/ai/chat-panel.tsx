"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bot, Sparkles, Trash2, Download, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";

// Import shadcn/ui AI Elements components
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
import { Response } from "../ai-elements/response";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "../ai-elements/conversation";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from "../ai-elements/prompt-input";
import { Suggestions, Suggestion } from "../ai-elements/suggestion";
import { Loader } from "../ai-elements/loader";

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
  systemPrompt: _systemPrompt, // Unused - should be handled differently in v5
}: ChatPanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  const [input, setInput] = useState('');

  const {
    messages,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
    setInput
  } =
    useChat({
      initialMessages,

      onError: (error: Error) => {
        // Network failures are expected during rapid navigation/tests - fail silently
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          onError?.(error);
          return;
        }
        console.warn("Chat error:", error);
        onError?.(error);
      },

      onFinish: () => {
        // Check if we've reached max messages
        if (maxMessages && messages.length >= maxMessages) {
          console.warn(`Maximum messages (${maxMessages}) reached`);
        }
      },

      transport: undefined
    });

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input?.trim()) {
      append({
        role: "user",
        content: input,
      });
      setInput("");
    }
  };

  const isMaxMessagesReached = maxMessages ? messages.length >= maxMessages : false;

  return (
    <Card className={cn("mac-card", "flex flex-col h-full", className)}>
      {showHeader && (
        <CardHeader className="mac-card px-4 py-3 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
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
                <Button size="icon" variant="ghost" className="mac-button h-8 w-8" onClick={handleClear}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button size="icon" variant="ghost" className="mac-button h-8 w-8" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 p-0 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent className="px-4 py-4">
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

                <h3 className="mac-title">Welcome to {title}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  I'm here to help you with your questions. You can ask me anything or choose from
                  the suggestions below.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    <Suggestions>
                      {suggestions.map((suggestion, index) => (
                        <Suggestion
                          key={index}
                          suggestion={suggestion}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </Suggestions>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((message: any, index: number) => (
                  <Message key={message.id || index} from={message.role}>
                    <MessageAvatar
                      name={message.role === "user" ? "U" : "AI"}
                      className={cn(
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-muted text-foreground"
                      )}
                    />
                    <MessageContent>
                      <Response>{(message as any).content}</Response>
                    </MessageContent>
                  </Message>
                ))}
                {isLoading && (
                  <Message from="assistant">
                    <MessageAvatar name="AI" className="bg-muted text-foreground" />
                    <MessageContent>
                      <Loader />
                    </MessageContent>
                  </Message>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An error occurred. Please try again."}
                  <Button variant="link" className="mac-button"
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
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </CardContent>

      {showFooter && (
        <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-xl">
          <div className="w-full">
            <PromptInput onSubmit={handleFormSubmit}>
              <PromptInputTextarea
                value={input || ""}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isMaxMessagesReached ? "Message limit reached" : placeholder}
                disabled={isMaxMessagesReached || isLoading}
              />
              <PromptInputToolbar>
                <PromptInputTools>
                  {showSuggestions && suggestions.length > 0 && (
                    <Suggestions>
                      {suggestions.map((suggestion, index) => (
                        <Suggestion
                          key={index}
                          suggestion={suggestion}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </Suggestions>
                  )}
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={isMaxMessagesReached || !input?.trim()}
                  status={isLoading ? "streaming" : undefined}
                />
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
