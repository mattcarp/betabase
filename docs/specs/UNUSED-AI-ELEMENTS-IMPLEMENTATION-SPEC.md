# Unused AI Elements Implementation Spec

**Status:** Draft - Awaiting Approval
**Created:** 2026-01-03
**Author:** Matt Carpenter

## Overview

This spec covers implementing 9 Vercel AI Elements components that are currently installed but not actively used in the SIAM chat interface. The goal is to replace the basic `Loader2` spinner with richer, more informative UI feedback.

---

## Components to Implement

| # | Component | Purpose | Priority |
|---|-----------|---------|----------|
| 1 | `chain-of-thought` | Replace spinner with step-by-step thinking display | **HIGH** |
| 2 | `shimmer` | Animated text loading effect during streaming | **HIGH** |
| 3 | `confirmation` | Tool execution approval dialogs | MEDIUM |
| 4 | `context` | Token/context window usage visualization | MEDIUM |
| 5 | `checkpoint` | Mark conversation history points | LOW |
| 6 | `plan` | Display AI execution plans | MEDIUM |
| 7 | `queue` | Message queue / task list display | MEDIUM |
| 8 | `model-selector` | Searchable model picker (already have basic selector) | LOW |
| 9 | `artifact` | Generated code/document container | MEDIUM |

---

## 1. Chain of Thought (Priority: HIGH)

### Current State
Currently using `Loader2` spinner with "Searching AOMA knowledge base..." text:
```tsx
{(isLoading || manualLoading || isProcessing) && !hasStartedStreaming && (
  <motion.div>
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>Searching AOMA knowledge base...</span>
  </motion.div>
)}
```

### Target State
Replace with `ChainOfThought` component showing real-time steps:
```tsx
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSpinner,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "../ai-elements/chain-of-thought";
```

### Component Parts Available
- `ChainOfThought` - Container with collapsible state
- `ChainOfThoughtHeader` - Clickable header with lightbulb icon
- `ChainOfThoughtContent` - Animated collapsible content
- `ChainOfThoughtStep` - Individual step with status (complete/active/pending)
- `ChainOfThoughtSearchResults` - Badge container for search results
- `ChainOfThoughtSearchResult` - Individual result badge
- `ChainOfThoughtImage` - Image display with caption
- `ChainOfThoughtSpinner` - Elegant pulsing spinner with message

### Implementation Plan

1. **Create state tracking for thinking steps:**
```tsx
interface ThinkingStep {
  id: string;
  label: string;
  description?: string;
  status: 'complete' | 'active' | 'pending';
  icon?: LucideIcon;
  searchResults?: string[];
}

const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
```

2. **Update steps based on SSE events from API:**
   - When query starts: "Understanding your question..."
   - When searching: "Searching knowledge base..."
   - When retrieving: "Retrieving relevant documents..."
   - When synthesizing: "Synthesizing response..."

3. **Replace loading indicator in `ai-sdk-chat-panel.tsx` (line ~2128):**
```tsx
{(isLoading || manualLoading || isProcessing) && !hasStartedStreaming && (
  <ChainOfThought defaultOpen={true}>
    <ChainOfThoughtHeader>
      Thinking... ({loadingSeconds}s)
    </ChainOfThoughtHeader>
    <ChainOfThoughtContent>
      {thinkingSteps.map((step, idx) => (
        <ChainOfThoughtStep
          key={step.id}
          label={step.label}
          description={step.description}
          status={step.status}
          icon={step.icon}
        >
          {step.searchResults && (
            <ChainOfThoughtSearchResults>
              {step.searchResults.map((result, i) => (
                <ChainOfThoughtSearchResult key={i}>
                  {result}
                </ChainOfThoughtSearchResult>
              ))}
            </ChainOfThoughtSearchResults>
          )}
        </ChainOfThoughtStep>
      ))}
      {thinkingSteps.length === 0 && (
        <ChainOfThoughtSpinner message="Initializing..." />
      )}
    </ChainOfThoughtContent>
  </ChainOfThought>
)}
```

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Main implementation
- `src/app/api/chat/route.ts` - Add SSE events for thinking steps

---

## 2. Shimmer (Priority: HIGH)

### Current State
Using static "Searching..." text during loading.

### Target State
Animated shimmer text effect during streaming for:
- Loading states
- Plan titles (already integrated in `plan.tsx`)
- Streaming text placeholders

