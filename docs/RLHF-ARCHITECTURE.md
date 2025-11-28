# SIAM RLHF Architecture - Honest Implementation Guide

## What RLHF Actually Is

**Reinforcement Learning from Human Feedback (RLHF)** is a three-stage process:

```
Stage 1: Supervised Fine-Tuning (SFT)
  - Train base model on high-quality examples

Stage 2: Reward Model Training
  - Collect human preferences (A vs B comparisons)
  - Train a model to predict human preferences

Stage 3: Policy Optimization (PPO/DPO)
  - Use reward model to fine-tune the LLM
  - Model learns to generate responses humans prefer
```

**Reality check**: You cannot do Stage 3 with GPT-4o or Gemini - those are API-only models you can't fine-tune with RL. But you CAN:
- Collect the data for all stages
- Fine-tune open models (Llama, Mistral) using DPO
- Use the data to improve RAG retrieval

---

## What SIAM Implements

### Current State: Human Feedback Collection Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SIAM RLHF Data Pipeline                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Query ────> RAG Retrieval ────> LLM (GPT-4o/Gemini)          │
│       │                │                      │                     │
│       │                │                      v                     │
│       │                │              AI Response                   │
│       │                │                      │                     │
│       │                │                      v                     │
│       │                │         ┌────────────────────────┐        │
│       │                │         │   User Feedback        │        │
│       │                │         │   - Thumbs up/down     │        │
│       │                │         │   - Star rating        │        │
│       │                │         │   - "What should it    │        │
│       │                │         │     have said?"        │        │
│       │                │         └────────────────────────┘        │
│       │                │                      │                     │
│       v                v                      v                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  rlhf_feedback Table                        │   │
│  │  - query (user's question)                                  │   │
│  │  - response (AI's answer)                                   │   │
│  │  - retrieved_contexts (docs used)                           │   │
│  │  - rating (1-5 stars)                                       │   │
│  │  - thumbs_up (boolean)                                      │   │
│  │  - correction (what it SHOULD have said) <-- KEY FOR DPO    │   │
│  │  - curator_approved (boolean)                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              v                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              preference_pairs Table                         │   │
│  │  - prompt (original query)                                  │   │
│  │  - chosen (preferred response)                              │   │
│  │  - rejected (original bad response)                         │   │
│  │  - source (user_correction | curator_edit | a_b_test)       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              v                                      │
│              ┌───────────────────────────────┐                     │
│              │   DPO Training Export         │                     │
│              │   (JSONL format for           │                     │
│              │   fine-tuning Llama/Mistral)  │                     │
│              └───────────────────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## The Key Innovation: Preference Pairs

The **critical** piece that makes this real RLHF (not just feedback collection) is:

### When User Gives Negative Feedback:

1. User clicks thumbs down
2. System prompts: "What should the response have been?"
3. User provides correction OR curator provides correction later
4. This creates a **preference pair**:
   ```json
   {
     "prompt": "How do I authenticate with AOMA?",
     "chosen": "Use OAuth 2.0 with the /auth/token endpoint...",  // correction
     "rejected": "AOMA uses JWT tokens for authentication..."    // original bad response
   }
   ```

### Why This Matters:

- **DPO (Direct Preference Optimization)** trains models directly on these pairs
- No reward model needed - much simpler than classic RLHF
- Can fine-tune Llama 3.1 70B or Mistral in a few hours with ~1000 pairs
- The fine-tuned model learns AOMA-specific knowledge and style

---

## Database Schema

### Table: rlhf_feedback
```sql
CREATE TABLE rlhf_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  conversation_id TEXT,

  -- The interaction
  query TEXT NOT NULL,           -- User's question
  response TEXT NOT NULL,        -- AI's response
  retrieved_contexts JSONB,      -- RAG documents used

  -- Feedback signals
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  thumbs_up BOOLEAN,
  feedback_text TEXT,            -- Free-form feedback
  correction TEXT,               -- CRITICAL: What it SHOULD have said

  -- Document-level feedback
  documents_marked JSONB,        -- Which retrieved docs were helpful

  -- Metadata
  model_used TEXT,
  curator_email TEXT,
  curator_approved BOOLEAN DEFAULT FALSE,
  organization TEXT,
  division TEXT,
  app_under_test TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: preference_pairs (for DPO training)
```sql
CREATE TABLE preference_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The preference pair
  prompt TEXT NOT NULL,          -- Original query
  chosen TEXT NOT NULL,          -- Preferred response (correction)
  rejected TEXT NOT NULL,        -- Original response (bad)

  -- Source tracking
  source_type TEXT NOT NULL,     -- 'user_correction' | 'curator_edit' | 'a_b_test'
  source_feedback_id UUID REFERENCES rlhf_feedback(id),

  -- Quality signals
  confidence FLOAT,              -- How confident are we this is a good pair
  curator_verified BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  exported_at TIMESTAMPTZ        -- When exported for training
);
```

---

## Export Format (DPO Training)

### JSONL Format (Standard for fine-tuning):
```jsonl
{"prompt": "What is AOMA?", "chosen": "AOMA (Asset and Offering Management Application) is Sony Music's enterprise platform for...", "rejected": "AOMA is a system that manages various things..."}
{"prompt": "How do I create a new asset?", "chosen": "To create a new asset in AOMA:\n1. Navigate to Assets > New\n2. Select asset type...", "rejected": "You can create assets through the interface."}
```

### Export Script:
```typescript
// Export preference pairs for DPO training
async function exportDPOTrainingData() {
  const { data: pairs } = await supabase
    .from('preference_pairs')
    .select('prompt, chosen, rejected')
    .eq('curator_verified', true)
    .is('exported_at', null);

  // Write JSONL
  const jsonl = pairs.map(p => JSON.stringify(p)).join('\n');

  // Mark as exported
  await supabase
    .from('preference_pairs')
    .update({ exported_at: new Date().toISOString() })
    .in('id', pairs.map(p => p.id));

  return jsonl;
}
```

---

## Metrics Dashboard

| Metric | Description | Target |
|--------|-------------|--------|
| Feedback Rate | % of responses receiving feedback | >20% |
| Positive Rate | % thumbs up | >85% |
| Correction Rate | % negative feedback with corrections | >50% |
| Preference Pairs | Total collected | 500+ |
| Curator Verified | % pairs verified by curator | >90% |
| Export Ready | Pairs ready for training | 100+ |

---

## The Honest Demo Pitch

### What you CAN say:

> "SIAM implements a complete RLHF data pipeline. We collect user feedback,
> generate preference pairs from corrections, and export training data in
> standard DPO format. This data can be used to fine-tune domain-specific
> models that understand AOMA better than generic LLMs."

### What you SHOULD NOT say:

> "Our model learns from feedback in real-time"
> (It doesn't - we collect data for batch training)

> "We use reinforcement learning"
> (We use DPO, which is simpler and more stable)

---

## Implementation Phases

### Phase 1: Feedback Collection (DONE)
- Thumbs up/down on responses
- Star ratings
- Stored in rlhf_feedback table

### Phase 2: Preference Pair Generation (IN PROGRESS)
- Prompt for corrections on negative feedback
- Curator correction interface
- preference_pairs table

### Phase 3: Export Pipeline (TODO)
- JSONL export for DPO training
- Curator verification workflow
- Training data quality metrics

### Phase 4: Model Fine-tuning (FUTURE)
- Fine-tune Llama 3.1 or Mistral on preference pairs
- A/B test fine-tuned model vs base model
- Deploy fine-tuned model for AOMA-specific queries

---

## References

- [DPO Paper](https://arxiv.org/abs/2305.18290) - Direct Preference Optimization
- [RLHF Overview](https://huggingface.co/blog/rlhf) - Hugging Face explanation
- [Llama Fine-tuning](https://github.com/meta-llama/llama-recipes) - Meta's recipes
