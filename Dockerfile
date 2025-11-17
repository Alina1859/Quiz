# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/sqlite.db

WORKDIR /app

RUN sed -i 's|deb.debian.org|mirror.yandex.ru|g' /etc/apt/sources.list \
  && sed -i 's|security.debian.org|mirror.yandex.ru/debian-security|g' /etc/apt/sources.list

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl iproute2 iputils-ping \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --production

FROM base AS runner

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/sqlite.db

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/app/generated ./app/generated
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=node:node /app/scripts ./scripts

EXPOSE 3000

ENV PORT=3000

RUN mkdir -p /app/data && chown node:node /app/data
RUN chmod +x ./scripts/entrypoint.sh

USER node

CMD ["./scripts/entrypoint.sh"]