### Component API
```tsx
import { Shimmer } from "../ai-elements/shimmer";

<Shimmer duration={2} spread={2}>
  Generating response...
</Shimmer>
```

### Implementation Plan

1. **Replace static loading text in `ai-sdk-chat-panel.tsx`:**
```tsx
<Shimmer as="span" duration={2.5}>
  {loadingSeconds < 3 ? "Understanding your question..." :
   loadingSeconds < 6 ? "Searching knowledge base..." :
   loadingSeconds < 10 ? "Synthesizing response..." :
   "Still working..."}
</Shimmer>
```

2. **Use in Response component during streaming:**
```tsx
{isStreaming && !content && (
  <Shimmer>Generating response...</Shimmer>
)}
```

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx`
- `src/components/ai-elements/response.tsx` (optional enhancement)

---

## 3. Confirmation (Priority: MEDIUM)

### Purpose
Display approval dialogs when AI wants to execute tools that require user consent.

### Component API
```tsx
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "../ai-elements/confirmation";
```

### Implementation Plan

1. **Integrate with tool calls that need approval:**
```tsx
<Confirmation approval={toolApproval} state={toolState}>
  <ConfirmationTitle>
    The assistant wants to search external databases
  </ConfirmationTitle>
  <ConfirmationRequest>
    <ConfirmationActions>
      <ConfirmationAction onClick={handleReject} variant="outline">
        Deny
      </ConfirmationAction>
      <ConfirmationAction onClick={handleApprove}>
        Allow
      </ConfirmationAction>
    </ConfirmationActions>
  </ConfirmationRequest>
  <ConfirmationAccepted>
    Search approved - retrieving results...
  </ConfirmationAccepted>
  <ConfirmationRejected>
    Search denied by user
  </ConfirmationRejected>
</Confirmation>
```

2. **Note:** Requires AI SDK v6 for `approval-requested` state. Currently uses `@ts-expect-error` comments.

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Add to tool rendering
- `src/components/ai/enhanced-message-thread.tsx` - Tool invocation display

---

## 4. Context (Priority: MEDIUM)

### Purpose
Show token usage visualization - helps users understand context window consumption.

### Component API
```tsx
import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "../ai-elements/context";
```

### Implementation Plan

1. **Add to chat footer/toolbar:**
```tsx
<Context
  usedTokens={tokenUsage.total}
  maxOutputTokens={128000} // Gemini context limit
  usage={lastMessageUsage}
  modelId={selectedModel}
>
  <ContextTrigger />
  <ContextContent>
    <ContextContentHeader />
    <ContextContentBody>
      <ContextInputUsage />
      <ContextOutputUsage />
      <ContextReasoningUsage />
      <ContextCacheUsage />
    </ContextContentBody>
    <ContextContentFooter />
  </ContextContent>
</Context>
```

2. **Track usage from API responses:**
```tsx
const [tokenUsage, setTokenUsage] = useState({
  inputTokens: 0,
  outputTokens: 0,
  total: 0,
});

// Update from useChat's data or onFinish callback
```

### Dependencies
- `tokenlens` package (already imported in context.tsx)

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Add to PromptInputToolbar

---

## 5. Checkpoint (Priority: LOW)

### Purpose
Mark points in conversation history for easy reference/navigation.

### Component API
```tsx
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "../ai-elements/checkpoint";
```

### Implementation Plan

1. **Add between conversation turns or on user action:**
```tsx
<Checkpoint>
  <CheckpointIcon />
  <CheckpointTrigger tooltip="Jump to this point">
    Saved checkpoint
  </CheckpointTrigger>
</Checkpoint>
```

2. **Allow users to manually create checkpoints:**
- Add button in message actions
- Store checkpoint references for navigation

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Message rendering

---

## 6. Plan (Priority: MEDIUM)

### Purpose
Display AI-generated execution plans as collapsible cards.

### Component API
```tsx
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanAction,
  PlanContent,
  PlanFooter,
  PlanTrigger,
} from "../ai-elements/plan";
```

### Implementation Plan

1. **Show when AI generates a multi-step plan:**
```tsx
<Plan isStreaming={isStreaming} defaultOpen>
  <PlanHeader>
    <div>
      <PlanTitle>Research Implementation Plan</PlanTitle>
      <PlanDescription>3 steps to complete your request</PlanDescription>
    </div>
    <PlanAction>
      <PlanTrigger />
    </PlanAction>
  </PlanHeader>
  <PlanContent>
    {/* Plan steps here */}
  </PlanContent>
  <PlanFooter>
    <Button size="sm">Execute Plan</Button>
  </PlanFooter>
