# 🔥 PRODUCTION-READY MULTI-STAGE DOCKERFILE
# Optimized for Render deployments and portability
# FORCE REBUILD: 2025-08-23T07:11:00Z

# ============================================
# BASE STAGE - Common dependencies
# ============================================
FROM node:22-alpine AS base

# Install essential system dependencies (including bash for build scripts)
RUN apk add --no-cache libc6-compat tini curl bash git

# Set working directory
WORKDIR /app

# ============================================
# DEPENDENCIES STAGE - Install node modules
# ============================================
FROM base AS deps

# Copy package files first (layer caching optimization)
COPY package.json package-lock.json* ./

# Install dependencies with better error handling
RUN npm ci --legacy-peer-deps || \
    (echo "❌ Dependency installation failed! Retrying..." && \
     npm install --legacy-peer-deps)

# ============================================
# BUILDER STAGE - Build the application
# ============================================
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Make scripts executable
RUN chmod +x scripts/*.sh 2>/dev/null || true

# Generate build info FIRST before building
RUN node scripts/generate-build-info.js || echo "Build info generation skipped"

# Debug: Show what was generated
RUN cat .env.production.local || echo "No .env.production.local found"

# Set build-time environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_SHARP_PATH=/app/node_modules/sharp

# IMPORTANT: Source the .env.production.local file to make variables available during build
# Next.js will read .env.production.local automatically, but let's make sure it's there
RUN test -f .env.production.local && echo "✅ Build info file exists" || echo "❌ Build info file missing"

# Build the application with standalone output
RUN npm run build || \
    (echo "❌ Build failed! Check your code!" && exit 1)

# ============================================
# RUNNER STAGE - Production runtime
# ============================================
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy public assets (static files)
COPY --from=builder /app/public ./public

# Create necessary directories with correct permissions
RUN mkdir -p .next && \
    chown -R nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy additional necessary files
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Default port (can be overridden by Render)
ENV PORT=10000
ENV HOSTNAME=0.0.0.0

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Use tini for proper signal handling (prevents zombie processes)
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["./docker-entrypoint.sh"]