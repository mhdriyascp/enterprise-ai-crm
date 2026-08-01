# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copy workspace configuration and shared packages (workspace dependencies)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ ./packages/

# Copy app manifest
COPY apps/mobile-api/package.json ./apps/mobile-api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/mobile-api/ ./apps/mobile-api/

# Build the app and its workspace dependencies
RUN pnpm --filter @crm/mobile-api... build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3300

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built app and node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/mobile-api/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/apps/mobile-api/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

USER nodejs

EXPOSE 3300

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --tries=1 http://localhost:3300/health -O /dev/null || exit 1

CMD ["node", "dist/index.js"]
