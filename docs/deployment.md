# Deployment Guide

## Railway

1. Create a PostgreSQL database.
2. Create a web service from this repository.
3. Set the environment variables from `.env.example`.
4. Use Dockerfile build.
5. Start command:

```bash
npx prisma migrate deploy && node dist/src/server.js
```

6. Seed only the demo environment:

```bash
npm run db:seed
```

7. Configure Retell tool URLs to the Railway public URL.

## Render

Use `render.yaml` or create a Docker web service manually. Add a managed PostgreSQL database and set `DATABASE_URL`.

## Retell Live Setup

1. Create agent.
2. Paste prompt from `docs/prompt.md`.
3. Add tool endpoints from README.
4. Set language/voice settings for English and Hindi.
5. Enable interruption handling.
6. Assign a phone number.
7. Make a live test call and run the eval harness against production with:

```bash
EVAL_BASE_URL=https://your-api.example.com npm run eval
```

## Why Deployment Is Split

The backend is deployable from this repo. Live voice testing requires external account credentials and a phone number, which should not be committed.

