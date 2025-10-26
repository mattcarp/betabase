# Monitoring Guide

Health checks, logs, metrics, and performance monitoring for SIAM deployments.

## Health Monitoring

### Health Endpoint

**Endpoint**: `https://thebetabase.com/api/health`

**Response format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00Z",
  "version": "0.13.6",
  "environment": "production"
}
```

### Quick Health Check

```bash
# Check production health
curl https://thebetabase.com/api/health

# Check with formatted JSON
curl https://thebetabase.com/api/health | jq '.'

# Check specific field
curl https://thebetabase.com/api/health | jq '.status'
```

### Automated Health Monitoring

**Deployment script** (`./scripts/deploy-with-monitoring.sh`) automatically:
- Polls health endpoint every 10 seconds
- Requires 3 consecutive healthy responses
- Verifies build timestamp is current
- Detects console errors
- Reports final status

## Log Monitoring

### Using Render MCP (Recommended)

Natural language commands in Claude Code:
```bash
"Show recent logs for siam-app"
"Check error logs from the last hour"
"Pull build logs for latest deployment"
"Why is the deployment failing?"
```

### Using Render CLI

```bash
# Install Render CLI
brew install render

# View real-time logs
render logs siam-app --tail

# View last 100 lines
render logs siam-app --tail 100

# View build logs
render logs siam-app --type build --tail 50

# Filter by text
render logs siam-app --tail 100 | grep ERROR

# View logs from specific time
render logs siam-app --start-time="2025-10-26T12:00:00Z"
```

### Log Levels

**Production logs include:**
- **INFO**: Normal operations, health checks, successful requests
- **WARN**: Non-critical issues, deprecation warnings
- **ERROR**: Application errors, failed requests, exceptions
- **DEBUG**: Detailed debugging info (only in dev mode)

### Important Log Patterns

**Successful deployment:**
```
✓ Compiled successfully
Ready on http://0.0.0.0:3000
```

**Build errors:**
```
✗ TypeScript error in src/components/...
✗ Module not found: Can't resolve '...'
```

**Runtime errors:**
```
Error: EACCES: permission denied
UnhandledPromiseRejectionWarning
TypeError: Cannot read property '...'
```

## Performance Metrics

### Using Render MCP

```bash
# In Claude Code
"Show CPU and memory metrics for last 24 hours"
"What was the busiest traffic day this month?"
"Get performance metrics for siam-app"
```

### Metrics Available

**Resource Metrics:**
- CPU usage (average, max, limits)
- Memory usage (average, max, limits)
- Instance count
- CPU/Memory targets (for autoscaling)

**HTTP Metrics:**
- Request counts (total, by host, by status code)
- Response times (p50, p95, p99)
- Bandwidth usage

**Database Metrics:**
- Active connections
- Query performance
- Storage usage

### Querying Metrics

```bash
# Get metrics for last 24 hours
# Resolution: 60 seconds (data point every minute)

# CPU usage
metricTypes: ["cpu_usage", "cpu_limit", "cpu_target"]

# Memory usage
metricTypes: ["memory_usage", "memory_limit", "memory_target"]

# HTTP metrics
metricTypes: ["http_request_count", "http_latency"]

# Filter HTTP by host
httpHost: "thebetabase.com"

# Filter HTTP by path
httpPath: "/api/chat"
```

### Performance Thresholds

**Healthy:**
- CPU usage < 70%
- Memory usage < 80%
- Response time p95 < 500ms
- Error rate < 1%

**Warning:**
- CPU usage 70-85%
- Memory usage 80-90%
- Response time p95 500-1000ms
- Error rate 1-5%

**Critical:**
- CPU usage > 85%
- Memory usage > 90%
- Response time p95 > 1000ms
- Error rate > 5%

## Console Error Detection

### Using Playwright

```bash
# Local console check
node check-site-console.js

# Production console check
playwright_navigate url="https://thebetabase.com"
playwright_console_logs type="error" limit=50
```

### Common Console Errors

**Network errors:**
```
Failed to load resource: net::ERR_CONNECTION_REFUSED
404 (Not Found)
```

**JavaScript errors:**
```
Uncaught TypeError: Cannot read property 'x' of undefined
Uncaught ReferenceError: x is not defined
```

**React errors:**
```
Warning: Each child in a list should have a unique "key" prop
Warning: Can't perform a React state update on an unmounted component
```

## Deployment Status Monitoring

### GitHub Actions

```bash
# Watch current deployment
gh run watch

# List recent runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# View workflow logs
gh run view <run-id> --log

# View job logs
gh run view <run-id> --job=<job-id>
```

### Render Deploy Status

```bash
# Using Render MCP
"List recent deployments for siam-app"
"Show deployment status"
"Why is the latest deploy failing?"

# Using Render CLI
render deploys list siam-app

# Check specific deployment
render deploys get <deploy-id>
```

## Alerting & Notifications

### GitHub Actions Notifications

**Automated PR comments:**
- Deployment status posted to merged PR
- Health verification results
- Build timestamp confirmation
- Console error detection results

**Issue creation:**
- Auto-created if deployment fails
- Assigned to PR author
- Includes error logs and diagnostics

### Custom Monitoring Scripts

```bash
# Monitor deployment script
./scripts/deploy-with-monitoring.sh

# Python deployment monitor
python3 ./scripts/monitor-deployment.py

# Browser console checker
node check-site-console.js
```

## Troubleshooting Monitoring Issues

### Health Endpoint Not Responding

**Check:**
1. Service is running: `render services list`
2. No recent deployments failed: `render deploys list siam-app`
3. Logs for errors: `render logs siam-app --tail 100`
4. Network connectivity: `ping thebetabase.com`

### Logs Not Showing Recent Events

**Check:**
1. Time zone settings (logs use UTC)
2. Log level filters (might be filtering out INFO)
3. Service restart recently (logs cleared)
4. Pagination (use --tail parameter)

### Metrics Not Available

**Check:**
1. Time range within last 30 days
2. Resource ID is correct
3. Metric type is valid for resource
4. Resolution not too granular (causes 500 error)

## Monitoring Best Practices

1. **Monitor during deployments** - Don't deploy and walk away
2. **Set up alerts** - Know when things go wrong
3. **Track metrics trends** - Identify issues before they become critical
4. **Check logs regularly** - Catch errors early
5. **Verify health checks** - Ensure endpoint always responds
6. **Test monitoring** - Verify alerts work
7. **Document incidents** - Learn from failures

## Monitoring Tools Reference

**Render MCP Tools:**
- `get_metrics` - Retrieve performance metrics
- `list_logs` - Get application logs
- `list_deploys` - View deployment history
- `get_service` - Check service status

**CLI Tools:**
- `render` - Render CLI for logs and services
- `gh` - GitHub CLI for Actions monitoring
- `curl` - Health endpoint checking
- `jq` - JSON parsing for API responses

## Reference

- **Deployment Guide**: See [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) for deployment process
- **CI/CD Pipeline**: See [CI-CD-PIPELINE.md](CI-CD-PIPELINE.md) for automation
- **Production Testing**: See `docs/PRODUCTION_TESTING.md` for verification

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