</Plan>
```

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Add to response rendering

---

## 7. Queue (Priority: MEDIUM)

### Purpose
Display message queue, pending tasks, or todo items.

### Component API
```tsx
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
  QueueItemDescription,
  QueueItemActions,
  QueueItemAction,
} from "../ai-elements/queue";
```

### Implementation Plan

1. **Show pending operations during complex queries:**
```tsx
<Queue>
  <QueueSection>
    <QueueSectionTrigger>
      <QueueSectionLabel
        icon={<Clock className="h-4 w-4" />}
        count={3}
        label="pending tasks"
      />
    </QueueSectionTrigger>
    <QueueSectionContent>
      <QueueList>
        <QueueItem>
          <QueueItemIndicator />
          <QueueItemContent>Search Jira tickets</QueueItemContent>
        </QueueItem>
        <QueueItem>
          <QueueItemIndicator completed />
          <QueueItemContent completed>Query Wiki</QueueItemContent>
        </QueueItem>
      </QueueList>
    </QueueSectionContent>
  </QueueSection>
</Queue>
```

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Loading state section

---

## 8. Model Selector (Priority: LOW)

### Current State
Already have a working model selector using `PromptInputModelSelect`.

### Target State
Could optionally replace with searchable `model-selector` component for more models.

### Note
Current implementation is sufficient for Google-only models. Skip unless expanding to more providers.

---

## 9. Artifact (Priority: MEDIUM)

### Purpose
Container for generated content like code, documents, or other outputs.

### Component API
```tsx
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactClose,
  ArtifactContent,
} from "../ai-elements/artifact";
```

### Implementation Plan

1. **Wrap generated code blocks or documents:**
```tsx
<Artifact>
  <ArtifactHeader>
    <div>
      <ArtifactTitle>Generated SQL Query</ArtifactTitle>
      <ArtifactDescription>Based on your schema</ArtifactDescription>
    </div>
    <ArtifactActions>
      <ArtifactAction icon={Copy} tooltip="Copy to clipboard" />
      <ArtifactAction icon={Download} tooltip="Download" />
      <ArtifactClose onClick={onClose} />
    </ArtifactActions>
  </ArtifactHeader>
  <ArtifactContent>
    <CodeBlock language="sql">{generatedCode}</CodeBlock>
  </ArtifactContent>
</Artifact>
```

2. **Use for:**
   - Generated code blocks
   - Mermaid diagrams
   - Structured data outputs
   - Document previews

### Files to Modify
- `src/components/ai/ai-sdk-chat-panel.tsx` - Code block rendering
- `src/components/ai-elements/response.tsx` - Wrap code in artifacts

---

## Playwright Test Spec

### Test File: `tests/e2e/ai-elements-implementation.spec.ts`

```typescript
import { test, expect } from '../fixtures/base-test';

