# API Documentation

Base URL locally: `http://localhost:8080`

## Health

`GET /health`

Response:

```json
{ "ok": true, "status": "healthy" }
```

`GET /ready` checks database connectivity.

## Search Availability

`POST /api/voice/tools/availability`

```json
{
  "from": "2026-07-14T00:00:00.000Z",
  "to": "2026-07-28T00:00:00.000Z",
  "specialty": "Urology",
  "branchId": "branch_padmanabhanagar",
  "timeOfDay": "afternoon",
  "aroundHour": 16,
  "aroundMinute": 30,
  "limit": 3
}
```

Response:

```json
{
  "ok": true,
  "userMessage": "I checked live availability. Available options: ...",
  "data": {
    "slots": [
      {
        "doctorId": "doc_venkatesh_urology",
        "branchId": "branch_padmanabhanagar",
        "startAt": "2026-07-17T08:30:00.000Z",
        "endAt": "2026-07-17T09:00:00.000Z"
      }
    ]
  }
}
```

## Identify Patient

`POST /api/voice/tools/identify`

```json
{
  "phoneE164": "+919999000002"
}
```

If multiple patients share a phone:

```json
{
  "ok": true,
  "data": {
    "status": "ambiguous",
    "needsNameCapture": true
  }
}
```

## Book Appointment

`POST /api/voice/tools/book`

```json
{
  "patientFullName": "Ananya Rao",
  "phoneE164": "+919999000001",
  "doctorId": "doc_venkatesh_urology",
  "branchId": "branch_padmanabhanagar",
  "startAt": "2026-07-17T08:30:00.000Z",
  "reason": "Follow-up",
  "language": "en",
  "callSessionId": "call_123",
  "idempotencyKey": "retell-call-123-slot-1"
}
```

The backend calculates the slot end time from live availability and rejects stale or conflicting slots.

## Reschedule

`POST /api/voice/tools/reschedule`

```json
{
  "appointmentId": "appt_existing_ananya",
  "newDoctorId": "doc_prasanna_pediatric_urology",
  "newBranchId": "branch_rajajinagar",
  "newStartAt": "2026-07-21T04:30:00.000Z",
  "idempotencyKey": "reschedule-123",
  "language": "mixed"
}
```

The response includes `feeApplies`; the agent only mentions fees when true.

## Cancel

`POST /api/voice/tools/cancel`

```json
{
  "appointmentId": "appt_existing_ananya",
  "reason": "Patient requested cancellation",
  "language": "en"
}
```

## Call Events

`POST /api/voice/tools/start-call` starts or resumes a call.

`POST /api/voice/tools/call-event`

```json
{
  "event": "call_dropped",
  "callSessionId": "call_123"
}
```

Events: `call_started`, `call_dropped`, `call_ended`, `outbound_no_answer`.

## Escalation

`POST /api/voice/tools/escalate`

```json
{
  "callSessionId": "call_123",
  "reason": "HUMAN_REQUEST",
  "summary": "Caller asked to speak to a person."
}
```

