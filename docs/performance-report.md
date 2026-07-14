# Performance Report

## Expected Local Baseline

On a seeded local database:

- Availability search should query windows and active appointments once, then generate slots in memory.
- Booking should use one transaction plus one PMS write-back request.
- Idempotent retries should return the existing appointment without duplicate writes.

## Indexes

- `Appointment(doctorId, startAt)`
- `Appointment(branchId, startAt)`
- `Patient(phoneE164)`
- `CallSession(phoneE164, status)`
- `AvailabilityWindow(doctorId, dayOfWeek)`
- partial unique active appointment slot index

## Scalability

For a single clinic, the current query shape is sufficient. For a large chain, add:

- per-branch availability cache with short TTL
- async PMS queue
- read replicas for reporting
- partitioned audit logs
- background job for stale follow-ups

