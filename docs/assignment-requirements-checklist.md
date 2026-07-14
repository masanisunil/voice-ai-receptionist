# Assignment Requirements Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Retell/Bolna choice justified | Done | README, architecture docs |
| English and Hindi with code-switching | Done | Prompt and eval scenarios |
| Real datastore | Done | PostgreSQL, Prisma schema |
| Booking | Done | `SchedulingService.book` |
| Rescheduling | Done | `SchedulingService.reschedule` |
| Cancellation | Done | `SchedulingService.cancel` |
| Conflict resolution | Done | live re-check, conflict errors |
| Double booking prevention | Done | transaction + partial unique index |
| Returning patient | Done | `PatientService.identify` |
| Shared phone disambiguation | Done | ambiguous identify flow |
| Missed callback recovery | Done | `CallSessionService.startOrResume` |
| Dropped call recovery | Done | dropped session recovery |
| Live availability lookup | Done | `AvailabilityService.search` |
| Cross branch search | Done | search without branch filter |
| Branch-specific search | Done | branch filters and eval |
| Mock PMS write-back | Done | `/api/pms/mock/appointments` |
| Idempotency | Done | appointment and PMS keys |
| Retry logic | Done | PMS retry helper |
| Evaluation harness | Done | `src/eval` |
| Per-language metrics | Done | eval summary by language |
| Latency breakdown | Done | docs and eval network timing |
| Turns to completion | Done | eval reports |
| README | Done | root README |
| Architecture diagram | Done | docs and diagrams |
| ER diagram | Done | docs and diagrams |
| Postman collection | Done | `postman/` |
| Docker setup | Done | Dockerfile, compose |
| Deployment guide | Done | docs/deployment.md |
| Interview notes | Done | docs/interview |
| Live phone number | Needs external setup | requires Retell account |
| Live deployed URL | Needs external setup | requires Railway/Render account |

