# Folder Structure

```text
src/
  config/          environment and logger setup
  controllers/     HTTP request handlers
  database/        Prisma client
  domain/          shared business types and constants
  errors/          typed application errors
  eval/            multi-turn evaluation harness
  integrations/    OpenAI and Retell helpers
  middlewares/     request IDs, validation, error handling
  prompts/         versioned voice-agent prompt
  repositories/    database access layer
  routes/          Express route wiring
  services/        business workflows
  tools/           Retell tool schemas
  utils/           pure helpers
prisma/
  schema.prisma
  migrations/
  seed.ts
docs/
  design, prompt, API, deployment, testing, interview notes
postman/
  collection for manual API testing
tests/
  unit and integration tests
```

The separation keeps controller code thin, business behavior testable, and database access replaceable.

