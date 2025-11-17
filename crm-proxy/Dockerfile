FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV CRM_PROXY_PORT=4001

WORKDIR /app

COPY index.js ./

CMD ["node", "index.js"]

