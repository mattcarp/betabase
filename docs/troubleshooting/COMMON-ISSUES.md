# Common Issues

Frequent problems and solutions for SIAM development.

## Permission Errors (EACCES)

**Problem**: `Error: EACCES: permission denied, mkdir '/app/.next'`

**Solution**: In Dockerfile, create directories BEFORE switching to nextjs user:
```dockerfile
RUN mkdir -p .next && chown -R nextjs:nodejs .next
RUN touch next-env.d.ts && chown nextjs:nodejs next-env.d.ts
USER nextjs  # Switch user AFTER creating directories
```

## Merge Conflicts in package-lock.json

**Problem**: Git merge conflict in package-lock.json

**Solution**:
```bash
./scripts/fix-package-lock-conflict.sh
```

## Port 3000 Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
npx kill-port 3000
npm run dev
```

## TypeScript Errors

**Problem**: Type errors preventing build

**Solution**:
```bash
# Check errors in YOUR changed files only
git diff --name-only main...HEAD | xargs npm run type-check

# Fix errors, commit, verify
npm run type-check
```

## Console Errors in Browser

**Problem**: JavaScript errors in production

**Solution**:
```bash
# Test with Playwright
node check-site-console.js

# Or manually
playwright_navigate url="http://localhost:3000"
playwright_console_logs type="error"
```

## Build Timestamp Not Updating

**Problem**: Build time shows old timestamp

**Solution**:
```bash
# Force regenerate build info
node scripts/generate-build-info.js
cat .env.production.local  # Should show NEXT_PUBLIC_BUILD_TIME
```

## Health Check Timeout

**Problem**: Render health check timing out

**Solution**:
1. Check health endpoint locally: `curl http://localhost:3000/api/health`
2. Verify Next.js dev mode compilation time
3. Increase health check timeout in Render dashboard settings

## Reference

- **Debug Commands**: See [DEBUG-COMMANDS.md](DEBUG-COMMANDS.md)
- **Known Issues**: See [KNOWN-ISSUES.md](KNOWN-ISSUES.md)

---

*For quick reference, see [QUICK-START.md](../QUICK-START.md)*
