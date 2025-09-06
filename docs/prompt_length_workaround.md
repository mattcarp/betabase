# Prompt Length Workaround for 413 Error

## Problem

When working with large codebases or complex tasks, you may encounter:

```
413 {"type":"error","error":{"type":"invalid_request_error","message":"Prompt is too long"}}
```

This error occurs when the total context (conversation history + file contents + system prompts) exceeds the model's context window limit.

## Root Causes

1. **Large File Contents**: Reading multiple large files into context
2. **Long Conversation History**: Extended back-and-forth discussions
3. **Verbose System Prompts**: Detailed instructions and rules
4. **Complex Project Structure**: Many files being analyzed simultaneously

## Immediate Workarounds

### 1. Context Reduction Strategies

#### A. File Chunking

Instead of reading entire large files, focus on specific sections:

```bash
# Instead of reading entire file
read_file src/large_module.py

# Read specific sections using search_files
search_files src/ "class SpecificClass" "*.py"
search_files src/ "def target_function" "*.py"
```

#### B. Targeted Analysis

Use `list_code_definition_names` to get an overview before diving deep:

```bash
list_code_definition_names src/
# Then selectively read only relevant files
```

#### C. Progressive Exploration

Work incrementally rather than loading everything at once:

1. Start with project structure overview
2. Identify key files/modules
3. Read one file at a time
4. Make changes iteratively

### 2. Conversation Management

#### A. Start New Tasks

When context gets too large, use the `new_task` tool to create a fresh conversation with relevant context:

```markdown
<new_task>
<context>
Current Work: Working on Rust terminal emulator borrowing issues
Key Files: siam-terminal/src/terminal.rs, siam-terminal/src/main.rs
Problem: VTE parser borrowing conflicts resolved by creating temporary parser
Next Steps: Test compilation and implement remaining features
</context>
</new_task>
```

#### B. Summarize and Reset

Before hitting limits:

1. Summarize current progress
2. Document key decisions
3. Start fresh conversation
4. Reference previous work via documentation

### 3. Code Organization Strategies

#### A. Modular Development

Break large tasks into smaller, focused subtasks:

```markdown
Instead of: "Implement entire terminal emulator"
Use:

- "Fix VTE parser borrowing issue"
- "Add ANSI color support"
- "Implement cursor movement"
- "Add subprocess handling"
```

#### B. Documentation-Driven Development

Create documentation files to preserve context:

```markdown
# docs/terminal_implementation_notes.md

## Borrowing Issue Resolution

- Problem: Cannot borrow `self.parser` mutably twice
- Solution: Create temporary parser in `write_with_ansi`
- Files changed: siam-terminal/src/terminal.rs:159

## Next Steps

- [ ] Test ANSI escape sequence handling
- [ ] Implement proper error handling
- [ ] Add unit tests
```

## Implementation Strategies

### 1. Prompt Manager Pattern

Create a utility to manage prompt length:

```python
# src/utils/prompt_manager.py
class PromptManager:
    def __init__(self, max_tokens=150000):
        self.max_tokens = max_tokens
        self.current_tokens = 0

    def estimate_tokens(self, text):
        # Rough estimation: 1 token ≈ 4 characters
        return len(text) // 4

    def can_add_content(self, content):
        estimated = self.estimate_tokens(content)
        return self.current_tokens + estimated < self.max_tokens

    def add_content(self, content):
        if self.can_add_content(content):
            self.current_tokens += self.estimate_tokens(content)
            return True
        return False
```

### 2. Chunked File Reading

```python
def read_file_chunked(file_path, max_lines=100):
    """Read file in chunks to avoid context overflow"""
    with open(file_path, 'r') as f:
        lines = f.readlines()

    chunks = []
    for i in range(0, len(lines), max_lines):
        chunk = ''.join(lines[i:i+max_lines])
        chunks.append({
            'lines': f"{i+1}-{min(i+max_lines, len(lines))}",
            'content': chunk
        })

    return chunks
```

### 3. Smart Context Selection

```python
def select_relevant_context(query, available_files):
    """Select most relevant files based on query"""
    relevant_files = []

    # Keyword matching
    query_keywords = query.lower().split()

    for file_path in available_files:
        score = 0
        file_name = file_path.lower()

        # Score based on filename relevance
        for keyword in query_keywords:
            if keyword in file_name:
                score += 2

        # Score based on file type relevance
        if any(ext in file_path for ext in ['.py', '.rs', '.js', '.ts']):
            score += 1

        relevant_files.append((file_path, score))

    # Return top 5 most relevant files
    return [f[0] for f in sorted(relevant_files, key=lambda x: x[1], reverse=True)[:5]]
```

## Best Practices

### 1. Proactive Context Management

- Monitor context usage throughout conversation
- Use shorter, more focused messages
- Avoid unnecessary verbose explanations
- Reference external documentation instead of including full text

### 2. Efficient File Handling

- Use `search_files` instead of `read_file` for exploration
- Read only the specific functions/classes you need to modify
- Use `list_code_definition_names` for overviews
- Prefer targeted searches over full file reads

### 3. Iterative Development

- Make one change at a time
- Test frequently
- Document progress in separate files
- Use version control to track changes

### 4. Strategic Tool Usage

- Use `replace_in_file` for small changes instead of `write_to_file`
- Combine multiple small changes in single tool calls
- Use `execute_command` to verify changes work
- Leverage `new_task` when context gets unwieldy

## Emergency Recovery

If you hit the 413 error:

1. **Immediate**: Start a new conversation with minimal context
2. **Document**: Quickly note what you were working on
3. **Prioritize**: Focus on the most critical immediate task
4. **Reference**: Use file paths and line numbers instead of full code blocks
5. **Iterate**: Make smaller, more focused changes

## Example Recovery Workflow

```markdown
1. Hit 413 error while working on terminal.rs
2. Create new conversation: "Fix Rust borrowing error in terminal.rs line 159"
3. Use search_files to find the specific problem area
4. Make targeted fix with replace_in_file
5. Test with cargo check
6. Document solution in progress notes
7. Continue with next small task
```

## Tools for Context Management

### Built-in Tools

- `new_task`: Start fresh with summarized context
- `search_files`: Find specific code without reading entire files
- `list_code_definition_names`: Get overviews without full content
- `replace_in_file`: Make targeted changes without full file rewrites

### Custom Utilities

- Prompt length estimators
- Context summarizers
- File relevance scorers
- Chunked file readers

## Prevention Strategies

1. **Start Small**: Begin with minimal viable changes
2. **Document Early**: Create progress files before context fills up
3. **Test Often**: Verify changes work before adding more context
4. **Modularize**: Break large tasks into independent subtasks
5. **Reference**: Use external documentation instead of inline explanations

## Conclusion

The 413 error is manageable with proper context management strategies. The key is to work incrementally, document progress, and use the available tools efficiently. When in doubt, start a new conversation with focused context rather than struggling with an overloaded one.

Remember: It's better to have multiple focused conversations than one overwhelming conversation that hits context limits.
