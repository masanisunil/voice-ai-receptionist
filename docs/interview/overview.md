# Interview Notes Overview

## What Was Built

A TypeScript/Express backend for a Retell Voice AI receptionist. It handles appointment booking, rescheduling, cancellation, patient identity, shared phone numbers, dropped calls, missed callbacks, live availability, PMS write-back, and evaluation.

## Why The Design Works

The LLM is not the source of truth. It calls tools, and the backend enforces scheduling correctness. This makes the system resilient to hallucination, stale context, and concurrent callers.

## Key Files

- `src/services/SchedulingService.ts`
- `src/services/AvailabilityService.ts`
- `src/services/CallSessionService.ts`
- `src/services/VoiceToolService.ts`
- `prisma/schema.prisma`
- `src/eval/runHarness.ts`

## High-Value Interview Points

- Active appointment partial unique index prevents double booking.
- Availability is always re-computed from live data.
- Full name is mandatory before booking.
- Shared phone numbers are ambiguous until name is captured.
- PMS write-back is idempotent and failure-safe.
- The eval harness reports by language rather than blending.

