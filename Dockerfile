FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci
RUN npx prisma generate

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]