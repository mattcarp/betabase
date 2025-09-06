# Migration Guide: OpenAI Assistants API to GPT-5 Responses API

## Overview
This guide helps you migrate from the OpenAI Assistants API to the new Responses API with GPT-5.

## Key Differences

### 1. **API Endpoint Changes**
- **Old**: `openai.beta.assistants.create()` and threads
- **New**: Direct chat completions via Responses API

### 2. **Conversation Management**
- **Old**: Thread-based with `thread_id`
- **New**: Conversation ID with message history management

### 3. **Model Access**
- **Old**: Limited to GPT-4 models
- **New**: Full GPT-5 access with variants (gpt-5, gpt-5-mini, gpt-5-nano)

## Installation

```bash
# No additional packages needed! 
# The Responses API uses the standard OpenAI SDK you already have:
npm install openai

# Verify you have the latest version (v4.68.0+)
npm list openai
```

## Before (Assistants API)

```typescript
// Old approach using Assistants API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create or retrieve assistant
const assistant = await openai.beta.assistants.retrieve(
  'asst_VvOHL1c4S6YapYKun4mY29fM'
);

// Create thread
const thread = await openai.beta.threads.create();

// Add message to thread
await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'Hello, how can you help me?'
});

// Run assistant
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: assistant.id,
});
```

## After (Responses API with GPT-5)

```typescript
// CORRECT approach using actual Responses API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Use the actual Responses API - NOT Vercel AI SDK!
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Hello, how can you help me?',
  
  // GPT-5 specific parameters (built into the API) - updated format
  reasoning: {
    effort: 'medium'
  },
  verbosity: 'medium',
  
  // Built-in tools that work automatically
  tools: [
    { type: 'web_search' },
    { type: 'file_search' }
  ],
  
  // For conversation continuity (key feature!)
  previous_response_id: previousResponseId, // From previous response
});
```

## React Hook Usage

### Old (useAssistant)
```tsx
import { useAssistant } from 'ai/react';

function Chat() {
  const { messages, input, handleSubmit } = useAssistant({
    api: '/api/assistant',
  });
  // ...
}
```

### New (Custom Hook with Responses API)
```tsx
// Create your own hook that calls the correct API endpoint
import { useState, useCallback } from 'react';

function useGPT5Responses() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());

  const sendMessage = useCallback(async (message: string) => {
    setIsLoading(true);
    
    // Call YOUR correct API endpoint
    const response = await fetch('/api/gpt5-responses-proper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId,
        reasoningEffort: 'medium',
        verbosity: 'medium',
        tools: ['web_search', 'file_search']
      })
    });
    
    // Handle streaming response...
    setIsLoading(false);
  }, [conversationId]);

  return { messages, sendMessage, isLoading };
}
```

## GPT-5 Specific Features

### 1. Reasoning Effort Control
```typescript
// Control how deeply GPT-5 thinks
reasoningEffort: 'minimal' | 'low' | 'medium' | 'high'
```

### 2. Verbosity Control
```typescript
// Control response length and detail
verbosity: 'low' | 'medium' | 'high'
```

### 3. Model Variants
- `gpt-5`: Full model ($1.25/1M input, $10/1M output)
- `gpt-5-mini`: Smaller, faster ($0.25/1M input, $2/1M output)
- `gpt-5-nano`: Smallest, fastest ($0.05/1M input, $0.40/1M output)
- `gpt-5-chat-latest`: Non-reasoning version

## File Search Migration

If you were using file search with Assistants:

### Old Way
```typescript
// Vector store with Assistants
const vectorStore = await openai.beta.vectorStores.retrieve(
  'vs_3dqHL3Wcmt1WrUof0qS4UQqo'
);
```

### New Way
```typescript
// Built-in file search with Responses API - no custom implementation needed!
const response = await openai.responses.create({
  model: 'gpt-5',
  input: 'Search my documents for information about quarterly reports',
  
  // Built-in file search tool - works automatically with your vector store
  tools: [
    { 
      type: 'file_search',
      file_search: {
        vector_store_ids: ['vs_3dqHL3Wcmt1WrUof0qS4UQqo'] // Your existing vector store!
      }
    }
  ]
});
// GPT-5 automatically searches your files and includes results in the response!
```

## Testing Your Migration

1. **Test the new API endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/gpt5-responses \
     -H "Content-Type: application/json" \
     -d '{
       "message": "Hello GPT-5!",
       "stream": false
     }'
   ```

2. **Visit the new chat interface**:
   Navigate to `http://localhost:3000/gpt5-chat`

3. **Monitor the logs**:
   Check console for any errors or warnings during migration

## Environment Variables

No changes needed to your existing `.env.local` file. The same OpenAI API key works:
```env
OPENAI_API_KEY=sk-proj-...
```

## Deprecation Timeline

- **March 2025**: Responses API launched
- **Target sunset for Assistants API**: First half of 2026

## Benefits of Migration

1. ✅ Access to GPT-5 models
2. ✅ Better reasoning capabilities
3. ✅ More control over responses
4. ✅ Lower latency with minimal reasoning
5. ✅ Better integration with Vercel AI SDK
6. ✅ Future-proof your application

## Common Issues & Solutions

### Issue: "GPT-5 not showing in Assistants"
**Solution**: GPT-5 is not available in Assistants API. Use Responses API instead.

### Issue: "How to maintain conversation history?"
**Solution**: Store messages in your database or use the in-memory approach shown in the example.

### Issue: "Missing thread functionality"
**Solution**: Implement conversation management using conversation IDs and message arrays.

## Need Help?

- Check the [OpenAI Responses API docs](https://platform.openai.com/docs/api-reference/responses)
- Review the [Vercel AI SDK documentation](https://sdk.vercel.ai/docs)
- Test with the example at `/app/gpt5-chat/page.tsx`

## Next Steps

1. Ensure you have the latest OpenAI SDK: `npm install openai@latest`
2. Test the corrected API at `/api/gpt5-responses-proper`
3. Create a simple frontend to test the actual Responses API
4. Gradually migrate your existing Assistant-based features using `previous_response_id`
5. Take advantage of built-in tools (web_search, file_search, computer_use)
6. Monitor token usage - expect 50-80% reduction compared to Assistants API
