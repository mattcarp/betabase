# RLHF Fine-Tuning Architecture

## Overview

The Betabase implements a complete RLHF (Reinforcement Learning from Human Feedback) pipeline that transforms human feedback into training data for model fine-tuning. This system goes beyond simple HITL (Human-in-the-Loop) feedback collection to support actual model improvement.

## Architecture Layers

```
+------------------------------------------------------------------+
|                        UI Layer (Curate Tab)                      |
+------------------------------------------------------------------+
|  Feedback Queue  |  Training Data Review  |  Fine-Tuning Jobs    |
+------------------------------------------------------------------+
                              |
+------------------------------------------------------------------+
|                     Training Data Pipeline                        |
+------------------------------------------------------------------+
|  Preference Pairs  |  DPO Format  |  JSONL Export  |  Validation |
+------------------------------------------------------------------+
                              |
+------------------------------------------------------------------+
|                     Fine-Tuning Orchestration                     |
+------------------------------------------------------------------+
|  OpenAI API  |  Anthropic API  |  HuggingFace  |  Custom LoRA    |
+------------------------------------------------------------------+
                              |
+------------------------------------------------------------------+
|                     Model Registry & A/B Testing                  |
+------------------------------------------------------------------+
|  Version Control  |  Deployment  |  Comparison  |  Rollback      |
+------------------------------------------------------------------+
```

## Database Schema

### Core Tables

#### 1. `rlhf_feedback` (Existing)
Stores raw human feedback on AI responses.

```sql
- id: uuid (PK)
- session_id: text
- query: text
- response: text
- feedback_type: enum (thumbs_up, thumbs_down, rating, correction, detailed)
- feedback_value: jsonb
- curator_email: text
- organization: text
- created_at: timestamptz
```

#### 2. `training_datasets` (New)
Manages curated training datasets.

```sql
- id: uuid (PK)
- name: text (e.g., "AOMA Support Q4 2025")
- description: text
- dataset_type: enum (preference_pairs, instruction_tuning, dpo)
- status: enum (draft, curating, ready, exported, archived)
- feedback_ids: uuid[] (references rlhf_feedback)
- sample_count: integer
- quality_score: float (0-1)
- export_format: text (jsonl, parquet, openai, anthropic)
- export_url: text (S3/GCS URL)
- organization: text
- curator_email: text
- created_at: timestamptz
- updated_at: timestamptz
```

#### 3. `preference_pairs` (New)
Stores human preference comparisons for DPO/RLHF training.

```sql
- id: uuid (PK)
- dataset_id: uuid (FK to training_datasets)
- query: text (the user question)
- chosen_response: text (human-preferred)
- rejected_response: text (human-rejected)
- preference_strength: float (0-1, how strong the preference)
- context_documents: jsonb (RAG context used)
- annotator_email: text
- annotation_notes: text
- created_at: timestamptz
```

#### 4. `fine_tuning_jobs` (New)
Tracks fine-tuning job execution.

```sql
- id: uuid (PK)
- dataset_id: uuid (FK to training_datasets)
- provider: enum (openai, anthropic, huggingface, custom)
- base_model: text (e.g., "gpt-4o-mini", "claude-3-haiku")
- job_id: text (provider's job ID)
- status: enum (pending, validating, training, completed, failed, cancelled)
- hyperparameters: jsonb
- training_metrics: jsonb (loss curves, epochs, etc.)
- resulting_model_id: text
- cost_estimate: decimal
- actual_cost: decimal
- started_at: timestamptz
- completed_at: timestamptz
- error_message: text
- created_by: text
```

#### 5. `model_registry` (New)
Version control for fine-tuned models.

```sql
- id: uuid (PK)
- name: text (human-readable name)
- model_id: text (provider model ID)
- base_model: text
- fine_tuning_job_id: uuid (FK)
- version: text (semver)
- status: enum (testing, deployed, deprecated, archived)
- performance_metrics: jsonb (accuracy, latency, etc.)
- deployment_config: jsonb
- organization: text
- created_at: timestamptz
- deployed_at: timestamptz
```

#### 6. `ab_test_experiments` (New)
A/B testing between model versions.

