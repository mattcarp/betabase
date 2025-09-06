"use client";

import { useChat } from "ai/react";
import { useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import {
  Send,
  Loader2,
  User,
  Bot,
  AlertCircle,
  Sparkles,
  Zap,
  Clock,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWrapperProps {
  api?: string;
  initialMessages?: any[];
  className?: string;
  placeholder?: string;
  onError?: (error: Error) => void;
}

export function ChatWrapper({
  api = "/api/chat",
  initialMessages = [],
  className,
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
    append,
    setMessages,
  } = useChat({
    api,
    initialMessages,
    onError: (error) => {
      console.error("Chat error:", error);
      onError?.(error);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
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
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="px-4 py-3 border-b bg-gradient-to-r from-background/95 to-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl" />
            </div>
            <h3 className="font-semibold text-lg">AI Assistant</h3>
            <Badge variant="secondary" className="text-xs">
              Powered by Vercel AI SDK
            </Badge>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full px-4 py-3">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center h-full text-center p-8"
              >
                <div className="relative mb-4">
                  <Bot className="h-12 w-12 text-muted-foreground/50" />
                  <Zap className="h-4 w-4 text-primary absolute -top-1 -right-1" />
                </div>
                <p className="text-muted-foreground mb-2">
                  Start a conversation with your AI assistant
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Ask questions, get help, or explore ideas
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role !== "user" && (
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 backdrop-blur-sm border border-border/50",
                      )}
                    >
                      <div className="prose prose-sm dark:prose-invert">
                        {message.content}
                      </div>
                      {message.role !== "user" && message.toolInvocations && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              Used {message.toolInvocations.length} tool(s)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <Avatar className="h-8 w-8 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <span
                          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
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
              className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">
                    {error.message || "An error occurred. Please try again."}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => reload()}
                    className="mt-2 h-7 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background/95 backdrop-blur-xl">
        <form onSubmit={handleFormSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
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
            className="relative overflow-hidden group"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </Button>
          {isLoading && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => stop()}
              className="border-destructive/50 hover:bg-destructive/10"
            >
              <div className="h-3 w-3 bg-destructive rounded-sm" />
            </Button>
          )}
        </form>
      </CardFooter>
    </Card>
  );
}
