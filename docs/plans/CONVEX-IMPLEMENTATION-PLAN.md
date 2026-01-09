# Convex Implementation Plan for Conversation Persistence

**Created:** 2025-01-09
**Status:** Planning
**Priority:** High - Conversations are being lost due to localStorage limitations

## Executive Summary

Conversations are currently stored in browser localStorage via Zustand. This causes:
- **Data loss** when browser cache is cleared
- **No cross-device sync** - conversations stuck on one browser
- **No backup** - no server-side persistence

**Solution:** Implement Convex real-time database for persistent, synced conversation storage.

## Current State Analysis

### Current Storage: `src/lib/conversation-store.ts`

```typescript
// Zustand store with localStorage persistence
export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: "siam-conversations",  // localStorage key
      version: 2,
      // Custom serialization for Date objects
    }
  )
);
```

### Current Data Model

```typescript
interface Conversation {
  id: string;           // "conv-{timestamp}-{random}"
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  tags?: string[];
  model?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  reasoningText?: string;
  tools?: ToolInvocation[];
}

interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

interface ToolInvocation {
  name: string;
  args: Record<string, any>;
  result?: any;
}
```

## Proposed Convex Implementation

### 1. Installation

```bash
npm install convex@latest
npx convex dev  # Initialize Convex project
```

**Note:** Latest version is `1.31.3` (there is no version 4.0)

### 2. Schema Definition: `convex/schema.ts`

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - linked to Supabase auth
  users: defineTable({
    supabaseUserId: v.string(),  // Supabase user ID
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_supabase_id", ["supabaseUserId"]),

  // Conversations table
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    isPinned: v.boolean(),
    tags: v.array(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_updated", ["userId", "updatedAt"]),

  // Messages table (separate for efficient queries)
  messages: defineTable({
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    timestamp: v.number(),
    citations: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      snippet: v.optional(v.string()),
    }))),
    reasoningText: v.optional(v.string()),
    tools: v.optional(v.array(v.object({
      name: v.string(),
      args: v.any(),
      result: v.optional(v.any()),
    }))),
  }).index("by_conversation", ["conversationId", "timestamp"]),
});
```

### 3. Convex Functions

#### `convex/conversations.ts` - Queries

```typescript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all conversations for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_supabase_id", (q) => q.eq("supabaseUserId", identity.subject))
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("by_user_updated", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Get single conversation with messages
export const get = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) return null;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    return { ...conversation, messages };
  },
});
```

#### `convex/conversations.ts` - Mutations

```typescript
// Create new conversation
export const create = mutation({
  args: {
    title: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_supabase_id", (q) => q.eq("supabaseUserId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title ?? "New Conversation",
      isPinned: false,
      tags: [],
      model: args.model,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Add message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    citations: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      snippet: v.optional(v.string()),
    }))),
    reasoningText: v.optional(v.string()),
    tools: v.optional(v.array(v.object({
      name: v.string(),
      args: v.any(),
      result: v.optional(v.any()),
    }))),
  },
  handler: async (ctx, args) => {
    const { conversationId, ...messageData } = args;

    // Update conversation timestamp
    await ctx.db.patch("conversations", conversationId, {
      updatedAt: Date.now(),
    });

    return await ctx.db.insert("messages", {
      conversationId,
      ...messageData,
      timestamp: Date.now(),
    });
  },
});

// Update conversation (title, pin, tags)
export const update = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { conversationId, ...updates } = args;
    await ctx.db.patch("conversations", conversationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete conversation and all messages
export const remove = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    // Delete all messages first
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete("messages", message._id);
    }

    // Delete conversation
    await ctx.db.delete("conversations", args.conversationId);
  },
});
```

### 4. Supabase Auth Integration

#### `src/lib/convex-auth.ts`

```typescript
"use client";

import { useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSupabaseAuth() {
  const supabase = createClient();

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return null;
      }

      if (forceRefreshToken) {
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        return refreshedSession?.access_token ?? null;
      }

      return session.access_token;
    },
    [supabase]
  );

  // Track auth state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return useMemo(
    () => ({
      isLoading,
      isAuthenticated,
      fetchAccessToken,
    }),
    [isLoading, isAuthenticated, fetchAccessToken]
  );
}
```

### 5. Provider Setup

#### `src/components/providers/convex-provider.tsx`

```typescript
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";
import { useSupabaseAuth } from "@/lib/convex-auth";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useSupabaseAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
```

### 6. React Hook for Conversations

#### `src/hooks/use-convex-conversations.ts`

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useConvexConversations() {
  // Real-time conversation list
  const conversations = useQuery(api.conversations.list) ?? [];

  // Mutations
  const createConversation = useMutation(api.conversations.create);
  const updateConversation = useMutation(api.conversations.update);
  const deleteConversation = useMutation(api.conversations.remove);
  const addMessage = useMutation(api.conversations.addMessage);

  return {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    addMessage,
  };
}

export function useConversation(conversationId: Id<"conversations"> | null) {
  const conversation = useQuery(
    api.conversations.get,
    conversationId ? { conversationId } : "skip"
  );

  return conversation;
}
```

## Migration Strategy

### Phase 1: Dual-Write (Recommended)

1. Keep existing localStorage store working
2. Add Convex writes alongside localStorage
3. Read from localStorage first, sync to Convex
4. No user disruption during transition

### Phase 2: Migration Script

```typescript
// One-time migration of localStorage conversations to Convex
async function migrateLocalStorageToConvex() {
  const localData = localStorage.getItem("siam-conversations");
  if (!localData) return;

  const { state } = JSON.parse(localData);
  const { conversations } = state;

  for (const conv of conversations) {
    // Create conversation in Convex
    const convexId = await createConversation({
      title: conv.title,
      model: conv.model,
    });

    // Add all messages
    for (const msg of conv.messages) {
      await addMessage({
        conversationId: convexId,
        role: msg.role,
        content: msg.content,
        citations: msg.citations,
        reasoningText: msg.reasoningText,
        tools: msg.tools,
      });
    }
  }

  // Clear localStorage after successful migration
  localStorage.removeItem("siam-conversations");
}
```

### Phase 3: Remove localStorage

1. Remove Zustand persist middleware
2. Remove localStorage references
3. Rely entirely on Convex

## Environment Variables

Add to `.env.local` and Infisical:

```bash
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

## Convex Auth Configuration

In your Convex dashboard, configure JWT verification for Supabase:

```json
{
  "applicationID": "your-supabase-project-id",
  "domain": "your-supabase-url.supabase.co"
}
```

## Benefits of Convex

1. **Real-time sync** - Changes appear instantly across devices
2. **Persistent storage** - No data loss from browser cache clearing
3. **Automatic offline support** - Convex handles connectivity issues
4. **Type-safe** - Full TypeScript support with generated types
5. **Optimistic updates** - Instant UI feedback
6. **Scalable** - No backend infrastructure to manage

## Implementation Steps

1. [ ] Install Convex: `npm install convex`
2. [ ] Initialize: `npx convex dev`
3. [ ] Create schema: `convex/schema.ts`
4. [ ] Create functions: `convex/conversations.ts`
5. [ ] Create auth integration: `src/lib/convex-auth.ts`
6. [ ] Create provider: `src/components/providers/convex-provider.tsx`
7. [ ] Create hooks: `src/hooks/use-convex-conversations.ts`
8. [ ] Add provider to layout
9. [ ] Update ChatPage to use Convex hooks
10. [ ] Run migration script
11. [ ] Remove localStorage dependency

## Estimated Effort

- **Day 1:** Setup, schema, basic functions
- **Day 2:** Auth integration, provider, hooks
- **Day 3:** ChatPage integration, testing
- **Day 4:** Migration, cleanup, deployment

## Questions for Product Decision

1. Should we support Guest users (localStorage only) alongside authenticated users (Convex)?
2. What's the conversation retention policy? (Keep forever vs. 90 days)
3. Should we add conversation sharing features now that data is server-side?

---

**Sources:**
- [Convex NPM Package](https://www.npmjs.com/package/convex)
- [Convex Documentation](https://docs.convex.dev)
- [Convex Custom Auth](https://docs.convex.dev/auth/advanced/custom-auth)
