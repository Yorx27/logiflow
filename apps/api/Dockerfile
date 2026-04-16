# ── Stage 1: deps ────────────────────────────────────────────────────────────
FROM node:20-bullseye-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends openssl libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ─────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN pnpm run build

# ── Stage 3: runner — Node 18 (OpenSSL 1.1.x) guarantees libssl.so.1.1 ──────
FROM node:18-bullseye-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/assets ./apps/api/src/assets

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["sh", "-c", "echo '=== NET TEST ===' && getent hosts postgres.railway.internal 2>&1 || echo 'DNS FAIL' && node_modules/.bin/prisma migrate deploy && node dist/index.js"]
