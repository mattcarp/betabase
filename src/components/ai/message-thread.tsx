"use client";

import { UIMessage as Message } from "ai";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import { Bot, User, Clock, Zap, Code, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
  cclassName?: string;
  renderMessage?: (message: Message) => ReactNode;
  showTimestamps?: boolean;
  showMetadata?: boolean;
}

export function MessageThread({
  messages,
  isLoading = false,
  cclassName,
  renderMessage,
  showTimestamps = false,
  showMetadata = false,
}: MessageThreadProps) {
  const formatTimestamp = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageIcon = (message: Message) => {
    if (message.role === "user") return <User cclassName="h-4 w-4" />;
    if (message.role === "assistant") return <Bot cclassName="h-4 w-4 text-primary" />;
    if (message.role === "system") return <Zap cclassName="h-4 w-4 text-yellow-500" />;
    return <FileText cclassName="h-4 w-4" />;
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.includes("code")) return <Code cclassName="h-3 w-3" />;
    if (toolName.includes("image")) return <ImageIcon cclassName="h-3 w-3" />;
    return <Zap cclassName="h-3 w-3" />;
  };

  return (
    <div cclassName={cn("space-y-4 py-4", cclassName)}>
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            cclassName={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role !== "user" && (
              <Avatar cclassName="h-8 w-8 mt-2">
                <AvatarFallback
                  cclassName={cn(
                    "border",
                    message.role === "assistant" && "bg-primary/10 border-primary/20",
                    message.role === "system" && "bg-yellow-500/10 border-yellow-500/20"
                  )}
                >
                  {getMessageIcon(message)}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              cclassName={cn(
                "flex-1 max-w-[70%]",
                message.role === "user" && "flex flex-col items-end"
              )}
            >
              {/* Message Header */}
              {(showTimestamps || showMetadata) && (
                <div
                  cclassName={cn(
                    "flex items-center gap-2 mb-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role !== "user" && (
                    <span cclassName="text-xs font-medium text-muted-foreground capitalize">
                      {message.role}
                    </span>
                  )}
                  {showTimestamps && message.createdAt && (
                    <span cclassName="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock cclassName="h-3 w-3" />
                      {formatTimestamp(message.createdAt)}
                    </span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <Card
                cclassName={cn(
                  "mac-card",
                  "px-4 py-2.5 shadow-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/50 backdrop-blur-sm"
                )}
              >
                {renderMessage ? (
                  renderMessage(message)
                ) : (
                  <div cclassName="prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </div>
                )}

                {/* Tool Invocations */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div cclassName="mt-4 pt-4 border-t border-border/50">
                    <div cclassName="flex flex-wrap gap-2.5">
                      {message.toolInvocations.map((tool, toolIndex) => (
                        <Badge key={toolIndex} variant="secondary" cclassName="text-xs py-0.5 px-2">
                          {getToolIcon(tool.toolName)}
                          <span cclassName="ml-2">{tool.toolName}</span>
                          {tool.state === "result" && (
                            <span cclassName="ml-2 text-green-500">✓</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {message.experimental_attachments &&
                  message.experimental_attachments.length > 0 && (
                    <div cclassName="mt-4 pt-4 border-t border-border/50">
                      <div cclassName="space-y-2">
                        {message.experimental_attachments.map((attachment, attIndex) => (
                          <div key={attIndex} cclassName="flex items-center gap-2 text-xs">
                            <FileText cclassName="h-3 w-3" />
                            <span cclassName="truncate">{attachment.name}</span>
                            <Badge variant="outline" cclassName="text-xs">
                              {attachment.contentType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                {showMetadata && message.annotations && (
                  <div cclassName="mt-2 pt-2 border-t border-border/50">
                    <div cclassName="flex flex-wrap gap-2">
                      {message.annotations.map((annotation, annIndex) => (
                        <Badge key={annIndex} variant="outline" cclassName="text-xs">
                          {JSON.stringify(annotation)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {message.role === "user" && (
              <Avatar cclassName="h-8 w-8 mt-2">
                <AvatarFallback cclassName="bg-primary/10 border border-primary/20">
                  {getMessageIcon(message)}
                </AvatarFallback>
              </Avatar>
            )}
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            cclassName="flex gap-4"
          >
            <Avatar cclassName="h-8 w-8 mt-2">
              <AvatarFallback cclassName="bg-primary/10 border border-primary/20">
                <Bot cclassName="h-4 w-4 text-primary animate-pulse" />
              </AvatarFallback>
            </Avatar>
            <Card cclassName="mac-card px-4 py-4 bg-card/50 backdrop-blur-sm">
              <div cclassName="flex items-center gap-2">
                <Loader2 cclassName="h-3 w-3 animate-spin text-primary" />
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
