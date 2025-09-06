# Global MCP Package Setup Guide

## Overview

Global MCP packages allow you to use the same MCP servers across all projects without duplicating configuration.

## Setup Locations by IDE/Tool

### 1. **Claude Desktop App**

```json
// Location: ~/.config/claude/claude_desktop_config.json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai@latest"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    },
    "testsprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "TESTSPRITE_API_KEY": "${TESTSPRITE_API_KEY}"
      }
    },
    "browser-tools": {
      "command": "npx",
      "args": ["@eqiz/browser-tools-mcp-enhanced@latest"],
      "env": {}
    }
  }
}
```

### 2. **Claude Code CLI**

```json
// Location: ~/.config/claude/mcp.json (or claude_code_config.json)
// Same format as above
```

### 3. **Cursor**

```json
// Location: ~/.cursor/mcp_config.json
// Cursor reads both global and project-local .mcp.json files
```

### 4. **Windsurf**

```json
// Location: ~/.windsurf/mcp.json
// Similar to Cursor, merges global and local configs
```

### 5. **VS Code (with Continue or Cody)**

```json
// Location: ~/.continue/config.json (for Continue extension)
// These extensions don't natively support MCP but can be configured with custom commands
```

## Key Management Strategies

### Option 1: Environment Variables (Recommended)

```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-..."
export PERPLEXITY_API_KEY="pplx-..."
export TESTSPRITE_API_KEY="sk-user-..."
export OPENAI_API_KEY="sk-..."

# Then reference in MCP config:
"env": {
  "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
}
```

### Option 2: System Keychain (Most Secure)

```bash
# macOS Keychain
security add-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w "your-key-here"

# Retrieve in script:
ANTHROPIC_API_KEY=$(security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w)
```

### Option 3: Dedicated Secrets File

```bash
# Create ~/.config/claude/.env (chmod 600 for security)
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...

# Load in MCP wrapper script
```

### Option 4: MCP Wrapper Script

```bash
#!/bin/bash
# ~/.config/claude/mcp-launcher.sh

# Load secrets from secure location
source ~/.config/claude/.env

# Launch MCP with injected env vars
exec "$@"
```

Then in config:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "/Users/matt/.config/claude/mcp-launcher.sh",
      "args": ["npx", "-y", "task-master-ai@latest"]
    }
  }
}
```

## IDE Support Matrix

| IDE/Tool               | Global Config | Local Config | MCP Native | Notes               |
| ---------------------- | ------------- | ------------ | ---------- | ------------------- |
| **Claude Desktop**     | ✅            | ✅           | ✅         | Full MCP support    |
| **Claude Code CLI**    | ✅            | ✅           | ✅         | Full MCP support    |
| **Cursor**             | ✅            | ✅           | ✅         | Full MCP support    |
| **Windsurf**           | ✅            | ✅           | ✅         | Full MCP support    |
| **Zed**                | ⚠️            | ✅           | ✅         | Via assistant panel |
| **VS Code**            | ❌            | ⚠️           | ❌         | Via extensions only |
| **Continue (VS Code)** | ⚠️            | ⚠️           | ❌         | Custom commands     |
| **Cody (VS Code)**     | ❌            | ⚠️           | ❌         | Custom commands     |

## Best Practices

1. **Use npx with @latest** for auto-updates:

   ```json
   "args": ["@package/name@latest"]
   ```

2. **Separate development and production keys**:

   ```json
   "env": {
     "API_KEY": "${NODE_ENV}_API_KEY"
   }
   ```

3. **Project overrides**: Local `.mcp.json` typically overrides global config

4. **Version pinning when needed**:
   ```json
   "args": ["task-master-ai@0.24.0"]  // Pin specific version
   ```

## Example: Complete Global Setup

```bash
# 1. Install global packages (optional, npx handles this)
npm install -g task-master-ai@latest
npm install -g @testsprite/testsprite-mcp@latest
npm install -g @eqiz/browser-tools-mcp-enhanced@latest

# 2. Create global config directory
mkdir -p ~/.config/claude

# 3. Create secure env file
cat > ~/.config/claude/.env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-...
PERPLEXITY_API_KEY=pplx-...
TESTSPRITE_API_KEY=sk-user-...
EOF
chmod 600 ~/.config/claude/.env

# 4. Create global MCP config
cat > ~/.config/claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "task-master-ai@latest"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}"
      }
    },
    "testsprite": {
      "command": "npx",
      "args": ["-y", "@testsprite/testsprite-mcp@latest"],
      "env": {
        "TESTSPRITE_API_KEY": "${TESTSPRITE_API_KEY}"
      }
    },
    "browser-tools": {
      "command": "npx",
      "args": ["-y", "@eqiz/browser-tools-mcp-enhanced@latest"]
    }
  }
}
EOF

# 5. Add to shell profile for env vars
echo 'export $(cat ~/.config/claude/.env | xargs)' >> ~/.zshrc
```

## Advantages of Global Setup

1. **Consistency**: Same tools across all projects
2. **Maintenance**: Update once, apply everywhere
3. **Security**: Centralized key management
4. **Efficiency**: No redundant installations
5. **Portability**: Easy to backup/restore setup

## Potential Issues

1. **Version conflicts**: Different projects may need different versions
   - Solution: Use project-local `.mcp.json` to override
2. **Key rotation**: Updating keys in multiple places
   - Solution: Use environment variables or keychain
3. **IDE differences**: Not all IDEs handle configs the same way
   - Solution: Use IDE-specific config locations

4. **Permission issues**: Some tools may not read env vars correctly
   - Solution: Use wrapper scripts or explicit values

## Testing Your Setup

```bash
# Test MCP server directly
npx -y task-master-ai@latest --version

# Check if env vars are loaded
echo $ANTHROPIC_API_KEY

# Verify in Claude Desktop/Code
# Should see MCP servers available without project config
```
