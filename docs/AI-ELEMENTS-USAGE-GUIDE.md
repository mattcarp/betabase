# AI Elements Usage Guide - Maximize AI SDK Elements

## 🎯 What Are AI Elements?

AI Elements are pre-built, accessible React components from Vercel AI SDK designed specifically for AI applications. They handle common patterns like:
- Chat messages with proper semantics
- Code blocks with syntax highlighting
- Source citations with hover cards
- Loading states with spinners
- Inline citations for knowledge attribution

**Documentation**: https://ai-sdk.dev/elements/overview

## 🚀 Why Use AI Elements?

### ✅ Benefits:
- **Accessibility**: Built-in ARIA labels and keyboard navigation
- **Consistency**: Uniform UX across AI features
- **Performance**: Optimized for streaming responses
- **Maintainability**: Less custom code to maintain
- **Best Practices**: Follow Vercel AI SDK patterns

### ❌ DON'T Do This:
```tsx
// Bad: Plain divs for messages
<div className="message">
  <div className="avatar">AI</div>
  <div className="content">{message.content}</div>
</div>
```

### ✅ DO This:
```tsx
// Good: AI Elements for messages
<Message from="assistant">
  <MessageAvatar src="/ai-avatar.png" name="AI" />
  <MessageContent>
    <Response>{message.content}</Response>
  </MessageContent>
</Message>
```

## 📦 Available AI Elements

### 1. Message Components
**When to use**: Every chat message (user or AI)

```tsx
import { Message, MessageContent, MessageAvatar } from "@/components/ai-elements/message";

<Message from={message.role}>
  <MessageAvatar
    src={isUser ? "/user.png" : "/ai.png"}
    name={isUser ? "You" : "AI"}
  />
  <MessageContent>
    {/* Message content here */}
  </MessageContent>
</Message>
```

**Features**:
- Automatic role-based styling (`.is-user`, `.is-assistant`)
- Proper semantic HTML
- Responsive layout

### 2. Response Component
**When to use**: AI-generated responses with markdown

```tsx
import { Response } from "@/components/ai-elements/response";

<Response parseIncompleteMarkdown={true}>
  {message.content}
</Response>
```

**Features**:
- Markdown parsing with GitHub Flavored Markdown
- Code block syntax highlighting
- Auto-completion of incomplete markdown during streaming
- Tables, lists, headers, blockquotes
- LaTeX math support (if dependencies installed)

### 3. Inline Citation Components
**When to use**: AI responses with source attribution

```tsx
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationSource
} from "@/components/ai-elements/inline-citation";

<InlineCitation>
  <InlineCitationCard>
    <InlineCitationCardTrigger sources={["Source 1", "Source 2"]} />
    <InlineCitationCardBody>
      <InlineCitationSource
        title="AOMA Knowledge Base"
        url="https://aoma.sonymusic.com"
        description="Information from AOMA documentation"
      />
    </InlineCitationCardBody>
  </InlineCitationCard>
</InlineCitation>
```

**Features**:
- Hover card with source details
- Multiple source carousel
- Badge showing source count
- URL hostname extraction

### 4. Code Block Component
**When to use**: Code snippets in responses

```tsx
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block";

<CodeBlock code={codeString} language="typescript">
  <CodeBlockCopyButton
    onCopy={() => console.log("Copied!")}
    onError={() => console.error("Failed to copy")}
  />
</CodeBlock>
```

**Features**:
- Syntax highlighting (Prism.js)
- Copy to clipboard button
- Language badges
- Line numbers

### 5. Loader Component
**When to use**: Loading/thinking states

```tsx
import { Loader } from "@/components/ai-elements/loader";

{isLoading && (
  <Loader>
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Searching knowledge base...</span>
  </Loader>
)}
```

### 6. Other AI Elements

**Conversation**: For conversation containers
```tsx
import { Conversation } from "@/components/ai-elements/conversation";
```

**Actions**: For AI-suggested actions
```tsx
import { Actions } from "@/components/ai-elements/actions";
```

**Suggestion**: For suggested prompts
```tsx
import { Suggestion } from "@/components/ai-elements/suggestion";
```

**Tool**: For tool call results
```tsx
import { Tool } from "@/components/ai-elements/tool";
```

**Branch**: For conversation branching
```tsx
import { Branch } from "@/components/ai-elements/branch";
```

**Reasoning**: For chain-of-thought reasoning
```tsx
import { Reasoning } from "@/components/ai-elements/reasoning";
```

## 🎨 Complete Example: AOMA Chat with AI Elements

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { Message, MessageContent, MessageAvatar } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { InlineCitation, InlineCitationCardTrigger } from "@/components/ai-elements/inline-citation";
import { Loader } from "@/components/ai-elements/loader";

