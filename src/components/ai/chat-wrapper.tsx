"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback /* AvatarImage */ } from "../ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Send, Loader2, User, Bot, AlertCircle, Sparkles, Zap, Clock } from "lucide-react";
import { Badge } from "../ui/badge";
// import { Separator } from "../ui/separator"; // Unused
import { motion, AnimatePresence } from "framer-motion";

interface ChatWrapperProps {
  api?: string;
  initialMessages?: any[];
  cclassName?: string;
  placeholder?: string;
  onError?: (error: Error) => void;
}

export function ChatWrapper({
  api = "/api/chat",
  initialMessages = [],
  cclassName,
  placeholder = "Type your message...",
  onError,
}: ChatWrapperProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append: _append, // Unused
    setMessages: _setMessages, // Unused
  } = (useChat as any)({
    api,
    initialMessages,
    onError: (error: Error) => {
      console.error("Chat error:", error);
      onError?.(error);
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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      handleSubmit(e);
    }
  };

  return (
    <Card cclassName={cn("mac-card", "flex flex-col h-full", cclassName)}>
      <CardHeader cclassName="mac-card px-4 py-4 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
        <div cclassName="flex items-center justify-between">
          <div cclassName="flex items-center gap-2">
            <div cclassName="relative">
              <Sparkles cclassName="h-5 w-5 text-primary animate-pulse" />
              <div cclassName="absolute inset-0 bg-primary/20 blur-xl" />
            </div>
            <h3 cclassName="mac-title font-semibold text-lg">AI Assistant</h3>
            <Badge variant="secondary" cclassName="text-xs">
              Powered by Vercel AI SDK
            </Badge>
          </div>
          {isLoading && (
            <div cclassName="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 cclassName="h-3 w-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent cclassName="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} cclassName="h-full px-4 py-4">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                cclassName="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <div cclassName="relative mb-4">
                  <Bot cclassName="h-12 w-12 text-muted-foreground/50" />
                  <Zap cclassName="h-4 w-4 text-primary absolute -top-1 -right-1" />
                </div>
                <p cclassName="mac-body text-muted-foreground mb-2">
                  Start a conversation with your AI assistant
                </p>
                <p cclassName="text-sm text-muted-foreground/70">
                  Ask questions, get help, or explore ideas
                </p>
              </motion.div>
            ) : (
              <div cclassName="space-y-4">
                {messages.map((message: any, index: number) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    cclassName={cn(
                      "flex gap-4",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role !== "user" && (
                      <Avatar cclassName="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback cclassName="bg-primary/10">
                          <Bot cclassName="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      cclassName={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 backdrop-blur-sm border border-border/50"
                      )}
                    >
                      <div cclassName="prose prose-sm dark:prose-invert">
                        {(message as any).content}
                      </div>
                      {message.role !== "user" && (message as any).toolInvocations && (
                        <div cclassName="mt-2 pt-2 border-t border-border/50">
                          <div cclassName="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock cclassName="h-3 w-3" />
                            <span>Used {(message as any).toolInvocations.length} tool(s)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <Avatar cclassName="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback cclassName="bg-primary/10">
                          <User cclassName="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    cclassName="flex gap-4"
                  >
                    <Avatar cclassName="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback cclassName="bg-primary/10">
                        <Bot cclassName="h-4 w-4 text-primary animate-pulse" />
                      </AvatarFallback>
                    </Avatar>
                    <div cclassName="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-4">
                      <div cclassName="flex gap-2">
                        <span
                          cclassName="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          cclassName="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          cclassName="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              cclassName="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div cclassName="flex items-start gap-2">
                <AlertCircle cclassName="h-4 w-4 text-destructive mt-0.5" />
                <div cclassName="flex-1">
                  <p cclassName="text-sm text-destructive">
                    {error.message || "An error occurred. Please try again."}
                  </p>
                  <Button
                    cclassName="mac-button mac-button-outline mt-2 h-7 text-xs"
                    variant="ghost"
                    size="sm"
                    onClick={() => reload()}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter cclassName="p-4 border-t bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleFormSubmit} cclassName="flex w-full gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            cclassName="flex-1 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors mac-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFormSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            cclassName="relative overflow-hidden group mac-button mac-button-primary"
          >
            {isLoading ? (
              <Loader2 cclassName="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send cclassName="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <div cclassName="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Button>
          {isLoading && (
            <Button
              cclassName="mac-button mac-button-outline border-destructive/50 hover:bg-destructive/10"
              type="button"
              size="icon"
              variant="outline"
              onClick={() => stop()}
            >
              <div cclassName="h-3 w-3 bg-destructive rounded-sm" />
            </Button>
          )}
        </form>
      </CardFooter>
    </Card>
  );
}
