# Gemini 2.5 Pro Migration - November 2025

## Migration Summary

**Date**: November 2-3, 2025  
**Migration**: GPT-5 → Google Gemini 2.5 Pro  
**Status**: ✅ Implementation Complete, Testing Required  
**Branch**: `feature/gemini-2.5-pro-migration`

## Why Gemini 2.5 Pro for Sony Music's RAG Application

### Business Context
SIAM is a conversational RAG (Retrieval-Augmented Generation) application for Sony Music, helping employees query internal systems like AOMA, Jira tickets, and knowledge bases. Users ask questions like:
- "How do I submit a content request in AOMA?"
- "What's the status of my Jira ticket?"
- "Where can I find the brand guidelines?"

### Why Pro (Not Ultra)
**Our Use Case**: Document synthesis and conversational responses  
**Not Needed**: Protein folding, advanced mathematics, novel research

Gemini 2.5 Pro is **perfect for enterprise RAG** because:
- ✅ Excellent at synthesizing retrieved documents into clear answers
- ✅ 2M context window handles entire conversations + all search results
- ✅ Better cost/performance ratio than Ultra
- ✅ Optimized for multimodal analysis (docs, screenshots, images)

## Key Improvements

### 1. Massive Context Window
- **GPT-5**: 400,000 tokens
- **Gemini 2.5 Pro**: 2,000,000 tokens (**5x larger!**)

**What this means**:
- Can include 100+ search results in a single query
- Never truncate conversation history
- Process entire AOMA documentation pages at once

### 2. Superior RAG Synthesis
Gemini 2.5 Pro excels at:
- Combining multiple source documents
- Extracting key information from search results
- Providing coherent, conversational responses
- Maintaining factual accuracy (anti-hallucination)

### 3. Cost Efficiency
- Gemini 2.5 Pro: Better price/performance for RAG workloads
- Gemini 2.5 Flash available for simple queries ($0.10/$0.40 per M tokens)
- OpenAI embeddings kept (no data migration costs)

### 4. Benchmarks
- **86.7%** on AIME 2025 math benchmark
- **84%** on GPQA diamond science benchmark
- Outperforms GPT-5 on many coding tasks

## Technical Implementation

### Architecture Changes

#### 1. Dual Provider Support
```typescript
// app/api/chat/route.ts
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const google = createGoogle({ apiKey: process.env.GOOGLE_API_KEY! });
const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Route based on model prefix
const isGeminiModel = selectedModel.startsWith('gemini-');
const modelProvider = isGeminiModel ? google(selectedModel) : openai(selectedModel);
```

#### 2. Model Configuration
```typescript
// src/services/modelConfig.ts
export type AIModel =
  | "gemini-2.5-pro"    // Primary for RAG
  | "gemini-2.5-flash"  // Cost-efficient
  | "gemini-2.5-ultra"  // Premium (if needed)
  | "gpt-5"             // Fallback
  // ... other models

// All RAG use cases now use Gemini 2.5 Pro
chat: {
  model: "gemini-2.5-pro",
  temperature: 0.9,
  maxTokens: 8000,
  description: "Conversational RAG with Gemini 2.5 Pro (2M context)",
}
```

#### 3. UI Updates
- **Default model**: `gemini-2.5-pro` (starred in dropdown)
- **Model options**: Gemini models listed first, OpenAI as fallback
- **Context indicator**: Shows "Google Gemini" vs "OpenAI/Claude" provider

### Embeddings Strategy

**Decision**: Keep OpenAI embeddings (no migration)

**Why**:
- Changing embeddings requires re-embedding entire database (15K+ docs)
- OpenAI's `text-embedding-3-small` is already excellent
- Focus migration effort on chat model (highest impact)
- Can evaluate Google embeddings later if needed

**Files unchanged**:
- `src/services/aomaFirecrawlService.ts`
- `src/services/enhancedAomaFirecrawlService.ts`
- `src/services/knowledgeSearchService.ts`
- `src/services/supabaseVectorService.ts`

## Files Changed

### Core Implementation (3 files)
1. **`app/api/chat/route.ts`** - Added Google provider, routing logic
2. **`src/services/modelConfig.ts`** - AIModel type, Gemini configs
3. **`src/components/ai/ai-sdk-chat-panel.tsx`** - UI model selection

### Documentation (2+ files)
4. **`README.md`** - Updated tech stack, env vars
5. **`docs/GEMINI_MIGRATION_NOV_2025.md`** - This file

## Environment Setup

### Required API Keys

