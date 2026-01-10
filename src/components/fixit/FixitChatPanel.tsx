/**
 * Fixit Chat Panel
 *
 * Programmer-focused chat interface for code debugging and understanding.
 * Tuned for questions like:
 * - "What is the backend language?"
 * - "What is the frontend framework?"
 * - "Show me where authentication is handled"
 * - "I'm having an issue with JIRA-123"
 *
 * Integrates with:
 * - Git vector search (code history)
 * - JIRA tickets
 * - Confluence documentation
 * - Knowledge base
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import {
  Code,
  Send,
  Loader2,
  Wrench,
  GitBranch,
  FileText,
  Ticket,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CodeArtifact } from "./CodeArtifactPanel";

interface FixitChatPanelProps {
  onArtifactGenerated?: (artifact: CodeArtifact) => void;
  className?: string;
  initialQuestion?: string;
}

// Suggested questions for programmers
const PROGRAMMER_SUGGESTIONS = [
  {
    icon: <Code className="h-3 w-3" />,
    question: "What is the backend language and framework?",
    category: "Architecture",
  },
  {
    icon: <GitBranch className="h-3 w-3" />,
    question: "Show me the frontend framework and main components",
    category: "Architecture",
  },
  {
    icon: <Wrench className="h-3 w-3" />,
    question: "Where is error handling implemented?",
    category: "Code",
  },
  {
    icon: <FileText className="h-3 w-3" />,
    question: "How does authentication work in this codebase?",
    category: "Code",
  },
  {
    icon: <Ticket className="h-3 w-3" />,
    question: "What are the recent JIRA tickets related to bugs?",
    category: "JIRA",
  },
  {
    icon: <Sparkles className="h-3 w-3" />,
    question: "Generate an architecture diagram for this system",
    category: "Diagram",
  },
];

// System prompt for programmer-focused assistance
const PROGRAMMER_SYSTEM_PROMPT = `You are a senior software engineer assistant focused on helping developers understand and debug codebases.

You have access to:
- Git commit history and code changes
- JIRA tickets and issue tracking
- Confluence documentation
- Project knowledge base

When answering questions:
1. Be precise and technical - assume the user is a programmer
2. Reference specific files, functions, and line numbers when possible
3. Generate code snippets with syntax highlighting
4. Create Mermaid diagrams for architecture explanations
5. Link to relevant JIRA tickets when discussing bugs or features

For code responses, always format them as artifacts that can be displayed in the artifact panel.
Use this format for code artifacts:
\`\`\`artifact:code
{
  "title": "Description of the code",
  "language": "typescript",
  "filePath": "src/path/to/file.ts",
  "lineStart": 10,
  "lineEnd": 50,
  "source": "git"
}
\`\`\`
<code content here>
\`\`\`

For diagrams:
\`\`\`artifact:diagram
{
  "title": "Architecture Diagram"
}
\`\`\`
<mermaid content here>
\`\`\``;

export function FixitChatPanel({
  onArtifactGenerated,
  className,
  initialQuestion,
}: FixitChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(initialQuestion || "");

  // Track messages and loading state manually
  // We use direct fetch to /api/fixit/chat because AI SDK useChat's sendMessage
  // doesn't respect the api option in @ai-sdk/react v3.x
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Parse code artifacts from AI response (defined first since submitMessage depends on it)
  const parseArtifacts = useCallback(
    (content: string) => {
      const artifactRegex = /```artifact:(code|diagram)\n({[\s\S]*?})\n```\n([\s\S]*?)```/g;
      let match;

      while ((match = artifactRegex.exec(content)) !== null) {
        try {
          const type = match[1] as "code" | "diagram";
          const metadata = JSON.parse(match[2]);
          const artifactContent = match[3].trim();

          const artifact: CodeArtifact = {
            id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type,
            title: metadata.title || "Code Snippet",
            language: metadata.language || "typescript",
            content: artifactContent,
            filePath: metadata.filePath,
            lineStart: metadata.lineStart,
            lineEnd: metadata.lineEnd,
            source: metadata.source,
            metadata: {
              author: metadata.author,
              commitHash: metadata.commitHash,
              jiraTicket: metadata.jiraTicket,
            },
          };

          onArtifactGenerated?.(artifact);
        } catch (e) {
          console.error("Failed to parse artifact:", e);
        }
      }
    },
    [onArtifactGenerated]
  );

  // Helper to send a message - makes direct fetch to /api/fixit/chat
  // because sendMessage in AI SDK v3.x doesn't respect the api option
  const submitMessage = useCallback(async (content: string) => {
    console.log("[FixitChatPanel] submitMessage called with:", content);
    console.log("[FixitChatPanel] Making direct fetch to /api/fixit/chat");

    // Add user message immediately
    setLocalMessages((prev) => [...prev, { role: "user", content }]);
    setLocalLoading(true);

    try {
      const response = await fetch("/api/fixit/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...localMessages, { role: "user", content }],
          systemPrompt: PROGRAMMER_SYSTEM_PROMPT,
          sourceTypes: ["git", "jira", "confluence", "knowledge"],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add placeholder for assistant message
      setLocalMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Parse SSE format - look for text content
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              // AI SDK format: 0:"text content"
              try {
                const textContent = JSON.parse(line.slice(2));
                if (typeof textContent === "string") {
                  assistantContent += textContent;
                  // Update the assistant message in real-time
                  setLocalMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    if (lastIdx >= 0 && updated[lastIdx].role === "assistant") {
                      updated[lastIdx] = { role: "assistant", content: assistantContent };
                    }
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Parse artifacts from final response
      if (assistantContent) {
        parseArtifacts(assistantContent);
      }
    } catch (error) {
      console.error("[FixitChatPanel] Error:", error);
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, there was an error processing your request." },
      ]);
    } finally {
      setLocalLoading(false);
    }
  }, [localMessages, parseArtifacts]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || localLoading) return;

    submitMessage(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (question: string) => {
    submitMessage(question);
  };

  return (
    <Card className={cn("mac-card h-full flex flex-col bg-card/30 border-border", className)}>
      {/* Header */}
      <CardHeader className="pb-2 pt-3 px-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="text-sm font-light text-foreground">Code Assistant</span>
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-green-400 border-green-400/30">
              Codebase-aware
            </Badge>
          </div>
          {localMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              New
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 min-h-0 flex flex-col">
        <ScrollArea ref={scrollRef} className="flex-1 p-3">
          {localMessages.length === 0 ? (
            <div className="space-y-4">
              {/* Welcome message */}
              <div className="text-center py-6">
                <Wrench className="h-10 w-10 mx-auto mb-3 text-primary opacity-70" />
                <h3 className="text-sm font-light text-foreground mb-1">
                  Code Assistant
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ask questions about your codebase, debug issues, or explore architecture
                </p>
              </div>

              {/* Suggested questions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">Try asking:</p>
                <div className="grid gap-2">
                  {PROGRAMMER_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion.question)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-left transition-colors group"
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">
                          {suggestion.question}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {suggestion.category}
                        </p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {localMessages.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      message.role === "user"
                        ? "bg-primary/20 text-foreground"
                        : "bg-muted/50 text-foreground"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        {/* Strip artifact blocks from display */}
                        {(message.content || "")
                          .replace(/```artifact:(code|diagram)\n[\s\S]*?```\n[\s\S]*?```/g, "")
                          .split("\n")
                          .map((line, i) => (
                            <p key={i} className="mb-1 last:mb-0">
                              {line || "\u00A0"}
                            </p>
                          ))}
                      </div>
                    ) : (
                      <p>{message.content || ""}</p>
                    )}
                  </div>
                </div>
              ))}

              {localLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="bg-muted/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-xs">Searching codebase...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your codebase..."
              className="min-h-[40px] max-h-[120px] resize-none bg-muted/30 border-border text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={localLoading || !inputValue.trim()}
              className="h-10 w-10 shrink-0"
            >
              {localLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default FixitChatPanel;
