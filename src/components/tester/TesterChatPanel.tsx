/**
 * Tester Chat Panel
 *
 * Test-focused chat interface for finding tests, understanding test coverage,
 * and generating Playwright test code.
 * Tuned for questions like:
 * - "Find tests related to user authentication"
 * - "Show me flaky tests"
 * - "Generate a Playwright test for login"
 * - "What's the test coverage for the chat feature?"
 *
 * Integrates with:
 * - Betabase test data (8,449+ historical tests)
 * - Self-healing test attempts
 * - RLHF-generated test scenarios
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import {
  TestTube,
  Send,
  Loader2,
  Bug,
  Play,
  FileCode,
  BarChart3,
  Sparkles,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CodeBlock } from "../ui/code-block";

interface TesterChatPanelProps {
  onCodeGenerated?: (code: string, language: string) => void;
  className?: string;
  initialQuestion?: string;
}

// Suggested questions for testers
const TESTER_SUGGESTIONS = [
  {
    icon: <Bug className="h-3 w-3" />,
    question: "Find tests related to user authentication",
    category: "Search",
  },
  {
    icon: <AlertTriangle className="h-3 w-3" />,
    question: "Show me flaky tests with high failure rates",
    category: "Analytics",
  },
  {
    icon: <FileCode className="h-3 w-3" />,
    question: "Generate a Playwright test for the login flow",
    category: "Generate",
  },
  {
    icon: <BarChart3 className="h-3 w-3" />,
    question: "What's the test coverage for the chat feature?",
    category: "Coverage",
  },
  {
    icon: <Play className="h-3 w-3" />,
    question: "Which tests failed in the last run?",
    category: "Results",
  },
  {
    icon: <Sparkles className="h-3 w-3" />,
    question: "Suggest new test cases for edge cases",
    category: "Suggestions",
  },
];

// System prompt for test-focused assistance
const TESTER_SYSTEM_PROMPT = `You are a QA engineer assistant focused on helping testers find, understand, and create tests.

You have access to:
- Historical test data from betabase (8,449+ test scenarios)
- Self-healing test attempt records
- RLHF-generated test scenarios
- Test analytics and failure patterns

When answering questions:
1. Be precise about test names, files, and line numbers
2. Reference specific test scenarios with their IDs when available
3. Generate valid Playwright test code when asked
4. Highlight flaky tests and patterns that indicate instability
5. Suggest improvements based on test coverage gaps

For code responses, format them clearly with syntax highlighting.
When generating Playwright tests, follow these conventions:
- Use page object model patterns
- Include proper waits and assertions
- Add descriptive test names
- Include comments explaining the test purpose

For test search results, include:
- Test name and description
- Last run status (pass/fail)
- Flakiness score if available
- File path and line number`;

export function TesterChatPanel({
  onCodeGenerated,
  className,
  initialQuestion,
}: TesterChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(initialQuestion || "");

  // Track messages and loading state
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [localLoading, setLocalLoading] = useState(false);

  // Helper to extract code blocks from response
  const extractCodeBlocks = useCallback(
    (content: string) => {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1] || "typescript";
        const code = match[2].trim();

        if (code && onCodeGenerated) {
          onCodeGenerated(code, language);
        }
      }
    },
    [onCodeGenerated]
  );

  // Helper to send a message
  const submitMessage = useCallback(
    async (content: string) => {
      console.log("[TesterChatPanel] submitMessage called with:", content);

      // Add user message immediately
      setLocalMessages((prev) => [...prev, { role: "user", content }]);
      setLocalLoading(true);

      try {
        const response = await fetch("/api/tester/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...localMessages, { role: "user", content }],
            systemPrompt: TESTER_SYSTEM_PROMPT,
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

        // Extract code blocks from final response
        if (assistantContent) {
          extractCodeBlocks(assistantContent);
        }
      } catch (error) {
        console.error("[TesterChatPanel] Error:", error);
        setLocalMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, there was an error processing your request. The tester chat API may not be available yet.",
          },
        ]);
      } finally {
        setLocalLoading(false);
      }
    },
    [localMessages, extractCodeBlocks]
  );

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

  // Render message content with code blocks
  const renderMessageContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push(
          <span key={`text-${lastIndex}`}>
            {textBefore.split("\n").map((line, i) => (
              <p key={i} className="mb-1 last:mb-0">
                {line || "\u00A0"}
              </p>
            ))}
          </span>
        );
      }

      // Add code block
      const language = match[1] || "typescript";
      const code = match[2].trim();
      parts.push(
        <div key={`code-${match.index}`} className="my-2">
          <CodeBlock code={code} language={language} showLineNumbers className="text-xs" />
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      parts.push(
        <span key={`text-${lastIndex}`}>
          {textAfter.split("\n").map((line, i) => (
            <p key={i} className="mb-1 last:mb-0">
              {line || "\u00A0"}
            </p>
          ))}
        </span>
      );
    }

    return parts.length > 0 ? parts : content;
  };

  return (
    <Card className={cn("mac-card h-full flex flex-col bg-card/30 border-border", className)}>
      {/* Header */}
      <CardHeader className="pb-2 pt-3 px-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTube className="h-4 w-4 text-primary" />
            <span className="text-sm font-light text-foreground">Test Assistant</span>
            <Badge variant="outline" className="text-xs h-5 px-1.5 text-primary border-primary/30">
              Betabase-aware
            </Badge>
          </div>
          {localMessages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setLocalMessages([])}
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
                <TestTube className="h-10 w-10 mx-auto mb-3 text-primary opacity-70" />
                <h3 className="text-sm font-light text-foreground mb-1">Test Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  Find tests, analyze coverage, and generate Playwright code
                </p>
              </div>

              {/* Suggested questions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground px-1">Try asking:</p>
                <div className="grid gap-2">
                  {TESTER_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion.question)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-left transition-colors group"
                    >
                      <div className="flex items-center justify-center h-6 w-6 rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
                        {suggestion.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{suggestion.question}</p>
                        <p className="text-[10px] text-muted-foreground">{suggestion.category}</p>
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
                        {renderMessageContent(message.content || "")}
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
                      <span className="text-xs">Searching tests...</span>
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
              placeholder="Ask about tests..."
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
              className="h-10 w-10 shrink-0 bg-primary hover:bg-primary/80"
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

export default TesterChatPanel;
