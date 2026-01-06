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
  className?: string;
  renderMessage?: (message: Message) => ReactNode;
  showTimestamps?: boolean;
  showMetadata?: boolean;
}

export function MessageThread({
  messages,
  isLoading = false,
  className,
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
    if (message.role === "user") return <User className="h-4 w-4" />;
    if (message.role === "assistant") return <Bot className="h-4 w-4 text-primary" />;
    if (message.role === "system") return <Zap className="h-4 w-4 text-yellow-500" />;
    return <FileText className="h-4 w-4" />;
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.includes("code")) return <Code className="h-3 w-3" />;
    if (toolName.includes("image")) return <ImageIcon className="h-3 w-3" />;
    return <Zap className="h-3 w-3" />;
  };

  /* FIXME(@ai-sdk-upgrade-v5): The `experimental_attachments` property has been replaced with the parts array. Please manually migrate following https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0#attachments--file-parts */
  return (
    <div className={cn("space-y-4 py-4", className)}>
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <motion.div
            key={message.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn("flex gap-4", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role !== "user" && (
              <Avatar className="h-8 w-8 mt-2">
                <AvatarFallback
                  className={cn(
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
              className={cn(
                "flex-1 max-w-[70%]",
                message.role === "user" && "flex flex-col items-end"
              )}
            >
              {/* Message Header */}
              {(showTimestamps || showMetadata) && (
                <div
                  className={cn(
                    "flex items-center gap-2 mb-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role !== "user" && (
                    <span className="text-xs font-normal text-muted-foreground capitalize">
                      {message.role}
                    </span>
                  )}
                  {showTimestamps && message.createdAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(message.createdAt)}
                    </span>
                  )}
                </div>
              )}

              {/* Message Content */}
              <Card
                className={cn(
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
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content}
                  </div>
                )}

                {/* Tool Invocations */}
                {message.toolInvocations && message.toolInvocations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="flex flex-wrap gap-2.5">
                      {message.toolInvocations.map((tool, toolIndex) => (
                        <Badge key={toolIndex} variant="secondary" className="text-xs py-0.5 px-2">
                          {getToolIcon(tool.toolName)}
                          <span className="ml-2">{tool.toolName}</span>
                          {tool.state === "result" && (
                            <span className="ml-2 text-green-500">✓</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {message.experimental_attachments &&
                  message.experimental_attachments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        {message.experimental_attachments.map((attachment, attIndex) => (
                          <div key={attIndex} className="flex items-center gap-2 text-xs">
                            <FileText className="h-3 w-3" />
                            <span className="truncate">{attachment.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {attachment.contentType}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                {showMetadata && message.annotations && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-2">
                      {message.annotations.map((annotation, annIndex) => (
                        <Badge key={annIndex} variant="outline" className="text-xs">
                          {JSON.stringify(annotation)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {message.role === "user" && (
              <Avatar className="h-8 w-8 mt-2">
                <AvatarFallback className="bg-primary/10 border border-primary/20">
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
            className="flex gap-4"
          >
            <Avatar className="h-8 w-8 mt-2">
              <AvatarFallback className="bg-primary/10 border border-primary/20">
                <Bot className="h-4 w-4 text-primary animate-pulse" />
              </AvatarFallback>
            </Avatar>
            <Card className="mac-card px-4 py-4 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <div className="flex gap-2">
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
