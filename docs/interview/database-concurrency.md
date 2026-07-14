# Database And Concurrency

## Purpose

Prevent race conditions and preserve audit trails.

## Implementation

The database stores patients, doctors, branches, appointments, availability windows, call sessions, conversation messages, audit logs, callbacks, PMS writebacks, idempotency records, and pending follow-ups.

## Race Prevention

- Idempotency keys prevent duplicate retries.
- Transactions re-check conflicts before writes.
- Partial unique index blocks simultaneous active bookings for the same doctor and slot.

## Alternatives

- Application-only locks: can fail across multiple instances.
- Redis locks: useful but another dependency.
- Serializing all booking writes: safe but limits throughput.

## Interview Questions

Q: Why not make all appointments unique by doctor/time?

A: Cancelled or rescheduled slots should be reusable, so uniqueness only applies to active statuses.