```env
# Primary chat model
GOOGLE_API_KEY=your_google_ai_api_key_here

# Embeddings only (keep existing)
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting Google AI API Key
1. Visit: https://ai.google.dev/
2. Create project (or use existing)
3. Enable Gemini API
4. Generate API key
5. Add to `.env.local` or production environment

## Testing Plan

### 1. Basic Chat Functionality ✅
- [x] Test simple questions
- [x] Verify Gemini API integration works
- [x] Check streaming responses
- [ ] **User to verify**: Chat quality vs GPT-5

### 2. AOMA RAG Queries 🔄
- [ ] Test AOMA knowledge queries
- [ ] Verify vector search + Gemini synthesis
- [ ] Test with 50+ search results (stress test 2M context)
- [ ] Check anti-hallucination (no fabricated answers)

### 3. Performance Benchmarks 📊
- [ ] Response latency: Gemini vs GPT-5
- [ ] First token time (streaming)
- [ ] Cost per 1000 queries
- [ ] Context handling at scale

### 4. Edge Cases
- [ ] Empty search results → "I don't know" response
- [ ] Conflicting information in docs
- [ ] Very long documents (test 2M context limit)

## Rollback Plan

If Gemini doesn't perform well:

### Option 1: Feature Flag (Gradual Rollout)
```env
USE_GEMINI=false  # Switch back to GPT-5
```

### Option 2: Model Change
```typescript
// src/services/modelConfig.ts
chat: {
  model: "gpt-5",  // Back to OpenAI
  // ... rest stays same
}
```

### Zero Data Loss
- ✅ No database changes (embeddings unchanged)
- ✅ Simple configuration change
- ✅ No re-deployment of backend services

## Cost Analysis

### Estimated Costs (Per 1000 Queries)

**Current (GPT-5)**:
- Unknown (OpenAI hasn't published GPT-5 pricing)
- Estimated: $20-50/1000 queries

**New (Gemini 2.5 Pro)**:
- Input: ~$2-5/1000 queries
- Output: ~$8-15/1000 queries
- **Total: $10-20/1000 queries** (likely cheaper)

**Cost-Efficient Option (Gemini 2.5 Flash)**:
- Input: $0.10 per M tokens
- Output: $0.40 per M tokens
- **Total: $1-5/1000 queries** (5-10x cheaper)

**Recommendation**: Monitor first week, optimize later if needed.

## Preparing for Gemini 3

This migration positions SIAM perfectly for Gemini 3 (expected early 2026):

- ✅ Same `@ai-sdk/google` package
- ✅ Simple model string change: `"gemini-2.5-pro"` → `"gemini-3.0-pro"`
- ✅ Expected improvements:
  - Even better RAG synthesis
  - Faster streaming responses
  - Improved context retention
  - Better multi-turn conversations

## Success Metrics

After migration, we'll measure:

1. **RAG Quality**: Accuracy of responses vs search results
2. **User Satisfaction**: Conversation naturalness
3. **Performance**: Response latency ≤ GPT-5
4. **Cost**: Cost per 1000 queries vs GPT-5 baseline
5. **Context Handling**: Zero truncation errors with large result sets

**Target**: Match or exceed GPT-5 quality at same or lower cost.

## Next Steps

1. ✅ Implementation complete (code changes done)
2. 🔄 **User testing**: Try chat functionality
3. 🔄 **AOMA validation**: Test knowledge queries
4. 📊 **Performance benchmarks**: Compare metrics
5. 📝 **User feedback**: Gather quality assessments
6. 🚀 **Merge to main**: If tests pass
7. 🎯 **Production deployment**: After validation

## Notes on Fine-Tuning

**Not included in this migration** (optional future enhancement).

### When Fine-Tuning MIGHT Help
- Specific response formatting requirements
- Sony Music-specific terminology/jargon
- Consistent tone/style preferences
- Reducing hallucinations beyond prompt engineering

### Why We're Skipping It Now
- ✅ Gemini 2.5 Pro is already excellent at synthesis
- ✅ Knowledge is in vectors, not model weights (RAG architecture)
- ✅ System prompts can handle most formatting needs
- ✅ Fine-tuning adds complexity and maintenance burden

**Decision**: Test baseline Gemini 2.5 Pro first. Only consider fine-tuning if we see consistent issues that prompt engineering can't fix.

## References

- [Gemini 2.5 Pro Documentation](https://ai.google.dev/gemini-api/docs/models/gemini)
- [Vercel AI SDK - Google Provider](https://sdk.vercel.ai/providers/ai-sdk-providers/google)
- [GEMINI_ENV_SETUP.md](../GEMINI_ENV_SETUP.md) - Environment setup guide

---

**Implemented by**: AI Assistant (Claude)  
**Approved by**: Matt Carpenter  
**Migration Type**: Zero-downtime, reversible