test.describe('AI Elements Implementation', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    // Wait for chat to be ready
    await expect(authenticatedPage.getByRole('textbox', { name: /message/i })).toBeVisible();
  });

  test.describe('Chain of Thought', () => {
    test('shows thinking steps during query processing', async ({ authenticatedPage }) => {
      // Submit a query
      await authenticatedPage.getByRole('textbox').fill('What is AOMA?');
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Verify chain of thought appears (not just spinner)
      await expect(authenticatedPage.locator('[data-slot="chain-of-thought"]'))
        .toBeVisible({ timeout: 2000 });

      // Should show at least one step
      await expect(authenticatedPage.getByText(/understanding|searching|retrieving/i))
        .toBeVisible();

      // Header should be collapsible
      const header = authenticatedPage.locator('[class*="ChainOfThoughtHeader"]');
      await expect(header).toBeVisible();
    });

    test('chain of thought is collapsible', async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole('textbox').fill('Tell me about tickets');
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Wait for chain of thought
      const cot = authenticatedPage.locator('[data-slot="chain-of-thought"]');
      await expect(cot).toBeVisible({ timeout: 3000 });

      // Click to collapse
      await cot.locator('button').first().click();

      // Content should be hidden
      await expect(cot.locator('[data-state="closed"]')).toBeVisible();
    });
  });

  test.describe('Shimmer Effect', () => {
    test('shows shimmer animation during loading', async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole('textbox').fill('What is AOMA?');
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Look for shimmer text animation
      const shimmer = authenticatedPage.locator('[class*="shimmer"], [class*="bg-clip-text"]');
      await expect(shimmer).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Context Window Visualization', () => {
    test('shows token usage in toolbar', async ({ authenticatedPage }) => {
      // Context trigger should be visible
      const contextTrigger = authenticatedPage.locator('[aria-label="Model context usage"]');

      // Submit a query first
      await authenticatedPage.getByRole('textbox').fill('Hello');
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Wait for response
      await expect(authenticatedPage.getByText(/hello/i)).toBeVisible({ timeout: 10000 });

      // Context should show percentage
      await expect(contextTrigger).toBeVisible();
    });

    test('context hover card shows breakdown', async ({ authenticatedPage }) => {
      // Hover over context trigger
      await authenticatedPage.locator('[aria-label="Model context usage"]').hover();

      // Should show input/output breakdown
      await expect(authenticatedPage.getByText(/input|output/i)).toBeVisible();
    });
  });

  test.describe('Queue Display', () => {
    test('shows task queue during multi-step operations', async ({ authenticatedPage }) => {
      // Complex query that triggers multiple steps
      await authenticatedPage.getByRole('textbox').fill(
        'Search for tickets about authentication and summarize the findings'
      );
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Queue should appear showing pending tasks
      const queue = authenticatedPage.locator('[class*="Queue"]');
      // May not always appear depending on query complexity
    });
  });

  test.describe('Artifact Container', () => {
    test('wraps generated code in artifact container', async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole('textbox').fill(
        'Write a SQL query to find all users'
      );
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Wait for response with code
      await expect(authenticatedPage.locator('pre code')).toBeVisible({ timeout: 15000 });

      // Code should be wrapped in artifact
      const artifact = authenticatedPage.locator('[class*="Artifact"]');
      await expect(artifact).toBeVisible();

      // Should have copy action
      await expect(artifact.getByRole('button', { name: /copy/i })).toBeVisible();
    });
  });

  test.describe('Plan Display', () => {
    test('shows execution plan for complex requests', async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole('textbox').fill(
        'Create a step-by-step plan to migrate our database'
      );
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Plan component may appear for planning-type queries
      const plan = authenticatedPage.locator('[data-slot="plan"]');
      // This is dependent on AI response including a plan
    });
  });

  test.describe('No Loader2 Spinner Regression', () => {
    test('does NOT show basic Loader2 spinner during loading', async ({ authenticatedPage }) => {
      await authenticatedPage.getByRole('textbox').fill('What is AOMA?');
      await authenticatedPage.getByRole('button', { name: /send/i }).click();

      // Should NOT see raw Loader2 with "animate-spin" as the only loading indicator
      // Chain of thought or shimmer should be visible instead
      const rawSpinner = authenticatedPage.locator('.animate-spin').filter({
        has: authenticatedPage.locator(':not([data-slot="chain-of-thought"] *)'),
      });

      // Give time for chain of thought to appear
      await authenticatedPage.waitForTimeout(500);

      // Either chain of thought or shimmer should be visible
      const cot = authenticatedPage.locator('[data-slot="chain-of-thought"]');
      const shimmer = authenticatedPage.locator('[class*="shimmer"]');

      const hasEnhancedLoading = await cot.isVisible() || await shimmer.isVisible();
      expect(hasEnhancedLoading).toBe(true);
    });
  });
});
```

---

## Implementation Order

1. **Phase 1 (HIGH priority):**
   - Chain of Thought - Replace spinner
   - Shimmer - Add to loading states

2. **Phase 2 (MEDIUM priority):**
   - Context - Token visualization
   - Artifact - Code block wrapper
   - Queue - Task display
   - Plan - Execution plans

3. **Phase 3 (LOW priority):**
   - Confirmation - Tool approval (needs SDK v6)
   - Checkpoint - History markers
   - Model Selector - Keep current implementation

---

## Success Criteria

- [ ] No `Loader2` spinner visible as primary loading indicator
- [ ] Chain of Thought shows step-by-step progress
- [ ] Shimmer effect visible on loading text
- [ ] Token usage visible and accurate
- [ ] All Playwright tests pass
- [ ] No console errors related to AI Elements
- [ ] Streaming still works correctly

---

---

## EXPERIMENTAL: React Flow Workflow Components

### Overview

These 7 components require `@xyflow/react` as a dependency. We're implementing **two use cases experimentally** to evaluate value:

| Use Case | Status | Components Used |
|----------|--------|-----------------|
| System Diagrams | **EXPERIMENTAL** | canvas, node, edge, controls |
| Agent Execution Visualizer | **EXPERIMENTAL** | canvas, node, edge, connection, panel |
| Pipeline Builders | OUT OF SCOPE | - |
| Workflow Automation | OUT OF SCOPE | - |

### Dependencies Required

```bash
npm install @xyflow/react
```

### Components to Install

```bash
npx shadcn@latest add https://registry.ai-sdk.dev/canvas.json
npx shadcn@latest add https://registry.ai-sdk.dev/node.json
npx shadcn@latest add https://registry.ai-sdk.dev/edge.json
npx shadcn@latest add https://registry.ai-sdk.dev/connection.json
npx shadcn@latest add https://registry.ai-sdk.dev/controls.json
npx shadcn@latest add https://registry.ai-sdk.dev/panel.json
npx shadcn@latest add https://registry.ai-sdk.dev/toolbar.json
```

---

## EXPERIMENTAL: System Diagrams

### Purpose
Visualize system architecture, data flows, or component relationships as interactive node graphs.

### Use Case
When AI generates a system description or architecture explanation, render it as an interactive diagram the user can explore.

### Implementation Concept

```tsx
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from '../ai-elements/canvas';
import { Node } from '../ai-elements/node';
import { Edge } from '../ai-elements/edge';
import { Controls } from '../ai-elements/controls';

