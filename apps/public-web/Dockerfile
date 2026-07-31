# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy app manifest
COPY apps/public-web/package.json ./apps/public-web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/public-web/ ./apps/public-web/

# Build (produces a standalone server under .next/standalone)
RUN pnpm --filter @crm/public-web build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3003

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy the standalone output, static assets and public files
COPY --from=builder --chown=nodejs:nodejs /app/apps/public-web/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/apps/public-web/.next/static ./apps/public-web/.next/static

USER nodejs

EXPOSE 3003

CMD ["node", "apps/public-web/server.js"]
