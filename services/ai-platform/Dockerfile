# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.4.0 --activate

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ ./packages/

# Copy service files
ARG SERVICE_NAME
COPY services/${SERVICE_NAME}/package.json ./services/${SERVICE_NAME}/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY services/${SERVICE_NAME}/ ./services/${SERVICE_NAME}/

# Build
RUN pnpm --filter @crm/${SERVICE_NAME} build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/${SERVICE_NAME}/prisma ./prisma

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --tries=1 http://localhost:3000/health -O /dev/null || exit 1

CMD ["node", "dist/index.js"]
