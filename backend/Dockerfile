# backend/Dockerfile

# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install production deps only (backend has no build step)
RUN npm ci --only=production && npm cache clean --force

# ─── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# dumb-init: proper PID 1 / signal handling (SIGTERM → graceful shutdown)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodejs -u 1001 -G nodejs

# Copy production node_modules from deps stage
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=nodejs:nodejs . .

# Create upload directories with correct ownership BEFORE switching user
RUN mkdir -p /app/uploads/avatars /app/uploads/kyc && \
    chown -R nodejs:nodejs /app/uploads

USER nodejs

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Healthcheck — hits the /health endpoint added in index.js
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]