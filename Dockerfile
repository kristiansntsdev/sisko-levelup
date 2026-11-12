# syntax=docker/dockerfile:1
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Tidak ada query DB saat build; env runtime tidak perlu di sini.
ENV BUILD_STANDALONE=1
# lib/db.ts mem-parse DATABASE_URL saat modul di-import ("Collecting page data"), jadi build butuh
# URL yang valid walau tidak pernah dikoneksi. Placeholder hanya untuk perintah ini, tidak ikut ke
# image runner; nilai asli datang dari .env.production saat container jalan.
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" pnpm build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    TZ=Asia/Jakarta \
    PORT=38417 \
    HOSTNAME=0.0.0.0
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 38417
CMD ["node", "server.js"]
