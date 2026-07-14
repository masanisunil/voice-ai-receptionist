# Database ER Diagram

```mermaid
erDiagram
  Clinic ||--o{ Branch : has
  Clinic ||--o{ Doctor : has
  Branch ||--o{ Doctor : hosts
  Branch ||--o{ AvailabilityWindow : defines
  Doctor ||--o{ AvailabilityWindow : works
  Patient ||--o{ Appointment : books
  Doctor ||--o{ Appointment : receives
  Branch ||--o{ Appointment : occurs_at
  CallSession ||--o{ ConversationMessage : records
  CallSession ||--o{ Appointment : creates
  OutboundCallback ||--o{ CallSession : resumes
  Patient ||--o{ OutboundCallback : receives
  Appointment ||--o{ PmsWriteback : syncs
  Patient ||--o{ PendingFollowup : needs
  CallSession ||--o{ PendingFollowup : creates
```

## Concurrency

The database prevents double booking with:

- live conflict query in the transaction
- PostgreSQL partial unique index on `Appointment(doctorId, startAt, endAt)` where status is `HELD` or `CONFIRMED`
- idempotency key on appointment writes

Cancelled and rescheduled appointments do not block the slot forever because the uniqueness rule applies only to active statuses.

