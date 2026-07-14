# System Design Document

## Goals

- Real datastore with durable call state.
- Live availability lookup for every scheduling question.
- Correct booking under concurrency.
- Fast, multilingual, natural voice flow.
- Recovery from dropped calls and missed callbacks.
- Re-runnable evaluation harness.

## Major Design Choices

### Retell for Voice

Why: Retell gives realistic voices, phone-number integration, barge-in handling, and tool calling without building a streaming media stack.

Alternative: Bolna or LiveKit.

Pros: faster live deployment path, less telephony infrastructure, strong voice UX.

Cons: vendor dependency and platform-specific tracing.

Tradeoff: use Retell for voice and keep business correctness in our backend.

### PostgreSQL + Prisma

Why: The assignment requires a real datastore, transactions, constraints, and clean setup.

Alternative: raw SQL only.

Pros: strong schema, migrations, typed client, good DX.

Cons: partial indexes require raw SQL migration.

Tradeoff: Prisma for most persistence, raw SQL for concurrency-critical partial unique index.

### Repository + Service Layers

Why: Voice tools, REST APIs, and eval harness all need the same scheduling behavior.

Alternative: controllers calling Prisma directly.

Pros: testable, replaceable, avoids duplicated booking logic.

Cons: more files.

Tradeoff: modest structure for production clarity.

### Mock PMS with Idempotency

Why: Reviewers can run the repo without Cliniko credentials while still seeing PMS failure behavior.

Alternative: no PMS integration until credentials exist.

Pros: complete flow, retry behavior, failure follow-up queue.

Cons: not a real Cliniko write.

Tradeoff: mock now, Cliniko adapter later with same payload contract.

## Data Flow

1. Caller speaks to Retell.
2. Retell calls backend tools.
3. Backend checks patient/call state.
4. Availability is computed from doctor windows minus active appointments.
5. Booking re-checks the slot inside a transaction.
6. Appointment is confirmed locally.
7. PMS write-back is attempted idempotently.
8. Failures create pending follow-up tasks.

## Failure Cases

- Slot taken during confirmation: partial unique index and conflict handler prevent double booking.
- PMS down: local appointment remains confirmed; follow-up is created.
- Dropped call: `CallSession` is marked dropped and resumed by phone within recovery window.
- Shared phone: patient is ambiguous until full name is captured.
- Human request: `PendingFollowup` is created; no fake live transfer claim.

