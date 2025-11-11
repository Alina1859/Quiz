# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

ENV NODE_ENV=development

COPY package.json package-lock.json ./

RUN npm ci

FROM base AS builder

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run prisma:generate
RUN npm run build
RUN npm prune --production

FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/app/generated ./app/generated
COPY --from=builder --chown=node:node /app/next.config.ts ./next.config.ts

EXPOSE 3000

ENV PORT=3000

RUN mkdir -p /app/data && chown node:node /app/data

USER node

CMD ["npm", "run", "start"]

