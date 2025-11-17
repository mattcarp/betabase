# SIAM Agent Operations Guide

_This document complements the global agents playbook in your dotfiles. Keep it in sync with `CLAUDE.md` and the task workflow defined in [taskmaster.mdc](mdc:.cursor/rules/taskmaster/taskmaster.mdc)._

## Core Agent Stack

- **Task Master (Model Contest Protocol)** orchestrates work intake, breakdown, and status. Always consult `task-master next` before starting and log progress via `update_subtask` when you pivot or learn something material.
- **LangGraph Workflows** back our autonomous and semi-autonomous flows. Each graph should expose clear entry points (`START`, `triage_router`, `response_agent`) and is expected to log semantic/episodic/procedural state.
- **Fiona Agent (Claude Code)** is the resident QA and governance specialist. Use the standard `fiona` agent: `fiona-enhanced` is deprecated and should not appear in branches, scripts, or docs.

## Memory + Context Strategy

### Mem0 Memory Layer (Primary)

- Install the SDK with `pip install mem0ai` or `npm install @mem0ai/sdk` and follow the quick-start flow in the [Mem0 dashboard](https://app.mem0.ai/dashboard/get-started).
- Store the provided `MEM0_API_KEY` outside the repo (`.env.local`, Task Master secrets, or IDE keychain). Never commit the raw token.
- Register a project namespace (e.g., `siam/main`) and write runbooks for:
  - `mem0.store()` / `mem0.add()` when codifying new patterns after Task Master subtasks close.
  - `mem0.search()` / `mem0.retrieve()` before starting work, embedding the results into LangGraph state or Task Master notes.
  - `mem0.delete()` to prune obsolete context during refactors.
- When the agent finishes a workflow, save a summary bullet (goal, approach, verification) and tag it with related files. Use Task Master subtasks to track anything that needs human review before pushing to shared memory.

### LangGraph Native Memory

- Separate memory into **semantic** (facts/preferences), **episodic** (successful task trajectories), and **procedural** (system prompts/checklists) stores. Use namespaces to isolate users, environments, or experiments.
- Balance **hot-path** writes (during a run) and **background** consolidation (post-run reflections) to minimise latency while preserving fidelity.
- Implement TTL and human-in-the-loop review for volatile memories. Encourage agents to surface proposed additions (`manage_memory_tool`) for sign-off during critical work.
- Reference: [mastering-long-term-agentic-memory-with-langgraph](https://saptak.in/writing/2025/03/23/mastering-long-term-agentic-memory-with-langgraph).

### Additional Options

- LangMem or vector databases remain viable for specialised retrieval; document any deviations in `/docs/reference`.
- Record helper scripts or adapters in Task Master so downstream agents understand the memory topology.

## Workflow Expectations

- Start every session with `task-master next`; update progress through Task Master before writing code.
- Use Fiona for MAC design audits, Playwright orchestration, and Semgrep enforcement. The agent reports (`docs/archive/test-reports/*FIONA*`) are the canonical acceptance history—review them before introducing UI regressions.
- When developing new LangGraph workflows, document entry points and state contracts in `docs/agents/AGENT-WORKFLOWS.md`. Keep the file under 200 lines and ASCII-only.
- For risky changes, capture ACE reflections (`brv complete`) or log structured notes in Task Master subtasks. This keeps downstream agents in sync.

## Testing & Compliance Hooks

- Fiona Agent must run on: MAC design reviews, Semgrep security scans, TestSprite scenarios, Browserbase smoke tests, and human-in-the-loop (HITL) approvals before prod merges.
- Attach `data-test-id` attributes to new UI so Fiona’s Playwright suites can target elements deterministically.
- Production readiness requires: `npm run test:aoma`, `npm run test:visual`, Fiona HITL approval, and Render smoke tests. Mirror the checklist in `CLAUDE.md`.

## Deprecations & Guardrails

- `fiona-enhanced` is retired. Delete any stale references and prefer `fiona`.
- Byterover MCP integrations are legacy. Replace with CLI workflows whenever you modify affected files.Use Mem0 when memory is needed.
- Do not add new MCP servers without documenting their context cost and Task Master impact.

## Cross-References

- Operational handbook: [CLAUDE.md](mdc:CLAUDE.md)
- Fiona deep dives: [docs/CURATE_TAB_VISUAL_VERIFICATION.md](mdc:docs/CURATE_TAB_VISUAL_VERIFICATION.md)
- Task workflow: [taskmaster/dev_workflow.mdc](mdc:.cursor/rules/taskmaster/dev_workflow.mdc)
- MCP compatibility notes: [docs/agents/MCP-INTEGRATION.md](mdc:docs/agents/MCP-INTEGRATION.md)

_Last reviewed: 2025-11-12_
