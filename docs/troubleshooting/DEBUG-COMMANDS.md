# Debug Commands

Essential debugging commands and tools for SIAM troubleshooting.

## Check Logs

```bash
# Render logs (via MCP or CLI)
render logs siam-app | grep -E "EACCES|Error|AUTH|COGNITO"

# Local process logs
tail -f server.log
tail -f dev.log

# Browser console (via Playwright)
playwright_console_logs type="error" limit=50
```

## File Permissions Check

```bash
# In Docker container
docker exec -it <container> ls -la /app/
docker exec -it <container> whoami
```

## Build Verification

```bash
# Check build info
node scripts/generate-build-info.js
cat .env.production.local

# Verify TypeScript
npm run type-check

# Verify build
npm run build
```

## Network Debugging

```bash
# Check health endpoint
curl https://thebetabase.com/api/health

# Check with verbose output
curl -v https://thebetabase.com/api/health

# Check specific API endpoint
curl https://thebetabase.com/api/chat
```

## Environment Variables

```bash
# Check local env
cat .env.local | grep -v "^#" | grep -v "^$"

# Check if variable is set
echo $NEXT_PUBLIC_SUPABASE_URL

# List all NEXT_PUBLIC_ vars
env | grep NEXT_PUBLIC
```

## Git Debugging

```bash
# Check current status
git status

# Check remote
git remote -v

# Check recent commits
git log --oneline -10

# Check specific file history
git log --follow -- path/to/file
```

## Process Management

```bash
# Find process on port 3000
lsof -i :3000

# Kill specific process
kill -9 <PID>

# Kill port 3000
npx kill-port 3000
```

## Reference

- **Common Issues**: See [COMMON-ISSUES.md](COMMON-ISSUES.md)
- **Known Issues**: See [KNOWN-ISSUES.md](KNOWN-ISSUES.md)

---

_For quick reference, see [QUICK-START.md](../QUICK-START.md)_
