# Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NODE_ENV` | no | `development`, `test`, or `production` |
| `PORT` | no | API port, default `8080` |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `APP_BASE_URL` | yes | Public API base URL for Retell tools |
| `CLINIC_TIMEZONE` | no | Clinic timezone, default `Asia/Kolkata` |
| `OPENAI_API_KEY` | live only | Required for GPT-4.1 live agent use |
| `OPENAI_MODEL` | no | Default `gpt-4.1` |
| `RETELL_API_KEY` | live only | Retell API key |
| `RETELL_WEBHOOK_SECRET` | live only | Webhook signature validation |
| `RETELL_AGENT_ID` | live only | Retell agent ID |
| `RETELL_PHONE_NUMBER` | live only | Callable test number |
| `PMS_MODE` | no | `mock` or `cliniko` |
| `PMS_BASE_URL` | yes | PMS adapter URL |
| `PMS_API_KEY` | live only | PMS credential |
| `PMS_RETRY_ATTEMPTS` | no | PMS retry count |
| `SAME_DAY_BUFFER_MINUTES` | no | Minimum lead time for same-day bookings |
| `RESCHEDULE_FEE_WINDOW_HOURS` | no | Fee policy window |
| `DROPPED_CALL_RECOVERY_MINUTES` | no | Recovery window |
| `MISSED_CALLBACK_RECOVERY_HOURS` | no | Callback context window |