interface SystemNode {
  id: string;
  label: string;
  type: 'service' | 'database' | 'api' | 'user';
  position: { x: number; y: number };
}

interface SystemEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

function SystemDiagram({ nodes, edges }: { nodes: SystemNode[]; edges: SystemEdge[] }) {
  return (
    <ReactFlowProvider>
      <div className="h-[400px] w-full border rounded-lg">
        <Canvas
          nodes={nodes.map(n => ({
            id: n.id,
            position: n.position,
            data: { label: n.label, type: n.type },
            type: 'systemNode',
          }))}
          edges={edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
          }))}
          nodeTypes={{ systemNode: SystemNodeComponent }}
        >
          <Controls />
        </Canvas>
      </div>
    </ReactFlowProvider>
  );
}

function SystemNodeComponent({ data }: { data: { label: string; type: string } }) {
  const iconMap = {
    service: <Server className="h-4 w-4" />,
    database: <Database className="h-4 w-4" />,
    api: <Globe className="h-4 w-4" />,
    user: <User className="h-4 w-4" />,
  };

  return (
    <Node>
      <div className="flex items-center gap-2 p-3">
        {iconMap[data.type]}
        <span>{data.label}</span>
      </div>
    </Node>
  );
}
```

### Trigger Conditions
Show system diagram when:
- User asks "How does X work?" about a system
- AI response contains architecture/flow descriptions
- User explicitly requests a diagram

### Evaluation Criteria
- [ ] Does it add clarity over text/Mermaid?
- [ ] Is the interactivity (pan/zoom) useful?
- [ ] Performance acceptable with 10+ nodes?
- [ ] Worth the ~50KB bundle size increase?

---

## EXPERIMENTAL: Agent Execution Visualizer

### Purpose
Show real-time visualization of multi-step agent execution - which tools are being called, data flow between steps, and current progress.

### Use Case
During complex queries that involve multiple tool calls (search Jira, search Wiki, synthesize), show the execution flow visually.

### Implementation Concept

```tsx
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from '../ai-elements/canvas';
import { Node } from '../ai-elements/node';
import { Edge } from '../ai-elements/edge';
import { Connection } from '../ai-elements/connection';
import { Panel } from '../ai-elements/panel';

interface ExecutionStep {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  input?: any;
  output?: any;
  duration?: number;
}

function AgentExecutionVisualizer({ steps }: { steps: ExecutionStep[] }) {
  const nodes = steps.map((step, idx) => ({
    id: step.id,
    position: { x: 200, y: idx * 100 },
    data: step,
    type: 'executionNode',
  }));

  const edges = steps.slice(1).map((step, idx) => ({
    id: `e-${idx}`,
    source: steps[idx].id,
    target: step.id,
    animated: steps[idx].status === 'running',
  }));

  return (
    <ReactFlowProvider>
      <div className="h-[300px] w-full border rounded-lg bg-muted/30">
        <Canvas nodes={nodes} edges={edges} nodeTypes={{ executionNode: ExecutionNode }}>
          <Panel position="top-right">
            <div className="bg-background/80 backdrop-blur-sm p-2 rounded text-xs">
              {steps.filter(s => s.status === 'complete').length} / {steps.length} complete
            </div>
          </Panel>
        </Canvas>
      </div>
    </ReactFlowProvider>
  );
}

