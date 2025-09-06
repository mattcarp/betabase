# MCP Server Configuration for SIAM

## Overview

MCP (Model Context Protocol) servers allow Claude Code to interact with external tools and services. Your SIAM project can use several MCP servers for enhanced functionality.

## Currently Configured Servers

### 1. **Filesystem Server** ✅

**Status**: Ready to use
**Purpose**: File system operations within your project
**Configuration**:

```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-filesystem"],
  "env": {
    "MCP_FS_ROOT": "."
  }
}
```

### 2. **Git Server** ✅

**Status**: Ready to use
**Purpose**: Git operations (commits, branches, history)
**Configuration**:

```json
{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-git"]
}
```

## Available But Not Configured

### 3. **AOMA Mesh MCP Server** 🔧

**Status**: Available but needs configuration
**Purpose**: Access to JIRA, Git commits, code analysis, and more
**Location**: `~/Documents/projects/aoma-mesh-mcp`

To add this server, update your `.mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "MCP_FS_ROOT": "."
      }
    },
    "git": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-git"]
    },
    "aoma-mesh": {
      "command": "node",
      "args": [
        "/Users/matt/Documents/projects/aoma-mesh-mcp/dist/aoma-mesh-server.js"
      ],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

### 4. **Desktop Commander** (If you have it installed)

**Purpose**: System-level file operations, process management
**Configuration**:

```json
{
  "desktop-commander": {
    "command": "npx",
    "args": ["@desktop-commander/mcp-server"]
  }
}
```

## How to Test MCP Servers

### In Claude Code:

```bash
cd ~/Documents/projects/siam
claude

# Test filesystem server:
"List all files in the src/components directory"

# Test git server:
"Show me the last 5 git commits"

# Test aoma-mesh (if configured):
"Search for JIRA tickets about authentication"
```

## Troubleshooting MCP Servers

### Common Issues:

#### 1. "MCP server not found"

**Fix**: Make sure you're in the project directory with `.mcp.json`

#### 2. "Command failed"

**Fix**: Check if the server is installed:

```bash
# For filesystem and git servers:
npm list @modelcontextprotocol/server-filesystem
npm list @modelcontextprotocol/server-git

# If not installed:
npm install -D @modelcontextprotocol/server-filesystem
npm install -D @modelcontextprotocol/server-git
```

#### 3. AOMA Mesh server not working

**Fix**: Build it first:

```bash
cd ~/Documents/projects/aoma-mesh-mcp
npm run build
```

## Setting Up AOMA Mesh for SIAM

If you want to use AOMA Mesh MCP with SIAM:

1. **Build AOMA Mesh**:

```bash
cd ~/Documents/projects/aoma-mesh-mcp
npm install
npm run build
```

2. **Update SIAM's .mcp.json** (add the aoma-mesh configuration above)

3. **Test in Claude Code**:

```
"Using AOMA Mesh, search for recent code changes related to authentication"
```

## Best Practices

1. **Start Simple**: Use filesystem and git servers first
2. **Add Gradually**: Add specialized servers as needed
3. **Test Each Server**: Verify each works before adding more
4. **Check Logs**: Claude Code shows MCP server errors in output

## Quick Setup Script

Run this to ensure basic MCP servers are installed:

```bash
cd ~/Documents/projects/siam
npm install -D @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-git
```

## What Each Server Enables

### Filesystem Server

- Read/write files
- Create directories
- Search file contents
- Move/rename files

### Git Server

- View commit history
- Check file changes
- Branch operations
- Blame information

### AOMA Mesh (when configured)

- Search JIRA tickets
- Analyze code patterns
- Query documentation
- Access business intelligence

## Next Steps

1. **Test Current Servers**: Try the filesystem and git servers first
2. **Add AOMA Mesh**: If you need JIRA/code analysis features
3. **Monitor Usage**: See which servers you actually use
4. **Add More**: Explore other MCP servers as needed
