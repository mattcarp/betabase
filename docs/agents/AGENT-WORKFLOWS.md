# Agent Workflows

Multi-agent patterns, orchestration, and best practices for SIAM development.

## Available Agents

- **fiona-enhanced** - SOTA agent with memory, reflection, security scanning
- **task-executor** - Execute specific tasks
- **task-orchestrator** - Coordinate parallel execution
- **system-architect** - System design and architecture
- Others: See `.claude/agents/` for complete list

## Multi-Agent Workflows

### Parallel Development

```bash
# Terminal 1: Main implementation
cd project && claude

# Terminal 2: Testing and validation
cd project-test-worktree && claude

# Terminal 3: Documentation updates
cd project-docs-worktree && claude
```

### Task Orchestration

Use task-orchestrator for complex, multi-task projects:
```bash
# Analyze task queue and parallelize work
# Deploy task-executor agents as needed
# Monitor progress and handle dependencies
```

## Best Practices

1. **Use correct agent for task** - Match agent to capability
2. **Fiona for design/security** - Always use fiona-enhanced
3. **Parallel where possible** - Run independent tasks concurrently
4. **Clear communication** - Specify exactly what you need
5. **Trust agent outputs** - Generally reliable results

## Reference

- **Fiona Usage**: See [FIONA-USAGE.md](FIONA-USAGE.md)
- **MCP Integration**: See [MCP-INTEGRATION.md](MCP-INTEGRATION.md)

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
