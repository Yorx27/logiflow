# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN npm install -g pnpm@10
WORKDIR /app

# Copy workspace manifests only (cache-friendly)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ─────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN pnpm run build

# ── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl --no-install-recommends && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10
WORKDIR /app

# Only prod deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --prod --frozen-lockfile

# Copy built output and prisma schema
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/assets ./apps/api/src/assets

# Generate Prisma client with correct binary for this runtime OS (linux-musl)
WORKDIR /app/apps/api
RUN node_modules/.bin/prisma generate

ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