```sql
- id: uuid (PK)
- name: text
- control_model_id: uuid (FK to model_registry)
- treatment_model_id: uuid (FK to model_registry)
- traffic_split: float (0-1, treatment percentage)
- status: enum (draft, running, paused, completed, cancelled)
- start_date: timestamptz
- end_date: timestamptz
- success_metrics: jsonb (what to measure)
- results: jsonb (statistical analysis)
- winner: enum (control, treatment, inconclusive)
- organization: text
```

## UI Components

### 1. Feedback Queue (Current)
- View pending feedback items
- Bulk approve/reject responses
- Add corrections and notes
- Tag feedback by topic

### 2. Training Data Curation (New)
```
+------------------------------------------+
|  Training Datasets                        |
+------------------------------------------+
| [+ New Dataset]  [Filter: status, type]  |
+------------------------------------------+
| Dataset Name        | Type    | Samples  |
|---------------------|---------|----------|
| AOMA Support Q4     | DPO     | 1,247    |
| Jira Triage v2      | Instruct| 892      |
| Knowledge Base      | Pref    | 2,103    |
+------------------------------------------+
```

### 3. Preference Pair Editor (New)
```
+------------------------------------------+
|  Create Preference Pair                   |
+------------------------------------------+
| Query:                                    |
| [How do I deploy to production?        ] |
+------------------------------------------+
| Chosen Response (Better):                 |
| [Multi-line editor with RAG context    ] |
+------------------------------------------+
| Rejected Response (Worse):                |
| [Multi-line editor with comparison     ] |
+------------------------------------------+
| Preference Strength: [===|======] 0.75   |
| Notes: [Optional annotation notes      ] |
+------------------------------------------+
| [Cancel]                    [Save Pair]  |
+------------------------------------------+
```

### 4. Fine-Tuning Dashboard (New)
```
+------------------------------------------+
|  Fine-Tuning Jobs                         |
+------------------------------------------+
| [+ Launch Job]  Provider: [OpenAI v]     |
+------------------------------------------+
| Job ID      | Model      | Status  | Cost|
|-------------|------------|---------|-----|
| ft-abc123   | gpt-4o-min | Running | $47 |
| ft-def456   | claude-hai | Complete| $23 |
+------------------------------------------+
|  Training Progress                        |
|  [=========>          ] 67% - Epoch 2/3  |
|  Loss: 0.342 | Learning Rate: 2e-5       |
+------------------------------------------+
```

### 5. Model Registry (New)
```
+------------------------------------------+
|  Model Registry                           |
+------------------------------------------+
| Name           | Version | Status        |
|----------------|---------|---------------|
| aoma-support   | 2.1.0   | [Deployed]    |
| aoma-support   | 2.0.0   | [Deprecated]  |
| jira-triage    | 1.0.0   | [Testing]     |
+------------------------------------------+
| [Deploy] [A/B Test] [Archive] [Rollback] |
+------------------------------------------+
```

### 6. A/B Testing Panel (New)
```
+------------------------------------------+
|  A/B Experiment: Support Model v2 vs v3   |
+------------------------------------------+
| Status: Running | Traffic: 50/50          |
| Started: Nov 20 | Samples: 1,247          |
+------------------------------------------+
|        Control (v2)  |  Treatment (v3)    |
|---------------------|---------------------|
| Helpfulness: 3.8/5  |  4.2/5 (+10.5%)   |
| Accuracy:    87%    |  91% (+4.6%)       |
| Latency:     1.2s   |  1.1s (-8.3%)      |
+------------------------------------------+
| Statistical Significance: p=0.023         |
| Recommendation: Deploy Treatment          |
+------------------------------------------+
| [End Experiment] [Extend] [Full Deploy]   |
+------------------------------------------+
```

## Training Data Formats

### OpenAI Fine-Tuning Format (JSONL)
```json
{"messages": [
  {"role": "system", "content": "You are an AOMA support assistant."},
  {"role": "user", "content": "How do I check deployment status?"},
  {"role": "assistant", "content": "Navigate to Deployments > Status..."}
]}
```

### DPO (Direct Preference Optimization) Format
```json
{
  "prompt": "How do I check deployment status?",
  "chosen": "Navigate to Deployments > Status panel...",
  "rejected": "Click on the deployments tab."
}
```

### Anthropic Fine-Tuning Format
```json
{
  "input": "Human: How do I check deployment status?\n\nAssistant:",
  "output": "Navigate to Deployments > Status panel..."
}
```

