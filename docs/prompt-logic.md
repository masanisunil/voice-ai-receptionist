# Prompt Logic

## System Prompt

The prompt makes the agent a scheduling receptionist, not a clinical assistant. It explicitly forbids inventing slots, prices, policies, doctors, and branches.

## Conversation Flow

1. Start or resume call.
2. Identify phone number.
3. Capture full name before booking.
4. Determine intent: book, reschedule, cancel, callback, or handoff.
5. Call live availability for every slot question.
6. Offer the smallest useful set of options.
7. Confirm exactly one slot.
8. Book/reschedule/cancel with idempotency.
9. Speak back the exact doctor, branch, date, and time returned by the tool.

## State Tracking

The agent tracks caller name, phone, patient candidates, branch, doctor, specialty, selected slot, appointment ID, and language mode. Durable state lives in `CallSession.state` so dropped calls can resume.

## Fallback

If a tool returns no availability, the agent asks for a different branch, doctor, or time range. If booking conflicts at write time, it says the slot was just taken and immediately re-runs live availability.

## Hallucination Prevention

The prompt says the latest tool result wins. The backend also prevents hallucinations from becoming writes because a booking requires doctor ID, branch ID, start time, patient name, phone, and idempotency key.

## Language Switching

No hardcoded translation table is used. The LLM handles Hindi and code-switching directly. The prompt constrains language drift so pure English or pure Hindi turns stay in that language.

## Interruption Handling

Retell handles barge-in at the voice layer. The prompt tells the agent to stop speaking, accept correction, update state, and continue from the corrected step.

