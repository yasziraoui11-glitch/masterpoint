FROM node:20-bookworm-slim

# Prisma braucht OpenSSL auf glibc sauber verfügbar
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies zuerst für Layer-Caching
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Prisma Schema + Generate im Build (wichtig)
COPY prisma ./prisma
RUN npx prisma generate

# App-Code
COPY src ./src
COPY docs ./docs

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