## API Endpoints

### Training Dataset Management
```
POST   /api/training-datasets        Create new dataset
GET    /api/training-datasets        List datasets
GET    /api/training-datasets/:id    Get dataset details
PATCH  /api/training-datasets/:id    Update dataset
DELETE /api/training-datasets/:id    Archive dataset
POST   /api/training-datasets/:id/export  Export to format
```

### Preference Pairs
```
POST   /api/preference-pairs         Create preference pair
GET    /api/preference-pairs         List pairs (with filters)
PATCH  /api/preference-pairs/:id     Update pair
DELETE /api/preference-pairs/:id     Delete pair
POST   /api/preference-pairs/bulk    Bulk create from feedback
```

### Fine-Tuning Jobs
```
POST   /api/fine-tuning/jobs         Launch fine-tuning job
GET    /api/fine-tuning/jobs         List jobs
GET    /api/fine-tuning/jobs/:id     Get job status
POST   /api/fine-tuning/jobs/:id/cancel  Cancel running job
```

### Model Registry
```
GET    /api/models                   List models
POST   /api/models/:id/deploy        Deploy model
POST   /api/models/:id/rollback      Rollback to previous
POST   /api/models/ab-test           Start A/B test
```

## Workflow

### 1. Collect Feedback
Users interact with the AI chat, providing thumbs up/down, ratings, and corrections.

### 2. Review & Curate
Curators review feedback in the queue, approve high-quality examples, and create preference pairs.

### 3. Build Training Dataset
- Select approved feedback items
- Create preference pairs (chosen vs rejected responses)
- Validate dataset quality
- Export to target format

### 4. Launch Fine-Tuning
- Select base model (GPT-4, Claude, etc.)
- Configure hyperparameters
- Submit to provider API
- Monitor training progress

### 5. Validate & Deploy
- Evaluate fine-tuned model on test set
- Run A/B test against current model
- Deploy if metrics improve
- Monitor production performance

### 6. Iterate
Collect new feedback on the fine-tuned model and repeat the cycle.

## Integration Points

### OpenAI Fine-Tuning API
```typescript
const job = await openai.fineTuning.jobs.create({
  training_file: "file-abc123",
  model: "gpt-4o-mini-2024-07-18",
  hyperparameters: { n_epochs: 3 }
});
```

### Anthropic Fine-Tuning (via AWS Bedrock)
```typescript
const command = new CreateModelCustomizationJobCommand({
  baseModelIdentifier: "anthropic.claude-3-haiku-20240307-v1:0",
  customizationType: "FINE_TUNING",
  trainingDataConfig: { s3Uri: "s3://bucket/training.jsonl" }
});
```

### HuggingFace (via Transformers)
```python
from transformers import Trainer, TrainingArguments
trainer = Trainer(
    model=model,
    args=TrainingArguments(output_dir="./results"),
    train_dataset=dataset
)
```

## Security Considerations

1. **Data Privacy**: Training data may contain sensitive information. Implement PII detection and masking.
2. **Access Control**: Only authorized curators can create training datasets.
3. **Audit Trail**: Log all training jobs and model deployments.
4. **Cost Controls**: Set budget limits on fine-tuning jobs.
5. **Model Security**: Validate fine-tuned models don't leak training data.

## Metrics & Monitoring

### Training Metrics
- Loss curves over epochs
- Validation accuracy
- Token efficiency
- Training time and cost

### Production Metrics
- Response quality scores
- User satisfaction (from continued feedback)
- Latency impact
- Error rates

### Business Metrics
- Tickets deflected
- Time to resolution
- User adoption
- Cost per interaction

## Roadmap

### Phase 1: Foundation (Current)
- [x] Basic feedback collection
- [x] Feedback queue UI
- [x] Stats dashboard

### Phase 2: Training Data (Next)
- [ ] Training datasets table
- [ ] Preference pair editor
- [ ] JSONL export

### Phase 3: Fine-Tuning Integration
- [ ] OpenAI fine-tuning API
- [ ] Job monitoring UI
- [ ] Model registry

### Phase 4: Advanced
- [ ] A/B testing framework
- [ ] Automated quality validation
- [ ] Custom LoRA training
- [ ] Multi-provider orchestration
