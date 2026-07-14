# Testing Guide

## Unit Tests

```bash
npm test
```

The unit tests cover:

- time overlap and buffer behavior
- fee-window logic
- name normalization
- tool schema validation

## Integration Tests

Start Postgres and seed:

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

Then run:

```bash
npm run eval
```

## Manual Postman Testing

Import `postman/VoiceAI.postman_collection.json`.

Recommended flow:

1. Health.
2. Identify returning patient.
3. Search earliest urology slot.
4. Book with idempotency key.
5. Repeat the booking request and confirm same appointment ID.
6. Simulate dropped call.
7. Start call again and confirm recovery type.

