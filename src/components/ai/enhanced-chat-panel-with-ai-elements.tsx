"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "../ui/scroll-area";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bot, Sparkles, Trash2, Download, Loader2, AlertCircle, User } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { motion } from "framer-motion";
import { InfographicDisplay, type InfographicData } from "./infographic-display";
import { Q8Button, Q8FeedbackContext } from "../ui/Q8Button";
import { DDPDisplay } from "../ddp/DDPDisplay";
import { getTrackOffsets, getLeadoutOffset } from "../../services/ddpParser";
import { lookupFromDDP, calculateDiscId } from "../../services/musicBrainz";
import type { ParsedDDP } from "../../types/ddp";
import type { MusicBrainzLookupResult } from "../../services/musicBrainz";

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

// Parse AOMA response to extract sources and content
function parseAOMAResponse(content: string): {
  text: string;
  sources: Array<{ id: string; title: string; url?: string; description?: string }>;
} {
  const sources: Array<{ id: string; title: string; url?: string; description?: string }> = [];
  let text = content;

  // Extract JIRA tickets like DPSA-27269, AOMA-12345, AOMA2-1234, ITSM-55775, UST-2691
  const jiraPattern = /\b(DPSA|AOMA2?|ITSM|UST)-\d+\b/g;
  const jiraMatches = [...content.matchAll(jiraPattern)];

  jiraMatches.forEach((match) => {
    const ticketId = match[0];
    if (!sources.find((s) => s.title === ticketId)) {
      sources.push({
        id: ticketId,
        title: ticketId,
        url: `https://sonymusic.atlassian.net/browse/${ticketId}`,
        description: `View JIRA ticket details`,
      });
    }
  });

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
  className,
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

  // Infographic state: track per-message infographics
  const [infographics, setInfographics] = useState<
    Record<
      string,
      {
        data: InfographicData | null;
        isLoading: boolean;
        error: string | null;
        dismissed: boolean;
      }
    >
  >({});
  const pendingQuestionRef = useRef<{ id: string; question: string } | null>(null);

  // DDP state: parsed DDP and MusicBrainz lookup
  const [parsedDDP, setParsedDDP] = useState<ParsedDDP | null>(null);
  const [ddpMusicBrainz, setDdpMusicBrainz] = useState<MusicBrainzLookupResult | null>(null);
  const [isLoadingMusicBrainz, setIsLoadingMusicBrainz] = useState(false);

  // Handle DDP detection from file upload
  const handleDDPDetected = useCallback(async (ddp: ParsedDDP) => {
    setParsedDDP(ddp);
    setDdpMusicBrainz(null);

    // Look up MusicBrainz in the background
    setIsLoadingMusicBrainz(true);
    try {
      // Calculate disc ID if we have PQ data
      let discId: string | undefined;
      if (ddp.pqEntries.length > 0) {
        const offsets = getTrackOffsets(ddp.pqEntries);
        const leadout = getLeadoutOffset(ddp.pqEntries);
        if (offsets.length > 0 && leadout > 0) {
          discId = await calculateDiscId(1, offsets.length, leadout, offsets);
        }
      }

      // Collect ISRCs from tracks
      const isrcs = ddp.tracks
        .map(t => t.isrc)
        .filter((isrc): isrc is string => !!isrc);

      const mbResult = await lookupFromDDP({
        discId,
        barcode: ddp.summary.upc,
        isrcs,
        artist: ddp.cdText?.albumPerformer,
        title: ddp.cdText?.albumTitle,
      });

      setDdpMusicBrainz(mbResult);
    } catch (error) {
      console.error('MusicBrainz lookup failed:', error);
    } finally {
      setIsLoadingMusicBrainz(false);
    }
  }, []);

  // Clear DDP display
  const clearDDP = useCallback(() => {
    setParsedDDP(null);
    setDdpMusicBrainz(null);
  }, []);

  // Generate infographic for a message (runs in parallel with chat)
  const generateInfographicForMessage = useCallback(
    async (messageId: string, question: string, answer: string) => {
      // Set loading state
      setInfographics((prev) => ({
        ...prev,
        [messageId]: { data: null, isLoading: true, error: null, dismissed: false },
      }));

      try {
        const response = await fetch("/api/infographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, answer }),
        });

        const data = await response.json();

        if (data.generated && data.imageData) {
          setInfographics((prev) => ({
            ...prev,
            [messageId]: {
              data: {
                imageData: data.imageData,
                mimeType: data.mimeType || "image/png",
                type: data.type || "infographic",
                generationTimeMs: data.generationTimeMs || 0,
              },
              isLoading: false,
              error: null,
              dismissed: false,
            },
          }));
        } else {
          // No infographic generated (question doesn't benefit from one)
          setInfographics((prev) => ({
            ...prev,
            [messageId]: { data: null, isLoading: false, error: null, dismissed: true },
          }));
        }
      } catch (err) {
        console.error("[Infographic] Generation error:", err);
        setInfographics((prev) => ({
          ...prev,
          [messageId]: {
            data: null,
            isLoading: false,
            error: "Failed to generate",
            dismissed: false,
          },
        }));
      }
    },
    []
  );

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
      // Network failures are expected during rapid navigation/tests - fail silently
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        onError?.(error);
        return;
      }
      console.warn("Chat error:", error);
      onError?.(error);
    },
    onFinish: (message: any) => {
      if (maxMessages && messages.length >= maxMessages) {
        console.warn(`Maximum messages (${maxMessages}) reached`);
      }

      // When AI response completes, trigger infographic generation
      if (pendingQuestionRef.current && message?.content) {
        const { id, question } = pendingQuestionRef.current;
        generateInfographicForMessage(id, question, message.content);
        pendingQuestionRef.current = null;
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
    // Generate a unique ID for tracking infographic
    const messageId = `msg-${Date.now()}`;
    pendingQuestionRef.current = { id: messageId, question: suggestion };
    append({
      id: messageId,
      role: "user",
      content: suggestion,
    });
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    setShowSuggestions(true);
    setInfographics({});
    pendingQuestionRef.current = null;
    clearDDP();
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
      // Generate a unique ID for tracking infographic
      const messageId = `msg-${Date.now()}`;
      pendingQuestionRef.current = { id: messageId, question: value };
      append({
        id: messageId,
        role: "user",
        content: value,
      });
      setInput("");
    }
  };

  // Dismiss an infographic
  const dismissInfographic = (messageId: string) => {
    setInfographics((prev) => ({
      ...prev,
      [messageId]: { ...prev[messageId], dismissed: true },
    }));
  };

  const isMaxMessagesReached = maxMessages ? messages.length >= maxMessages : false;

  return (
    <Card className={cn("mac-card", "flex flex-col h-full", className)}>
      {showHeader && (
        <CardHeader className="mac-card px-4 py-4 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messages.length} messages
                </Badge>
              )}

              {allowClear && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 mac-button mac-button-outline"
                  onClick={handleClear}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {allowExport && messages.length > 0 && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 mac-button mac-button-outline"
                  onClick={handleExport}
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
          <div className="px-4 py-4">
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
                  I have access to the AOMA knowledge base and can answer questions about Sony Music
                  systems, USM, and enterprise tools.
                </p>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {suggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs mac-button mac-button-outline"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  const content = (message as any).content || "";

                  // Parse AOMA responses for sources
                  const { text, sources } = isUser
                    ? { text: content, sources: [] }
                    : parseAOMAResponse(content);

                  // For AI responses, get the previous user message ID for infographic lookup
                  const prevUserMsg = !isUser && index > 0 ? messages[index - 1] : null;
                  const infographicKey = prevUserMsg?.id;
                  const infographicState = infographicKey ? infographics[infographicKey] : null;

                  return (
                    <Message key={message.id || index} from={message.role} className="py-2">
                      <MessageAvatar
                        src={isUser ? "/user-avatar.png" : "/aoma-avatar.png"}
                        name={isUser ? "You" : "AOMA"}
                      />
                      <MessageContent>
                        {isUser ? (
                          // User messages - plain text
                          <div className="text-sm">{content}</div>
                        ) : (
                          // AI responses - use Response component with markdown
                          <>
                            {/* Response text with Q8 button overlay */}
                            <div className="relative group">
                              <Response className="text-sm">{text}</Response>
                              {/* Q8 Curate button for text responses (when no infographic) */}
                              {!infographicState?.data && prevUserMsg && (
                                <div className="absolute bottom-1 right-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                  <Q8Button
                                    context={{
                                      type: "text_response",
                                      question: (prevUserMsg as any)?.content || "",
                                      answer: text,
                                      messageId: message.id,
                                      timestamp: new Date().toISOString(),
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Display sources if available */}
                            {sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Sources ({sources.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
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

                            {/* Infographic display - appears after AI response */}
                            {infographicKey && infographicState && !infographicState.dismissed && (
                              <InfographicDisplay
                                infographic={infographicState.data}
                                isLoading={infographicState.isLoading}
                                error={infographicState.error}
                                onDismiss={() => dismissInfographic(infographicKey)}
                                question={(prevUserMsg as any)?.content || ""}
                                answer={text}
                                messageId={message.id}
                                showQ8Button={true}
                              />
                            )}
                          </>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}

                {/* Loading state with AI Elements Loader */}
                {isLoading && (
                  <Message from="assistant" className="py-2">
                    <MessageAvatar src="/aoma-avatar.png" name="AOMA" />
                    <MessageContent>
                      <Loader className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Searching AOMA knowledge base...</span>
                        </div>
                      </Loader>
                    </MessageContent>
                  </Message>
                )}
              </div>
            )}

            {/* DDP Display - shows parsed DDP data from folder upload */}
            {parsedDDP && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <DDPDisplay
                  ddp={parsedDDP}
                  musicBrainz={ddpMusicBrainz}
                  isLoadingMusicBrainz={isLoadingMusicBrainz}
                  onDismiss={clearDDP}
                />
              </motion.div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message || "An error occurred. Please try again."}
                  <Button
                    className="ml-2 h-auto p-0 mac-button"
                    variant="link"
                    size="sm"
                    onClick={() => reload()}
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
              allowAttachments={true}
              allowVoice={false}
              suggestions={showSuggestions ? suggestions : []}
              onSuggestionClick={handleSuggestionClick}
              onDDPDetected={handleDDPDetected}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
