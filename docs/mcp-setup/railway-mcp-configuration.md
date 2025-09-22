## Render MCP Server Configuration

### Overview
This documents the transition from a local stdio proxy (`aoma-mcp-proxy.js`) to Render HTTP transport for the `aoma-mesh` MCP server integration.

### Render Deployment Details
- **Server URL**: `https://aoma-mesh-mcp.onrender.com`
- **Health Endpoint**: `/health` — Returns server health status
- **RPC Endpoint**: `/rpc` — JSON-RPC 2.0 protocol for MCP communication
- **MCP Endpoint**: `/mcp` — Streamable HTTP transport endpoint

### MCP Configuration Changes

#### Before: Local Stdio Proxy
```json
"aoma-mesh": {
  "type": "stdio",
  "command": "node",
  "args": ["/Users/matt/Documents/projects/siam/aoma-mcp-proxy.js"]
}
```

#### After: Direct HTTP Transport
```json
"aoma-mesh": {
  "type": "http",
  "url": "https://aoma-mesh-mcp.onrender.com/mcp",
  "headers": {
    "Authorization": "Bearer ${AOMA_MCP_API_KEY}"
  }
}
```

### Available Tools
- `query_aoma_knowledge` — Query Sony Music AOMA knowledge base
- `search_jira_tickets` — Search JIRA tickets and issues
- `get_jira_ticket_count` — Get ticket counts and statistics
- `search_git_commits` — Search Git repository commits
- `search_code_files` — Search through code files
- `search_outlook_emails` — Search Outlook email integration
- `analyze_development_context` — Analyze development context
- `get_system_health` — Get system health status
- `get_server_capabilities` — Get server capabilities

### Testing and Validation

#### Health Check Commands
```bash
# Test server health
curl -X GET https://aoma-mesh-mcp.onrender.com/health

# Test RPC endpoint
curl -X POST https://aoma-mesh-mcp.onrender.com/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### Knowledge Query Testing
```bash
# Test AOMA knowledge query
curl -X POST https://aoma-mesh-mcp.onrender.com/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"query_aoma_knowledge",
      "arguments":{
        "query":"What is USM?",
        "strategy":"focused"
      }
    }
  }'
```

### Demo Preparation Checklist
- [ ] Render server health verified
- [ ] All MCP tools responding correctly
- [ ] Knowledge queries returning accurate results
- [ ] Performance metrics within acceptable ranges
- [ ] Error handling working properly
- [ ] Demo-specific queries tested and validated

### Troubleshooting

#### Common Issues
- **502 Bad Gateway**: Check Render deployment status
- **Timeout Errors**: Verify network connectivity and server load
- **Tool Not Found**: Verify tool name spelling and availability
- **Authentication Errors**: Check API keys and headers

#### Performance Optimization
- Use appropriate query strategies (`rapid` for quick responses)
- Cache frequently used queries
- Monitor response times and adjust timeouts
- Use concurrent requests judiciously

### Security Considerations
- API key management and rotation
- CORS configuration for client access
- Rate limiting and abuse prevention
- Secure header configuration


