"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bot, Sparkles, Trash2, Download, Loader2, AlertCircle, User } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";

// AI Elements imports - MAXIMIZE USAGE!
import { Message, MessageContent, MessageAvatar } from "../ai-elements/message";
import { Response } from "../ai-elements/response";
import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
} from "../ai-elements/inline-citation";
import { Loader } from "../ai-elements/loader";
import { CodeBlock } from "../ai-elements/code-block";

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

// Parse AOMA response to extract sources and content
function parseAOMAResponse(content: string): {
  text: string;
  sources: Array<{ id: string; title: string; url?: string; description?: string }>;
} {
  const sources: Array<{ id: string; title: string; url?: string; description?: string }> = [];
  let text = content;

  // Extract source citations like [1], [2], etc.
  const citationPattern = /\[(\d+)\]/g;
  const matches = [...content.matchAll(citationPattern)];

  // Extract source markers like 【source】
  const sourcePattern = /【([^】]+)】/g;
  const sourceMatches = [...content.matchAll(sourcePattern)];

  sourceMatches.forEach((match, index) => {
    const sourceName = match[1];
    if (!sources.find((s) => s.title === sourceName)) {
      sources.push({
        id: `source-${index + 1}`,
        title: sourceName,
        description: `Referenced from AOMA knowledge base`,
      });
    }
  });

  // Remove source markers from text for cleaner display
  text = text.replace(sourcePattern, "");

  return { text, sources };
}

export function EnhancedChatPanelWithAIElements({
  api = "/api/chat",
  initialMessages = [],
  cclassName,
  title = "SIAM AI Assistant",
  description = "Powered by AOMA Knowledge Base",
  placeholder = "Ask me anything about AOMA, USM, Sony Music...",
  suggestions = [
    "What is AOMA?",
    "Explain the Universal Service Model",
    "How do I export to Sony Ci?",
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
    initialMessages,
    onError: (error) => {
      console.error("Chat error:", error);
      onError?.(error);
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
    const content = messages.map((m) => `${m.role}: ${(m as any).content}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aoma-chat-${new Date().toISOString()}.txt`;
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
          <div cclassName="px-4 py-4">
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
                  I have access to the AOMA knowledge base and can answer questions about Sony Music
                  systems, USM, and enterprise tools.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div cclassName="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        cclassName="text-xs mac-button mac-button-outline"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div cclassName="space-y-6">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const content = (message as any).content || "";

                  // Parse AOMA responses for sources
                  const { text, sources } = isUser
                    ? { text: content, sources: [] }
                    : parseAOMAResponse(content);

                  return (
                    <Message key={message.id || index} from={message.role} cclassName="py-2">
                      <MessageAvatar
                        src={isUser ? "/user-avatar.png" : "/aoma-avatar.png"}
                        name={isUser ? "You" : "AOMA"}
                      />
                      <MessageContent>
                        {isUser ? (
                          // User messages - plain text
                          <div cclassName="text-sm">{content}</div>
                        ) : (
                          // AI responses - use Response component with markdown
                          <>
                            <Response cclassName="text-sm">{text}</Response>

                            {/* Display sources if available */}
                            {sources.length > 0 && (
                              <div cclassName="mt-4 pt-4 border-t border-border/50">
                                <p cclassName="text-xs text-muted-foreground mb-2">
                                  📚 Sources ({sources.length}):
                                </p>
                                <div cclassName="flex flex-wrap gap-2">
                                  {sources.map((source, idx) => (
                                    <InlineCitation key={source.id}>
                                      <InlineCitationCard>
                                        <InlineCitationCardTrigger sources={[source.title]} />
                                        <InlineCitationCardBody>
                                          <InlineCitationCarousel>
                                            <InlineCitationCarouselContent>
                                              <InlineCitationCarouselItem>
                                                <InlineCitationCarouselHeader>
                                                  <InlineCitationCarouselPrev />
                                                  <InlineCitationCarouselIndex />
                                                  <InlineCitationCarouselNext />
                                                </InlineCitationCarouselHeader>
                                                <InlineCitationSource
                                                  title={source.title}
                                                  url={source.url}
                                                  description={source.description}
                                                />
                                              </InlineCitationCarouselItem>
                                            </InlineCitationCarouselContent>
                                          </InlineCitationCarousel>
                                        </InlineCitationCardBody>
                                      </InlineCitationCard>
                                    </InlineCitation>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}

                {/* Loading state with AI Elements Loader */}
                {isLoading && (
                  <Message from="assistant" cclassName="py-2">
                    <MessageAvatar src="/aoma-avatar.png" name="AOMA" />
                    <MessageContent>
                      <Loader cclassName="text-muted-foreground">
                        <div cclassName="flex items-center gap-2">
                          <Loader2 cclassName="h-4 w-4 animate-spin" />
                          <span cclassName="text-sm">Searching AOMA knowledge base...</span>
                        </div>
                      </Loader>
                    </MessageContent>
                  </Message>
                )}
              </div>
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
                AI is querying AOMA knowledge base...
                <Button
                  variant="link"
                  size="sm"
                  onClick={stop}
                  cclassName="h-auto p-0 text-xs mac-button mac-button-primary"
                >
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
