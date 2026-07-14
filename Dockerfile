FROM node:22-bookworm-slim AS base

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

COPY package*.json ./

FROM base AS deps

RUN npm ci

FROM deps AS build

COPY . .

RUN npx prisma generate

RUN npm run build

FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server.js"]