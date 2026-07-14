# Booking

## Purpose

Book the correct appointment quickly without stale availability or double booking.

## Implementation

`SchedulingService.book` requires caller full name, phone, doctor ID, branch ID, start time, and idempotency key. It resolves the exact live slot, starts a transaction, checks active conflicts with buffer time, creates the appointment, writes an audit log, then performs PMS sync.

## Architecture

Retell calls `/api/voice/tools/book`; `VoiceToolService` delegates to `SchedulingService`; repositories write through Prisma.

## Data Flow

availability result -> caller confirmation -> booking tool -> transaction -> appointment -> PMS write-back -> spoken confirmation

## Failure Cases

- Slot no longer available: return conflict and ask agent to re-run availability.
- Duplicate request: idempotency key returns existing appointment.
- PMS failure: local appointment remains confirmed and pending follow-up is created.

## Alternatives

- Hold slots before confirmation: useful at high volume, but adds expiry complexity.
- Book directly in PMS first: risky if PMS latency or failure blocks voice UX.

## Performance

One availability re-check plus one transaction. Indexed by doctor and start time.

## Interview Questions

Q: How do you prevent double booking?

A: Transactional conflict query plus a PostgreSQL partial unique index on active appointments.

Q: Why not trust the earlier availability result?

A: The caller may take time to decide and another caller can book the slot. The backend must re-check at write time.

