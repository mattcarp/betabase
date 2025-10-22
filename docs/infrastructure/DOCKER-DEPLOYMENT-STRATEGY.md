# 🚀 DOCKER DEPLOYMENT STRATEGY - FUCK YEAH!

## 🔥 THE ULTIMATE CROSS-MACHINE SETUP

### Why This Fucking Works Everywhere

1. **Docker = Consistency** - Same shit runs on Mac, Linux, Windows, Render, AWS, your grandma's laptop
2. **Multi-stage builds** - Production images are tiny as fuck (under 200MB)
3. **Environment isolation** - Dev dependencies never touch production
4. **Port flexibility** - Run dev on 3000, prod on 10000, no conflicts!

## 📦 Quick Start - ANY MACHINE

```bash
# Clone and go - THAT'S IT!
git clone <repo>
cd siam

# Development (with hot reload)
make dev

# Production test
make prod-test

# Clean everything
make nuke
```

## 🎯 Environment Management

### Local Development

```bash
# Create .env.local (git-ignored)
cp .env.example .env.local
# Edit with your API keys
```

### Production (Render)

- Set environment variables in Render dashboard
- Docker image uses ENV vars at runtime
- Never commit secrets to git!

## 🔄 Cross-Machine Development

### Method 1: Docker Everywhere (RECOMMENDED)

```bash
# Machine A
git commit -am "WIP: feature X"
git push

# Machine B
git pull
make dev  # Everything just fucking works!
```

### Method 2: Git Worktrees (Advanced)

```bash
# Multiple branches, no conflicts
git worktree add ../siam-feature-x feature/x
git worktree add ../siam-hotfix hotfix/critical

# Each worktree gets its own Docker container
cd ../siam-feature-x && make dev  # Port 3000
cd ../siam-hotfix && make dev      # Change port in docker-compose.yml
```

## 🚢 Render Deployment

### Automatic (Push to main)

```bash
git push origin main
# Render auto-deploys using Dockerfile
```

### Manual Testing

```bash
# Test EXACT Render build locally
make render-build

# Check image size
docker images siam-render:latest
```

## 🐳 Docker Commands Cheatsheet

### Development

```bash
make dev          # Start dev with hot reload
make dev-bg       # Run in background
make logs         # View logs
make shell        # Enter container shell
```

### Production

```bash
make prod         # Run production build
make prod-test    # Test production locally
```

### Cleanup

```bash
make clean        # Remove containers
make nuke         # DESTROY EVERYTHING
```

## 🔧 Troubleshooting

### Port Conflicts

```bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Docker Daemon Issues

```bash
# Restart Docker Desktop
osascript -e 'quit app "Docker Desktop"'
open -a "Docker Desktop"
```

### Permission Errors

Already fixed in Dockerfile:

- Directories created before USER switch
- Proper ownership with chown
- Non-root user (nextjs) for security

## 🎪 Multi-Container Setup (Future)

```yaml
# docker-compose.yml additions
services:
  app:
    # ... existing config

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: siam
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb
```

## 📊 Performance Optimizations

1. **Build caching** - pnpm store mounted as cache
2. **Layer optimization** - Dependencies before source
3. **Multi-stage builds** - Only ship what's needed
4. **Standalone Next.js** - No node_modules in production

## 🔐 Security Best Practices

1. **Non-root user** - Container runs as `nextjs`
2. **Minimal base image** - Alpine Linux
3. **No secrets in image** - Use runtime ENV vars
4. **Health checks** - Auto-restart on failure
5. **Tini for signals** - Proper process handling

## 🚀 Deployment Checklist

- [ ] Test locally: `make dev`
- [ ] Test production: `make prod-test`
- [ ] Check logs: `make logs`
- [ ] Verify health: `curl localhost:3000/api/health`
- [ ] Push to git: `git push origin main`
- [ ] Monitor Render: Check deployment logs
- [ ] Smoke test: Hit production URL

## 💪 Why This Setup Fucking Rocks

1. **Zero "works on my machine"** - Docker guarantees consistency
2. **Fast iterations** - Hot reload in dev, cached builds
3. **Production-ready** - Same Dockerfile for local and Render
4. **Easy onboarding** - New dev? `make dev` and go!
5. **Scalable** - Add services without breaking existing setup

## 🎯 The Golden Rule

**If it runs in Docker locally, it runs EVERYWHERE!**

That's the fucking beauty of containerization!

---

Last updated: 2025-08-22
Docker version: 28.3.2
Next.js version: 15.4.6
