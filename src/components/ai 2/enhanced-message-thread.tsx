"use client";

import { Message as AIMessage } from "ai";
import { cn } from "../../lib/utils";
import { Message, MessageContent } from "../ai-elements/message";
import { Response } from "../ai-elements/response";
import { Tool } from "../ai-elements/tool";
import { Reasoning } from "../ai-elements/reasoning";
import { Source } from "../ai-elements/source";
import { Actions } from "../ai-elements/actions";
import { Loader } from "../ai-elements/loader";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface EnhancedMessageThreadProps {
  messages: AIMessage[];
  isLoading?: boolean;
  className?: string;
  onReload?: () => void;
  onStop?: () => void;
  showTimestamps?: boolean;
  showActions?: boolean;
  enableReasoning?: boolean;
}

export function EnhancedMessageThread({
  messages,
  isLoading = false,
  className,
  onReload,
  onStop,
  showTimestamps = true,
  showActions = true,
  enableReasoning = true,
}: EnhancedMessageThreadProps) {
  return (
    <div className={cn("space-y-4 py-4", className)}>
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => {
          // Extract parts from message if available (for AI SDK v3.5+)
          const parts = (message as any).parts || [];
          const reasoningPart = parts.find((p: any) => p.type === "reasoning");
          const toolParts = parts.filter((p: any) => p.type === "tool");
          const sourceParts = parts.filter((p: any) => p.type === "source");

          return (
            <motion.div
              key={message.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Message
                role={message.role}
                className={cn(
                  message.role === "user" && "flex-row-reverse",
                  "relative",
                )}
              >
                <MessageContent>
                  {/* Show reasoning if available and enabled */}
                  {enableReasoning && reasoningPart && (
                    <Reasoning
                      reasoning={reasoningPart.content}
                      className="mb-4"
                    />
                  )}

                  {/* Main message content with enhanced markdown rendering */}
                  {message.role === "assistant" ? (
                    <Response>{message.content}</Response>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.content}
                    </div>
                  )}

                  {/* Show tool invocations */}
                  {message.toolInvocations &&
                    message.toolInvocations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.toolInvocations.map((invocation, idx) => (
                          <Tool
                            key={idx}
                            toolName={invocation.toolName}
                            args={invocation.args}
                            result={
                              invocation.state === "result"
                                ? invocation.result
                                : undefined
                            }
                            isLoading={invocation.state === "call"}
                          />
                        ))}
                      </div>
                    )}

                  {/* Show tool parts from message parts */}
                  {toolParts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {toolParts.map((part: any, idx: number) => (
                        <Tool
                          key={idx}
                          toolName={part.toolName}
                          args={part.args}
                          result={part.result}
                          isLoading={!part.result}
                        />
                      ))}
                    </div>
                  )}

                  {/* Show sources if available */}
                  {sourceParts.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Sources:
                      </div>
                      {sourceParts.map((source: any, idx: number) => (
                        <Source
                          key={idx}
                          title={source.title || `Source ${idx + 1}`}
                          url={source.url}
                          description={source.description}
                        />
                      ))}
                    </div>
                  )}

                  {/* Show attachments if present */}
                  {message.experimental_attachments &&
                    message.experimental_attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Attachments:
                        </div>
                        {message.experimental_attachments.map(
                          (attachment, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span className="font-medium">
                                {attachment.name}
                              </span>
                              <span className="text-muted-foreground">
                                ({attachment.contentType})
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                </MessageContent>

                {/* Action buttons for assistant messages */}
                {showActions && message.role === "assistant" && (
                  <Actions
                    reload={onReload}
                    copy={() => navigator.clipboard.writeText(message.content)}
                    className="mt-2"
                  />
                )}
              </Message>
            </motion.div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Message role="assistant">
              <MessageContent>
                <Loader />
              </MessageContent>
            </Message>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