function ExecutionNode({ data }: { data: ExecutionStep }) {
  const statusColors = {
    pending: 'border-muted-foreground/30',
    running: 'border-blue-500 animate-pulse',
    complete: 'border-green-500',
    error: 'border-red-500',
  };

  return (
    <Node className={cn('border-2', statusColors[data.status])}>
      <div className="p-3 min-w-[150px]">
        <div className="flex items-center gap-2">
          {data.status === 'running' && <Loader2 className="h-3 w-3 animate-spin" />}
          {data.status === 'complete' && <CheckCircle className="h-3 w-3 text-green-500" />}
          {data.status === 'error' && <XCircle className="h-3 w-3 text-red-500" />}
          <span className="font-medium text-sm">{data.tool}</span>
        </div>
        {data.duration && (
          <div className="text-xs text-muted-foreground mt-1">
            {data.duration}ms
          </div>
        )}
      </div>
    </Node>
  );
}
```

### Integration with Chain of Thought
Could replace or complement the Chain of Thought component:
- Simple queries: Use Chain of Thought (text-based)
- Complex multi-tool queries: Use Agent Execution Visualizer (visual)

### Trigger Conditions
Show visualizer when:
- Query triggers 3+ tool calls
- User has "advanced mode" enabled
- Explicitly requested via settings

### Evaluation Criteria
- [ ] More informative than Chain of Thought?
- [ ] Does animation help show progress?
- [ ] Useful for debugging/understanding?
- [ ] Too complex for simple queries?

---

## OUT OF SCOPE

### Pipeline Builders
Building visual RAG pipeline editors where users drag-and-drop to configure data sources, retrieval strategies, and output formats. **Not implementing** - this is a product feature, not a chat enhancement.

### Workflow Automation
Zapier/n8n-style workflow builders for connecting triggers to actions. **Not implementing** - out of scope for SIAM's current focus.

---

## Playwright Tests for Experimental Features

```typescript
test.describe('EXPERIMENTAL: System Diagrams', () => {
  test('renders interactive system diagram', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('textbox').fill(
      'Show me how the AOMA architecture works'
    );
    await authenticatedPage.getByRole('button', { name: /send/i }).click();

    // Wait for response
    await authenticatedPage.waitForTimeout(5000);

    // Look for React Flow canvas
    const canvas = authenticatedPage.locator('.react-flow');

    if (await canvas.isVisible()) {
      // Verify controls exist
      await expect(authenticatedPage.locator('.react-flow__controls')).toBeVisible();

      // Verify nodes rendered
      await expect(authenticatedPage.locator('.react-flow__node')).toHaveCount({ min: 2 });

      // Test zoom controls
      await authenticatedPage.locator('[aria-label="zoom in"]').click();
    }
  });
});

test.describe('EXPERIMENTAL: Agent Execution Visualizer', () => {
  test('shows execution flow during complex query', async ({ authenticatedPage }) => {
    await authenticatedPage.getByRole('textbox').fill(
      'Search for all DPSA tickets about authentication and cross-reference with Wiki documentation'
    );
    await authenticatedPage.getByRole('button', { name: /send/i }).click();

    // Look for execution visualizer
    const visualizer = authenticatedPage.locator('[data-testid="agent-execution-visualizer"]');

    if (await visualizer.isVisible({ timeout: 3000 })) {
      // Should show multiple nodes
      await expect(visualizer.locator('.react-flow__node')).toHaveCount({ min: 2 });

      // At least one should be running or complete
      await expect(
        visualizer.locator('.animate-pulse, .border-green-500')
      ).toBeVisible();
    }
  });
});
```

---

## Notes

- The `confirmation` component requires AI SDK v6 features (`approval-requested` state)
- Current SDK version may need upgrade for full confirmation support
- `context` component uses `tokenlens` for cost calculation - verify package is installed
- Model selector stays as-is (Google-only requirement)
- **EXPERIMENTAL features may be removed** if they don't provide sufficient value over simpler alternatives (Chain of Thought, Mermaid diagrams)
