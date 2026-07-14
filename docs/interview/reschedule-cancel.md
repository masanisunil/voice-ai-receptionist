# Reschedule And Cancellation

## Purpose

Move or cancel existing appointments while preserving auditability and fee policy accuracy.

## Implementation

Reschedule marks the old appointment `RESCHEDULED` and creates a new `CONFIRMED` appointment in the same transaction. Cancellation marks the appointment `CANCELLED`. Fee language is controlled by `feeApplies`, not by prompt guesswork.

## Data Flow

existing appointment -> live new slot lookup -> transaction -> audit log -> voice confirmation

## Failure Cases

- New slot taken: reject and re-run availability.
- Appointment not confirmed: reject reschedule/cancel.
- Fee window not met: do not mention a fee.

## Alternatives

- Update the appointment in place: simpler but loses history.
- Always mention possible fees: safer legally but poor UX and assignment says not to.

## Interview Questions

Q: Why create a new appointment on reschedule?

A: It preserves the original booking for audit, PMS reconciliation, and recovery.

Q: How do you avoid incorrect fee mentions?

A: The service computes `feeApplies` from the appointment start time and configured policy window.

