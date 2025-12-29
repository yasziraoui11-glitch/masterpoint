FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY docs ./docs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node","src/server.js"]