function parseAOMAResponse(content: string) {
  // Extract sources from AOMA response
  const sourcePattern = /【([^】]+)】/g;
  const sources = [...content.matchAll(sourcePattern)].map(m => m[1]);
  const text = content.replace(sourcePattern, '');
  return { text, sources };
}

export function AOMAChat() {
  const { messages, isLoading } = useChat({ api: "/api/chat" });

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const { text, sources } = isUser
          ? { text: message.content, sources: [] }
          : parseAOMAResponse(message.content);

        return (
          <Message key={message.id} from={message.role}>
            <MessageAvatar
              src={isUser ? "/user.png" : "/aoma.png"}
              name={isUser ? "You" : "AOMA"}
            />
            <MessageContent>
              {isUser ? (
                <div>{message.content}</div>
              ) : (
                <>
                  <Response>{text}</Response>
                  {sources.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {sources.map((source, idx) => (
                        <InlineCitation key={idx}>
                          <InlineCitationCardTrigger sources={[source]} />
                        </InlineCitation>
                      ))}
                    </div>
                  )}
                </>
              )}
            </MessageContent>
          </Message>
        );
      })}

      {isLoading && (
        <Message from="assistant">
          <MessageAvatar src="/aoma.png" name="AOMA" />
          <MessageContent>
            <Loader>Searching AOMA knowledge base...</Loader>
          </MessageContent>
        </Message>
      )}
    </div>
  );
}
```

## 📋 Migration Checklist

### From Plain Divs → AI Elements

- [ ] Replace message divs with `<Message>` component
- [ ] Use `<MessageAvatar>` instead of custom avatars
- [ ] Use `<MessageContent>` for message wrappers
- [ ] Replace raw text with `<Response>` for AI messages
- [ ] Add `<InlineCitation>` for source attribution
- [ ] Use `<Loader>` for loading states
- [ ] Use `<CodeBlock>` for code snippets
- [ ] Add `<Suggestion>` for prompt suggestions

### Example Migration

**Before**:
```tsx
<div className="flex gap-3">
  <div className="w-8 h-8 rounded-full bg-gray-500">
    <Bot className="w-4 h-4" />
  </div>
  <div className="flex-1">
    <div className="text-sm">{message.content}</div>
  </div>
</div>
```

**After**:
```tsx
<Message from="assistant">
  <MessageAvatar src="/ai-avatar.png" name="AI" />
  <MessageContent>
    <Response>{message.content}</Response>
  </MessageContent>
</Message>
```

## 🎯 When to Use Each Component

| Scenario | AI Element | Why |
|----------|-----------|-----|
| User/AI message | `<Message>` | Semantic HTML, accessibility |
| AI response text | `<Response>` | Markdown parsing, streaming |
| Source attribution | `<InlineCitation>` | Hover cards, citations |
| Code in response | `<CodeBlock>` | Syntax highlighting, copy button |
| Loading AI response | `<Loader>` | Consistent loading UX |
| Tool call result | `<Tool>` | Structured tool output |
| Suggested prompts | `<Suggestion>` | Interactive suggestions |
| Conversation container | `<Conversation>` | Semantic conversation wrapper |

## 🚨 Common Mistakes

### ❌ Mistake 1: Not using Response for markdown
```tsx
// Bad: Markdown won't parse
<div>{message.content}</div>
```

```tsx
// Good: Markdown parses correctly
<Response>{message.content}</Response>
```

### ❌ Mistake 2: Not showing sources
```tsx
// Bad: No attribution
<Response>{message.content}</Response>
```

```tsx
// Good: Clear source attribution
<Response>{text}</Response>
<InlineCitation>
  <InlineCitationCardTrigger sources={sources} />
</InlineCitation>
```

### ❌ Mistake 3: Custom loading state
```tsx
// Bad: Custom loading
{isLoading && <div>Loading...</div>}
```

```tsx
// Good: AI Elements loader
{isLoading && (
  <Message from="assistant">
    <MessageAvatar src="/ai.png" name="AI" />
    <MessageContent>
      <Loader>Thinking...</Loader>
    </MessageContent>
  </Message>
)}
```

## 📚 Additional Resources

- **AI SDK Elements Docs**: https://ai-sdk.dev/elements/overview
- **Component Source**: `/src/components/ai-elements/`
- **Enhanced Chat Panel Example**: `/src/components/ai/enhanced-chat-panel-with-ai-elements.tsx`

## 🎯 Remember

**Always ask**: "Is there an AI Element for this?"
**If yes**: Use the AI Element
**If no**: Build it as an AI Element for reuse

**Maximize AI Elements = Better UX + Less Code + More Consistent**
