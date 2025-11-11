# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/sqlite.db

WORKDIR /app

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

EXPOSE 3000

ENV PORT=3000

RUN mkdir -p /app/data && chown node:node /app/data

USER node

CMD ["npm", "run", "start"]

